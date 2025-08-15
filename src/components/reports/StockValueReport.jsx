import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generatePdf } from '@/components/pdf/PdfGenerator';
import StockValueReportTemplate from '@/components/pdf/StockValueReportTemplate';
import ReportWrapper from './ReportWrapper';
import FilterToolbar from '../FilterToolbar';
import { useFilters } from '@/hooks/useFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StockValueReport = () => {
  const { data } = useData();
  const { items, purchases, sales, settings } = data;
  const { toast } = useToast();
  
  const { filters, handleFilterChange, debouncedSearchTerm, handleDateRangeChange, setDatePreset } = useFilters('stockValue', []);
  const asOfDate = filters.dateRange.from || new Date();

  const [sortConfig, setSortConfig] = useState({ key: 'stockValue', direction: 'descending' });

  const stockReportData = useMemo(() => {
    if (!items) return [];

    const date = new Date(asOfDate);

    const relevantPurchases = (purchases || []).filter(p => new Date(p.date) <= date);
    const relevantSales = (sales || []).filter(s => new Date(s.date) <= date);

    return items.map(item => {
      const { hasImei, openingStock, purchasePrice, salePrice, unit, name, sku } = item;
      
      let qtyOnHand = 0; let stockValue = 0; let unitCost = purchasePrice || 0; let availableSerials = [];

      if (hasImei) {
        const allPurchasedSerials = relevantPurchases.flatMap(p => (p.items || []).filter(i => i.itemId === item.id && Array.isArray(i.serials)).flatMap(i => i.serials.map(s => ({ serial: s, price: i.price, purchaseDate: p.date }))));
        const soldSerials = relevantSales.flatMap(s => s.items || []).filter(i => i.itemId === item.id && Array.isArray(i.serials)).flatMap(i => i.serials);
        availableSerials = allPurchasedSerials.filter(p => !soldSerials.includes(p.serial));
        qtyOnHand = availableSerials.length;
        stockValue = availableSerials.reduce((sum, s) => sum + s.price, 0);
        unitCost = qtyOnHand > 0 ? stockValue / qtyOnHand : purchasePrice;
      } else {
        const purchaseLots = relevantPurchases.flatMap(p => (p.items || []).filter(i => i.itemId === item.id).map(i => ({...i, date: p.date, remaining: i.quantity }))).sort((a,b) => new Date(a.date) - new Date(b.date));
        const salesForFifo = relevantSales.flatMap(s => (s.items || []).filter(i => i.itemId === item.id)).sort((a,b) => new Date(a.date) - new Date(b.date));
        for(const saleItem of salesForFifo) {
            let qtyToDeplete = saleItem.quantity;
            for (const lot of purchaseLots) { if (qtyToDeplete <= 0) break; const fromThisLot = Math.min(qtyToDeplete, lot.remaining); lot.remaining -= fromThisLot; qtyToDeplete -= fromThisLot; }
        }
        qtyOnHand = (openingStock || 0) + purchaseLots.reduce((sum, lot) => sum + lot.remaining, 0);
        stockValue = ((openingStock || 0) * (purchasePrice || 0)) + purchaseLots.reduce((sum, lot) => sum + (lot.remaining * lot.price), 0);
        unitCost = qtyOnHand > 0 ? stockValue / qtyOnHand : purchasePrice;
      }
      return { id: item.id, name, sku, unit, salePrice, qtyOnHand, unitCost, stockValue, status: `Available: ${qtyOnHand}`, hasImei, availableSerials };
    }).filter(item => item.qtyOnHand > 0);
  }, [items, purchases, sales, asOfDate]);

  const filteredAndSortedData = useMemo(() => {
    let sortableItems = [...stockReportData].filter(item =>
      (item.name && item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [stockReportData, debouncedSearchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAndSortedData, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / filters.pageSize);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const grandTotalValue = useMemo(() => filteredAndSortedData.reduce((sum, item) => sum + item.stockValue, 0), [filteredAndSortedData]);

  const handleExport = () => {
    if (filteredAndSortedData.length === 0) {
      toast({ title: "No Data", description: "Cannot export an empty report.", variant: "destructive" });
      return;
    }
    generatePdf(
      <StockValueReportTemplate data={filteredAndSortedData} settings={settings} totalValue={grandTotalValue} asOfDate={asOfDate} />,
      `Stock-Value-Report-as-of-${asOfDate}.pdf`
    );
  };
  
  const onDateChange = (range) => handleDateRangeChange({ from: range?.from, to: range?.from });

  const toolbar = (
    <FilterToolbar
      filters={filters}
      onFilterChange={handleFilterChange}
      onDateRangeChange={onDateChange}
      onSetDatePreset={setDatePreset}
      moduleName="name or SKU"
    >
      <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
    </FilterToolbar>
  );

  return (
    <ReportWrapper title="Stock Value Report" filterToolbar={toolbar}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right cursor-pointer" onClick={() => requestSort('qtyOnHand')}><div className="flex items-center justify-end">Qty On Hand <ArrowUpDown className="ml-2 h-4 w-4" /></div></TableHead><TableHead className="text-right">Unit Cost (Valued)</TableHead><TableHead className="text-right cursor-pointer" onClick={() => requestSort('stockValue')}><div className="flex items-center justify-end">Stock Value <ArrowUpDown className="ml-2 h-4 w-4" /></div></TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedData.map(item => (
              <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="font-mono text-sm">{item.sku}</TableCell><TableCell className="text-right">{item.qtyOnHand} {item.unit}</TableCell><TableCell className="text-right">RS {item.unitCost.toFixed(2)}</TableCell><TableCell className="text-right font-semibold">RS {item.stockValue.toFixed(2)}</TableCell><TableCell className="text-sm">{item.status}</TableCell></TableRow>
            ))}
          </TableBody>
          <tfoot><tr className="font-bold border-t-2"><td colSpan="4" className="p-2 text-right">Grand Total Value</td><td className="p-2 text-right">RS {grandTotalValue.toFixed(2)}</td><td></td></tr></tfoot>
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

export default StockValueReport;