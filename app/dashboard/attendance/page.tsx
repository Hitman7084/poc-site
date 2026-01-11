'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import {
  useAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '@/hooks/useAttendance';
import { useWorkers } from '@/hooks/useWorkers';
import { useSites } from '@/hooks/useSites';
import type { AttendanceInput, AttendanceWithRelations } from '@/lib/types';
import { AttendanceStatus } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function AttendancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceWithRelations | null>(null);
  const [formData, setFormData] = useState<AttendanceInput>({
    workerId: '',
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: AttendanceStatus.PRESENT,
    notes: '',
  });

  const { data: attendance, isLoading, error, refetch } = useAttendance();
  const { data: workers } = useWorkers();
  const { data: sites } = useSites();
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();

  const handleOpenDialog = (record?: AttendanceWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        workerId: record.workerId,
        siteId: record.siteId,
        date: new Date(record.date).toISOString().split('T')[0],
        checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : '',
        checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '',
        status: record.status,
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({
        workerId: '',
        siteId: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '',
        checkOut: '',
        status: AttendanceStatus.PRESENT,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: AttendanceInput = {
      ...formData,
      checkIn: formData.checkIn || undefined,
      checkOut: formData.checkOut || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save attendance:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete attendance:', err);
      }
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants: Record<AttendanceStatus, 'default' | 'destructive' | 'secondary'> = {
      PRESENT: 'default',
      ABSENT: 'destructive',
      HALF_DAY: 'secondary',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  if (isLoading) return <LoadingState message="Loading attendance..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track worker attendance at sites</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Mark Attendance
        </Button>
      </div>

      {!attendance || attendance.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No attendance records found"
            description="Start tracking attendance for your workers"
            action={
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.worker.name}</TableCell>
                  <TableCell>{record.site.name}</TableCell>
                  <TableCell>
                    {record.checkIn
                      ? new Date(record.checkIn).toLocaleTimeString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.checkOut
                      ? new Date(record.checkOut).toLocaleTimeString()
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(record)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                      >
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord
                  ? 'Update attendance record'
                  : 'Record worker attendance'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workerId">Worker *</Label>
                <Select
                  value={formData.workerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, workerId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers?.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteId">Site *</Label>
                <Select
                  value={formData.siteId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, siteId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as AttendanceStatus })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AttendanceStatus.PRESENT}>Present</SelectItem>
                    <SelectItem value={AttendanceStatus.ABSENT}>Absent</SelectItem>
                    <SelectItem value={AttendanceStatus.HALF_DAY}>Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check In</Label>
                  <Input
                    id="checkIn"
                    type="datetime-local"
                    value={formData.checkIn}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check Out</Label>
                  <Input
                    id="checkOut"
                    type="datetime-local"
                    value={formData.checkOut}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={2}
                />
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
                  : editingRecord
                  ? 'Update'
                  : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
