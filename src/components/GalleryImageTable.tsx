// File: src/app/admin/gallery/_components/GalleryImageTable.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import AvatarFallback from './AvatarFallback';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { GalleryImageForm } from './GalleryImageForm';
import { SelectPortal } from '@radix-ui/react-select';

const formatLikes = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
};

interface AdminGalleryImage {
    id: number;
    title: string;
    image_path: string;
    category_name: string;
    created_at: string;
    status: 'published' | 'draft';
    likes: number;
    designer_name: string | null;
    designer_dp_path: string | null;
    designer_designation: string | null;
    category_id: number;
    is_featured: boolean;
    designer_comment: string | null;
}

interface Category {
    id: number;
    name: string;
}

export function GalleryImageTable() {
    const [images, setImages] = useState<AdminGalleryImage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedFeatured, setSelectedFeatured] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<AdminGalleryImage | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<AdminGalleryImage | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const catRes = await fetch('/api/gallery-categories');
            if (!catRes.ok) throw new Error('Failed to fetch categories');
            setCategories(await catRes.json());

            const params = new URLSearchParams({
                search: debouncedSearchTerm,
                category: selectedCategory,
                status: selectedStatus,
                is_featured: selectedFeatured,
            });
            const imgRes = await fetch(`/api/gallery-images?${params.toString()}`);
            if (!imgRes.ok) throw new Error('Failed to fetch images');

            const data = await imgRes.json();

            if (Array.isArray(data)) {
                setImages(data);
            } else {
                console.error("API did not return an array of images:", data);
                toast.error("Received invalid data from server.");
                setImages([]);
            }

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, selectedCategory, selectedStatus, selectedFeatured]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDeleteClick = (image: AdminGalleryImage) => {
        setImageToDelete(image);
        setIsAlertOpen(true);
    };

    const handleEditClick = (image: AdminGalleryImage) => {
        setImageToEdit(image);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!imageToDelete) return;
        try {
            const response = await fetch(`/api/gallery-images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: imageToDelete.id,
                    image_path: imageToDelete.image_path,
                    designer_dp_path: imageToDelete.designer_dp_path
                }),
            });
            if (!response.ok) throw new Error('Failed to delete the image.');
            fetchData();
            toast.success("The image has been deleted.");
        } catch (err: any) {
            toast.error(err.message || "Something went wrong.");
        } finally {
            setIsAlertOpen(false);
            setImageToDelete(null);
        }
    };

    return (
        <>
            <div className="rounded-lg border bg-white/70 text-card-foreground shadow-sm p-2 md:p-4">
                {/* Mobile responsive filter section */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 mb-4">
                    <div className="relative grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by title or category..." 
                            className="pl-10 w-full" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200 h-9 sm:h-10">
                                <SelectValue placeholder="Categories" />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectContent position="popper" className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All Categories</SelectItem>
                                    {categories.map((cat) => (<SelectItem key={cat.id} value={String(cat.id)}
                                        className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer"
                                    >{cat.name}</SelectItem>))}
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
                            <SelectTrigger className="w-full sm:w-[120px] md:w-[150px] bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200 h-9 sm:h-10">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectContent position="popper" className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All Statuses</SelectItem>
                                    <SelectItem value="published" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Published</SelectItem>
                                    <SelectItem value="draft" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Draft</SelectItem>
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                        <Select value={selectedFeatured} onValueChange={(value) => setSelectedFeatured(value === "all" ? "" : value)}>
                            <SelectTrigger className="w-full sm:w-[120px] md:w-[150px] bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200 h-9 sm:h-10">
                                <SelectValue placeholder="Featured" />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectContent position="popper" className="bg-white border border-gray-200 shadow-lg">
                                    <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">All</SelectItem>
                                    <SelectItem value="true" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Featured</SelectItem>
                                    <SelectItem value="false" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Not Featured</SelectItem>
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
<TableHead className="w-[60px]">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="hidden md:table-cell">Designer</TableHead>
                                <TableHead className="hidden lg:table-cell">Category</TableHead>
                                <TableHead className="hidden md:table-cell">Likes</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
<TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell></TableRow>
                            ) : images.length > 0 ? (
                                images.map((image) => (
                                    <TableRow key={image.id}>
                                        <TableCell>
                                            <Image
                                                src={image.image_path || '/placeholder_image.png'}
                                                alt={image.title}
                                                width={48}
                                                height={48}
                                                className="rounded-md object-cover aspect-square w-10 h-10 sm:w-12 sm:h-12"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <span className="block max-w-[150px] sm:max-w-[200px] md:max-w-none truncate">
                                                {image.title.length > 25
                                                    ? image.title.substring(0, 25) + "..."
                                                    : image.title}
                                            </span>
                                        </TableCell>

                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <AvatarFallback className="w-6 h-6 sm:w-8 sm:h-8" />
                                                <div className="hidden lg:block">
                                                    <p className="font-semibold text-sm">{image.designer_name || 'Team KayaPalat'}</p>
                                                    <p className="text-xs text-muted-foreground">{image.designer_designation || 'Designer | Architect'}</p>
                                                </div>
                                                <div className="lg:hidden">
                                                    <p className="text-xs font-medium">{image.designer_name || 'Team KayaPalat'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell"><Badge variant="outline" className="text-xs">{image.category_name}</Badge></TableCell>
                                        <TableCell className="hidden md:table-cell font-medium text-sm">{formatLikes(image.likes)}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-sm">{new Date(image.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge className={`text-xs py-0.5 px-2 ${image.status === 'published' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>{image.status === 'published' ? 'Published' : 'Draft'}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <Link href={`/gallery?image=${slugify(image.title)}`} target="_blank" aria-label="View image" className="p-1.5 sm:p-1 hover:bg-blue-50 rounded transition-colors">
                                                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                                </Link>
                                                <button onClick={() => handleEditClick(image)} aria-label="Edit image" className="p-1.5 sm:p-1 hover:bg-yellow-50 rounded transition-colors">
                                                    <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(image)} aria-label="Delete image" className="p-1.5 sm:p-1 hover:bg-red-50 rounded transition-colors">
                                                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center">No images found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border shadow-xl rounded-lg">
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this image.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {imageToEdit && (
                <GalleryImageForm
                    mode='edit'
                    image={{
                        ...imageToEdit,
                        designer_name: imageToEdit.designer_name ?? undefined,
                        designer_dp_path: imageToEdit.designer_dp_path ?? undefined,
                        designer_designation: imageToEdit.designer_designation ?? undefined,
                        designer_comment: imageToEdit.designer_comment ?? undefined,
                    }}
                    isOpen={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSave={fetchData}
                />
            )}
        </>
    );
}

const slugify = (text: string) => text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
