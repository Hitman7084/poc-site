'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '@/hooks/usePayments';
import type { PaymentInput, Payment } from '@/lib/types';
import { PaymentType } from '@/lib/types';
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
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatCurrency } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<PaymentInput>({
    clientName: '',
    paymentType: PaymentType.ADVANCE,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    documentUrl: '',
    projectName: '',
    notes: '',
  });

  const { data: paymentsData, isLoading, error, refetch } = usePayments(page);
  const payments = paymentsData?.data ?? [];
  const pagination = paymentsData?.pagination;
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const deleteMutation = useDeletePayment();

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        clientName: payment.clientName,
        paymentType: payment.paymentType,
        amount: payment.amount,
        paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
        documentUrl: payment.documentUrl || '',
        projectName: payment.projectName || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        clientName: '',
        paymentType: PaymentType.ADVANCE,
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        documentUrl: '',
        projectName: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: PaymentInput = {
      ...formData,
      documentUrl: formData.documentUrl || undefined,
      projectName: formData.projectName || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingPayment) {
        await updateMutation.mutateAsync({ id: editingPayment.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save payment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete payment:', err);
      }
    }
  };

  const getPaymentTypeBadge = (type: PaymentType) => {
    const variants: Record<PaymentType, 'default' | 'secondary' | 'outline'> = {
      ADVANCE: 'default',
      DURING: 'secondary',
      FINAL: 'outline',
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  // Handle export
  const handleExport = async (filters: ExportFilters) => {
    if (!payments) return;

    let dataToExport = [...payments];

    // Apply date range filter
    dataToExport = filterByDateRange(
      dataToExport,
      (p) => p.paymentDate,
      filters.fromDate,
      filters.toDate
    );

    await exportToExcel(dataToExport, {
      filename: 'payments',
      sheetName: 'Payments',
      columns: [
        { header: 'Payment Date', accessor: (p) => formatDate(p.paymentDate) },
        { header: 'Client Name', accessor: 'clientName' },
        { header: 'Project Name', accessor: (p) => p.projectName || '' },
        { header: 'Payment Type', accessor: 'paymentType' },
        { header: 'Amount', accessor: (p) => formatCurrency(p.amount) },
        { header: 'Document URL', accessor: (p) => p.documentUrl || '' },
        { header: 'Notes', accessor: (p) => p.notes || '' },
        { header: 'Created At', accessor: (p) => formatDate(p.createdAt) },
      ],
    });
    toast.success(`Exported ${dataToExport.length} payment records to Excel`);
  };

  if (isLoading) return <LoadingState message="Loading payments..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">Track client payments and invoices</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Export Section */}
      <ExportToExcel
        showSiteFilter={false}
        onExport={handleExport}
      />

      {!payments || payments.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No payment records found"
            description="Start tracking client payments"
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Payment</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Document</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">{pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}</TableCell>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {payment.clientName}
                    </div>
                  </TableCell>
                  <TableCell>{payment.projectName || '-'}</TableCell>
                  <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                  <TableCell className="font-semibold">₹{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {payment.documentUrl ? (
                      <a href={payment.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <FileText className="h-3 w-3" />View
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(payment)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(payment.id)}>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
              <DialogDescription>{editingPayment ? 'Update payment record' : 'Record client payment'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input id="clientName" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input id="projectName" value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} placeholder="Optional" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <Select value={formData.paymentType} onValueChange={(value) => setFormData({ ...formData, paymentType: value as PaymentType })} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentType.ADVANCE}>Advance</SelectItem>
                      <SelectItem value={PaymentType.DURING}>During</SelectItem>
                      <SelectItem value={PaymentType.FINAL}>Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input id="paymentDate" type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentUrl">Receipt / Invoice URL (Google Drive)</Label>
                <Input id="documentUrl" type="url" value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} placeholder="https://drive.google.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingPayment ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
