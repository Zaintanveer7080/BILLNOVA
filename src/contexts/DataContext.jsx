import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as bcrypt from 'bcryptjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { useInvoiceLogic } from '@/hooks/useInvoiceLogic';
import { useProfitLogic } from '@/hooks/useProfitLogic';
import { useStockLogic } from '@/hooks/useStockLogic';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const getInitialState = () => ({
  customers: [],
  suppliers: [],
  items: [],
  purchases: [],
  sales: [],
  expenses: [],
  banks: [],
  cashInHand: 0,
  cashTransactions: [],
  payments: [],
  onlineOrders: [],
  settings: {
    currency: 'RS',
    passcode: '',
    companyName: 'ERP Pro',
    companyLogo: ''
  }
});

const PasscodeModal = ({ isOpen, onVerified, onClose, requirePasscode }) => {
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const { data } = useData();
  const { toast } = useToast();

  const handleVerify = (e) => {
    e.preventDefault();
    if (!requirePasscode) {
        onVerified();
        return;
    }
    if (data.settings.passcode && bcrypt.compareSync(enteredPasscode, data.settings.passcode)) {
      toast({ title: "Success", description: "Action authorized.", variant: 'success' });
      onVerified();
    } else {
      toast({ title: "Error", description: "Incorrect passcode.", variant: "destructive" });
    }
    setEnteredPasscode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Passcode to Authorize</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleVerify} className="py-4 space-y-4">
          <div>
            <Label htmlFor="passcodeInput">Transaction Passcode</Label>
            <Input
              id="passcodeInput"
              type="password"
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Authorize</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(getInitialState);
  const [loading, setLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcodeCallback, setPasscodeCallback] = useState(null);
  const [passcodeContext, setPasscodeContext] = useState({ isEdit: false });
  const [transactionToView, setTransactionToView] = useState(null);
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const loadDataFromSupabase = useCallback(async () => {
    if (authLoading) return;
    if (!session) {
      setData(getInitialState());
      setLoading(false);
      setIsDataInitialized(true);
      return;
    }
    
    setLoading(true);
    const { data: appData, error } = await supabase
      .from('app_data')
      .select('data')
      .maybeSingle();

    if (error) {
        console.error('Error loading data from Supabase:', error);
        toast({ title: "Error", description: `Failed to load cloud data: ${error.message}`, variant: "destructive" });
        setData(getInitialState());
    } else if (appData) {
        const initialState = getInitialState();
        const loadedData = {
          ...initialState,
          ...appData.data,
          settings: {
            ...initialState.settings,
            ...(appData.data.settings || {}),
          },
        };
        setData(loadedData);
    } else {
        setData(getInitialState());
    }
    setLoading(false);
    setIsDataInitialized(true);
  }, [session, authLoading, toast]);
  
  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  const updateData = useCallback(async (newData) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    
    if (session) {
        const { error } = await supabase.rpc('upsert_app_data', {
            p_data: updatedData
        });
            
        if (error) {
            console.error('Error saving data to Supabase:', error);
            toast({ title: "Error", description: `Failed to save data to the cloud: ${error.message}`, variant: "destructive" });
        }
    }
  }, [data, session, toast]);

  const requestPasscode = useCallback((onSuccess, { isEdit = false } = {}) => {
      const requiresPasscode = isEdit && data.settings?.passcode;
      if (requiresPasscode) {
        setPasscodeContext({ isEdit });
        setPasscodeCallback(() => onSuccess);
        setIsPasscodeModalOpen(true);
      } else {
        onSuccess();
      }
  }, [data.settings?.passcode]);

  const requirePasscodeForAction = useCallback((action) => {
    requestPasscode(action, { isEdit: true });
  }, [requestPasscode]);


  const onPasscodeVerified = () => {
    if (passcodeCallback) passcodeCallback();
    setIsPasscodeModalOpen(false);
    setPasscodeCallback(null);
    setPasscodeContext({ isEdit: false });
  };

  const onPasscodeCancel = () => {
    setIsPasscodeModalOpen(false);
    setPasscodeCallback(null);
    setPasscodeContext({ isEdit: false });
  };

  const { getInvoiceStatus, recalculateAndSyncInvoices } = useInvoiceLogic(data);
  const { getProfitOfSale } = useProfitLogic(data);
  const { getStockValue } = useStockLogic(data);

  const value = {
    data,
    updateData,
    loading,
    isDataInitialized,
    requestPasscode,
    requirePasscodeForAction,
    transactionToView,
    setTransactionToView,
    getInvoiceStatus,
    recalculateAndSyncInvoices,
    getProfitOfSale,
    getStockValue,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      {isPasscodeModalOpen && (
         <PasscodeModal
            isOpen={isPasscodeModalOpen}
            onVerified={onPasscodeVerified}
            onClose={onPasscodeCancel}
            requirePasscode={passcodeContext.isEdit}
         />
      )}
    </DataContext.Provider>
  );
};