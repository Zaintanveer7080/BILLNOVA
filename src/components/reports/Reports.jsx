import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import StockSummary from '@/components/reports/StockSummary';
import StockValueReport from '@/components/reports/StockValueReport';
import BusinessAssets from '@/components/reports/BusinessAssets';
import InvoiceProfit from '@/components/reports/InvoiceProfit';
import ClientProfit from '@/components/reports/ClientProfit';
import BankStatement from '@/components/reports/BankStatement';
import CreditManagement from '@/components/reports/CreditManagement';
import DailyBook from '@/components/reports/DailyBook';
import OnlineOrdersReport from '@/components/reports/OnlineOrdersReport';
import ProfitSummary from '@/components/reports/ProfitSummary';

const reportsList = [
  { value: 'daily-book', label: 'Daily Book', component: DailyBook },
  { value: 'online-orders', label: 'Online Orders', component: OnlineOrdersReport },
  { value: 'invoice-profit', label: 'Invoice Profit', component: InvoiceProfit },
  { value: 'client-wise-profit', label: 'Client-wise Profit', component: ClientProfit },
  { value: 'profit-summary', label: 'Profit Summary', component: ProfitSummary },
  { value: 'stock-summary', label: 'Stock Summary', component: StockSummary },
  { value: 'stock-value', label: 'Stock Value', component: StockValueReport },
  { value: 'business-assets', label: 'Business Assets', component: BusinessAssets },
  { value: 'bank-statement', label: 'Bank Statement', component: BankStatement },
  { value: 'credit-management', label: 'Credit Management', component: CreditManagement },
];

const LAST_TAB_KEY = 'reports_last_active_tab';

function Reports() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromURL = () => new URLSearchParams(location.search).get('tab');
  const getTabFromLocalStorage = () => localStorage.getItem(LAST_TAB_KEY);

  const [activeTab, setActiveTab] = useState(getTabFromURL() || getTabFromLocalStorage() || 'daily-book');

  useEffect(() => {
    const tabFromURL = getTabFromURL();
    if (tabFromURL && tabFromURL !== activeTab) {
      setActiveTab(tabFromURL);
    }
  }, [location.search]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    localStorage.setItem(LAST_TAB_KEY, value);
    navigate(`${location.pathname}?tab=${value}`);
  };

  const ActiveComponent = reportsList.find(r => r.value === activeTab)?.component || DailyBook;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Business Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gain insights into your business performance with comprehensive reports.
        </p>
      </div>

      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 -mx-8 px-8 py-2 border-b">
        <div className="relative overflow-x-auto no-scrollbar">
          <nav className="flex items-center space-x-2">
            {reportsList.map(report => (
              <button
                key={report.value}
                onClick={() => handleTabChange(report.value)}
                className={cn(
                  'relative whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeTab === report.value ? 'text-primary' : 'text-muted-foreground hover:text-primary/80'
                )}
                aria-selected={activeTab === report.value}
              >
                {report.label}
                {activeTab === report.value && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    layoutId="underline"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ActiveComponent />
      </motion.div>
    </div>
  );
}

export default Reports;