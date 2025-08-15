import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { differenceInDays, parseISO } from 'date-fns';
import { generatePdf } from '@/components/pdf/PdfGenerator';
import CreditReportTemplate from '@/components/pdf/CreditReportTemplate';
import ReportWrapper from './ReportWrapper';
import FilterToolbar from '../FilterToolbar';
import { useFilters } from '@/hooks/useFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const CreditManagement = () => {
  const { data, getInvoiceStatus } = useData();
  const { customers, suppliers, sales, purchases, settings } = data;
  const { toast } = useToast();
  
  const { filters, handleFilterChange, debouncedSearchTerm } = useFilters('creditManagement', []);

  const receivables = useMemo(() => {
    return (sales || [])
      .map(sale => {
        if (!sale) return null;
        const { balance } = getInvoiceStatus(sale);
        if (balance <= 0.01) return null;
        
        const customer = (customers || []).find(c => c.id === sale.customerId);
        const overdueDays = differenceInDays(new Date(), parseISO(sale.date));

        return { 
          id: sale.id, 
          name: customer?.name || 'Unknown Customer', 
          balance, 
          invoiceDate: sale.date, 
          overdueDays,
          invoiceNumber: sale.saleNumber
        };
      })
      .filter(Boolean);
  }, [sales, customers, getInvoiceStatus]);

  const payables = useMemo(() => {
    return (purchases || [])
      .map(purchase => {
        if (!purchase) return null;
        const { balance } = getInvoiceStatus(purchase);
        if (balance <= 0.01) return null;

        const supplier = (suppliers || []).find(s => s.id === purchase.supplierId);
        const overdueDays = differenceInDays(new Date(), parseISO(purchase.date));

        return { 
          id: purchase.id, 
          name: supplier?.name || 'Unknown Supplier', 
          balance, 
          invoiceDate: purchase.date, 
          overdueDays,
          invoiceNumber: purchase.purchaseNumber
        };
      })
      .filter(Boolean);
  }, [purchases, suppliers, getInvoiceStatus]);

  const filteredReceivables = receivables.filter(r => 
    r.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );
  const filteredPayables = payables.filter(p => 
    p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );

  const totalReceivables = filteredReceivables.reduce((sum, r) => sum + r.balance, 0);
  const totalPayables = filteredPayables.reduce((sum, p) => sum + p.balance, 0);

  const handleExport = (type) => {
    const reportData = type === 'Receivables' ? filteredReceivables : filteredPayables;
    const total = type === 'Receivables' ? totalReceivables : totalPayables;
    if (reportData.length === 0) {
      toast({ title: "No Data", description: "Cannot export an empty report.", variant: "destructive" });
      return;
    }
    generatePdf(
      <CreditReportTemplate data={reportData} type={type} total={total} settings={settings} />,
      `${type}-Report.pdf`
    );
  };

  const CreditTable = ({ data, type, total }) => {
    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.pageSize;
        return data.slice(startIndex, startIndex + filters.pageSize);
    }, [data, filters.page, filters.pageSize]);
    const totalPages = Math.ceil(data.length / filters.pageSize);

    const toolbar = (
        <FilterToolbar filters={filters} onFilterChange={handleFilterChange} showDateRange={false} showDatePresets={false} moduleName={type}>
            <Button variant="outline" onClick={() => handleExport(type)}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
        </FilterToolbar>
    );

    return (
        <ReportWrapper title={`${type} - Total: RS ${total.toFixed(2)}`} filterToolbar={toolbar}>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>{type === 'Receivables' ? 'Customer' : 'Supplier'}</TableHead><TableHead className="text-right">Balance Due</TableHead><TableHead>Invoice Date</TableHead><TableHead className="text-right">Overdue By (Days)</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paginatedData.map(item => (
                            <TableRow key={item.id}><TableCell className="font-mono">{item.invoiceNumber}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold">RS {item.balance.toFixed(2)}</TableCell><TableCell>{item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell className={`text-right ${item.overdueDays > 30 ? 'text-red-600 font-bold' : item.overdueDays > 15 ? 'text-orange-600' : ''}`}>{item.overdueDays > 0 ? `${item.overdueDays} days` : '-'}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
                {data.length === 0 && <p className="text-center p-4 text-muted-foreground">No credit found.</p>}
            </div>
            <CardFooter className="flex items-center justify-between pt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', Math.max(1, filters.page - 1)); }} disabled={filters.page === 1} /></PaginationItem>
                        <PaginationItem><PaginationLink>{filters.page} of {totalPages}</PaginationLink></PaginationItem>
                        <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', Math.min(totalPages, filters.page + 1)); }} disabled={filters.page === totalPages} /></PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardFooter>
        </ReportWrapper>
    )
  };

  return (
    <Tabs defaultValue="receivables" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="receivables">Receivables</TabsTrigger>
        <TabsTrigger value="payables">Payables</TabsTrigger>
      </TabsList>
      <TabsContent value="receivables" className="mt-4">
        <CreditTable data={filteredReceivables} type="Receivables" total={totalReceivables} />
      </TabsContent>
      <TabsContent value="payables" className="mt-4">
        <CreditTable data={filteredPayables} type="Payables" total={totalPayables} />
      </TabsContent>
    </Tabs>
  );
};

export default CreditManagement;