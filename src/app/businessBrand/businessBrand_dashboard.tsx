"use client";

import React, { useState } from "react";
import {
  Menu,
  Bell,
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  ClipboardList,
  Search,
  LogOut,
  BookLock,
  User,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  Boxes,
  PackagePlus,
  UserCircle,
  LucideShoppingBasket,
} from "lucide-react";
import { FaSearchLocation } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import BusinessBrandProfile from "./businessbrand_profile";
import BusinessBrandOnboarding from "./businessbrand_onboarding";
import BusinessBrandAddProduct from "./businessbrand_addproduct";
import BusinessBrandMyListing from "./businessbrand_mylisting";
import BusinessBrandOrders from "./businessbrand_showorder";
import BusinessBrandBookMySpace from "./businessbrand_bookmyspace";
import BusinessBrandLocation from "./businessbrand_location";

const BusinessBrandDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalLeads: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [refreshListings, setRefreshListings] = useState(false);

  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "addproduct") {
      setActiveTab("Add Products");
    } else if (tab === "mylistings") {
      setActiveTab("My Listings");
      setRefreshListings((prev) => !prev); // Trigger refresh
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      const callbackUrl = `${window.location.origin}/login`;
      await signOut({ callbackUrl });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch businessBrand profile data
        const res = await fetch("/api/businessBrand/profile", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.businessBrand) {
          setUserData(data.businessBrand);
          // Check if all required fields are filled up in manufacturer table
          // Show onboarding modal if any required field is missing or empty
          const { company_name, address, owner_name, phone, pan } =
            data.businessBrand;
          if (
            !company_name ||
            !address ||
            !owner_name ||
            !phone ||
            !pan ||
            company_name.trim() === "" ||
            address.trim() === "" ||
            owner_name.trim() === "" ||
            phone.trim() === "" ||
            pan.trim() === ""
          ) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/businessBrand/dashboard_stats");
        if (res.ok) {
          const data = await res.json();
          setStats((prev) => ({
            ...prev,
            totalAgents: data.totalProducts,
            activeAgents: data.activeOrders,
            totalLeads: data.pendingOrders,
            totalRevenue: data.totalRevenue,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      if (
        !document.fullscreenElement &&
        !doc.webkitFullscreenElement &&
        !doc.mozFullScreenElement &&
        !doc.msFullscreenElement
      ) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", key: "Dashboard" },
    { icon: CheckCircle, label: "My Listings", key: "My Listings" },
    { icon: Store, label: "Add Products", key: "Add Products" },
    { icon: UserCircle, label: "Profile", key: "Profile" },
    { icon: LucideShoppingBasket, label: "My Orders", key: "My Orders" },
    { icon: BookLock, label: "Book My Space", key: "Book My Space" },
    { icon: FaSearchLocation, label: "Location", key: "Location" },
  ];

  const handleOnboardingComplete = async () => {
    // Refresh user data without page reload
    try {
      const res = await fetch("/api/businessBrand/profile", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.businessBrand) {
        setUserData(data.businessBrand);
        // Check if all required fields are now filled up in manufacturer table
        // Hide onboarding modal if all required fields are present and not empty
        const { company_name, address, owner_name, phone, pan } =
          data.businessBrand;
        if (
          company_name &&
          address &&
          owner_name &&
          phone &&
          pan &&
          company_name.trim() !== "" &&
          address.trim() !== "" &&
          owner_name.trim() !== "" &&
          phone.trim() !== "" &&
          pan.trim() !== ""
        ) {
          setShowOnboarding(false);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const handleOnboardingClose = () => {
    // Don't allow closing without completing
    toast.error("Please complete your profile setup to continue");
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <BusinessBrandOnboarding
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
        />
      )}

      <div className="min-h-screen bg-[#D2EBD0] flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 ${
            sidebarCollapsed
              ? "-translate-x-full w-64 lg:translate-x-0 lg:w-16"
              : "translate-x-0 w-64"
          } bg-white shadow-lg transition-all duration-300 ease-in-out`}
        >
          {/* Header Section */}
          <div className="p-4 border-b bg-[#D7E7D0]">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <img
                      src={
                        userData?.company_logo ||
                        user?.image ||
                        "/placeholder_person.jpg"
                      }
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextSibling = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (nextSibling) {
                          nextSibling.style.display = "block";
                        }
                      }}
                    />
                    <User className="w-6 h-6 text-gray-500 hidden" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#DC0835]">
                      {userData?.name || user?.name || "Manufacturer Owner"}
                    </h3>
                    <p className="text-sm text-gray-600">Manufacturer</p>
                    <p className="text-sm text-black-600">
                      ID:{" "}
                      <strong>{userData?.user_id || user?.id || "N/A"}</strong>
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-[#295A47] hover:text-[#1e3d32] transition-colors"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
          <nav className="mt-8">
            {sidebarItems.map((item, index) => (
              <div
                key={index}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center ${
                  sidebarCollapsed ? "justify-center px-3" : "px-6"
                } py-3 cursor-pointer transition-colors ${
                  activeTab === item.key
                    ? "bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && (
                  <span className="font-medium ml-3">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 overflow-y-auto pt-20 transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-16 ml-0" : "lg:ml-64 ml-0"
          }`}
        >
          {/* Navbar */}
          <div
            className={`bg-white shadow-md p-4 flex justify-between items-center fixed top-0 z-40 transition-all duration-300 ${
              sidebarCollapsed ? "lg:left-16 left-0" : "lg:left-64 left-0"
            } right-0`}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden text-[#295A47] hover:text-[#1e3d32] transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-3 lg:pr-80 pr-2 pl-2">
                <img
                  src="/kayapalat-logo.png"
                  alt="Kayapalat Logo"
                  className="h-6 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const nextSibling = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (nextSibling) {
                      nextSibling.style.display = "block";
                    }
                  }}
                />
                <h1 className="text-xl font-bold text-[#295A47] hidden">
                  KAYAPALAT
                </h1>
              </div>
              
            </div>
            <button
              onClick={handleLogout}
              className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md"
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                backgroundColor: "rgb(255, 65, 65)",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.width = "125px";
                e.currentTarget.style.borderRadius = "40px";

                const iconElement =
                  e.currentTarget.querySelector(".logout-icon");
                if (iconElement instanceof HTMLElement) {
                  iconElement.style.width = "30%";
                  iconElement.style.paddingLeft = "20px";
                }

                const labelElement =
                  e.currentTarget.querySelector(".logout-text");
                if (labelElement instanceof HTMLElement) {
                  labelElement.style.opacity = "1";
                  labelElement.style.width = "70%";
                  labelElement.style.paddingRight = "10px";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.width = "45px";
                e.currentTarget.style.borderRadius = "50%";

                const iconElement =
                  e.currentTarget.querySelector(".logout-icon");
                if (iconElement instanceof HTMLElement) {
                  iconElement.style.width = "100%";
                  iconElement.style.paddingLeft = "0px";
                }

                const labelElement =
                  e.currentTarget.querySelector(".logout-text");
                if (labelElement instanceof HTMLElement) {
                  labelElement.style.opacity = "0";
                  labelElement.style.width = "0%";
                  labelElement.style.paddingRight = "0px";
                }
              }}
            >
              <div
                className="logout-icon flex items-center justify-center"
                style={{
                  width: "100%",
                  transition: "0.3s",
                }}
              >
                <svg viewBox="0 0 512 512" width="17px">
                  <path
                    fill="white"
                    d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                  />
                </svg>
              </div>

              <div
                className="logout-text absolute right-0 font-semibold text-white"
                style={{
                  width: "0%",
                  opacity: 0,
                  transition: "0.3s",
                  fontSize: "1.1em",
                  whiteSpace: "nowrap",
                }}
              >
                Logout
              </div>
            </button>
          </div>

          {/* Welcome Bar */}
          <div className="bg-[#295A47] text-white py-3 px-8">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-lg font-semibold text-center">
                Welcome to Manufacturer Dashboard
              </h4>
            </div>
          </div>

          {/* Hero Section */}
          <div className={`p-4 lg:p-8 ${sidebarCollapsed ? "lg:p-4" : ""}`}>
            <div className="max-w-8xl pt-4 mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                {activeTab === "Dashboard" && (
                  <>
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                        Manufacturer Dashboard
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Showcase your products, manage orders, and book showroom
                        spaces.
                      </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                        <Boxes className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-[#295A47]">
                          {loadingStats ? "..." : stats.totalAgents}
                        </h3>
                        <p className="text-gray-700">Total Products</p>
                      </div>
                      <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                        <ClipboardList className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-[#295A47]">
                          {loadingStats ? "..." : stats.activeAgents}
                        </h3>
                        <p className="text-gray-700">Active Orders</p>
                      </div>
                      <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-[#295A47]">
                          {loadingStats ? "..." : stats.totalLeads}
                        </h3>
                        <p className="text-gray-700">Pending Orders</p>
                      </div>
                      <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                        <BarChart3 className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-[#295A47]">
                          {loadingStats
                            ? "..."
                            : `₹${(stats.totalRevenue || 0).toLocaleString()}`}
                        </h3>
                        <p className="text-gray-700">Total Revenue</p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Profile" && <BusinessBrandProfile />}

                {activeTab === "Add Products" && <BusinessBrandAddProduct />}

                {activeTab === "My Listings" && (
                  <BusinessBrandMyListing
                    refreshTrigger={refreshListings}
                    onNavigateToAddProduct={() => setActiveTab("Add Products")}
                  />
                )}
                {activeTab === "My Orders" && <BusinessBrandOrders />}
                {activeTab === "Book My Space" && <BusinessBrandBookMySpace />}
                {activeTab === "Location" && <BusinessBrandLocation />}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/70 bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
      </div>
    </>
  );
};

export default BusinessBrandDashboard;
