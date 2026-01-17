'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker } from '@/hooks/useWorkers';
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
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExportToExcel, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatCurrency, formatBoolean } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';

export default function WorkersPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<WorkerInput>({
    name: '',
    phone: '',
    email: '',
    role: '',
    dailyRate: undefined,
    isActive: true,
  });

  const { data, isLoading, error, refetch } = useWorkers(page);
  const workers = data?.data;
  const pagination = data?.pagination;
  const createMutation = useCreateWorker();
  const updateMutation = useUpdateWorker();
  const deleteMutation = useDeleteWorker();

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
      });
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: '',
        dailyRate: undefined,
        isActive: true,
      });
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

    const submitData: WorkerInput = {
      ...formData,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      role: formData.role || undefined,
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

  // Handle export - filters param ignored for workers since they don't have date-based filtering
  const handleExport = async (_filters: ExportFilters) => {
    if (!workers) return;

    // Workers don't have dates, so we export all workers
    await exportToExcel(workers, {
      filename: 'workers',
      sheetName: 'Workers',
      columns: [
        { header: 'Name', accessor: 'name' },
        { header: 'Role', accessor: (w) => w.role || '' },
        { header: 'Phone', accessor: (w) => w.phone || '' },
        { header: 'Email', accessor: (w) => w.email || '' },
        { header: 'Daily Rate', accessor: (w) => w.dailyRate ? formatCurrency(w.dailyRate) : '' },
        { header: 'Active', accessor: (w) => formatBoolean(w.isActive) },
        { header: 'Created At', accessor: (w) => formatDate(w.createdAt) },
      ],
    });
    toast.success(`Exported ${workers.length} workers to Excel`);
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
        <Button onClick={() => handleOpenDialog()} size="sm" className="h-8">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Worker
        </Button>
      </div>

      {/* Export Section */}
      <ExportToExcel
        showSiteFilter={false}
        onExport={handleExport}
      />

      {!workers || workers.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No workers found"
            description="Get started by adding your first worker"
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
                  <TableHead className="h-9 text-xs">Email</TableHead>
                  <TableHead className="h-9 text-xs">Daily Rate</TableHead>
                  <TableHead className="h-9 text-xs">Status</TableHead>
                  <TableHead className="h-9 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker, index) => (
                  <TableRow key={worker.id}>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                    </TableCell>
                    <TableCell className="py-2 font-medium text-sm">{worker.name}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{worker.role || '-'}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{worker.phone || '-'}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{worker.email || '-'}</TableCell>
                    <TableCell className="py-2 text-sm">
                      {worker.dailyRate ? `₹${worker.dailyRate.toFixed(2)}` : '-'}
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
