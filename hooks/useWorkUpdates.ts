import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorkUpdateWithRelations, WorkUpdateInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'work-updates';

async function fetchWorkUpdates(): Promise<WorkUpdateWithRelations[]> {
  const response = await fetch('/api/work-updates');
  const result: ApiResponse<WorkUpdateWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch work updates');
  }
  return result.data;
}

async function createWorkUpdate(data: WorkUpdateInput): Promise<WorkUpdateWithRelations> {
  const response = await fetch('/api/work-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<WorkUpdateWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create work update');
  }
  return result.data;
}

async function updateWorkUpdate(id: string, data: WorkUpdateInput): Promise<WorkUpdateWithRelations> {
  const response = await fetch(`/api/work-updates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<WorkUpdateWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update work update');
  }
  return result.data;
}

async function deleteWorkUpdate(id: string): Promise<void> {
  const response = await fetch(`/api/work-updates/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete work update');
  }
}

export function useWorkUpdates() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchWorkUpdates,
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
