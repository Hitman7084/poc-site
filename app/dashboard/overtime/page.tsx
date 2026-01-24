'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Clock, MapPin } from 'lucide-react';
import {
  useOvertime,
  useCreateOvertime,
  useUpdateOvertime,
  useDeleteOvertime,
  fetchAllOvertimeForExport,
} from '@/hooks/useOvertime';
import { useWorkers, useAllWorkers } from '@/hooks/useWorkers';
import { useAllSites } from '@/hooks/useSites';
import type { OvertimeInput, OvertimeWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatCurrency } from '@/lib/export-utils';
import { formatDateForAPI } from '@/lib/api-utils';
import { Pagination } from '@/components/Pagination';
import { toast } from 'sonner';

export default function OvertimePage() {
  const [page, setPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOvertime, setEditingOvertime] = useState<OvertimeWithRelations | null>(null);
  const [formData, setFormData] = useState<OvertimeInput>({
    workerId: '',
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    extraHours: 0,
    rate: 0,
    notes: '',
  });

  const filterParams = {
    siteId: selectedSite?.id,
    fromDate: formatDateForAPI(fromDate),
    toDate: formatDateForAPI(toDate),
  };

  const { data: overtimeData, isLoading, error, refetch } = useOvertime(page, 10, filterParams);
  const overtime = overtimeData?.data ?? [];
  const pagination = overtimeData?.pagination;
  const { data: workers } = useAllWorkers();
  const { data: sites } = useAllSites();
  const activeSites = sites?.filter(s => s.isActive) || [];
  const createMutation = useCreateOvertime();
  const updateMutation = useUpdateOvertime();
  const deleteMutation = useDeleteOvertime();

  const totalAmount = formData.extraHours * formData.rate;

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSite, fromDate, toDate]);

  // No client-side filtering needed - all filtering is done server-side
  const filteredOvertime = overtime || [];

  const handleOpenDialog = (record?: OvertimeWithRelations) => {
    if (record) {
      setEditingOvertime(record);
      setFormData({
        workerId: record.workerId,
        siteId: record.siteId,
        date: new Date(record.date).toISOString().split('T')[0],
        extraHours: record.extraHours,
        rate: record.rate,
        notes: record.notes || '',
      });
    } else {
      setEditingOvertime(null);
      setFormData({
        workerId: '',
        siteId: '',
        date: new Date().toISOString().split('T')[0],
        extraHours: 0,
        rate: 0,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: OvertimeInput = {
      ...formData,
      notes: formData.notes || undefined,
    };

    try {
      if (editingOvertime) {
        await updateMutation.mutateAsync({ id: editingOvertime.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save overtime:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this overtime record?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete overtime:', err);
      }
    }
  };

  // Handle export - fetches all data from API with filters matching display
  const handleExport = async (filters: ExportFilters) => {
    try {
      // Fetch all overtime with filters from API - use page state, not ExportFilters
      const dataToExport = await fetchAllOvertimeForExport({
        siteId: selectedSite?.id,
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
      });

      await exportToExcel(dataToExport, {
        filename: 'overtime_records',
        sheetName: 'Overtime',
        columns: [
          { header: 'Date', accessor: (o) => formatDate(o.date) },
          { header: 'Worker', accessor: (o) => o.worker.name },
          { header: 'Site', accessor: (o) => o.site.name },
          { header: 'Extra Hours', accessor: 'extraHours' },
          { header: 'Rate/Hour', accessor: (o) => formatCurrency(o.rate) },
          { header: 'Total Amount', accessor: (o) => formatCurrency(o.totalAmount) },
          { header: 'Notes', accessor: (o) => o.notes || '' },
          { header: 'Created At', accessor: (o) => formatDate(o.createdAt) },
        ],
      });
      toast.success(`Exported ${dataToExport.length} overtime records to Excel`);
    } catch (err) {
      console.error('Failed to export overtime:', err);
      toast.error('Failed to export overtime');
    }
  };

  if (isLoading) return <LoadingState message="Loading overtime records..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <Clock className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Overtime</h1>
            <p className="text-sm text-muted-foreground">Track extra hours and overtime pay</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Site Filter Dropdown */}
          <Select 
            value={selectedSite?.id || 'all'} 
            onValueChange={(value) => setSelectedSite(value === 'all' ? null : activeSites?.find(s => s.id === value) || null)}
          >
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {activeSites?.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Overtime
          </Button>
        </div>
      </div>

      {/* Export Section */}
      <ExportToExcel
        showSiteFilter={false}
        onExport={handleExport}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      {!filteredOvertime || filteredOvertime.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No overtime records found"
            description={selectedSite ? `No overtime found for ${selectedSite.name}` : "Start tracking overtime hours and payments"}
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Overtime</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Extra Hours</TableHead>
                <TableHead>Rate/Hour</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOvertime.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell className="text-muted-foreground">{pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}</TableCell>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {record.worker.name}
                    </div>
                  </TableCell>
                  <TableCell>{record.site.name}</TableCell>
                  <TableCell>{record.extraHours} hrs</TableCell>
                  <TableCell>₹{record.rate.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">₹{record.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingOvertime ? 'Edit Overtime' : 'Add Overtime'}</DialogTitle>
              <DialogDescription>{editingOvertime ? 'Update overtime record' : 'Record overtime hours and pay'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workerId">Worker *</Label>
                <Select value={formData.workerId} onValueChange={(value) => setFormData({ ...formData, workerId: value })} required>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    {workers?.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteId">Site *</Label>
                <Select value={formData.siteId} onValueChange={(value) => setFormData({ ...formData, siteId: value })} required>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {activeSites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extraHours">Extra Hours *</Label>
                  <Input id="extraHours" type="number" step="0.5" value={formData.extraHours || ''} onChange={(e) => setFormData({ ...formData, extraHours: e.target.value ? parseFloat(e.target.value) : 0 })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate/Hour (₹) *</Label>
                  <Input id="rate" type="number" step="0.01" value={formData.rate || ''} onChange={(e) => setFormData({ ...formData, rate: e.target.value ? parseFloat(e.target.value) : 0 })} required />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">₹{totalAmount.toFixed(2)}</span>
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
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingOvertime ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
