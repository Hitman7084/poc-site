'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, Check, MapPin, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker, fetchAllWorkersForExport } from '@/hooks/useWorkers';
import { useAllSites } from '@/hooks/useSites';
import type { Worker, WorkerInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { exportToExcel, formatDate, formatCurrency, formatBoolean } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';

export default function WorkersPage() {
  const [page, setPage] = useState(1);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<{ id: string; name: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [sitesDropdownOpen, setSitesDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState<WorkerInput>({
    name: '',
    phone: '',
    email: '',
    role: '',
    dailyRate: undefined,
    isActive: true,
    assignedSites: '',
  });

  const { data, isLoading, error, refetch } = useWorkers(page);
  const workers = data?.data;
  const pagination = data?.pagination;
  const { data: sites } = useAllSites();
  const activeSites = sites?.filter(s => s.isActive) || [];
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker();
  const deleteMutation = useDeleteWorker();

  // Filter workers by selected site
  const filteredWorkers = useMemo(() => {
    if (!workers) return [];
    if (!selectedSiteFilter) return workers;
    
    return workers.filter(worker => {
      if (!worker.assignedSites) return false;
      const siteNames = worker.assignedSites.split(',').map(s => s.trim());
      return siteNames.includes(selectedSiteFilter.name);
    });
  }, [workers, selectedSiteFilter]);

  const handleOpenDialog = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name,
        phone: worker.phone || '',
        email: worker.email || '',
        role: worker.role || '',
        dailyRate: worker.dailyRate || undefined,
        isActive: worker.isActive,
        assignedSites: worker.assignedSites || '',
      });
      // Parse comma-separated site names to match with site IDs
      if (worker.assignedSites && activeSites.length > 0) {
        const siteNames = worker.assignedSites.split(',').map(s => s.trim());
        const matchedSiteIds = activeSites
          .filter(site => siteNames.includes(site.name))
          .map(site => site.id);
        setSelectedSiteIds(matchedSiteIds);
      } else {
        setSelectedSiteIds([]);
      }
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: '',
        dailyRate: undefined,
        isActive: true,
        assignedSites: '',
      });
      setSelectedSiteIds([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWorker(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the form errors');
      return;
    }

    setErrors({});

    // Convert selected site IDs to comma-separated site names
    const assignedSitesString = selectedSiteIds.length > 0
      ? selectedSiteIds.map(id => activeSites.find(s => s.id === id)?.name).filter(Boolean).join(', ')
      : undefined;

    const submitData: WorkerInput = {
      ...formData,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      role: formData.role || undefined,
      assignedSites: assignedSitesString,
    };

    try {
      if (editingWorker) {
        await updateMutation.mutateAsync({ id: editingWorker.id, data: submitData });
        toast.success('Worker updated successfully');
      } else {
        await createMutation.mutateAsync(submitData);
        toast.success('Worker created successfully');
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save worker:', err);
      toast.error(editingWorker ? 'Failed to update worker' : 'Failed to create worker');
    }
  };

  const handleDeleteClick = (id: string) => {
    setWorkerToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;

    try {
      await deleteMutation.mutateAsync(workerToDelete);
      toast.success('Worker deleted successfully');
      setDeleteConfirmOpen(false);
      setWorkerToDelete(null);
    } catch (err) {
      console.error('Failed to delete worker:', err);
      toast.error('Failed to delete worker');
    }
  };

  // Handle export - no date filtering for workers
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch ALL workers with optional site filter
      const allWorkers = await fetchAllWorkersForExport({
        siteId: selectedSiteFilter?.name, // Use site name for filtering
      });

      if (allWorkers.length === 0) {
        toast.error('No workers to export');
        return;
      }

      await exportToExcel(allWorkers, {
        filename: 'workers',
        sheetName: 'Workers',
        columns: [
          { header: 'Name', accessor: 'name' },
          { header: 'Role', accessor: (w) => w.role || '' },
          { header: 'Phone', accessor: (w) => w.phone || '' },
          { header: 'Email', accessor: (w) => w.email || '' },
          { header: 'Daily Rate', accessor: (w) => w.dailyRate ? formatCurrency(w.dailyRate) : '' },
          { header: 'Assigned Sites', accessor: (w) => w.assignedSites || '' },
          { header: 'Active', accessor: (w) => formatBoolean(w.isActive) },
          { header: 'Created At', accessor: (w) => formatDate(w.createdAt) },
        ],
      });
      toast.success(`Exported ${allWorkers.length} workers to Excel`);
    } catch (err) {
      console.error('Failed to export workers:', err);
      toast.error('Failed to export workers');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading workers..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Workers</h1>
            <p className="text-xs text-muted-foreground">Manage your construction workforce</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Site Filter Dropdown */}
          <Select 
            value={selectedSiteFilter?.id || 'all'} 
            onValueChange={(value) => setSelectedSiteFilter(value === 'all' ? null : activeSites.find(s => s.id === value) || null)}
          >
            <SelectTrigger className="h-8 w-[180px] text-sm">
              <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {activeSites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-800">
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Export data monthly for backup</span>
            </div>
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={isExporting || !filteredWorkers || filteredWorkers.length === 0}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm" className="h-8">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Worker
          </Button>
        </div>
      </div>

      {!filteredWorkers || filteredWorkers.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No workers found"
            description={selectedSiteFilter ? `No workers assigned to ${selectedSiteFilter.name}` : "Get started by adding your first worker"}
            action={
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Worker
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-xs w-12">S.No</TableHead>
                  <TableHead className="h-9 text-xs">Name</TableHead>
                  <TableHead className="h-9 text-xs">Role</TableHead>
                  <TableHead className="h-9 text-xs">Phone</TableHead>
                  <TableHead className="h-9 text-xs">Daily Rate</TableHead>
                  <TableHead className="h-9 text-xs">Assigned Sites</TableHead>
                  <TableHead className="h-9 text-xs">Status</TableHead>
                  <TableHead className="h-9 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker, index) => (
                  <TableRow key={worker.id}>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                    </TableCell>
                    <TableCell className="py-2 font-medium text-sm">{worker.name}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{worker.role || '-'}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{worker.phone || '-'}</TableCell>
                    <TableCell className="py-2 text-sm">
                      {worker.dailyRate ? `₹${worker.dailyRate.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground max-w-[150px] truncate" title={worker.assignedSites || ''}>
                      {worker.assignedSites || '-'}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant={worker.isActive ? 'default' : 'secondary'} className="text-xs h-5">
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(worker)}
                          aria-label="Edit worker"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteClick(worker.id)}
                          aria-label="Delete worker"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingWorker ? 'Edit Worker' : 'Add Worker'}
              </DialogTitle>
              <DialogDescription>
                {editingWorker
                  ? 'Update worker information'
                  : 'Add a new worker to your team'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  required
                  className={errors.name ? 'border-destructive' : ''}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="e.g., Mason, Carpenter, Laborer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="123-456-7890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="worker@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate (₹)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  value={formData.dailyRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyRate: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedSites">Assigned Sites</Label>
                <Popover open={sitesDropdownOpen} onOpenChange={setSitesDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedSiteIds.length === 0
                          ? 'Select sites...'
                          : selectedSiteIds.length === 1
                          ? activeSites.find(s => s.id === selectedSiteIds[0])?.name
                          : `${selectedSiteIds.length} sites selected`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <ScrollArea className="h-[250px]">
                      <div className="p-2">
                        {activeSites.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">No active sites available</p>
                        ) : (
                          activeSites.map((site) => (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() => {
                                setSelectedSiteIds(prev =>
                                  prev.includes(site.id)
                                    ? prev.filter(id => id !== site.id)
                                    : [...prev, site.id]
                                );
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent cursor-pointer",
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
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select the sites this worker is assigned to
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingWorker
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Worker"
        description="Are you sure you want to delete this worker? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
