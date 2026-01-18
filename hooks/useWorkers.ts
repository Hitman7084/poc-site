import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Worker, WorkerInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'workers';

export type PaginatedWorkers = {
  data: Worker[];
  pagination: PaginationInfo;
};

async function fetchWorkers(page: number = 1, limit: number = 10): Promise<PaginatedWorkers> {
  const response = await fetch(`/api/workers?page=${page}&limit=${limit}`);
  const result: PaginatedResponse<Worker> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch workers');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function fetchAllWorkers(): Promise<Worker[]> {
  const response = await fetch(`/api/workers?all=true`);
  const result: PaginatedResponse<Worker> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch all workers');
  }
  return result.data;
}

export type ExportWorkersParams = {
  siteId?: string;
  isActive?: boolean;
};

export async function fetchAllWorkersForExport(params: ExportWorkersParams = {}): Promise<Worker[]> {
  const queryParams = new URLSearchParams({ all: 'true' });
  
  if (params.isActive !== undefined) {
    queryParams.append('isActive', String(params.isActive));
  }
  
  const response = await fetch(`/api/workers?${queryParams.toString()}`);
  const result: PaginatedResponse<Worker> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch workers for export');
  }
  
  // If siteId is provided, filter workers assigned to that site
  let workers = result.data;
  if (params.siteId) {
    workers = workers.filter(worker => 
      worker.assignedSites?.split(',').map(s => s.trim()).includes(params.siteId!)
    );
  }
  
  return workers;
}

async function createWorker(data: WorkerInput): Promise<Worker> {
  const response = await fetch('/api/workers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
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
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update worker');
  }
  return result.data;
}

async function deleteWorker(id: string): Promise<void> {
  const response = await fetch(`/api/workers/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete worker');
  }
}

export function useWorkers(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchWorkers(page, limit),
  });
}

export function useAllWorkers() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: fetchAllWorkers,
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
