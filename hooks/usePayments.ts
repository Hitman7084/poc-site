import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Payment, PaymentInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'payments';

async function fetchPayments(): Promise<Payment[]> {
  const response = await fetch('/api/payments');
  const result: ApiResponse<Payment[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch payments');
  }
  return result.data;
}

async function createPayment(data: PaymentInput): Promise<Payment> {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Payment> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create payment');
  }
  return result.data;
}

async function updatePayment(id: string, data: PaymentInput): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Payment> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update payment');
  }
  return result.data;
}

async function deletePayment(id: string): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete payment');
  }
}

export function usePayments() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchPayments,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentInput }) =>
      updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
