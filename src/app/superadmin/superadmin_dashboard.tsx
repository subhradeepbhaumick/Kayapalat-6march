'use client';

import React, { useState } from 'react';
import { Menu, Bell, LayoutDashboard, Users, UserPlus, BarChart3, Store,ClipboardList, Search, LogOut, User,Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import AdminTab from './superadmin_admin';
import AgentTab from './superadmin_agent';
import LeadTab from './superadmin_lead';
import PaymentTab from './superadmin_payment';
import InvoiceTab from './superadmin_invoice';
import SuperAdmin_SupervisorTab from './superadmin_supervisor';
import SuperAdminShowroom from './superadmin_showroom';
import ProductsTab from './superadmin_products';
import OrdersTab from './superadmin_showorder';

const SuperAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({ activeAgents: 0, totalLeads: 0, totalRevenue: 0 });

  const { data: session } = useSession();
  const router = useRouter();

  // Fetch dashboard stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/superadmin/dashboard_stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          console.error('Failed to fetch stats:', data.error);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'Dashboard' },
    { icon: Users, label: 'Admin', key: 'Admin' },
    { icon: Users, label: 'Supervisor', key: 'Supervisor' },
    { icon: Users, label: 'Agent', key: 'Agent' },
    { icon: Users, label: 'Lead', key: 'Lead' },
    { icon: UserPlus, label: 'Payments', key: 'Payments' },
    { icon: UserPlus, label: 'Invoices', key: 'Invoices' },
    { icon: BarChart3, label: 'Showroom', key: 'Showroom' },
    { icon: Store, label: 'Products', key: 'Products' },
    { icon: Store, label: 'Orders', key: 'Orders' },
    // { icon: BarChart3, label: 'Business Insights', key: 'Business Insights' },
    // { icon: Bell, label: 'Notifications', key: 'Notifications' },
    { icon: ClipboardList, label: 'Admin Panel', key: 'Admin Panel' },
    // { icon: Settings, label: 'Settings', key: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transform transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        {/* Header Section */}
        <div className="p-3 sm:p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/founder.jpg"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 hidden" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#DC0835] text-sm sm:text-base truncate">{session?.user?.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{'Super Admin'}</p>
                  <p className="text-xs sm:text-sm text-black-600 truncate">ID: <strong>{session?.user?.id}</strong></p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#295A47] hover:text-[#1e3d32] transition-colors flex-shrink-0"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        <nav className="mt-8">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.key === 'Admin Panel') {
                  router.push('/admin');
                } else {
                  setActiveTab(item.key);
                }
              }}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'} py-3 cursor-pointer transition-colors ${
                activeTab === item.key
                  ? 'bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium ml-3">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto pt-20 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Navbar */}
        <div className={`bg-white shadow-md p-2 sm:p-4 flex justify-between items-center fixed top-0 z-40 ${sidebarCollapsed ? 'lg:left-16 left-0' : 'lg:left-64 left-0'} right-0`}>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden text-[#295A47] hover:text-[#1e3d32] transition-colors p-1"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3 pr-2 sm:pr-4 lg:pr-80 pl-1 sm:pl-2">
              <img
                src="/kayapalat-logo.png"
                alt="Kayapalat Logo"
                className="h-5 sm:h-6 w-auto"
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
              const icon = e.currentTarget.querySelector(".logout-icon") as HTMLElement;
              if (icon) {
                icon.style.width = "30%";
                icon.style.paddingLeft = "20px";
              }

              // TEXT appears
              const label = e.currentTarget.querySelector(".logout-text") as HTMLElement;
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
              const icon = e.currentTarget.querySelector(".logout-icon") as HTMLElement;
              if (icon) {
                icon.style.width = "100%";
                icon.style.paddingLeft = "0px";
              }

              // TEXT reset
              const label = e.currentTarget.querySelector(".logout-text") as HTMLElement;
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
        <div className="bg-[#295A47] text-white py-2 sm:py-3 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-sm sm:text-lg font-semibold text-center">Welcome to Super Admin Dashboard</h4>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-8xl pt-2 sm:pt-4 mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-8 mb-4 sm:mb-8">
              {activeTab === 'Dashboard' && (
                <>
                  <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#295A47] mb-3 sm:mb-4">
                      Super Admin Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-2">
                      Manage your sales operations, agents, leads, and business insights.
                    </p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-[#D7E7D0] rounded-lg p-4 sm:p-6 text-center cursor-pointer" onClick={() => setActiveTab('Agent')}>
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#295A47] mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#295A47]">{stats.activeAgents}</h3>
                      <p className="text-gray-700 text-sm sm:text-base">Active Agents</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-4 sm:p-6 text-center cursor-pointer" onClick={() => setActiveTab('Payments')}>
                      <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#295A47] mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#295A47]">{stats.totalLeads}</h3>
                      <p className="text-gray-700 text-sm sm:text-base">Total Leads</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
                      <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#295A47] mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#295A47]">₹{stats.totalRevenue.toLocaleString()}</h3>
                      <p className="text-gray-700 text-sm sm:text-base">Revenue</p>
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'Admin' && (
                <AdminTab />
              )}
              {activeTab === 'Supervisor' && (
                <SuperAdmin_SupervisorTab />
              )}
              {activeTab === 'Agent' && (
                <AgentTab />
              )}
              {activeTab === 'Lead' && (
                <LeadTab />
              )}
              {activeTab === 'Payments' && (
                <PaymentTab />
              )}
              {activeTab === 'Invoices' && (
                <InvoiceTab />
              )}
              {activeTab === 'Showroom' && (
                <SuperAdminShowroom />
              )
              }
              {activeTab === 'Products' && (
                <ProductsTab />
              )
              }
              {activeTab === 'Orders' && (
                <OrdersTab />
              )
              }
              
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

export default SuperAdmin;
