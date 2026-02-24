// File: src/app/api/blogs/[identifier]/route.ts
// This new file replaces both [id]/route.ts and [slug]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { pool, generateSlug, executeQuery, sanitizeContentLinks } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';
// --- HANDLER FOR GETTING A SINGLE BLOG (LOGIC FROM [slug]/route.ts) ---
/**
 * @description Handles GET requests to fetch a single blog post by its SLUG or ID.
 */

function findImageUrls(htmlContent: string): string[] {
  if (!htmlContent) return [];
  const imgSrcRegex = /<img[^>]+src="([^">]+)"/g;
  const matches = [...htmlContent.matchAll(imgSrcRegex)];
  return matches.map(match => match[1]).filter(url => !url.startsWith('data:image'));
}

export async function GET(req: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  const isNumericId = /^\d+$/.test(identifier);

  try {
    // Query 1: Get the main blog details
    const blogQuery = `
      SELECT nb.*, bc.name AS category_name
      FROM new_blogs nb
      LEFT JOIN blog_categories bc ON nb.category_id = bc.id
      WHERE ${isNumericId ? 'nb.id' : 'TRIM(nb.slug)'} = ${isNumericId ? '?' : 'TRIM(?)'}  AND nb.deleted_at IS NULL;
    `;
    const [blogs]: any[] = await executeQuery(blogQuery, [identifier]);
if (blogs.length === 0) {
  return NextResponse.json(
    { error: 'Blog not found' },
    { status: 404 }
  );
}

    const blog = blogs[0];

    // Query 2: Get all associated tag IDs
    const tagLinksQuery = 'SELECT tag_id FROM blog_tag_link WHERE blog_id = ?';
    const [tagLinks]: any[] = await executeQuery(tagLinksQuery, [blog.id]);
    const tagIds = tagLinks.map((link: { tag_id: number }) => link.tag_id);
    blog.tag_ids = tagIds;

    // --- THIS IS THE CORRECTED LOGIC ---
    try {
      if (tagIds.length > 0) {
        // 1. Create the correct number of '?' placeholders
        const placeholders = tagIds.map(() => '?').join(',');
        // 2. Build the query with the placeholders
        const tagsQuery = `SELECT id, name, slug FROM blog_tags WHERE id IN (${placeholders})`;
        // 3. Execute the query with the flat array of IDs
        const [tags] = await executeQuery(tagsQuery, tagIds);
        blog.tags = tags;
      } else {
        blog.tags = []; // Ensure tags is an empty array if there are no tags
      }
    } catch (tagError) {
      console.error('Error fetching tags:', tagError);
      blog.tags = []; // Set empty tags if query fails
    }

    // Fire-and-forget view count update
executeQuery(
  `UPDATE new_blogs SET view_count = view_count + 1 WHERE id = ?`,
  [blog.id]
).catch(() => {});

    return NextResponse.json(blog);

  } catch (error: any) {
    console.error(`API Error fetching identifier ${identifier}:`, error);
    return NextResponse.json({ error: 'Failed to fetch blog post.', details: error.message }, { status: 500 });
  }
}


