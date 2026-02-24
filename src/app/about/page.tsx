"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Youtube, Linkedin, Award, Users, Clock, Star, CheckCircle, Heart, Shield, Zap, Target, ArrowRight, ChevronDown, ChevronUp, Plus, Minus, MapPin, Phone, Mail, Calendar, User, Briefcase, ExternalLink, XCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { FaArrowUp } from "react-icons/fa";



// Simple window width hook
function useWindowWidth() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
          observer.disconnect(); // Stop observing once animation starts
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the component is in view
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [end, duration]);

  return <span ref={ref}>{count}</span>;
};

// Infinite scrolling carousel - Adjusted for no visible gaps
const InfiniteCarousel = ({ items, direction = "left" }: { items: { name: string, logo: string }[], direction?: "left" | "right" }) => {
  return (
    <div className="overflow-hidden relative w-full">
      <motion.div
        className="flex min-w-max py-4" // Removed gap-8 here, children will handle spacing
        animate={{
          x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"]
        }}
        transition={{
          duration: 60, // Slower duration
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Duplicate items to create seamless loop */}
        {[...items, ...items].map((item, index) => (
          <div key={index} className="flex-shrink-0 w-40 h-20 bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center border border-gray-200 mx-4"> {/* Added horizontal margin */}
            <Image src={item.logo} alt={item.name} width={80} height={40} objectFit="contain" className="mb-1" onError={(e) => console.log(`Failed to load brand logo: ${item.logo} - ${e.type}`)} />
            <span className="text-xs font-semibold text-gray-700">{item.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// New DesignerCard component for internal carousel
const DesignerCard = ({ designer }: { designer: any }) => {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const projectImages = designer.projectImages || []; // Ensure projectImages is an array

  useEffect(() => {
    if (projectImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentProjectIndex((prev) => (prev + 1) % projectImages.length);
    }, 3000); // Change project image every 3 seconds
    return () => clearInterval(timer);
  }, [projectImages.length]);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-100">
      {/* Project Images Carousel */}
      <div className="w-full h-48 relative overflow-hidden rounded-t-xl">
        {projectImages.length > 0 ? (
          <AnimatePresence initial={false}>
            <motion.div
              key={currentProjectIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={projectImages[currentProjectIndex]}
                alt={`Project by ${designer.name}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-110"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">No Project Images</div>
        )}

        {/* Designer Avatar and Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white mr-3 flex-shrink-0">
            <Image src={designer.image} alt={designer.name} width={48} height={48} objectFit="cover" onError={(e) => console.log(`Failed to load designer image: ${designer.image} - ${e.type}`)} />
          </div>
          <h3 className="text-xl font-bold text-white leading-tight">{designer.name}</h3>
        </div>
      </div>

      {/* Designer Details */}
      <div className="p-6 bg-[#F8FDF8]">
        <p className="text-base text-[#00423D] mb-3 font-medium flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#00423D]" />
          {designer.specialization}
        </p>
        <div className="text-sm text-gray-600 space-y-2 mb-4">
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            {designer.experience} Experience
          </p>
          <p className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-500" />
            {designer.projects} Projects
          </p>
        </div>
        <Link href="/contact-us" passHref> {/* Link to a contact page or specific booking form */}
          <Button className="w-full bg-[#00423D] hover:bg-[#063F3C] text-white rounded-full transition transform hover:scale-105 active:scale-95">
            Book a Session
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Designers Carousel
const DesignersCarousel = ({ designers }: { designers: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const width = useWindowWidth();
  const itemsPerView = width && width < 768 ? 1 : width && width < 1024 ? 2 : 3;

  useEffect(() => {
    // Only auto-scroll if there are more items than can fit in view
    if (designers.length > itemsPerView) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % designers.length);
      }, 3000); // Auto-scroll every 3 seconds
      return () => clearInterval(timer);
    }
  }, [designers.length, itemsPerView]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          animate={{
            x: `-${currentIndex * (100 / itemsPerView)}%`
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {[...designers, ...(designers.length > itemsPerView ? designers.slice(0, itemsPerView) : [])].map((designer, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-4"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <DesignerCard designer={designer} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: designers.length }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${currentIndex === index
              ? "bg-[#00423D] w-6"
              : "bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>
    </div>
  );
};


// Testimonials Carousel - Adjusted for seamless loop
const TestimonialsCarousel = ({ testimonials }: { testimonials: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const width = useWindowWidth();
  const itemsPerView = width && width < 768 ? 1 : width && width < 1024 ? 2 : 3;

  useEffect(() => {
    // Only auto-scroll if there are more items than can fit in view
    if (testimonials.length > itemsPerView) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 4000); // Auto-scroll every 4 seconds
      return () => clearInterval(timer);
    }
  }, [testimonials.length, itemsPerView]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          animate={{
            x: `-${currentIndex * (100 / itemsPerView)}%`
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {[...testimonials, ...(testimonials.length > itemsPerView ? testimonials.slice(0, itemsPerView) : [])].map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-4"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-100">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                      {testimonial.image ? (
                        <Image src={testimonial.image} alt={testimonial.name} width={48} height={48} objectFit="cover" onError={(e) => console.log(`Failed to load testimonial image: ${testimonial.image} - ${e.type}`)} />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </div>

                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-700 leading-relaxed text-sm">{testimonial.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: testimonials.length }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${currentIndex === index
              ? "bg-[#00423D] w-6"
              : "bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>
    </div>
  );
};


export default function AboutUsPage() {
  const width = useWindowWidth();
  const isMobile = width !== null && width < 768;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showButton, setShowButton] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null); // Ref for Our Story section
  const [showStickyStats, setShowStickyStats] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      // Logic for scroll to top button
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setShowButton(window.scrollY > 300);
      } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setShowButton(window.scrollY > 100); // Show earlier on mobile
      }

      // Logic for sticky stats - Appears after hero, stays visible until the end of the page
      if (storyRef.current) {
        const storyTop = storyRef.current.getBoundingClientRect().top;
        const pageHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        const scrollBottom = window.scrollY + viewportHeight;

        // Show if scrolled past the 'Our Story' section's start
        // And hide if we're at the very bottom of the page (optional, based on "remain till the end")
        setShowStickyStats(storyTop <= viewportHeight); // Show when story section enters viewport
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const values = [
    { icon: Heart, title: "Customer-First", description: "Your vision and satisfaction drive everything we do" },
    { icon: Shield, title: "Transparency", description: "Clear pricing, honest communication, no hidden surprises" },
    { icon: Zap, title: "Innovation", description: "Cutting-edge design solutions that push creative boundaries" },
    { icon: Target, title: "Accountability", description: "We own our commitments and deliver on every promise" },
    { icon: CheckCircle, title: "Quality", description: "Uncompromising standards in every project we undertake" }
  ];

  const usps = [
    { icon: "🎨", title: "Fully Customized Solutions", description: "Every design is tailored to your unique style and needs" },
    { icon: "💰", title: "Transparent Cost Estimator", description: "Know exactly what you're paying for with our detailed breakdowns" },
    { icon: "⚡", title: "Fast-Track Delivery", description: "Efficient processes that don't compromise on quality" },
    { icon: "👥", title: "In-House Curated Designers", description: "Work with verified, skilled professionals" },
    { icon: "🚫", title: "No Hidden Charges", description: "What you see is what you pay - guaranteed" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      comment: "Kayapalat transformed our 2BHK into a dream home. The team's attention to detail and transparent pricing made the entire process stress-free.",
      image: "/client-1.jpg"
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi",
      rating: 5,
      comment: "From consultation to handover, everything was seamless. The turnkey service saved us so much time and effort. Highly recommended!",
      image: "/client-2.jpg"
    },
    {
      name: "Anita Patel",
      location: "Bangalore",
      rating: 5,
      comment: "The design-only service was perfect for our budget. We got stunning 3D designs and executed them ourselves. Great value for money!",
      image: "/client-3.jpg"
    },
    {
      name: "Vikram Singh",
      location: "Pune",
      rating: 5,
      comment: "Exceptional work on our office interiors. The team understood our brand perfectly and delivered beyond expectations.",
      image: "/client-4.jpg"
    },
    {
      name: "Kavita Reddy",
      location: "Hyderabad",
      rating: 5,
      comment: "Professional, punctual, and perfect! Our living room makeover exceeded all our expectations. Thank you Kayapalat!",
      image: "/client-5.jpg"
    },
    {
      name: "Amit Gupta",
      location: "Chennai",
      rating: 5,
      comment: "The 3D visualization helped us make informed decisions. The final result was exactly what we envisioned.",
      image: "/client-6.jpg"
    }
  ];

  const designers = [
    {
      name: "Sarah Johnson",
      specialization: "Modern Minimalist",
      experience: "8 years",
      projects: "150+",
      image: "/designer-1.jpg",
      projectImages: ["/project-1.jpg", "/project-2.jpg", "/project-3.jpg"] // Added project images
    },
    {
      name: "Ravi Patel",
      specialization: "Traditional & Contemporary",
      experience: "12 years",
      projects: "200+",
      image: "/designer-2.jpg",
      projectImages: ["/project-4.jpg", "/project-5.jpg", "/project-6.jpg"]
    },
    {
      name: "Meera Sharma",
      specialization: "Luxury Interiors",
      experience: "10 years",
      projects: "180+",
      image: "/designer-3.jpg",
      projectImages: ["/project-7.jpg", "/project-8.jpg", "/project-9.jpg"]
    },
    {
      name: "David Chen",
      specialization: "Sustainable Design",
      experience: "6 years",
      projects: "120+",
      image: "/designer-4.jpg",
      projectImages: ["/project-10.jpg", "/project-11.jpg", "/project-12.jpg"]
    },
    {
      name: "Priya Verma",
      specialization: "Small Space Expert",
      experience: "7 years",
      projects: "160+",
      image: "/designer-5.jpg",
      projectImages: ["/project-13.jpg", "/project-14.jpg", "/project-15.jpg"]
    },
    {
      name: "Arjun Malhotra",
      specialization: "Industrial Design",
      experience: "9 years",
      projects: "170+",
      image: "/designer-6.jpg",
      projectImages: ["/project-16.jpg", "/project-17.jpg", "/project-18.jpg"]
    }
  ];

  const faqs = [
    {
      question: "What is included in the Design-Only service?",
      answer: "Our Design-Only service includes detailed 3D designs, layout planning, material suggestions, and a comprehensive execution guide. You'll receive all the visual assets and specifications needed to execute the design yourself."
    },
    {
      question: "How long does a typical project take?",
      answer: "Project timelines vary based on scope: Design-Only services typically take 7-14 days, Design & Project Management takes 3-6 weeks, and Turnkey projects can take 6-12 weeks depending on complexity."
    },
    {
      question: "Do you provide material procurement services?",
      answer: "Yes, in our Design & Project Management and Turnkey services, we handle material procurement. We work with trusted suppliers and brands to ensure quality and competitive pricing."
    },
    {
      question: "What areas do you serve?",
      answer: "We currently serve major cities across India including Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, and many more. Contact us to check if we serve your area."
    },
    {
      question: "How do you ensure quality control?",
      answer: "We have dedicated project managers who conduct regular site visits, quality checks at every milestone, and maintain direct communication with clients throughout the process."
    },
    {
      question: "What if I'm not satisfied with the design?",
      answer: "We offer up to 2 rounds of revisions included in all our service packages. Our goal is to ensure you're completely satisfied with the final design."
    }
  ];

  const brandingPartners = {
    ply: [
      { name: "CenturyPly", logo: "/logos/centuryply.png" },
      { name: "GreenPly", logo: "/logos/greenply.png" },
      { name: "MasterGold", logo: "/logos/mastergold.png" },
      { name: "KitPly", logo: "/logos/kitply.png" }
    ],
    laminates: [
      { name: "Marino", logo: "/logos/marino.png" },
      { name: "GreenLamb", logo: "/logos/greenlamb.png" },
      { name: "Royal Touch", logo: "/logos/royaltouch.png" },
      { name: "Durian", logo: "/logos/durian.png" },
      { name: "Sunmica", logo: "/logos/sunmica.png" }
    ],
    tiles: [
      { name: "Kajaria", logo: "/logos/kajaria.png" },
      { name: "Somany", logo: "/logos/somany.png" },
      { name: "Johnson", logo: "/logos/johnson.png" },
      { name: "Simpolo", logo: "/logos/simpolo.png" },
      { name: "Nitco", logo: "/logos/nitco.png" }
    ],
    paints: [
      { name: "Asian Paints", logo: "/logos/asianpaints.png" },
      { name: "Dulux", logo: "/logos/dulux.png" },
      { name: "Nerolac", logo: "/logos/nerolac.png" }
    ],
    wires: [
      { name: "Havells", logo: "/logos/havells.png" },
      { name: "Finolex", logo: "/logos/finolex.png" },
      { name: "Anchor", logo: "/logos/anchor.png" },
      { name: "Polycab", logo: "/logos/polycab.png" }
    ],
    switches: [
      { name: "Havells", logo: "/logos/havells.png" },
      { name: "Legrand", logo: "/logos/legrand.png" },
      { name: "Crabtree", logo: "/logos/crabtree.png" },
      { name: "Philips", logo: "/logos/philips.png" }
    ],
    locks: [
      { name: "Godrej", logo: "/logos/godrej.png" },
      { name: "Link Locks", logo: "/logos/linklocks.png" },
      { name: "Dorset", logo: "/logos/dorset.png" }
    ],
    adhesive: [
      { name: "Fevicol", logo: "/logos/fevicol.png" },
      { name: "Dendrite", logo: "/logos/dendrite.png" }
    ],
    hinges: [
      { name: "Godrej", logo: "/logos/godrej.png" },
      { name: "Hettich", logo: "/logos/hettich.png" },
      { name: "Hafele", logo: "/logos/hafele.png" },
      { name: "Sleek", logo: "/logos/sleek.png" }
    ],
    lights: [
      { name: "Philips", logo: "/logos/philips.png" },
      { name: "Havells", logo: "/logos/havells.png" },
      { name: "Max LED", logo: "/logos/maxled.png" },
      { name: "Syska LED", logo: "/logos/syskaled.png" }
    ]
  };

  const allBrands = Object.values(brandingPartners).flat();

  // Reordered serviceModels to put Turnkey in the middle for desktop
  const serviceModels = [
    {
      title: "Design Only",
      description: "Get comprehensive 3D designs and execute yourself",
      features: ["3D Visualization", "Layout Planning", "Material List", "Execution Guide"],
      price: "Starting ₹ 15,000 only",
      popular: false
    },
    {
      title: "Turnkey Solution",
      description: "Complete end-to-end interior solution",
      features: ["Complete Design", "Material Procurement", "Execution", "Installation", "Final Handover"],
      price: "Starting ₹ 3,00,000 only",
      popular: true // Marked as most popular
    },
    {
      title: "Design & Project Management",
      description: "Full design service with project oversight",
      features: ["Everything in Design Only", "Project Management", "Vendor Coordination", "Quality Checks"],
      price: "Starting ₹ 50,000 only",
      popular: false
    }
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white text-gray-800 overflow-x-hidden"> {/* Changed overflow-y-scroll to overflow-x-hidden for wider content */}
      {/* Sticky Social Media Icons - Left Center */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 p-2 bg-white/70 backdrop-blur-sm rounded-r-lg shadow-lg">
        <Link href="https://facebook.com/" target="_blank" className="text-blue-600 hover:scale-110 transition-transform p-1 rounded-full">
          <Facebook className="w-5 h-5" />
        </Link>
        <Link href="https://instagram.com/" target="_blank" className="text-blue-600 hover:scale-110 transition-transform p-1 rounded-full">
          <Instagram className="w-5 h-5" />
        </Link>
        <Link href="https://www.youtube.com/@kayapalat1622" target="_blank" className="text-blue-600 hover:scale-110 transition-transform p-1 rounded-full">
          <Youtube className="w-5 h-5" />
        </Link>
        <Link href="https://linkedin.com/" target="_blank" className="text-blue-600 hover:scale-110 transition-transform p-1 rounded-full">
          <Linkedin className="w-5 h-5" />
        </Link>
      </div>

      {/* Hero Section with Patterns */}
      <section id="hero-section" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#00423D] via-[#006B5F] to-[#B8E4B3] text-white ">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="heroPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.5" />
                <rect x="5" y="5" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroPattern)" style={{ color: '#D2EBD0' }} />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-24 h-24 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-white rounded-full opacity-8 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 left-20 w-28 h-28 bg-white rounded-full opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 text-center px-4 md:px-6 max-w-6xl mx-auto">
          <motion.h1
            className="text-4xl md:text-8xl mb-6 font-bold text-white"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            About Kayapalat
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl text-gray-100 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transforming houses into personalized dream homes.
          </motion.p>
          <motion.div
            className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            We simplify interior design with customized, affordable, and transparent solutions that reflect your unique style.
          </motion.div>

          {/* Hero CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/estimate">
              <Button className="px-8 py-4 rounded-full bg-[#D2EBD0] text-[#00423D] font-bold hover:bg-white transition shadow-lg transform hover:scale-105 active:scale-95">
                Get Your Estimate
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="outline" className="px-8 py-4 rounded-full border-white text-white hover:bg-white hover:text-[#00423D] transition transform hover:scale-105 active:scale-95">
                Contact Us
              </Button>
            </Link>
          </motion.div>

          {/* Stats Section in Hero - Will be conditionally rendered/hidden */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl mx-4 md:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { icon: Award, value: 10, label: "Awards", suffix: "+" },
              { icon: Users, value: 350, label: "Happy Clients", suffix: "+" },
              { icon: Clock, value: 10, label: "Years Experience", suffix: "+" },
              { icon: Star, value: 4.5, label: "Rating", suffix: "" }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-[#D2EBD0] mr-1 md:mr-2" />
                  <span className="text-xl md:text-3xl font-bold">
                    <AnimatedCounter end={stat.value} />
                    {stat.suffix}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-200">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mouse Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, 0, 20] }} // Subtle bounce
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          {/* You'll need to add /public/mouse-scroll-icon.png */}
          {/* <Image src="/mouse-scroll-icon.png" alt="Scroll Down" width={24} height={24} className="mb-2 invert" /> */}
          <span className="text-sm text-white font-medium">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-white animate-bounce" />
        </motion.div>
      </section>

      {/* Sticky Stats Section - Appears after Our Story, remains till end */}
      <AnimatePresence>
        {showStickyStats && (
          <motion.div
            className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 p-3 bg-white/80 backdrop-blur-sm rounded-l-lg shadow-lg"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { icon: Award, value: 10, label: "Awards", suffix: "+" },
              { icon: Users, value: 350, label: "Happy Clients", suffix: "+" },
              { icon: Clock, value: 10, label: "Years Experience", suffix: "+" },
              { icon: Star, value: 4.9, label: "Rating", suffix: "" }
            ].map((stat, index) => (
              <div key={index} className="text-center text-gray-800">
                <div className="flex items-center justify-center mb-1">
                  <stat.icon className="w-4 h-4 text-[#00423D] mr-1" />
                  <span className="text-lg font-bold">
                    <AnimatedCounter end={stat.value} />
                    {stat.suffix}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Our Story */}
      <section id="our-story-section" ref={storyRef} className="max-w-7xl mx-auto px-4 md:px-6 py-16 relative ">
        {/* Dot Pattern Background */}
        {/* <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="storyPattern" width="15" height="15" patternUnits="userSpaceOnUse">
                <circle cx="7.5" cy="7.5" r="1" fill="#00423D"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#storyPattern)"/>
          </svg>
        </div> */}

        <div className={`grid md:grid-cols-2 gap-12 items-center relative z-10 ${isMobile ? 'flex flex-col' : 'grid'}`}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className={isMobile ? 'order-1' : 'order-2 md:order-1'}
          >
            <h2 className="text-3xl md:text-5xl mb-6 text-[#00423D] font-bold"
              style={{ fontFamily: "'Abril Fatface', cursive" }}>
              Our Story
            </h2>
            <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
              Kayapalat was born out of a simple yet powerful observation: homeowners struggled to find reliable, transparent, and affordable interior design services. We noticed the gap between beautiful design aspirations and practical execution.
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700">
              Founded with the mission to democratize interior design, we connect verified freelance designers with clients seeking personalized, hassle-free services. From cozy bedrooms to sprawling offices, every project is handled with care and tailored precision.
            </p>
            <blockquote className="text-lg md:text-xl font-semibold text-[#00423D] border-l-4 border-[#00423D] pl-4 mb-6">
              "We believe that great design has the power to enhance your life, and everyone deserves to live in a space they love."
            </blockquote>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className={isMobile ? 'order-2' : 'order-1 md:order-2'}
          >
            <div>
              <div className="relative z-10 text-center ">
            <Image src="/founder.jpg" alt="JohnBor ( Founder & CEO )" width={350} height={350} className=" rounded-full max-h-[350px] max-w-[350px] mx-auto mb-4 object-cover  shadow-lg border-4 border-white" onError={(e) => console.log(`Failed to load founder image: /founder.jpg - ${e.type}`)} />
                <h3 className="text-lg md:text-xl font-bold text-gray-900">John Bor</h3>
                <p className="text-gray-600" style={{ fontFamily: "'Abril Fatface', cursive" }}>Founder & CEO</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gradient-to-r from-[#D2EBD0] to-white relative">
        {/* Hexagon Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="valuesPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <polygon points="5,1 8,3 8,7 5,9 2,7 2,3" fill="none" stroke="#00423D" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#valuesPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl mb-6 text-[#00423D] font-bold" style={{ fontFamily: "'Abril Fatface', cursive" }}>
              Our Mission & Values
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              Simplifying home interiors with customized, affordable, and transparent solutions that transform spaces into personal sanctuaries.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="text-center p-4 md:p-6 rounded-xl bg-[#F8FDF8] hover:bg-white transition-all duration-300 hover:scale-105 shadow-lg border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <value.icon className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-[#00423D]" />
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Designers Carousel */}
      <section className="py-16 bg-white relative">
        {/* Wave Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="designersPattern" width="20" height="10" patternUnits="userSpaceOnUse">
                <path d="M0,5 Q5,0 10,5 T20,5" fill="none" stroke="#00423D" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#designersPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl mb-12 text-center text-[#00423D] font-bold"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Meet Our Designers
          </motion.h2>

          <DesignersCarousel designers={designers} />
        </div>
      </section>

      {/* Service Models */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50 relative">
        {/* Star Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="servicePattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <polygon points="6,1 7,4 10,4 8,6 9,9 6,7 3,9 4,6 2,4 5,4" fill="#EC4899" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#servicePattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl mb-12 text-center text-gray-900 font-bold"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Our Service Models
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 ">
            {serviceModels.map((service, index) => (
              <motion.div
                key={index}
                className={`bg-[#F8FDF8] rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative border-2 border-[#00423D]${service.popular ? 'md:scale-110 md:z-10 ' : '' // Added scale-110 for popular card
                  }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#00423D] text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-2xl font-bold text-[#00423D] mb-4">{service.price}</div>

                <Link href="/contact-us">
                  <Button
                    className="w-full bg-[#00423D] hover:bg-[#063F3C] text-white rounded-full transition transform hover:scale-105 active:scale-95"
                  >
                    Choose This Plan
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Kayapalat */}
      <section className="py-16 bg-gradient-to-r from-[#D2EBD0] to-white relative">
        {/* Triangle Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="uspPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <polygon points="6,2 10,8 2,8" fill="#00423D" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#uspPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl mb-12 text-center text-[#00423D] font-bold"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Why Choose Kayapalat?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            {usps.map((usp, index) => (
              <motion.div
                key={index}
                className="bg-[#F8FDF8] rounded-xl shadow-lg p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl mb-4 text-[#00423D]">{usp.icon}</div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{usp.title}</h3>
                <p className="text-sm text-gray-600">{usp.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center bg-white"> {/* Changed background to white */}
        <motion.h2
          className="text-4xl md:text-5xl mb-10 text-[#00423D] font-bold"
          style={{ fontFamily: "'Abril Fatface', cursive" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          How It Works
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
            <Image
              src={isMobile ? "/how-we-work-mobile.png" : "/how-we-work.png"}
              alt="How It Works"
              width={1200}
              height={800}
              className="rounded-2xl mx-auto"
              onError={(e) => console.log(`Failed to load how-we-work image: ${isMobile ? "/how-we-work-mobile.png" : "/how-we-work.png"} - ${e.type}`)}
            />
        </motion.div>
      </section>

      {/* Client Testimonials */}
      <section className="py-16 bg-gradient-to-r from-[#D2EBD0] to-white relative">
        {/* Circular Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="testimonialPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="8" cy="8" r="3" fill="none" stroke="#00423D" strokeWidth="0.5" />
                <circle cx="8" cy="8" r="1" fill="#00423D" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#testimonialPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl mb-12 text-center text-[#00423D] font-bold"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            What Our Clients Say
          </motion.h2>

          <TestimonialsCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* Branding Partners */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-slate-50 relative">
        {/* Diamond Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="brandingPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <polygon points="6,2 10,6 6,10 2,6" fill="#00423D" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#brandingPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl mb-6 text-[#00423D] font-bold" style={{ fontFamily: "'Abril Fatface', cursive" }}>
              Trusted Brand Partners
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              We collaborate with India's most trusted brands to deliver quality materials and finishes
            </p>
          </motion.div>

          <div className="space-y-8">
            <InfiniteCarousel items={allBrands} direction="left" />
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link href="/branding-partners">
              <Button className="px-8 py-4 rounded-full bg-[#00423D] text-white font-bold hover:bg-[#063F3C] transition transform hover:scale-105 active:scale-95 shadow-lg">
                View All Partners
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-r from-[#D2EBD0] to-white relative">
        {/* Zigzag Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="faqPattern" width="20" height="10" patternUnits="userSpaceOnUse">
                <path d="M0,5 L5,0 L10,5 L15,0 L20,5 L15,10 L10,5 L5,10 Z" fill="none" stroke="#00423D" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#faqPattern)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl mb-12 text-center text-[#00423D] font-bold"
            style={{ fontFamily: "'Abril Fatface', cursive" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-[#F8FDF8] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white rounded-xl transition-colors active:scale-[0.98]"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#00423D] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#00423D] flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6"
                    >
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Ask a Question Section */}
          <motion.div
            className="text-center mt-12 bg-[#F8FDF8] rounded-xl p-8 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: (faqs.length + 1) * 0.1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Abril Fatface', cursive" }}>
              Still have questions?
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              Our team is here to help! Feel free to reach out to us directly.
            </p>
            <Link href="/contact-us">
              <Button className="px-8 py-4 rounded-full bg-[#00423D] text-white font-bold hover:bg-[#063F3C] transition transform hover:scale-105 active:scale-95 shadow-lg">
                Ask Your Question
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Careers Section */}
      <section className="py-16 bg-gradient-to-r from-[#D2EBD0] to-white relative">
        {/* Leaf Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="careersPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M8,2 Q12,6 8,10 Q4,6 8,2" fill="#00423D" opacity="0.3" />
                <path d="M8,2 L8,10" stroke="#00423D" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#careersPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl mb-6 text-[#00423D] font-bold" style={{ fontFamily: "'Abril Fatface', cursive" }}>
              Join Our Growing Team
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Are you passionate about interior design? We're always looking for talented designers, project managers, and creative professionals to join our mission.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
              {[
                { icon: Briefcase, title: "Remote Work", description: "Work from anywhere with flexible schedules" },
                { icon: Users, title: "Growth Opportunities", description: "Learn from industry experts and grow your career" },
                { icon: Award, title: "Recognition", description: "Get credited for your amazing work and creativity" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="bg-[#F8FDF8] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <benefit.icon className="w-12 h-12 text-[#00423D] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            <Link href="/careers">
              <Button className="px-8 py-4 rounded-full bg-[#00423D] text-white font-bold hover:bg-[#063F3C] transition transform hover:scale-105 active:scale-95 shadow-lg">
                Explore Careers
                <ExternalLink className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gradient-to-r from-rose-50 to-pink-50 relative">
        {/* Flower Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="contactPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="3" fill="none" stroke="#EC4899" strokeWidth="0.5" />
                <circle cx="10" cy="10" r="1" fill="#EC4899" opacity="0.3" />
                <circle cx="10" cy="7" r="1" fill="#EC4899" opacity="0.2" />
                <circle cx="10" cy="13" r="1" fill="#EC4899" opacity="0.2" />
                <circle cx="7" cy="10" r="1" fill="#EC4899" opacity="0.2" />
                <circle cx="13" cy="10" r="1" fill="#EC4899" opacity="0.2" />
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

          {/* Adjusted grid for 3 items on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8">
            {[
              {
                icon: MapPin,
                title: "Visit Us",
                info: "179-A, Survey Park Rd, Purba Diganta, Santoshpur, Kolkata - 700075, WB, India",
                link: "https://www.google.com/maps/search/?api=1&query=179-A,+Survey+Park+Rd,+Purba+Diganta,+Santoshpur,+Kolkata+-+700075,+WB,+India"
              },
              {
                icon: Phone,
                title: "Call Us",
                info: "602-602-602-6",
                link: "tel:+916026026026"
              },
              {
                icon: Mail,
                title: "Email Us",
                info: "info@kayapalat.co",
                link: "mailto:info@kayapalat.co"
              }
            ].map((contact, index) => (
              <motion.div
                key={index}
                className="bg-[#F8FDF8] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Link href={contact.link} target="_blank" rel="noopener noreferrer" className=" h-full flex flex-col justify-between">
                  <contact.icon className="w-12 h-12 text-[#00423D] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{contact.title}</h3>
                  <p className="text-gray-700 font-medium mb-1 hover:underline flex-grow flex items-center justify-center">{contact.info}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Operating Hours */}
          <motion.div
            className="text-center mt-8 bg-[#F8FDF8] rounded-xl p-6 shadow-lg border border-gray-100 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Clock className="w-12 h-12 text-[#00423D] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2" >Operating Hours:</h3>
            <p className="flex items-center justify-center text-lg text-gray-700 mb-2">

              Monday - Saturday: 10:00 AM to 6:00 PM
            </p>
            <p className="flex items-center justify-center text-lg text-red-500">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              Sunday: Closed
            </p>
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact-us">
                <Button className="px-8 py-4 rounded-full bg-[#00423D] text-white font-bold hover:bg-[#063F3C] transition transform hover:scale-105 active:scale-95 shadow-lg">
                  Contact Us Today
                </Button>
              </Link>
              <Link href="/estimate">
                <Button variant="outline" className="px-8 py-4 rounded-full border-[#00423D] text-[#00423D] hover:bg-[#00423D] hover:text-white transition transform hover:scale-105 active:scale-95">
                  Get Free Estimate
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <div className="fixed bottom-10 z-10 right-5 flex group">
        <button
          onClick={scrollToTop}
          className={`cursor-pointer p-4.5 rounded-full bg-[#00423D] text-white shadow-lg transition-opacity
          ${showButton ? "opacity-100" : "hidden pointer-events-none"} hover:bg-[#063F3C] relative`}
          aria-label="Scroll to top"
        >
          <FaArrowUp size={20} />
        </button>
        {/* Tooltip */}
        <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-gray-600 bg-[#ffffff7a] rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap border-2 ${showButton ? "" : "hidden pointer-events-none"}`}>
          Scroll To Top
        </span>
      </div>
    </div>
  );
}