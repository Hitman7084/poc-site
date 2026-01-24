import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OvertimeWithRelations, OvertimeInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'overtime';

export type PaginatedOvertime = {
  data: OvertimeWithRelations[];
  pagination: PaginationInfo;
};

export type OvertimeFilterParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchOvertime(page: number = 1, limit: number = 10, filters: OvertimeFilterParams = {}): Promise<PaginatedOvertime> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/overtime?${params.toString()}`);
  const result: PaginatedResponse<OvertimeWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch overtime');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createOvertime(data: OvertimeInput): Promise<OvertimeWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch('/api/overtime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create overtime');
  }
  return result.data;
}

async function updateOvertime(id: string, data: OvertimeInput): Promise<OvertimeWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch(`/api/overtime/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update overtime');
  }
  return result.data;
}

async function deleteOvertime(id: string): Promise<void> {
  const response = await fetch(`/api/overtime/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete overtime');
  }
}

export function useOvertime(page: number = 1, limit: number = 10, filters: OvertimeFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchOvertime(page, limit, filters),
  });
}

export function useCreateOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OvertimeInput }) =>
      updateOvertime(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all overtime for export with filters
export type ExportOvertimeParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllOvertimeForExport(params: ExportOvertimeParams = {}): Promise<OvertimeWithRelations[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.siteId) searchParams.set('siteId', params.siteId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/overtime?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch overtime for export');
  }
  return result.data;
}
