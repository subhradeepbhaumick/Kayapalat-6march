'use client';

import React, { useState } from 'react';
import { Building, MapPin, FileText, CreditCard, UserCheck, Phone, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';

interface BusinessBrandOnboardingProps {
  onComplete: () => void;
  onClose: () => void;
}


const BusinessBrandOnboarding: React.FC<BusinessBrandOnboardingProps> = ({ onComplete, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    gstin: '',
    pan: '',
    tan: '',
    ownerName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const res = await fetch('/api/businessBrand/onboarding', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Profile setup completed successfully!');
        onComplete();
      } else {
        toast.error(data.error || 'Failed to setup profile');
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="text-center">
            <img src="/kayapalat-logo.png" alt="Kayapalat" className="h-12 bg-white mx-auto mb-4 p-2 " />
            <h1 className="text-3xl font-bold">Welcome to Kayapalat!</h1>
            <p className="text-lg mt-2 opacity-90">Let's get your business profile set up</p>
          </div>
        </div>

        {/* Moving Text */}
        <div className="bg-red-100 border-l-4 border-red-500 p-4 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-red-600 font-semibold">
            ⚠️ Recommendation: Please fill up the form to process further with Kayapalat ⚠️
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Complete your business information to access the dashboard and start managing your brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter owner's name"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter your business address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (WhatsApp Recommended) *
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2
                    ${phoneError
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-[#295A47] focus:border-transparent"
                    }`}
                  placeholder="Enter 10-digit phone number"
                />
              </div>

              {phoneError && (
                <p className="mt-1 text-sm text-red-500">{phoneError}</p>
              )}
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter GSTIN (optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN *</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter PAN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TAN</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="tan"
                  value={formData.tan}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  placeholder="Enter TAN (optional)"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-[#1e3d32] hover:to-[#0f2a1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting Up...
                </div>
              ) : (
                'Complete Setup'
              )}
            </button>
          </div>

          {/* Logout Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BusinessBrandOnboarding;
