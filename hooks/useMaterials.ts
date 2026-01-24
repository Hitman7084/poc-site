import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MaterialWithRelations, MaterialInput, PaginatedResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';
import { dateStringToISO } from '@/lib/api-utils';

const QUERY_KEY = 'materials';

export type PaginatedMaterials = {
  data: MaterialWithRelations[];
  pagination: PaginationInfo;
};

export type MaterialFilterParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

async function fetchMaterials(page: number = 1, limit: number = 10, filters: MaterialFilterParams = {}): Promise<PaginatedMaterials> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  
  const response = await fetch(`/api/materials?${params.toString()}`);
  const result: PaginatedResponse<MaterialWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch materials');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

async function createMaterial(data: MaterialInput): Promise<MaterialWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create material');
  }
  return result.data;
}

async function updateMaterial(id: string, data: MaterialInput): Promise<MaterialWithRelations> {
  const payload = {
    ...data,
    date: dateStringToISO(data.date),
  };
  const response = await fetch(`/api/materials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update material');
  }
  return result.data;
}

async function deleteMaterial(id: string): Promise<void> {
  const response = await fetch(`/api/materials/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete material');
  }
}

export function useMaterials(page: number = 1, limit: number = 10, filters: MaterialFilterParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, filters],
    queryFn: () => fetchMaterials(page, limit, filters),
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

// Export function to fetch all materials for export with filters
export type ExportMaterialsParams = {
  siteId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllMaterialsForExport(params: ExportMaterialsParams = {}): Promise<MaterialWithRelations[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('all', 'true');
  if (params.siteId) searchParams.set('siteId', params.siteId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/materials?${searchParams.toString()}`);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch materials for export');
  }
  return result.data;
}
