// "use client";

// import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Menu, X, User, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
// import { usePathname, useRouter } from "next/navigation";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";

// export default function Navbar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { isAuthenticated, user, logout } = useAuth();
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isClient, setIsClient] = useState(false);
//   const [citiesOpen, setCitiesOpen] = useState(false);
//   const [isVisible, setIsVisible] = useState(true);
//   const lastScrollY = useRef(0);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   useEffect(() => {
//     const controlNavbar = () => {
//       const currentScrollY = window.scrollY;
      
//       if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
//         setIsVisible(true);
//       } else {
//         setIsVisible(false);
//       }
      
//       lastScrollY.current = currentScrollY;
//     };

//     window.addEventListener('scroll', controlNavbar);
//     return () => {
//       window.removeEventListener('scroll', controlNavbar);
//     };
//   }, []);

//   const handleLogout = async () => {
//     try {
//       const response = await fetch('/api/auth/logout', {
//         method: 'POST',
//       });
      
//       if (response.ok) {
//         logout();            // clear client auth state
//         toast.success('Logged out successfully');
//         router.push('/');    // go to home
//         // give toast a moment to show before hard reload so user sees it
//         setTimeout(() => window.location.reload(), 600);
//       } else {
//         toast.error('Failed to logout');
//       }
//     } catch (error) {
//       console.error('Logout failed:', error);
//       toast.error('Logout failed');
//     }
//   };

//   const [citiesTimeout, setCitiesTimeout] = useState<NodeJS.Timeout | null>(null);
//   const dropdownVariants = {
//     hidden: { opacity: 0, y: -10 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
//     exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
//   };

//   // Close dropdown on outside click
//   useEffect(() => {
//     if (!dropdownOpen) return;
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [dropdownOpen]);

//   if (!isClient) return null;

//   const isReferUserPage = pathname.startsWith("/referuser");

//   return (
//     <nav
//       className={`fixed top-0 w-full bg-[#D7E7D0] shadow-md px-4 py-2 flex items-center justify-between z-50 h-14 transition-transform duration-300 ease-out ${
//         isVisible ? 'translate-y-0' : '-translate-y-full'
//       }`}
//     >
//       {/* Logo and Sidebar Button */}
//       <div className="flex items-center gap-3">
//         {!isReferUserPage && (
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="lg:hidden text-[#295A47]"
//           >
//             <Menu size={24} />
//           </button>
//         )}
//         <Link href="/">
//           <Image
//             src="/kayapalat-logo.png"
//             alt="Kayapalat Logo"
//             width={120}
//             height={30}
//             className="inline cursor-pointer md:ml-6"
//           />
//         </Link>
//       </div>

//       {/* Center Navigation */}
//       <ul className="hidden lg:flex gap-5 text-gray-700 font-medium text-sm">
//         <li className="relative group">
//           <Link
//             href="/about"
//             className={`transition ${pathname === "/about"
//               ? "text-[#295A47]"
//               : "hover:text-[#295A47]"
//               }`}
//           >
//             About
//             <span
//               className={`absolute left-0 bottom-0 h-[1px] bg-[#295A47]/80 transition-all duration-300 ${pathname === "/about" ? "w-full" : "w-0 group-hover:w-full"
//                 }`}
//             ></span>
//           </Link>
//         </li>

//         {/* Cities Hover Dropdown */}
//         {/* <li
//           className="relative group"
//           onMouseEnter={() => {
//             if (citiesTimeout) clearTimeout(citiesTimeout);
//             setCitiesOpen(true);
//           }}
//           onMouseLeave={() => {
//             const timeout = setTimeout(() => {
//               setCitiesOpen(false);
//             }, 200);
//             setCitiesTimeout(timeout);
//           }}
//         >
//           <button className="transition cursor-pointer hover:text-[#295A47] flex items-center gap-1">
//             Cities ▾
//           </button>

