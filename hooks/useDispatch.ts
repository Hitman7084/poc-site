import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DispatchWithRelations, DispatchInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'dispatch';

async function fetchDispatches(): Promise<DispatchWithRelations[]> {
  const response = await fetch('/api/dispatch');
  const result: ApiResponse<DispatchWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch dispatches');
  }
  return result.data;
}

async function createDispatch(data: DispatchInput): Promise<DispatchWithRelations> {
  const response = await fetch('/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<DispatchWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create dispatch');
  }
  return result.data;
}

async function updateDispatch(id: string, data: DispatchInput): Promise<DispatchWithRelations> {
  const response = await fetch(`/api/dispatch/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<DispatchWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update dispatch');
  }
  return result.data;
}

async function deleteDispatch(id: string): Promise<void> {
  const response = await fetch(`/api/dispatch/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete dispatch');
  }
}

export function useDispatches() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchDispatches,
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
