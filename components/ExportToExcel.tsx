'use client';

import { useState, useMemo } from 'react';
import { Download, Calendar, Info } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  onExport: (filters: ExportFilters) => void;
  isExporting?: boolean;
  filterDescription?: string;
};

export function ExportToExcel({
  sites,
  showSiteFilter = false,
  onExport,
  isExporting = false,
  filterDescription,
}: ExportToExcelProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);

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

  const handleSelectAllSites = () => {
    if (selectedSiteIds.length === activeSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(activeSites.map((site) => site.id));
    }
  };

  const handleExport = () => {
    onExport({
      fromDate,
      toDate,
      selectedSiteIds,
    });
  };

  const canExport = true; // Allow export with any filter combination

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Info Message */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">Export Data to Excel</p>
            <p className="mt-1">
              {showSiteFilter
                ? 'Select the date range (From - To) and choose the sites for which you want to export the data. Leave dates empty to export all records.'
                : 'Select the date range (From - To) to filter the export. Leave dates empty to export all records.'}
            </p>
          </div>
        </div>

        {/* Current Filter Info */}
        {filterDescription && (
          <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Current View Filters Applied</p>
              <p className="mt-1">{filterDescription}</p>
              <p className="mt-1 text-xs opacity-75">
                The exported data will match your current view. Change the filters above or in the main view to export different data.
              </p>
            </div>
          </div>
        )}

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-end gap-4">
          {/* From Date */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">From Date</Label>
            <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !fromDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'dd MMM yyyy') : 'Select date'}
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
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">To Date</Label>
            <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !toDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'dd MMM yyyy') : 'Select date'}
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
          </div>

          {/* Clear Dates Button */}
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
              }}
              className="text-muted-foreground"
            >
              Clear dates
            </Button>
          )}
        </div>

        {/* Site Filter */}
        {showSiteFilter && sites && sites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Filter by Sites</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllSites}
                className="h-auto py-1 px-2 text-xs"
              >
                {selectedSiteIds.length === activeSites.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 p-3 bg-background rounded-md border max-h-32 overflow-y-auto">
              {activeSites.map((site) => (
                <div key={site.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`site-${site.id}`}
                    checked={selectedSiteIds.includes(site.id)}
                    onCheckedChange={() => handleSiteToggle(site.id)}
                  />
                  <Label
                    htmlFor={`site-${site.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {site.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSiteIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No sites selected - all sites will be included in the export
              </p>
            )}
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleExport} disabled={isExporting} className="shadow-sm">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
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
