import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Payment, PaymentInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'payments';

export type PaginatedPayments = {
  data: Payment[];
  pagination: PaginationInfo;
};

async function fetchPayments(page: number = 1, limit: number = 10): Promise<PaginatedPayments> {
  const response = await fetch(`/api/payments?page=${page}&limit=${limit}`);
  const result: PaginatedResponse<Payment> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch payments');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createPayment(data: PaymentInput): Promise<Payment> {
  const payload = {
    ...data,
    paymentDate: new Date(data.paymentDate).toISOString(),
  };
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create payment');
  }
  return result.data;
}

async function updatePayment(id: string, data: PaymentInput): Promise<Payment> {
  const payload = {
    ...data,
    paymentDate: new Date(data.paymentDate).toISOString(),
  };
  const response = await fetch(`/api/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update payment');
  }
  return result.data;
}

async function deletePayment(id: string): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete payment');
  }
}

export function usePayments(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchPayments(page, limit),
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

// Export function to fetch all payments for export with filters
export type ExportPaymentsParams = {
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllPaymentsForExport(params: ExportPaymentsParams = {}): Promise<Payment[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/payments?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch payments for export');
  }
  return result.data;
}
