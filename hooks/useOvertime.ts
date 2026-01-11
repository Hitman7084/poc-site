import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OvertimeWithRelations, OvertimeInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'overtime';

async function fetchOvertime(): Promise<OvertimeWithRelations[]> {
  const response = await fetch('/api/overtime');
  const result: ApiResponse<OvertimeWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch overtime');
  }
  return result.data;
}

async function createOvertime(data: OvertimeInput): Promise<OvertimeWithRelations> {
  const response = await fetch('/api/overtime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<OvertimeWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create overtime');
  }
  return result.data;
}

async function updateOvertime(id: string, data: OvertimeInput): Promise<OvertimeWithRelations> {
  const response = await fetch(`/api/overtime/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<OvertimeWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update overtime');
  }
  return result.data;
}

async function deleteOvertime(id: string): Promise<void> {
  const response = await fetch(`/api/overtime/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete overtime');
  }
}

export function useOvertime() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchOvertime,
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
