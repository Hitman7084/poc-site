import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DispatchWithRelations, DispatchInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'dispatch';

export type PaginatedDispatches = {
  data: DispatchWithRelations[];
  pagination: PaginationInfo;
};

async function fetchDispatches(page: number = 1, limit: number = 10): Promise<PaginatedDispatches> {
  const response = await fetch(`/api/dispatch?page=${page}&limit=${limit}`);
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
    dispatchDate: new Date(data.dispatchDate).toISOString(),
    receivedDate: data.receivedDate ? new Date(data.receivedDate).toISOString() : undefined,
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
    dispatchDate: new Date(data.dispatchDate).toISOString(),
    receivedDate: data.receivedDate ? new Date(data.receivedDate).toISOString() : undefined,
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

export function useDispatches(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchDispatches(page, limit),
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
