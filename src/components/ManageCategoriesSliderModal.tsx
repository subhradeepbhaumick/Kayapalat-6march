// File: src/app/admin/designs/_components/ManageCategoriesSliderModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Plus, GripVertical, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FaCouch, FaBed, FaLightbulb, FaHardHat } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Label } from '@/components/ui/label';
import { FaGrip } from 'react-icons/fa6';
import { AVAILABLE_ICONS } from '@/components/ICONS';

interface Category { id: number; name: string; icon_name: string; }
interface ManageCategoriesModalProps { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }

const SortableCategoryItem = ({ category, onDelete }: { category: Category, onDelete: (id: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    // UPDATED: Removed {...attributes} from this div
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2  hover:bg-gray-100 hover:border hover:border-[#00261a]">
      <div className="flex items-center gap-2">
        {/* UPDATED: Moved {...attributes} to the drag handle button */}
        <button {...attributes} {...listeners} className="cursor-grab p-1">
          <FaGrip className="h-5 w-5 text-gray-400" />
        </button>
        <span className="text-sm text-[#00261a]">{AVAILABLE_ICONS.find(icon => icon.name === category.icon_name)?.component}</span>
        <span className="text-sm ">{category.name}</span>
      </div>
      {/* UPDATED: onClick now correctly calls the onDelete prop */}
      <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)} className="h-8 w-8 cursor-pointer hover:bg-red-100">
        <X className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

// --- Main Modal Component ---
export function ManageCategoriesSliderModal({ isOpen, onOpenChange }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(AVAILABLE_ICONS[0].name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/slider-categories');
      setCategories(await res.json());
    } catch (error) {
      toast.error('Failed to load categories.');
    }
  };

  useEffect(() => { if (isOpen) fetchCategories(); }, [isOpen]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/slider-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, icon_name: selectedIcon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category.');
      setNewCategoryName('');
      fetchCategories();
      toast.success('Category added!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/slider-categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category.');
      fetchCategories();
      toast.success('Category deleted!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    const orderedIds = categories.map(cat => cat.id);
    try {
      const res = await fetch('/api/slider-categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to save order.');
      toast.success('Category order saved!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save order.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='bg-white max-w-2xl max-h-[90vh]'>
        <DialogHeader><DialogTitle>Manage Slider Categories</DialogTitle></DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-2">

          {/* --- Add New Category Section --- */}
          <div>
            <Label>New Category Name</Label>
            <div className="flex gap-2 ml-[2px] mt-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter Category Name"
                className='focus-visible:ring-1 focus-visible:ring-[#00423D]'
              />
            </div>
          </div>

          {/* --- Icon Selector --- */}
          <div>
            <Label>Select Icon</Label>
            <div className="mt-1 p-2 border rounded-md bg-gray-50">
              {/* UPDATED: Added the custom scrollbar class and bottom padding */}
              <div className="flex gap-2 overflow-x-auto pb-3 horizontal-scrollbar">
                {AVAILABLE_ICONS.map(icon => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={`p-2 rounded-md cursor-pointer transition-colors text-xl flex-shrink-0 min-w-[35px] ${selectedIcon === icon.name
                      ? 'bg-[#00423D] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {icon.component}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* --- Add Category Button --- */}

          <Button onClick={handleAddCategory} disabled={isSubmitting} className='w-full bg-[#00423D] cursor-pointer text-white hover:bg-[#00261a]'>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>

          <div className="relative border-t pt-4 mt-4">
            <Label>Re-order Categories</Label>
          </div>

          {/* --- Drag and Drop List --- */}
          <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md">
            <DndContext sensors={useSensors(useSensor(PointerSensor))} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categories} strategy={verticalListSortingStrategy}>
                {categories.map(cat => (
                  <SortableCategoryItem key={cat.id} category={cat} onDelete={handleDeleteCategory} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <Button onClick={handleSaveOrder} className="w-full bg-[#00423D] cursor-pointer text-white hover:bg-[#00261a]">Save Order</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}