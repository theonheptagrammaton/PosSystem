const { pool } = require('../config/db');

/**
 * Get Comprehensive Report Data
 * Query Params: range (daily, weekly, monthly, all), branchId
 */
const getReportData = async (req, res) => {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { range, branchId } = req.query;

    try {
        const TZ = 'Europe/Istanbul';
        
        // Use o. prefix for all filters to avoid ambiguity in joins
        let queryParams = [tenantId];
        let filterSql = 'WHERE o.tenant_id = $1';

        // 1. Date Filtering (Robust casting)
        if (range === 'daily') {
            filterSql += ` AND (o.created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`;
        } else if (range === 'weekly') {
            filterSql += ` AND (o.created_at AT TIME ZONE '${TZ}')::date >= (now() AT TIME ZONE '${TZ}')::date - INTERVAL '7 days'`;
        } else if (range === 'monthly') {
            filterSql += ` AND (o.created_at AT TIME ZONE '${TZ}')::date >= (now() AT TIME ZONE '${TZ}')::date - INTERVAL '30 days'`;
        }

        // 2. Branch Filtering
        if (branchId && branchId !== 'all') {
            const bId = parseInt(branchId, 10);
            if (!isNaN(bId)) {
                queryParams.push(bId);
                filterSql += ` AND o.branch_id = $${queryParams.length}`;
            }
        }

        // 3. Summary Stats
        const summaryQuery = `
            SELECT 
                COUNT(*)::int as total_orders,
                COALESCE(SUM(total_amount), 0)::numeric as total_revenue,
                COALESCE(AVG(total_amount), 0)::numeric as avg_order_value
            FROM orders o
            ${filterSql}
        `;
        const summaryResult = await pool.query(summaryQuery, queryParams);
        const summary = summaryResult.rows[0];

        // 4. Product Performance
        const productQuery = `
            WITH flat_items AS (
                SELECT jsonb_array_elements(items) as item
                FROM orders o
                ${filterSql}
            )
            SELECT 
                item->>'name' as name,
                SUM((item->>'quantity')::int)::int as total_quantity,
                SUM(((item->>'price')::numeric) * ((item->>'quantity')::int))::numeric as total_sales
            FROM flat_items
            GROUP BY name
            ORDER BY total_sales DESC
            LIMIT 10
        `;
        const productResult = await pool.query(productQuery, queryParams);

        // 5. Category Performance
        // Using LEFT JOIN to avoid losing data if some items don't have product IDs (legacy/manual entries)
        const categoryQuery = `
            WITH flat_items AS (
                SELECT jsonb_array_elements(items) as item
                FROM orders o
                ${filterSql}
            )
            SELECT 
                COALESCE(c.id, 0) as category_id,
                COALESCE(c.name, 'Tanımsız') as category_name,
                SUM(((item->>'price')::numeric) * ((item->>'quantity')::int))::numeric as total_sales
            FROM flat_items
            LEFT JOIN products p ON p.id = (item->>'id')::int
            LEFT JOIN categories c ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY total_sales DESC
        `;
        const categoryResult = await pool.query(categoryQuery, queryParams);

        // 6. Detailed Transactions
        const transactionsQuery = `
            SELECT 
                o.id,
                o.table_no,
                b.name as branch_name,
                o.total_amount::numeric,
                o.status,
                o.created_at
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            ${filterSql}
            ORDER BY o.created_at DESC
            LIMIT 100
        `;
        const transactionsResult = await pool.query(transactionsQuery, queryParams);

        res.json({
            summary: {
                total_orders: summary.total_orders,
                total_revenue: parseFloat(summary.total_revenue),
                avg_order_value: parseFloat(summary.avg_order_value)
            },
            products: productResult.rows,
            categories: categoryResult.rows,
            transactions: transactionsResult.rows
        });

    } catch (error) {
        console.error('CRITICAL REPORT ERROR:', error);
        res.status(500).json({ 
            error: 'Rapor oluşturulurken bir hata oluştu.', 
            details: error.message 
        });
    }
};

module.exports = {
    getReportData
};
