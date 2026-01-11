import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MaterialWithRelations, MaterialInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'materials';

async function fetchMaterials(): Promise<MaterialWithRelations[]> {
  const response = await fetch('/api/materials');
  const result: ApiResponse<MaterialWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch materials');
  }
  return result.data;
}

async function createMaterial(data: MaterialInput): Promise<MaterialWithRelations> {
  const response = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<MaterialWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create material');
  }
  return result.data;
}

async function updateMaterial(id: string, data: MaterialInput): Promise<MaterialWithRelations> {
  const response = await fetch(`/api/materials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<MaterialWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update material');
  }
  return result.data;
}

async function deleteMaterial(id: string): Promise<void> {
  const response = await fetch(`/api/materials/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete material');
  }
}

export function useMaterials() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchMaterials,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaterialInput }) =>
      updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
