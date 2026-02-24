// File: src/app/api/gallery-images/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import path from 'path';
import { writeFile, unlink, stat, mkdir } from 'fs/promises';

// --- HELPER FUNCTION TO ENSURE DIRECTORY EXISTS ---
async function ensureDirExists(directoryPath: string) {
    try {
        await stat(directoryPath);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            await mkdir(directoryPath, { recursive: true });
        } else {
            throw e;
        }
    }
}

// --- GET: FETCHES IMAGES FOR BOTH PUBLIC GALLERY AND ADMIN TABLE ---
// GET function with working filters
export async function GET(req: Request) {
  try {
    console.log(`Request received: ${req.method} ${new URL(req.url).pathname}`);
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const isFeatured = searchParams.get('is_featured');

    let query = `
      SELECT
        gi.id, gi.title, gi.image_path, gi.is_featured, gi.likes,
        gi.designer_name, gi.designer_designation, gi.designer_dp_path,
        gi.designer_comment, gi.view_count, gi.status, gi.created_at,
        gc.id AS category_id, gc.name AS category_name
      FROM galleryimages AS gi
      JOIN gallerycategories AS gc ON gi.category_id = gc.id
      WHERE (gi.title LIKE ? OR gc.name LIKE ?)
    `;
    const params: (string | number | boolean)[] = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (categoryId) {
      query += ' AND gi.category_id = ?';
      params.push(parseInt(categoryId));
    }
    if (status) {
      query += ' AND gi.status = ?';
      params.push(status);
    }
    if (isFeatured === 'true' || isFeatured === 'false') {
        query += ' AND gi.is_featured = ?';
        params.push(isFeatured === 'true');
    }
    query += ' ORDER BY gi.created_at DESC;';
    
    const images = await db.query(query, params);
    return NextResponse.json(images);
  } catch (error) {
    console.error('[ADMIN_GALLERY_IMAGES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST function for creating new images
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const designerDpFile = formData.get('designer_dp_file') as File | null;
        const title = formData.get('title') as string;
        const categoryId = formData.get('categoryId') as string;
        
        if (!file || !title || !categoryId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate that the category exists
        const categoryExists = await db.query('SELECT id FROM gallerycategories WHERE id = ?', [parseInt(categoryId)]);
        if (!categoryExists || categoryExists.length === 0) {
          return NextResponse.json({ error: 'Invalid category ID. Category does not exist.' }, { status: 400 });
        }
    
        const galleryDir = path.join(process.cwd(), 'public', 'gallery');
        await ensureDirExists(galleryDir);
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const imagePath = `/gallery/${filename}`;
        await writeFile(path.join(galleryDir, filename), Buffer.from(await file.arrayBuffer()));
    
        let designerDpPath: string | null = null;
        if (designerDpFile) {
            const dpDir = path.join(process.cwd(), 'public', 'gallery', 'dp');
            await ensureDirExists(dpDir);
            const dpFilename = `${Date.now()}-${designerDpFile.name.replace(/\s/g, '_')}`;
            designerDpPath = `/gallery/dp/${dpFilename}`;
            await writeFile(path.join(dpDir, dpFilename), Buffer.from(await designerDpFile.arrayBuffer()));
        } else {
            designerDpPath = formData.get('designer_dp_path') as string;
        }
    
        const insertQuery = `
            INSERT INTO galleryimages 
            (title, image_path, category_id, status, is_featured, likes, designer_name, designer_designation, designer_dp_path, designer_comment) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
            title, imagePath, parseInt(categoryId), formData.get('status'), formData.get('is_featured') === 'true',
            parseInt(formData.get('likes') as string) || 0, formData.get('designer_name'), formData.get('designer_designation'),
            designerDpPath, formData.get('designer_comment')
        ];
        await db.query(insertQuery, insertParams);
    
        return NextResponse.json({ message: 'Image uploaded successfully' }, { status: 201 });
    
      } catch (error: any) {
        console.error('[GALLERY_IMAGES_POST]', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
      }
}

// PUT function for updating images
export async function PUT(req: Request) {
    try {
        const formData = await req.formData();
        const id = formData.get('id') as string;
        if (!id) return NextResponse.json({ error: 'Image ID is required for update' }, { status: 400 });

        // First, get the existing image data
        const existingImageQuery = 'SELECT image_path, designer_dp_path FROM galleryimages WHERE id = ?';
        const result = await db.query(existingImageQuery, [id]);
        
        if (!result || result.length === 0) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        
        // Extract the first row from the result
        const existingImage = result[0] as {
            image_path: string;
            designer_dp_path: string | null;
        };

        const file = formData.get('file') as File | null;
        const designerDpFile = formData.get('designer_dp_file') as File | null;

        // Handle main image update
        let imagePath = existingImage.image_path;
        if (file) {
            // Delete old image file if it exists
            if (existingImage.image_path) {
                try { 
                    await unlink(path.join(process.cwd(), 'public', existingImage.image_path)); 
                } catch (error) {
                    console.log('Old image file not found or already deleted');
                }
            }
            // Upload new image
            const galleryDir = path.join(process.cwd(), 'public', 'gallery');
            await ensureDirExists(galleryDir);
            const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            imagePath = `/gallery/${filename}`;
            await writeFile(path.join(galleryDir, filename), Buffer.from(await file.arrayBuffer()));
        }

        // Handle designer DP update
        let designerDpPath = existingImage.designer_dp_path;
        if (designerDpFile) {
            // Delete old DP file if it exists and is not the default user.png
            if (existingImage.designer_dp_path && existingImage.designer_dp_path !== '/user.png') {
                try { 
                    await unlink(path.join(process.cwd(), 'public', existingImage.designer_dp_path)); 
                } catch (error) {
                    console.log('Old DP file not found or already deleted');
                }
            }
            // Upload new DP
            const dpDir = path.join(process.cwd(), 'public', 'gallery', 'dp');
            await ensureDirExists(dpDir);
            const dpFilename = `${Date.now()}-${designerDpFile.name.replace(/\s/g, '_')}`;
            designerDpPath = `/gallery/dp/${dpFilename}`;
            await writeFile(path.join(dpDir, dpFilename), Buffer.from(await designerDpFile.arrayBuffer()));
        }
        
        const updateData = {
            title: formData.get('title') as string,
            category_id: parseInt(formData.get('categoryId') as string),
            status: formData.get('status') as string,
            is_featured: formData.get('is_featured') === 'true',
            likes: parseInt(formData.get('likes') as string) || 0,
            designer_name: formData.get('designer_name') as string,
            designer_designation: formData.get('designer_designation') as string,
            designer_comment: formData.get('designer_comment') as string,
            image_path: imagePath,
            designer_dp_path: designerDpPath,
        };

        // Validate that the category exists before updating
        const categoryExists = await db.query('SELECT id FROM gallerycategories WHERE id = ?', [updateData.category_id]);
        if (!categoryExists || categoryExists.length === 0) {
          return NextResponse.json({ error: 'Invalid category ID. Category does not exist.' }, { status: 400 });
        }

        const query = `
            UPDATE galleryimages SET 
            title = ?, category_id = ?, status = ?, is_featured = ?, likes = ?, 
            designer_name = ?, designer_designation = ?, designer_comment = ?,
            image_path = ?, designer_dp_path = ?
            WHERE id = ?
        `;
        const params = [...Object.values(updateData), id];
        await db.query(query, params);

        return NextResponse.json({ message: 'Image updated successfully' });
    } catch (error: any) {
        console.error('[GALLERY_IMAGES_PUT]', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// --- DELETE: REMOVES AN IMAGE AND ITS ASSETS ---
export async function DELETE(req: Request) {
    try {
      // Now expects designer_dp_path as well
      const { id, image_path, designer_dp_path } = await req.json();
  
      if (!id || !image_path) {
        return NextResponse.json({ error: 'Image ID and path are required' }, { status: 400 });
      }
  
      // 1. Delete the main image file
      const fullPath = path.join(process.cwd(), 'public', image_path);
      try { await unlink(fullPath); } 
      catch (e: any) { if (e.code !== 'ENOENT') throw e; }

      // 2. Delete the designer DP file if it exists
      if (designer_dp_path) {
        const dpFullPath = path.join(process.cwd(), 'public', designer_dp_path);
        try { await unlink(dpFullPath); }
        catch (e: any) { if (e.code !== 'ENOENT') throw e; }
      }
  
      // 3. Delete the image record from the database
      const query = 'DELETE FROM galleryimages WHERE id = ?';
      await db.query(query, [id]);
  
      return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
  
    } catch (error: any) {
      console.error('[GALLERY_IMAGES_DELETE]', error);
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}