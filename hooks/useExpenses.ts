import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Expense, ExpenseInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'expenses';

export type PaginatedExpenses = {
  data: Expense[];
  pagination: PaginationInfo;
};

export type ExpenseFilterParams = {
  siteId?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchExpenses(page: number = 1, limit: number = 10, filters: ExpenseFilterParams = {}): Promise<PaginatedExpenses> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.category) params.set('category', filters.category);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/expenses?${params.toString()}`);
  const result: PaginatedResponse<Expense> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch expenses');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createExpense(data: ExpenseInput): Promise<Expense> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create expense');
  }
  return result.data;
}

async function updateExpense(id: string, data: ExpenseInput): Promise<Expense> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update expense');
  }
  return result.data;
}

async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete expense');
  }
}

export function useExpenses(page: number = 1, limit: number = 10, filters: ExpenseFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchExpenses(page, limit, filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseInput }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all expenses for export with filters
export type ExportExpensesParams = {
  category?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllExpensesForExport(params: ExportExpensesParams = {}): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.category && params.category !== 'all') searchParams.set('category', params.category);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/expenses?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch expenses for export');
  }
  return result.data;
}
