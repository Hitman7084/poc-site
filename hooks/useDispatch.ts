import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DispatchWithRelations, DispatchInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'dispatch';

export type PaginatedDispatches = {
  data: DispatchWithRelations[];
  pagination: PaginationInfo;
};

export type DispatchFilterParams = {
  fromSiteId?: string;
  toSiteId?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchDispatches(page: number = 1, limit: number = 10, filters: DispatchFilterParams = {}): Promise<PaginatedDispatches> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.fromSiteId) params.set('fromSiteId', filters.fromSiteId);
  if (filters.toSiteId) params.set('toSiteId', filters.toSiteId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/dispatch?${params.toString()}`);
  const result: PaginatedResponse<DispatchWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch dispatches');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createDispatch(data: DispatchInput): Promise<DispatchWithRelations> {
  const payload = {
    ...data,
    dispatchDate: dateStringToISO(data.dispatchDate),
    receivedDate: data.receivedDate ? dateStringToISO(data.receivedDate) : undefined,
  };
  const response = await fetch('/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create dispatch');
  }
  return result.data;
}

async function updateDispatch(id: string, data: DispatchInput): Promise<DispatchWithRelations> {
  const payload = {
    ...data,
    dispatchDate: dateStringToISO(data.dispatchDate),
    receivedDate: data.receivedDate ? dateStringToISO(data.receivedDate) : undefined,
  };
  const response = await fetch(`/api/dispatch/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update dispatch');
  }
  return result.data;
}

async function deleteDispatch(id: string): Promise<void> {
  const response = await fetch(`/api/dispatch/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete dispatch');
  }
}

export function useDispatches(page: number = 1, limit: number = 10, filters: DispatchFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchDispatches(page, limit, filters),
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DispatchInput }) =>
      updateDispatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all dispatches for export with filters
export type ExportDispatchParams = {
  fromSiteId?: string;
  toSiteId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllDispatchesForExport(params: ExportDispatchParams = {}): Promise<DispatchWithRelations[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.fromSiteId) searchParams.set('fromSiteId', params.fromSiteId);
  if (params.toSiteId) searchParams.set('toSiteId', params.toSiteId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/dispatch?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch dispatches for export');
  }
  return result.data;
}
