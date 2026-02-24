// File: src/app/admin/designs/_components/SliderTable.tsx
// Admin Pannel - Our Creations Component
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Pencil, Search, Plus, Settings, Eye, Tag, Folder, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SliderForm } from './SliderForm';
import { ManageCategoriesSliderModal } from './ManageCategoriesSliderModal';
import { ManageSliderPagesModal } from './ManageSliderPagesModal';

function PageAssignmentCheckboxes({ slider, pages, refresh }: { slider: Slider; pages: Page[]; refresh: () => void }) {
  const handleToggle = async (page: Page) => {
    const isAssigned = slider.page_name === page.name;

    if (!isAssigned) {
      await fetch(`/api/image-slider/${slider.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: page.id }),
      });
    } else {
      await fetch(`/api/image-slider/delete-by-original`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_id: slider.id, page_id: page.id }),
      });
    }

    refresh();
  };

  return (
    <div className="flex flex-col gap-1">
      {pages
        .filter((p: Page) => p.name.trim().toLowerCase() !== "gallery")
        .map((p: Page) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={slider.page_name === p.name}
              onChange={() => handleToggle(p)}
            />
            {p.name}
          </label>
        ))}
    </div>
  );
}

// Interfaces
interface Slider {
  id: number;
  before_image: string;
  after_image: string;
  testimonial_name: string;
  designation?: string;
  testimonial_dp?: string;
  category_name: string;
  page_name: string;
  status: 'published' | 'draft';
  created_at: string;
}
interface Category { id: number; name: string; }
interface Page { id: number; name: string; }

export function SliderTable() {
  const [allSliders, setAllSliders] = useState<Slider[]>([]);
  const [filteredSliders, setFilteredSliders] = useState<Slider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPage, setSelectedPage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sliderToEdit, setSliderToEdit] = useState<Slider | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isPagesModalOpen, setIsPagesModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slidersRes, categoriesRes, pagesRes] = await Promise.all([
        fetch('/api/image-slider'),
        fetch('/api/slider-categories'),
        fetch('/api/slider/pages')
      ]);
      if (!slidersRes.ok || !categoriesRes.ok || !pagesRes.ok) throw new Error('Failed to fetch initial data');

      setAllSliders(await slidersRes.json());
      setCategories(await categoriesRes.json());
      setPages(await pagesRes.json());

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = allSliders;
    if (debouncedSearchTerm) {
      result = result.filter(s =>
        s.testimonial_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (s.category_name && s.category_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (s.page_name && s.page_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category_name === selectedCategory);
    }
    if (selectedPage !== 'all') {
      result = result.filter(s => s.page_name === selectedPage);
    }
    if (selectedStatus !== 'all') {
      result = result.filter(s => s.status === selectedStatus);
    }
    setFilteredSliders(result);
  }, [allSliders, debouncedSearchTerm, selectedCategory, selectedPage, selectedStatus]);

  const handleStatusToggle = async (sliderId: number, currentStatus: 'published' | 'draft') => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/image-slider/${sliderId}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      toast.success(`Slider status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleActionClick = (mode: 'create' | 'edit' | 'view', slider: Slider | null) => {
    setFormMode(mode);
    setSliderToEdit(slider);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (sliderId: number) => {
    setSliderToDelete(sliderId);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!sliderToDelete) return;
    try {
      const response = await fetch(`/api/image-slider/${sliderToDelete}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete the slider.');
      fetchData();
      toast.success("The slider has been deleted.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAlertOpen(false);
      setSliderToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-white/70 text-card-foreground shadow-sm p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full md:w-auto md:grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[150px] bg-[#00423D]/15 text-[#00423D] hover:bg-[#00423D]/25 active:bg-[#00423D]/35">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.name} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-full sm:w-[150px] bg-[#00423D]/15 text-[#00423D] hover:bg-[#00423D]/25 active:bg-[#00423D]/35">
                <SelectValue placeholder="All Pages" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All Pages</SelectItem>
                {pages.map(p => <SelectItem key={p.id} value={p.name} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer" >{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px] bg-[#00423D]/15 text-[#00423D] hover:bg-[#00423D]/25 active:bg-[#00423D]/35">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All Statuses</SelectItem>
                <SelectItem value="published" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Published</SelectItem>
                <SelectItem value="draft" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end p-2 ">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#00423D]/15 border-[#00423D] border shadow-lg cursor-pointer text-[#00423D] hover:bg-[#00423D]/25 active:bg-[#00423D]/35">
                  <Settings className="mr-2 h-4 w-4" /> Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
                <DropdownMenuItem onSelect={() => handleActionClick('create', null)} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" /> Add New Slider
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsCategoriesModalOpen(true)} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 cursor-pointer">
                  <Tag className="mr-2 h-4 w-4" /> Manage Categories
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsPagesModalOpen(true)} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" /> Manage Pages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>

        <div className="border rounded-lg overflow-hidden">

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center">Images</TableHead>
                <TableHead className='pl-5'>Testimonial</TableHead>
                <TableHead className='pl-5'>Category</TableHead>
                <TableHead className='pl-4'>Page</TableHead>
                <TableHead className='pl-6'>Date</TableHead>
                <TableHead className='pl-4'>Status</TableHead>
                <TableHead className="pl-8">Pages</TableHead>
                <TableHead className="pl-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filteredSliders.map((slider) => (
                <TableRow key={slider.id}>
                  <TableCell className="flex justify-center gap-2 pl-6 pr-4 py-2 px-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                      <Image
                        src={encodeURI(slider.before_image)}
                        alt="Before"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-16 h-16 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                      <Image
                        src={encodeURI(slider.after_image)}
                        alt="After"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        <Image
                          src={encodeURI(slider.testimonial_dp || '/placeholder-avatar.png')}
                          alt={slider.testimonial_name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{slider.testimonial_name}</div>
                        <div className="text-xs text-muted-foreground">{slider.designation}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">{slider.category_name}</TableCell>
                  <TableCell className="px-4">{slider.page_name}</TableCell>
                  <TableCell className="px-4">{new Date(slider.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={slider.status === 'published'}
                        onCheckedChange={() => handleStatusToggle(slider.id, slider.status)}
                      />
                      <Badge className={slider.status === 'published' ? "border-transparent bg-green-100 text-green-800 hover:bg-green-200" : "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200"}>
                        {slider.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <PageAssignmentCheckboxes
                      slider={slider}
                      pages={pages}
                      refresh={fetchData}
                    />
                  </TableCell>
                  <TableCell className="px-4 ">
                    <div className="flex items-center justify-start space-x-2">
                      <button onClick={() => handleActionClick('view', slider)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label="View slider"><Eye className="h-5 w-5" /></button>
                      <button onClick={() => handleActionClick('edit', slider)} className="text-yellow-600 hover:text-yellow-900 transition-colors" aria-label="Edit slider"><Pencil className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteClick(slider.id)} className="text-red-600 hover:text-red-900 transition-colors" aria-label="Delete slider"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">This action cannot be undone. This will permanently delete this slider and its images.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end space-x-2 mt-6">
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SliderForm mode={formMode} isOpen={isFormOpen} onOpenChange={setIsFormOpen} slider={sliderToEdit} onSave={fetchData} />
      <ManageCategoriesSliderModal isOpen={isCategoriesModalOpen} onOpenChange={setIsCategoriesModalOpen} />
      <ManageSliderPagesModal isOpen={isPagesModalOpen} onOpenChange={setIsPagesModalOpen} />
    </>
  );
}