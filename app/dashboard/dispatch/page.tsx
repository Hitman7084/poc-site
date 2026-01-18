'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Truck, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  useDispatches,
  useCreateDispatch,
  useUpdateDispatch,
  useDeleteDispatch,
} from '@/hooks/useDispatch';
import { useAllSites } from '@/hooks/useSites';
import { useHydrated } from '@/hooks/useHydration';
import type { DispatchInput, DispatchWithRelations, Site } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatBoolean } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';
import { format, isWithinInterval, startOfDay, isSameDay } from 'date-fns';

export default function DispatchPage() {
  const isHydrated = useHydrated();
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fromSiteId, setFromSiteId] = useState<string>('all');
  const [toSiteId, setToSiteId] = useState<string>('all');
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<DispatchWithRelations | null>(null);
  const [formData, setFormData] = useState<DispatchInput>({
    fromSiteId: '',
    toSiteId: '',
    materialName: '',
    quantity: 0,
    unit: '',
    dispatchDate: '',
    receivedDate: '',
    isReceived: false,
    dispatchedBy: '',
    receivedBy: '',
    notes: '',
  });

  const { data, isLoading, error, refetch } = useDispatches(page);
  const dispatches = data?.data;
  const pagination = data?.pagination;
  const { data: sites, isLoading: isLoadingSites } = useAllSites();
  const createMutation = useCreateDispatch();
  const updateMutation = useUpdateDispatch();
  const deleteMutation = useDeleteDispatch();

  // Initialize date after hydration to avoid mismatch
  useEffect(() => {
    if (isHydrated && !selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      setFormData(prev => ({
        ...prev,
        dispatchDate: today.toISOString().split('T')[0]
      }));
    }
  }, [isHydrated, selectedDate]);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const isToday = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;

  // Filter sites to only show active sites that are within the date range
  const activeSitesForDate = useMemo(() => {
    if (!sites || !selectedDate) return [];
    
    const selectedDay = startOfDay(selectedDate);
    
    return sites.filter((site) => {
      if (!site.isActive) return false;
      
      // If site has date ranges, check if selected date is within range
      if (site.startDate && site.endDate) {
        const startDate = startOfDay(new Date(site.startDate));
        const endDate = startOfDay(new Date(site.endDate));
        return isWithinInterval(selectedDay, { start: startDate, end: endDate });
      }
      
      // If only start date, check if selected date is on or after start
      if (site.startDate) {
        const startDate = startOfDay(new Date(site.startDate));
        return selectedDay >= startDate;
      }
      
      // If no dates, site is always active
      return true;
    });
  }, [sites, selectedDate]);

  // Filter dispatches by selected date, from site, and to site
  const filteredDispatches = useMemo(() => {
    if (!dispatches || !selectedDate) return [];
    
    return dispatches.filter(d => {
      const dispatchDate = startOfDay(new Date(d.dispatchDate));
      const selectedDay = startOfDay(selectedDate);
      const matchesDate = isSameDay(dispatchDate, selectedDay);
      
      if (!matchesDate) return false;
      
      const matchesFromSite = fromSiteId === 'all' || d.fromSiteId === fromSiteId;
      const matchesToSite = toSiteId === 'all' || d.toSiteId === toSiteId;
      
      return matchesFromSite && matchesToSite;
    });
  }, [dispatches, selectedDate, fromSiteId, toSiteId]);

  // Handle export
  const handleExport = async (filters: ExportFilters) => {
    if (!dispatches) return;

    let dataToExport = [...dispatches];

    // Apply date range filter
    dataToExport = filterByDateRange(
      dataToExport,
      (d) => d.dispatchDate,
      filters.fromDate,
      filters.toDate
    );

    // Apply from site filter
    if (fromSiteId !== 'all') {
      dataToExport = dataToExport.filter((d) => d.fromSiteId === fromSiteId);
    }

    // Apply to site filter
    if (toSiteId !== 'all') {
      dataToExport = dataToExport.filter((d) => d.toSiteId === toSiteId);
    }

    await exportToExcel(dataToExport, {
      filename: 'dispatch_records',
      sheetName: 'Dispatches',
      columns: [
        { header: 'Dispatch Date', accessor: (d) => formatDate(d.dispatchDate) },
        { header: 'From Site', accessor: (d) => d.fromSite.name },
        { header: 'To Site', accessor: (d) => d.toSite.name },
        { header: 'Material Name', accessor: 'materialName' },
        { header: 'Quantity', accessor: 'quantity' },
        { header: 'Unit', accessor: 'unit' },
        { header: 'Received', accessor: (d) => formatBoolean(d.isReceived) },
        { header: 'Received Date', accessor: (d) => formatDate(d.receivedDate) },
        { header: 'Dispatched By', accessor: (d) => d.dispatchedBy || '' },
        { header: 'Received By', accessor: (d) => d.receivedBy || '' },
        { header: 'Notes', accessor: (d) => d.notes || '' },
        { header: 'Created At', accessor: (d) => formatDate(d.createdAt) },
      ],
    });
    toast.success(`Exported ${dataToExport.length} dispatch records to Excel`);
  };

  const handleOpenDialog = (dispatch?: DispatchWithRelations) => {
    if (dispatch) {
      setEditingDispatch(dispatch);
      setFormData({
        fromSiteId: dispatch.fromSiteId,
        toSiteId: dispatch.toSiteId,
        materialName: dispatch.materialName,
        quantity: dispatch.quantity,
        unit: dispatch.unit,
        dispatchDate: new Date(dispatch.dispatchDate).toISOString().split('T')[0],
        receivedDate: dispatch.receivedDate ? new Date(dispatch.receivedDate).toISOString().split('T')[0] : '',
        isReceived: dispatch.isReceived,
        dispatchedBy: dispatch.dispatchedBy || '',
        receivedBy: dispatch.receivedBy || '',
        notes: dispatch.notes || '',
      });
    } else {
      setEditingDispatch(null);
      setFormData({
        fromSiteId: fromSiteId !== 'all' ? fromSiteId : '',
        toSiteId: '',
        materialName: '',
        quantity: 0,
        unit: '',
        dispatchDate: dateString,
        receivedDate: '',
        isReceived: false,
        dispatchedBy: '',
        receivedBy: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: DispatchInput = {
      ...formData,
      receivedDate: formData.receivedDate || undefined,
      dispatchedBy: formData.dispatchedBy || undefined,
      receivedBy: formData.receivedBy || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingDispatch) {
        await updateMutation.mutateAsync({ id: editingDispatch.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save dispatch:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this dispatch record?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete dispatch:', err);
      }
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => {
      if (!prev) return prev;
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      if (!prev) return prev;
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  if (isLoading || isLoadingSites || !selectedDate) return <LoadingState message="Loading dispatches..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Header Row - Title + Date + Site Filter + New Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 rounded-lg">
            <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Dispatch</h1>
            <p className="text-xs text-muted-foreground">Track material transfers between sites</p>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Navigation */}
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={handlePreviousDay} className="h-8 w-8 rounded-r-none border-r-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 min-w-[160px] rounded-none text-sm font-normal">
                  <Calendar className="mr-2 h-3.5 w-3.5" />
                  {format(selectedDate, 'MMM d, yyyy')}
                  {isToday && <Badge variant="secondary" className="ml-2 h-5 text-[10px]">Today</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" onClick={handleNextDay} className="h-8 w-8 rounded-l-none border-l-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* From Site Filter */}
          <Select value={fromSiteId} onValueChange={setFromSiteId}>
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="From: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">From: All Sites</SelectItem>
              {activeSitesForDate.map((site) => (
                <SelectItem key={site.id} value={site.id}>From: {site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* To Site Filter */}
          <Select value={toSiteId} onValueChange={setToSiteId}>
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="To: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">To: All Sites</SelectItem>
              {activeSitesForDate.map((site) => (
                <SelectItem key={site.id} value={site.id}>To: {site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => handleOpenDialog()} size="sm" className="h-8">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Dispatch
          </Button>
        </div>
      </div>

      {/* Export Section - Compact */}
      <ExportToExcel
        showSiteFilter={false}
        onExport={handleExport}
      />

      {/* Dispatches Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Dispatches
                {fromSiteId !== 'all' && (
                  <Badge variant="outline" className="font-normal">
                    From: {activeSitesForDate.find(s => s.id === fromSiteId)?.name}
                  </Badge>
                )}
                {toSiteId !== 'all' && (
                  <Badge variant="outline" className="font-normal">
                    To: {activeSitesForDate.find(s => s.id === toSiteId)?.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredDispatches.length} record{filteredDispatches.length !== 1 ? 's' : ''} for {format(selectedDate, 'MMM d, yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredDispatches.length === 0 ? (
            <EmptyState
              title="No dispatch records"
              description={
                fromSiteId !== 'all' || toSiteId !== 'all'
                  ? `No dispatches found for the selected filters on this date`
                  : "No dispatches recorded for this date"
              }
              action={
                <Button onClick={() => handleOpenDialog()} size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Dispatch
                </Button>
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-xs w-12">S.No</TableHead>
                    <TableHead className="h-9 text-xs">Material</TableHead>
                    <TableHead className="h-9 text-xs">From</TableHead>
                    <TableHead className="h-9 text-xs">To</TableHead>
                    <TableHead className="h-9 text-xs">Qty</TableHead>
                    <TableHead className="h-9 text-xs">Status</TableHead>
                    <TableHead className="h-9 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispatches.map((dispatch, index) => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="py-2 text-sm text-muted-foreground">
                        {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                      </TableCell>
                      <TableCell className="py-2 font-medium text-sm">{dispatch.materialName}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{dispatch.fromSite.name}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{dispatch.toSite.name}</TableCell>
                      <TableCell className="py-2 text-sm">{dispatch.quantity} {dispatch.unit}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={dispatch.isReceived ? 'default' : 'secondary'} className="text-xs h-5">
                          {dispatch.isReceived ? (
                            <><CheckCircle className="mr-1 h-3 w-3" />Received</>
                          ) : (
                            <><XCircle className="mr-1 h-3 w-3" />Pending</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(dispatch)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(dispatch.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDispatch ? 'Edit Dispatch' : 'New Dispatch'}</DialogTitle>
              <DialogDescription>{editingDispatch ? 'Update dispatch record' : 'Create material transfer record'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromSiteId">From Site *</Label>
                  <Select value={formData.fromSiteId} onValueChange={(value) => setFormData({ ...formData, fromSiteId: value })} required>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      {sites?.filter(s => s.id !== formData.toSiteId).map((site) => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toSiteId">To Site *</Label>
                  <Select value={formData.toSiteId} onValueChange={(value) => setFormData({ ...formData, toSiteId: value })} required>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      {sites?.filter(s => s.id !== formData.fromSiteId).map((site) => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialName">Material Name *</Label>
                <Input id="materialName" value={formData.materialName} onChange={(e) => setFormData({ ...formData, materialName: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="kg, bags, pieces" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dispatchDate">Dispatch Date *</Label>
                  <Input id="dispatchDate" type="date" value={formData.dispatchDate} onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receivedDate">Received Date</Label>
                  <Input id="receivedDate" type="date" value={formData.receivedDate} onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isReceived" checked={formData.isReceived} onChange={(e) => setFormData({ ...formData, isReceived: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="isReceived">Material Received</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dispatchedBy">Dispatched By</Label>
                  <Input id="dispatchedBy" value={formData.dispatchedBy} onChange={(e) => setFormData({ ...formData, dispatchedBy: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receivedBy">Received By</Label>
                  <Input id="receivedBy" value={formData.receivedBy} onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingDispatch ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
