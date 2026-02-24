// File: src/app/admin/gallery/_components/GalleryImageForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { X, UploadCloud, Pencil } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

// --- TYPE DEFINITIONS ---
interface Category { id: number; name: string; }
interface GalleryImageData {
    id?: number;
    title: string;
    image_path: string;
    category_id: number | null;
    status: 'published' | 'draft';
    is_featured: boolean;
    likes: number;
    designer_name: string;
    designer_designation: string;
    designer_dp_path: string | null;
    designer_comment: string;
}
interface GalleryImageFormProps {
  mode: 'create' | 'edit';
  image?: Partial<GalleryImageData> | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

const emptyFormData: GalleryImageData = {
    title: '', image_path: '', category_id: null, status: 'published',
    is_featured: false, likes: 0,
    designer_name: 'Team KayaPalat',
    designer_designation: 'Designer | Architect',
    designer_dp_path: null,
    designer_comment: '',
};

export function GalleryImageForm({ mode, image, isOpen, onOpenChange, onSave }: GalleryImageFormProps) {
  const [formData, setFormData] = useState<GalleryImageData>(emptyFormData);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDpFile, setSelectedDpFile] = useState<File | null>(null);
  const [dpPreview, setDpPreview] = useState<string | null>(null);
  
  const originalImageUrl = useRef<string | null>(null);
  const originalDpUrl = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dpFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/gallery-categories');
        setAllCategories(await res.json());
      } catch (error) { toast.error("Failed to load categories."); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (mode === 'edit' && image) {
            const initialData = { 
                ...emptyFormData, 
                ...image, 
                likes: image.likes || 0,
                category_id: image.category_id || null 
            };
            setFormData(initialData);
            setImagePreview(image.image_path || null);
            setDpPreview(image.designer_dp_path || '/user.png');
            originalImageUrl.current = image.image_path || null;
            originalDpUrl.current = image.designer_dp_path || '/user.png';
        } else {
            setFormData(emptyFormData);
            setImagePreview(null);
            setDpPreview('/user.png');
            originalImageUrl.current = null;
            originalDpUrl.current = null;
        }
        setSelectedFile(null);
        setSelectedDpFile(null);
    }
  }, [isOpen, mode, image]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSelectChange = (name: string, value: string) => setFormData(p => ({ ...p, [name]: name === 'category_id' ? Number(value) : value }));
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'dp') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'main') {
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setSelectedDpFile(file);
        setDpPreview(URL.createObjectURL(file));
      }
    }
  };

  const removeSelectedImage = (type: 'main' | 'dp') => {
      if (type === 'main') {
          setSelectedFile(null);
          setImagePreview(originalImageUrl.current);
          if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
          setSelectedDpFile(null);
          setDpPreview(originalDpUrl.current);
          if (dpFileInputRef.current) dpFileInputRef.current.value = "";
      }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category_id || !imagePreview) {
        toast.error('Please fill out required fields: Title, Category, and Image.');
        return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
        if (key === 'category_id') {
            data.append('categoryId', String(value));
        } else if (value !== null) {
            data.append(key, String(value));
        }
    });
    if (selectedFile) data.append('file', selectedFile);
    if (selectedDpFile) data.append('designer_dp_file', selectedDpFile);

    try {
      const response = await fetch('/api/gallery-images', {
        method: mode === 'create' ? 'POST' : 'PUT',
        body: data,
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'An unknown error occurred');
      }
      toast.success(`Image ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          /* Unchecked State (Grey) */
          --switch-bg: 220 13% 91%; /* A light grey */
          --switch-thumb-bg: 0 0% 100%;
          /* Checked State (Teal) */
          --switch-checked-bg: 175 100% 13%; /* Your #00423D in HSL */
          --switch-checked-thumb-bg: 0 0% 100%;
          /* Focus Ring */
          --switch-ring: 175 100% 20%;
        }
        button[role="switch"] {
          background-color: hsl(var(--switch-bg));
          border: 2px solid #333; /* Added a visible border */
          border-radius: 9999px;
          display: inline-flex;
          height: 24px;
          width: 44px;
          flex-shrink: 0;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.07); /* Added a subtle shadow */
        }
        button[role="switch"]:focus-visible {
          outline: 2px solid transparent;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px hsl(var(--switch-ring));
        }
        button[role="switch"][data-state="checked"] {
          background-color: hsl(var(--switch-checked-bg));
          border-color: hsl(var(--switch-checked-bg));
        }
        button[role="switch"] > span {
          pointer-events: none;
          display: block;
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          background-color: hsl(var(--switch-thumb-bg));
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease-in-out;
          transform: translateX(2px);
          will-change: transform;
          border: 2px solid hsl(var(--switch-thumb-bg));
        }
        button[role="switch"][data-state="checked"] > span {
          transform: translateX(20px);
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl h-[95vh] flex flex-col bg-white">
          <DialogHeader><DialogTitle>{mode === 'create' ? 'Add New Image' : 'Edit Image'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-6 pl-2 space-y-6">
            <div>
              <Label>Lead Image*</Label>
              <div className="mt-2 aspect-video w-full relative rounded-lg border-2 border-dashed flex items-center justify-center group bg-slate-50">
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} className="rounded-lg p-1" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-4">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white flex items-center gap-2 p-2 bg-black/50 rounded-lg hover:bg-black/70"><Pencil className="w-4 h-4"/> Change</button>
                      {selectedFile && <button type="button" onClick={() => removeSelectedImage('main')} className="p-2 bg-white/80 rounded-full text-gray-800 hover:bg-white"><X className="w-4 h-4"/></button>}
                    </div>
                  </>
                ) : (
                  <div className="text-center cursor-pointer p-4" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400"/><p>Click to upload</p>
                  </div>
                )}
                <Input id="file" type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'main')} className="hidden" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="title">Title*</Label><Input id="title" name="title" value={formData.title} onChange={handleInputChange} /></div>
              <div><Label htmlFor="category_id">Category*</Label>
                <Select name="category_id" value={formData.category_id ? String(formData.category_id) : ""} onValueChange={(v) => handleSelectChange('category_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>{allCategories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Designer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center gap-2">
                  <Label>Designer DP</Label>
                  <div className="relative w-24 h-24 rounded-full group bg-slate-100">
                    {dpPreview && <Image src={dpPreview} alt="DP" fill className="rounded-full object-cover"/>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white gap-2">
                      <button type="button" onClick={() => dpFileInputRef.current?.click()}><Pencil size={24}/></button>
                      {selectedDpFile && <button type="button" onClick={() => removeSelectedImage('dp')}><X size={24}/></button>}
                    </div>
                    <Input type="file" accept="image/*" ref={dpFileInputRef} onChange={(e) => handleFileChange(e, 'dp')} className="hidden" />
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><Label htmlFor="designer_name">Name</Label><Input id="designer_name" name="designer_name" value={formData.designer_name} onChange={handleInputChange} /></div>
                  <div><Label htmlFor="designer_designation">Designation</Label><Input id="designer_designation" name="designer_designation" value={formData.designer_designation} onChange={handleInputChange} /></div>
                </div>
              </div>
              <div><Label htmlFor="designer_comment">Comment</Label><Textarea id="designer_comment" name="designer_comment" value={formData.designer_comment} onChange={handleInputChange} rows={3} /></div>
            </div>
            
            <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><Label htmlFor="likes">Likes</Label><Input id="likes" name="likes" type="number" value={formData.likes} onChange={handleInputChange} /></div>
              <div><Label htmlFor="status">Status</Label>
                <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 "><Label>Featured</Label>
                <div className="flex items-center">
                  <span className="mr-2">No</span>
                  <Switch className='border-2 border-dashed border-black' checked={formData.is_featured} onCheckedChange={(c) => setFormData(p => ({...p, is_featured: c}))} />
                <span className="ml-4">Yes</span>
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white py-4 -mx-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