// --- HANDLER FOR UPDATING A BLOG (LOGIC FROM [id]/route.ts) ---
/**
 * @description Handles PUT requests to update an existing blog post.
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
    const { identifier } = await params;
    const blogId = parseInt(identifier, 10);
    if (isNaN(blogId)) {
        return NextResponse.json({ error: 'Invalid blog ID.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection(); 
await connection.beginTransaction();

        // Step 1: Get the current state of the blog from the DB for comparison
        const [oldBlogs]: any[] = await executeQuery('SELECT image, content FROM new_blogs WHERE id = ?', [blogId], connection);
        if (oldBlogs.length === 0) {
            throw new Error('Blog not found to update.');
        }
        const oldBlog = oldBlogs[0];

// Step 2: Get the new data from the request
        const body = await request.json();
        const { title, ...otherFields } = body;
        let { content } = body;
        let { slug } = body;
        content = sanitizeContentLinks(content);
        if (!slug && title) {
            slug = generateSlug(title);
        }

       // Step 3: Update the database record with the new data
        const updateBlogQuery = `
            UPDATE new_blogs
            SET title = ?, slug = ?, content = ?, excerpt = ?, image = ?, 
                category_id = ?, status = ?, is_featured = ?, meta_description = ?, user_id = ?
            WHERE id = ?
        `;
        await executeQuery(updateBlogQuery, [
            title, slug, content, otherFields.excerpt, otherFields.image, 
            otherFields.category_id, otherFields.status, otherFields.is_featured, 
            otherFields.meta_description, otherFields.user_id, blogId
        ], connection);

        // --- NEW, ROBUST METHOD FOR BULK INSERT ---
        await executeQuery('DELETE FROM blog_tag_link WHERE blog_id = ?', [blogId], connection);
        if (otherFields.tag_ids && Array.isArray(otherFields.tag_ids)) {
            const validTagIds = otherFields.tag_ids.filter((id: any) => typeof id === 'number' && id > 0);
            if (validTagIds.length > 0) {
                const tagValues = validTagIds.map((tagId: number) => [blogId, tagId]);
                const placeholders = tagValues.map(() => '(?, ?)').join(', ');
                const tagLinkQuery = `INSERT INTO blog_tag_link (blog_id, tag_id) VALUES ${placeholders}`;
                const flatTagValues = tagValues.flat();
                await executeQuery(tagLinkQuery, flatTagValues, connection);
            }
      }

       // Step 4: Compare old and new images to find and delete orphans
       const oldImages = new Set<string>();
       if (oldBlog.image) oldImages.add(oldBlog.image);
       findImageUrls(oldBlog.content).forEach(url => oldImages.add(url));

       const newImages = new Set<string>();
       if (body.image) newImages.add(body.image);
       findImageUrls(body.content).forEach(url => newImages.add(url));

       for (const oldImg of oldImages) {
           if (!newImages.has(oldImg)) {
               try {
                   const serverPath = join(process.cwd(), 'public', oldImg);
                   await unlink(serverPath);
                   console.log(`Deleted orphaned file: ${oldImg}`);
               } catch (fileError: any) {
                   console.error(`Failed to delete orphaned file ${oldImg}:`, fileError.message);
               }
           }
       }

        
await connection.commit();

        return NextResponse.json({ message: 'Blog updated successfully', blogId });

    } catch (error: any) {
        if (connection) {
await connection.rollback();
        }
        console.error(`API PUT Error for blog ID ${blogId}:`, error);
        return NextResponse.json({ error: 'Failed to update blog post.', details: error.message }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// --- HANDLER FOR DELETING A BLOG (LOGIC FROM [id]/route.ts) ---
/**
 * @description Handles DELETE requests to remove a blog post.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  const blogId = parseInt(identifier, 10);
  if (isNaN(blogId)) {
    return NextResponse.json({ error: 'Invalid blog ID.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
await connection.beginTransaction();

    // 1. Get blog data to find all associated images BEFORE deleting
    const [blogs]: any[] = await executeQuery('SELECT image, content FROM new_blogs WHERE id = ?', [blogId], connection);
    if (blogs.length === 0) {

      await executeQuery('COMMIT', [], connection);
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }
    const blog = blogs[0];

    // 2. Collect all image URLs (lead image + content images) into a Set to handle duplicates
    const imagesToDelete = new Set<string>();
    if (blog.image) {
      imagesToDelete.add(blog.image);
    }
    findImageUrls(blog.content).forEach(url => imagesToDelete.add(url));

    // 3. Delete blog and tag links from DB
    await executeQuery('DELETE FROM blog_tag_link WHERE blog_id = ?', [blogId], connection);
    await executeQuery('DELETE FROM new_blogs WHERE id = ?', [blogId], connection);

    // 4. Commit the transaction to finalize DB changes
await connection.commit();

    // 5. Asynchronously delete image files from server AFTER DB commit
    for (const publicPath of imagesToDelete) {
      if (!publicPath) continue;
      try {
        const serverPath = join(process.cwd(), 'public', publicPath);
        await unlink(serverPath);
        console.log(`Deleted file: ${publicPath}`);
      } catch (fileError: any) {
        // Log error if file doesn't exist etc., but don't crash the response
        console.error(`Failed to delete file ${publicPath}:`, fileError.message);
      }
    }

    return NextResponse.json({ message: 'Blog post deleted successfully.' });

  } catch (error: any) {
    if (connection) {
await connection.rollback();
    }
    console.error(`API DELETE Error for blog ID ${blogId}:`, error);
    return NextResponse.json({ error: 'Failed to delete blog post.', details: error.message }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
