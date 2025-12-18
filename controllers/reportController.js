const { pool } = require('../config/db');

/**
 * Get Comprehensive Report Data
 * Query Params: range (daily, weekly, monthly, all), branchId
 */
const getReportData = async (req, res) => {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { range, branchId } = req.query;

    try {
        let dateFilter = '';
        if (range === 'daily') {
            dateFilter = "AND created_at >= CURRENT_DATE";
        } else if (range === 'weekly') {
            dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (range === 'monthly') {
            dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
        }

        let branchFilter = '';
        if (branchId && branchId !== 'all') {
            branchFilter = `AND branch_id = ${parseInt(branchId, 10)}`;
        }

        // 1. Summary Stats
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value
            FROM orders
            WHERE tenant_id = $1 ${dateFilter} ${branchFilter}
        `;
        const summaryResult = await pool.query(summaryQuery, [tenantId]);
        const summary = summaryResult.rows[0];

        // 2. Product Performance
        // We need to parse the JSONB 'items' array. In Postgres we can use jsonb_array_elements
        const productQuery = `
            WITH flat_items AS (
                SELECT jsonb_array_elements(items) as item
                FROM orders
                WHERE tenant_id = $1 ${dateFilter} ${branchFilter}
            )
            SELECT 
                item->>'name' as name,
                SUM((item->>'quantity')::int) as total_quantity,
                SUM(((item->>'price')::numeric) * ((item->>'quantity')::int)) as total_sales
            FROM flat_items
            GROUP BY name
            ORDER BY total_sales DESC
            LIMIT 10
        `;
        const productResult = await pool.query(productQuery, [tenantId]);

        // 3. Category Performance
        const categoryQuery = `
            WITH flat_items AS (
                SELECT jsonb_array_elements(items) as item
                FROM orders
                WHERE tenant_id = $1 ${dateFilter} ${branchFilter}
            )
            SELECT 
                p.category_id,
                c.name as category_name,
                SUM(((item->>'price')::numeric) * ((item->>'quantity')::int)) as total_sales
            FROM flat_items
            JOIN products p ON p.name = (item->>'name') AND p.tenant_id = $1
            JOIN categories c ON c.id = p.category_id
            GROUP BY p.category_id, c.name
            ORDER BY total_sales DESC
        `;
        const categoryResult = await pool.query(categoryQuery, [tenantId]);

        // 4. Detailed Transactions
        const transactionsQuery = `
            SELECT 
                o.id,
                o.table_no,
                b.name as branch_name,
                o.total_amount,
                o.status,
                o.created_at
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.tenant_id = $1 ${dateFilter} ${branchFilter}
            ORDER BY o.created_at DESC
            LIMIT 100
        `;
        const transactionsResult = await pool.query(transactionsQuery, [tenantId]);

        res.json({
            summary: {
                total_orders: parseInt(summary.total_orders) || 0,
                total_revenue: parseFloat(summary.total_revenue) || 0,
                avg_order_value: parseFloat(summary.avg_order_value) || 0
            },
            products: productResult.rows,
            categories: categoryResult.rows,
            transactions: transactionsResult.rows
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getReportData
};
