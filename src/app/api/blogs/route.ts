import { NextResponse, NextRequest } from 'next/server';
import { pool, generateSlug, executeQuery, sanitizeContentLinks } from '@/lib/db';

/**
 * @description Helper function to generate a URL-friendly slug from a title.
 * Appends a timestamp to ensure uniqueness.
 * @param {string} title - The title to convert into a slug.
 * @returns {string} A unique, URL-safe slug.
 */


/**
 * @description Handles GET requests to fetch paginated blog posts.
 * It accepts 'page' and 'limit' query parameters for infinite scrolling.
 */
// In /app/api/blogs/route.ts
// Replace your old GET function with this one

// src/app/api/blogs/route.ts

// ... (keep your generateSlug and POST functions as they are)

// src/app/api/blogs/route.ts

// ... (keep your other functions like POST, etc.)
// src/app/api/blogs/route.ts

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category') || '';
    const showFeaturedOnly = searchParams.get('featured') === 'true';

    let whereClause = "WHERE 1=1";
    const queryParams: (string | number)[] = [];

    if (!status) {
        whereClause += " AND nb.status = 'published'";
    } else if (status && status !== 'all') {
        whereClause += " AND nb.status = ?";
        queryParams.push(status);
    }
    
    if (showFeaturedOnly) {
        whereClause += " AND nb.is_featured = 1";
    }
    if (searchTerm) {
      whereClause += " AND nb.title LIKE ?";
      queryParams.push(`%${searchTerm}%`);
    }
    if (categorySlug) {
      whereClause += " AND bc.slug = ?";
      queryParams.push(categorySlug);
    }

    const dataQuery = `
      SELECT
        nb.id, nb.title, nb.slug, nb.status, nb.image, nb.created_at, nb.excerpt, nb.is_featured, nb.view_count,
        bc.name AS category_name,
        bc.slug as category_slug,
        GROUP_CONCAT(bt.name SEPARATOR ',') AS tag_names,
        GROUP_CONCAT(bt.slug SEPARATOR ',') AS tag_slugs
      FROM new_blogs nb
      LEFT JOIN blog_categories bc ON nb.category_id = bc.id
      LEFT JOIN blog_tag_link btl ON nb.id = btl.blog_id
      LEFT JOIN blog_tags bt ON btl.tag_id = bt.id
      ${whereClause}
      GROUP BY nb.id
      ORDER BY nb.created_at DESC
      LIMIT ? OFFSET ?;
    `;

    // --- MODIFICATION IS HERE: Made the JOINs identical to the dataQuery ---
    const countQuery = `
        SELECT COUNT(DISTINCT nb.id) as total
        FROM new_blogs nb
        LEFT JOIN blog_categories bc ON nb.category_id = bc.id
        LEFT JOIN blog_tag_link btl ON nb.id = btl.blog_id
        LEFT JOIN blog_tags bt ON btl.tag_id = bt.id
        ${whereClause};
    `;
    
    const dataParams = [...queryParams, limit, offset];
    
    const [blogsResult] = await executeQuery(dataQuery, dataParams);
    const [countResult] = await executeQuery(countQuery, queryParams);

    const total = countResult[0].total;

    const blogs = blogsResult.map((blog: any) => {
        let tags = [];
        if (blog.tag_names && blog.tag_slugs) {
            const tagNames = blog.tag_names.split(',');
            const tagSlugs = blog.tag_slugs.split(',');
            tags = tagNames.map((name: string, index: number) => ({
                name: name.trim(),
                slug: tagSlugs[index].trim(),
            }));
        }
        return { ...blog, tags };
    });

    return NextResponse.json({ blogs, total });

  } catch (error: any) {
    console.error('API GET Error:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Failed to fetch blogs', details: error.message }, { status: 500 });
  }
}

/**
 * @description Handles POST requests to create a new blog post.
 * Uses a database transaction to ensure all related data is inserted correctly.
 */

export async function POST(request: Request) {
  let connection;
  try {
    connection = await pool.getConnection();
    await executeQuery('START TRANSACTION', [], connection);

    const body = await request.json();
    let { 
      title, content, slug, excerpt, image, user_id, 
      category_id, tag_ids, status, is_featured, meta_description 
    } = body;

    // Server-side validation
    if (!title || !content || !excerpt || !category_id || !user_id) {
      throw new Error('Missing required fields.');
    }

    // Sanitize links in the content before saving
    content = sanitizeContentLinks(content);

    // Smart Slug Generation
    if (!slug) {
      slug = generateSlug(title);
    }

    const blogInsertQuery = `
      INSERT INTO new_blogs
      (user_id, category_id, title, slug, excerpt, content, image, status, is_featured, meta_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result]: any = await executeQuery(blogInsertQuery, [
      user_id, category_id, title, slug, excerpt, content, image, status, is_featured, meta_description
    ], connection);

    const newBlogId = result.insertId;
    if (!newBlogId) {
      throw new Error('Failed to retrieve ID for the new blog post.');
    }

    // Robustly link tags if provided
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      const validTagIds = tag_ids.filter((id: any) => typeof id === 'number' && id > 0);
      if (validTagIds.length > 0) {
        const tagValues = validTagIds.map((tagId: number) => [newBlogId, tagId]);
        const placeholders = tagValues.map(() => '(?, ?)').join(', ');
        const tagLinkQuery = `INSERT INTO blog_tag_link (blog_id, tag_id) VALUES ${placeholders}`;
        const flatTagValues = tagValues.flat();
        await executeQuery(tagLinkQuery, flatTagValues, connection);
      }
    }

    await executeQuery('COMMIT', [], connection);

    return NextResponse.json(
      { message: 'Blog created successfully', blogId: newBlogId, slug: slug },
      { status: 201 }
    );

  } catch (error: any) {
    if (connection) {
      await executeQuery('ROLLBACK', [], connection);
    }
    console.error('API POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post.', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
