'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Expand,
  Shrink,
  MessageSquare,
  Facebook,
  Twitter,
  Link as LinkIcon,
  CircleUserRound,
} from 'lucide-react';
import { MessageCircle as WhatsappIcon } from 'lucide-react';
import type { GalleryImage } from '@/app/gallery/page';
import { Popover, Transition } from '@headlessui/react';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AvatarFallback from '../AvatarFallback';

const slugify = (text: string) =>
  text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');

interface GalleryLightboxProps {
  initialImage: GalleryImage;
  images: GalleryImage[];
  onClose: () => void;
  likedImageIds: Set<number>;
  onLike: (imageId: number) => void;
}

function formatLikes(num: number) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function GalleryLightbox({ initialImage, images, onClose, likedImageIds, onLike }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(() => images.findIndex(img => img.id === initialImage.id));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const currentImage = images[currentIndex];

  // Update URL query param for image slug instead of hash
  useEffect(() => {
    if (currentImage) {
      const slug = slugify(currentImage.title);
      // Update URL query param `image`
      const url = new URL(window.location.href);
      url.searchParams.set('image', slug);
      router.replace(url.toString(), { scroll: false });
    }
  }, [currentImage, router]);

  const goToPrevious = useCallback(() => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)), [images.length]);
  const goToNext = useCallback(() => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)), [images.length]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) goToPrevious();
    else if (info.offset.x < -50) goToNext();
  };

  const shareUrl = `${window.location.origin}/gallery?image=${slugify(currentImage.title)}`;

  const handleCopyLink = () => {
    // Check if Clipboard API is available
    if (typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(shareUrl)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => fallbackCopyTextToClipboard(shareUrl));
    } else {
      fallbackCopyTextToClipboard(shareUrl);
    }
  };

  // Fallback for older/mobile/in-app browsers
  function fallbackCopyTextToClipboard(text: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';  // Prevent scrolling up
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success('Link copied to clipboard!');
      } else {
        toast.error('Could not copy link. Please copy manually.');
      }
    } catch (err) {
      toast.error('Could not copy link. Please copy manually.');
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowLeft') goToPrevious();
    else if (event.key === 'ArrowRight') goToNext();
  };

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (likedImageIds.has(currentImage.id)) return;
    onLike(currentImage.id);

    const rect = e.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: {
        x: (rect.left + rect.right) / 2 / window.innerWidth,
        y: (rect.top + rect.bottom) / 2 / window.innerHeight,
      },
      colors: ['#ef4444', '#f87171', '#fca5a5'],
      scalar: 1.2,
      zIndex: 9999,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onClose]);

  if (!currentImage) return null;
  const isLiked = likedImageIds.has(currentImage.id);

  return (
    <motion.div
      ref={lightboxRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-9999 flex flex-col md:flex-row items-center justify-center p-0 md:p-4 gap-4 font-sans"
    >
      {/* Main Image Viewer */}
      <div className="w-full h-full md:w-[calc(100%-24rem)] grow flex flex-col gap-2 md:gap-4 relative">
        <motion.div
          className="grow relative overflow-hidden md:rounded-lg"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <Image
                src={currentImage.image_path}
                alt={currentImage.title}
                fill
                style={{ objectFit: 'contain' }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Mobile Details Overlay */}
        <div className="md:hidden z-50 absolute bottom-20 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
          <h2 className="text-2xl font-bold text-white drop-shadow-md">{currentImage.title}</h2>
          <div className="flex items-center gap-3 pointer-events-auto mt-2">
            {/* {currentImage.designer_dp_path ? (
              <Image src={currentImage.designer_dp_path} alt={currentImage.designer_name || ''} width={32} height={32} className="rounded-full object-cover border-2 border-white/50" />
            ) : (
              <AvatarFallback className="w-12 h-12 text-transparent bg-clip-text bg-linear-to-r from-green-800 to-emerald-800" />
            )} */}
              <AvatarFallback className="w-8 h-8" />

            <div>
              <p className="font-semibold text-white/80 text-sm drop-shadow-md">{currentImage.designer_name || 'Team KayaPalat'}</p>
              <p className="text-xs text-white/80 drop-shadow-md">{currentImage.designer_designation || 'Designer'}</p>
            </div>
            <button onClick={handleLikeClick} aria-label="Like this design" className="ml-auto shrink-0 pointer-events-auto">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-red-500/80' : 'bg-white/20 hover:bg-white/30'}`}>
                <Heart className={`w-3 h-3 transition-transform ${isLiked ? 'text-white fill-white scale-110' : 'text-white'}`} />
              </div>
              <p className="text-center text-white/80 font-bold mt-1 text-sm">{formatLikes(currentImage.likes)}</p>
            </button>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="shrink-0 h-20 w-full max-w-[80%] mx-auto overflow-hidden">
          <div className="h-full overflow-x-auto">
            <div className="flex items-center gap-2 h-full px-2 md:px-4">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative h-16 w-16 shrink-0 aspect-square rounded-md overflow-hidden cursor-pointer transition-all ${index === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                    }`}
                >
                  <Image src={img.image_path} alt={img.title} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <button onClick={goToPrevious} aria-label="Previous image" className="absolute left-2 md:left-4 top-[50%] -translate-y-1/2 bg-black/30 text-white p-2 rounded-full z-10">
          <ChevronLeft />
        </button>
        <button onClick={goToNext} aria-label="Next image" className="absolute right-2 md:right-4 top-[50%] -translate-y-1/2 bg-black/30 text-white p-2 rounded-full z-10">
          <ChevronRight />
        </button>

        {/* Buttons: Share dropdown, fullscreen, close */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 z-10">
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  aria-label="Share design"
                  className="bg-black/30 text-white p-2 rounded-full flex items-center justify-center"
                >
                  <Share2 size={20} />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-9999">
                    <div className="py-1">
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                      >
                        <Facebook size={18} /> Share to Facebook
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                      >
                        <Twitter size={18} /> Share to Twitter
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                      >
                        <WhatsappIcon size={18} /> Share to WhatsApp
                      </a>
                      <button
                        onClick={handleCopyLink}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100"
                        type="button"
                      >
                        <LinkIcon size={18} /> Copy link
                      </button>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="bg-black/30 text-white p-2 rounded-full flex items-center justify-center"
          >
            {isFullscreen ? <Shrink size={20} /> : <Expand size={20} />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close lightbox"
            className="bg-black/30 text-white p-2 rounded-full flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* Desktop Details Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ ease: 'easeInOut', duration: 0.4 }}
        className="hidden md:flex flex-col w-full max-w-sm h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden text-white"
      >
        <div className="p-6 grow flex flex-col">
          <div className="space-y-6">
            <h3 className="font-bold text-2xl text-white">{currentImage.title}</h3>
            <div className="flex items-center gap-4">
              {/* {currentImage.designer_dp_path ? (
                <Image src={currentImage.designer_dp_path} alt={currentImage.designer_name || ''} width={48} height={48} className="rounded-full object-cover" />
              ) : (
                <AvatarFallback className="w-12 h-12" />
              )} */}
              <AvatarFallback className="w-12 h-12" />
              <div>
                <p className="font-semibold text-white">{currentImage.designer_name || "Team KayaPalat"}</p>
                <p className="text-sm text-neutral-300">{currentImage.designer_designation || "Designer | Architect"}</p>
              </div>
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed">{currentImage.designer_comment || "No comment."}</p>
          </div>
          <div className="grow" />
          <div className="space-y-4 mt-6">
            <motion.button
              onClick={handleLikeClick}
              aria-label="Like this design"
              className="w-full flex items-center justify-around gap-2 border-2 border-white/20 py-3 rounded-full font-semibold hover:border-red-500/50 hover:text-red-300 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-md flex items-center gap-2">
                <Heart className={`w-5 h-5 ${isLiked ? 'text-red-400 fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </div>
              {formatLikes(currentImage.likes)}
            </motion.button>
            <Link href="/estimate">
              <motion.button
                className="w-full bg-[#E63946] text-white font-bold py-3 rounded-full hover:bg-[#D62828] transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare size={18} />
                Get a Free Quote
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
