import { ArrowUpDown, Filter, Flame, Clock, TrendingUp } from 'lucide-react';

export type SortOption = 'popular' | 'newest' | 'unlocks' | 'ads-low' | 'ads-high';

interface ContentFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterByAds: number | null;
  onFilterChange: (ads: number | null) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'popular', label: 'Most Popular', icon: <Flame className="w-3.5 h-3.5" /> },
  { value: 'newest', label: 'Newest First', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'unlocks', label: 'Most Unlocks', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: 'ads-low', label: 'Easiest First', icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
  { value: 'ads-high', label: 'Premium First', icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
];

const adFilters = [
  { value: null, label: 'All' },
  { value: 1, label: '1 Ad' },
  { value: 2, label: '2 Ads' },
  { value: 3, label: '3+ Ads' },
];

export function ContentFilters({
  sortBy,
  onSortChange,
  filterByAds,
  onFilterChange
}: ContentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-2 glass rounded-lg text-sm font-medium text-foreground hover:border-primary/40 transition-all">
          <ArrowUpDown className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Sort:</span>
          <span className="text-primary">
            {sortOptions.find(o => o.value === sortBy)?.label}
          </span>
        </button>
        
        <div className="absolute top-full left-0 mt-2 w-48 glass-intense rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                sortBy === option.value
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ad Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {adFilters.map((filter) => (
          <button
            key={filter.value ?? 'all'}
            onClick={() => onFilterChange(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterByAds === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'glass text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
