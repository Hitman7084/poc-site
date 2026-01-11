import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttendanceWithRelations, AttendanceInput, ApiResponse } from '@/lib/types';

const QUERY_KEY = 'attendance';

async function fetchAttendance(): Promise<AttendanceWithRelations[]> {
  const response = await fetch('/api/attendance');
  const result: ApiResponse<AttendanceWithRelations[]> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch attendance');
  }
  return result.data;
}

async function createAttendance(data: AttendanceInput): Promise<AttendanceWithRelations> {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<AttendanceWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create attendance');
  }
  return result.data;
}

async function updateAttendance(id: string, data: AttendanceInput): Promise<AttendanceWithRelations> {
  const response = await fetch(`/api/attendance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<AttendanceWithRelations> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update attendance');
  }
  return result.data;
}

async function deleteAttendance(id: string): Promise<void> {
  const response = await fetch(`/api/attendance/${id}`, {
    method: 'DELETE',
  });
  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete attendance');
  }
}

export function useAttendance() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchAttendance,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AttendanceInput }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
