import { useState, useEffect } from 'react';
import { FragranceService } from '@/services/Database';

export function useFragranceSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    gender: [] as string[],
    vendor: [] as string[],
    occasion: [] as string[],
    notes: [] as string[],
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({ genders: [], vendors: [], occasions: [], notes: [] });

  // 1. Initial Load of Filter Options
  useEffect(() => {
    const loadOptions = async () => {
        const opts = await FragranceService.getFilterOptions();
        setFilterOptions(opts);
    };
    loadOptions();
  }, []);

  // 2. Compute Results (Async)
  useEffect(() => {
    const fetchResults = async () => {
        const res = await FragranceService.search(searchQuery, activeFilters);
        setResults(res);
    };
    
    // Debounce to prevent flickering while typing
    const timeoutId = setTimeout(() => {
        fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilters]);

  // 3. Actions
  const toggleFilter = (category: keyof typeof activeFilters, item: string) => {
    setActiveFilters(prev => {
      const current = prev[category];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ gender: [], vendor: [], occasion: [], notes: [] });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    filterOptions,
    results,
    toggleFilter,
    clearFilters,
    clearSearch,
    hasActiveFilters: Object.values(activeFilters).some(arr => arr.length > 0)
  };
}