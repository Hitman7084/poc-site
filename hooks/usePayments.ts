import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Payment, PaymentInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';import { dateStringToISO } from '@/lib/api-utils';
const QUERY_KEY = 'payments';

export type PaginatedPayments = {
  data: Payment[];
  pagination: PaginationInfo;
};

export type PaymentsFilterParams = {
  fromDate?: string;
  toDate?: string;
  paymentType?: string;
};

async function fetchPayments(
  page: number = 1, 
  limit: number = 10,
  filters: PaymentsFilterParams = {}
): Promise<PaginatedPayments> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.paymentType && filters.paymentType !== 'all') params.set('paymentType', filters.paymentType);
  
  const response = await fetch(`/api/payments?${params.toString()}`);
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
    paymentDate: dateStringToISO(data.paymentDate),
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
    paymentDate: dateStringToISO(data.paymentDate),
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

export function usePayments(page: number = 1, limit: number = 10, filters: PaymentsFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchPayments(page, limit, filters),
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
  paymentType?: string;
};

export async function fetchAllPaymentsForExport(params: ExportPaymentsParams = {}): Promise<Payment[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  if (params.paymentType && params.paymentType !== 'all') searchParams.set('paymentType', params.paymentType);
  
  const response = await fetch(`/api/payments?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch payments for export');
  }
  return result.data;
}
