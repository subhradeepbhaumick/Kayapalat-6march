"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  MessageCircle,
  Mail,
  Building,
  MapPin,
  FileText,
  CreditCard,
  Hash,
  UserCheck,
  Upload,
  Camera,
  RotateCcw,
} from "lucide-react";

type InitialData = {
  userId: string;
  userName: string;
  phone: string;
  whatsapp: string;
  email: string;
  companyName: string;
  address: string;
  gstin: string;
  pan: string;
  tan: string;
  ownerName: string;
  companyLogo: string | null;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  qrImage: string | null;
  isComposite: boolean;
};

const BusinessBrandProfile = () => {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    phone: "",
    whatsapp: "",
    email: "",
    companyName: "",
    address: "",
    gstin: "",
    pan: "",
    tan: "",
    ownerName: "",
    companyLogo: null as File | null,
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    qrImage: null as File | string | null,
    isComposite: false,
  });
  const [initialData, setInitialData] = useState<InitialData>({
    userId: "",
    userName: "",
    phone: "",
    whatsapp: "",
    email: "",
    companyName: "",
    address: "",
    gstin: "",
    pan: "",
    tan: "",
    ownerName: "",
    companyLogo: null,
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    qrImage: null,
    isComposite: false,
  });
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const isBankSaved =
    !!initialData.accountHolderName ||
    !!initialData.bankName ||
    !!initialData.accountNumber ||
    !!initialData.ifscCode ||
    !!initialData.upiId;

  useEffect(() => {
    if (status === "loading") return;

    // Fetch existing profile data
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/businessBrand/profile", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.businessBrand) {
          const profileData = {
            userId: data.businessBrand.user_id || "",
            userName: data.businessBrand.name || "",
            phone: data.businessBrand.phone || "",
            whatsapp: data.businessBrand.whatsapp || "",
            email: data.businessBrand.email || "",
            companyName: data.businessBrand.company_name || "",
            address: data.businessBrand.address || "",
            gstin: data.businessBrand.gstin || "",
            pan: data.businessBrand.pan || "",
            tan: data.businessBrand.tan || "",
            ownerName: data.businessBrand.owner_name || "",
            companyLogo: null,
            accountHolderName: data.businessBrand.account_holder_name || "",
            bankName: data.businessBrand.bank_name || "",
            accountNumber: data.businessBrand.account_number || "",
            ifscCode: data.businessBrand.ifsc_code || "",
            upiId: data.businessBrand.upi_id || "",
            qrImage: data.businessBrand.qr_image || null,
            isComposite: data.businessBrand.composite_gst_scheme === 1,
          };
          setFormData((prevData) => ({
            ...prevData,
            ...profileData,
          }));
          setFormData(profileData);
          setInitialData({
            ...profileData,
            companyLogo: data.businessBrand.company_logo || null,
            accountHolderName: data.businessBrand.account_holder_name || "",
            bankName: data.businessBrand.bank_name || "",
            accountNumber: data.businessBrand.account_number || "",
            ifscCode: data.businessBrand.ifsc_code || "",
            upiId: data.businessBrand.upi_id || "",
            qrImage: data.businessBrand.qr_image || null,
          });
          if (data.businessBrand.company_logo) {
            setLogoPreview(data.businessBrand.company_logo);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, status]);
  const handleToggleComposite = () => {
    // 🚫 Prevent turning OFF once enabled
    if (formData.isComposite) {
      toast.error(
        "Once you opt for Composite GST Scheme, you cannot switch back to Regular GST Scheme."
      );
      return;
    }

    // ✅ Allow only turning ON
    setFormData((prev) => ({
      ...prev,
      isComposite: true,
    }));
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      companyLogo: file,
    }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          if (typeof value === "boolean") {
            formDataToSend.append(key, value ? "true" : "false");
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      const res = await fetch("/api/businessBrand/profile", {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully");
        // Update initialData after successful update
        setInitialData({
          ...formData,
          companyLogo: logoPreview,
          qrImage:
            typeof formData.qrImage === "string"
              ? formData.qrImage
              : formData.qrImage
              ? URL.createObjectURL(formData.qrImage)
              : null,
        });
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ...initialData,
      companyLogo: null,
    });
    setLogoPreview(initialData.companyLogo ? initialData.companyLogo : null);
    toast.success("Form reset to current database values");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            Company Profile
          </h1>
          <p className="text-sm sm:text-base text-center mt-2 opacity-90">
            Manage your business information and settings
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-8 space-y-6 sm:space-y-8"
        >
          {/* Company Logo Section */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Company Logo
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#295A47] file:text-white hover:file:bg-[#1e3d32]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    // disabled
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    disabled
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Tax Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GSTIN
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TAN
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="tan"
                    value={formData.tan}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                <div className="w-full border rounded-2xl p-4 sm:p-5 shadow-sm bg-white space-y-4 sm:space-y-5">
                  {/* 🔹 Title */}
                  <p className="text-sm sm:text-base font-semibold text-gray-800">
                    GST Scheme Selection
                  </p>

                  {/* 🔹 Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* 🔹 Composite GST */}
                    <div
                      onClick={() => {
                        if (formData.isComposite) {
                          toast.error("Once enabled, you cannot switch back.");
                          return;
                        }
                        setFormData({ ...formData, isComposite: true });
                      }}
                      className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all
        ${
          formData.isComposite
            ? "border-green-500 bg-green-50"
            : "hover:bg-gray-50"
        }`}
                    >
                      <div className="pr-3">
                        <p className="text-sm font-medium text-gray-700">
                          Composite GST Scheme
                        </p>
                        <p className="text-xs text-gray-500">
                          Bill of Supply (No GST)
                        </p>
                      </div>

                      {/* Toggle */}
                      <div
                        className={`w-12 sm:w-14 h-6 sm:h-7 flex items-center rounded-full p-1 transition-all duration-300
          ${formData.isComposite ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <div
                          className={`bg-white w-4 sm:w-5 h-4 sm:h-5 rounded-full shadow-md transform transition-all duration-300
            ${
              formData.isComposite
                ? "translate-x-6 sm:translate-x-7"
                : "translate-x-0"
            }`}
                        />
                      </div>
                    </div>

                    {/* 🔹 Regular GST */}
                    <div
                      onClick={() => {
                        if (formData.isComposite) {
                          toast.error("You cannot switch back to Regular GST.");
                          return;
                        }
                        setFormData({ ...formData, isComposite: false });
                      }}
                      className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all
        ${
          !formData.isComposite
            ? "border-green-500 bg-green-50"
            : "hover:bg-gray-50"
        }`}
                    >
                      <div className="pr-3">
                        <p className="text-sm font-medium text-gray-700">
                          Regular GST Scheme
                        </p>
                        <p className="text-xs text-gray-500">
                          Tax Invoice (GST applied)
                        </p>
                      </div>

                      {/* Toggle */}
                      <div
                        className={`w-12 sm:w-14 h-6 sm:h-7 flex items-center rounded-full p-1 transition-all duration-300
          ${!formData.isComposite ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <div
                          className={`bg-white w-4 sm:w-5 h-4 sm:h-5 rounded-full shadow-md transform transition-all duration-300
            ${
              !formData.isComposite
                ? "translate-x-6 sm:translate-x-7"
                : "translate-x-0"
            }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 🔹 Warning */}
                  {formData.isComposite && (
                    <p className="text-xs sm:text-sm text-red-500">
                      Once Composite GST Scheme is enabled, you cannot switch
                      back to Regular GST Scheme.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Bank Details<span className="text-red-500">*</span>
            </h2>
            {isBankSaved && (
              <p className="text-sm text-red-500 mb-4">
                ⚠️ Once bank details are submitted, they cannot be edited.
                Please contact support for changes.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    disabled={isBankSaved}
                    required={!isBankSaved}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    disabled={isBankSaved}
                    required={!isBankSaved}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    disabled={isBankSaved}
                    required={!isBankSaved}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    disabled={isBankSaved}
                    required={!isBankSaved}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    disabled={isBankSaved}
                    required={!isBankSaved}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  />
                </div>
              </div>
              {/* 🔹 QR Code Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI QR Code<span className="text-red-500">*</span>
                </label>

                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-[#295A47] transition-colors duration-200 bg-white">
                  {/* 🔹 Preview */}
                  {formData.qrImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={
                          typeof formData.qrImage === "string"
                            ? formData.qrImage
                            : URL.createObjectURL(formData.qrImage)
                        }
                        alt="QR Preview"
                        className="w-32 h-32 object-contain rounded-lg border"
                      />

                      {!isBankSaved && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, qrImage: null }))
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove QR
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* 🔹 Upload Icon */}
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg
                          className="w-10 h-10 mb-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 12l-4-4m0 0l-4 4m4-4v12"
                          />
                        </svg>

                        <p className="text-sm font-medium">Upload QR Code</p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG (Max 2MB)
                        </p>
                      </div>

                      {/* 🔹 File Input */}
                      {!isBankSaved && (
                        <input
                          type="file"
                          accept="image/*"
                          required={!isBankSaved}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                qrImage: file,
                              }));
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      )}
                    </>
                  )}
                </div>

                {/* 🔹 Warning */}
                {isBankSaved && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    QR Code is locked after submission
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit and Reset Buttons */}
          <div className="flex flex-col sm:flex-row justify-center pt-6 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto bg-gray-500 text-white px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-[#1e3d32] hover:to-[#0f2a1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessBrandProfile;
