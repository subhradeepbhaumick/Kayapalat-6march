"use client";

import React, { useState, useEffect } from "react";
import { X, Building, Phone, Mail, MapPin, FileText, CreditCard, Hash, User, Building2 } from "lucide-react";

interface ManufacturerDetails {
  dealer_id: string;
  company_logo: string | null;
  user_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  company_name: string;
  owner_name: string;
  address: string;
  gstin: string;
  pan: string;
  tan: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
  created_at: string;
  updated_at: string;
}

interface ManufacturerDetailsModalProps {
  dealerId: string;
  onClose: () => void;
}

const ManufacturerDetailsModal: React.FC<ManufacturerDetailsModalProps> = ({ dealerId, onClose }) => {
  const [manufacturer, setManufacturer] = useState<ManufacturerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManufacturerDetails = async () => {
      try {
        const response = await fetch(`/api/superadmin/manufacturer?dealer_id=${dealerId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setManufacturer(data);
        } else {
          console.error("Failed to fetch manufacturer details");
        }
      } catch (error) {
        console.error("Error fetching manufacturer details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturerDetails();
  }, [dealerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!manufacturer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-red-600">Manufacturer Not Found</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">No manufacturer details found for dealer ID: {dealerId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#295A47] bg-gradient-to-r from-[#295A47] to-green-600 bg-clip-text text-transparent">
              Manufacturer Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dealer ID</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Hash className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.dealer_id}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Name</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.user_name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.phone || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.whatsapp || 'N/A'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.company_name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.owner_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="flex items-start p-3 bg-white border border-gray-300 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                    <span className="text-gray-900">{manufacturer.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.gstin || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.pan || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TAN</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.tan || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.account_holder || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.bank_name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Hash className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.account_number || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.ifsc_code || 'N/A'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                  <div className="flex items-center p-3 bg-white border border-gray-300 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{manufacturer.upi_id || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDetailsModal;
