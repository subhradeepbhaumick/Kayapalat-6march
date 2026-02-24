"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  Filter,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

interface Order {
  id: number;
  order_id: string;
  product_id: number;
  dealer_id: string;
  company_name: string;
  category: string;
  product_name: string;
  product_type: string;
  product_mrp: number;
  discount_percentage: number;
  discount: number;
  gst: string;
  gst_amount: number;
  transportation_cost: number;
  changed_price: number;
  quantity: number;
  discounted_ammount: number;
  transport_exclude: number;
  billed_date: string;
  delivery_date: string;
  booking_status: string;
  client_name: string;
  client_phone: string;
  client_gstin: string;
  action: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
  o_id: string;
  delivery_type: string;
  site_address: string;
  extra_trsnsport_cost: number;
  group_created_at: string;
  commission_percentage: number;
  commission_amount: number;
  product_transport_exclude: boolean;
  company_total_payment: number;
  company_paid: number;
  company_due: number;
  bt_o_id: string;
  bt_dealer_id: string;
  bt_client_name: string;
  bt_client_phone: string;
  bt_client_gstin: string;
  bt_order_list: string;
  bt_payment_type: string;
  bt_total_amount: number;
  bt_advance: number;
  bt_due: number;
  bt_transaction_id: string;
  bt_delivery_type: string;
  bt_site_address: string;
  bt_extra_trsnsport_cost: number;
  bt_status: string;
  bt_company_total_payment: number;
  bt_company_paid: number;
  bt_company_due: number;
  bt_created_at: string;
  bt_updated_at: string;
}

