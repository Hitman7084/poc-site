import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttendanceWithRelations, AttendanceInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'attendance';

async function fetchAttendanceByDate(date: string): Promise<AttendanceWithRelations[]> {
  const response = await fetch(`/api/attendance?date=${date}`);
  const result: ApiResponse<AttendanceWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch attendance');
  }
  return result.data;
}

async function bulkCreateAttendance(data: AttendanceInput[]): Promise<AttendanceWithRelations[]> {
  const results: AttendanceWithRelations[] = [];
  
  for (const record of data) {
    const payload = {
      ...record,
      date: new Date(record.date).toISOString(),
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString() : undefined,
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString() : undefined,
    };
    
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result: ApiResponse<AttendanceWithRelations> = await response.json();
    if (result.success && result.data) {
      results.push(result.data);
    }
  }
  
  return results;
}

async function bulkUpdateAttendance(data: { id: string; data: AttendanceInput }[]): Promise<AttendanceWithRelations[]> {
  const results: AttendanceWithRelations[] = [];
  
  for (const { id, data: record } of data) {
    const payload = {
      ...record,
      date: new Date(record.date).toISOString(),
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString() : undefined,
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString() : undefined,
    };
    
    const response = await fetch(`/api/attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result: ApiResponse<AttendanceWithRelations> = await response.json();
    if (result.success && result.data) {
      results.push(result.data);
    }
  }
  
  return results;
}

export function useAttendanceByDate(date: string) {
  return useQuery({
    queryKey: [QUERY_KEY, date],
    queryFn: () => fetchAttendanceByDate(date),
    enabled: !!date,
  });
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Export function to fetch all attendance for export with filters
export type ExportAttendanceParams = {
  siteIds?: string[];
  fromDate?: string;
  toDate?: string;
};

export async function fetchAllAttendanceForExport(params: ExportAttendanceParams = {}): Promise<AttendanceWithRelations[]> {
  const searchParams = new URLSearchParams();
  if (params.siteIds && params.siteIds.length > 0) {
    // For multiple sites, we'll need to make separate calls or modify API to accept multiple siteIds
    // For now, fetch all and filter client-side
  }
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  
  const response = await fetch(`/api/attendance?${searchParams.toString()}`);
  const result: ApiResponse<AttendanceWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Failed to fetch attendance for export');
  }
  
  // Filter by siteIds if provided
  let data = result.data;
  if (params.siteIds && params.siteIds.length > 0) {
    data = data.filter(a => params.siteIds!.includes(a.siteId));
  }
  
  return data;
}
