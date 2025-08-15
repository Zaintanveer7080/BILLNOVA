import React, { useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar.jsx';
import Dashboard from '@/components/Dashboard.jsx';
import { Purchase } from '@/components/Purchase.jsx';
import Sales from '@/components/Sales.jsx';
import Expenses from '@/components/Expenses.jsx';
import Suppliers from '@/components/Suppliers.jsx';
import Customers from '@/components/Customers.jsx';
import Items from '@/components/Items.jsx';
import Reports from '@/components/reports/Reports.jsx';
import Payments from '@/components/Payments.jsx';
import CashAndBank from '@/components/CashAndBank.jsx';
import OnlineOrders from '@/components/OnlineOrders.jsx';
import Settings from '@/components/Settings.jsx';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider, useData } from '@/contexts/DataContext.jsx';
import { PDFViewport } from '@/components/pdf/PDFViewport';
import TransactionDetailView from '@/components/TransactionDetailView.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Auth from '@/components/auth/Auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useIdleTimer } from 'react-idle-timer';
import { useToast } from './components/ui/use-toast';
import { Button } from './components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const { data, transactionToView, setTransactionToView, loading: dataLoading, isDataInitialized } = useData();
  const { signOut } = useAuth();
  const { toast, dismiss } = useToast();
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
  const idleToastId = useRef(null);
  const companyName = data?.settings?.companyName || 'ERP System';
  
  const onIdle = () => {
    signOut('You have been logged out due to inactivity.');
  };

  const onActive = () => {
     if (idleToastId.current) {
      dismiss(idleToastId.current);
      idleToastId.current = null;
    }
    setIsIdleModalOpen(false);
  };

  const onPrompt = () => {
    setIsIdleModalOpen(true);
    const { id } = toast({
      title: "Are you still there?",
      description: "You will be logged out in 30 seconds due to inactivity.",
      duration: 30000,
      variant: 'warning',
      action: (
        <Button onClick={() => getRemainingTime()}>Stay Logged In</Button>
      ),
    });
    idleToastId.current = id;
  };

  const { getRemainingTime, reset } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    timeout: 1000 * 60 * 10, // 10 minutes
    promptBeforeIdle: 1000 * 30, // 30 seconds
    throttle: 500,
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
      'visibilitychange'
    ],
    startOnMount: true,
  });

  const handleStayLoggedIn = () => {
    reset();
    setIsIdleModalOpen(false);
    if (idleToastId.current) {
      dismiss(idleToastId.current);
      idleToastId.current = null;
    }
  };

  const renderActiveModule = useCallback(() => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard setActiveModule={setActiveModule} />;
      case 'purchase':
        return <Purchase />;
      case 'sales':
        return <Sales />;
      case 'onlineOrders':
        return <OnlineOrders />;
      case 'expenses':
        return <Expenses />;
      case 'suppliers':
        return <Suppliers />;
      case 'customers':
        return <Customers />;
      case 'items':
        return <Items />;
      case 'reports':
        return <Reports />;
      case 'payments':
        return <Payments />;
      case 'cashAndBank':
        return <CashAndBank />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveModule={setActiveModule} />;
    }
  }, [activeModule]);

  if (dataLoading || !isDataInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">Loading Your Business Data...</p>
          {!isDataInitialized && <p className="text-sm text-muted-foreground">Performing first-time setup...</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{companyName} - Inventory, Billing & Reporting</title>
        <meta name="description" content={`Complete ERP solution for inventory management, billing, and business reporting for ${companyName}`} />
        <meta property="og:title" content={`${companyName} - Inventory, Billing & Reporting`} />
        <meta property="og:description" content={`Complete ERP solution for inventory management, billing, and business reporting for ${companyName}`} />
      </Helmet>
      
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-8 h-full"
            >
              {renderActiveModule()}
            </motion.div>
          </div>
        </main>
        
        <Toaster />
        <PDFViewport />
        {transactionToView && (
          <TransactionDetailView 
            transaction={transactionToView.transaction}
            type={transactionToView.type}
            onClose={() => setTransactionToView(null)}
          />
        )}
      </div>

       <AlertDialog open={isIdleModalOpen} onOpenChange={setIsIdleModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-yellow-500" />Are you still there?</AlertDialogTitle>
            <AlertDialogDescription>
              For your security, you will be logged out soon due to inactivity.
              Click "Stay Logged In" to continue your session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onIdle()}>Logout</AlertDialogCancel>
            <AlertDialogAction onClick={handleStayLoggedIn}>Stay Logged In</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


function App() {
  const { session, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <DataProvider>
      {session ? <AppContent /> : <Auth />}
    </DataProvider>
  );
}

export default App;