import { useState, useEffect } from 'react';
import { Tag, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Predefined categories (client-side implementation)
// DB CHANGE NEEDED: Create 'categories' table with id, name, slug, icon columns
// DB CHANGE NEEDED: Add 'category_id' foreign key to 'contents' table
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'apps', name: 'Apps & APKs', icon: '📱' },
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'media', name: 'Media', icon: '🎬' },
  { id: 'tools', name: 'Tools', icon: '🔧' },
  { id: 'premium', name: 'Premium', icon: '⭐' },
];

// Auto-detect category from title/description (client-side workaround)
export function detectCategory(title: string, description?: string | null): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  if (text.includes('apk') || text.includes('app') || text.includes('android') || text.includes('ios')) {
    return 'apps';
  }
  if (text.includes('game') || text.includes('mod') || text.includes('hack')) {
    return 'games';
  }
  if (text.includes('movie') || text.includes('video') || text.includes('music') || text.includes('audio')) {
    return 'media';
  }
  if (text.includes('tool') || text.includes('software') || text.includes('utility')) {
    return 'tools';
  }
  if (text.includes('premium') || text.includes('pro') || text.includes('vip') || text.includes('exclusive')) {
    return 'premium';
  }
  
  return 'all';
}

interface CategoryTagsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  contentCounts?: Record<string, number>;
}

export function CategoryTags({ selectedCategory, onCategoryChange, contentCounts = {} }: CategoryTagsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex sm:flex-wrap gap-2 min-w-max sm:min-w-0">
        {CATEGORIES.map((category) => {
          const count = contentCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'glass hover:bg-primary/10 text-foreground'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              {category.id !== 'all' && count > 0 && (
                <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CATEGORIES };
