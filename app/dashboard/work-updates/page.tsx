'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import {
  useWorkUpdates,
  useCreateWorkUpdate,
  useUpdateWorkUpdate,
  useDeleteWorkUpdate,
} from '@/hooks/useWorkUpdates';
import { useSites } from '@/hooks/useSites';
import type { WorkUpdateInput, WorkUpdateWithRelations } from '@/lib/types';
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

export default function WorkUpdatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<WorkUpdateWithRelations | null>(null);
  const [formData, setFormData] = useState<WorkUpdateInput>({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    photoUrl: '',
    videoUrl: '',
    createdBy: '',
  });

  const { data: updates, isLoading, error, refetch } = useWorkUpdates();
  const { data: sites } = useSites();
  const createMutation = useCreateWorkUpdate();
  const updateMutation = useUpdateWorkUpdate();
  const deleteMutation = useDeleteWorkUpdate();

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

  if (isLoading) return <LoadingState message="Loading work updates..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <ImageIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Work Updates</h1>
            <p className="text-sm text-muted-foreground">Daily progress with photos and videos</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Update
        </Button>
      </div>

      {!updates || updates.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No work updates found"
            description="Start documenting daily progress"
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Update</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {updates.map((update) => (
            <Card key={update.id} className="overflow-hidden">
              {update.photoUrl && (
                <img src={update.photoUrl} alt="Work update" className="h-48 w-full object-cover" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{update.site.name}</h3>
                  <span className="text-sm text-muted-foreground">{new Date(update.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{update.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {update.photoUrl && <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />Photo</span>}
                  {update.videoUrl && <span className="flex items-center gap-1"><Video className="h-3 w-3" />Video</span>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(update)}>
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(update.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                    {sites?.map((site) => (
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
