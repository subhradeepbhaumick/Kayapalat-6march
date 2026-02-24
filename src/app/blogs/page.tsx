// File: /app/blogs/page.tsx
'use client';

import React, { ReactNode, useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import { FaPlus, FaTag, FaChevronDown, FaFilter, FaArrowUp, FaFacebookF, FaInstagram, FaPinterestP, FaArrowRight } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Transition, Menu } from '@headlessui/react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Clock, XCircle, Mail, MapPin, Phone, ChevronDown } from 'lucide-react';
import {  FaLinkedin, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import Masonry from 'react-masonry-css';

// --- Sub-Component Definitions ---

const ExploreDesignsCard = ({ router }: { router: any }) => (
  <div className="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-[#00423D] to-[#00605A] text-white p-8 rounded-xl flex flex-col items-center justify-center text-center h-full shadow-lg cursor-default">
    <h3 className="text-2xl font-bold mb-3">Explore Our Designs</h3>
    <p className="mb-6 text-[#b4ddc3]">See our gallery of stunning home transformations.</p>
    <button onClick={() => router.push('/gallery')}
      className="bg-white text-[#00423D] font-bold px-6 py-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
      View Gallery
    </button>
  </div>
);

const BookSessionCard = ({ router }: { router: any }) => (
  <div className="md:col-span-1 lg:col-span-1 bg-white p-8 rounded-xl flex flex-col items-center justify-center text-center h-full border-2 border-[#00423D] shadow-lg cursor-default">
    <h3 className="text-2xl font-bold text-gray-800 mb-3">Talk to an Expert</h3>
    <p className="mb-6 text-gray-600">Book a free, no-obligation session with our top designers.</p>
    <button onClick={() => router.push('/contact-us')}
      className="bg-[#00423D] text-white font-bold px-6 py-2 rounded-full hover:bg-[#00261a] transition cursor-pointer">
      Book Now
    </button>
  </div>
);

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className={`fixed bottom-8 right-8 z-50 group transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
            onClick={scrollToTop}
            className="bg-[#00423D] text-white p-4 rounded-full shadow-lg hover:bg-[#00261a] transition-colors cursor-pointer"
            aria-label="Scroll to top"
        >
            <FaArrowUp />
        </button>
        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Scroll to Top
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
        </div>
    </div>
  );
};

const CallToActionSection = ({ router }: { router: any }) => (
  <div
  className="relative bg-cover bg-center border-2 border-[#00423D] px-6 py-32"
  style={{
    backgroundImage:
      "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070')",
  }}
>
  <div className="absolute inset-0 bg-black/50"></div>
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
      Loved Our Designs?
    </h2>
    <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-md">
      Let's turn your dream home into a reality. Get a free estimate and a personalized plan from our experts today.
    </p>
    <div className="mt-8">
      <button
        onClick={() => router.push('/estimate')}
        className="bg-[#00423D] text-white font-bold px-8 py-3 rounded-full text-lg hover:bg-[#005a52] transition-transform hover:scale-105 shadow-xl cursor-pointer"
      >
        Get a Free Estimate
      </button>
    </div>
  </div>
</div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 cursor-pointer">
                <span>{question}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <FaPlus />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <p className="text-gray-600">{answer}</p>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const faqs = [
        { q: "What design services do you offer?", a: "We offer a full range of interior design services, including space planning, furniture selection, color consultation, lighting design, and full project management from concept to completion." },
        { q: "How long does a typical design project take?", a: "The timeline for a project varies depending on the scope. A single room design might take 4-6 weeks, while a full home renovation could take several months. We provide a detailed project timeline after the initial consultation." },
        { q: "How do you charge for your services?", a: "We offer flexible pricing models, including flat fees for specific packages and hourly rates for consultations. We discuss all costs upfront to ensure full transparency." },
        { q: "Can I be involved in the design process?", a: "Absolutely! We believe in co-creation. Your ideas and preferences are the foundation of our design process. We work closely with you to ensure the final space is a true reflection of your personality." }
    ];

    return (
        <div className="relative bg-[#F4F7F4] py-24 px-6">
            <div className="absolute inset-0 opacity-25" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300423D' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
            <div className="relative max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#00423D] mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-gray-600 mb-12">
                    Have questions? We have answers. Here are some common queries about our process and services.
                </p>
                <div className="bg-white p-8 rounded-xl shadow-lg text-left">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ContactSection = ({ router }: { router: any }) => {
    return(
      <section className="py-16 bg-gradient-to-r from-rose-50 to-pink-50 relative">
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="contactPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="3" fill="none" stroke="#EC4899" strokeWidth="0.5"/>
              <circle cx="10" cy="10" r="1" fill="#EC4899" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contactPattern)"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-5xl mb-6 text-gray-900 font-bold" style={{ fontFamily: "'Abril Fatface', cursive" }}>
            Get In Touch
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            Ready to transform your space? Let's discuss your project and bring your vision to life.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8">
          {[
            { icon: MapPin, title: "Visit Us", info: "179-A, Survey Park Rd, Purba Diganta, Santoshpur, Kolkata - 700075, WB, India", link: "https://www.google.com/maps/search/?api=1&query=179-A,+Survey+Park+Rd,+Purba+Diganta,+Santoshpur,+Kolkata+-+700075,+WB,+India" },
            { icon: Phone, title: "Call Us", info: "+91 602-602-602-6", link: "tel:+916026026026" },
            { icon: Mail, title: "Email Us", info: "info@kayapalat.co", link: "mailto:info@kayapalat.co" }
          ].map((contact, index) => (
            <motion.div
              key={index}
              className="bg-[#F8FDF8] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <a href={contact.link} target="_blank" rel="noopener noreferrer" className=" h-full flex flex-col justify-between cursor-pointer">
                <contact.icon className="w-12 h-12 text-[#00423D] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-gray-700 font-medium mb-1 hover:underline flex-grow flex items-center justify-center">{contact.info}</p>
              </a>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/contact-us" className="px-8 py-4 rounded-full bg-[#00423D] text-white font-bold hover:bg-[#063F3C] transition transform hover:scale-105 active:scale-95 shadow-lg">
              Contact Us Today
            </Link>
            <Link href="/estimate" className="px-8 py-4 rounded-full border-2 border-[#00423D] text-[#00423D] hover:bg-[#00423D] hover:text-white transition transform hover:scale-105 active:scale-95">
              Get Free Estimate
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
    );
};


// --- Interfaces ---
interface Blog { 
  is_featured: number; 
  id: number; 
  title: string; 
  excerpt: ReactNode; 
  content: string; 
  image: string; 
  slug: string; 
  created_at: string; 
  view_count: number; 
  category_name: string | null; 
  category_slug: string | null; 
  tags: { name: string; slug: string }[] | null; 
}
interface Category { id: number; name: string; slug: string; }
interface PromoCard { type: 'promo'; id: string; component: React.ElementType; }

const BLOGS_PER_PAGE = 10;

// --- Main Page Component ---
const BlogsPage = () => {
  const router = useRouter();

  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.2 });

  const [sortOrder, setSortOrder] = useState<'latest' | 'popular'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const loadMoreBlogs = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetch(`/api/blogs?page=${page}&limit=${BLOGS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch more blogs');
      const data = await response.json();
      
      setAllBlogs(prevBlogs => [...prevBlogs, ...data.blogs]);
      setPage(prevPage => prevPage + 1);
      
      if (allBlogs.length + data.blogs.length >= data.total) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore, hasMore, allBlogs.length]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoriesResponse, blogsResponse] = await Promise.all([
            fetch('/api/blogs/blog_categories', { cache: 'no-store' }),
            fetch(`/api/blogs?page=1&limit=${BLOGS_PER_PAGE}`, { cache: 'no-store' })
        ]);

        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        if (!blogsResponse.ok) throw new Error('Failed to fetch blogs');

        const categoriesData = await categoriesResponse.json();
        const blogsData = await blogsResponse.json();

        if (!Array.isArray(categoriesData)) throw new Error('Invalid category data');
        if (!blogsData || !Array.isArray(blogsData.blogs)) throw new Error('Invalid blog data format');
        
        setCategories(categoriesData);
        setAllBlogs(blogsData.blogs);
        setPage(2);
        setHasMore(blogsData.blogs.length < blogsData.total);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (inView && !loading && hasMore && !isLoadingMore) {
      loadMoreBlogs();
    }
  }, [inView, loading, hasMore, isLoadingMore, loadMoreBlogs]);

  const itemsToDisplay = useMemo(() => {
    let filteredBlogs: Blog[] = [...allBlogs];
    if (selectedCategory) {
      filteredBlogs = filteredBlogs.filter(blog => blog.category_slug === selectedCategory.slug);
    }
    filteredBlogs.sort((a, b) => {
      if (sortOrder === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.view_count - a.view_count;
    });

    const interspersedItems: (Blog | PromoCard)[] = [];
    const promoCards: PromoCard[] = [
        { type: 'promo', id: 'promo-1', component: () => <ExploreDesignsCard router={router} /> },
        { type: 'promo', id: 'promo-2', component: () => <BookSessionCard router={router} /> },
    ];
    
    const PROMO_FREQUENCY = 4;
    let promoIndex = 0;

    filteredBlogs.forEach((blog, index) => {
        interspersedItems.push(blog);
        if ((index + 1) % PROMO_FREQUENCY === 0 && promoCards.length > 0) {
            const promoToAdd = promoCards[promoIndex % promoCards.length];
            interspersedItems.push({ ...promoToAdd, id: `${promoToAdd.id}-${index}` });
            promoIndex++;
        }
    });

    return interspersedItems;
  }, [allBlogs, selectedCategory, sortOrder, router]);
  
const BackgroundPattern = ({
  color = '#00423D',
  opacity = 0.05,
}: { color?: string; opacity?: number }) => {
    const encodedColor = encodeURIComponent(color);
    const svgUrl = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodedColor}' fill-opacity='${opacity}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
    return <div className="absolute inset-0 z-0" style={{ backgroundImage: svgUrl }}></div>;
  };

  const breakpointColumnsObj = {
    default: 3,
    1280: 4,
    768: 2,
    640: 1
  };

  return (
    <>
      <ScrollToTopButton />
      <section className="relative w-full bg-[#F4F7F4]">
        <div className="relative bg-[#00423D] md:min-h-screen text-white pt-32 pb-24 px-6 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-40 left-15 w-12 h-12 bg-white rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute top-40 right-20 w-32 h-32 bg-white rounded-full opacity-8 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-40 left-40 w-28 h-28 bg-white rounded-full opacity-5 animate-pulse" style={{animationDelay: '5s'}}></div>
          </div>
          <BackgroundPattern color="#FFFFFF" opacity={0.05} />
          <div className="relative max-w-4xl mx-auto text-center z-10">
            <h1 className="text-4xl md:text-8xl mt-10 py-10 mb-6 font-extrabold tracking-tight" style={{ fontFamily: "'Abril Fatface', cursive" }}>
              <span className="text-[#D2EBD0]">The Design Journal</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#b4ddc3] max-w-2xl mb-12 py-6 mx-auto drop-shadow">
              Your weekly dose of inspiration. From grand transformations to the finishing touches that make a house a home.
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
                <p className="text-[#b4ddc3] font-semibold">Follow Us:</p>
                <a href="https://facebook.com/" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaFacebookF /></a>
                <a href="https://instagram.com/" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaInstagram /></a>
                <a href="https://www.youtube.com/@kayapalat1622" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaYoutube /></a>
                <a href="https://linkedin.com/" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaLinkedinIn /></a>
            </div>
          </div>
          <motion.div
          className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, 0, 20] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <span className="text-sm text-white font-medium">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-white animate-bounce" />
        </motion.div>
        </div>
        
        <div className="relative py-16 px-6">
          <BackgroundPattern color="#00423D" opacity={0.25} />
          <div className="relative max-w-7xl mx-auto">
            <div className="sticky top-0 z-30 mb-12 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="hidden md:flex items-center gap-2">
                <span className="font-semibold text-gray-600">Categories:</span>
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                      {selectedCategory ? selectedCategory.name : 'All Stories'}
                      <FaChevronDown className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Menu.Button>
                  </div>
                  <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <Menu.Items className="absolute left-0 z-30 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>{({ active }) => (<button onClick={() => setSelectedCategory(null)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm cursor-pointer`}>All Stories</button>)}</Menu.Item>
                        {categories.map(cat => (<Menu.Item key={`cat-${cat.id}`}>
{({ active }) => (<button onClick={() => setSelectedCategory(cat)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm cursor-pointer`}>{cat.name}</button>)}</Menu.Item>))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="md:hidden flex w-full justify-between items-center">
                  <span className="font-bold text-lg text-gray-700">{selectedCategory ? selectedCategory.name : 'All Stories'}</span>
                  <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#00423D] text-white rounded-lg shadow-md cursor-pointer"><FaFilter /><span>Filter</span></button>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-gray-200 rounded-full p-1 relative flex items-center text-sm">
                  <div className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${sortOrder === 'latest' ? 'left-1' : 'left-[calc(48%)] pl-5'}`} />
                  <button onClick={() => setSortOrder('latest')} className={`relative px-4 py-1 rounded-full transition-colors duration-300 ease-in-out cursor-pointer ${sortOrder === 'latest' ? 'text-[#00423D] font-semibold' : 'text-gray-600'}`}>Latest</button>
                  <button onClick={() => setSortOrder('popular')} className={`relative px-4 py-1 rounded-full transition-colors duration-300 ease-in-out cursor-pointer ${sortOrder === 'popular' ? 'text-[#00423D] font-semibold' : 'text-gray-600'}`}>Popular</button>
                </div>
              </div>
            </div>

            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-6"
              columnClassName="pl-6 bg-clip-padding"
            >
              {itemsToDisplay.map((item) => {
                if ('type' in item && item.type === 'promo') {
                  const PromoComponent = item.component;
                  return <div key={item.id} className="mb-6"><PromoComponent /></div>;
                }
                
                const blog = item as Blog;
                const isFeatured = blog.is_featured === 1;
                return (
                  <div key={blog.id} className={`bg-white rounded-xl group flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200/80 mb-6`}>
                    <div className={`relative w-full ${isFeatured ? 'h-80' : 'h-52'} rounded-t-xl overflow-hidden border-b-2 border-[#00423D]`}>
                      <Image src={blog.image || 'https://placehold.co/600x400/d2ebd0/00423d?text=Image'} alt={blog.title || 'Blog image'} fill style={{ objectFit: 'cover' }} className="transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      {blog.category_name && (<p className="text-sm font-bold text-[#2e8b57] mb-2 uppercase tracking-wider">{blog.category_name}</p>)}
                      <h3 className={`font-bold text-gray-800 mb-3 ${isFeatured ? 'text-2xl' : 'text-lg'}`}>{blog.title}</h3>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {blog.tags.map(tag => (<span key={tag.slug} className="bg-[#e0f7ef] text-xs text-[#00423D] px-2 py-1 rounded-full flex items-center gap-1"><FaTag className="opacity-70" /> {tag.name}</span>))}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mb-5 line-clamp-3" dangerouslySetInnerHTML={{ __html: typeof blog.excerpt === 'string' ? blog.excerpt : '' }} />
                      <div className="mt-auto pt-4 border-t border-gray-200">
                        <button onClick={() => router.push(`/blogs/${blog.slug}`)} className="w-full cursor-pointer rounded-full border-2 border-[#00423D] transition-all bg-[#00423D] text-white hover:bg-[#00261a] px-6 py-2 text-sm font-medium flex items-center justify-center gap-2">Read Story <FaArrowRight className="text-xs" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Masonry>
            
            {isLoadingMore && <div className="text-center col-span-full py-8 text-[#00423D]">Loading more stories...</div>}
            <div ref={ref} className="h-10" />
            {!loading && !hasMore && allBlogs.length > 0 && <div className="text-center col-span-full py-8 text-gray-500">You've reached the end!</div>}
            {!loading && allBlogs.length === 0 && (<div className="text-center col-span-full py-16"><h3 className="text-2xl font-bold text-[#00423D]">No Stories Found</h3><p className="text-gray-600 mt-2">Try selecting a different category or checking back later!</p></div>)}
          </div>
        </div>
        
        <CallToActionSection router={router} />
        <FAQSection />
        <ContactSection router={router} />

        <Transition show={isFilterModalOpen} as={Fragment}>
          <div className="fixed inset-0 z-50 flex items-end">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterModalOpen(false)} /></Transition.Child>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0" leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full">
              <div className="relative w-full bg-white rounded-t-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Filter Stories</h3>
                <div className="space-y-4">
                  <h4 className="font-semibold">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setSelectedCategory(null); setIsFilterModalOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${!selectedCategory ? 'bg-[#00423D] text-white' : 'bg-gray-200 text-gray-800'}`}>All</button>
                    {categories.map(cat => (<button key={cat.id} onClick={() => { setSelectedCategory(cat); setIsFilterModalOpen(false); }} className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${selectedCategory?.id === cat.id ? 'bg-[#00423D] text-white' : 'bg-gray-200 text-gray-800'}`}>{cat.name}</button>))}
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Transition>
      </section>
    </>
  );
};

export default BlogsPage;