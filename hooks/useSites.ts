import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Site, SiteInput, PaginatedResponse, ApiResponse } from '@/lib/types';
import type { PaginationInfo } from '@/components/Pagination';

const QUERY_KEY = 'sites';

export type PaginatedSites = {
  data: Site[];
  pagination: PaginationInfo;
};

async function fetchSites(page: number = 1, limit: number = 10): Promise<PaginatedSites> {
  const response = await fetch(`/api/sites?page=${page}&limit=${limit}`);
  const result: PaginatedResponse<Site> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch sites');
  }
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

// Fetch all sites without pagination (for dropdowns)
async function fetchAllSites(): Promise<Site[]> {
  const response = await fetch('/api/sites?all=true');
  const result: ApiResponse<Site[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch sites');
  }
  return result.data;
}

async function createSite(data: SiteInput): Promise<Site> {
  const payload = {
    ...data,
    startDate: data.startDate ? dateStringToISO(data.startDate) : undefined,
    endDate: data.endDate ? dateStringToISO(data.endDate) : undefined,
  };
  
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create site');
  }
  return result.data;
}

async function updateSite(id: string, data: SiteInput): Promise<Site> {
  const payload = {
    ...data,
    startDate: data.startDate ? dateStringToISO(data.startDate) : undefined,
    endDate: data.endDate ? dateStringToISO(data.endDate) : undefined,
  };
  
  const response = await fetch(`/api/sites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update site');
  }
  return result.data;
}

async function deleteSite(id: string): Promise<void> {
  const response = await fetch(`/api/sites/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete site');
  }
}

export function useSites(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => fetchSites(page, limit),
  });
}

// Hook to fetch all sites (for dropdowns)
export function useAllSites() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: fetchAllSites,
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
