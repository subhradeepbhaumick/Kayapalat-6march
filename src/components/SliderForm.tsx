// File: src/app/admin/designs/_components/SliderForm.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Star, UploadCloud, X, Pencil } from 'lucide-react';
import { ImageSlider } from '@/components/ImageSlider';

// --- INTERFACES ---
interface SliderData {
    id?: number;
    before_image: string;
    after_image: string;
    testimonial_dp: string;
    testimonial_name: string;
    designation: string;
    rating: number;
    comment: string;
    category_id: number | null;
    page_id: number | null;
    status: 'published' | 'draft';
}
interface Category { id: number; name: string; }
interface Page { id: number; name: string; }
interface SliderFormProps {
    mode: 'create' | 'edit' | 'view';
    slider?: Partial<SliderData> | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: () => void;
}

const emptyForm: SliderData = {
    before_image: '', after_image: '', testimonial_dp: '/user.png',
    testimonial_name: '', designation: '', rating: 4, comment: '',
    category_id: null, page_id: null, status: 'draft',
};

// --- Reusable Image Upload Sub-Component ---
const ImageUploadField = ({ label, currentPath, onFileSelect, isViewMode }: { label: string; currentPath: string | null; onFileSelect: (file: File | null) => void; isViewMode: boolean; }) => {
    const [preview, setPreview] = useState<string | null>(currentPath);
    const [hasChanged, setHasChanged] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreview(currentPath);
        setHasChanged(false);
    }, [currentPath, isViewMode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
            setHasChanged(true);
        }
    };

    const handleRemove = () => {
        setPreview(currentPath);
        onFileSelect(null);
        setHasChanged(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="mt-1 aspect-video w-full relative rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center group bg-slate-50">
                {preview ? (
                    <>
                        <Image src={preview} alt={`${label} Preview`} fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                        {!isViewMode && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white flex items-center gap-2 p-2 bg-black/50 rounded-lg hover:bg-black/70"><Pencil size={16} /> Change</button>
                            </div>
                        )}
                        {hasChanged && !isViewMode && (
                            <button type="button" onClick={handleRemove} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-gray-800 hover:bg-white"><X size={16} /></button>
                        )}
                    </>
                ) : (
                    <div className="text-center cursor-pointer p-4" onClick={() => !isViewMode && fileInputRef.current?.click()}>
                        <UploadCloud className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-2 text-sm text-gray-600">Click to upload</p>
                    </div>
                )}
                {!isViewMode && <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />}
            </div>
        </div>
    );
};

