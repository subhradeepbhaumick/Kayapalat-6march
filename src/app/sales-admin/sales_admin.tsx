'use client';

import React, { useState } from 'react';
import { Menu, Bell, LayoutDashboard, Users, UserPlus, BarChart3, Store, ClipboardList, Search, LogOut, User, Settings, X, FileText } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AgentsTab from './sales_agents';
import LeadsTab from './sales_leads';
import PaymentsTab from './sales_payments';
import InvoicesTab from './sales_invoices';
import BusinessInsightsTab from './sales_businessInsights';
import NotificationsTab from './sales_notifications';
import TodoTab from './sales_todo';
import SettingsTab from './sales_settings';
import ProductsTab from './sales_products';
import OrdersTab from './sales_showorder';
import SalesQuotationPdfsTab from './sales_quotation_pdfs';
import CommissionLeadsTab from './sales_leads_commission';

const SalesAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({ activeAgents: 0, totalLeads: 0, totalRevenue: 0 });
  const [showWelcomeBar, setShowWelcomeBar] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  // Initialize sidebar state based on screen size
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Fetch dashboard stats
  React.useEffect(() => {
    if (status === 'loading') return; // Wait for session to load

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/sales-admin/dashboard_stats', {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          console.error('Failed to fetch stats:', data.error);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    if (session) {
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [session, status]);

  const handleLogout = async () => {
    try {
      // Sign out from NextAuth and redirect manually
      await signOut();
      router.push("/login");
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };
 React.useEffect(() => {
   const fetchUserData = async () => {
     console.log('Sales Admin: Starting fetchUserData');
     try {
       console.log('Sales Admin: Making fetch request to /api/sales-admin/profile');
       const res = await fetch("/api/sales-admin/profile", {
         method: "GET",
         credentials: 'include',
       });
       console.log('Sales Admin: Profile fetch response status:', res.status);
       const data = await res.json();
       console.log("Sales Admin: Profile USER DATA:", data);

       if (data.admin) {
         setUserData(data.admin);
         console.log('Sales Admin: Admin data fetched and set:', data.admin);
       } else {
         console.warn('Sales Admin: Admin data not present in response.');
       }
     } catch (error) {
       console.error('Sales Admin: Failed to fetch user data:', error);
     }
   };

   console.log('Sales Admin: Calling fetchUserData');
   fetchUserData();
 }, []);

React.useEffect(() => {
  const handleFullscreenChange = () => {
    const doc = document as any;
    console.log('Fullscreen change detected:', {
      fullscreenElement: document.fullscreenElement,
      webkitFullscreenElement: doc.webkitFullscreenElement,
      mozFullScreenElement: doc.mozFullScreenElement,
      msFullscreenElement: doc.msFullscreenElement
    });
    if (!document.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
      console.log('Exiting fullscreen, collapsing sidebar');
      setSidebarCollapsed(true);
    }
  };

  // Add event listeners for cross-browser support
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  };
}, []);     

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'Dashboard' },
    { icon: Users, label: 'Agents', key: 'Agents' },
    { icon: UserPlus, label: 'Leads for Sale', key: 'Leads' },
    { icon: UserPlus, label: 'Leads for Commission', key: 'Commission Leads' },
    { icon: UserPlus, label: 'Payments', key: 'Payments' },
    { icon: UserPlus, label: 'Invoices', key: 'Invoices' },
    { icon: FileText, label: 'PDF Quotations', key: 'PDF Quotations' },
    { icon: Store,label: 'Products', key: 'Products'},    
    { icon: Store, label: 'Orders', key:'Orders'},
    // { icon: BarChart3, label: 'Business Insights', key: 'Business Insights' },
    // { icon: Bell, label: 'Notifications', key: 'Notifications' },
    // { icon: ClipboardList, label: 'To Do', key: 'To Do' },
    // { icon: Settings, label: 'Settings', key: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ease-in-out transform ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'}`}>
        {/* Header Section */}
        <div className="p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img
                    src={userData?.profile_pic || user?.image || "/placeholder_person.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to user icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextSibling) {
                        nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <User className="w-6 h-6 text-gray-500 hidden" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#DC0835]">{userData?.name || user?.name || "Admin"}</h3>
                  <p className="text-sm text-gray-600">Sales Administrator</p>
                  <p className="text-sm text-black-600">ID: <strong>{userData?.id || user?.id || "N/A"}</strong></p>
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
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'} py-3 cursor-pointer transition-colors ${
                activeTab === item.key
                  ? 'bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="font-medium ml-3 whitespace-nowrap">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto pt-20 ${sidebarCollapsed ? 'lg:ml-16 ml-0' : 'lg:ml-64 ml-0'}`}>
        {/* Navbar */}
        <div className={`bg-white shadow-md p-2 md:p-4 flex justify-between items-center fixed top-0 z-40 ${sidebarCollapsed ? 'lg:left-16 left-0' : 'lg:left-64 left-0'} right-0`}>
          {/* Hamburger Menu Button for Mobile/Tablet */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-[#295A47] hover:text-[#1e3d32] transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 mr-2">
            <div className="flex items-center space-x-1 md:space-x-3 pr-4 md:pr-8 pl-1 md:pl-2 shrink-0">
              <img
                src="/kayapalat-logo.png"
                alt="Kayapalat Logo"
                className="h-5 md:h-6 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'block';
                  }
                }}
              />
            </div>
            
          </div>
          <button

            onClick={handleLogout}
            className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md shrink-0"
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
              const iconElement = e.currentTarget.querySelector(".logout-icon");
              if (iconElement instanceof HTMLElement) {
                iconElement.style.width = "30%";
                iconElement.style.paddingLeft = "20px";
              }

              // TEXT appears
              const labelElement = e.currentTarget.querySelector(".logout-text");
              if (labelElement instanceof HTMLElement) {
                labelElement.style.opacity = "1";
                labelElement.style.width = "70%";
                labelElement.style.paddingRight = "10px";
              }
            }}
            onMouseLeave={(e) => {
              // Collapse button
              e.currentTarget.style.width = "45px";
              e.currentTarget.style.borderRadius = "50%";

              // ICON reset
              const iconElement = e.currentTarget.querySelector(".logout-icon");
              if (iconElement instanceof HTMLElement) {
                iconElement.style.width = "100%";
                iconElement.style.paddingLeft = "0px";
              }

              // TEXT reset
              const labelElement = e.currentTarget.querySelector(".logout-text");
              if (labelElement instanceof HTMLElement) {
                labelElement.style.opacity = "0";
                labelElement.style.width = "0%";
                labelElement.style.paddingRight = "0px";
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
        {showWelcomeBar && (
          <div className="bg-[#295A47] text-white py-3 px-8 relative">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-lg font-semibold text-center">Welcome to Sales Admin Dashboard</h4>
            </div>
            <button
              onClick={() => setShowWelcomeBar(false)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className={`p-2 md:p-6 lg:p-8 ${sidebarCollapsed ? 'lg:p-4' : ''}`}>
          <div className="max-w-8xl pt-4 lg:mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-2 md:p-6 lg:p-8 mb-4 md:mb-8">
              {activeTab === 'Dashboard' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                      Sales Admin Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Manage your sales operations, agents, leads, and business insights.
                    </p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#D7E7D0] rounded-lg p-4 md:p-6 text-center">
                      <Users className="w-8 h-8 md:w-12 md:h-12 text-[#295A47] mx-auto mb-2 md:mb-4" />
                      <h3 className="text-lg md:text-2xl font-bold text-[#295A47]">{loadingStats ? '...' : stats.activeAgents}</h3>
                      <p className="text-gray-700 text-sm md:text-base">Total Agents</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-4 md:p-6 text-center">
                      <UserPlus className="w-8 h-8 md:w-12 md:h-12 text-[#295A47] mx-auto mb-2 md:mb-4" />
                      <h3 className="text-lg md:text-2xl font-bold text-[#295A47]">{loadingStats ? '...' : stats.totalLeads}</h3>
                      <p className="text-gray-700 text-sm md:text-base">Total Leads</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-4 md:p-6 text-center">
                      <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-[#295A47] mx-auto mb-2 md:mb-4" />
                      <h3 className="text-lg md:text-2xl font-bold text-[#295A47]">₹{loadingStats ? '...' : (stats.totalRevenue || 0).toLocaleString()}</h3>
                      <p className="text-gray-700 text-sm md:text-base">Revenue</p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Agents' && (
                <AgentsTab />
              )}

              {activeTab === 'Leads' && (
                <LeadsTab />
              )}

              {activeTab === 'Commission Leads' && (
                <CommissionLeadsTab />
              )}
              
              {activeTab === 'Payments' && (
                <PaymentsTab />
              )}

              {activeTab === 'Invoices' && (
                <InvoicesTab />
              )}

              {activeTab === 'PDF Quotations' && (
                <SalesQuotationPdfsTab />
              )}

              {activeTab === 'Orders' && (
                <OrdersTab />
              )}
              
              {activeTab === 'Products' && (  
                <ProductsTab />
              )}
{/* 
              {activeTab === 'Business Insights' && (
                <BusinessInsightsTab />
              )}

              {activeTab === 'Notifications' && (
                <NotificationsTab />
              )}

              {activeTab === 'To Do' && (
                <TodoTab />
              )}
              {activeTab === 'Settings' && (
                <SettingsTab />
              )} */}
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
  );
};

export default SalesAdmin;
