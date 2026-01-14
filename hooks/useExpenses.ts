import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Expense, ExpenseInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'expenses';

async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch('/api/expenses');
  const result: ApiResponse<Expense[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch expenses');
  }
  return result.data;
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
  const result: ApiResponse<Expense> = await response.json();
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
  const result: ApiResponse<Expense> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update expense');
  }
  return result.data;
}

async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete expense');
  }
}

export function useExpenses() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchExpenses,
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
