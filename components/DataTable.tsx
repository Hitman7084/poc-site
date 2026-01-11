'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  actions?: (item: T) => React.ReactNode;
  mobileCard?: (item: T) => React.ReactNode;
  searchable?: boolean;
  pagination?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions,
  mobileCard,
  searchable = false,
  pagination = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  {column.sortable && column.accessorKey ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.accessorKey!)}
                    >
                      {column.header}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell
                        ? column.cell(item)
                        : column.accessorKey
                        ? String(item[column.accessorKey])
                        : ''}
                    </TableCell>
                  ))}
                  {actions && <TableCell className="text-right">{actions(item)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {currentData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No results found.</div>
          ) : (
            currentData.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4">
                {mobileCard(item)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</p>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
