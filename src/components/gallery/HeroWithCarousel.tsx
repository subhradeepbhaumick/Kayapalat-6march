// File: src/components/gallery/HeroWithCarousel.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  Transition,
  PanInfo,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, ChevronDown } from "lucide-react";
import type { GalleryImage } from "@/app/gallery/page";
import { getCategoryColor } from "@/lib/colours";
import confetti from "canvas-confetti";
import AvatarFallback from "../AvatarFallback";

interface HeroWithCarouselProps {
  seoContent: string | null;
  featuredImages: GalleryImage[];
  onImageClick: (image: GalleryImage) => void;
  likedImageIds: Set<number>;
  onLike: (imageId: number) => void;
}

function formatLikes(num: number) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

function SeoContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-300 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        <div className="h-4 w-full bg-gray-300 rounded"></div>
      </div>
      <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
    </div>
  );
}

export default function HeroWithCarousel({
  seoContent,
  featuredImages,
  onImageClick,
  likedImageIds,
  onLike,
}: HeroWithCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: carouselRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const transition: Transition = { duration: 0.5, ease: "easeInOut" };

  const slideVariants = {
    hidden: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.8 }),
    visible: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%", opacity: 0.8 }),
  };

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) =>
      prev === featuredImages.length - 1 ? 0 : prev + 1
    );
  }, [featuredImages.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? featuredImages.length - 1 : prev - 1
    );
  }, [featuredImages.length]);

  // --- Scroll Indicator Logic ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.querySelector(".hero-carousel:hover") === null) {
        nextSlide();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  if (!featuredImages || featuredImages.length === 0) {
    return (
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl font-bold">Our Designs</h1>
        <p className="mt-4 text-lg">
          Explore our gallery of beautiful interior designs.
        </p>
      </section>
    );
  }

  const currentImage = featuredImages[currentIndex];
  const isLiked = likedImageIds.has(currentImage.id);
  const categoryColor = getCategoryColor(currentImage.category_name);

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isLiked) return;
    onLike(currentImage.id);
    const rect = e.currentTarget.getBoundingClientRect();
    // --- FIX: Confetti origin calculated relative to viewport ---
    confetti({
      particleCount: 50,
      spread: 60,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ["#ef4444", "#f87171", "#fca5a5"],
      scalar: 1.2,
    });
  };

  return (
    <section className="w-full bg-linear-to-tr from-[#e7f5a0] via-[#dbead6] to-[#c9e7e0] py-8 md:pb-20 relative">
      <div className="container mx-auto px-4">
        {/* --- Centered Title Section --- */}
        <div className="text-center mb-6">
          <h1
            className="font-saira-stencil-one text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-widest drop-shadow-xl text-[#00423D]"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
          >
            Designs That Inspire
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[#236061] font-inter font-medium drop-shadow">
            From concept to reality, explore spaces crafted with passion.
          </p>
        </div>

        {/* --- Main Content Grid (Side-by-Side on Desktop) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: SEO Content */}
          <div className="hidden lg:flex text-left text-gray-700 prose prose-sm max-w-none order-2 lg:order-1">
            {seoContent ? (
              <div dangerouslySetInnerHTML={{ __html: seoContent }} />
            ) : (
              <SeoContentSkeleton />
            )}
          </div>

          {/* Right: Carousel */}
          <div
            ref={carouselRef}
            className="hero-carousel w-full h-[60vh] md:h-[70vh] relative group order-1 lg:order-2"
            style={{ position: "relative" }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-2xl">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={transition}
                  className="absolute inset-0 w-full h-full"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 50) prevSlide();
                    else if (info.offset.x < -50) nextSlide();
                  }}
                >
                  <motion.div
                    style={{ y }}
                    className="relative w-full h-full cursor-pointer"
                    onTap={() => onImageClick(currentImage)}
                  >
                    <Image
                      src={currentImage.image_path}
                      alt={currentImage.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous slide"
                className="absolute z-10 left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next slide"
                className="absolute z-10 right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={28} />
              </button>
              <div className="absolute top-4 right-4 z-10">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-md ${categoryColor.bg} ${categoryColor.text}`}
                >
                  {currentImage.category_name}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                <div className="flex justify-between items-end">
                  <div className="max-w-xl">
                    <h2 className="text-xl md:text-2xl font-bold drop-shadow-lg">
                      {currentImage.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <AvatarFallback className="w-10 h-10" />

                      <div>
                        <p className="font-semibold text-sm drop-shadow-md">
                          {currentImage.designer_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLikeClick}
                    aria-label="Like this design"
                    className="shrink-0"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isLiked
                          ? "bg-red-500/80"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 transition-transform ${
                          isLiked
                            ? "text-white fill-white scale-110"
                            : "text-white"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-center ${
                        isLiked ? "text-red-500" : "text-white/80"
                      } font-bold mt-1 text-xs`}
                    >
                      {formatLikes(currentImage.likes)}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Scroll Down Indicator --- */}
      <AnimatePresence>
        <motion.div
          className="hidden absolute bottom-8  left-1/2 -translate-x-1/2 md:flex flex-col items-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, 0, 20] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <span className="text-sm text-[#00423D] font-medium">
            Scroll Down
          </span>
          <ChevronDown className="w-4 h-4 text-[#00423D] animate-bounce" />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
