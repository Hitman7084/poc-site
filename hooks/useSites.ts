import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Site, SiteInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'sites';

async function fetchSites(): Promise<Site[]> {
  const response = await fetch('/api/sites');
  const result: ApiResponse<Site[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch sites');
  }
  return result.data;
}

async function createSite(data: SiteInput): Promise<Site> {
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Site> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create site');
  }
  return result.data;
}

async function updateSite(id: string, data: SiteInput): Promise<Site> {
  const response = await fetch(`/api/sites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<Site> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update site');
  }
  return result.data;
}

async function deleteSite(id: string): Promise<void> {
  const response = await fetch(`/api/sites/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete site');
  }
}

export function useSites() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchSites,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SiteInput }) =>
      updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
