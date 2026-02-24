// File: /app/admin/blogs/_components/BlogTable.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Pencil, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { SelectPortal } from '@radix-ui/react-select';
// import { BlogForm } from './BlogForm';
import dynamic from 'next/dynamic';

const BlogForm = dynamic(() => 
    import('./BlogForm').then((mod) => mod.BlogForm), 
    { ssr: false }
  );
// MODIFICATION: Import the new EditBlogForm component

// MODIFICATION: Updated the Blog interface to include all necessary fields for editing.
// Your API at `/api/blogs` must return these fields for the edit form to be pre-filled correctly.
interface Blog {
    id: number;
    title: string;
    status: 'published' | 'draft';
    category_id: number; // Required for the edit form
    category_name: string;
    image: string;
    created_at: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    tag_ids?: number[];
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export function BlogTable() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    // State for Delete Dialog
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<number | null>(null);

    // MODIFICATION: Add state for the Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [blogToEdit, setBlogToEdit] = useState<Blog | null>(null);

    const fetchBlogsAndCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const categoriesResponse = await fetch('/api/blogs/blog_categories');
            if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData);

            const url = `/api/blogs?status=all&search=${debouncedSearchTerm}&category=${selectedCategory}`;
            const blogsResponse = await fetch(url);
            if (!blogsResponse.ok) throw new Error('Failed to fetch blogs');
            const blogsData = await blogsResponse.json();
            // Ensure the API returns all necessary fields for the Blog interface
            setBlogs(blogsData.blogs);

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, selectedCategory]);

    useEffect(() => {
        fetchBlogsAndCategories();
    }, [fetchBlogsAndCategories]);

    const handleDeleteClick = (blogId: number) => {
        setBlogToDelete(blogId);
        setIsAlertOpen(true);
    };

    // MODIFICATION: Add handler to open the edit modal
    const handleEditClick = (blog: Blog) => {
        setBlogToEdit(blog);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!blogToDelete) return;
        try {
            const response = await fetch(`/api/blogs/${blogToDelete}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete the blog post.');
            fetchBlogsAndCategories();
            toast.success("The blog post has been deleted.");
        } catch (err: any) {
            toast.error(err.message || "Something went wrong.");
        } finally {
            setIsAlertOpen(false);
            setBlogToDelete(null);
        }
    };

    return (
        <>
            <div className="rounded-lg border bg-white/70 text-card-foreground shadow-sm p-4">
                {/* Search Bar and Filters */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by blog title..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select
                        value={selectedCategory === "" ? "all" : selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
                    >
                        <SelectTrigger className="w-[200px] bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        
                        <SelectPortal>
                            <SelectContent position="popper" className="bg-white border border-gray-200 shadow-lg">
                                <SelectItem value="all" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">
                                    All Categories
                                </SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.slug} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px] px-4">Image</TableHead>
                                <TableHead className="w-[40%] px-4">Title</TableHead>
                                <TableHead className="px-4">Status</TableHead>
                                <TableHead className="px-4">Category</TableHead>
                                <TableHead className="px-4">Date</TableHead>
                                <TableHead className="text-left px-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                            ) : blogs.length > 0 ? (
                                blogs.map((blog) => (
                                    <TableRow key={blog.id} className="hover:bg-muted/50">
                                        <TableCell className="p-2 px-4">
                                            <Image
                                                src={blog.image || 'https://placehold.co/400x400/e2e8f0/e2e8f0?text=.'}
                                                alt={`Blog post image for ${blog.title}`}
                                                width={48}
                                                height={48}
                                                className="rounded-md object-cover aspect-square"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground px-4">{blog.title}</TableCell>
                                        <TableCell className="px-4">
                                            <Badge className={blog.status === 'published' ? "border-transparent bg-green-100 text-green-800 hover:bg-green-200" : "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200"}>
                                                {blog.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-4">{blog.category_name || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground px-4">{new Date(blog.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="px-4">
                                            <div className="flex items-center space-x-4">
                                                <Link href={`/blogs/${blog.slug || blog.id}`} passHref>
                                                    <button className="text-blue-600 hover:text-blue-900 transition-colors" aria-label="View post">
                                                        <Eye className="h-7 w-7 pt-2" />
                                                    </button>
                                                </Link>
                                                {/* MODIFICATION: Edit button now opens the modal */}
                                                <button onClick={() => handleEditClick(blog)} className="text-yellow-600 hover:text-yellow-900 transition-colors" aria-label="Edit post">
                                                    <Pencil className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(blog.id)} className="text-red-600 hover:text-red-900 transition-colors" aria-label="Delete post">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No blogs found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-600">This action cannot be undone. This will permanently delete this blog post.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-end space-x-2 mt-6">
                        <AlertDialogCancel onClick={() => setIsAlertOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MODIFICATION: Render the EditBlogForm component */}
            <BlogForm
                mode='edit'
                blog={blogToEdit}
                isOpen={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSave={() => window.location.reload()}
            />
        </>
    );
}
