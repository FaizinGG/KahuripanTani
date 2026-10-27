import axios from '../lib/axios';

const API_URL = '/api';

export async function fetchDashboardData(token) {
  const [salesResponse, productsResponse, lowStockResponse, receivablesResponse] = await Promise.all([
    axios.get(`${API_URL}/sales?per_page=5`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get(`${API_URL}/products?per_page=1`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get(`${API_URL}/stocks/low-stock`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get(`${API_URL}/receivables?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const priceTypeStats = {
    retail: { salesCount: 0, omzet: 0 },
    reseller: { salesCount: 0, omzet: 0 },
    reseller_besar: { salesCount: 0, omzet: 0 },
    petugas: { salesCount: 0, omzet: 0 },
    sales: { salesCount: 0, omzet: 0 },
  };
  let todayRevenue = 0;
  let monthRevenue = 0;
  let todayProfit = 0;
  let monthSalesCount = 0;
  let activeReceivables = 0;
  let totalReceivableBalance = 0;

  salesResponse.data.data.forEach((sale) => {
    const saleDate = new Date(sale.created_at);
    if (saleDate.toDateString() === today.toDateString() && sale.status === 'completed') {
      todayRevenue += sale.total_amount || 0;
      monthSalesCount += 1;
      const profit = (sale.items || []).reduce((sum, item) => sum + ((item.unit_price || 0) - (item.cost_price || 0)) * (item.quantity || 0), 0);
      todayProfit += profit;
    }
    (sale.items || []).forEach((item) => {
      const priceType = item.price_type || 'retail';
      if (priceTypeStats[priceType]) {
        priceTypeStats[priceType].salesCount += 1;
        priceTypeStats[priceType].omzet += (item.selling_price || item.unit_price || 0) * (item.quantity || 0);
      }
    });
    if (saleDate >= startOfMonth && sale.status === 'completed') {
      monthRevenue += sale.total_amount || 0;
    }
  });

  (receivablesResponse.data.data || []).forEach((receivable) => {
    if (['pending', 'partial'].includes(receivable.status)) {
      activeReceivables += 1;
      totalReceivableBalance += Math.max(0, (receivable.amount || 0) - (receivable.paid_amount || 0));
    }
  });

  return {
    stats: {
      todayRevenue,
      monthRevenue,
      todayProfit,
      monthSalesCount,
      activeReceivables,
      totalReceivableBalance,
      totalProducts: productsResponse.data.pagination?.total || productsResponse.data.data?.length || 0,
      lowStockProducts: lowStockResponse.data.length,
      priceTypeStats,
    },
    recentSales: salesResponse.data.data,
  };
}
