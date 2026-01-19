'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Calendar, MapPin, ChevronDown, Check, Info } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Site } from '@/lib/types';

export type ExportFilters = {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  selectedSiteIds: string[];
};

type ExportToExcelProps = {
  sites?: Site[];
  showSiteFilter?: boolean;
  onExport: (filters: ExportFilters) => void | Promise<void>;
  isExporting?: boolean;
  // Controlled date state props
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
};

export function ExportToExcel({
  sites,
  showSiteFilter = false,
  onExport,
  isExporting = false,
  // Controlled date props
  fromDate: controlledFromDate,
  toDate: controlledToDate,
  onFromDateChange,
  onToDateChange,
}: ExportToExcelProps) {
  // Internal state for uncontrolled mode
  const [internalFromDate, setInternalFromDate] = useState<Date | undefined>(undefined);
  const [internalToDate, setInternalToDate] = useState<Date | undefined>(undefined);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  // Use controlled values if provided, otherwise use internal state
  const isControlled = onFromDateChange !== undefined || onToDateChange !== undefined;
  const fromDate = isControlled ? controlledFromDate : internalFromDate;
  const toDate = isControlled ? controlledToDate : internalToDate;

  const setFromDate = (date: Date | undefined) => {
    if (onFromDateChange) {
      onFromDateChange(date);
    } else {
      setInternalFromDate(date);
    }
  };

  const setToDate = (date: Date | undefined) => {
    if (onToDateChange) {
      onToDateChange(date);
    } else {
      setInternalToDate(date);
    }
  };

  const activeSites = useMemo(() => {
    if (!sites) return [];
    return sites.filter((site) => site.isActive);
  }, [sites]);

  const handleSiteToggle = (siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleExport = () => {
    onExport({
      fromDate,
      toDate,
      selectedSiteIds,
    });
  };

  const getSiteFilterLabel = () => {
    if (selectedSiteIds.length === 0) return 'All Sites';
    if (selectedSiteIds.length === 1) {
      const site = activeSites.find(s => s.id === selectedSiteIds[0]);
      return site?.name || '1 site';
    }
    return `${selectedSiteIds.length} sites`;
  };

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="py-3">
        {/* Single Row Layout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span className="font-medium">Export</span>
          </div>

          {/* From Date */}
          <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'w-[130px] justify-start text-left font-normal h-8',
                  !fromDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" />
                {fromDate ? format(fromDate, 'dd MMM yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={fromDate}
                onSelect={(date) => {
                  setFromDate(date);
                  setFromCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* To Date */}
          <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!fromDate}
                className={cn(
                  'w-[130px] justify-start text-left font-normal h-8',
                  !toDate && 'text-muted-foreground',
                  !fromDate && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" />
                {toDate ? format(toDate, 'dd MMM yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={toDate}
                onSelect={(date) => {
                  setToDate(date);
                  setToCalendarOpen(false);
                }}
                disabled={(date) => fromDate ? date < fromDate : false}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Dates */}
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
              }}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}

          {/* Site Filter Dropdown */}
          {showSiteFilter && sites && sites.length > 0 && (
            <Popover open={siteDropdownOpen} onOpenChange={setSiteDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-[150px] justify-between font-normal"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{getSiteFilterLabel()}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <ScrollArea className="h-[200px]">
                  <div className="p-1">
                    {/* All Sites Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedSiteIds([])}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                        selectedSiteIds.length === 0 && "bg-accent"
                      )}
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedSiteIds.length === 0 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-muted-foreground/30"
                      )}>
                        {selectedSiteIds.length === 0 && <Check className="h-3 w-3" />}
                      </div>
                      <span>All Sites</span>
                    </button>
                    
                    <div className="my-1 h-px bg-border" />
                    
                    {/* Individual Sites */}
                    {activeSites.map((site) => (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => handleSiteToggle(site.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                          selectedSiteIds.includes(site.id) && "bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          selectedSiteIds.includes(site.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedSiteIds.includes(site.id) && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{site.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {/* Export Button */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-800">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Export data monthly for backup</span>
            </div>
            <Button onClick={handleExport} disabled={isExporting} size="sm" className="h-8">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to filter data by date range
 */
export function filterByDateRange<T>(
  data: T[],
  dateAccessor: (item: T) => Date | string | null | undefined,
  fromDate: Date | undefined,
  toDate: Date | undefined
): T[] {
  if (!fromDate && !toDate) return data;

  return data.filter((item) => {
    const itemDate = dateAccessor(item);
    if (!itemDate) return false;

    const date = startOfDay(new Date(itemDate));

    if (fromDate && toDate) {
      return isWithinInterval(date, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });
    }

    if (fromDate) {
      return date >= startOfDay(fromDate);
    }

    if (toDate) {
      return date <= endOfDay(toDate);
    }

    return true;
  });
}

/**
 * Helper function to filter data by site IDs
 */
export function filterBySites<T>(
  data: T[],
  siteAccessor: (item: T) => string | string[] | null | undefined,
  selectedSiteIds: string[]
): T[] {
  if (selectedSiteIds.length === 0) return data;

  return data.filter((item) => {
    const siteId = siteAccessor(item);
    if (!siteId) return false;

    if (Array.isArray(siteId)) {
      return siteId.some((id) => selectedSiteIds.includes(id));
    }

    return selectedSiteIds.includes(siteId);
  });
}
