'use client';

import { cn } from '@/lib/utils';
import { FileText, Calendar } from 'lucide-react';

export type TabType = 'drl' | 'events';

interface TabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border/40 bg-muted/50 p-1 shadow-sm">
      <button
        onClick={() => onTabChange('drl')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer min-w-[120px] sm:min-w-[160px]',
          activeTab === 'drl'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="hidden xs:inline sm:inline">Điểm Rèn Luyện</span>
      </button>
      <button
        onClick={() => onTabChange('events')}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer min-w-[120px] sm:min-w-[160px]',
          activeTab === 'events'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span>Sự Kiện</span>
      </button>
    </div>
  );
}
