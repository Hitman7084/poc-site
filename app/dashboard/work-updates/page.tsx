'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, Video, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  useWorkUpdates,
  useCreateWorkUpdate,
  useUpdateWorkUpdate,
  useDeleteWorkUpdate,
  fetchAllWorkUpdatesForExport,
} from '@/hooks/useWorkUpdates';
import { useAllSites } from '@/hooks/useSites';
import { useHydrated } from '@/hooks/useHydration';
import type { WorkUpdateInput, WorkUpdateWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';

export default function WorkUpdatesPage() {
  const isHydrated = useHydrated();
  const [page, setPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<WorkUpdateWithRelations | null>(null);
  const [formData, setFormData] = useState<WorkUpdateInput>({
    siteId: '',
    date: '',
    description: '',
    photoUrl: '',
    videoUrl: '',
    createdBy: '',
  });

  // Initialize date after hydration
  useEffect(() => {
    if (isHydrated && !formData.date) {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isHydrated, formData.date]);

  const { data: updatesData, isLoading, error, refetch } = useWorkUpdates(page);
  const updates = updatesData?.data ?? [];
  const pagination = updatesData?.pagination;
  const { data: sites } = useAllSites();
  const activeSites = sites?.filter(s => s.isActive) || [];
  const createMutation = useCreateWorkUpdate();
  const updateMutation = useUpdateWorkUpdate();
  const deleteMutation = useDeleteWorkUpdate();

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSite, fromDate, toDate]);

  // Filter work updates by selected site and date range
  const filteredUpdates = useMemo(() => {
    if (!updates) return [];
    let filtered = updates;
    
    // Filter by site
    if (selectedSite) {
      filtered = filtered.filter(u => u.siteId === selectedSite.id);
    }
    
    // Filter by date range
    filtered = filterByDateRange(filtered, (u) => u.date, fromDate, toDate);
    
    return filtered;
  }, [updates, selectedSite, fromDate, toDate]);

  const handleOpenDialog = (update?: WorkUpdateWithRelations) => {
    if (update) {
      setEditingUpdate(update);
      setFormData({
        siteId: update.siteId,
        date: new Date(update.date).toISOString().split('T')[0],
        description: update.description,
        photoUrl: update.photoUrl || '',
        videoUrl: update.videoUrl || '',
        createdBy: update.createdBy || '',
      });
    } else {
      setEditingUpdate(null);
      setFormData({
        siteId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        photoUrl: '',
        videoUrl: '',
        createdBy: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: WorkUpdateInput = {
      ...formData,
      photoUrl: formData.photoUrl || undefined,
      videoUrl: formData.videoUrl || undefined,
      createdBy: formData.createdBy || undefined,
    };

    try {
      if (editingUpdate) {
        await updateMutation.mutateAsync({ id: editingUpdate.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save work update:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this work update?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete work update:', err);
      }
    }
  };

  // Handle export - fetches all data from API with filters from ExportToExcel component
  const handleExport = async (filters: ExportFilters) => {
    try {
      // Build siteId from selectedSiteIds - use first selected site or undefined
      const siteId = filters.selectedSiteIds.length > 0 ? filters.selectedSiteIds[0] : undefined;
      
      // Fetch all work updates with filters from API
      const dataToExport = await fetchAllWorkUpdatesForExport({
        siteId,
        fromDate: filters.fromDate?.toISOString().split('T')[0],
        toDate: filters.toDate?.toISOString().split('T')[0],
      });

      await exportToExcel(dataToExport, {
        filename: 'work_updates',
        sheetName: 'Work Updates',
        columns: [
          { header: 'Date', accessor: (u) => formatDate(u.date) },
          { header: 'Site', accessor: (u) => u.site.name },
          { header: 'Description', accessor: 'description' },
          { header: 'Photo URL', accessor: (u) => u.photoUrl || '' },
          { header: 'Video URL', accessor: (u) => u.videoUrl || '' },
          { header: 'Created By', accessor: (u) => u.createdBy || '' },
          { header: 'Created At', accessor: (u) => formatDate(u.createdAt) },
        ],
      });
      toast.success(`Exported ${dataToExport.length} work updates to Excel`);
    } catch (err) {
      console.error('Failed to export work updates:', err);
      toast.error('Failed to export work updates');
    }
  };

  if (isLoading) return <LoadingState message="Loading work updates..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <ImageIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Work Updates</h1>
            <p className="text-sm text-muted-foreground">Daily progress with photos and videos</p>
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
            Add Update
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

      {!filteredUpdates || filteredUpdates.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No work updates found"
            description={selectedSite ? `No updates found for ${selectedSite.name}` : "Start documenting daily progress"}
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Update</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-xs w-12">S.No</TableHead>
                  <TableHead className="h-9 text-xs">Date</TableHead>
                  <TableHead className="h-9 text-xs">Site</TableHead>
                  <TableHead className="h-9 text-xs">Description</TableHead>
                  <TableHead className="h-9 text-xs">Photo</TableHead>
                  <TableHead className="h-9 text-xs">Video</TableHead>
                  <TableHead className="h-9 text-xs">Created By</TableHead>
                  <TableHead className="h-9 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpdates.map((update, index) => (
                  <TableRow key={update.id}>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {formatDate(update.date)}
                    </TableCell>
                    <TableCell className="py-2 font-medium text-sm">{update.site.name}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground max-w-xs truncate">
                      {update.description}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {update.photoUrl ? (
                        <a 
                          href={update.photoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ImageIcon className="h-4 w-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {update.videoUrl ? (
                        <a 
                          href={update.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Video className="h-4 w-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {update.createdBy || '-'}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(update)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(update.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUpdate ? 'Edit Work Update' : 'Add Work Update'}</DialogTitle>
              <DialogDescription>{editingUpdate ? 'Update progress report' : 'Document daily work progress'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the work completed..." rows={4} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL (Google Drive)</Label>
                <Input id="photoUrl" type="url" value={formData.photoUrl} onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })} placeholder="https://drive.google.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL (Google Drive)</Label>
                <Input id="videoUrl" type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://drive.google.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdBy">Created By</Label>
                <Input id="createdBy" value={formData.createdBy} onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })} placeholder="Your name" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingUpdate ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
