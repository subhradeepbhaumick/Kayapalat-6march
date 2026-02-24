"use client"

import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils" // Assuming you have a utility for classnames

// --- Helper Components ---

// 1. Typewriter Effect Component
const Typewriter = ({ texts, duration = 3000 }: { texts: string[]; duration?: number }) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length)
    }, duration)
    return () => clearInterval(interval)
  }, [texts, duration])

  return (
    <div className="relative h-8 w-full"> {/* <-- FIX IS HERE */}
      <AnimatePresence>
        <motion.p
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className="absolute w-full text-lg md:text-2xl text-center text-[#00423D] mb-2 font-semibold px-2"
        >
          {texts[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// 2. Confetti/Floating Shapes Component
const FloatingShapes = () => {
  const shapes = Array.from({ length: 15 })
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-[-1]">
      {shapes.map((_, i) => {
        const size = Math.random() * 20 + 5
        const duration = Math.random() * 10 + 10
        const delay = Math.random() * 5
        const startX = Math.random() * 100
        const startY = Math.random() * 20 + 100
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#00423D]/20"
            style={{
              width: size,
              height: size,
              left: `${startX}%`,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: `-${startY}vh`, opacity: [0, 1, 0] }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )
      })}
    </div>
  )
}

// 3. Combined Attract & Particle Button Component
const InteractiveButton = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
  const [isAttracting, setIsAttracting] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const particlesControl = useAnimation();
  const buttonRef = useRef(null);
  const particleCount = 15;

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
    }));
    setParticles(newParticles);
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsAttracting(true);
    particlesControl.start({
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 12 },
    });
  }, [particlesControl]);

  const handleInteractionEnd = useCallback(() => {
    setIsAttracting(false);
    particlesControl.start((i) => ({
      x: particles[i]?.x,
      y: particles[i]?.y,
      transition: { type: "spring", stiffness: 80, damping: 12 },
    }));
  }, [particlesControl, particles]);

  // FIX: The component's own click handler now also calls the onClick prop from the parent.
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 800);
    if (onClick) {
      onClick(e);
    }
  };

  const ClickParticles = () => {
    if (!buttonRef.current) return null;
    return (
      <AnimatePresence>
        {showParticles &&
          [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="fixed w-1.5 h-1.5 rounded-full"
              style={{
                background: '#FFFFFF',
                left: "50%",
                top: "50%",
                position: "absolute",
              }}
              initial={{ scale: 0, x: "-50%", y: "-50%" }}
              animate={{
                scale: [0, 1.2, 0],
                x: ["-50%", `calc(-50% + ${(Math.random() - 0.5) * 150}px)`],
                y: ["-50%", `calc(-50% + ${(Math.random() - 0.5) * 150}px)`],
              }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
            />
          ))}
      </AnimatePresence>
    );
  };

  return (
    <button
      ref={buttonRef}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onClick={handleClick}
      className={cn(
        "relative w-full rounded py-2 font-semibold transition-all duration-300 overflow-hidden",
        "bg-[#00423D] text-white hover:bg-[#002b28]",
        className
      )}
    >
      {particles.map((p, i) => (
        <motion.div
          key={p.id}
          custom={i}
          initial={{ x: p.x, y: p.y, opacity: 0 }}
          animate={particlesControl}
          className={cn(
            "absolute w-1 h-1 rounded-full bg-white/50",
            "transition-opacity duration-300",
            isAttracting ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      <ClickParticles />
      <span className="relative z-10">{children}</span>
    </button>
  );
};


// --- Main Pricing Component ---

export default function PricingCreative() {
  const creativeSubheadings = [
    "Empower Your Vision",
    "Flexible Solutions",
    "Unmatched Experience",
    "Tailored to You",
    "Innovative Approaches",
    "Transformative Experiences",
    "Your Success, Our Commitment"
  ]

  return (
    <section className="relative flex flex-col items-center py-20 bg-transparent overflow-hidden">
      <FloatingShapes />
      {/* Heading */}
      <h2
        className="text-5xl md:text-6xl text-center mb-3 font-['Abril_Fatface',cursive] text-[#0b2739] tracking-tight"
        style={{ WebkitTextStroke: "1px #00423D" }}
      >
        Choose Your Fit
      </h2>

      {/* Creative Subheading with Typewriter Effect */}
      <Typewriter texts={creativeSubheadings} />

      {/* Informative Subheading Spacer */}
      <p className="text-base text-center text-transparent mb-10 px-2 pointer-events-none">
        .
      </p>

      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-8 w-full max-w-6xl px-4">

        {/* Design Only Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [-4, 4, -4] }}
          transition={{
            type: "spring",
            duration: 0.6,
            y: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
          whileHover={{ scale: 1.03, y: -10 }}
          className="bg-white/80 backdrop-blur-sm border-[#00423D] flex flex-col items-start rounded-2xl border-2 px-8 py-8 shadow-2xl w-full md:w-96"
        >
          <div className="mb-2 text-2xl font-bold text-[#153a2b]">
            Design Only
          </div>
          <p className="mb-10 text-gray-700 min-h-[40px]">
            We create detailed layouts and stunning 3D designs while you handle execution
          </p>
          <ul className="mb-6 space-y-2 text-base text-gray-800">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />3D Visualization</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Layout Planning</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Material List</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Execution Guide</li>
          </ul>
          <div className="mt-auto w-full">
            <div className="mb-6 text-xl font-extrabold text-[#00423D]">
              Starting ₹ 15,000 only
            </div>
            <Link href="/contact-us" className="w-full">
              <InteractiveButton>
                Choose This Plan
              </InteractiveButton>
            </Link>

          </div>
        </motion.div>

        {/* Turnkey Solution Card (Most Popular) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{
            type: "spring",
            duration: 0.7,
            y: {
              duration: 2.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
          whileHover={{ scale: 1.03, y: -15 }}
          className="bg-white/90 backdrop-blur-sm border-[#00423D] flex flex-col items-start rounded-2xl border-2 px-8 py-10 shadow-2xl w-full md:w-96 relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-[#00423D] text-white absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-1 text-sm font-bold shadow-lg"
          >
            Most Popular
          </motion.div>
          <div className="mb-2 text-2xl font-bold text-[#153a2b]">
            Turnkey Solution
          </div>
          <p className="mb-4 text-gray-700 min-h-[40px]">
            From concept to completion, we manage everything 
          </p>
          <ul className="mb-6 space-y-2 text-base text-gray-800">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Complete Design</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Material Procurement</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Execution</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Installation</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Final Handover</li>
          </ul>
          <div className="mt-auto w-full">
            <div className="mb-6 text-xl font-extrabold text-[#00423D]">
              Starting ₹ 3,00,000 only
            </div>
            <Link href="/contact-us" className="w-full" >
              <InteractiveButton className="">Choose This Plan</InteractiveButton>
            </Link>
          </div>
        </motion.div>

        {/* Project Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [4, -4, 4] }}
          transition={{
            type: "spring",
            duration: 0.6,
            y: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            },
          }}
          whileHover={{ scale: 1.03, y: -10 }}
          className="bg-white/80 backdrop-blur-sm border-[#00423D] flex flex-col items-start rounded-2xl border-2 px-8 py-8 shadow-2xl w-full md:w-96"
        >
          <div className="mb-2 text-2xl font-bold text-[#153a2b]">
            Design & Project Management
          </div>
          <p className="mb-4 text-gray-700 min-h-[40px]">
            We oversee execution while you provide the materials
          </p>
          <ul className="mb-6 space-y-2 text-base text-gray-800">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Everything in Design Only</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Project Management</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Vendor Coordination</li>
            <li className="flex items-center gap-2"><CheckCircle className="text-green-700" size={20} />Quality Checks</li>
          </ul>
          <div className="mt-auto w-full">
            <div className="mb-6 text-xl font-extrabold text-[#00423D]">
              Starting ₹ 50,000 only
            </div>
            <Link href="/contact-us" className="w-full">
              <InteractiveButton>
                Choose This Plan
              </InteractiveButton>
            </Link>

          </div>
        </motion.div>
      </div>
    </section>
  )
}