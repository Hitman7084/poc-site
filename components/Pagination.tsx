'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ pagination, onPageChange, isLoading = false }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-3">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? (
          'No records found'
        ) : (
          <>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> records
          </>
        )}
      </p>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious || isLoading}
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious || isLoading}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          
          <span className="px-3 text-xs text-muted-foreground">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext || isLoading}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext || isLoading}
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
