'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Truck, CheckCircle, XCircle } from 'lucide-react';
import {
  useDispatches,
  useCreateDispatch,
  useUpdateDispatch,
  useDeleteDispatch,
} from '@/hooks/useDispatch';
import { useSites } from '@/hooks/useSites';
import type { DispatchInput, DispatchWithRelations } from '@/lib/types';
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

export default function DispatchPage() {
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
  const { data: sites } = useSites();
  const createMutation = useCreateDispatch();
  const updateMutation = useUpdateDispatch();
  const deleteMutation = useDeleteDispatch();

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

  if (isLoading) return <LoadingState message="Loading dispatches..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispatch</h1>
          <p className="text-muted-foreground">Track material transfers between sites</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Dispatch
        </Button>
      </div>

      {!dispatches || dispatches.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No dispatch records found"
            description="Start tracking material transfers"
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />New Dispatch</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((dispatch) => (
                <TableRow key={dispatch.id}>
                  <TableCell>{new Date(dispatch.dispatchDate).toLocaleDateString()}</TableCell>
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
        </Card>
      )}

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
