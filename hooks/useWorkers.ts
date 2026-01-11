import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Worker, WorkerInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'workers';

async function fetchWorkers(): Promise<Worker[]> {
  const response = await fetch('/api/workers');
  const result: ApiResponse<Worker[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch workers');
  }
  return result.data;
}

async function createWorker(data: WorkerInput): Promise<Worker> {
  const response = await fetch('/api/workers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Worker> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create worker');
  }
  return result.data;
}

async function updateWorker(id: string, data: WorkerInput): Promise<Worker> {
  const response = await fetch(`/api/workers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Worker> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update worker');
  }
  return result.data;
}

async function deleteWorker(id: string): Promise<void> {
  const response = await fetch(`/api/workers/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete worker');
  }
}

export function useWorkers() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchWorkers,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkerInput }) =>
      updateWorker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