interface ProductDetail {
  product_id: number;
  dealer_id: string;
  category: string;
  product_name: string;
  product_type: string;
  short_description: string;
  about_product: string;
  mrp: number;
  commission_percentage: number;
  commission_amount: number;
  gst_percentage: number;
  gst_amount: number;
  gst_exclude: number;
  transportation_cost: number;
  transport_exclude: number;
  base_mrp: number;
  final_product_cost: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const BusinessBrandShowOrder = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [manufacturer, setManufacturer] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filterClientName, setFilterClientName] = useState<string>("");
  const [filterOrderId, setFilterOrderId] = useState<string>("");
  const [filterDeliveryDate, setFilterDeliveryDate] = useState<string>("");
  const [onlyShowNotSetDelivery, setOnlyShowNotSetDelivery] =
    useState<boolean>(false);
  const [filterBilledDate, setFilterBilledDate] = useState<string>("");
  const [filterAgentId, setFilterAgentId] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageModalTitle, setImageModalTitle] = useState("Product Images");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/businessBrand/orders", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.orders) {
          setOrders(data.orders);
          setManufacturer(data.manufacturer);
          setProductDetails(data.productDetails || []);
        } else {
          toast.error(data.error || "Failed to fetch orders");
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchOrders();
    }
  }, [session, status]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "booked":
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "on the way":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "product issue":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "booked":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "on the way":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "product issue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group orders by o_id
  const groupedOrders = orders.reduce(
    (groups, order) => {
      const key = order.o_id || "no-group";
      if (!groups[key]) {
        groups[key] = {
          o_id: order.o_id,
          client_name: order.bt_client_name || order.client_name,
          client_gstin: order.bt_client_gstin || order.client_gstin,
          // client_phone: order.bt_client_phone || order.client_phone,
          delivery_type: order.bt_delivery_type || order.delivery_type,
          site_address: order.bt_site_address,
          extra_trsnsport_cost:
            order.bt_extra_trsnsport_cost || order.extra_trsnsport_cost,
          group_created_at: order.group_created_at,
          company_total_payment:
            order.bt_company_total_payment || order.company_total_payment,
          company_paid: order.bt_company_paid || order.company_paid,
          company_due: order.bt_company_due || order.company_due,
          products: [],
        };
      }
      groups[key].products.push(order);
      return groups;
    },
    {} as Record<
      string,
      {
        o_id: string;
        client_name: string;
        client_gstin: string;
        // client_phone: string;
        delivery_type: string;
        site_address: string;
        extra_trsnsport_cost: number;
        group_created_at: string;
        company_total_payment: number;
        company_paid: number;
        company_due: number;
        products: Order[];
      }
    >
  );

  // Calculate group totals
  const groupsWithTotals = Object.values(groupedOrders).map((group) => ({
    ...group,
    groupTotal: group.products.reduce((total, order) => {
      const productDetail = productDetails.find(
        (pd) => pd.product_id === order.product_id
      );
      let unitPrice = 0;
      if (productDetail) {
        const mrp = Number(productDetail.mrp) || 0;
        const gstAmount = Number(productDetail.gst_amount) || 0;
        const transportationCost =
          Number(productDetail.transportation_cost) || 0;
        if (productDetail.gst_exclude === 0) {
          unitPrice = mrp + transportationCost;
        } else {
          unitPrice = mrp + gstAmount + transportationCost;
        }
      } else {
        const mrp = Number(order.product_mrp) || 0;
        const gstAmount = Number(order.gst_amount) || 0;
        const transportationCost = Number(order.transportation_cost) || 0;
        unitPrice = mrp + gstAmount + transportationCost;
      }
      return (
        total +
        unitPrice * order.quantity +
        (Number(order.transport_exclude) || 0)
      );
    }, 0),
  }));

  // Get unique client names for filter
  const clientNames = [
    "All",
    ...Array.from(
      new Set(
        groupsWithTotals.map((group) => group.client_name).filter(Boolean)
      )
    ),
  ];

  const filteredGroups = groupsWithTotals.filter((group) => {
    const matchesSearch = group.products.some(
      (order) =>
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus =
      statusFilter === "All" ||
      group.products.some(
        (order) =>
          order.booking_status.toLowerCase() === statusFilter.toLowerCase()
      );
    const matchesClientName =
      filterClientName === "" || group.client_name === filterClientName;
    const matchesOrderId =
      filterOrderId === "" ||
      group.o_id.toLowerCase().includes(filterOrderId.toLowerCase());
    const matchesDeliveryDate = onlyShowNotSetDelivery
      ? group.products.some(
          (order) => order.delivery_date === null || order.delivery_date === ""
        )
      : filterDeliveryDate === "" ||
        group.products.some(
          (order) =>
            order.delivery_date &&
            new Date(order.delivery_date).toISOString().split("T")[0] ===
              filterDeliveryDate
        );
    const matchesBilledDate =
      filterBilledDate === "" ||
      group.products.some(
        (order) =>
          order.billed_date &&
          new Date(order.billed_date).toISOString().split("T")[0] ===
            filterBilledDate
      );
    const matchesAgentId =
      filterAgentId === "" ||
      group.products.some(
        (order) =>
          order.dealer_id &&
          order.dealer_id.toLowerCase().includes(filterAgentId.toLowerCase())
      );
    return (
      matchesSearch &&
      matchesStatus &&
      matchesClientName &&
      matchesOrderId &&
      matchesDeliveryDate &&
      matchesBilledDate &&
      matchesAgentId
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleDeliveryDateChange = async (orderId: string, newDate: string) => {
    try {
      const response = await fetch("/api/businessBrand/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          delivery_date: newDate,
        }),
      });

      if (response.ok) {
        // Update the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId
              ? { ...order, delivery_date: newDate }
              : order
          )
        );
        toast.success("Delivery date updated successfully");
      } else {
        toast.error("Failed to update delivery date");
      }
    } catch (error) {
      console.error("Error updating delivery date:", error);
      toast.error("Failed to update delivery date");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/businessBrand/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
        toast.success("Status updated successfully");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleActionChange = async (orderId: string, newAction: string) => {
    try {
      const response = await fetch("/api/businessBrand/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          action: newAction,
        }),
      });

      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId ? { ...order, action: newAction } : order
          )
        );
        toast.success("Action updated successfully");
      } else {
        toast.error("Failed to update action");
      }
    } catch (error) {
      console.error("Error updating action:", error);
      toast.error("Failed to update action");
    }
  };

  const handleApprovePayment = async (o_id: string, totalPayment: number) => {
    if (!confirm("Are you sure you want to approve this payment?")) return;

    try {
      const response = await fetch("/api/businessBrand/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          o_id,
          company_total_payment: totalPayment,
          company_due: totalPayment,
        }),
      });

      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.o_id === o_id
              ? {
                  ...order,
                  company_total_payment: totalPayment,
                  company_due: totalPayment,
                }
              : order
          )
        );
        toast.success("Payment approved successfully");
      } else {
        toast.error("Failed to approve payment");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment");
    }
  };

  const handleViewImages = async (orderId: string, status: string) => {
    console.log("Frontend: handleViewImages called with orderId:", orderId);
    setShowImageModal(true);
    setLoadingImages(true);
    setProductImages([]);
    setImageModalTitle(status === "Product Issue" ? "Defect Images" : "Product Images");
    try {
      const apiUrl = status === "Product Issue" 
        ? `/api/sales-admin/defective-product-images?order_id=${orderId}`
        : `/api/businessBrand/product-images?order_id=${orderId}`;

      console.log(
        "Frontend: Fetching images from:",
        apiUrl
      );
      const res = await fetch(apiUrl);
      console.log("Frontend: Response status:", res.status);
      const data = await res.json();
      console.log("Frontend: Response data:", data);

      if (res.ok) {
        // Validate that images is an array
        if (Array.isArray(data.images)) {
          console.log(
            "Frontend: Setting product images, count:",
            data.images.length
          );
          setProductImages(data.images);
          if (data.images.length === 0) {
            console.warn(
              "Frontend: No images returned from API for order:",
              orderId
            );
            toast("No images available for this product");
          }
        } else {
          console.error(
            "Frontend: Images is not an array:",
            typeof data.images,
            data.images
          );
          toast.error("Invalid response format from server");
        }
      } else {
        console.log(
          "Frontend: Failed to load images, status:",
          res.status,
          "error:",
          data.error
        );
        const errorMsg = data.error || "Failed to load images";
        toast.error(errorMsg);
        if (data.debug) {
          console.debug("Frontend: Debug info:", data.debug);
        }
      }
    } catch (error) {
      console.error("Frontend: Error loading images:", error);
      toast.error("Error loading images");
    } finally {
      setLoadingImages(false);
    }
  };

  const generateInvoice = (group: any) => {
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
    doc.text(manufacturer?.company_name || "KAYAPALAT", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
      align: "center",
      angle: 30,
    });
    doc.setTextColor(0);

    // =====================
    //  INVOICE HEADER
    // =====================
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 90, 71); // #295A47
    if (manufacturer) {
      doc.text(manufacturer.company_name || "N/A", PAGE_WIDTH / 2, 18, {
        align: "center",
      });
    } else {
      doc.text(group.client_name || "N/A", PAGE_WIDTH / 2, 18, {
        align: "center",
      });
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    doc.setFontSize(9);
    if (manufacturer) {
      doc.text(`GSTIN: ${manufacturer.gstin || "N/A"}`, PAGE_WIDTH / 2, 32, {
        align: "center",
      });
      doc.text(`PAN: ${manufacturer.pan || "N/A"}`, PAGE_WIDTH / 2, 38, {
        align: "center",
      });
      doc.text(`TAN: ${manufacturer.tan || "N/A"}`, PAGE_WIDTH / 2, 44, {
        align: "center",
      });
    } else {
      doc.text(
        `Dealer Username: ${session?.user?.name || "N/A"}`,
        PAGE_WIDTH / 2,
        32,
        { align: "center" }
      );
    }

    // =====================
    // INVOICE NUMBER + DATE
    // =====================
    // const invoiceNumber = `INV-${new Date()
    //   .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
    //   .replace(/[-: ]/g, "")}`;
    const invoiceNumber = `INV-M${group.o_id}`;

    const invoiceDate = new Date().toLocaleString();

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(
      `Invoice No: ${invoiceNumber} | Order ID: ${group.o_id || "N/A"}`,
      14,
      48
    );
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
    doc.text(
      `Total Amount: Rs. ${group.company_total_payment.toLocaleString()}`,
      14,
      68
    );
    doc.text(`Paid: Rs. ${(group.company_paid || 0).toLocaleString()}`, 14, 76);
    doc.text(`Due: Rs. ${(group.company_due || 0).toLocaleString()}`, 14, 84);

    // =====================
    // RIGHT SIDE → INVOICE + BILL TO
    // =====================
    const rightX = PAGE_WIDTH / 2 + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Bill To", rightX, 60);

    doc.setFont("helvetica", "bold");
    doc.text(`Client: ${group.client_name || "N/A"}`, rightX, 68);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `GSTIN: ${
        group.client_gstin && group.client_gstin.trim()
          ? group.client_gstin
          : "N/A"
      }`,
      rightX,
      76
    );

    doc.text(
      `Delivery: ${group.delivery_type ? group.delivery_type : "N/A"}`,
      rightX,
      84
    );
    const siteAddressText = `Site Address: ${
      group.site_address && group.site_address.trim()
        ? group.site_address
        : "N/A"
    }`;
    const siteAddressLines = doc.splitTextToSize(siteAddressText, 80); // 80 is approximate width for right side
    doc.text(siteAddressLines, rightX, 92);
    // =====================
    // PRODUCT TABLE
    // =====================
    const tableColumns = [
      "S.No",
      "Product",
      "Category",
      "Qty",
      "Product Cost",
      "GST",
      "Unit Price",
      "Transport Exclude",
      "Total",
    ];

    const tableRows = group.products.map((item: any, index: number) => {
      const productDetail = productDetails.find(
        (pd) => pd.product_id === item.product_id
      );
      let productCost = 0;
      let gstAmount = 0;
      if (productDetail) {
        const mrp = Number(productDetail.mrp) || 0;
        gstAmount = Number(productDetail.gst_amount) || 0;
        if (productDetail.gst_exclude === 1) {
          productCost = mrp;
        } else {
          productCost = mrp - gstAmount;
        }
      } else {
        productCost = Number(item.product_mrp) || 0;
        gstAmount = Number(item.gst_amount) || 0;
      }
      const unitPrice = (() => {
        if (productDetail) {
          const mrp = Number(productDetail.mrp) || 0;
          const gstAmountCalc = Number(productDetail.gst_amount) || 0;
          const transportationCost =
            Number(productDetail.transportation_cost) || 0;
          return mrp + gstAmountCalc + transportationCost;
        }
        const mrp = Number(item.product_mrp) || 0;
        const gstAmountCalc = Number(item.gst_amount) || 0;
        const transportationCost = Number(item.transportation_cost) || 0;
        return mrp + gstAmountCalc + transportationCost;
      })();
      const itemTotal =
        unitPrice * item.quantity + (Number(item.transport_exclude) || 0);
      return [
        index + 1,
        item.product_name,
        item.category,
        item.quantity,
        formatCurrency(productCost).replace("₹", "Rs. "),
        formatCurrency(gstAmount).replace("₹", "Rs. "),
        formatCurrency(unitPrice).replace("₹", "Rs. "),
        `Rs. ${Number(item.transport_exclude || 0).toLocaleString()}`,
        `Rs. ${itemTotal.toLocaleString()}`,
      ];
    });

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
      didDrawPage: (data) => {
        // PAGE NUMBER
        const pageNo = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${pageNo}`, PAGE_WIDTH - 14, PAGE_HEIGHT - 10, {
          align: "right",
        });
      },
    });

    // =====================
    // SUMMARY TABLE
    // =====================
    const totalProductCost = group.products.reduce((sum: number, item: Order) => {
      const productDetail = productDetails.find(
        (pd) => pd.product_id === item.product_id
      );
      let productCost = 0;
      if (productDetail) {
        const mrp = Number(productDetail.mrp) || 0;
        const gstAmount = Number(productDetail.gst_amount) || 0;
        if (productDetail.gst_exclude === 1) {
          productCost = mrp;
        } else {
          productCost = mrp - gstAmount;
        }
      } else {
        productCost = Number(item.product_mrp) || 0;
      }
      return sum + (productCost * item.quantity);
    }, 0);

    const totalGST = group.products.reduce((sum: number, item: Order) => {
      const productDetail = productDetails.find(
        (pd) => pd.product_id === item.product_id
      );
      let gstAmount = 0;
      if (productDetail) {
        gstAmount = Number(productDetail.gst_amount) || 0;
      } else {
        gstAmount = Number(item.gst_amount) || 0;
      }
      return sum + (gstAmount * item.quantity);
    }, 0);

    autoTable(doc, {
      head: [["Description", "Amount"]],
      body: [
        [
          "Total Product Cost",
          `Rs. ${totalProductCost.toLocaleString()}`,
        ],
        [
          "Total GST",
          `Rs. ${totalGST.toLocaleString()}`,
        ],
        [
          "Extra Transportation Cost",
          `Rs. ${(Number(group.extra_trsnsport_cost) || 0).toLocaleString()}`,
        ],
        ["Final Cost", `Rs. ${group.company_total_payment.toLocaleString()}`],
        ["Paid", `Rs. ${(group.company_paid || 0).toLocaleString()}`],
        ["Due", `Rs. ${(group.company_due || 0).toLocaleString()}`],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#295A47] mb-4"></div>
          <span className="text-lg font-medium text-gray-600">
            Loading orders...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] px-4 sm:px-8 py-6 sm:py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 sm:w-40 sm:h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 sm:w-40 sm:h-40 bg-black opacity-10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  <span className="text-lg sm:text-3xl md:text-4xl">Order Management</span>
                </h1>
                <p className="text-green-100 mt-2 text-sm sm:text-base md:text-lg">
                  Track, manage and fulfill your customer orders efficiently.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 min-w-[120px] sm:min-w-[140px] text-center transform hover:scale-105 transition-transform duration-300">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {filteredGroups.length}
                </p>
                <p className="text-green-100 font-medium text-xs sm:text-sm">
                  Filtered Orders
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">
                      Advanced Filters
                    </h3>
                    <p className="text-sm text-gray-600">
                      Refine your order search with precision
                    </p>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200 text-sm appearance-none cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Booked">Booked</option>
                    <option value="On the way">On the way</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Product Issue">Product Issue</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
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
                    <label className="absolute -top-2 left-4 bg-gray-50 px-1 text-xs font-medium text-gray-600">
                      Delivery Date
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="onlyShowNotSetDelivery"
                      checked={onlyShowNotSetDelivery}
                      onChange={(e) =>
                        setOnlyShowNotSetDelivery(e.target.checked)
                      }
                      className="h-4 w-4 text-[#295A47] focus:ring-[#295A47] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="onlyShowNotSetDelivery"
                      className="text-sm text-gray-700"
                    >
                      Only show orders with no delivery date set
                    </label>
                  </div>
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
                  <label className="absolute -top-2 left-4 bg-gray-50 px-1 text-xs font-medium text-gray-600">
                    Billed Date
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="space-y-8">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all"
                  ? "We couldn't find any orders matching your current filters. Try adjusting your search criteria."
                  : "You haven't received any orders yet."}
              </p>
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div
                key={group.o_id || "no-group"}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Group Header */}
                <div className="bg-gray-50/80 p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#295A47] text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                          GROUP {groupIndex + 1}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 font-mono tracking-tight">
                          #{group.o_id || "NO-ID"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4">
                        {group.client_name && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-24 font-medium text-gray-500">
                              Client:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {group.client_name}
                            </span>
                          </div>
                        )}
                        {/* {group.client_phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="w-24 font-medium text-gray-500">Phone:</span>
                            <span className="font-mono text-gray-700">{group.client_phone}</span>
                          </div>
                        )} */}
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="w-24 font-medium text-red-500">
                            Total Payment:
                          </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(group.groupTotal)}
                          </span>
                        </div>
                        {group.delivery_type && (
                          <div className="flex items-start text-sm text-gray-600 md:col-span-2">
                            <span className="w-24 font-medium text-gray-500 shrink-0">
                              Delivery:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {group.delivery_type}
                            </span>
                          </div>
                        )}
                        {group.delivery_type &&
                          group.delivery_type.toLowerCase() === "site" &&
                          group.site_address && (
                            <div className="flex items-start text-sm text-gray-600 md:col-span-2">
                              <span className="w-24 font-medium text-gray-500 shrink-0">
                                Site Address:
                              </span>
                              <span className="text-gray-700 break-words">
                                {group.site_address}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 min-w-[140px] flex-wrap">
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {group.products.length}
                        </p>
                      </div>
                      {group.extra_trsnsport_cost > 0 && (
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transport
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(group.extra_trsnsport_cost)}
                          </p>
                        </div>
                      )}
                      {group.company_total_payment > 0 ? (
                        <div className="w-full lg:w-auto flex flex-col items-end gap-1 mt-2 lg:mt-0 p-3 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                          <div className="flex items-center gap-3 text-sm justify-between w-full">
                            <span className="text-gray-600 font-medium">
                              Total:
                            </span>
                            <span className="font-bold text-gray-900">
                              {formatCurrency(group.company_total_payment)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm justify-between w-full">
                            <span className="text-gray-600 font-medium">
                              Paid:
                            </span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(group.company_paid || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm justify-between w-full border-t border-green-200 pt-1 mt-1">
                            <span className="text-gray-600 font-medium">
                              Due:
                            </span>
                            <span className="font-bold text-red-600">
                              {formatCurrency(group.company_due || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 self-end">
                            <div className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded uppercase tracking-wide">
                              Approved
                            </div>
                            <button
                              className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded uppercase tracking-wide transition-colors"
                              onClick={() => generateInvoice(group)}
                            >
                              Invoice
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right flex flex-col items-end w-full lg:w-auto">
                          <p className="text-xs text-gray-500 mb-2 max-w-[150px]">
                            To get payment and confirm this deal, click
                            &quot;Approve&quot;
                          </p>
                          <button
                            onClick={() =>
                              handleApprovePayment(
                                group.o_id,
                                group.groupTotal +
                                  (Number(group.extra_trsnsport_cost) || 0)
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm transition-colors text-sm flex items-center gap-2 w-full justify-center lg:w-auto"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products List */}
                <div className="divide-y divide-gray-100">
                  {group.products.map((order, index) => (
                    <div
                      key={order.id}
                      className="p-6 hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-400">
                                  #{index + 1}
                                </span>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                  {order.category}
                                </span>
                              </div>
                              <h4 className="text-xl font-bold text-gray-900 mb-1">
                                {order.product_name}
                              </h4>
                              <p className="text-sm text-gray-500 font-mono">
                                ID: {order.order_id}
                              </p>
                              <button
                                onClick={() => handleViewImages(order.order_id, "regular")}
                                className="flex items-center gap-1 text-sm text-[#295A47] hover:text-[#1e3d32] font-medium mt-2 transition-colors"
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Product Images
                              </button>
                              {order.booking_status === "Product Issue" && (
                                <button
                                  onClick={() => handleViewImages(order.order_id, "Product Issue")}
                                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium mt-2 transition-colors"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  View Defect Images
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                {getStatusIcon(order.booking_status)}
                              </div>
                              <select
                                value={order.booking_status}
                                disabled={order.booking_status === "Product Issue"}
                                onChange={(e) =>
                                  handleStatusChange(
                                    order.order_id,
                                    e.target.value
                                  )
                                }
                                className={`appearance-none pl-10 pr-8 py-1.5 rounded-full text-sm font-bold shadow-sm border-none focus:ring-2 focus:ring-offset-1 cursor-pointer outline-none ${getStatusColor(
                                  order.booking_status
                                )} ${order.booking_status === "Product Issue" ? "opacity-100 cursor-not-allowed" : ""}`}
                              >
                                <option value="Booked">Booked</option>
                                <option value="On the way">On the way</option>
                                {order.booking_status !== "Booked" && order.booking_status !== "On the way" && (
                                  <option value={order.booking_status}>
                                    {order.booking_status}
                                  </option>
                                )}
                              </select>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg
                                  className="w-4 h-4 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                  ></path>
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                                Quantity
                              </p>
                              <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                <span className="font-bold text-gray-900 text-lg">
                                  {order.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                                Unit Price
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-lg">
                                  {(() => {
                                    const productDetail = productDetails.find(
                                      (pd) => pd.product_id === order.product_id
                                    );
                                    if (productDetail) {
                                      const mrp =
                                        Number(productDetail.mrp) || 0;
                                      const gstAmount =
                                        Number(productDetail.gst_amount) || 0;
                                      const transportationCost =
                                        Number(
                                          productDetail.transportation_cost
                                        ) || 0;
                                      if (productDetail.gst_exclude === 0) {
                                        return formatCurrency(
                                          mrp + transportationCost
                                        );
                                      } else {
                                        return formatCurrency(
                                          mrp + gstAmount + transportationCost
                                        );
                                      }
                                    }
                                    const mrp = Number(order.product_mrp) || 0;
                                    const gstAmount =
                                      Number(order.gst_amount) || 0;
                                    const transportationCost =
                                      Number(order.transportation_cost) || 0;
                                    return formatCurrency(
                                      mrp + gstAmount + transportationCost
                                    );
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                                Delivery Date
                              </p>
                              <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-gray-400" />
                                <input
                                  type="date"
                                  value={
                                    order.delivery_date
                                      ? order.delivery_date.split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleDeliveryDateChange(
                                      order.order_id,
                                      e.target.value
                                    )
                                  }
                                  className="bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 w-full cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer / Totals */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Total Amount:
                                </span>
                                <span className="text-2xl font-bold text-[#295A47]">
                                  {(() => {
                                    const productDetail = productDetails.find(
                                      (pd) => pd.product_id === order.product_id
                                    );
                                    let unitPrice = 0;
                                    if (productDetail) {
                                      const mrp =
                                        Number(productDetail.mrp) || 0;
                                      const gstAmount =
                                        Number(productDetail.gst_amount) || 0;
                                      const transportationCost =
                                        Number(
                                          productDetail.transportation_cost
                                        ) || 0;
                                      if (productDetail.gst_exclude === 0) {
                                        unitPrice = mrp + transportationCost;
                                      } else {
                                        unitPrice =
                                          mrp + gstAmount + transportationCost;
                                      }
                                    } else {
                                      const mrp =
                                        Number(order.product_mrp) || 0;
                                      const gstAmount =
                                        Number(order.gst_amount) || 0;
                                      const transportationCost =
                                        Number(order.transportation_cost) || 0;
                                      unitPrice =
                                        mrp + gstAmount + transportationCost;
                                    }
                                    return formatCurrency(
                                      unitPrice * order.quantity +
                                        (Number(order.transport_exclude) || 0)
                                    );
                                  })()}
                                </span>
                              </div>
                              {order.commission_amount > 0 && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                                  <span>
                                    * Includes {order.commission_percentage}%
                                    Kayapalat commission deduction
                                  </span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`action-${order.order_id}`}
                                className="text-sm font-medium text-gray-500 shrink-0"
                              >
                                Action:
                              </label>
                              <input
                                id={`action-${order.order_id}`}
                                type="text"
                                defaultValue={order.action || ""}
                                onBlur={(e) =>
                                  handleActionChange(
                                    order.order_id,
                                    e.target.value
                                  )
                                }
                                className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#295A47]/20 focus:border-[#295A47] transition-all duration-200"
                                placeholder="Enter action..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Product Images Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  {imageModalTitle}
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {loadingImages ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295A47]"></div>
                  </div>
                ) : productImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {productImages.map((img: any, idx: number) => {
                      console.log("Frontend: Rendering image:", img);
                      return (
                        <div
                          key={idx}
                          className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 group cursor-pointer"
                          onClick={() => setFullScreenImage(img.image_url)}
                        >
                          <img
                            src={img.image_url}
                            alt={img.image_alt_text || "Product Image"}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No images available for this product.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Image Modal */}
        {fullScreenImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img
              src={fullScreenImage}
              alt="Full Screen View"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessBrandShowOrder;
