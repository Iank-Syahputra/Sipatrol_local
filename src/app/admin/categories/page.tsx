'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, AlertTriangle, Palette } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

const COLOR_OPTIONS = [
  { value: 'green', label: 'Green', class: 'bg-emerald-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-amber-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'gray', label: 'Gray', class: 'bg-slate-500' },
];

export default function CategoryManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('gray');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      toast.error('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check if user is admin
  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      router.push('/security');
    }
  }, [session, router]);

  // Open dialog for new category
  const handleAddNew = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('gray');
    setError(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || 'gray');
    setError(null);
    setIsDialogOpen(true);
  };

  // Save category (create or update)
  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingCategory 
        ? '/api/admin/categories' 
        : '/api/admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      const body = JSON.stringify({
        id: editingCategory?.id,
        name: categoryName.trim(),
        color: categoryColor
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setIsDialogOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = (category: Category) => {
    setCategoryToDelete(category.id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${categoryToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const getColorClass = (color: string | null) => {
    const option = COLOR_OPTIONS.find(opt => opt.value === color);
    return option ? option.class : 'bg-slate-500';
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm animate-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Kategori</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">Kelola kategori laporan dengan color coding</p>
          </div>
          <Button 
            onClick={handleAddNew} 
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 animate-in slide-in-from-bottom-4 duration-700">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Palette className="h-5 w-5 text-amber-600" />
              Daftar Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Palette className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Belum ada kategori</p>
                <p className="text-slate-400 text-sm mt-1">Klik &quot;Tambah Kategori&quot; untuk membuat kategori pertama</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Warna</TableHead>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Badge className={`${getColorClass(category.color)} text-white border-0`}>
                          <div className="w-3 h-3 rounded-full bg-white/50" />
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{category.name}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(category.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="hover:bg-blue-50 hover:text-blue-600 text-slate-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="hover:bg-red-50 hover:text-red-600 text-slate-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {editingCategory
                ? 'Ubah nama dan warna kategori'
                : 'Buat kategori laporan baru dengan color coding'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-700">Nama Kategori</Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Contoh: Aman, Unsafe Condition, dll"
                className="focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color" className="text-slate-700">Warna Identifikasi</Label>
              <Select value={categoryColor} onValueChange={setCategoryColor}>
                <SelectTrigger className="text-slate-900">
                  <SelectValue placeholder="Pilih warna" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.class}`} />
                        <span className="text-slate-900">{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="text-slate-700"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !categoryName.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingCategory ? 'Update' : 'Buat'} Kategori
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