//           <AnimatePresence>
//             {citiesOpen && (
//               <motion.ul
//                 initial="hidden"
//                 animate="visible"
//                 exit="exit"
//                 variants={dropdownVariants}
//                 className="absolute top-full mt-1 left-0 bg-white shadow-md rounded-md py-4 px-6 w-[500px] z-50 grid grid-cols-4 gap-1"
//               >
//                 {["Delhi", "Bangalore", "Mumbai", "Hyderabad","Chennai","Tamil Nadu ", "Kolkata"].map((city, idx) => (
//                   <li key={idx}>
//                     <Link
//                       href={`/cities/${city.toLowerCase()}`}
//                       className="block px-2 py-1 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47]"
//                     >
//                       {city}
//                     </Link>
//                   </li>
//                 ))}
//               </motion.ul>
//             )}
//           </AnimatePresence>
//         </li> */}


//         {/* Other Links */}
//         {[
//           "Gallery",
//           // "How it Works",
//           "Price Compare",
//           "Our Designers",
//           "Careers",
//           "Blogs",
//           // "Branding Partners",
//           "Contact Us",
//           // "Shop",
//         ].map((name, index) => {
//           const linkPath = `/${name.toLowerCase().replace(/ /g, "-")}`;
//           const isActive =
//             pathname.replace(/\/$/, "") === linkPath.replace(/\/$/, "");
//           return (
//             <li key={index} className="relative group">
//               <Link
//                 href={linkPath}
//                 className={`transition ${isActive ? "text-[#295A47]" : "hover:text-[#295A47]"
//                   }`}
//               >
//                 {name}
//                 <span
//                   className={`absolute left-0 bottom-0 h-[1px] bg-[#295A47]/80 transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"
//                     }`}
//                 ></span>
//               </Link>
//             </li>
//           );
//         })}
//       </ul>

//       {/* Right Section */}
//       <div className="flex gap-2 relative">
//         {isAuthenticated ? (
//           <div className="relative" ref={dropdownRef}>
//             <button
//               className="w-10 h-10 rounded-full bg-[#295A47] flex items-center justify-center hover:bg-[#1e3d32] transition-colors cursor-pointer"
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//             >
//               <User size={20} className="text-white" />
//             </button>
//             {dropdownOpen && (
//               <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md text-sm py-1 border border-gray-200">
//                 <Link
//                   href="/profile"
//                   className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
//                   onClick={() => setDropdownOpen(false)}
//                 >
//                   <UserCircle size={16} />
//                   Profile
//                 </Link>
//                 <Link
//                   href="/referuser"
//                   className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
//                   onClick={() => setDropdownOpen(false)}
//                 >
//                   <LayoutDashboard size={16} />
//                   Dashboard
//                 </Link>
//                 <button
//                   onClick={() => { setDropdownOpen(false); handleLogout(); }}
//                   className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
//                 >
//                   <LogOut size={16} />
//                   Sign Out
//                 </button>
//               </div>
//             )}
//           </div>
//         ) : (
//           <>
//             <Link
//               href="/signup"
//               className="border border-[#295A47] text-[#295A47] px-3 py-1 rounded-md hover:bg-[#295A47] hover:text-white transition cursor-pointer text-sm md:text-base"
//             >
//               Sign Up
//             </Link>
//             <Link
//               href="/login"
//               className="bg-[#295A47] text-white px-3 py-1 rounded-md transition cursor-pointer text-sm md:text-base"
//             >
//               Login
//             </Link>
//           </>
//         )}
//       </div>

