'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/useExpenses';
import type { ExpenseInput, Expense } from '@/lib/types';
import { ExpenseCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseInput>({
    category: ExpenseCategory.OFFICE,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    billUrl: '',
    notes: '',
  });

  const { data: expenses, isLoading, error, refetch } = useExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date).toISOString().split('T')[0],
        billUrl: expense.billUrl || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: ExpenseCategory.OFFICE,
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        billUrl: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: ExpenseInput = {
      ...formData,
      billUrl: formData.billUrl || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({ id: editingExpense.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save expense:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete expense:', err);
      }
    }
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return category.replace('_', ' ');
  };

  if (isLoading) return <LoadingState message="Loading expenses..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track miscellaneous business expenses</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {!expenses || expenses.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No expenses found"
            description="Start tracking business expenses"
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bill</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(expense.category)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      {expense.description}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">₹{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {expense.billUrl ? (
                      <a href={expense.billUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
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
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
              <DialogDescription>{editingExpense ? 'Update expense record' : 'Record business expense'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ExpenseCategory.OFFICE}>Office</SelectItem>
                    <SelectItem value={ExpenseCategory.SITE_VISIT}>Site Visit</SelectItem>
                    <SelectItem value={ExpenseCategory.PARTY_VISIT}>Party Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What was this expense for?" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bill / Receipt</Label>
                <FileUpload
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={5}
                  label="Upload Bill"
                  currentUrl={formData.billUrl}
                  onUpload={(url) => setFormData({ ...formData, billUrl: url })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingExpense ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
