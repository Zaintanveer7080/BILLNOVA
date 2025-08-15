import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const FilterToolbar = ({
  filters,
  onFilterChange,
  onDateRangeChange,
  onReset,
  onSetDatePreset,
  moduleName,
  showSearch = true,
  children
}) => {
  const { dateRange, searchTerm } = filters;

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
       <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[280px] justify-start text-left font-normal text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")
            ) : <span>Pick a date range</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" selected={dateRange} onSelect={onDateRangeChange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

      {datePresets.map(preset => (
        <Button key={preset.value} variant="outline" size="sm" onClick={() => onSetDatePreset(preset.value)}>
          {preset.label}
        </Button>
      ))}

      <div className="flex-grow" />

      {showSearch && (
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Search ${moduleName}...`} className="pl-9" value={searchTerm || ''} onChange={e => onFilterChange('searchTerm', e.target.value)} />
        </div>
      )}

      {children}
      
      {onReset && (
        <Button variant="ghost" size="icon" onClick={onReset} aria-label="Refresh data">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FilterToolbar;