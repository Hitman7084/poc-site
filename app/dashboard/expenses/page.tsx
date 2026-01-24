'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  fetchAllExpensesForExport,
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
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatCurrency } from '@/lib/export-utils';
import { formatDateForAPI } from '@/lib/api-utils';
import { Pagination } from '@/components/Pagination';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
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

  const filterParams = {
    siteId: selectedSite?.id,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    fromDate: formatDateForAPI(fromDate),
    toDate: formatDateForAPI(toDate),
  };

  const { data, isLoading, error, refetch } = useExpenses(page, 10, filterParams);
  const expenses = data?.data;
  const pagination = data?.pagination;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, fromDate, toDate]);

  // No client-side filtering needed - all filtering is done server-side
  const filteredExpenses = expenses || [];

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

  // Handle export - fetches all data from API with filters matching display
  const handleExport = async (filters: ExportFilters) => {
    try {
      // Fetch all expenses with filters from API - use page state, not ExportFilters
      const dataToExport = await fetchAllExpensesForExport({
        category: selectedCategory,
        fromDate: fromDate?.toISOString().split('T')[0],
        toDate: toDate?.toISOString().split('T')[0],
      });

      await exportToExcel(dataToExport, {
      filename: 'expenses',
      sheetName: 'Expenses',
      columns: [
        { header: 'Date', accessor: (e) => formatDate(e.date) },
        { header: 'Category', accessor: (e) => getCategoryLabel(e.category) },
        { header: 'Description', accessor: 'description' },
        { header: 'Amount', accessor: (e) => formatCurrency(e.amount) },
        { header: 'Bill URL', accessor: (e) => e.billUrl || '' },
        { header: 'Notes', accessor: (e) => e.notes || '' },
        { header: 'Created At', accessor: (e) => formatDate(e.createdAt) },
      ],
    });
    toast.success(`Exported ${dataToExport.length} expense records to Excel`);
    } catch (err) {
      console.error('Failed to export expenses:', err);
      toast.error('Failed to export expenses');
    }
  };

  if (isLoading) return <LoadingState message="Loading expenses..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <Receipt className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-sm text-muted-foreground">Track business and site expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Category Filter Dropdown */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <Receipt className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Expenses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expenses</SelectItem>
              <SelectItem value={ExpenseCategory.OFFICE}>Office</SelectItem>
              <SelectItem value={ExpenseCategory.SITE_VISIT}>Site Visit</SelectItem>
              <SelectItem value={ExpenseCategory.PARTY_VISIT}>Party Visit</SelectItem>
              <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
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

      {!filteredExpenses || filteredExpenses.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No expenses found"
            description={selectedCategory !== 'all' ? `No ${getCategoryLabel(selectedCategory as ExpenseCategory).toLowerCase()} expenses found` : "Start tracking business expenses"}
            action={<Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bill</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">{pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}</TableCell>
                  <TableCell>{formatDate(expense.date)}</TableCell>
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
                    <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
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
                  <Input id="amount" type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : 0 })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billUrl">Bill / Receipt URL (Google Drive)</Label>
                <Input id="billUrl" type="url" value={formData.billUrl} onChange={(e) => setFormData({ ...formData, billUrl: e.target.value })} placeholder="https://drive.google.com/..." />
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
