import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PendingWorkWithRelations, PendingWorkInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'pending-work';

async function fetchPendingWork(): Promise<PendingWorkWithRelations[]> {
  const response = await fetch('/api/pending-work');
  const result: ApiResponse<PendingWorkWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch pending work');
  }
  return result.data;
}

async function createPendingWork(data: PendingWorkInput): Promise<PendingWorkWithRelations> {
  const payload = {
    ...data,
    expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate).toISOString() : undefined,
    actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate).toISOString() : undefined,
  };
  const response = await fetch('/api/pending-work', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result: ApiResponse<PendingWorkWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create pending work');
  }
  return result.data;
}

async function updatePendingWork(id: string, data: PendingWorkInput): Promise<PendingWorkWithRelations> {
  const payload = {
    ...data,
    expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate).toISOString() : undefined,
    actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate).toISOString() : undefined,
  };
  const response = await fetch(`/api/pending-work/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result: ApiResponse<PendingWorkWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update pending work');
  }
  return result.data;
}

async function deletePendingWork(id: string): Promise<void> {
  const response = await fetch(`/api/pending-work/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete pending work');
  }
}

export function usePendingWork() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchPendingWork,
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
