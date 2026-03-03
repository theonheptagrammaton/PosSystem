const { pool } = require('../config/db');

// --- Global Stats ---
const getGlobalStats = async (req, res) => {
  try {
    const stats = {};

    // 1. Total Tenants
    const tenantRes = await pool.query('SELECT COUNT(*) FROM tenants');
    stats.total_tenants = parseInt(tenantRes.rows[0].count);

    // 2. Total Revenue (Aggregated from all orders)
    const revRes = await pool.query("SELECT SUM(total_amount) FROM orders WHERE status = 'COMPLETED' OR status = 'TAMAMLANDI'");
    stats.total_revenue = parseFloat(revRes.rows[0].sum || 0);

    // 3. Total Orders
    const orderRes = await pool.query('SELECT COUNT(*) FROM orders');
    stats.total_orders = parseInt(orderRes.rows[0].count);

    // 4. Active Sessions (socket rooms roughly, but here we can just count users or branches)
    const userRes = await pool.query('SELECT COUNT(*) FROM users');
    stats.total_users = parseInt(userRes.rows[0].count);

    // 5. Chart Data (Last 30 Days Revenue & Orders)
    const chartRes = await pool.query(`
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            SUM(total_amount) as revenue,
            COUNT(*) as orders
        FROM orders 
        WHERE (status = 'COMPLETED' OR status = 'TAMAMLANDI')
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
    `);
    
    stats.chart_data = chartRes.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
        orders: parseInt(row.orders)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Tenant Management ---
const getAllTenants = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id, 
        t.company_name, 
        t.domain, 
        t.is_active, 
        t.created_at,
        u.username as admin_username,
        u.password as admin_password,
        u.id as admin_user_id
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

const createTenant = async (req, res) => {
  const { company_name, domain, admin_username, admin_password } = req.body;
  
  if (!company_name || !admin_username || !admin_password) {
      return res.status(400).json({ error: 'Company Name, Username and Password are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create Tenant
    const tenantRes = await client.query(
      'INSERT INTO tenants (company_name, domain) VALUES ($1, $2) RETURNING *',
      [company_name, domain || null]
    );
    const newTenant = tenantRes.rows[0];

    // 2. Create Admin User for Tenant
    // Note: In production you should hash the password! storing plain for now as per system behavior
    const userRes = await client.query(
        `INSERT INTO users (tenant_id, username, password, role, full_name, is_onboarded) 
         VALUES ($1, $2, $3, 'admin', 'Mekan Sahibi', true) RETURNING *`,
        [newTenant.id, admin_username, admin_password]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
        tenant: newTenant, 
        admin_user: userRes.rows[0]
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Sistem Hatası: ' + error.message });
  } finally {
      if (client) client.release();
  }
};

const updateTenantAdmin = async (req, res) => {
    const { id } = req.params; // tenant_id
    const { admin_username, admin_password, company_name, domain } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Tenant Info
        await client.query(
            'UPDATE tenants SET company_name = $1, domain = $2 WHERE id = $3',
            [company_name, domain, id]
        );

        // 2. Update Admin User Info (password_version artırılarak mevcut oturumlar geçersiz kılınır)
        const userRes = await client.query(
            'UPDATE users SET username = $1, password = $2, password_version = COALESCE(password_version, 1) + 1 WHERE tenant_id = $3 AND role = $4 RETURNING id',
            [admin_username, admin_password, id, 'admin']
        );

        if (userRes.rows.length === 0) {
            // If no admin user exists, maybe create one? 
            // But for now let's just assume it exists if it was created via createTenant
            throw new Error('İşletme yöneticisi bulunamadı.');
        }

        await client.query('COMMIT');
        res.json({ message: 'İşletme ve yönetici bilgileri güncellendi' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating tenant admin:', error);
        res.status(500).json({ error: 'Güncelleme hatası: ' + error.message });
    } finally {
        client.release();
    }
};

const deleteTenant = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Advanced Analytics & Tactics ---
const getSalesAnalytics = async (req, res) => {
    try {
        // 1. Hourly Sales Distribution (00-23)
        const hourlyQuery = `
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as order_count,
                SUM(total_amount) as total_revenue
            FROM orders
            WHERE (status = 'COMPLETED' OR status = 'TAMAMLANDI')
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour ASC
        `;
        const hourlyRes = await pool.query(hourlyQuery);
        
        // Fill missing hours with 0
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
            const row = hourlyRes.rows.find(r => parseInt(r.hour) === i);
            return {
                hour: i,
                order_count: row ? parseInt(row.order_count) : 0,
                revenue: row ? parseFloat(row.total_revenue) : 0
            };
        });

        // 2. Product Performance
        // Extract product name from JSONB items array
        // Note: This is expensive on large datasets, but fine for God Mode implementation phase
        const productQuery = `
            SELECT 
                item->>'name' as name,
                SUM((item->>'quantity')::int) as quantity,
                SUM((item->>'price')::decimal * (item->>'quantity')::int) as revenue
            FROM orders, jsonb_array_elements(items) as item
            WHERE (status = 'COMPLETED' OR status = 'TAMAMLANDI')
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY item->>'name'
            ORDER BY revenue DESC
        `;
        const productRes = await pool.query(productQuery);
        const products = productRes.rows.map(row => ({
            name: row.name,
            quantity: parseInt(row.quantity),
            revenue: parseFloat(row.revenue)
        }));

        // 3. Heuristic Tactic Generation
        const tactics = [];

        // Analysis: Peak Hours
        const sortedHours = [...hourlyData].sort((a, b) => b.revenue - a.revenue);
        const peakHour = sortedHours[0];
        const lowHour = sortedHours[sortedHours.length - 1];

        if (peakHour && peakHour.revenue > 0) {
            tactics.push({
                type: 'PEAK_HOUR',
                title: 'Yoğun Saat Stratejisi',
                message: `En yoğun satış saatiniz ${peakHour.hour}:00 - ${peakHour.hour + 1}:00 arası. Bu saat aralığında popüler ürünlerin fiyatlarında %5-10 artış veya "Hızlı Menü" paketleri oluşturarak ciroyu artırabilirsiniz.`,
                icon: 'TrendingUp'
            });
        }

        // Analysis: Low Hours
        if (lowHour) {
            tactics.push({
                type: 'LOW_HOUR',
                title: 'Ölü Saatleri Canlandırma',
                message: `Saat ${lowHour.hour}:00 civarında satışlar en düşük seviyede. Bu saatler için "Happy Hour" (%20 indirim) veya "Kahve yanında Tatlı İkramı" gibi kampanyalar düzenleyin.`,
                icon: 'Clock'
            });
        }

        // Analysis: Top Product Pushing
        if (products.length > 0) {
            const topProduct = products[0];
            tactics.push({
                type: 'TOP_PRODUCT',
                title: 'Yıldız Ürün Fırsatı',
                message: `En çok satan ürününüz "${topProduct.name}". Bu ürünü menüde daha görünür yapın veya yanında yüksek kar marjlı bir içecek önerisi ekleyin.`,
                icon: 'Star'
            });
        }

        // Analysis: Underperforming but High Revenue candidates (Logic: sold moderate amount but distinct)
        // Simple logic: Bottom 25% of products
        if (products.length > 5) {
            const worseProduct = products[products.length - 1];
            tactics.push({
                type: 'DEAD_STOCK',
                title: 'Menü Optimizasyonu',
                message: `"${worseProduct.name}" ürünü son 30 günde çok az ilgi gördü. Reçetesini değiştirmeyi veya menüden kaldırmayı düşünün.`,
                icon: 'AlertTriangle'
            });
        }

        res.json({
            hourly_data: hourlyData,
            product_performance: products,
            tactics: tactics
        });

    } catch (error) {
        console.error('Error in sales analytics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
  getGlobalStats,
  getAllTenants,
  createTenant,
  deleteTenant,
  getSalesAnalytics,
  updateTenantAdmin
};
