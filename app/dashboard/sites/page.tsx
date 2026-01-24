'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon, 
  Save, 
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useSites, useAllSites, useCreateSite, useUpdateSite } from '@/hooks/useSites';
import { useWorkers } from '@/hooks/useWorkers';
import {
  useAttendanceByDate,
  useBulkCreateAttendance,
  useBulkUpdateAttendance,
  fetchAllAttendanceForExport,
} from '@/hooks/useAttendanceByDate';
import type { Site, SiteInput, AttendanceInput, AttendanceWithRelations, ApiResponse } from '@/lib/types';
import { AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, filterBySites, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate } from '@/lib/export-utils';
import { formatDateForAPI } from '@/lib/api-utils';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { useHydrated } from '@/hooks/useHydration';
import { Pagination } from '@/components/Pagination';

type WorkerAttendance = {
  workerId: string;
  workerName: string;
  workerRole: string;
  siteId: string;
  isPresent: boolean;
  existingRecordId?: string;
};

export default function SitesPage() {
  const isHydrated = useHydrated();
  
  // Date state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Site management state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteInput>({
    name: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  
  // Attendance state
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [workerAttendance, setWorkerAttendance] = useState<Map<string, WorkerAttendance>>(new Map());
  const [isSaved, setIsSaved] = useState(false);

  // Initialize date after hydration
  useEffect(() => {
    if (isHydrated && !selectedDate) {
      setSelectedDate(new Date());
    }
  }, [isHydrated, selectedDate]);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const isToday = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;

  // Data fetching
  const [sitePage, setSitePage] = useState(1);
  const { data: sitesData, isLoading: isLoadingSites, error: sitesError, refetch: refetchSites } = useSites(sitePage);
  const sites = sitesData?.data;
  const sitesPagination = sitesData?.pagination;
  const { data: allSitesData } = useAllSites(); // For dropdowns and export
  const allSitesForDropdown = allSitesData || [];
  const { data: workersData, isLoading: isLoadingWorkers } = useWorkers();
  const workers = workersData?.data;
  const { data: attendance, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useAttendanceByDate(dateString);
  
  // Mutations
  const createSiteMutation = useCreateSite();
  const updateSiteMutation = useUpdateSite();
  const createAttendanceMutation = useBulkCreateAttendance();
  const updateAttendanceMutation = useBulkUpdateAttendance();

  const isLoading = isLoadingSites || isLoadingWorkers || isLoadingAttendance;

  // Get all sites for the grid
  const allSites = useMemo(() => {
    if (!sites) return [];
    return sites;
  }, [sites]);

  // Check if a site is active on the selected date
  const isSiteActiveOnDate = (site: Site) => {
    if (!site.isActive || !selectedDate) return false;
    
    const selectedDay = startOfDay(selectedDate);
    
    if (site.startDate && site.endDate) {
      const startDate = startOfDay(new Date(site.startDate));
      const endDate = startOfDay(new Date(site.endDate));
      return isWithinInterval(selectedDay, { start: startDate, end: endDate });
    }
    
    if (site.startDate) {
      const startDate = startOfDay(new Date(site.startDate));
      return selectedDay >= startDate;
    }
    
    return true;
  };

  // Get workers for the selected site (only workers assigned to this site)
  const workersForSite = useMemo(() => {
    if (!selectedSite || !workers) return [];
    
    const activeWorkers = workers.filter(w => w.isActive);
    
    // Filter to only workers assigned to this site
    const workersAssignedToSite = activeWorkers.filter(worker => {
      if (!worker.assignedSites) return false;
      const siteNames = worker.assignedSites.split(',').map(s => s.trim());
      return siteNames.includes(selectedSite.name);
    });
    
    return workersAssignedToSite;
  }, [selectedSite, workers]);

  // Get attendance stats for a site on selected date
  const getSiteAttendanceStats = (siteId: string) => {
    if (!attendance) return { present: 0, total: 0 };
    
    const siteAttendance = attendance.filter(a => a.siteId === siteId);
    const presentCount = siteAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    
    return { present: presentCount, total: siteAttendance.length };
  };

  // Get count of workers assigned to a site
  const getWorkersAssignedToSite = (site: Site): number => {
    if (!workers) return 0;
    
    const activeWorkers = workers.filter(w => w.isActive);
    const assignedCount = activeWorkers.filter(worker => {
      if (!worker.assignedSites) return false;
      const siteNames = worker.assignedSites.split(',').map(s => s.trim());
      return siteNames.includes(site.name);
    }).length;
    
    return assignedCount;
  };

  // Initialize worker attendance when site changes
  useEffect(() => {
    if (!selectedSite || !workers) return;
    
    const newAttendanceMap = new Map<string, WorkerAttendance>();
    
    // Get only workers assigned to this site
    const activeWorkers = workers.filter(w => w.isActive);
    const workersAssignedToThisSite = activeWorkers.filter(worker => {
      if (!worker.assignedSites) return false;
      const siteNames = worker.assignedSites.split(',').map(s => s.trim());
      return siteNames.includes(selectedSite.name);
    });
    
    workersAssignedToThisSite.forEach(worker => {
      const existingRecord = attendance?.find(
        a => a.workerId === worker.id && a.siteId === selectedSite.id
      );
      
      newAttendanceMap.set(worker.id, {
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role || 'Worker',
        siteId: selectedSite.id,
        isPresent: existingRecord?.status === AttendanceStatus.PRESENT,
        existingRecordId: existingRecord?.id,
      });
    });
    
    setWorkerAttendance(newAttendanceMap);
    
    const hasExistingRecords = attendance?.some(a => a.siteId === selectedSite.id);
    setIsSaved(hasExistingRecords ?? false);
    setIsEditing(!hasExistingRecords);
  }, [selectedSite, workers, attendance]);

  // Reset attendance state when date changes
  useEffect(() => {
    setSelectedSite(null);
    setWorkerAttendance(new Map());
    setIsSaved(false);
    setIsEditing(true);
  }, [selectedDate]);

  // Date navigation handlers
  const handlePreviousDay = () => {
    setSelectedDate(prev => {
      if (!prev) return prev;
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      if (!prev) return prev;
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // Site handlers
  const handleOpenDialog = (site?: Site) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        name: site.name,
        location: site.location || '',
        description: site.description || '',
        startDate: site.startDate ? new Date(site.startDate).toISOString().split('T')[0] : '',
        endDate: site.endDate ? new Date(site.endDate).toISOString().split('T')[0] : '',
        isActive: site.isActive,
      });
    } else {
      setEditingSite(null);
      setFormData({
        name: '',
        location: '',
        description: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSite(null);
  };

  const handleSubmitSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: SiteInput = {
      ...formData,
      location: formData.location || undefined,
      description: formData.description || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    try {
      if (editingSite) {
        await updateSiteMutation.mutateAsync({ id: editingSite.id, data: submitData });
      } else {
        await createSiteMutation.mutateAsync(submitData);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save site:', err);
    }
  };

  // Attendance handlers
  const handleSelectSite = (site: Site) => {
    if (!isSiteActiveOnDate(site)) return;
    setSelectedSite(site);
  };

  const handleToggleAttendance = (workerId: string) => {
    if (!isEditing) return;
    
    setWorkerAttendance(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(workerId);
      if (current) {
        newMap.set(workerId, { ...current, isPresent: !current.isPresent });
      }
      return newMap;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedSite) return;
    
    const recordsToCreate: AttendanceInput[] = [];
    const recordsToUpdate: { id: string; data: AttendanceInput }[] = [];
    
    workerAttendance.forEach((record) => {
      const attendanceInput: AttendanceInput = {
        workerId: record.workerId,
        siteId: record.siteId,
        date: dateString,
        status: record.isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
      };
      
      if (record.existingRecordId) {
        recordsToUpdate.push({ id: record.existingRecordId, data: attendanceInput });
      } else {
        recordsToCreate.push(attendanceInput);
      }
    });
    
    try {
      if (recordsToCreate.length > 0) {
        await createAttendanceMutation.mutateAsync(recordsToCreate);
      }
      if (recordsToUpdate.length > 0) {
        await updateAttendanceMutation.mutateAsync(recordsToUpdate);
      }
      setIsSaved(true);
      setIsEditing(false);
      refetchAttendance();
    } catch (error) {
      console.error('Failed to save attendance:', error);
    }
  };

  const handleEditAttendance = () => {
    setIsEditing(true);
  };

  // Handle export attendance - fetches all data from API with filters from ExportToExcel component
  const handleExportAttendance = async (filters: ExportFilters) => {
    try {
      // Fetch all attendance records from API with filters
      const dataToExport = await fetchAllAttendanceForExport({
        siteIds: filters.selectedSiteIds,
        fromDate: formatDateForAPI(filters.fromDate),
        toDate: formatDateForAPI(filters.toDate),
      });

      await exportToExcel(dataToExport, {
        filename: 'attendance_records',
        sheetName: 'Attendance',
        columns: [
          { header: 'Date', accessor: (a) => formatDate(a.date) },
          { header: 'Worker Name', accessor: (a) => a.worker.name },
          { header: 'Site', accessor: (a) => a.site.name },
          { header: 'Status', accessor: 'status' },
          { header: 'Check In', accessor: (a) => a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '' },
          { header: 'Check Out', accessor: (a) => a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '' },
          { header: 'Notes', accessor: (a) => a.notes || '' },
          { header: 'Created At', accessor: (a) => formatDate(a.createdAt) },
        ],
      });
      toast.success(`Exported ${dataToExport.length} attendance records to Excel`);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      toast.error('Failed to export attendance records');
    }
  };

  if (isLoading || !selectedDate) return <LoadingState message="Loading sites and attendance..." />;
  if (sitesError) return <ErrorState message={sitesError.message} onRetry={refetchSites} />;

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sites & Attendance</h1>
            <p className="text-sm text-muted-foreground">Manage sites and track worker attendance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Navigation */}
          <Button variant="outline" size="icon" onClick={handlePreviousDay} className="shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal shadow-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEE, MMM d, yyyy')}
                {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={handleNextDay} className="shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Export Attendance Section */}
      <ExportToExcel
        sites={allSitesForDropdown}
        showSiteFilter={true}
        onExport={handleExportAttendance}
      />

      {/* Sites Grid */}
      {!allSites || allSites.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No sites found"
            description="Get started by adding your first site"
            action={
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allSites.map((site) => {
            const isActiveOnDate = isSiteActiveOnDate(site);
            const stats = getSiteAttendanceStats(site.id);
            const assignedWorkers = getWorkersAssignedToSite(site);
            const isSelected = selectedSite?.id === site.id;
            
            return (
              <Card
                key={site.id}
                className={cn(
                  "transition-all relative",
                  isActiveOnDate ? "cursor-pointer hover:shadow-md" : "opacity-50",
                  isSelected && "ring-2 ring-primary border-primary",
                  !site.isActive && "opacity-40"
                )}
                onClick={() => handleSelectSite(site)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isActiveOnDate ? "bg-green-100 text-green-600 dark:bg-green-950" : "bg-muted"
                      )}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{site.name}</CardTitle>
                        {site.location && (
                          <CardDescription className="text-xs">{site.location}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(site)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {site.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{site.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{assignedWorkers} assigned</span>
                    </div>
                    {stats.total > 0 ? (
                      <Badge variant={stats.present === assignedWorkers ? 'default' : 'secondary'}>
                        {stats.present}/{assignedWorkers} present
                      </Badge>
                    ) : assignedWorkers > 0 ? (
                      <Badge variant="outline">
                        0/{assignedWorkers} present
                      </Badge>
                    ) : (
                      <Badge variant={isActiveOnDate ? 'outline' : 'secondary'}>
                        {isActiveOnDate ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                  
                  {(site.startDate || site.endDate) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {site.startDate && site.endDate ? (
                        <span>
                          {format(new Date(site.startDate), 'MMM d')} - {format(new Date(site.endDate), 'MMM d, yyyy')}
                        </span>
                      ) : site.startDate ? (
                        <span>From {format(new Date(site.startDate), 'MMM d, yyyy')}</span>
                      ) : (
                        <span>Until {format(new Date(site.endDate!), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sites Pagination */}
      {sitesPagination && (
        <Pagination
          pagination={sitesPagination}
          onPageChange={setSitePage}
          isLoading={isLoadingSites}
        />
      )}

      {/* Workers Attendance for Selected Site */}
      {selectedSite && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {selectedSite.name} - Workers
                </CardTitle>
                <CardDescription>
                  Mark attendance for {format(selectedDate, 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              {isSaved && !isEditing && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {workersForSite.length === 0 ? (
              <EmptyState
                title="No workers assigned"
                description="There are no active workers. Add workers first to mark attendance."
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-medium">
                  <span>Worker Name</span>
                  <span>Present</span>
                </div>
                
                {/* Worker Rows with ScrollArea */}
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {Array.from(workerAttendance.values())
                      .filter(wa => workersForSite.some(w => w.id === wa.workerId))
                      .map((record) => (
                        <div
                          key={record.workerId}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            record.isPresent 
                              ? "bg-green-50 border-green-200 dark:bg-green-950/20" 
                              : "bg-red-50 border-red-200 dark:bg-red-950/20",
                            !isEditing && "opacity-75"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              record.isPresent ? "bg-green-500" : "bg-red-500"
                            )} />
                            <div>
                              <span className="font-medium">{record.workerName}</span>
                              <p className="text-xs text-muted-foreground">{record.workerRole}</p>
                            </div>
                            {record.existingRecordId && (
                              <Badge variant="outline" className="text-xs">Recorded</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-sm",
                              record.isPresent ? "text-green-600" : "text-red-600"
                            )}>
                              {record.isPresent ? 'Present' : 'Absent'}
                            </span>
                            <Checkbox
                              checked={record.isPresent}
                              onCheckedChange={() => handleToggleAttendance(record.workerId)}
                              disabled={!isEditing}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save/Edit Button */}
      {selectedSite && workerAttendance.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          {isEditing ? (
            <Button
              size="lg"
              onClick={handleSaveAttendance}
              disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
              className="shadow-lg"
            >
              <Save className="mr-2 h-5 w-5" />
              {createAttendanceMutation.isPending || updateAttendanceMutation.isPending 
                ? 'Saving...' 
                : 'Save Attendance'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={handleEditAttendance}
              className="shadow-lg bg-background"
            >
              <Pencil className="mr-2 h-5 w-5" />
              Edit Attendance
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Site Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitSite}>
            <DialogHeader>
              <DialogTitle>
                {editingSite ? 'Edit Site' : 'Add Site'}
              </DialogTitle>
              <DialogDescription>
                {editingSite ? 'Update site information' : 'Add a new construction site'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value, endDate: '' });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={!formData.startDate}
                    min={formData.startDate || undefined}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSiteMutation.isPending || updateSiteMutation.isPending}
              >
                {createSiteMutation.isPending || updateSiteMutation.isPending
                  ? 'Saving...'
                  : editingSite
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
