'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { GalleryImage, Category } from '@/app/gallery/page';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';
import { GalleryCardSkeleton } from '@/components/gallery/GalleryCardSkeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import HeroWithCarousel from "@/components/gallery/HeroWithCarousel";
import { MapPin, Phone, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PromoCard, PromoCardProps } from '@/components/gallery/PromoCard';

const IMAGES_PER_PAGE = 30;

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

interface SEOData {
  meta_title: string;
  meta_description: string;
  content?: string;
}

const promoCardData: PromoCardProps[] = [
  { id: 1, title: "Start Your Dream Project", description: "Get a free, no-obligation estimate for your interior design project today.", link: "/estimate", linkLabel: "Get a Free Estimate", design: 'primary' },
  { id: 2, title: "See Our Process", description: "Learn how we turn your vision into a stunning reality, from concept to completion.", link: "/about-us", linkLabel: "Learn More", design: 'secondary' },
  { id: 3, title: "Have a Question?", description: "Our design experts are here to help. Contact us for a consultation.", link: "/contact-us", linkLabel: "Contact Us", design: 'tertiary' },
];

function isGalleryImage(item: GalleryImage | PromoCardProps): item is GalleryImage {
  return (item as GalleryImage).image_path !== undefined;
}

const ContactSection = ({ router }: { router: any }) => {
  return (
    <section className="py-16 bg-gradient-to-r from-rose-50 to-pink-50 relative">
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="contactPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="3" fill="none" stroke="#EC4899" strokeWidth="0.5" />
              <circle cx="10" cy="10" r="1" fill="#EC4899" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contactPattern)" />
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

export function GalleryClient({ images: initialImages, categories }: { images: GalleryImage[], categories: Category[] }) {
  const [allImages, setAllImages] = useState(initialImages);
  const [isLoading, setIsLoading] = useState(false);
  const [likedImageIds, setLikedImageIds] = useState(new Set<number>());
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [activeSmartFilter, setActiveSmartFilter] = useState<'latest' | 'most_liked'>('most_liked');
  const [visibleItems, setVisibleItems] = useState(IMAGES_PER_PAGE);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const slug = searchParams.get('image');
    if (slug) {
      const imageToOpen = initialImages.find(img => slugify(img.title) === slug);
      if (imageToOpen) setSelectedImage(imageToOpen);
    }
  }, [initialImages, searchParams]);

  const fetchImages = useCallback(async (filter: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gallery-images?filter=${filter}`);
      const data = await res.json();
      setAllImages(data);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoading(false);
      setVisibleItems(IMAGES_PER_PAGE);
    }
  }, []);

  useEffect(() => {
    fetchImages(activeSmartFilter);
  }, [activeSmartFilter, fetchImages]);

  const handleLike = (imageId: number) => {
    if (likedImageIds.has(imageId)) return;
    setLikedImageIds(prev => new Set(prev).add(imageId));
    setAllImages(prevImages =>
      prevImages.map(img => img.id === imageId ? { ...img, likes: img.likes + 1 } : img)
    );
    fetch('/api/gallery-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId }),
    }).catch(console.error);
  };

  const { featuredImages, regularImages } = useMemo(() => {
    const featured = allImages.filter(img => img.is_featured);
    const regular = allImages.filter(img => !img.is_featured);
    return { featuredImages: featured, regularImages: regular };
  }, [allImages]);

  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return allImages;
    return allImages.filter(img => img.category_id === activeCategory.id);
  }, [activeCategory, allImages]);

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
    const slug = slugify(image.title);
    const url = new URL(window.location.href);
    url.searchParams.set('image', slug);
    router.push(url.toString(), { scroll: false });
    fetch('/api/gallery/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: image.id }),
    }).catch(console.error);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('image');
    router.replace(url.toString(), { scroll: false });
  };

  const allImagesForLightbox = useMemo(() => {
    if (!selectedImage) return [];
    return allImages.filter(img => img.category_id === selectedImage.category_id);
  }, [selectedImage, allImages]);

  const itemsToShow = useMemo(() => {
    const images = filteredImages.slice(0, visibleItems);
    const result: (GalleryImage | PromoCardProps)[] = [];

    const totalItems = images.length;
    const numPromos = Math.min(promoCardData.length, 3);

    const promoPositions: number[] = [];
    if (numPromos >= 1) promoPositions.push(Math.floor(totalItems * 0.3));
    if (numPromos >= 2) promoPositions.push(Math.floor(totalItems * 0.6));
    if (numPromos >= 3) promoPositions.push(Math.floor(totalItems * 0.95));

    let promoIndex = 0;
    images.forEach((image, index) => {
      result.push(image);
      if (promoPositions.includes(index) && promoIndex < promoCardData.length) {
        result.push(promoCardData[promoIndex]);
        promoIndex++;
      }
    });

    return result;
  }, [filteredImages, visibleItems]);

  async function getGallerySEO(): Promise<string | null> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seo/gallery`, { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const seoData: SEOData = await res.json();
      console.log(seoData.content);
      return seoData.content || null;
    } catch {
      return null;
    }
  }
  const [seoContent, setSeoContent] = useState<string | null>(null);
  useEffect(() => {
    getGallerySEO().then(content => setSeoContent(content));
  }, []);


  return (
    <div className="bg-[#D2EBD0] min-h-screen py-12 px-4 md:px-8">

      <HeroWithCarousel
        seoContent={seoContent}
        featuredImages={featuredImages}
        onImageClick={handleImageClick}
        likedImageIds={likedImageIds}
        onLike={handleLike}
      />

      <div className="sticky top-0 z-30 bg-[#00423D]/90 rounded-full mt-10  backdrop-blur-sm py-4 mb-12 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-4 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 flex items-center cursor-pointer gap-2 rounded-full text-sm md:text-base bg-white/90 text-gray-700 hover:bg-white shadow-md transition">
                <span>Categories: <strong>{activeCategory === 'all' ? 'All' : activeCategory.name}</strong></span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white max-h-60 overflow-y-auto">
              <DropdownMenuItem onSelect={() => setActiveCategory('all')}>All</DropdownMenuItem>
              {categories.map(cat => (
                <DropdownMenuItem key={cat.id} onSelect={() => setActiveCategory(cat)}>{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 p-1  bg-white/90 rounded-full shadow-md">
            <button
              onClick={() => setActiveSmartFilter('latest')}
              className={`px-4 py-1 text-sm rounded-full font-semibold cursor-pointer transition ${activeSmartFilter === 'latest' ? 'bg-[#00423D] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setActiveSmartFilter('most_liked')}
              className={`px-4 py-1 text-sm rounded-full font-semibold cursor-pointer transition ${activeSmartFilter === 'most_liked' ? 'bg-[#00423D] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      <div
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 max-w-8xl mx-auto"
      >
        <AnimatePresence>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <GalleryCardSkeleton key={`skeleton-${i}`} />)
            : itemsToShow.map(item => {
              if (isGalleryImage(item)) {
                return (
                  <motion.div
                    key={`gallery-${item.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <GalleryCard
                      image={item}
                      onImageClick={handleImageClick}
                      isLiked={likedImageIds.has(item.id)}
                      onLike={handleLike}
                    />
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    key={`promo-${item.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <PromoCard {...item} />
                  </motion.div>
                );
              }
            })
          }
        </AnimatePresence>
      </div>

      {visibleItems < filteredImages.length && !isLoading && (
        <div className="text-center mt-14 mb-20">
          <button
            onClick={() => setVisibleItems(prev => prev + IMAGES_PER_PAGE)}
            className="bg-[#00423D] text-white font-semibold py-3 px-10 rounded-lg shadow-lg hover:bg-opacity-90 transition"
            aria-label="Load more designs"
          >
            Load More Designs
          </button>
        </div>
      )}

      <ContactSection router={router} />

      <AnimatePresence>
        {selectedImage && (
          <GalleryLightbox
            initialImage={selectedImage}
            images={allImagesForLightbox}
            onClose={closeLightbox}
            likedImageIds={likedImageIds}
            onLike={handleLike}
          />
        )}
      </AnimatePresence>
    </div>
  );

}
