import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PendingWorkWithRelations, PendingWorkInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'pending-work';

export type PaginatedPendingWork = {
  data: PendingWorkWithRelations[];
  pagination: PaginationInfo;
};

export type PendingWorkFilterParams = {
  siteId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchPendingWork(page: number = 1, limit: number = 10, filters: PendingWorkFilterParams = {}): Promise<PaginatedPendingWork> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.status) params.set('status', filters.status);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/pending-work?${params.toString()}`);
  const result: PaginatedResponse<PendingWorkWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch pending work');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createPendingWork(data: PendingWorkInput): Promise<PendingWorkWithRelations> {
  const payload = {
    ...data,
    expectedCompletionDate: data.expectedCompletionDate ? dateStringToISO(data.expectedCompletionDate) : undefined,
    actualCompletionDate: data.actualCompletionDate ? dateStringToISO(data.actualCompletionDate) : undefined,
  };
  const response = await fetch('/api/pending-work', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create pending work');
  }
  return result.data;
}

async function updatePendingWork(id: string, data: PendingWorkInput): Promise<PendingWorkWithRelations> {
  const payload = {
    ...data,
    expectedCompletionDate: data.expectedCompletionDate ? dateStringToISO(data.expectedCompletionDate) : undefined,
    actualCompletionDate: data.actualCompletionDate ? dateStringToISO(data.actualCompletionDate) : undefined,
  };
  const response = await fetch(`/api/pending-work/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update pending work');
  }
  return result.data;
}

async function deletePendingWork(id: string): Promise<void> {
  const response = await fetch(`/api/pending-work/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete pending work');
  }
}

export function usePendingWork(page: number = 1, limit: number = 10, filters: PendingWorkFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchPendingWork(page, limit, filters),
  });
}

export function useCreatePendingWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPendingWork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdatePendingWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PendingWorkInput }) =>
      updatePendingWork(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeletePendingWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePendingWork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all pending work for export with filters
export type ExportPendingWorkParams = {
  siteId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllPendingWorkForExport(params: ExportPendingWorkParams = {}): Promise<PendingWorkWithRelations[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.siteId) searchParams.set('siteId', params.siteId);
  if (params.status) searchParams.set('status', params.status);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/pending-work?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch pending work for export');
  }
  return result.data;
}
