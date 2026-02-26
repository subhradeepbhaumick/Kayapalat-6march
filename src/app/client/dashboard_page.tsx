'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, User, FileText, IndianRupee, Frame, CreditCard, MessageSquare } from 'lucide-react';
import PostServiceTab from '@/components/PostServiceTab';
import { useSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { FaMoneyBill } from 'react-icons/fa';
import DesigningFees from '@/components/DesigningFees';
import InteriorPayments from '@/components/InteriorPayments';

interface Estimate {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  project_type: string;
  bhk_type: string;
  selected_package: string;
  room_details: any;
  total_estimate: number | null;
  breakdown: any;
  timeline: string;
  budget_range: string;
  location: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

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

interface Transaction {
  id: number;
  plan_type: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'approved';
  created_at: string;
}

const ClientDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const [showWelcomeBar, setShowWelcomeBar] = useState(true);

  const { data: session, update } = useSession();

  const [quotations, setQuotations] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  });
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Estimate>>({});

  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

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
    role: "Client"
  });
  const [quotationData, setQuotationData] = useState<{ hasPdfs: boolean; pdfs: any[] } | null>(null);

  // Initialize user and profile data from session
  useEffect(() => {
    if (session?.user) {
      const userData = {
        name: session.user.name || "",
        id: session.user.id || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
        whatsapp: session.user.whatsapp || "",
        role: "Client"
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

  // Fetch quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/estimates', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch quotations');
        }
        const data: Estimate[] = await response.json();
        setQuotations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchQuotations();
    }
  }, [session]);

  // Fetch quotation data
  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        const response = await fetch('/api/client/quotation-pdf', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setQuotationData(data);
        }
      } catch (err) {
        console.error('Error fetching quotation data:', err);
      }
    };

    if (session) {
      fetchQuotationData();
    }
  }, [session]);

  // Initialize sidebar state and handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1024) {
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
    { icon: FileText, label: 'My Quotations', key: 'Quotations' },
    { icon: Frame , label: 'My Designs' , key:'Designs' },
    { icon: IndianRupee, label: 'Designing Fees', key: 'Fees' },
    { icon: CreditCard, label: 'Transactions', key: 'Transactions' },
    { icon: MessageSquare, label: 'Post Service', key: 'PostService' },

  ];

  const DesignTransactionsTab = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTransactions = async () => {
        try {
          const response = await fetch('/api/client/design-fees');
          if (response.ok) {
            const data = await response.json();
            setTransactions(data.payments);
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchTransactions();
    }, []);

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      );
    }

    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
            Your Design Request Transactions
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            View details of your design fee payments.
          </p>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-[#D7E7D0]">
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Plan Type</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Amount</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">GST</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Total</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Payment Method</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize">{transaction.plan_type}</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2">₹{transaction.amount.toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 hidden sm:table-cell">₹{transaction.gst_amount.toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2">₹{transaction.total_amount.toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize hidden sm:table-cell">{transaction.payment_method}</td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        transaction.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2">
                      {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 text-center">
          <button
            onClick={() => setActiveTab('Transactions')}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base"
          >
            Back to Transactions
          </button>
        </div>
      </>
    );
  };

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
            className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md h-10 sm:h-11"
            style={{
              width: isLogoutHovered ? (windowWidth < 640 ? "100px" : "125px") : (windowWidth < 640 ? "40px" : "45px"),
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
                paddingRight: isLogoutHovered ? (windowWidth < 640 ? "5px" : "10px") : "0px",
                transition: "opacity 0.3s, width 0.3s, padding-right 0.3s",
                fontSize: windowWidth < 640 ? "1em" : "1.1em",
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
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-center">Welcome to Your Dashboard</h4>
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
                            className="px-4 py-2 sm:px-6 sm:py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition"
                          >
                            Edit Profile
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                              className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
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
                              className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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

              {activeTab === 'Quotations' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      My Quotations
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      View your project quotations and estimates.
                    </p>
                  </div>

                  {quotationData && quotationData.hasPdfs && quotationData.pdfs.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-[#295A47] mb-4">Your Quotation PDFs</h3>
                      <div className="space-y-4">
                        {quotationData.pdfs.map((pdf) => (
                          <div key={pdf.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium">{pdf.file_name}</p>
                              <p className="text-sm text-gray-600">
                                Size: {(pdf.file_size / 1024).toFixed(2)} KB | Uploaded: {new Date(pdf.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                            <a
                              href={`/api/client/quotation-pdf?id=${pdf.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Download PDF
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading quotations...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-600">{error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32]"
                      >
                        Retry
                      </button>
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No quotations found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-[#D7E7D0]">
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Project</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Type</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">BHK</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Package</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Location</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Estimate</th>
                            <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotations.map((quote, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">{quote.client_name}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize hidden sm:table-cell">{quote.project_type}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 hidden sm:table-cell">{quote.bhk_type}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize hidden sm:table-cell">{quote.selected_package}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2 hidden sm:table-cell">{quote.location}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${quote.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      quote.status === 'sent' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {quote.status}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">₹{quote.total_estimate ? quote.total_estimate.toLocaleString('en-IN') : 'N/A'}</td>
                              <td className="border border-gray-300 px-2 sm:px-4 py-2">
                                <button
                                  onClick={() => {
                                    setEditingEstimate(quote);
                                    setEditFormData({ ...quote });
                                  }}
                                  className="px-2 py-1 sm:px-3 sm:py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'Fees' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      Designing Fees
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      Expect Your First Set of Interior Designs Within the First 20 Working Days.
                    </p>
                  </div>
                  <DesigningFees onViewTransactions={() => setActiveTab('DesignTransactions')} />
                </>
              )}

              {activeTab === 'Designs' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      Your Designs
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      View the beautiful designs created for you by our designers.
                    </p>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => window.location.href = '/client/your-designs'}
                      className="px-4 py-2 sm:px-6 sm:py-3 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition font-semibold text-sm sm:text-base"
                    >
                      View Full Designs Gallery
                    </button>
                    <p className="mt-4 text-sm text-gray-500">
                      Click above to see all your designs in a beautiful gallery view
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'PostService' && (
                <PostServiceTab />
              )}

              {activeTab === 'Transactions' && (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                      Transactions
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                      View your transaction history and payment details.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Design Request Transactions Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]">
                      <h3 className="text-xl font-semibold text-[#295A47] mb-4">Your Design Request Transactions</h3>
                      <p className="text-gray-600 mb-4">View details of your design fee payments</p>
                      <button
                        onClick={() => {
                          // Fetch and show transactions in a modal or expand this card
                          setActiveTab('DesignTransactions');
                        }}
                        className="w-full bg-[#295A47] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
                      >
                        View Transactions
                      </button>
                    </div>

                    {/* Interior Project Payments Card */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]">
                      <h3 className="text-xl font-semibold text-[#295A47] mb-4">Interior Project Payments</h3>
                      <p className="text-gray-600 mb-4">Manage payments for your interior projects</p>
                      <button
                        onClick={() => setActiveTab('InteriorPayments')}
                        className="w-full bg-[#295A47] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
                      >
                        View Payments
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'DesignTransactions' && (
                <DesignTransactionsTab />
              )}

              {activeTab === 'InteriorPayments' && (
                <>
                 
                  <InteriorPayments />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Estimate Modal */}
      {editingEstimate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#295A47] mb-4">Edit Estimate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={editFormData.client_name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, client_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                <input
                  type="email"
                  value={editFormData.client_email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editFormData.client_phone || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editFormData.client_address || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, client_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={editFormData.project_type || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, project_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BHK Type</label>
                <input
                  type="text"
                  value={editFormData.bhk_type || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bhk_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected Package</label>
                <select
                  value={editFormData.selected_package || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, selected_package: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="essential">Essential</option>
                  <option value="comfort">Comfort</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <input
                  type="text"
                  value={editFormData.timeline || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                <input
                  type="text"
                  value={editFormData.budget_range || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, budget_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
              <button
                onClick={() => {
                  setEditingEstimate(null);
                  setEditFormData({});
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/estimates/${editingEstimate.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(editFormData)
                    });

                    if (!response.ok) {
                      throw new Error('Failed to update estimate');
                    }

                    // Refresh quotations
                    const fetchResponse = await fetch('/api/estimates', { credentials: 'include' });
                    const data = await fetchResponse.json();
                    setQuotations(data);

                    setEditingEstimate(null);
                    setEditFormData({});
                    toast.success('Estimate updated successfully');
                  } catch (error) {
                    console.error('Update estimate error:', error);
                    toast.error('Failed to update estimate');
                  }
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
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

export default ClientDashboard;
