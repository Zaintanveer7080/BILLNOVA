import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as CustomTableFooter } from '@/components/ui/table';
import { useData } from '@/contexts/DataContext';
import { useFilters } from '@/hooks/useFilters';
import FilterToolbar from '@/components/FilterToolbar';
import ReportWrapper from './ReportWrapper';
import { Download, TrendingUp, Calendar, DollarSign, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toDate, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfitSummary = () => {
  const { data, getProfitOfSale } = useData();
  const { sales, customers, settings } = data;
  const { toast } = useToast();

  const {
    filters,
    handleFilterChange,
    handleDateRangeChange,
    resetFilters,
    setDatePreset,
    timeZone,
    debouncedSearchTerm
  } = useFilters('profitSummary', []);

  const getCustomerName = (customerId) => (customers || []).find(c => c.id === customerId)?.name || 'N/A';

  const processedSales = useMemo(() => {
    return (sales || [])
      .map(sale => {
        const saleDate = toDate(sale.date, { timeZone });
        const fromDate = filters.dateRange.from ? toDate(filters.dateRange.from, { timeZone }) : null;
        const toDateFilter = filters.dateRange.to ? toDate(filters.dateRange.to, { timeZone }) : null;

        if ((fromDate && saleDate < fromDate) || (toDateFilter && saleDate > toDateFilter)) return null;

        const { totalProfit } = getProfitOfSale(sale);
        const profitPercentage = sale.totalCost > 0 ? (totalProfit / sale.totalCost) * 100 : 0;
        const cogs = (sale.totalCost || 0) - totalProfit;

        return {
          ...sale,
          customerName: getCustomerName(sale.customerId),
          cogs,
          profit: totalProfit,
          profitPercentage,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, filters.dateRange, getProfitOfSale, getCustomerName, timeZone, customers]);
  
  const filteredSales = useMemo(() => {
    if (!debouncedSearchTerm) return processedSales;
    return processedSales.filter(sale => 
        (sale.saleNumber && sale.saleNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );
  }, [processedSales, debouncedSearchTerm]);
  
  const paginatedSales = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredSales.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredSales, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(filteredSales.length / filters.pageSize);

  const summary = useMemo(() => {
    const now = new Date();
    const today = toDate(formatInTimeZone(now, timeZone, 'yyyy-MM-dd HH:mm:ss'), { timeZone });
    
    const todaySales = processedSales.filter(s => formatInTimeZone(toDate(s.date, {timeZone}), timeZone, 'yyyy-MM-dd') === formatInTimeZone(today, timeZone, 'yyyy-MM-dd'));
    const monthSales = processedSales.filter(s => new Date(s.date).getUTCMonth() === new Date(today).getUTCMonth() && new Date(s.date).getUTCFullYear() === new Date(today).getUTCFullYear());
    const yearSales = processedSales.filter(s => new Date(s.date).getUTCFullYear() === new Date(today).getUTCFullYear());

    const calculateTotals = (arr) => arr.reduce((acc, sale) => ({ profit: acc.profit + sale.profit }), { profit: 0 });

    return {
      today: calculateTotals(todaySales),
      month: calculateTotals(monthSales),
      year: calculateTotals(yearSales),
    };
  }, [processedSales, timeZone]);

  const { totalProfit, totalSubtotal, totalDiscount, totalCogs } = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
        acc.totalProfit += sale.profit;
        acc.totalSubtotal += (sale.subTotal || 0);
        const discountValue = sale.discount?.value || 0;
        acc.totalDiscount += sale.discount?.type === 'percent' ? (sale.subTotal * discountValue / 100) : discountValue;
        acc.totalCogs += sale.cogs;
        return acc;
    }, { totalProfit: 0, totalSubtotal: 0, totalDiscount: 0, totalCogs: 0 });
  }, [filteredSales]);


  const handleExport = () => {
    toast({ title: "🚧 Feature not implemented", description: "Export is coming soon!" });
  };

  const toolbar = (
    <FilterToolbar
      filters={filters}
      onFilterChange={handleFilterChange}
      onDateRangeChange={handleDateRangeChange}
      onReset={resetFilters}
      onSetDatePreset={setDatePreset}
      moduleName="invoice no/client"
    >
      <Button onClick={handleExport} variant="outline">
        <Download className="mr-2 h-4 w-4" /> Export
      </Button>
    </FilterToolbar>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today's Profit</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{settings.currency} {summary.today.profit.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">This Month's Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{settings.currency} {summary.month.profit.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">This Year's Profit</CardTitle><BarChart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{settings.currency} {summary.year.profit.toFixed(2)}</div></CardContent></Card>
      </div>
      
      <ReportWrapper title="Detailed Profit Report" filterToolbar={toolbar}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date/Time</TableHead><TableHead>Invoice No.</TableHead><TableHead>Client</TableHead><TableHead>Items/Qty</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">Discount</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">COGS</TableHead><TableHead className="text-right">Profit</TableHead><TableHead className="text-right">Profit %</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(toDate(sale.date, { timeZone }), 'PPpp')}</TableCell><TableCell>{sale.saleNumber}</TableCell><TableCell>{sale.customerName}</TableCell><TableCell>{sale.totalQuantity}</TableCell><TableCell className="text-right">{(sale.subTotal || 0).toFixed(2)}</TableCell><TableCell className="text-right">{(sale.discount?.type === 'percent' ? ((sale.subTotal || 0) * (sale.discount?.value || 0) / 100) : (sale.discount?.value || 0)).toFixed(2)}</TableCell><TableCell className="text-right">{(0).toFixed(2)}</TableCell><TableCell className="text-right">{sale.cogs.toFixed(2)}</TableCell><TableCell className="text-right font-semibold">{sale.profit.toFixed(2)}</TableCell><TableCell className="text-right">{sale.profitPercentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <CustomTableFooter>
                <TableRow><TableCell colSpan={4} className="font-bold">Totals</TableCell><TableCell className="text-right font-bold">{totalSubtotal.toFixed(2)}</TableCell><TableCell className="text-right font-bold">{totalDiscount.toFixed(2)}</TableCell><TableCell className="text-right font-bold">{(0).toFixed(2)}</TableCell><TableCell className="text-right font-bold">{totalCogs.toFixed(2)}</TableCell><TableCell className="text-right font-bold text-lg">{totalProfit.toFixed(2)}</TableCell><TableCell></TableCell></TableRow>
              </CustomTableFooter>
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
    </div>
  );
};

export default ProfitSummary;