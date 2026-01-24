import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkUpdateWithRelations, WorkUpdateInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'work-updates';

export type PaginatedWorkUpdates = {
  data: WorkUpdateWithRelations[];
  pagination: PaginationInfo;
};

export type WorkUpdateFilterParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchWorkUpdates(page: number = 1, limit: number = 10, filters: WorkUpdateFilterParams = {}): Promise<PaginatedWorkUpdates> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/work-updates?${params.toString()}`);
  const result: PaginatedResponse<WorkUpdateWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch work updates');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createWorkUpdate(data: WorkUpdateInput): Promise<WorkUpdateWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch('/api/work-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create work update');
  }
  return result.data;
}

async function updateWorkUpdate(id: string, data: WorkUpdateInput): Promise<WorkUpdateWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch(`/api/work-updates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update work update');
  }
  return result.data;
}

async function deleteWorkUpdate(id: string): Promise<void> {
  const response = await fetch(`/api/work-updates/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete work update');
  }
}

export function useWorkUpdates(page: number = 1, limit: number = 10, filters: WorkUpdateFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchWorkUpdates(page, limit, filters),
  });
}

export function useCreateWorkUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateWorkUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkUpdateInput }) =>
      updateWorkUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteWorkUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all work updates for export with filters
export type ExportWorkUpdatesParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllWorkUpdatesForExport(params: ExportWorkUpdatesParams = {}): Promise<WorkUpdateWithRelations[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.siteId) searchParams.set('siteId', params.siteId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/work-updates?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch work updates for export');
  }
  return result.data;
}
