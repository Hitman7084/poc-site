import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Expense, ExpenseInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'expenses';

export type PaginatedExpenses = {
  data: Expense[];
  pagination: PaginationInfo;
};

async function fetchExpenses(page: number = 1, limit: number = 10): Promise<PaginatedExpenses> {
  const response = await fetch(`/api/expenses?page=${page}&limit=${limit}`);
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
    date: new Date(data.date).toISOString(),
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
    date: new Date(data.date).toISOString(),
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

export function useExpenses(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchExpenses(page, limit),
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
