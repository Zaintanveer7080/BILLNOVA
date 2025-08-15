import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatInTimeZone } from 'date-fns-tz';
import { formatMoney, safeSum } from '@/lib/money';

const Dashboard = ({ setActiveModule }) => {
  const { data, getStockValue } = useData();
  const { sales, purchases, customers, items, suppliers } = data;
  const currencySymbol = data.settings?.currency || 'RS';

  const stats = useMemo(() => {
    const totalSales = safeSum(...(sales || []).map(s => s.totalCost));
    const totalPurchases = safeSum(...(purchases || []).map(p => p.totalCost));
    const totalCustomers = (customers || []).length;
    return { totalSales, totalPurchases, totalCustomers };
  }, [sales, purchases, customers]);

  const stockValue = useMemo(() => getStockValue(), [getStockValue]);

  const recentActivity = useMemo(() => {
    const recentSales = (sales || []).slice(-3).map(s => ({ ...s, type: 'Sale', party: (customers.find(c => c.id === s.customerId)?.name || 'N/A') }));
    const recentPurchases = (purchases || []).slice(-3).map(p => ({ ...p, type: 'Purchase', party: (suppliers.find(sup => sup.id === p.supplierId)?.name || 'N/A') }));
    return [...recentSales, ...recentPurchases]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [sales, purchases, customers, suppliers]);
  
  const lowStockItems = useMemo(() => {
    return (items || []).filter(item => {
        const openingStock = item.openingStock || 0;
        const totalPurchased = (purchases || []).reduce((sum, p) => sum + (p.items.find(pi => pi.itemId === item.id)?.quantity || 0), 0);
        const totalSold = (sales || []).reduce((sum, s) => sum + (s.items.find(si => si.itemId === item.id)?.quantity || 0), 0);
        return (openingStock + totalPurchased - totalSold) <= 5;
    }).slice(0, 5);
  }, [items, purchases, sales]);

  const salesDataForChart = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();
    
    return last7Days.map(date => {
      const dateString = date.toLocaleDateString('en-CA');
      const dailySales = (sales || [])
        .filter(s => new Date(s.date).toLocaleDateString('en-CA') === dateString)
        .reduce((sum, s) => safeSum(sum, s.totalCost), 0);
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dailySales,
      };
    });
  }, [sales]);

  const kpiCards = [
    { title: 'Total Revenue', value: formatMoney(stats.totalSales, currencySymbol), icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    { title: 'Total Purchases', value: formatMoney(stats.totalPurchases, currencySymbol), icon: ShoppingCart, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
    { title: 'Stock Value (at Cost)', value: formatMoney(stockValue, currencySymbol), icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's a summary of your business.</p>
        </div>
        <div className="space-x-2">
           <Button onClick={() => setActiveModule('sales')}>New Sale</Button>
           <Button variant="outline" onClick={() => setActiveModule('purchase')}>New Purchase</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Sales Overview (Last 7 Days)</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesDataForChart}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol} ${value/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    cursor={{ fill: 'hsla(var(--muted))' }}
                    formatter={(value) => formatMoney(value, currencySymbol)}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4 h-80 overflow-y-auto no-scrollbar">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center">
                  <div className={`p-2 rounded-full mr-4 ${activity.type === 'Sale' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                    {activity.type === 'Sale' ? <ArrowUpRight className="h-5 w-5 text-green-500" /> : <ArrowDownRight className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.type} #{activity.saleNumber || activity.purchaseNumber}</p>
                    <p className="text-sm text-muted-foreground">{activity.party}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatMoney(activity.totalCost, currencySymbol)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader><CardTitle className="flex items-center text-orange-500"><AlertTriangle className="mr-2 h-5 w-5"/>Low Stock Items</CardTitle></CardHeader>
          <CardContent>
              {lowStockItems.length === 0 ? <p className="text-muted-foreground">No low stock items. Good job!</p> :
              <ul className="space-y-2">
                  {lowStockItems.map(item => (<li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted"><span>{item.name} ({item.sku})</span><span className="font-bold">Only {((items || []).find(i => i.id === item.id).openingStock || 0) + ((purchases || []).reduce((sum, p) => sum + (p.items.find(pi => pi.itemId === item.id)?.quantity || 0), 0)) - ((sales || []).reduce((sum, s) => sum + (s.items.find(si => si.itemId === item.id)?.quantity || 0), 0))} left</span></li>))}
              </ul>
              }
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;