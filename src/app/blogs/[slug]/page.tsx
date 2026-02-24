// File: src/app/blogs/[slug]/page.tsx

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { formatDate, calculateReadTime } from '@/lib/utils';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ScrollToTopButton } from './ScrollToTopButton'; // NEW: Import ScrollToTopButton
import { Tag, Folder } from 'lucide-react'; // NEW: Import icons
import { BlogHeroSection } from './BlogHeroSection'; // NEW: Import BlogHeroSection
import { ClearPerformanceMarks } from '@/components/ClearPerformanceMarks'; // Import to clear performance marks
import { pool, executeQuery } from '@/lib/db';


const BackgroundPattern = ({
  color = '#00423D',
  opacity = 0.05,
}: { color?: string; opacity?: number }) => {
  const encodedColor = encodeURIComponent(color);
  const svgUrl = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodedColor}' fill-opacity='${opacity}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
  return <div className="absolute  inset-0 z-0 pointer-events-none" style={{ backgroundImage: svgUrl }}></div>;
};
// --- INTERFACES ---
interface Blog {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  created_at: string;
  slug: string;
  content: string;
  category_id: number;
  category_name: string;
  tags: { id: number; name: string; slug: string }[];
  before_image?: string;
  after_image?: string;
}
interface SimilarBlog {
  id: number;
  title: string;
  slug: string;
  image: string;
  created_at: string;
  content: string;
}

// --- DATA FETCHING ---
async function getBlog(slug: string): Promise<Blog | null> {
  try {
    const trimmedSlug = slug.trim();
    // Query 1: Get the main blog details
    const blogQuery = `
      SELECT nb.*, bc.name AS category_name
      FROM new_blogs nb
      LEFT JOIN blog_categories bc ON nb.category_id = bc.id
      WHERE TRIM(nb.slug) = ? AND nb.status = 'published' AND nb.deleted_at IS NULL;
    `;
    const [blogs]: any[] = await executeQuery(blogQuery, [trimmedSlug]);

    if (blogs.length === 0) {
      notFound(); // real 404 only
    }

    const blog = blogs[0];

    // Query 2: Get all associated tag IDs
    const tagLinksQuery = 'SELECT tag_id FROM blog_tag_link WHERE blog_id = ?';
    const [tagLinks]: any[] = await executeQuery(tagLinksQuery, [blog.id]);
    const tagIds = tagLinks.map((link: { tag_id: number }) => link.tag_id);

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

    return blog;
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    throw new Error(`Failed to fetch blog: ${error.message}`);
  }
}