//       {/* Sidebar */}
//       <AnimatePresence>
//         {sidebarOpen && !isReferUserPage && (
//           <motion.div
//             className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 h-screen"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setSidebarOpen(false)}
//           >
//             <motion.div
//               initial={{ x: -300 }}
//               animate={{ x: 0 }}
//               exit={{ x: -300 }}
//               transition={{ type: "spring", stiffness: 260, damping: 20 }}
//               className="fixed left-0 top-0 w-56 bg-white/20 backdrop-blur-lg shadow-lg p-4 rounded-r-2xl flex flex-col gap-3 text-white h-full"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <button
//                 onClick={() => setSidebarOpen(false)}
//                 className="absolute top-3 right-4 text-white"
//               >
//                 <X size={24} />
//               </button>
//               <h2 className="text-lg font-semibold text-[#D7E7D0] mb-3 border-b border-white/50 pb-2">
//                 MENU
//               </h2>
//               <ul className="flex flex-col gap-2">
//                 <li className="border-b border-white/50 pb-1 relative group">
//                   <Link
//                     href="/about"
//                     className="block px-3 py-2 hover:text-[#D7E7D0] transition-transform relative"
//                   >
//                     About
//                     <span className="absolute left-3 bottom-1 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-[90%]"></span>
//                   </Link>
//                 </li>

//                 {/* Cities Dropdown in Sidebar */}
//                 {/* <li className="border-b border-white/50 pb-1">
//                   <button
//                     onClick={() => setCitiesOpen(!citiesOpen)}
//                     className="block w-full text-left px-3 py-2 hover:text-[#D7E7D0] transition-transform relative group"
//                   >
//                     Cities ▾
//                     <span className="absolute left-3 bottom-1 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-[90%]"></span>
//                   </button>
//                   {citiesOpen && (
//                     <ul className="ml-4 mt-1">
//                       {[
//                         "Delhi",
//                         "Bangalore",
//                         "Mumbai",
//                         "Hyderabad",
//                         "Kolkata",
//                       ].map((city, idx) => (
//                         <li key={idx} className="relative group">
//                           <Link
//                             href={`/cities/${city.toLowerCase()}`}
//                             className="block px-4 py-1 text-sm hover:text-[#D7E7D0] relative"
//                           >
//                             {city}
//                             <span className="absolute left-4 bottom-0 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-3/4"></span>
//                           </Link>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </li> */}

