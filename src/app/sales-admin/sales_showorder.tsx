"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Eye,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Download,
  Search,
  Filter,
  Upload,
  Trash2,
} from "lucide-react";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

interface Order {
  order_id: string;
  o_id: string;
  agent_id?: string;
  product_id: number;
  dealer_id: number;
  company_name: string;
  category: string;
  product_name: string;
  final_product_cost: number;
  product_mrp: number;
  discount_percentage: number;
  discount: number;
  quantity: number;
  discounted_ammount: number;
  transport_exclude: number;
  changed_price: number;
  billed_date: string;
  delivery_date: string | null;
  action: string;
  booking_status: string;
  created_at: string;
  updated_at: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  client_name?: string;
  client_gstin?: string;
  client_phone?: string;
  payment_type?: string;
  transaction_id?: string;
  delivery_type?: string;
  site_address?: string;
  extra_transport_cost?: number;
  total_amount?: number;
  advance?: number;
  due?: number;
  gst: string;
  gst_amount: number;
  images: Array<{
    image_id: number;
    image_url: string;
    image_alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

interface BoughtProduct {
  o_id: string;
  dealer_id: number;
  client_name: string;
  client_phone: string;
  client_gstin: string;
  order_list: string;
  payment_type: string;
  total_amount: number;
  advance: number;
  due: number;
  transaction_id: string;
  delivery_type: string;
  site_address: string;
  extra_trsnsport_cost: number;
  status: string;
  company_total_payment: number;
  company_paid: number;
  company_due: number;
  created_at: string;
  updated_at: string;
}

interface DefectiveImage {
  id: number;
  order_id: string;
  product_id: number;
  image_url: string;
  image_alt_text: string;
  is_primary: number;
  sort_order: number;
  created_at: string;
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [boughtProducts, setBoughtProducts] = useState<BoughtProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setshowOrderModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterOrderId, setFilterOrderId] = useState<string>("");
  const [filterClientName, setFilterClientName] = useState<string>("");
  const [filterDeliveryDate, setFilterDeliveryDate] = useState<string>("");
  const [onlyShowNotSetDelivery, setOnlyShowNotSetDelivery] = useState<boolean>(false);
  const [filterBilledDate, setFilterBilledDate] = useState<string>("");
  const [filterAgentId, setFilterAgentId] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defectiveImages, setDefectiveImages] = useState<DefectiveImage[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<DefectiveImage | null>(null);

  const handleDeleteDefectiveImage = async (imageId: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return false;
    }

    try {
      const response = await fetch('/api/sales-admin/defective-product-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId }),
      });

      if (response.ok) {
        toast.success("Image deleted successfully");
        setDefectiveImages(prev => prev.filter(img => img.id !== imageId));
        return true;
      } else {
        const errorData = await response.json();
        toast.error(`Delete failed: ${errorData.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("An error occurred while deleting the image.");
      return false;
    }
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const session = await getSession();
        if (!session) {
          toast.error("Please log in to view orders");
          setLoading(false);
          return;
        }
        setSession(session);

        const res = await fetch("/api/sales-admin/orders", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          if (Array.isArray(data)) {
            setOrders(data);
          } else if (data && Array.isArray(data.orders)) {
            setOrders(data.orders);
            setBoughtProducts(data.boughtProducts || []);
          } else {
            setOrders([]);
            setBoughtProducts([]);
          }
        } else if (res.status === 401) {
          toast.error("Unauthorized access. Please log in again.");
        } else {
          toast.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const fetchDefectiveImages = async (orderId: string) => {
    try {
      const res = await fetch(`/api/sales-admin/defective-product-images?order_id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setDefectiveImages(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching defective images:", error);
    }
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedImageIndex(0); // Reset to first image when opening modal
    setshowOrderModal(true);
    if (order.order_id) {
      fetchDefectiveImages(order.order_id);
    }
  };

  const closeModal = () => {
    setshowOrderModal(false);
    setSelectedOrder(null);
    setDefectiveImages([]);
  };

  const openFullImageModal = () => {
    setShowFullImageModal(true);
  };

  const closeFullImageModal = () => {
    setShowFullImageModal(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/sales-admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          booking_status: newStatus,
        }),
      });

      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId
              ? { ...order, booking_status: newStatus }
              : order
          )
        );
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleActionChange = async (orderId: string, newAction: string) => {
    // Prevent unnecessary API calls if the value hasn't changed
    const originalAction = orders.find(o => o.order_id === orderId)?.action || '';
    if (newAction === originalAction) {
      return;
    }

    // Get the current booking_status for the order
    const currentOrder = orders.find(o => o.order_id === orderId);
    if (!currentOrder) {
      toast.error('Order not found');
      return;
    }

    try {
      const response = await fetch('/api/sales-admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          booking_status: currentOrder.booking_status,
          action: newAction,
        }),
      });

      if (response.ok) {
        // Update the main orders list
        const updatedOrders = orders.map((order) =>
          order.order_id === orderId
            ? { ...order, action: newAction }
            : order
        );
        setOrders(updatedOrders);

        // Also update the selectedOrder in the modal to reflect the change instantly
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, action: newAction });
        }

        toast.success('Action updated successfully');
      } else {
        toast.error('Failed to update action');
      }
    } catch (error) {
      console.error('Error updating action:', error);
      toast.error('Failed to update action');
    }
  };

  const handleProofUpload = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    if (!selectedOrder) {
      toast.error("No order selected.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('order_id', selectedOrder.order_id);
    formData.append('product_id', String(selectedOrder.product_id));
    uploadedImages.forEach(file => {
      formData.append('images', file);
    });

    console.log("Attempting to upload damage proof...");
    console.log("Order ID:", selectedOrder.order_id);
    console.log("Number of images:", uploadedImages.length);
    console.log("FormData created.");

    try {
      const response = await fetch('/api/sales-admin/defective-product-images', {
        method: 'POST',
        body: formData,
      });
      console.log("Upload response status:", response.status);

      if (response.ok) {
        toast.success("Proof uploaded successfully");
        setShowUploadModal(false);
        setUploadedImages([]);
        // Optionally, refetch orders or update state to show that proof has been submitted
        if (selectedOrder.order_id) {
          fetchDefectiveImages(selectedOrder.order_id);
        }
      } else {
        const errorData = await response.json();
        toast.error(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error uploading proof:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "booked":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "booked":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "on the way":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "product issue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const generateInvoice = (order: Order) => {
    // Find all orders with the same o_id
    const groupOrders = orders.filter(o => o.o_id === order.o_id);

    // Find the corresponding bought product for GSTIN
    const boughtProduct = boughtProducts.find(bp => bp.o_id === order.o_id);

    const doc = new jsPDF();

    // =====================
    // COLORS & CONSTANTS
    // =====================
    const PAGE_WIDTH = doc.internal.pageSize.width;
    const PAGE_HEIGHT = doc.internal.pageSize.height;

    // =====================
    // WATERMARK (ON TOP)
    // =====================
    doc.setFontSize(60);
    doc.setTextColor(250);
    doc.setFont("helvetica", "bold");
    doc.text("KAYAPALAT", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
      align: "center",
      angle: 30,
    });
    doc.setTextColor(0);

    // =====================
    // HEADER
    // =====================
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("KAYAPALAT", PAGE_WIDTH / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Professional Interior Solutions", PAGE_WIDTH / 2, 26, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.text(
      "1160 Chadpur Poleghat, Mouza 80, Sonarpur, Kolkata - 700145, WB, India",
      PAGE_WIDTH / 2,
      32,
      { align: "center" }
    );

    doc.text("Phone/WhatsApp: 602-602-602-6", PAGE_WIDTH / 2, 38, {
      align: "center",
    });

    // =====================
    // INVOICE NUMBER + DATE (SAME LINE)
    // =====================
    const invoiceNumber = `INV-${order.o_id}`;

    const invoiceDate = new Date().toLocaleString();

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Invoice No: ${invoiceNumber}`, 14, 48);
    doc.text(`Date: ${invoiceDate}`, PAGE_WIDTH - 14, 48, {
      align: "right",
    });

    // =====================
    // PARTITION LINE
    // =====================
    doc.setDrawColor(180);
    doc.line(PAGE_WIDTH / 2, 55, PAGE_WIDTH / 2, 105);

    // =====================
    // LEFT SIDE → PAYMENT DETAILS
    // =====================
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 14, 60);

    doc.setFont("helvetica", "normal");
    doc.text(`Payment Type: ${order.payment_type || "N/A"}`, 14, 68);

    if (order.payment_type === "UPI") {
      doc.text(`Transaction ID: ${order.transaction_id || "N/A"}`, 14, 76);
    }

    const totalAmount = groupOrders.reduce((sum, groupOrder) => sum + (Number(groupOrder.discounted_ammount || 0) ), 0) + (Number(order.extra_transport_cost) || 0);

    doc.text(
      `Total Amount: Rs. ${totalAmount.toLocaleString()}`,
      14,
      84
    );

    doc.text(
      `Advance: Rs. ${(order.advance || 0).toLocaleString()}`,
      14,
      92
    );
    doc.text(`Due: Rs. ${(order.due || 0).toLocaleString()}`, 14, 100);

    // =====================
    // RIGHT SIDE → INVOICE + BILL TO
    // =====================
    const rightX = PAGE_WIDTH / 2 + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Bill To", rightX, 60);

    doc.setFont("helvetica", "normal");
    doc.text(`${boughtProduct?.client_name || order.client_name || "N/A"}`, rightX, 68);

    doc.text(`Phone: ${boughtProduct?.client_phone || order.client_phone || "N/A"}`, rightX, 76);
    doc.text(`GSTIN: ${boughtProduct?.client_gstin || order.client_gstin || "N/A"}`, rightX, 84);

    doc.text(`Representative: ${session?.user?.name || "N/A"}`, rightX, 92);

    // =====================
    // PRODUCT TABLE
    // =====================
    const tableColumns = [
      "S.No",
      "Product",
      "Company",
      "Unit Price",
      "Discount",
      "GST",
      "Quantity",
      "Transport Cost",
      "Total",
    ];

    const tableRows = groupOrders.map((groupOrder, index) => [
      index + 1,
      groupOrder.product_name,
      groupOrder.company_name,
      `Rs. ${groupOrder.product_mrp.toLocaleString()}`,
      groupOrder.discount_percentage > 0 ? `${groupOrder.discount_percentage}% - ${groupOrder.discount.toLocaleString()}` : "-",
      groupOrder.gst ? `${groupOrder.gst}% - ${groupOrder.gst_amount.toLocaleString()}` : "-",
      groupOrder.quantity,
      `Rs. ${(Number(groupOrder.transport_exclude || 0)).toLocaleString()}`,
      `Rs. ${(Number(groupOrder.discounted_ammount || 0)).toLocaleString()}`,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 115,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 90, 71], // #295A47,
        textColor: 255,
        fontStyle: "bold",
      },
      didDrawPage: (data: any) => {
        // PAGE NUMBER
        const pageNo = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Page ${pageNo}`,
          PAGE_WIDTH - 14,
          PAGE_HEIGHT - 10,
          { align: "right" }
        );
      },
    });

    // =====================
    // SUMMARY TABLE
    // =====================
    const totalProductCost = groupOrders.reduce((sum, groupOrder) => sum + groupOrder.product_mrp * groupOrder.quantity, 0);
    const totalDiscount = groupOrders.reduce((sum, groupOrder) => sum + groupOrder.discount * groupOrder.quantity, 0);
    const totalGSTAmount = groupOrders.reduce((sum, groupOrder) => sum + groupOrder.gst_amount * groupOrder.quantity, 0);

    autoTable(doc, {
      head: [["Description", "Amount"]],
      body: [
        [
          "Total Product Cost",
          `Rs. ${totalProductCost.toLocaleString()}`,
        ],
        [
          "Total Discount",
          `Rs. ${totalDiscount.toLocaleString()}`,
        ],
        [
          "Total GST",
          `Rs. ${totalGSTAmount.toLocaleString()}`,
        ],
        [
          "Extra Transportation Cost",
          `Rs. ${(order.extra_transport_cost || 0).toLocaleString()}`,
        ],
        ["Final Cost", `Rs. ${totalAmount.toLocaleString()}`],
        ["Advance", `Rs. ${(order.advance || 0).toLocaleString()}`],
        ["Due", `Rs. ${(order.due || 0).toLocaleString()}`],
      ],
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 90, 71], // #295A47,
        textColor: 255,
        fontStyle: "bold",
      },
    });

    // =====================
    // FOOTER (ALWAYS AFTER TABLE)
    // =====================
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", PAGE_WIDTH / 2, finalY, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.text(
      "Terms & Conditions: All sales are final. Warranty as per manufacturer terms.",
      PAGE_WIDTH / 2,
      finalY + 8,
      { align: "center" }
    );

    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      PAGE_WIDTH / 2,
      finalY + 16,
      { align: "center" }
    );

    // Save the PDF
    doc.save(`Invoice_${invoiceNumber}.pdf`);
    toast.success("Invoice downloaded");
  };

  // Filter orders based on booking_status, client_name, order_id, delivery_date, and billed_date
  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    const matchesStatus =
      filterStatus === "All" || order.booking_status === filterStatus;
    const matchesClientName =
      filterClientName === "" ||
      (order.client_name && order.client_name.toLowerCase().includes(filterClientName.toLowerCase()));
    const matchesOrderId =
      filterOrderId === "" ||
      order.o_id.toLowerCase().includes(filterOrderId.toLowerCase());
    const matchesDeliveryDate =
      onlyShowNotSetDelivery
        ? order.delivery_date === null || order.delivery_date === ""
        : filterDeliveryDate === "" ||
          (order.delivery_date && new Date(order.delivery_date).toISOString().split('T')[0] === filterDeliveryDate);
    const matchesBilledDate =
      filterBilledDate === "" ||
      (order.billed_date && new Date(order.billed_date).toISOString().split('T')[0] === filterBilledDate);
    const matchesAgentId =
      filterAgentId === "" ||
      (order.agent_id && order.agent_id.toLowerCase().includes(filterAgentId.toLowerCase()));
    return matchesStatus && matchesClientName && matchesOrderId && matchesDeliveryDate && matchesBilledDate && matchesAgentId;
  }) : [];

  // Get unique statuses for filter
  const statuses = [
    "All",
    ...Array.from(new Set((Array.isArray(orders) ? orders : []).map((order) => order.booking_status))),
  ];

  // Get unique delivery dates for filter
  const deliveryDates = [
    "All",
    "Not Set",
    ...Array.from(new Set((Array.isArray(orders) ? orders : []).filter(order => order.delivery_date).map((order) => new Date(order.delivery_date!).toISOString().split('T')[0]))),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] px-6 md:px-8 py-8 md:py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 md:w-40 md:h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 md:w-40 md:h-40 bg-black opacity-10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                Order Management
              </h1>
              <p className="text-green-100 mt-2 text-sm md:text-base lg:text-lg">Track, manage and fulfill your customer orders efficiently.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[120px] md:min-w-[140px] text-center transform hover:scale-105 transition-transform duration-300">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{filteredOrders.length}</p>
              <p className="text-green-100 font-medium text-xs md:text-sm">Filtered Orders</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-100 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-gradient-to-tr from-green-200 to-blue-200 rounded-full opacity-20 blur-xl"></div>

          <div className="relative z-10 space-y-6">
            {/* Filters Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-[#295A47] to-[#1e3d32] rounded-lg shadow-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">Advanced Filters</h3>
                  <p className="text-sm text-gray-600">Refine your order search with precision</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Active Filters</span>
                </div>
              </div>
            </div>

            {/* Search Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                </div>
                <input
                  type="text"
                  value={filterClientName}
                  onChange={(e) => setFilterClientName(e.target.value)}
                  placeholder="Search by Client Name"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                </div>
                <input
                  type="text"
                  value={filterOrderId}
                  onChange={(e) => setFilterOrderId(e.target.value)}
                  placeholder="Search by Order ID"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm appearance-none cursor-pointer"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Status" : status}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={filterDeliveryDate}
                    onChange={(e) => setFilterDeliveryDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm"
                  />
                  <label className="absolute -top-2 left-4 bg-gray-50 px-1 text-xs font-medium text-gray-600">Delivery Date</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="onlyShowNotSetDelivery"
                    checked={onlyShowNotSetDelivery}
                    onChange={(e) => setOnlyShowNotSetDelivery(e.target.checked)}
                    className="h-4 w-4 text-[#295A47] focus:ring-[#295A47] border-gray-300 rounded"
                  />
                  <label htmlFor="onlyShowNotSetDelivery" className="text-sm text-gray-700">
                    Only show orders with no delivery date set
                  </label>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                </div>
                <input
                  type="text"
                  value={filterAgentId}
                  onChange={(e) => setFilterAgentId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm"
                />
                <label className="absolute -top-2 left-4 bg-gray-50 px-1 text-xs font-medium text-gray-600">RepresentativeID</label>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-[#295A47] transition-colors" />
                </div>
                <input
                  type="date"
                  value={filterBilledDate}
                  onChange={(e) => setFilterBilledDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm"
                />
                <label className="absolute -top-2 left-4 bg-gray-50 px-1 text-xs font-medium text-gray-600">Billed Date</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredOrders.map((order: Order) => (
          <div
            key={order.order_id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border"
          >
            {/* Order Header */}
            <div className="bg-[#D7E7D0] px-3 md:px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="relative inline-flex items-center w-full sm:w-auto">
                  {/* Status Icon */}
                  <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {getStatusIcon(order.booking_status)}
                  </div>

                  {/* Dropdown */}
                  <select
                    value={order.booking_status}
                    onChange={(e) =>
                      handleStatusChange(order.order_id, e.target.value)
                    }
                    className={`
      w-full sm:w-auto
      pl-7 md:pl-9 pr-6 md:pr-8 py-2
      text-xs sm:text-sm
      font-semibold
      rounded-full
      appearance-none
      cursor-pointer
      focus:outline-none
      focus:ring-2 focus:ring-offset-1
      ${getStatusColor(order.booking_status)}
    `}
                  >
                    <option value="Booked">Booked</option>
                    <option value="On the way">On the way</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Product Issue">Product Issue</option>
                  </select>

                  {/* Arrow */}
                  <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-3.5 h-3.5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <span className="text-xs text-gray-600">#{order.o_id}</span>
              </div>
            </div>

            {/* Product Image */}
            <div className="relative h-40 md:h-48 bg-gray-100">
              {order.images && order.images.length > 0 ? (
                <img
                  src={
                    order.images.find((img) => img.is_primary)?.image_url ||
                    order.images[0].image_url
                  }
                  alt={order.product_name}
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "/placeholder_person.jpg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Order Info */}
            <div className="p-3 md:p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base md:text-lg text-[#295A47] line-clamp-2">
                  {order.product_name}
                </h3>
                <span className="text-xs bg-[#D7E7D0] text-[#295A47] px-2 py-1 rounded-full whitespace-nowrap">
                  {order.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Order ID:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {order.o_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Representative ID:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {order.agent_id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Quantity:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {order.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Total Amount:</span>
                  <span className="font-bold text-green-600 text-xs md:text-sm">
                    ₹
                    {(
                      order.discounted_ammount ||
                      order.final_product_cost * order.quantity ||
                      0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Client Name:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {order.client_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Order Date:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-500">Delivery Date:</span>
                  <span className="font-medium text-gray-700 text-xs md:text-sm">
                    {order.delivery_date
                      ? new Date(order.delivery_date).toLocaleDateString()
                      : "Not Set"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Truck className="w-3 h-3" />
                  <span className="truncate">{order.company_name}</span>
                </div>
              </div>

              <button
                onClick={() => generateInvoice(order)}
                className="w-full text-[#295A47] hover:text-[#1e3d32] hover:underline py-2 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 mb-2"
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                Download Invoice
              </button>

              <button
                onClick={() => openOrderModal(order)}
                className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2 text-xs md:text-sm"
              >
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-500">
            {filterStatus === "All"
              ? "You haven't got any orders yet."
              : `No orders with status "${filterStatus}".`}
          </p>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#295A47]">
                    {selectedOrder.product_name}
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">Order {selectedOrder.o_id}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                  {/* Main Image Display */}
                  <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedOrder.images && selectedOrder.images.length > 0 ? (
                      <img
                        src={
                          selectedOrder.images[selectedImageIndex]?.image_url ||
                          selectedOrder.images[0].image_url
                        }
                        alt={selectedOrder.product_name}
                        className="w-full h-full object-cover"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>
                        ) => {
                          e.currentTarget.src = "/placeholder_person.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Image Gallery */}
                  {selectedOrder.images && selectedOrder.images.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-[#295A47]">
                        Product Images
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedOrder.images
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((image, index) => (
                            <div
                              key={image.image_id}
                              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                                index === selectedImageIndex
                                  ? "ring-2 ring-[#295A47]"
                                  : ""
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <img
                                src={image.image_url}
                                alt={
                                  image.image_alt_text ||
                                  selectedOrder.product_name
                                }
                                className="w-full h-full object-cover"
                                onError={(
                                  e: React.SyntheticEvent<HTMLImageElement>
                                ) => {
                                  e.currentTarget.src =
                                    "/placeholder_person.jpg";
                                }}
                              />
                              {image.is_primary && (
                                <div className="absolute top-1 right-1 bg-[#295A47] text-white text-xs px-1 py-0.5 rounded">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Defective Images Display in Order Modal */}
                  {defectiveImages.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Reported Damage Images
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {defectiveImages.map((img) => (
                          <div key={img.id} className="relative group w-20 h-20 border border-red-200 rounded-lg overflow-hidden">
                            <img
                              src={img.image_url}
                              alt={img.image_alt_text || "Defective product"}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setFullScreenImage(img)}
                              onError={(e) => { e.currentTarget.src = "/placeholder_person.jpg"; }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDefectiveImage(img.id);
                              }}
                              className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                              title="Delete image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      {getStatusIcon(selectedOrder.booking_status)}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          selectedOrder.booking_status
                        )}`}
                      >
                        {selectedOrder.booking_status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">
                          {selectedOrder.o_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedOrder.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Billed Date:</span>
                        <span className="font-medium">
                          {selectedOrder.billed_date
                            ? new Date(
                                selectedOrder.billed_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {selectedOrder.delivery_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Date:</span>
                          <span className="font-medium">
                            {new Date(
                              selectedOrder.delivery_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Damage Proof Button */}
                  {selectedOrder.booking_status === "Product Issue" && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Damage Proof</span>
                    </button>
                  )}

                  {/* Product Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Product Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product ID:</span>
                        <span className="font-medium">
                          #{selectedOrder.product_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">
                          {selectedOrder.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">
                          {selectedOrder.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-medium">
                          ₹
                          {(
                            selectedOrder.final_product_cost || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      {selectedOrder.discount_percentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-red-600">
                            -{selectedOrder.discount_percentage}%
                          </span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <div className="flex items-center space-x-2">
                          {selectedOrder.discount_percentage > 0 && (
                            <span className="text-red-500 line-through text-sm">
                              ₹
                              {(
                                selectedOrder.final_product_cost *
                                selectedOrder.quantity
                              ).toLocaleString()}
                            </span>
                          )}
                          <span className="text-green-600">
                            ₹
                            {(
                              selectedOrder.discounted_ammount || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Client Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client Name:</span>
                        <span className="font-medium">
                          {selectedOrder.client_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client Phone:</span>
                        <span className="font-medium">
                          {selectedOrder.client_phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GSTIN:</span>
                        <span className="font-medium">
                          {selectedOrder.client_gstin || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Type:</span>
                        <span className="font-medium">
                          {selectedOrder.payment_type || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium">
                          {selectedOrder.transaction_id || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Type:</span>
                        <span className="font-medium">
                          {selectedOrder.delivery_type || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Site Address:</span>
                        <span className="font-medium">
                          {selectedOrder.site_address || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Extra Transport Cost:
                        </span>
                        <span className="font-medium">
                          ₹
                          {(
                            selectedOrder.extra_transport_cost || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manufacturer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      Manufacturer Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-[#295A47]" />
                        <span className="font-medium">
                          {selectedOrder.company_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-[#295A47]" />
                        <span className="font-medium">
                          {selectedOrder.address}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-[#295A47]" />
                        <span className="font-medium">
                          {selectedOrder.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-[#295A47]" />
                        <span className="font-medium">
                          {selectedOrder.whatsapp}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-[#295A47]" />
                        <span className="font-medium">
                          {selectedOrder.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Action
                    </h3>
                    <input
                      type="text"
                      defaultValue={selectedOrder.action || ''}
                      onBlur={(e) => handleActionChange(selectedOrder.order_id, e.target.value)}
                      className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200"
                      placeholder="Enter action..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Damage Proof Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#295A47]">Upload Damage Proof</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedImages([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#295A47] transition-colors bg-gray-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedImages(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="damage-proof-upload"
                />
                <label
                  htmlFor="damage-proof-upload"
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">Click to upload images</span>
                  <span className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, JPEG</span>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files ({uploadedImages.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden shadow-sm group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== index))}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previously Uploaded Defective Images */}
              {defectiveImages.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700">Previously Uploaded Proofs:</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {defectiveImages.map((img) => (
                      <div key={img.id} className="relative group w-16 h-16 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <img
                          src={img.image_url}
                          alt={img.image_alt_text || "Defective proof"}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setFullScreenImage(img)}
                          onError={(e) => { e.currentTarget.src = "/placeholder_person.jpg"; }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDefectiveImage(img.id);
                          }}
                          className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                          title="Delete image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedImages([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProofUpload}
                  disabled={isUploading}
                  className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition-colors font-medium text-sm flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal for Defective Images */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const success = await handleDeleteDefectiveImage(fullScreenImage.id);
              if (success) {
                setFullScreenImage(null);
              }
            }}
            className="absolute top-4 left-4 text-white hover:text-red-400 transition-colors bg-black/50 rounded-full p-2"
            title="Delete Image"
          >
            <Trash2 className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <img
            src={fullScreenImage.image_url}
            alt="Full Screen View"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Full Image Modal */}
      {showFullImageModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={closeFullImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={
                selectedOrder.images[selectedImageIndex]?.image_url ||
                selectedOrder.images[0].image_url
              }
              alt={selectedOrder.product_name}
              className="max-w-full max-h-full object-contain"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "/placeholder_person.jpg";
              }}
            />
            <button
              onClick={closeFullImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Navigation */}
            {selectedOrder.images && selectedOrder.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) =>
                      prev > 0 ? prev - 1 : selectedOrder.images.length - 1
                    );
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) =>
                      prev < selectedOrder.images.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {selectedOrder.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;