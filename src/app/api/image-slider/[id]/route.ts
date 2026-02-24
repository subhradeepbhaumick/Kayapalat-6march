// File: src/app/api/image-slider/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { pool, executeQuery } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

// Helper to get all image paths from a slider object
const getImagesFromSlider = (slider: any): string[] => {
    return [slider.before_image, slider.after_image, slider.testimonial_dp].filter(Boolean);
}

// GET a single slider by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [sliders] = await executeQuery('SELECT * FROM imageslider WHERE id = ?', [id]);
    if (sliders.length === 0) {
        return NextResponse.json({ error: 'Slider not found' }, { status: 404 });
    }
    return NextResponse.json(sliders[0]);
}

// DELETE a slider by ID (with image cleanup)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sliderId = parseInt(id, 10);
    let connection;
    try {
        connection = await pool.getConnection();
        await executeQuery('START TRANSACTION', [], connection);
        
        // 1. Get the slider data to find its images before deleting
        const [sliders]: any[] = await executeQuery('SELECT * FROM imageslider WHERE id = ?', [sliderId], connection);
        if (sliders.length === 0) throw new Error('Slider not found');
        const sliderToDelete = sliders[0];
        
        // 2. Delete the database record
        await executeQuery('DELETE FROM imageslider WHERE id = ?', [sliderId], connection);
        
        // 3. Delete the associated image files from the server
        const imagesToDelete = getImagesFromSlider(sliderToDelete);
        for (const imgPath of imagesToDelete) {
            try { 
                await unlink(join(process.cwd(), 'public', imgPath));
                console.log(`Deleted file: ${imgPath}`);
            } catch (e) { 
                console.error(`Failed to delete file ${imgPath}:`, e); 
            }
        }
        
        await executeQuery('COMMIT', [], connection);
        return NextResponse.json({ message: 'Slider deleted successfully' });
    } catch (error: any) {
        if (connection) await executeQuery('ROLLBACK', [], connection);
        return NextResponse.json({ error: 'Failed to delete slider.', details: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PUT (Update) a slider by ID (with image cleanup)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sliderId = parseInt(id, 10);
    if (isNaN(sliderId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await executeQuery('START TRANSACTION', [], connection);
        
        // 1. Get the old slider data before updating
        const [oldSliders]: any[] = await executeQuery('SELECT * FROM imageslider WHERE id = ?', [sliderId], connection);
        if (oldSliders.length === 0) throw new Error('Slider not found');
        const oldSlider = oldSliders[0];
        
        const newData = await request.json();
        const { before_image, after_image, testimonial_name, designation, rating, comment, testimonial_dp, category_id, page_id, status } = newData;

        // 2. Update the database record
        const query = `
            UPDATE imageslider 
            SET before_image = ?, after_image = ?, testimonial_name = ?, designation = ?, 
                rating = ?, comment = ?, testimonial_dp = ?, category_id = ?, page_id = ?, status = ? 
            WHERE id = ?
        `;
        await executeQuery(query, [before_image, after_image, testimonial_name, designation, rating, comment, testimonial_dp, category_id, page_id, status, sliderId], connection);
        
        // 3. Compare old and new image lists to find and delete orphans
        const oldImages = getImagesFromSlider(oldSlider);
        const newImages = getImagesFromSlider(newData);
        const imagesToDelete = oldImages.filter(img => !newImages.includes(img));

        for (const imgPath of imagesToDelete) {
            try { 
                await unlink(join(process.cwd(), 'public', imgPath));
                console.log(`Deleted orphaned file: ${imgPath}`);
            } catch (e) { 
                console.error("Failed to delete orphaned image:", e); 
            }
        }
        
        await executeQuery('COMMIT', [], connection);
        return NextResponse.json({ message: 'Slider updated successfully' });
    } catch (error: any) {
        if (connection) await executeQuery('ROLLBACK', [], connection);
        return NextResponse.json({ error: 'Failed to update slider.', details: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}