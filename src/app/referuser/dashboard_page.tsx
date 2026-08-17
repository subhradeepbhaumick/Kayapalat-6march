"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Bell,
  TrendingUp,
  FileText,
  BarChart3,
  Shield,
  HelpCircle,
  User,
  Users,
  Share2,
  Gift,
  Search,
  LogOut,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SalesPage from "./sales_page";
import SalesCommissionPage from "./sales_page_commission";
import ClientProfile from "./settings_client_profile";
import BankDetails from "./settings_bank_details";
import HelpSupport from "./settings_help&support";
import MyProfilePage from "./settings_MyProfile";
// import EMIChart from '../../components/EMIChart';

const ReferUserDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState("Client details");
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const getFilteredNotifications = () => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const now = new Date();

    return notifications.filter((notification) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "today") {
        return notification.date === today;
      }
      if (selectedFilter === "week") {
        const notificationDate = new Date(notification.date);
        const diffTime = Math.abs(now.getTime() - notificationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (selectedFilter === "month") {
        const notificationDate = new Date(notification.date);
        return (
          notificationDate.getMonth() === now.getMonth() &&
          notificationDate.getFullYear() === now.getFullYear()
        );
      }
      if (selectedFilter === "year") {
        const notificationDate = new Date(notification.date);
        return notificationDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Referral Reward Available",
      message:
        "Congratulations! You've earned a new reward for your recent referral.",
      time: "2 hours ago",
      date: "Nov 5, 2025",
      isNew: true,
    },
    {
      id: 2,
      title: "System Maintenance Notice",
      message:
        "Scheduled maintenance will occur this weekend. Service may be temporarily unavailable.",
      time: "1 day ago",
      date: "Nov 4, 2025",
      isNew: false,
    },
    {
      id: 3,
      title: "New Feature Released",
      message:
        "Check out our new analytics dashboard for better insights into your referrals.",
      time: "3 days ago",
      date: "Nov 2, 2025",
      isNew: false,
    },
  ]);

  const { data: session } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/referuser/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [session?.user?.id]);

  // User data from session and profile
  const user = {
    name: userProfile?.user?.name || session?.user?.name || "",
    id: userProfile?.user?.id || session?.user?.id || "",
    role: "Refer & Earn Partner",
    profilePicture:
      userProfile?.agent?.profilePic ||
      userProfile?.user?.profile_pic ||
      "/user.png",
  };

  useEffect(() => {
    if (session?.user) {
      setShowWelcomePopup(true);
    }
  }, [session]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", key: "Dashboard" },
    { icon: Bell, label: "Notifications", key: "Notifications" },
    { icon: TrendingUp, label: "Lead for Sales", key: "Sales" },
    { icon: TrendingUp, label: "Lead for Commission", key: "Sales Commission" },
    { icon: FileText, label: "My Invoices", key: "My Invoices" },
    { icon: BarChart3, label: "Business Analytics", key: "Business Analytics" },
    // { icon: Shield, label: 'Service-Level Agreement', key: 'Service-Level Agreement' },
  ];

  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 ${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white shadow-lg transition-all duration-300 ease-in-out`}
      >
        {/* Header Section */}
        <div className="p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to user icon if image fails to load
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
                  <h3 className="font-semibold text-[#295A47]">{user.name}</h3>
                  <p className="text-sm text-gray-600">ID: {user.id}</p>
                  <p className="text-sm text-gray-600">{user.role}</p>
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

          {/* Settings */}
          <div>
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center px-3" : "px-6"
              } py-3 cursor-pointer transition-colors ${
                activeTab === "Settings"
                  ? "bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setSettingsExpanded(!settingsExpanded)}
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium ml-3 flex-1">Settings</span>
                  {settingsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </>
              )}
            </div>
            {settingsExpanded && !sidebarCollapsed && (
              <div className="ml-8 mt-1 space-y-1">
                <div
                  className={`px-4 py-2 cursor-pointer rounded-lg transition-colors ${
                    activeSettingsTab === "My Profile" &&
                    activeTab === "Settings"
                      ? "bg-[#D7E7D0] text-[#295A47]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveTab("Settings");
                    setActiveSettingsTab("My Profile");
                  }}
                >
                  <span className="text-sm">My Profile</span>
                </div>
                <div
                  className={`px-4 py-2 cursor-pointer rounded-lg transition-colors ${
                    activeSettingsTab === "Client Profile" &&
                    activeTab === "Settings"
                      ? "bg-[#D7E7D0] text-[#295A47]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveTab("Settings");
                    setActiveSettingsTab("Client Profile");
                  }}
                >
                  <span className="text-sm">Add Client</span>
                </div>
                <div
                  className={`px-4 py-2 cursor-pointer rounded-lg transition-colors ${
                    activeSettingsTab === "Bank Details" &&
                    activeTab === "Settings"
                      ? "bg-[#D7E7D0] text-[#295A47]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveTab("Settings");
                    setActiveSettingsTab("Bank Details");
                  }}
                >
                  <span className="text-sm">Bank Details</span>
                </div>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "px-6"
            } py-3 cursor-pointer transition-colors ${
              activeTab === "Help & Support"
                ? "bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("Help & Support")}
          >
            <HelpCircle className="w-5 h-5" />
            {!sidebarCollapsed && (
              <span className="font-medium ml-3">Help & Support</span>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-y-auto pt-20 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        {/* Navbar */}
        <div
          className={`bg-white shadow-md p-4 flex justify-between items-center fixed top-0 z-40 ${
            sidebarCollapsed ? "lg:left-16 left-0" : "lg:left-64 left-0"
          } right-0`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 pr-80 pl-2">
              <img
                src="/kayapalat-logo.png"
                alt="Kayapalat Logo"
                className="h-6 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
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
              // Expand button
              e.currentTarget.style.width = "125px";
              e.currentTarget.style.borderRadius = "40px";

              // ICON changes
              const icon = e.currentTarget.querySelector(
                ".logout-icon"
              ) as HTMLElement;
              if (icon) {
                icon.style.width = "30%";
                icon.style.paddingLeft = "20px";
              }

              // TEXT appears
              const label = e.currentTarget.querySelector(
                ".logout-text"
              ) as HTMLElement;
              if (label) {
                label.style.opacity = "1";
                label.style.width = "70%";
                label.style.paddingRight = "10px";
              }
            }}
            onMouseLeave={(e) => {
              // Collapse button
              e.currentTarget.style.width = "45px";
              e.currentTarget.style.borderRadius = "50%";

              // ICON reset
              const icon = e.currentTarget.querySelector(
                ".logout-icon"
              ) as HTMLElement;
              if (icon) {
                icon.style.width = "100%";
                icon.style.paddingLeft = "0px";
              }

              // TEXT reset
              const label = e.currentTarget.querySelector(
                ".logout-text"
              ) as HTMLElement;
              if (label) {
                label.style.opacity = "0";
                label.style.width = "0%";
                label.style.paddingRight = "0px";
              }
            }}
          >
            {/* ICON */}
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

            {/* TEXT */}
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
              Welcome to Kayapalat
            </h4>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-8">
          <div className="max-w-8xl pt-4 mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              {activeTab === "Dashboard" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4 ">
                      Welcome to Refer & Earn Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Share Kayapalat with friends and family, earn rewards for
                      every successful referral!
                    </p>
                  </div>
                  <div>
                    {/* kayapalat website ad */}
                    <h2 className="text-2xl font-bold text-[#295A47] mb-6 text-center">
                      here the ads will be shown
                    </h2>
                  </div>
                  {/* Stats Cards */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                      <User className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">0</h3>
                      <p className="text-gray-700">Friends Referred</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                      <TrendingUp className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">₹0</h3>
                      <p className="text-gray-700">Total Earnings</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">0</h3>
                      <p className="text-gray-700">Rewards Claimed</p>
                    </div>
                  </div> */}

                  {/* How it Works */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-[#295A47] mb-6 text-center">
                      How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Share2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          Share Your Client Details
                        </h3>
                        <p className="text-gray-600">
                          Submit the form of your Client Details to KAYAPALAT
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          They Hire Us
                        </h3>
                        <p className="text-gray-600">
                          KAYAPALAT will contact them and complete their project
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                          You Earn Rewards
                        </h3>
                        <p className="text-gray-600">
                          Get the best valued commission from us
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        setActiveTab("Settings");
                        setActiveSettingsTab("Client Profile");
                      }}
                      className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
                    >
                      Start Referring Now
                    </button>
                  </div>
                </>
              )}

              {activeTab === "Notifications" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Notifications
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Stay updated with the latest news and updates from
                      Kayapalat.
                    </p>
                  </div>

                  {/* Notification Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#295A47]">
                      Notification List
                    </h2>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        Filter by:
                      </label>
                      <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="space-y-4">
                    {getFilteredNotifications().map((notification) => (
                      <div
                        key={notification.id}
                        className={`${
                          notification.isNew ? "bg-[#D7E7D0]" : "bg-gray-50"
                        } rounded-lg p-6 relative`}
                      >
                        <div className="flex items-start space-x-4">
                          <Bell
                            className={`w-8 h-8 mt-1 ${
                              notification.isNew
                                ? "text-[#295A47]"
                                : "text-gray-400"
                            }`}
                          />
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${
                                notification.isNew
                                  ? "text-[#295A47]"
                                  : "text-gray-800"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p
                              className={
                                notification.isNew
                                  ? "text-gray-700"
                                  : "text-gray-600"
                              }
                            >
                              {notification.message}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-sm text-gray-500">
                                {notification.time}
                              </p>
                              <p className="text-sm text-gray-500">
                                {notification.date}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setDeleteConfirmation(notification.id)
                            }
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Hide"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Sales" && <SalesPage agentId={user.id} />}
              {activeTab === "Sales Commission" && (<SalesCommissionPage agentId={user.id} />)}

              {activeTab === "My Invoices" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      My Invoices
                    </h1>
                    <p className="text-gray-600 text-lg">
                      View and download your commission invoices and payment
                      history.
                    </p>
                  </div>

                  {/* Invoice List */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-[#295A47]">
                        Invoice History
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                          No Invoices Yet
                        </h3>
                        <p className="text-gray-500">
                          Your commission invoices will appear here once you
                          start earning rewards.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download Section */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#295A47] mb-4">
                      Download Options
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors">
                        Download All Invoices
                      </button>
                      <button className="bg-white border border-[#295A47] text-[#295A47] px-4 py-2 rounded-lg hover:bg-[#D7E7D0] transition-colors">
                        Export to CSV
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Business Analytics" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Business Analytics
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Gain insights into your referral performance with detailed
                      analytics.
                    </p>
                  </div>

                  {/* Analytics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#D7E7D0] rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#295A47]">
                          Referral Growth
                        </h3>
                        <TrendingUp className="w-8 h-8 text-[#295A47]" />
                      </div>
                      <p className="text-3xl font-bold text-[#295A47]">+0%</p>
                      <p className="text-sm text-gray-600">vs last month</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#295A47]">
                          Click-through Rate
                        </h3>
                        <BarChart3 className="w-8 h-8 text-[#295A47]" />
                      </div>
                      <p className="text-3xl font-bold text-[#295A47]">0%</p>
                      <p className="text-sm text-gray-600">average CTR</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#295A47]">
                          Top Performing Link
                        </h3>
                        <Share2 className="w-8 h-8 text-[#295A47]" />
                      </div>
                      <p className="text-lg font-bold text-[#295A47]">N/A</p>
                      <p className="text-sm text-gray-600">no data yet</p>
                    </div>
                  </div>

                  {/* Charts Placeholder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#295A47] mb-4">
                        Referral Trends
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <BarChart3 className="w-12 h-12 text-gray-400" />
                        <span className="ml-2 text-gray-500">
                          Chart visualization coming soon
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-[#295A47] mb-4">
                        Geographic Distribution
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <BarChart3 className="w-12 h-12 text-gray-400" />
                        <span className="ml-2 text-gray-500">
                          Map visualization coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Service-Level Agreement" && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Service-Level Agreement
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Review the terms and conditions of our referral
                      partnership program.
                    </p>
                  </div>

                  {/* SLA Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center mb-4">
                      <Shield className="w-8 h-8 text-[#295A47] mr-3" />
                      <h2 className="text-xl font-semibold text-[#295A47]">
                        SLA Overview
                      </h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Our Service-Level Agreement ensures transparent and fair
                      partnership terms for all referrers.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-[#295A47] mb-2">
                          Commission Structure
                        </h3>
                        <p className="text-sm text-gray-600">
                          Fixed percentage on successful referrals
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-[#295A47] mb-2">
                          Payment Terms
                        </h3>
                        <p className="text-sm text-gray-600">
                          Monthly payouts for qualified earnings
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-[#295A47] mb-2">
                          Support Response
                        </h3>
                        <p className="text-sm text-gray-600">
                          24-48 hours for all inquiries
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-[#295A47] mb-2">
                          Tracking Period
                        </h3>
                        <p className="text-sm text-gray-600">
                          90 days attribution window
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#295A47] mb-4">
                      Key Terms
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        • Referrals must complete full project lifecycle to
                        qualify
                      </li>
                      <li>
                        • Commission paid only on verified successful
                        conversions
                      </li>
                      <li>• Minimum payout threshold of ₹500</li>
                      <li>
                        • Partnership can be terminated with 30 days notice
                      </li>
                      <li>• All disputes resolved through arbitration</li>
                    </ul>
                    <div className="mt-6">
                      <button className="bg-[#295A47] text-white px-6 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors">
                        Download Full SLA Document
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Help & Support" && <HelpSupport />}

              {activeTab === "Settings" &&
                activeSettingsTab === "My Profile" && <MyProfilePage />}

              {activeTab === "Settings" &&
                activeSettingsTab === "Client Profile" && <ClientProfile />}

              {activeTab === "Settings" &&
                activeSettingsTab === "Bank Details" && <BankDetails />}

              {activeTab === "Settings" &&
                activeSettingsTab === "Change Password" && (
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Change Password
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Update your account password for security.
                    </p>
                    {/* Placeholder for Change Password form */}
                    <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
                      <p>Change Password form coming soon.</p>
                    </div>
                  </div>
                )}

              {activeTab === "Settings" &&
                activeSettingsTab === "Change Number" && (
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Change Number
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Update your phone number.
                    </p>
                    {/* Placeholder for Change Number form */}
                    <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
                      <p>Change Number form coming soon.</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#295A47] mb-4">
              Welcome to Kayapalat!
            </h2>
            <div className="text-gray-600 mb-6 space-y-4">
              <p>Dear New Refer & Earn Partner,</p>
              <p>
                We warmly welcome you to our esteemed community! Thank you for
                placing your trust in Kayapalat and choosing us as your partner
                in success.
              </p>
              <p>
                Congratulations on joining our network as a valuable Refer &
                Earn partner. We're thrilled to have you on board and look
                forward to achieving great results together.
              </p>
              <p>
                To ensure seamless verification and faster payouts, we kindly
                request that you update your profile with your real{" "}
                <strong>Personal Details</strong> and{" "}
                <strong>Bank Information</strong>. This step helps us maintain
                the highest standards of security and efficiency.
              </p>
              <p>
                Additionally, we suggest uploading your{" "}
                <strong>UPI QR code</strong> to enable instant payouts, making
                your earnings even more convenient and rewarding.
              </p>
              <p>
                Your partnership means the world to us—let's build a prosperous
                future together!
              </p>
              <p>
                Best regards,
                <br />
                The Kayapalat Team
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setActiveTab("Settings");
                  setActiveSettingsTab("My Profile");
                  setShowWelcomePopup(false);
                }}
                className="bg-[#295A47] text-white px-6 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors"
              >
                Update Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab("Settings");
                  setActiveSettingsTab("Bank Details");
                  setShowWelcomePopup(false);
                }}
                className="bg-[#295A47] text-white px-6 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors"
              >
                Update Bank Details
              </button>
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hide Notification
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to hide this notification? You can view
              hidden notifications later.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setNotifications(
                    notifications.filter((n) => n.id !== deleteConfirmation)
                  );
                  setDeleteConfirmation(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/70 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default ReferUserDashboard;
