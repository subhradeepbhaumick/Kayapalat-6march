'use client';

import { useRef, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Brush,
  GalleryHorizontal,
  Users,
  Briefcase,
  PhoneIncoming,
  Calculator,
  Newspaper,
  ClipboardList,
  Globe,
  HelpCircle,
  LogOut,
  Menu,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navGroups = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/superadmin", isExternal: true },
    ],
  },
  {
    title: "Content Management",
    links: [
      { label: "Designs", icon: Brush, href: "/admin/designs" },
      { label: "Gallery", icon: GalleryHorizontal, href: "/admin/gallery" },
      { label: "FAQs", icon: HelpCircle, href: "/admin/faqs" },
      { label: "Blogs", icon: Newspaper, href: "/admin/blogs" },
      { label: "Testimonials", icon: Star, href: "/admin/testimonials" },
      { label: "SEO", icon: Globe, href: "/admin/seo" }
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Careers", icon: Briefcase, href: "/admin/careers" },
      { label: "Callback Requests", icon: PhoneIncoming, href: "/admin/callback-request" },
      { label: "Estimations", icon: Calculator, href: "/admin/estimations" },
      { label: "Tasks", icon: ClipboardList, href: "/admin/tasks" },
    ],
  },
  {
    title: "User Management",
    links: [
      { label: "Users", icon: Users, href: "/admin/users" },
    ],
  },
];

export default function AdminSidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  const handleSidebarClick = () => {
    if (!isOpen) {
      toggleSidebar();
    }
  };

  const handleLinkClick = (href: string, isExternal?: boolean) => {
    if (isExternal) {
      router.push(href);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <TooltipProvider>
      <aside
        ref={sidebarRef}
        onClick={handleSidebarClick}
        className={`fixed left-0 top-0 bottom-0 min-h-screen h-full bg-white border-r shadow-md transition-all duration-300 cursor-pointer z-50 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-full flex flex-col sticky top-0">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
            <div className={`flex items-center justify-center ${isOpen ? 'w-full px-4' : 'w-20'}`}>
              {isOpen ? (
                <Link href="/admin">
                  <Image src="/kayapalat-logo.png" alt="Kayapalat Logo" width={150} height={50} priority />
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-[#D7E7D0] transition-colors">
                      <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Expand Sidebar</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-6">
                {isOpen && (
                  <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {group.title}
                  </p>
                )}
                {group.links.map(({ label, icon: Icon, href }) => (
                  <div key={label}>
                    {isOpen ? (
                      <Link
                        href={href}
                        className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                          pathname === href ? 'bg-[#D7E7D0] text-[#295A47]' : 'hover:bg-[#D7E7D0] hover:text-[#295A47]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </Link>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={href}
                            className={`flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                              pathname === href ? 'bg-[#D7E7D0] text-[#295A47]' : 'hover:bg-[#D7E7D0] hover:text-[#295A47]'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon className="w-5 h-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{label}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t bg-white">
            {isOpen ? (
              <Button
                variant="outline"
                className="flex items-center gap-3 py-2 px-3 rounded-lg w-full transition-all duration-300 hover:bg-red-500 hover:text-white hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center w-full py-2 px-3 rounded-lg transition-all duration-300 hover:bg-red-500 hover:text-white hover:scale-105"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
} 