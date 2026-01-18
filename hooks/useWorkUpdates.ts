import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkUpdateWithRelations, WorkUpdateInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'work-updates';

export type PaginatedWorkUpdates = {
  data: WorkUpdateWithRelations[];
  pagination: PaginationInfo;
};

async function fetchWorkUpdates(page: number = 1, limit: number = 10): Promise<PaginatedWorkUpdates> {
  const response = await fetch(`/api/work-updates?page=${page}&limit=${limit}`);
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
    date: new Date(data.date).toISOString(),
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
    date: new Date(data.date).toISOString(),
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

export function useWorkUpdates(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchWorkUpdates(page, limit),
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
