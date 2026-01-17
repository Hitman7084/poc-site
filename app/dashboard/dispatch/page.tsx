'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Truck, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import {
  useDispatches,
  useCreateDispatch,
  useUpdateDispatch,
  useDeleteDispatch,
} from '@/hooks/useDispatch';
import { useSites } from '@/hooks/useSites';
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
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, isSameDay } from 'date-fns';

export default function DispatchPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<DispatchWithRelations | null>(null);
  const [formData, setFormData] = useState<DispatchInput>({
    fromSiteId: '',
    toSiteId: '',
    materialName: '',
    quantity: 0,
    unit: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    receivedDate: '',
    isReceived: false,
    dispatchedBy: '',
    receivedBy: '',
    notes: '',
  });

  const { data: dispatches, isLoading, error, refetch } = useDispatches();
  const { data: sites, isLoading: isLoadingSites } = useSites();
  const createMutation = useCreateDispatch();
  const updateMutation = useUpdateDispatch();
  const deleteMutation = useDeleteDispatch();

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Filter sites to only show active sites that are within the date range
  const activeSitesForDate = useMemo(() => {
    if (!sites) return [];
    
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

  // Filter dispatches by selected date and site
  const filteredDispatches = useMemo(() => {
    if (!dispatches) return [];
    
    return dispatches.filter(d => {
      const dispatchDate = startOfDay(new Date(d.dispatchDate));
      const selectedDay = startOfDay(selectedDate);
      const matchesDate = isSameDay(dispatchDate, selectedDay);
      
      if (selectedSite) {
        return matchesDate && (d.fromSiteId === selectedSite.id || d.toSiteId === selectedSite.id);
      }
      
      return matchesDate;
    });
  }, [dispatches, selectedDate, selectedSite]);

  // Count dispatches per site for the selected date
  const getDispatchCountForSite = (siteId: string) => {
    if (!dispatches) return { from: 0, to: 0 };
    
    const from = dispatches.filter(d => {
      const dispatchDate = startOfDay(new Date(d.dispatchDate));
      return isSameDay(dispatchDate, startOfDay(selectedDate)) && d.fromSiteId === siteId;
    }).length;
    
    const to = dispatches.filter(d => {
      const dispatchDate = startOfDay(new Date(d.dispatchDate));
      return isSameDay(dispatchDate, startOfDay(selectedDate)) && d.toSiteId === siteId;
    }).length;
    
    return { from, to };
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
        fromSiteId: selectedSite?.id || '',
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
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  if (isLoading || isLoadingSites) return <LoadingState message="Loading dispatches..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header with Calendar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dispatch</h1>
            <p className="text-sm text-muted-foreground">Track material transfers between sites</p>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay} className="shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal shadow-sm">
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
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
          
          <Button variant="outline" size="icon" onClick={handleNextDay} className="shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sites Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Sites for {format(selectedDate, 'MMMM d, yyyy')}</h2>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            New Dispatch
          </Button>
        </div>
        
        {activeSitesForDate.length === 0 ? (
          <Card className="p-12">
            <EmptyState
              title="No active sites for this date"
              description="There are no sites scheduled to be active on this date. Check the site schedules or select a different date."
            />
          </Card>
        ) : (
          <>
            {/* All Sites Option */}
            <div className="mb-4">
              <Button
                variant={selectedSite === null ? "default" : "outline"}
                onClick={() => setSelectedSite(null)}
                className="mr-2"
              >
                All Sites
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeSitesForDate.map((site) => {
                const dispatchCounts = getDispatchCountForSite(site.id);
                const totalDispatches = dispatchCounts.from + dispatchCounts.to;
                const isSelected = selectedSite?.id === site.id;
                
                return (
                  <Card
                    key={site.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary border-primary"
                    )}
                    onClick={() => setSelectedSite(site)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{site.name}</CardTitle>
                            {site.location && (
                              <CardDescription className="text-xs">{site.location}</CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span>{totalDispatches} dispatch{totalDispatches !== 1 ? 'es' : ''}</span>
                        </div>
                        {totalDispatches > 0 && (
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              ↑{dispatchCounts.from}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              ↓{dispatchCounts.to}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {site.startDate && site.endDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(site.startDate), 'MMM d')} - {format(new Date(site.endDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dispatches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Dispatches for {format(selectedDate, 'MMMM d, yyyy')}
            {selectedSite && <Badge variant="outline">{selectedSite.name}</Badge>}
          </CardTitle>
          <CardDescription>
            {filteredDispatches.length} dispatch record{filteredDispatches.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDispatches.length === 0 ? (
            <EmptyState
              title="No dispatch records found"
              description={selectedSite 
                ? `No dispatches for ${selectedSite.name} on this date` 
                : "No dispatches recorded for this date"}
              action={
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Dispatch
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {dispatch.materialName}
                      </div>
                    </TableCell>
                    <TableCell>{dispatch.fromSite.name}</TableCell>
                    <TableCell>{dispatch.toSite.name}</TableCell>
                    <TableCell>{dispatch.quantity} {dispatch.unit}</TableCell>
                    <TableCell>
                      <Badge variant={dispatch.isReceived ? 'default' : 'secondary'}>
                        {dispatch.isReceived ? (
                          <><CheckCircle className="mr-1 h-3 w-3" />Received</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" />Pending</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(dispatch)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dispatch.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
