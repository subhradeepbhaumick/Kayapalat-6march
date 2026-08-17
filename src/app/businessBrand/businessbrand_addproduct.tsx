"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BusinessBrandKayapalatChatModal from "./BusinessBrandKayapalatChatModal";
import {
  Package,
  Upload,
  Camera,
  X,
  Plus,
  FileText,
  Tag,
  Image as ImageIcon,
  Calculator,
  MessageCircle,
} from "lucide-react";
interface Product {
  product_id: number;
  dealer_id: number;
  category: string;
  product_name: string;
  short_description: string;
  about_product: string;
  sell_mrp: number;
  mrp: number;
  product_type: string;
  commission_percentage: number;
  commission_amount: number;
  gst_percentage: number;
  gst_exclude: number;
  gst_amount: number;
  transportation_cost: number;
  transport_exclude: number;
  base_mrp: number;
  final_product_cost: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  composite_gst_scheme?: number;
  showroom_stock_number?: number;
  defect_stock?: number;
  images: Array<{
    image_id: number;
    product_id: number;
    dealer_id: number;
    image_url: string;
    image_alt_text: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
  }>;
}
interface BusinessBrandAddProductProps {
  mode?: "add" | "view" | "edit";
  productData?: Product;
  onClose?: () => void;
}
const BusinessBrandAddProduct = ({
  mode = "add",
  productData,
  onClose,
}: BusinessBrandAddProductProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [compositeGstScheme, setCompositeGstScheme] = useState(false);
  const [showKayapalatChat, setShowKayapalatChat] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    productName: "",
    description: "",
    aboutProduct: "",
    mrp: "",
    sellingMrp: "",
    productType: "",
    showroomStockNumber: "",
    defectStock: "0",
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Pricing toggles and calculations
  const [commissionPercentage, setCommissionPercentage] = useState(25); // 15, 20, or 25 for excluded
  const [gstIncluded, setGstIncluded] = useState(true);
  const [gstPercentage, setGstPercentage] = useState("18");
  const [transportationIncluded, setTransportationIncluded] = useState(true);
  const [transportationCost, setTransportationCost] = useState("0");
  const [discussTransportationLater, setDiscussTransportationLater] =
    useState(false);
  const [finalProductCost, setFinalProductCost] = useState(0);
  const [costError, setCostError] = useState<string | null>(null);
  // Fetch manufacturer GST scheme on mount
  useEffect(() => {
    const fetchManufacturerData = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch("/api/businessBrand/profile");
        if (response.ok) {
          const data = await response.json();
          setCompositeGstScheme(data.businessBrand.composite_gst_scheme === 1);
        }
      } catch (error) {
        console.error("Error fetching manufacturer GST scheme:", error);
      }
    };
    fetchManufacturerData();
  }, [session]);
  useEffect(() => {
    if (compositeGstScheme) {
      setGstIncluded(true); // force included
      setGstPercentage("0"); // force 0%
    }
  }, [compositeGstScheme]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([
    "Plywood",
    "Laminate",
    "Light",
    "Hardware",
    "Adhesive",
    "Kitchen Accessories",
    "Tiles",
    "Fixing Materials",
    "Glass",
  ]);
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + productImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const newImages = [...productImages, ...files];
    setProductImages(newImages);
    // Create previews
    const newPreviews = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newPreviews).then((previews) => {
      setImagePreviews((prev) => [...prev, ...previews]);
    });
  };
  const removeImage = async (index: number) => {
    // In edit mode, existing images are URLs (strings), not File objects
    if (mode === 'edit' && productData) {
      const isExistingImage = index < productData.images.length;
      if (isExistingImage) {
        const imageToDelete = productData.images[index];
        // Check if this is the last image
        const totalImages = productData.images.length;
        if (totalImages <= 1) {
          alert('At least one image is required for every product. Please add a new image before deleting this one.');
          return;
        }
        try {
          const res = await fetch('/api/businessBrand/products/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              image_id: imageToDelete.image_id,
              product_id: productData.product_id,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            if (data.error === 'LAST_IMAGE') {
              alert('At least one image is required for every product. Please add a new image before deleting this one.');
            } else {
              alert(data.message || 'Failed to delete image.');
            }
            return;
          }
          // Update local productData images to reflect deletion
          productData.images.splice(index, 1);
          // If deleted was primary (index 0), mark next as primary
          if (index === 0 && productData.images.length > 0) {
            productData.images[0].is_primary = true;
          }
          setImagePreviews((prev) => prev.filter((_, i) => i !== index));
          toast.success('Image deleted successfully');
          return;
        } catch (error) {
          console.error('Error deleting image:', error);
          toast.error('Failed to delete image');
          return;
        }
      }
      // It's a newly added (not yet saved) image — just remove from local state
      const newImageIndex = index - productData.images.length;
      setProductImages((prev) => prev.filter((_, i) => i !== newImageIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    // Add mode — just remove from local state
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };
  // Populate form data when productData is provided
  useEffect(() => {
    if (productData && (mode === "view" || mode === "edit")) {
      setFormData({
        category: productData.category,
        productName: productData.product_name,
        description: productData.short_description,
        aboutProduct: productData.about_product,
        mrp: productData.mrp?.toString() || "",
        sellingMrp: productData.sell_mrp?.toString() || "",
        productType: productData.product_type,
        showroomStockNumber: productData.showroom_stock_number?.toString() || "",
        defectStock: productData.defect_stock?.toString() || "0",
      });
      // Set pricing toggles based on product data
      setCommissionPercentage(productData.commission_percentage);
      setGstIncluded(productData.gst_exclude === 0);
      setGstPercentage(productData.gst_percentage.toString());
      // Handle transportation settings
      if (productData.transport_exclude === 1) {
        setTransportationIncluded(false);
        setDiscussTransportationLater(true);
        setTransportationCost("0"); // Default when discussing later
      } else {
        setTransportationIncluded(productData.transportation_cost === 0);
        setDiscussTransportationLater(false);
        setTransportationCost(productData.transportation_cost.toString());
      }
      // Set existing images
      setImagePreviews(productData.images.map((img) => img.image_url));
    }
  }, [productData, mode]);
  // Calculate final product cost
  useEffect(() => {
    const mrp = parseFloat(formData.mrp) || 0;
    let cost = mrp;
    // Commission calculation (including 18% GST on commission)
    if (commissionPercentage > 0) {
      const commission = mrp * (commissionPercentage / 100);
      const gstOnCommission = commission * 0.18;
      cost = cost + commission + gstOnCommission;
    }
    // GST calculation (on MRP)
    if (!gstIncluded && !compositeGstScheme) {
      const gstRate = parseFloat(gstPercentage) || 0;
      const baseForGST = mrp;
      cost = cost + baseForGST * (gstRate / 100);
    }
    // Transportation cost
    if (!transportationIncluded && !discussTransportationLater) {
      const transportCost = parseFloat(transportationCost) || 0;
      cost = cost + transportCost;
    }
    setFinalProductCost(cost);
  }, [
    formData.mrp,
    commissionPercentage,
    gstIncluded,
    gstPercentage,
    transportationIncluded,
    transportationCost,
    discussTransportationLater,
  ]);
  // Check if final product cost exceeds MRP
  useEffect(() => {
    const sellingMrp = parseFloat(formData.sellingMrp) || 0;
    if (finalProductCost >= sellingMrp && sellingMrp > 0) {
      setCostError(
        "Your Product's Selling Cost should not exceed the MRP. Please reduce the Selling Cost."
      );
    } else {
      setCostError(null);
    }
  }, [finalProductCost, formData.sellingMrp]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (
        !formData.category ||
        !formData.productName ||
        !formData.description ||
        !formData.mrp ||
        !formData.sellingMrp ||
        !formData.productType
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (mode === "add" && productImages.length === 0) {
        toast.error("Please upload at least one product image");
        return;
      }
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      // Add pricing configuration
      formDataToSend.append(
        "commissionPercentage",
        commissionPercentage.toString()
      );
      formDataToSend.append("gstIncluded", gstIncluded.toString());
      formDataToSend.append("gstPercentage", gstPercentage);
      formDataToSend.append(
        "transportationIncluded",
        transportationIncluded.toString()
      );
      formDataToSend.append("transportationCost", transportationCost);
      formDataToSend.append(
        "transportExclude",
        discussTransportationLater ? "1" : "0"
      );
      if (mode === "edit" && productData) {
        formDataToSend.append("productId", productData.product_id.toString());
      }
      // Add images
      productImages.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/businessBrand/products", {
        method,
        body: formDataToSend,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          mode === "edit"
            ? "Product updated successfully"
            : "Product added successfully"
        );
        if (mode === "add") {
          // Show popup to check new product in My Listings
          window.alert(
            'Product added successfully! Check the new product in "My Listings".'
          );
          // Reset form entirely
          setFormData({
            category: "",
            productName: "",
            description: "",
            aboutProduct: "",
            mrp: "",
            sellingMrp: "",
            productType: "",
            showroomStockNumber: "",
            defectStock: "0",
          });
          setProductImages([]);
          setImagePreviews([]);
          setCommissionPercentage(25); // Reset to default
          setGstIncluded(true);
          setGstPercentage("18");
          setTransportationIncluded(true);
          setTransportationCost("0");
          setDiscussTransportationLater(false);
          setFinalProductCost(0);
          setSelectedImage(null);
          setShowNewCategoryInput(false);
          setNewCategory("");
        } else if (onClose) {
          onClose();
        }
      } else {
        toast.error(
          data.error ||
          `Failed to ${mode === "edit" ? "update" : "add"} product`
        );
      }
    } catch (error) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "adding"} product:`,
        error
      );
      toast.error(`Failed to ${mode === "edit" ? "update" : "add"} product`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white p-3 sm:p-4 lg:p-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
            {mode === "edit"
              ? "Edit Product"
              : mode === "view"
                ? "View Product"
                : "Add New Product"}
          </h1>
          <p className="text-center mt-2 opacity-90 text-xs sm:text-sm lg:text-base">
            {mode === "edit"
              ? "Update your product details"
              : mode === "view"
                ? "View product information"
                : "Add your product details to showcase in the marketplace"}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8"
        >
          {/* Product Images Section */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#295A47] mb-3 sm:mb-4 flex items-center">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Product Images
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Product ${index + 1}`}
                    className="max-w-full max-h-32 rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(preview)}
                  />
                  {mode !== "view" && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {imagePreviews.length < 5 && mode !== "view" && (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#295A47] transition-colors">
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload up to 5 images. Recommended: High-quality images, max 5MB
              each
            </p>
          </div>
          {/* Product Information */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-[#295A47] mb-3 sm:mb-4 flex items-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Product Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === "add_new") {
                          setShowNewCategoryInput(true);
                          setFormData((prev) => ({ ...prev, category: "" }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      disabled={mode === "view"}
                      className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent appearance-none bg-white ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="add_new">+ Add New Category</option>
                    </select>
                  </div>
                  {showNewCategoryInput && mode !== "view" && (
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newCategory.trim()) {
                              const trimmedCategory = newCategory.trim();
                              setFormData((prev) => ({
                                ...prev,
                                category: trimmedCategory,
                              }));
                              setCategories((prev) => {
                                if (!prev.includes(trimmedCategory)) {
                                  return [...prev, trimmedCategory];
                                }
                                return prev;
                              });
                              setShowNewCategoryInput(false);
                              setNewCategory("");
                            }
                          }
                        }}
                        placeholder="Enter new category name"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (newCategory.trim()) {
                              const trimmedCategory = newCategory.trim();
                              setFormData((prev) => ({
                                ...prev,
                                category: trimmedCategory,
                              }));
                              setCategories((prev) => {
                                if (!prev.includes(trimmedCategory)) {
                                  return [...prev, trimmedCategory];
                                }
                                return prev;
                              });
                              setShowNewCategoryInput(false);
                              setNewCategory("");
                            }
                          }}
                          className="px-3 py-1 bg-[#295A47] text-white text-sm rounded hover:bg-[#1e3d32] transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategory("");
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 255) {
                        handleInputChange(e);
                      }
                    }}
                    placeholder="Brief description of the product"
                    rows={3}
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/255 characters
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Product
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    name="aboutProduct"
                    value={formData.aboutProduct}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        handleInputChange(e);
                      }
                    }}
                    placeholder="Detailed information about the product"
                    rows={4}
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.aboutProduct.length}/1000 characters
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (Rs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="sellingMrp"
                    value={formData.sellingMrp}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (Rs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    disabled={mode === "view"}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent appearance-none bg-white ${mode === "view" ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="">Select Type</option>
                    <option value="sqft">Sqft</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Pricing Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[#295A47] mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Pricing Configuration
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {/* Commission Selection */}
              <div className="p-3 sm:p-4 bg-white rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Commission Percentage
                </div>
                <div className="flex flex-wrap gap-3 sm:space-x-4">
                  {[15, 20, 25, 30, 35, 40].map((percentage) => (
                    <label key={percentage} className="flex items-center">
                      <input
                        type="radio"
                        name="commissionPercentage"
                        value={percentage}
                        checked={commissionPercentage === percentage}
                        onChange={(e) =>
                          setCommissionPercentage(parseInt(e.target.value))
                        }
                        disabled={mode === "view"}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {percentage}%
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    For discussion about commission(%), contact MR. John Bor -
                    7044400100
                  </p>
                </div>
                {commissionPercentage > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Charge ({commissionPercentage}%) +{" "}
                      {compositeGstScheme ? "handling charges" : "18% GST"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={(() => {
                          const commission =
                            (parseFloat(formData.mrp) || 0) *
                            (commissionPercentage / 100);
                          const gstOnCommission = commission * 0.18;
                          return (commission + gstOnCommission).toFixed(2);
                        })()}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* GST Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg border gap-3 sm:gap-0">
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start space-x-3">
                  <div className="text-sm font-medium text-gray-700">GST</div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${gstIncluded
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                      }`}
                  >
                    {gstIncluded ? "Included" : "Excluded"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGstIncluded(!gstIncluded)}
                  disabled={mode === "view"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gstIncluded ? "bg-green-600" : "bg-orange-600"
                    } ${mode === "view" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gstIncluded ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
              <div
                className={`ml-0 sm:ml-4 p-3 rounded-lg border mt-3 sm:mt-0 ${gstIncluded
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                  }`}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Percentage (%)
                  {compositeGstScheme && (
                    <span className="block text-red-600 text-xs mt-1">
                      Composite GST Scheme is applied
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  placeholder="18"
                  disabled={
                    gstIncluded || mode === "view" || compositeGstScheme
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible ${gstIncluded || mode === "view"
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                    }`}
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={(compositeGstScheme
                        ? 0
                        : gstIncluded
                          ? (((parseFloat(formData.mrp) || 0) * 100) /
                            (100 + (parseFloat(gstPercentage) || 0))) *
                          ((parseFloat(gstPercentage) || 0) / 100)
                          : ((parseFloat(formData.mrp) || 0) *
                            (parseFloat(gstPercentage) || 0)) /
                          100
                      ).toFixed(2)}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>
              {/* Transportation Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg border gap-3 sm:gap-0">
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start space-x-3">
                  <div className="text-sm font-medium text-gray-700">
                    Transportation Cost
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${transportationIncluded
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                      }`}
                  >
                    {transportationIncluded ? "Included" : "Excluded"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTransportationIncluded(!transportationIncluded)
                  }
                  disabled={mode === "view"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${transportationIncluded ? "bg-green-600" : "bg-orange-600"
                    } ${mode === "view" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${transportationIncluded ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
              {!transportationIncluded && (
                <>
                  <div className="ml-0 sm:ml-4 p-3 bg-orange-50 rounded-lg border border-orange-200 mt-3 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="text-sm font-medium text-gray-700">
                        Discuss Transportation Cost later
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDiscussTransportationLater(
                            !discussTransportationLater
                          )
                        }
                        disabled={mode === "view"}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${discussTransportationLater
                          ? "bg-green-600"
                          : "bg-orange-600"
                          } ${mode === "view" ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${discussTransportationLater
                            ? "translate-x-6"
                            : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                  {discussTransportationLater && (
                    <div className="ml-0 sm:ml-4 p-3 bg-red-100 rounded-lg border border-blue-200 mt-3 sm:mt-0">
                      <p className="text-sm text-gray-700">
                        For this product, Client will discuss the Transportation
                        Cost with you.
                      </p>
                    </div>
                  )}
                  {!discussTransportationLater && (
                    <div className="ml-0 sm:ml-4 p-3 bg-orange-50 rounded-lg border border-orange-200 mt-3 sm:mt-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transportation Cost (Rs.)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={transportationCost}
                          onChange={(e) =>
                            setTransportationCost(e.target.value)
                          }
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* Final Product Cost Display */}
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                  <div className="w-full sm:w-auto flex justify-between sm:block items-center">
                    <div className="text-sm font-medium text-gray-700 sm:mb-1">
                      Selling Price(You will get from Kayapalat)
                    </div>
                    <div className="text-lg font-bold text-[#295A47]">
                      ₹
                      {compositeGstScheme
                        ? parseFloat(formData.mrp || "0").toFixed(2)
                        : gstIncluded
                          ? parseFloat(formData.mrp || "0").toFixed(2)
                          : (
                            parseFloat(formData.mrp || "0") +
                            ((parseFloat(formData.mrp) || 0) *
                              (parseFloat(gstPercentage) || 0)) /
                            100 +
                            (!transportationIncluded &&
                              !discussTransportationLater
                              ? parseFloat(transportationCost) || 0
                              : 0)
                          ).toFixed(2)}
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-right flex justify-between sm:block items-center mt-2 sm:mt-0">
                    <div className="text-sm font-medium text-gray-700 sm:mb-1">
                      Final Product Cost(Kayapalat will sell to customer)
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{finalProductCost}
                    </div>
                  </div>
                </div>
                {costError && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">
                      {costError}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Stock Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-[#295A47] mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Stock Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stock in Showroom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock in Showroom
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      name="showroomStockNumber"
                      value={formData.showroomStockNumber || ""}
                      onChange={handleInputChange}
                      placeholder="Enter showroom stock"
                      min="0"
                      disabled={mode === "view"}
                      className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${mode === "view"
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                        }`}
                    />
                  </div>
                </div>
                {/* Defect Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Defect Stock
                    <span className="text-xs text-gray-500 ml-1">
                      (Kayapalat will update)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.defectStock || "0"}
                      disabled
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

              </div>
              {/* CENTER BUTTON */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowKayapalatChat(true)}
                  className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with KAYAPALAT
                </button>
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-center pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={loading || mode === "view" || !!costError}
              className="w-full sm:w-auto bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white px-8 sm:px-12 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-[#1e3d32] hover:to-[#0f2a1f] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {mode === "edit"
                    ? "Updating Product..."
                    : "Adding Product..."}
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {mode === "edit"
                    ? "Update Product"
                    : mode === "view"
                      ? "View Only"
                      : "Add Product"}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged product image"
              className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white rounded-full w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-black transition-colors touch-manipulation"
            >
              <X className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}
      {/* Kayapalat Chat Modal */}
      <BusinessBrandKayapalatChatModal
        isOpen={showKayapalatChat}
        onClose={() => setShowKayapalatChat(false)}
        productId={productData?.product_id || 0}
      />
    </div>
  );
};
export default BusinessBrandAddProduct;
