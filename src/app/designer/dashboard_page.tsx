'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, User, Upload, LogOut, FileText } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import UploadDesignsTable from '@/components/UploadDesignsTable';
import DesignerQuotationPdfsTab from './designer_quotation_pdfs';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
}

const DesignerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const [showWelcomeBar, setShowWelcomeBar] = useState(true);

  const { data: session, update } = useSession();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  });
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const [user, setUser] = useState<UserProfile>({
    name: "",
    id: "",
    email: "",
    phone: "",
    whatsapp: "",
    role: "Designer"
  });

  // Initialize user and profile data from session
  useEffect(() => {
    if (session?.user) {
      const userData = {
        name: session.user.name || "",
        id: session.user.id || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
        whatsapp: session.user.whatsapp || "",
        role: "Designer"
      };
      setUser(userData);
      setProfileData({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        whatsapp: userData.whatsapp
      });
    }
  }, [session]);

  // Initialize sidebar state and handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const sidebarItems = [
    { icon: User, label: 'My Profile', key: 'Profile' },
    { icon: Upload, label: 'Upload Designs', key: 'UploadDesigns' },
    { icon: FileText, label: 'Client Quotations', key: 'ClientQuotations' }
  ];

  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300
    ${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-64'}
  `}
      >
        <div className="p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#295A47]">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.role}</p>
                  <p className="text-semibold text-red-500">ID: {user.id}</p>
                </div>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center py-3 cursor-pointer
          ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'}
          ${activeTab === item.key
                  ? 'bg-[#D7E7D0] text-[#295A47]'
                  : 'text-gray-700 hover:bg-gray-100'}
        `}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto pt-20 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Navbar */}
        <div
          className={`bg-white shadow-md p-2 sm:p-3 md:p-4 flex justify-between items-center
    fixed top-0 left-0 right-0 z-40
    ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}
  `}
        >
          {/* Hamburger Menu Button for Mobile/Tablet */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-[#295A47] hover:text-[#1e3d32] transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 mr-2">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 pr-4 sm:pr-6 md:pr-8 pl-1 sm:pl-1.5 md:pl-2 shrink-0">
              <img
                src="/kayapalat-logo.png"
                alt="Kayapalat Logo"
                className="h-5 sm:h-5.5 md:h-6 w-auto"
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
            onMouseEnter={() => setIsLogoutHovered(true)}
            onMouseLeave={() => setIsLogoutHovered(false)}
            className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md"
            style={{
              width: isLogoutHovered ? (window.innerWidth < 640 ? "100px" : "125px") : "45px",
              height: "45px",
              borderRadius: isLogoutHovered ? "40px" : "50%",
              backgroundColor: "rgb(255, 65, 65)",
              transition: "width 0.3s, border-radius 0.3s",
            }}
          >
            {/* ICON */}
            <div
              className="flex items-center justify-center"
              style={{
                width: isLogoutHovered ? "30%" : "100%",
                paddingLeft: isLogoutHovered ? "20px" : "0px",
                transition: "width 0.3s, padding-left 0.3s",
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
              className="absolute right-0 font-semibold text-white"
              style={{
                opacity: isLogoutHovered ? 1 : 0,
                width: isLogoutHovered ? "70%" : "0%",
                paddingRight: isLogoutHovered ? "10px" : "0px",
                transition: "opacity 0.3s, width 0.3s, padding-right 0.3s",
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
          <div className="bg-[#295A47] text-white py-2 sm:py-2.5 md:py-3 px-4 sm:px-6 md:px-8 relative">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-center">Welcome to Designer Dashboard</h4>
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
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-8xl pt-4 mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
              {activeTab === 'Profile' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      My Profile
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      View and manage your account information.
                    </p>
                  </div>
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={isEditingProfile ? profileData.name : user.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            readOnly={!isEditingProfile}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={user.email}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={isEditingProfile ? profileData.phone : user.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            readOnly={!isEditingProfile}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                          <input
                            type="tel"
                            value={isEditingProfile ? profileData.whatsapp : user.whatsapp}
                            onChange={(e) => setProfileData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            readOnly={!isEditingProfile}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                          <input
                            type="text"
                            value={user.id}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            type="text"
                            value={user.role}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        {!isEditingProfile ? (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="px-6 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition"
                          >
                            Edit Profile
                          </button>
                        ) : (
                          <div className="flex gap-4 justify-center">
                            <button
                              onClick={() => {
                                setIsEditingProfile(false);
                                // Reset to original
                                setProfileData({
                                  name: user.name,
                                  email: user.email,
                                  phone: user.phone,
                                  whatsapp: user.whatsapp
                                });
                              }}
                              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/users/profile', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                      name: profileData.name,
                                      phone: profileData.phone,
                                      whatsapp: profileData.whatsapp
                                    })
                                  });

                                  if (!response.ok) {
                                    throw new Error('Failed to update profile');
                                  }

                                  // Refresh session data
                                  await update();

                                  setIsEditingProfile(false);
                                  toast.success('Profile updated successfully');
                                } catch (error) {
                                  console.error('Update profile error:', error);
                                  toast.error('Failed to update profile');
                                }
                              }}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              Save Changes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'UploadDesigns' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      Upload Designs
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      Upload and manage design images for your clients.
                    </p>
                  </div>
                  <UploadDesignsTable />
                </>
              )}

              {activeTab === 'ClientQuotations' && (
                <DesignerQuotationPdfsTab />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default DesignerDashboard;