//                 {/* Sidebar Links */}
//                 {[
//                   "Gallery",
//                   // "How it Works",
//                   "Price Compare",
//                   "Our Designers",
//                   "Careers",
//                   "Blogs",
//                   // "Branding Partners",
//                   "Contact Us",
//                   // "Shop",
//                 ].map((name, index) => {
//                   const linkPath = `/${name
//                     .toLowerCase()
//                     .replace(/ /g, "-")}`;
//                   const isActive =
//                     pathname.replace(/\/$/, "") ===
//                     linkPath.replace(/\/$/, "");
//                   return (
//                     <li
//                       key={index}
//                       className={`border-b border-white/50 pb-1 relative group ${isActive ? "text-[#D7E7D0]" : ""
//                         }`}
//                     >
//                       <Link
//                         href={linkPath}
//                         className="block px-3 py-2 hover:text-[#D7E7D0] transition-transform relative"
//                       >
//                         {name}
//                         <span className="absolute left-3 bottom-1 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-[90%]"></span>
//                       </Link>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </nav>
//   );
// }
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [citiesTimeout, setCitiesTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  // -----------------------------
  // HELPER: Get dashboard path based on role
  const getDashboardPath = (role: string | undefined) => {
    if (!role) return "/";
    switch (role) {
      case "referuser":
        return "/referuser";
      case "sales_admin":
        return "/sales-admin";
      case "admin":
        return "/admin";
      case "superadmin":
        return "/superadmin";
      case "client":
        return "/client";
      case "designer":
        return "/designer";
      case "supervisor":
        return "/supervisor";
      case "businessBrand":
        return "/businessBrand";
      default:
        return "/";
    }
  };
  // -----------------------------

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  if (!isClient) return null;

  const isReferUserPage = pathname.startsWith("/referuser");

  return (
    <nav
      className={`fixed top-0 w-full bg-[#D7E7D0] shadow-md px-4 py-2 flex items-center justify-between z-50 h-14 transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Logo and Sidebar Button */}
      <div className="flex items-center gap-3">
        {!isReferUserPage && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#295A47]"
          >
            <Menu size={24} />
          </button>
        )}
        <Link href="/">
          <Image
            src="/kayapalat-logo.png"
            alt="Kayapalat Logo"
            width={120}
            height={30}
            className="inline cursor-pointer md:ml-6"
          />
        </Link>
      </div>

      {/* Center Navigation */}
      <ul className="hidden lg:flex gap-5 text-gray-700 font-medium text-sm">
        <li className="relative group">
          <Link
            href="/about"
            className={`transition ${
              pathname === "/about" ? "text-[#295A47]" : "hover:text-[#295A47]"
            }`}
          >
            About
            <span
              className={`absolute left-0 bottom-0 h-[1px] bg-[#295A47]/80 transition-all duration-300 ${
                pathname === "/about" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></span>
          </Link>
        </li>

        {/* Other Links */}
        {[
          "Gallery",
          "Price Compare",
          // "Our Designers",
          "Careers",
          "Blogs",
          "Contact Us",
        ].map((name, index) => {
          const linkPath = `/${name.toLowerCase().replace(/ /g, "-")}`;
          const isActive = pathname.replace(/\/$/, "") === linkPath.replace(/\/$/, "");
          return (
            <li key={index} className="relative group">
              <Link
                href={linkPath}
                className={`transition ${isActive ? "text-[#295A47]" : "hover:text-[#295A47]"}`}
              >
                {name}
                <span
                  className={`absolute left-0 bottom-0 h-[1px] bg-[#295A47]/80 transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right Section */}
      <div className="flex gap-2 relative">
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 rounded-full bg-[#295A47] flex items-center justify-center hover:bg-[#1e3d32] transition-colors cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <User size={20} className="text-white" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md text-sm py-1 border border-gray-200">
                {/* <Link 
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserCircle size={16} />
                  Profile
                </Link>*/}

                <Link
                  href={getDashboardPath(user?.role)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-[#295A47]/10 hover:text-[#295A47] cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/signup"
              className="border border-[#295A47] text-[#295A47] px-3 py-1 rounded-md hover:bg-[#295A47] hover:text-white transition cursor-pointer text-sm md:text-base"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="bg-[#295A47] text-white px-3 py-1 rounded-md transition cursor-pointer text-sm md:text-base"
            >
              Login
            </Link>
          </>
        )}
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && !isReferUserPage && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="fixed left-0 top-0 w-56 bg-white/20 backdrop-blur-lg shadow-lg p-4 rounded-r-2xl flex flex-col gap-3 text-white h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-4 text-white"
              >
                <X size={24} />
              </button>
              <h2 className="text-lg font-semibold text-[#D7E7D0] mb-3 border-b border-white/50 pb-2">
                MENU
              </h2>
              <ul className="flex flex-col gap-2">
                <li className="border-b border-white/50 pb-1 relative group">
                  <Link
                    href="/about"
                    className="block px-3 py-2 hover:text-[#D7E7D0] transition-transform relative"
                  >
                    About
                    <span className="absolute left-3 bottom-1 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-[90%]"></span>
                  </Link>
                </li>

                {/* Sidebar Links */}
                {[
                  "Gallery",
                  "Price Compare",
                  // "Our Designers",
                  "Careers",
                  "Blogs",
                  "Contact Us",
                ].map((name, index) => {
                  const linkPath = `/${name.toLowerCase().replace(/ /g, "-")}`;
                  const isActive = pathname.replace(/\/$/, "") === linkPath.replace(/\/$/, "");
                  return (
                    <li
                      key={index}
                      className={`border-b border-white/50 pb-1 relative group ${
                        isActive ? "text-[#D7E7D0]" : ""
                      }`}
                    >
                      <Link
                        href={linkPath}
                        className="block px-3 py-2 hover:text-[#D7E7D0] transition-transform relative"
                      >
                        {name}
                        <span className="absolute left-3 bottom-1 h-[1px] w-0 bg-[#D7E7D0]/80 transition-all duration-300 group-hover:w-[90%]"></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