// --- Main Form Component ---
export function SliderForm({ mode, slider, isOpen, onOpenChange, onSave }: SliderFormProps) {
    const [formData, setFormData] = useState<SliderData>(emptyForm);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pages, setPages] = useState<Page[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // State for the actual file objects
    const [beforeImageFile, setBeforeImageFile] = useState<File | null>(null);
    const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
    const [testimonialDpFile, setTestimonialDpFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchRelatedData = async () => {
            try {
                const [catRes, pagesRes] = await Promise.all([
                    fetch('/api/slider-categories'),
                    fetch('/api/slider/pages')
                ]);
                setCategories(await catRes.json());
-               setPages(await pagesRes.json());
                
            } catch (error) { toast.error("Failed to load categories/pages."); }
        };

        const fetchSliderData = async (id: number) => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/image-slider/${id}`);
                if (!res.ok) throw new Error("Failed to fetch slider details");
                const data = await res.json();
                setFormData(data);
            } catch (error: any) {
                toast.error(error.message);
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchRelatedData();
            if ((mode === 'edit' || mode === 'view') && slider?.id) {
                fetchSliderData(slider.id);
            } else {
                setFormData(emptyForm);
            }
        }
    }, [isOpen, mode, slider]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSelectChange = (name: string, value: string) => setFormData(p => ({ ...p, [name]: Number(value) }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category_id || !formData.page_id || !formData.testimonial_name) {
            toast.error("Please fill in all required fields (Category, Page, Name).");
            return;
        }
        setIsSubmitting(true);
        try {
            const uploadImage = async (file: File | null): Promise<string | undefined> => {
                if (!file) return undefined;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/slider/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Image upload failed');
                return data.path;
            };

            const [beforeImagePath, afterImagePath, dpPath] = await Promise.all([
                uploadImage(beforeImageFile),
                uploadImage(afterImageFile),
                uploadImage(testimonialDpFile),
            ]);

            const finalData = {
                ...formData,
                before_image: beforeImagePath || formData.before_image,
                after_image: afterImagePath || formData.after_image,
                testimonial_dp: dpPath || formData.testimonial_dp,
            };

            const isEditMode = mode === 'edit';
            const endpoint = isEditMode ? `/api/image-slider/${slider?.id}` : '/api/image-slider';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');

            toast.success(`Slider ${isEditMode ? 'updated' : 'created'}!`);
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogTitle = mode === 'create' ? 'Add New Slider' : (mode === 'edit' ? 'Edit Slider' : '');
    const isViewMode = mode === 'view';

    if (isLoading) {
        return <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className='bg-white text-center'><DialogHeader><DialogTitle>Loading...</DialogTitle></DialogHeader></DialogContent></Dialog>;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[95vh] flex flex-col bg-white ">
                <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>

                {isViewMode ? (
                    // --- VIEW MODE ---
                    <div className="flex-grow  p-4 space-y-4">
                        {/* The ImageSlider component, now without the extra border */}
                        <div className="relative w-full">
                            <div className="absolute top-2 left-10 z-10 text-white bg-black/50 px-2 py-1 rounded text-xs font-semibold">Before</div>
                            <div className="absolute top-2 right-10 z-10 text-white bg-black/50 px-2 py-1 rounded text-xs font-semibold">After</div>
                            <ImageSlider beforeImage={formData.before_image} afterImage={formData.after_image} />
                        </div>

                        {/* Testimonial Section with refined layout */}
                        <div className="pt-4">
                            <div className="flex items-center ">
                                {/* Left side: DP, Name, Designation */}
                                <div className="flex items-center gap-3">
                                    <Image src={formData.testimonial_dp || ''} alt={formData.testimonial_name} width={48} height={48} className="rounded-full object-cover border-2 border-white shadow-md" />
                                    <div> 
                                        <div className="flex items-center gap-1">
                                        <div className="font-bold text-lg mr-2">{formData.testimonial_name}</div>
                                        {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{formData.designation}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            <blockquote className="italic mt-4 text-gray-600 border-l-4 border-gray-200 pl-4">
                                "{formData.comment}"
                            </blockquote>
                        </div>
                    </div>
                ) : (
                    // --- CREATE/EDIT MODE ---
                    <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-6 pl-2 space-y-6 horizontal-scrollbar ">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ImageUploadField label="Before Image" currentPath={formData.before_image} onFileSelect={setBeforeImageFile} isViewMode={isViewMode} />
                            <ImageUploadField label="After Image" currentPath={formData.after_image} onFileSelect={setAfterImageFile} isViewMode={isViewMode} />
                        </div>

                        <h3 className="text-lg font-semibold">Testimonial Details</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start lg:items-end">
                            <ImageUploadField label="Person's Image" currentPath={formData.testimonial_dp} onFileSelect={setTestimonialDpFile} isViewMode={isViewMode} />
                            <div className="lg:col-span-2 space-y-4">
                                <Input name="testimonial_name" placeholder="Person's Name" value={formData.testimonial_name} onChange={handleInputChange} />
                                <Input name="designation" placeholder="Designation (e.g., Homeowner)" value={formData.designation} onChange={handleInputChange} />
                                <div>
                                    <Label>Rating</Label>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map(star => <button type="button" key={star} onClick={() => setFormData(p => ({ ...p, rating: star }))} className={`transition-colors ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}><Star size={24} fill={star <= formData.rating ? 'currentColor' : ''} className=' cursor-pointer ' /></button>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className='mb-4'>Comment / Testimonial</Label>
                            <Textarea name="comment" value={formData.comment} onChange={handleInputChange} rows={4} />
                        </div>
                        <div className="text-lg font-semibold">Metadata</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="category_id">Category <span className="text-red-500 m-2 ">*</span></Label>
                                <Select name="category_id" onValueChange={value => handleSelectChange('category_id', value)} value={formData.category_id ? String(formData.category_id) : ''}>
                                    <SelectTrigger className='bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200'><SelectValue placeholder="Select a Category" /></SelectTrigger>
                                    <SelectContent position="popper" className="bg-white border shadow-lg">
                                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="page_id">Page <span className="text-red-500 m-2">*</span></Label>
                                <Select name="page_id" onValueChange={value => handleSelectChange('page_id', value)} value={formData.page_id ? String(formData.page_id) : ''}>
                                    <SelectTrigger className='bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200'><SelectValue placeholder="Select a Page" /></SelectTrigger>
                                    <SelectContent position="popper" className="bg-white border shadow-lg">
                                        {pages.map(p => <SelectItem key={p.id} value={String(p.id)} className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Status <span className="text-red-500 m-2">*</span></Label>
                                <Select name="status" onValueChange={value => setFormData(p => ({ ...p, status: value as any }))} value={formData.status}>
                                    <SelectTrigger className='bg-[#00423D]/15 z-10 hover:bg-[#00423D]/25 active:bg-[#00423D]/35 transition-colors duration-200'><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent position="popper" className="bg-white border shadow-lg">
                                        <SelectItem value="published" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Published</SelectItem>
                                        <SelectItem value="draft" className="hover:bg-[#00423D]/10 focus:bg-[#00423D]/15 data-[state=checked]:bg-[#00423D]/20 data-[state=checked]:text-[#00423D] data-[state=checked]:font-medium transition-colors duration-150 cursor-pointer">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="sticky bottom-0 bg-white py-4 mt-4 -mx-2">
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}