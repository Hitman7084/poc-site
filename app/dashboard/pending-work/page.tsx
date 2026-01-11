'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  usePendingWork,
  useCreatePendingWork,
  useUpdatePendingWork,
  useDeletePendingWork,
} from '@/hooks/usePendingWork';
import { useSites } from '@/hooks/useSites';
import type { PendingWorkInput, PendingWorkWithRelations } from '@/lib/types';
import { PendingWorkStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function PendingWorkPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<PendingWorkWithRelations | null>(null);
  const [formData, setFormData] = useState<PendingWorkInput>({
    siteId: '',
    taskDescription: '',
    reasonForPending: '',
    expectedCompletionDate: '',
    actualCompletionDate: '',
    status: PendingWorkStatus.PENDING,
    priority: 'Medium',
    assignedTo: '',
    notes: '',
  });

  const { data: pendingWork, isLoading, error, refetch } = usePendingWork();
  const { data: sites } = useSites();
  const createMutation = useCreatePendingWork();
  const updateMutation = useUpdatePendingWork();
  const deleteMutation = useDeletePendingWork();

  const handleOpenDialog = (work?: PendingWorkWithRelations) => {
    if (work) {
      setEditingWork(work);
      setFormData({
        siteId: work.siteId,
        taskDescription: work.taskDescription,
        reasonForPending: work.reasonForPending,
        expectedCompletionDate: work.expectedCompletionDate ? new Date(work.expectedCompletionDate).toISOString().split('T')[0] : '',
        actualCompletionDate: work.actualCompletionDate ? new Date(work.actualCompletionDate).toISOString().split('T')[0] : '',
        status: work.status,
        priority: work.priority || 'Medium',
        assignedTo: work.assignedTo || '',
        notes: work.notes || '',
      });
    } else {
      setEditingWork(null);
      setFormData({
        siteId: '',
        taskDescription: '',
        reasonForPending: '',
        expectedCompletionDate: '',
        actualCompletionDate: '',
        status: PendingWorkStatus.PENDING,
        priority: 'Medium',
        assignedTo: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: PendingWorkInput = {
      ...formData,
      expectedCompletionDate: formData.expectedCompletionDate || undefined,
      actualCompletionDate: formData.actualCompletionDate || undefined,
      priority: formData.priority || undefined,
      assignedTo: formData.assignedTo || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingWork) {
        await updateMutation.mutateAsync({ id: editingWork.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save pending work:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete pending work:', err);
      }
    }
  };

  const getStatusBadge = (status: PendingWorkStatus) => {
    const config = {
      PENDING: { variant: 'destructive' as const, icon: AlertCircle },
      IN_PROGRESS: { variant: 'secondary' as const, icon: Clock },
      COMPLETED: { variant: 'default' as const, icon: CheckCircle2 },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant}>
        <Icon className="mr-1 h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.Medium}`}>{priority}</span>;
  };

  if (isLoading) return <LoadingState message="Loading pending work..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Work</h1>
          <p className="text-muted-foreground">Track incomplete and pending tasks</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {!pendingWork || pendingWork.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No pending tasks found"
            description="Track tasks that need attention"
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Task</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingWork.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="line-clamp-2">{work.taskDescription}</div>
                    <div className="text-xs text-muted-foreground mt-1">{work.reasonForPending}</div>
                  </TableCell>
                  <TableCell>{work.site.name}</TableCell>
                  <TableCell>{getPriorityBadge(work.priority || 'Medium')}</TableCell>
                  <TableCell>{work.assignedTo || '-'}</TableCell>
                  <TableCell>
                    {work.expectedCompletionDate
                      ? new Date(work.expectedCompletionDate).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(work.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(work)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(work.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingWork ? 'Edit Pending Task' : 'Add Pending Task'}</DialogTitle>
              <DialogDescription>{editingWork ? 'Update task details' : 'Record incomplete or pending work'}</DialogDescription>
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
                <Label htmlFor="taskDescription">Task Description *</Label>
                <Textarea id="taskDescription" value={formData.taskDescription} onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })} placeholder="Describe the pending task..." rows={3} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForPending">Reason for Pending *</Label>
                <Textarea id="reasonForPending" value={formData.reasonForPending} onChange={(e) => setFormData({ ...formData, reasonForPending: e.target.value })} placeholder="Why is this task pending?" rows={2} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as PendingWorkStatus })} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PendingWorkStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={PendingWorkStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={PendingWorkStatus.COMPLETED}>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input id="assignedTo" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} placeholder="Worker or team name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedCompletionDate">Expected Completion</Label>
                  <Input id="expectedCompletionDate" type="date" value={formData.expectedCompletionDate} onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualCompletionDate">Actual Completion</Label>
                  <Input id="actualCompletionDate" type="date" value={formData.actualCompletionDate} onChange={(e) => setFormData({ ...formData, actualCompletionDate: e.target.value })} />
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
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingWork ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
