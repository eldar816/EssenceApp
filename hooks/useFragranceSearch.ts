// @ts-nocheck
import { FragranceService } from '@/services/Database';
import { useEffect, useState } from 'react';

export function useFragranceSearch() {
  // State for the text input
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for filters
  const [activeFilters, setActiveFilters] = useState({
    gender: [] as string[],
    vendor: [] as string[],
    occasion: [] as string[],
    notes: [] as string[],
  });
  
  // State for search results
  const [results, setResults] = useState<any[]>([]);
  
  // State for filter options (loaded from DB)
  const [filterOptions, setFilterOptions] = useState<any>({ genders: [], vendors: [], occasions: [], notes: [] });

  // 1. Initial Load of Filter Options (Run Once)
  useEffect(() => {
    const loadOptions = async () => {
        const opts = await FragranceService.getFilterOptions();
        setFilterOptions(opts);
    };
    loadOptions();
  }, []);

  // 2. Compute Results (Debounced)
  useEffect(() => {
    // Define the search function
    const performSearch = async () => {
        try {
            const res = await FragranceService.search(searchQuery, activeFilters);
            setResults(res);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    // Execute immediately if empty (fast load), otherwise debounce
    if (searchQuery.length === 0) {
        performSearch();
        return;
    }

    const timeoutId = setTimeout(() => {
        performSearch();
    }, 300); // 300ms delay to allow typing

    // Cleanup function to clear the timeout if dependencies change (user keeps typing)
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