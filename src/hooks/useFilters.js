import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays, startOfYear, endOfYear } from 'date-fns';
import { toDate } from 'date-fns-tz';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const useFilters = (moduleKey, defaultStatusOptions = []) => {
    const navigate = useNavigate();
    const location = useLocation();
    const timeZone = 'Asia/Dubai';

    const getInitialDateRange = () => {
        const now = toDate(new Date(), { timeZone });
        return {
            from: startOfMonth(now),
            to: endOfMonth(now),
        };
    };

    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(location.search);
        return {
            dateRange: {
                from: params.get(`${moduleKey}_from`) ? new Date(params.get(`${moduleKey}_from`)) : getInitialDateRange().from,
                to: params.get(`${moduleKey}_to`) ? new Date(params.get(`${moduleKey}_to`)) : getInitialDateRange().to,
            },
            statuses: params.get(`${moduleKey}_statuses`)?.split(',') || defaultStatusOptions,
            searchTerm: params.get(`${moduleKey}_searchTerm`) || '',
            page: parseInt(params.get(`${moduleKey}_page`), 10) || 1,
            pageSize: parseInt(params.get(`${moduleKey}_pageSize`), 10) || 25,
        };
    });

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 200);

    const updateUrlParams = useCallback((newFilters) => {
        const params = new URLSearchParams(location.search);
        // Clean up old params for this module before setting new ones
        for (const key of params.keys()) {
            if (key.startsWith(moduleKey)) {
                params.delete(key);
            }
        }
        
        if (newFilters.dateRange.from) params.set(`${moduleKey}_from`, format(newFilters.dateRange.from, 'yyyy-MM-dd'));
        if (newFilters.dateRange.to) params.set(`${moduleKey}_to`, format(newFilters.dateRange.to, 'yyyy-MM-dd'));
        if (newFilters.statuses.length > 0 && newFilters.statuses.length < defaultStatusOptions.length) {
            params.set(`${moduleKey}_statuses`, newFilters.statuses.join(','));
        }
        if (newFilters.searchTerm) params.set(`${moduleKey}_searchTerm`, newFilters.searchTerm);
        if (newFilters.page > 1) params.set(`${moduleKey}_page`, newFilters.page);
        if (newFilters.pageSize !== 25) params.set(`${moduleKey}_pageSize`, newFilters.pageSize);
        
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }, [navigate, location.pathname, defaultStatusOptions.length, moduleKey]);
    
    // This effect is commented out to prevent URL updates on every filter change,
    // which can be noisy. The state is managed internally. URL persistence can be re-enabled if needed.
    // useEffect(() => {
    //     updateUrlParams(filters);
    // }, [filters, updateUrlParams]);
    
    const setDatePreset = useCallback((preset) => {
        const now = toDate(new Date(), { timeZone });
        let from, to;
        switch (preset) {
            case 'today': from = startOfDay(now); to = endOfDay(now); break;
            case 'last7': from = startOfDay(subDays(now, 6)); to = endOfDay(now); break;
            case 'last30': from = startOfDay(subDays(now, 29)); to = endOfDay(now); break;
            case 'last90': from = startOfDay(subDays(now, 89)); to = endOfDay(now); break;
            case 'thisMonth': from = startOfMonth(now); to = endOfMonth(now); break;
            case 'lastMonth': const lm = subMonths(now, 1); from = startOfMonth(lm); to = endOfMonth(lm); break;
            case 'thisYear': from = startOfYear(now); to = endOfYear(now); break;
            default: from = startOfMonth(now); to = endOfMonth(now); break; 
        }
        setFilters(f => ({ ...f, dateRange: { from, to }, page: 1 }));
    }, [timeZone]);

    const handleFilterChange = (key, value) => {
        setFilters(f => ({ ...f, [key]: value, page: key !== 'page' ? 1 : value }));
    };

    const handleDateRangeChange = (range) => {
        setFilters(f => ({ ...f, dateRange: range, page: 1 }));
    };

    const handleStatusChange = (status) => {
        setFilters(f => {
            const newStatuses = f.statuses.includes(status)
                ? f.statuses.filter(s => s !== status)
                : [...f.statuses, status];
            return { ...f, statuses: newStatuses, page: 1 };
        });
    };

    const resetFilters = useCallback(() => {
        const initialDateRange = getInitialDateRange();
        setFilters({
            dateRange: initialDateRange,
            statuses: defaultStatusOptions,
            searchTerm: '',
            page: 1,
            pageSize: filters.pageSize, 
        });
    }, [defaultStatusOptions, filters.pageSize]);

    return {
        filters,
        setFilters,
        debouncedSearchTerm,
        setDatePreset,
        handleFilterChange,
        handleDateRangeChange,
        handleStatusChange,
        resetFilters,
        timeZone,
    };
};