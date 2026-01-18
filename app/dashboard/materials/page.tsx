'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '@/hooks/useMaterials';
import { useAllSites } from '@/hooks/useSites';
import type { MaterialInput, MaterialWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ExportToExcel, filterByDateRange, type ExportFilters } from '@/components/ExportToExcel';
import { exportToExcel, formatDate, formatCurrency } from '@/lib/export-utils';
import { Pagination } from '@/components/Pagination';

export default function MaterialsPage() {
  const [page, setPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithRelations | null>(null);
  const [formData, setFormData] = useState<MaterialInput>({
    siteId: '',
    materialName: '',
    quantity: 0,
    unit: '',
    date: new Date().toISOString().split('T')[0],
    cost: undefined,
    supplierName: '',
    notes: '',
  });

  const { data, isLoading, error, refetch } = useMaterials(page);
  const materials = data?.data;
  const pagination = data?.pagination;
  const { data: sites } = useAllSites();
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  // Filter materials by selected site and date range
  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    let filtered = materials;
    
    // Filter by site
    if (selectedSite) {
      filtered = filtered.filter(m => m.siteId === selectedSite.id);
    }
    
    // Filter by date range
    filtered = filterByDateRange(filtered, (m) => m.date, fromDate, toDate);
    
    return filtered;
  }, [materials, selectedSite, fromDate, toDate]);

  const handleOpenDialog = (material?: MaterialWithRelations) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        siteId: material.siteId,
        materialName: material.materialName,
        quantity: material.quantity,
        unit: material.unit,
        date: new Date(material.date).toISOString().split('T')[0],
        cost: material.cost || undefined,
        supplierName: material.supplierName || '',
        notes: material.notes || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        siteId: '',
        materialName: '',
        quantity: 0,
        unit: '',
        date: new Date().toISOString().split('T')[0],
        cost: undefined,
        supplierName: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: MaterialInput = {
      ...formData,
      cost: formData.cost || undefined,
      supplierName: formData.supplierName || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingMaterial) {
        await updateMutation.mutateAsync({ id: editingMaterial.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save material:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this material record?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete material:', err);
      }
    }
  };

  // Handle export
  const handleExport = async (filters: ExportFilters) => {
    if (!materials) return;

    // Use filtered materials (already filtered by site and date)
    let dataToExport = [...filteredMaterials];

    await exportToExcel(dataToExport, {
      filename: 'materials_records',
      sheetName: 'Materials',
      columns: [
        { header: 'Date', accessor: (m) => formatDate(m.date) },
        { header: 'Material Name', accessor: 'materialName' },
        { header: 'Site', accessor: (m) => m.site.name },
        { header: 'Quantity', accessor: 'quantity' },
        { header: 'Unit', accessor: 'unit' },
        { header: 'Cost', accessor: (m) => m.cost ? formatCurrency(m.cost) : '' },
        { header: 'Supplier Name', accessor: (m) => m.supplierName || '' },
        { header: 'Notes', accessor: (m) => m.notes || '' },
        { header: 'Created At', accessor: (m) => formatDate(m.createdAt) },
      ],
    });
    toast.success(`Exported ${dataToExport.length} material records to Excel`);
  };

  if (isLoading) return <LoadingState message="Loading materials..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Materials</h1>
            <p className="text-sm text-muted-foreground">Track material usage and inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Site Filter Dropdown */}
          <Select 
            value={selectedSite?.id || 'all'} 
            onValueChange={(value) => setSelectedSite(value === 'all' ? null : sites?.find(s => s.id === value) || null)}
          >
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites?.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Export Section */}
      <ExportToExcel
        showSiteFilter={false}
        onExport={handleExport}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      {!filteredMaterials || filteredMaterials.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No material records found"
            description={selectedSite ? `No materials found for ${selectedSite.name}` : "Start tracking materials for your sites"}
            action={
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material, index) => (
                <TableRow key={material.id}>
                  <TableCell className="text-muted-foreground">
                    {pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                  </TableCell>
                  <TableCell>{new Date(material.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {material.materialName}
                    </div>
                  </TableCell>
                  <TableCell>{material.site.name}</TableCell>
                  <TableCell>
                    {material.quantity} {material.unit}
                  </TableCell>
                  <TableCell>
                    {material.cost ? `₹${material.cost.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{material.supplierName || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Edit Material' : 'Add Material'}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? 'Update material record'
                  : 'Add material usage record'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="siteId">Site *</Label>
                <Select
                  value={formData.siteId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, siteId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialName">Material Name *</Label>
                <Input
                  id="materialName"
                  value={formData.materialName}
                  onChange={(e) =>
                    setFormData({ ...formData, materialName: e.target.value })
                  }
                  placeholder="e.g., Cement, Steel, Bricks"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="kg, bags, pieces"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={formData.supplierName}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingMaterial
                  ? 'Update'
                  : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