// async function getSimilarBlogs(blog: Blog): Promise<SimilarBlog[]> {
//   const tagIds = blog.tags.map(t => t.id).join(',');
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs/similar?currentId=${blog.id}&categoryId=${blog.category_id}&tags=${tagIds}`, { cache: 'no-store' });
//   if (!res.ok) return [];
//   return res.json();
// }

// --- SUB-COMPONENTS ---
const BlogMeta = ({ blog }: { blog: Blog }) => {
  const readTime = calculateReadTime(blog.content);
  const formattedDate = formatDate(blog.created_at);
  return (
    <div className="flex flex-wrap  items-center gap-x-1 border-b border-[#00423D]  gap-y-2 text-gray-500 mb-4 pb-4">
      <div className="flex items-center gap-2">
        <Image src="/favicon.png" alt="Team KayaPalat" width={32} height={32} className="rounded-full  border-2 border-[#00423D]" />
        <span className='text-[#00423D] font-semibold'>Team KayaPalat</span>
      </div>
      <span>&middot;</span>
      <div dangerouslySetInnerHTML={{ __html: formattedDate }} />
      <span>&middot;</span>
      <span>{readTime} min read</span>
    </div>
  );
};

// NEW: Sub-component for displaying category and tags
const BlogTagsAndCategory = ({ blog }: { blog: Blog }) => (
  <div className="flex flex-wrap items-center gap-3 mb-4">
    <span className="flex items-center gap-2 bg-[#00423D] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
      <Folder size={12} />
      {blog.category_name}
    </span>
    {blog.tags.map(tag => (
      <span key={tag.id} className="bg-[#e0f7ef] text-xs text-[#00423D] border border-[#00423D] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
        <Tag size={12} />
        {tag.name}
      </span>
    ))}
  </div>
);


const Sidebar = ({ similarBlogs }: { similarBlogs: SimilarBlog[] }) => (
  <aside className="sticky top-24">
    <h3 className="text-xl font-bold mb-4 text-gray-800">Similar Articles</h3>

    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {similarBlogs.length > 0 ? similarBlogs.map(blog => {
        const readTime = calculateReadTime(blog.content);
        const formattedDate = formatDate(blog.created_at);
        return (
          <Link href={`/blogs/${blog.slug}`} key={blog.id} className="group flex gap-4 items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image src={blog.image} alt={blog.title} fill style={{ objectFit: 'cover' }} className="rounded-md" />
            </div>
            <div>
              <h6 className="font-bold text-sm text-gray-900 group-hover:text-[#00423D] transition-colors line-clamp-2">{blog.title}</h6>
              <div className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: `${formattedDate} &middot; ${readTime} min read` }} />
            </div>
          </Link>
        )
      }) : <p className="text-sm text-gray-500">No similar articles found.</p>}
    </div>


    <div className="">
      {/* UPDATED: Added shadow */}
      <div className="mt-8 bg-white p-6 rounded-xl border-2 border-[#00423D] text-center shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Talk to an Expert</h3>
        <p className="mb-4 text-gray-600 text-sm">Get a free consultation for your dream home.</p>
        <Link href="/contact-us" className="bg-[#00423D] text-white font-bold px-4 py-2 text-sm rounded-full hover:bg-[#00261a] transition">
          Contact Us
        </Link>
      </div>

      {/* UPDATED: Inverted color scheme and added shadow */}
      <div className="mt-6 bg-[#00423D] text-white p-6 rounded-xl text-center shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Plan Your Project</h3>
        <p className="mb-4 text-gray-300 text-sm">Use our calculator to get a personalized estimate.</p>
        <Link href="/estimate" className="bg-white text-[#00423D] font-bold px-4 py-2 text-sm rounded-full hover:bg-gray-200 transition">
          Get an Estimate
        </Link>
      </div>
    </div>
  </aside>
);

// --- MAIN PAGE COMPONENT ---
export default async function BlogReadPage({ params }: { params: { slug: string } }) {
  // In certain Next.js scenarios (like dynamic rendering), `params` can be a promise.
  // We must await it to get the actual values.
  const resolvedParams = await (params as any);
  const { slug } = resolvedParams;

  if (!slug) {
    // If there's no slug after resolving, it's a genuine 404 case.
    notFound();
  }

  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const similarBlogs: SimilarBlog[] = [];

  return (
    <>
      <ClearPerformanceMarks /> {/* Clear performance marks to prevent negative timestamp errors */}
      <ScrollToTopButton /> {/* NEW: Added scroll to top button */}

      <BlogHeroSection />

      <section className="relative bg-[#F4F7F4] py-16 px-6">
        <BackgroundPattern />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-12">

          <div className="lg:col-span-7">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/blogs">Blogs</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href={`/blogs/${blog.slug}`}>{blog.title}</BreadcrumbLink></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h2 className="text-3xl md:text-4xl font-bold my-4 text-[#00423D]">{blog.title}</h2>

            {/* NEW: Display Category and Tags */}
            <BlogTagsAndCategory blog={blog} />
            <BlogMeta blog={blog} />
{blog.excerpt && (
  <p className="text-lg text-gray-600 mb-4">
    {blog.excerpt}
  </p>
)}
{blog.image && (
  <div className="relative w-full h-[420px] my-6 rounded-xl overflow-hidden">
    <Image
      src={blog.image}
      alt={blog.title}
      fill
      className="object-cover"
    />
  </div>
)}



            <article
              className="prose prose-lg max-w-none text-[#222]"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          <div className="lg:col-span-3">
            <Sidebar similarBlogs={similarBlogs} />
          </div>
        </div>
      </section>
    </>
  );
}