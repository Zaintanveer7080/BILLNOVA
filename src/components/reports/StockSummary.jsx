import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generatePdf } from '@/components/pdf/PdfGenerator';
import StockSummaryReportTemplate from '@/components/pdf/StockSummaryReportTemplate';
import ReportWrapper from './ReportWrapper';
import FilterToolbar from '../FilterToolbar';
import { useFilters } from '@/hooks/useFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StockSummary = () => {
  const { data, getStockValue } = useData();
  const { items, purchases, sales, settings } = data;
  const { toast } = useToast();
  
  const { 
    filters, 
    handleFilterChange, 
    debouncedSearchTerm 
  } = useFilters('stockSummary', []);

  const stockData = useMemo(() => {
    if (!items) return [];

    const itemStocks = items.map(item => {
        const openingStock = item.openingStock || 0;
        const totalPurchased = (purchases || []).reduce((sum, p) => sum + ((p.items || []).find(pi => pi.itemId === item.id)?.quantity || 0), 0);
        const totalSold = (sales || []).reduce((sum, s) => sum + ((s.items || []).find(si => si.itemId === item.id)?.quantity || 0), 0);
        const currentStock = openingStock + totalPurchased - totalSold;

        let stockValue = 0;
        if(currentStock > 0){
             const singleItemValue = getStockValue({ itemFilter: [item.id] });
             stockValue = singleItemValue;
        }

        let status = 'In Stock';
        if (currentStock <= 0) status = 'Out of Stock';
        else if (item.lowStockThreshold && currentStock <= item.lowStockThreshold) status = 'Low Stock';
        else if (currentStock <= 5 && currentStock > 0) status = 'Low Stock';

        return {
            ...item,
            currentStock,
            stockValue,
            status,
        };
    });

    return itemStocks;
  }, [items, purchases, sales, getStockValue]);


  const filteredStock = useMemo(() => {
    return stockData.filter(item =>
      (item.name && item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );
  }, [stockData, debouncedSearchTerm]);

  const paginatedStock = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredStock.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredStock, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(filteredStock.length / filters.pageSize);

  const totalStockValue = useMemo(() => {
    return filteredStock.reduce((sum, item) => sum + item.stockValue, 0);
  }, [filteredStock]);

  const handleExport = () => {
    if (filteredStock.length === 0) {
      toast({ title: "No Data", description: "Cannot export an empty report.", variant: "destructive" });
      return;
    }
    generatePdf(
      <StockSummaryReportTemplate data={filteredStock} settings={settings} totalValue={totalStockValue} />,
      `Stock-Summary-Report.pdf`
    );
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'Out of Stock': return <div className="flex items-center text-red-600"><AlertTriangle className="h-4 w-4 mr-1" /><span className="text-xs">{status}</span></div>;
      case 'Low Stock': return <div className="flex items-center text-orange-600"><AlertTriangle className="h-4 w-4 mr-1" /><span className="text-xs">{status}</span></div>;
      default: return <div className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1" /><span className="text-xs">{status}</span></div>;
    }
  };

  const toolbar = (
    <FilterToolbar filters={filters} onFilterChange={handleFilterChange} showDateRange={false} showDatePresets={false} moduleName="name or SKU">
      <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
    </FilterToolbar>
  );

  return (
    <ReportWrapper title="Stock Summary Report" filterToolbar={toolbar}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Item Name</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Avg. Pur. Price</TableHead><TableHead className="text-right">Sale Price</TableHead><TableHead className="text-right">Total Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedStock.map(item => (
              <TableRow key={item.id}><TableCell className="font-mono text-sm">{item.sku}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right">{item.currentStock} {item.unit}</TableCell><TableCell className="text-right">RS {(item.stockValue / (item.currentStock || 1))?.toFixed(2)}</TableCell><TableCell className="text-right">RS {item.salePrice?.toFixed(2)}</TableCell><TableCell className="text-right font-semibold">RS {item.stockValue.toFixed(2)}</TableCell><TableCell>{getStatusIndicator(item.status)}</TableCell></TableRow>
            ))}
          </TableBody>
          <tfoot><tr className="font-bold border-t-2"><td colSpan="5" className="p-2 text-right">Total Stock Value</td><td className="p-2 text-right">RS {totalStockValue.toFixed(2)}</td><td></td></tr></tfoot>
        </Table>
      </div>
      <CardFooter className="flex items-center justify-between pt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', Math.max(1, filters.page - 1)); }} disabled={filters.page === 1} /></PaginationItem>
              <PaginationItem><PaginationLink>{filters.page} of {totalPages}</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', Math.min(totalPages, filters.page + 1)); }} disabled={filters.page === totalPages} /></PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={String(filters.pageSize)} onValueChange={value => handleFilterChange('pageSize', Number(value))}><SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent></Select>
          </div>
      </CardFooter>
    </ReportWrapper>
  );
};

export default StockSummary;