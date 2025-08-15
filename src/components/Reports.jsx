import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Package, BarChart2, Users, Landmark, FileWarning } from 'lucide-react';
import StockSummary from '@/components/reports/StockSummary';
import BusinessAssets from '@/components/reports/BusinessAssets';
import InvoiceProfit from '@/components/reports/InvoiceProfit';
import ClientProfit from '@/components/reports/ClientProfit';
import BankStatement from '@/components/reports/BankStatement';
import CreditManagement from '@/components/reports/CreditManagement';

const reportsConfig = [
  { value: 'stock', label: 'Stock Summary', icon: Package, component: StockSummary },
  { value: 'assets', label: 'Business Assets', icon: BarChart2, component: BusinessAssets },
  { value: 'invoiceProfit', label: 'Invoice Profit', icon: FileText, component: InvoiceProfit },
  { value: 'clientProfit', label: 'Client-wise Profit', icon: Users, component: ClientProfit },
  { value: 'bankStatement', label: 'Bank Statement', icon: Landmark, component: BankStatement },
  { value: 'credit', label: 'Credit Management', icon: FileWarning, component: CreditManagement },
];

function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Business Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gain insights into your business performance with comprehensive reports.
        </p>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {reportsConfig.map(report => (
            <TabsTrigger key={report.value} value={report.value}>
              <report.icon className="h-4 w-4 mr-2" />
              {report.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {reportsConfig.map(report => (
          <TabsContent key={report.value} value={report.value}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <report.component />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default Reports;