"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Eye,
  Plus,
  Minus,
  Calculator,
  Truck,
  X,
  Image as ImageIcon,
  Star,
  MapPin,
  Phone,
  Mail,
  Check,
  Edit,
  Tag,
  MessageCircle,
} from "lucide-react";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import CartModal from "./cart";
import { Product } from "@/types/product";
import { CartItem } from "@/types/cart";
import BusinessBrandKayapalatChatModal from "../businessBrand/BusinessBrandKayapalatChatModal";
interface OrderItem {
  order_id: string;
  product_id: number;
  product_name: string;
  company_name: string;
  image_url: string;
  price_per_unit: number;
  quantity: number;
  client_name?: string;
  agent_id: string;
}

interface OrderItemsState {
  orderItems: OrderItem[];
}

const ProductsTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [extraTransportCost, setExtraTransportCost] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [productNameSearch, setProductNameSearch] = useState<string>("");
  const [companyNameSearch, setCompanyNameSearch] = useState<string>("All");

  const [pendingClientNames, setPendingClientNames] = useState<{
    [key: string]: string;
  }>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [buyFormData, setBuyFormData] = useState({
    agentId: "",
    clientName: "",
    clientPhone: "",
    client_gstin: "",
    paymentType: "cash", // 'cash' or 'UPI'
    transactionId: "",
    totalAmount: 0,
    advanceAmount: 0,
    dueAmount: 0,
    orderIds: [] as string[],
    siteNameAddress: "",
    deliveryType: "Kayapalat" as "Kayapalat" | "Site",
    extraTransportationCost: 0,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    mrp: "",
    sell_mrp: "",
    productType: "",
    commissionPercentage: 25,
    gstIncluded: true,
    gstPercentage: "18",
    transportationIncluded: true,
    transportationCost: "0",
    discussTransportationLater: false,
    final_product_cost: "",
  });
  const [editFinalProductCost, setEditFinalProductCost] = useState(0);
  const [editCostError, setEditCostError] = useState<string | null>(null);
  const selectedCart = cart.filter((item) =>
    selectedOrderIds.includes(item.order_id)
  );

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  // Get unique company names
  const companyNames = [
    "All",
    ...Array.from(new Set(products.map((product) => product.company_name))),
  ];

  // Filter products based on selected category, product name, and company name
  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "All" || product.category === selectedCategory;
    const nameMatch =
      !productNameSearch ||
      product.product_name
        .toLowerCase()
        .includes(productNameSearch.toLowerCase());
    const companyMatch =
      companyNameSearch === "All" || product.company_name === companyNameSearch;
    return categoryMatch && nameMatch && companyMatch;
  });

  // Get unique companies from cart
  const companies = Array.from(new Set(cart.map((item) => item.company_name)));

  // Get unique agents from cart
  const agents = Array.from(new Set(cart.map((item) => item.agent_id)));

  // Filter cart based on selected company and agent
  const filteredCart = (
    selectedCompany === "ALL"
      ? cart
      : cart.filter((item) => item.company_name === selectedCompany)
  ).filter(
    (item) => selectedAgent === "ALL" || item.agent_id === selectedAgent
  );

  const fetchCart = async (session: Session | null) => {
    try {
      const cartRes = await fetch("/api/sales-admin/buy-product", {
        credentials: "include",
      });
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        if (cartData.cart) {
          const filteredCartData = cartData.cart.filter(
            (item: any) => item.agent_id === session?.user?.id
          );
          const cartItems = filteredCartData.map(
            (item: any): CartItem => ({
              ...item,
              quantity: Number(item.quantity),
              calculatedPrice: Number(item.discounted_amount),
              discountPercentage: Number(item.discount_percentage) || 0,
              order_id: item.order_id, // SINGLE
              images: item.images || [],
              mrp: Number(item.mrp),
              commission_percentage: Number(item.commission_percentage),
              commission_amount: Number(item.commission_amount),
              gst_percentage: Number(item.gst_percentage),
              gst_amount: Number(item.gst_amount),
              transportation_cost: Number(item.transportation_cost),
              base_mrp: Number(item.base_mrp),
              final_product_cost: Number(item.final_product_cost),
              client_name: item.client_name || "",
              agent_id: item.agent_id,
              changed_price: item.changed_price,
            })
          );

          setCart(cartItems);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to fetch cart");
    }
  };

  const handleClientNameChange = async (
    orderIds: string[],
    clientName: string
  ) => {
    try {
      const response = await fetch("/api/sales-admin/buy-product", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderIds, // backend supports array here ONLY
          client_name: clientName,
        }),
      });

      if (response.ok) {
        await fetchCart(session); // Refetch cart to update display
        toast.success("Client name updated successfully");
      } else {
        toast.error("Failed to update client name");
      }
    } catch (error) {
      console.error("Error updating client name:", error);
      toast.error("Failed to update client name");
    }
  };

  // Fetch products and cart
  useEffect(() => {
    const fetchProductsAndCart = async () => {
      try {
        // Check if user is authenticated
        const session = await getSession();
        if (!session) {
          toast.error("Please log in to view products");
          setLoading(false);
          return;
        }
        setSession(session);

        // Fetch products
        const productsRes = await fetch("/api/sales-admin/products", {
          credentials: "include",
        });
        if (productsRes.ok) {
          try {
            const productsData = await productsRes.json();
            setProducts(productsData);
          } catch (error) {
            console.error("Error parsing products JSON:", error);
            toast.error("Failed to parse products data");
          }
        } else if (productsRes.status === 401) {
          toast.error("Unauthorized access. Please log in again.");
        } else {
          toast.error("Failed to fetch products");
        }

        // Fetch cart items
        await fetchCart(session);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCart();
  }, []);

  // Calculate edit final product cost
  useEffect(() => {
    const mrp = parseFloat(editFormData.mrp) || 0;
    let cost = mrp;

    // Commission calculation (including 18% GST on commission)
    if (editFormData.commissionPercentage > 0) {
      const commission = mrp * (editFormData.commissionPercentage / 100);
      const gstOnCommission = commission * 0.18;
      cost = cost + commission + gstOnCommission;
    }

    // GST calculation (on MRP)
    if (!editFormData.gstIncluded) {
      const gstRate = parseFloat(editFormData.gstPercentage) || 0;
      const baseForGST = mrp;
      cost = cost + baseForGST * (gstRate / 100);
    }

    // Transportation cost
    if (
      !editFormData.transportationIncluded &&
      !editFormData.discussTransportationLater
    ) {
      const transportCost = parseFloat(editFormData.transportationCost) || 0;
      cost = cost + transportCost;
    }

    setEditFinalProductCost(cost);
  }, [
    editFormData.mrp,
    editFormData.commissionPercentage,
    editFormData.gstIncluded,
    editFormData.gstPercentage,
    editFormData.transportationIncluded,
    editFormData.transportationCost,
    editFormData.discussTransportationLater,
  ]);

  // Check if final product cost exceeds MRP
  useEffect(() => {
    const sellingMrp = parseFloat(editFormData.sell_mrp) || 0;
    if (editFinalProductCost >= sellingMrp && sellingMrp > 0) {
      setEditCostError(
        "Your Product's Final Cost should not exceed the MRP. Please reduce the Final Cost."
      );
    } else {
      setEditCostError(null);
    }
  }, [editFinalProductCost, editFormData.sell_mrp]);
  const handlePlus = async (item: CartItem) => {
    try {
      const newQuantity = item.quantity + 1;
      const newCalculatedPrice = Number(
        (
          Number(item.changed_price) * newQuantity +
          (Number(item.transport_exclude) || 0)
        ).toFixed(2)
      );
      const response = await fetch("/api/sales-admin/buy-product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_id: item.order_id,
          quantity: newQuantity,
          discounted_amount: newCalculatedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to increase quantity");
      }

      setCart((prev) =>
        prev.map((ci) =>
          ci.order_id === item.order_id
            ? {
              ...ci,
              quantity: newQuantity,
              calculatedPrice: newCalculatedPrice,
            }
            : ci
        )
      );

      toast.success("Quantity increased");
    } catch (error) {
      console.error(error);
      toast.error("Failed to increase quantity");
    }
  };
  const handleMinus = async (item: CartItem) => {
    const newQuantity = item.quantity - 1;
    if (newQuantity > 0) {
      try {
        const newCalculatedPrice = Number(
          (
            Number(item.changed_price) * newQuantity +
            (Number(item.transport_exclude) || 0)
          ).toFixed(2)
        );
        const response = await fetch("/api/sales-admin/buy-product", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            order_id: item.order_id,
            quantity: newQuantity,
            discounted_amount: newCalculatedPrice,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to decrease quantity");
        }

        setCart((prev) =>
          prev.map((ci) =>
            ci.order_id === item.order_id
              ? {
                ...ci,
                quantity: newQuantity,
                calculatedPrice: newCalculatedPrice,
              }
              : ci
          )
        );

        toast.success("Quantity decreased");
      } catch (error) {
        console.error(error);
        toast.error("Failed to decrease quantity");
      }
    } else {
      await removeFromCart(item.order_id);
    }
  };
  const removeFromCart = async (orderId: string) => {
    try {
      const response = await fetch("/api/sales-admin/buy-product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from cart");
      }

      setCart((prev) => prev.filter((item) => item.order_id !== orderId));
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));

      toast.success("Removed from cart");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove from cart");
    }
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentImageIndex(0);
    setDiscountPercentage(0);
    setExtraTransportCost(0);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setCurrentImageIndex(0);
    setDiscountPercentage(0);
  };

  const calculatePrice = (product: Product, qty: number) => {
    return product.final_product_cost * qty;
  };

  const calculateDiscountedPrice = (
    product: Product,
    qty: number,
    discountPercent: number
  ) => {
    const basePrice = product.final_product_cost * qty;
    return basePrice - (basePrice * discountPercent) / 100;
  };

  const addToCart = async () => {
    if (!selectedProduct) return;

    try {
      // Calculate values
      const finalProductCost = Number(selectedProduct.final_product_cost || 0);
      const gstPercentage = Number(selectedProduct.gst_percentage || 0);
      const transportationCost = Number(
        selectedProduct.transportation_cost || 0
      );

      const productMrp = (finalProductCost * 100) / (100 + gstPercentage);
      const discountAmount = (productMrp * discountPercentage) / 100;
      const gstCalculated = (productMrp * gstPercentage) / 100;
      const finalPricePerUnit = productMrp - discountAmount + gstCalculated;
      const totalPrice =
        finalPricePerUnit * quantity +
        (selectedProduct.transport_exclude === 1 ? extraTransportCost : 0);

      // Insert into buy_product table
      const response = await fetch("/api/sales-admin/buy-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          dealer_id: selectedProduct.dealer_id,
          agent_id: session?.user?.id,
          company_name: selectedProduct.company_name,
          category: selectedProduct.category,
          product_name: selectedProduct.product_name,
          product_type: selectedProduct.product_type || "unit",
          product_mrp: productMrp,
          discount_percentage: discountPercentage,
          discount: discountAmount,
          gst: gstPercentage,
          gst_amount: gstCalculated,
          gst_exclude: selectedProduct.gst_exclude,
          quantity,
          discounted_ammount: totalPrice,
          changed_price: finalPricePerUnit,
          transport_exclude: extraTransportCost,
          billed_date: new Date().toISOString().split("T")[0], // current date
          delivery_date: null, // can be set later
          action: "Added to cart",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to buy_product table");
      }

      await fetchCart(session);

      toast.success("Added to cart successfully!");
      closeModal();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const getTotalAmount = () =>
    cart
      .filter((item) => selectedOrderIds.includes(item.order_id))
      .reduce((sum, item) => sum + item.calculatedPrice, 0);

  const getTotalCommission = () =>
    cart
      .filter((item) => selectedOrderIds.includes(item.order_id))
      .reduce((sum, item) => sum + item.commission_amount * item.quantity, 0);

  const getTotalGST = () =>
    cart
      .filter((item) => selectedOrderIds.includes(item.order_id))
      .reduce((sum, item) => sum + item.gst_amount * item.quantity, 0);

  const getTotalTransportation = () =>
    cart
      .filter((item) => selectedOrderIds.includes(item.order_id))
      .reduce((sum, item) => sum + item.transportation_cost * item.quantity, 0);

  const completePurchase = async () => {
    // Validation
    if (!buyFormData.clientName.trim()) {
      toast.error("Client name is required.");
      return;
    }
    if (!buyFormData.clientPhone.trim()) {
      toast.error("Client phone is required.");
      return;
    }
    if (
      buyFormData.paymentType === "UPI" &&
      !buyFormData.transactionId.trim()
    ) {
      toast.error("Transaction ID is required for UPI payment.");
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error("No items selected. Please select items to buy.");
      return;
    }
    if (!session) {
      toast.error("Session not available. Please log in again.");
      return;
    }

    try {
      // Complete the purchase with all form data
      const response = await fetch("/api/sales-admin/complete-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          client_name: buyFormData.clientName.trim(),
          client_phone: buyFormData.clientPhone.trim(),
          client_gstin: buyFormData.client_gstin.trim(),
          order_ids: selectedOrderIds,
          payment_type: buyFormData.paymentType,
          transaction_id:
            buyFormData.paymentType === "UPI"
              ? buyFormData.transactionId.trim()
              : null,
          total_amount: buyFormData.totalAmount,
          advance_amount: buyFormData.advanceAmount,
          due_amount: buyFormData.dueAmount,
          siteNameAddress: buyFormData.siteNameAddress,
          deliveryType: buyFormData.deliveryType,
          extraTransportationCost: buyFormData.extraTransportationCost,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete purchase");
      }

      const result = await response.json();
      console.log("Purchase completed:", result);
      const orderId = result.o_id || "N/A";

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
      const invoiceNumber = `INV-O-${new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
        .replace(/[-: ]/g, "")}`;

      const invoiceDate = new Date().toLocaleString();

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Invoice No: INV-${orderId} `, 14, 48);
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
      doc.text(`Payment Type: ${buyFormData.paymentType}`, 14, 68);

      if (buyFormData.paymentType === "UPI") {
        doc.text(`Transaction ID: ${buyFormData.transactionId}`, 14, 76);
      }

      doc.text(
        `Total Amount: Rs. ${buyFormData.totalAmount.toLocaleString()}`,
        14,
        84
      );
      doc.text(
        `Advance: Rs. ${buyFormData.advanceAmount.toLocaleString()}`,
        14,
        92
      );
      doc.text(`Due: Rs. ${buyFormData.dueAmount.toLocaleString()}`, 14, 100);

      // =====================
      // RIGHT SIDE → INVOICE + BILL TO
      // =====================
      const rightX = PAGE_WIDTH / 2 + 8;

      doc.setFont("helvetica", "bold");
      doc.text("Bill To", rightX, 60);

      doc.setFont("helvetica", "normal");
      doc.text(`${buyFormData.clientName || "N/A"}`, rightX, 68);

      doc.text(`Phone: ${buyFormData.clientPhone || "N/A"}`, rightX, 76);
      doc.text(`GSTIN: ${buyFormData.client_gstin || "N/A"}`, rightX, 84);

      doc.text(`Representative: ${session.user?.name || "N/A"}`, rightX, 92);

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

      const tableRows = selectedCart.map((item, index) => [
        index + 1,
        item.product_name,
        item.company_name,
        `Rs. ${item.product_mrp.toLocaleString()}`,
        item.discount_percentage > 0
          ? `${item.discount_percentage}% - ${item.discount.toLocaleString()}`
          : "-",
        `${item.gst}% - ${item.gst_amount.toLocaleString()}`,
        item.quantity,
        `Rs. ${item.transport_exclude.toLocaleString()}`,
        `Rs. ${item.calculatedPrice.toLocaleString()}`,
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
      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: [
          [
            "Extra Transportation Cost",
            `Rs. ${buyFormData.extraTransportationCost.toLocaleString()}`,
          ],
          ["Final Cost", `Rs. ${buyFormData.totalAmount.toLocaleString()}`],
          ["Advance", `Rs. ${buyFormData.advanceAmount.toLocaleString()}`],
          ["Due", `Rs. ${buyFormData.dueAmount.toLocaleString()}`],
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
      doc.save(`Invoice-${orderId}.pdf`);

      toast.success("Purchase completed successfully! Invoice generated.");
      // Remove selected items from cart
      setCart((prev) =>
        prev.filter((item) => !selectedOrderIds.includes(item.order_id))
      );
      setSelectedOrderIds([]);
      setShowBuyModal(false);
      setShowCart(false);
      // Reset form data
      setBuyFormData({
        agentId: "",
        clientName: "",
        clientPhone: "",
        client_gstin: "",
        paymentType: "cash",
        transactionId: "",
        totalAmount: 0,
        advanceAmount: 0,
        dueAmount: 0,
        orderIds: [],
        siteNameAddress: "",
        deliveryType: "Kayapalat",
        extraTransportationCost: 0,
      });
    } catch (error) {
      console.error("Error completing purchase:", error);
      toast.error("Failed to complete purchase. Please try again.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const commission = (parseFloat(editFormData.mrp) * editFormData.commissionPercentage) / 100;
      const gstOnCommission = commission * 0.18;
      const commission_amount = commission + gstOnCommission;
      const gst_amount =
        (parseFloat(editFormData.mrp) *
          parseFloat(editFormData.gstPercentage)) /
        100;

      const updateData: any = {
        product_id: selectedProduct.product_id,
        sell_mrp: parseFloat(editFormData.sell_mrp),
        base_mrp: parseFloat(editFormData.mrp),
        mrp: parseFloat(editFormData.mrp),
        commission_percentage: editFormData.commissionPercentage,
        commission_amount: commission_amount,
        gst_percentage: parseFloat(editFormData.gstPercentage),
        gst_amount: gst_amount,
        transport_exclude: editFormData.discussTransportationLater ? 1 : 0,
        final_product_cost: editFinalProductCost,
      };

      // Only include transportation_cost if the input field is visible
      if (!editFormData.discussTransportationLater) {
        updateData.transportation_cost = parseFloat(editFormData.transportationCost);
      }

      const response = await fetch("/api/sales-admin/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success("Product updated successfully");
        setShowEditModal(false);
        // Refresh products
        const productsRes = await fetch("/api/sales-admin/products", {
          credentials: "include",
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
          // Update selected product if it's the one being edited
          const updatedProduct = productsData.find(
            (p: Product) => p.product_id === selectedProduct.product_id
          );
          if (updatedProduct) {
            setSelectedProduct(updatedProduct);
          }
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const generateInvoice = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error("No items selected. Please select items to buy.");
      return;
    }

    if (!session) {
      toast.error("Session not available. Please log in again.");
      return;
    }

    try {
      // Filter cart to only selected items

      // First, place the order by updating selected cart items to 'Ordered'
      const orderIds = selectedCart.map((item) => item.order_id);

      if (orderIds.length > 0) {
        const response = await fetch("/api/sales-admin/place-order", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ order_id: orderIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to place order");
        }

        const result = await response.json();
        console.log("Order placed:", result);
      }

      // Generate PDF invoice
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("KAYAPALAT", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Professional Interior Solutions", 105, 30, { align: "center" });
      doc.text("Invoice", 105, 40, { align: "center" });

      // Invoice Details
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceDate = new Date().toLocaleDateString();

      doc.setFontSize(10);
      doc.text(`Invoice Number: ${invoiceNumber}`, 20, 55);
      doc.text(`Date: ${invoiceDate}`, 20, 65);

      // Bill To Details
      doc.text("Bill To:", 20, 80);
      doc.text("KAYAPALAT", 20, 90);
      doc.text(
        "179-A, Survey Park Rd, Purba Diganta, Santoshpur, Kolkata - 700075, WB, India",
        20,
        100
      );
      doc.text("Phone/WhatsApp: 60260-26026", 20, 110);
      doc.text(`Sales Admin: ${session.user?.name || "N/A"}`, 20, 120);

      // Shipping Address
      doc.text("Ship To:", 20, 140);
      doc.text("KAYAPALAT MAIN BRANCH", 20, 150);
      doc.text(
        "179-A, Survey Park Rd, Purba Diganta, Santoshpur, Kolkata - 700075, WB, India",
        20,
        160
      );
      doc.text("Contact for more Detail: 60260-26026", 20, 170);

      // Table Headers
      const tableColumns = [
        "S.No",
        "Product",
        "Company",
        "Qty",
        "Unit Price",
        "Discount",
        "Total",
      ];
      const tableRows = selectedCart.map((item: CartItem, index: number) => [
        index + 1,
        item.product_name,
        item.company_name,
        item.quantity,
        `₹${item.final_product_cost.toLocaleString()}`,
        item.discountPercentage > 0 ? `${item.discountPercentage}%` : "-",
        `₹${item.calculatedPrice.toLocaleString()}`,
      ]);

      // Calculate totals
      const subtotal = getTotalAmount();
      const totalGST = getTotalGST();
      const totalCommission = getTotalCommission();
      const totalTransportation = getTotalTransportation();
      const grandTotal =
        subtotal - totalGST - totalCommission - totalTransportation;

      // Add table
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
          fillColor: [41, 90, 71], // #295A47
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [247, 247, 247],
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for your business!", 105, pageHeight - 30, {
        align: "center",
      });
      doc.text(
        "Terms & Conditions: All sales are final. Warranty as per manufacturer terms.",
        105,
        pageHeight - 20,
        { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        105,
        pageHeight - 10,
        { align: "center" }
      );

      // Save the PDF
      doc.save(`Invoice_${invoiceNumber}.pdf`);

      toast.success("Order placed successfully! Invoice generated.");
      // Remove selected items from cart after invoice generation
      setCart((prev) =>
        prev.filter((item) => !selectedOrderIds.includes(item.order_id))
      );
      setSelectedOrderIds([]);
      setShowCart(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice. Please try again.");
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47]">
            Products
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Browse and purchase products from manufacturers
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-[#295A47] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center space-x-2 text-sm sm:text-base"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Cart ({cart.length})</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        <div>
          <label
            htmlFor="category-select"
            className="block font-medium text-[#295A47] text-sm mb-1"
          >
            Category
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedCategory(e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="product-name-search"
            className="block font-medium text-[#295A47] text-sm mb-1"
          >
            Search by Product Name:
          </label>
          <input
            id="product-name-search"
            type="text"
            value={productNameSearch}
            onChange={(e) => setProductNameSearch(e.target.value)}
            placeholder="Enter product name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="company-name-search"
            className="block font-medium text-[#295A47] text-sm mb-1"
          >
            Search by Company Name:
          </label>
          <select
            id="company-name-search"
            value={companyNameSearch}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCompanyNameSearch(e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm"
          >
            {companyNames.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product: Product) => (
          <div
            key={product.product_id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={
                    product.images.find((img) => img.is_primary)?.image_url ||
                    product.images[0].image_url
                  }
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    console.error(
                      "Image failed to load:",
                      e.currentTarget.src,
                      "for product:",
                      product.product_name
                    );
                    e.currentTarget.src = "/placeholder_person.jpg";
                  }}
                  onLoad={() => {
                    console.log(
                      "Image loaded successfully for product:",
                      product.product_name
                    );
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {product.is_active ? "In Stock" : "Out Of Stock"}
                </span>
                {product.transport_exclude === 1 && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Transport Excluded
                  </span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-[#295A47] line-clamp-2">
                  {product.product_name}
                </h3>
                <span className="text-xs bg-[#D7E7D0] text-[#295A47] px-2 py-1 rounded-full">
                  {product.category}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.short_description}
              </p>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Product ID:</span>
                  <span className="font-medium text-gray-700">
                    #{product.product_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Final Cost:</span>
                  <span className="font-bold text-green-600">
                    ₹
                    {(() => {
                      const finalProductCost = Number(
                        product.final_product_cost || 0
                      );
                      const transportationCost = Number(
                        product.transportation_cost || 0
                      );
                      return finalProductCost.toFixed(2);
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Truck className="w-3 h-3" />
                  <span>{product.company_name}</span>
                </div>
              </div>

              <button
                onClick={() => openProductModal(product)}
                className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Products Available
          </h3>
          <p className="text-gray-500">
            Products will appear here once manufacturers add them to the
            marketplace.
          </p>
        </div>
      )}

      {/* Product Detail Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#295A47]">
                  {selectedProduct.product_name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="relative h-64 sm:h-96 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProduct.images &&
                      selectedProduct.images.length > 0 ? (
                      <>
                        <img
                          src={
                            selectedProduct.images[currentImageIndex]?.image_url
                          }
                          alt={selectedProduct.product_name}
                          className="w-full h-full object-cover"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement>
                          ) => {
                            e.currentTarget.src = "/placeholder_person.jpg";
                          }}
                        />
                        <button
                          onClick={() => setShowFullImage(true)}
                          className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                          title="Expand Image"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {selectedProduct.images &&
                    selectedProduct.images.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto">
                        {selectedProduct.images.map(
                          (image: Product["images"][0], index: number) => (
                            <button
                              key={image.image_id}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 ${currentImageIndex === index
                                ? "border-[#295A47]"
                                : "border-gray-200"
                                }`}
                            >
                              <img
                                src={image.image_url}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(
                                  e: React.SyntheticEvent<HTMLImageElement>
                                ) => {
                                  e.currentTarget.src =
                                    "/placeholder_person.jpg";
                                }}
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-[#D7E7D0] text-[#295A47] rounded-full text-sm font-medium">
                        {selectedProduct.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedProduct.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {selectedProduct.is_active
                          ? "In Stock"
                          : "Out Of Stock"}
                      </span>
                      {selectedProduct.transport_exclude === 1 && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          Transport Excluded
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">
                      {selectedProduct.short_description}
                    </p>
                    <p className="text-gray-700">
                      {selectedProduct.about_product}
                    </p>
                  </div>

                  {/* Manufacturer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-[#295A47] mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Manufacturer Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">
                          {selectedProduct.company_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedProduct.manufacturer_address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedProduct.manufacturer_phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedProduct.manufacturer_email}</span>
                      </div>
                    </div>
                  </div>
                  {/* SHOWROOM STOCK */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <h3 className="font-semibold text-[#295A47] flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Showroom Stock
                      </h3>
                      <button
                        onClick={() => setChatModalOpen(true)}
                        className="bg-[#295A47] hover:bg-[#1f4637] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat With Dealer
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* SHOWROOM STOCK */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Showroom Stock Number
                        </p>
                        <input
                          type="number"
                          value={selectedProduct.showroom_stock_number || ""}
                          onChange={(e) => {
                            setSelectedProduct({
                              ...selectedProduct,
                              showroom_stock_number: e.target.value,
                            });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#295A47] focus:outline-none"
                          placeholder="Enter showroom stock"
                        />
                      </div>
                      {/* DEFECT STOCK */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Defect Stock Number
                        </p>
                        <input
                          type="number"
                          value={selectedProduct.defect_stock || ""}
                          onChange={(e) => {
                            setSelectedProduct({
                              ...selectedProduct,
                              defect_stock: e.target.value,
                            });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                          placeholder="Enter defect stock"
                        />
                      </div>
                    </div>
                    {/* SAVE BUTTON */}
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/sales-admin/products", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              product_id: selectedProduct.product_id,
                              showroom_stock_number:
                                selectedProduct.showroom_stock_number,
                              defect_stock: selectedProduct.defect_stock,
                            }),
                          });
                          const data = await response.json();
                          if (response.ok) {
                            toast.success("Stock updated successfully");
                          } else {
                            toast.error(data.error || "Failed to update stock");
                          }
                        } catch (error) {
                          console.error(error);
                          toast.error("Something went wrong");
                        }
                      }}
                      className="mt-4 w-full bg-[#295A47] hover:bg-[#1f4637] text-white py-3 rounded-lg transition font-medium"
                    >
                      Save Stock Details
                    </button>
                  </div>
                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-[#295A47] mb-3 flex items-center">
                      <Calculator className="w-4 h-4 mr-2" />
                      Pricing
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Product Cost:</span>
                        <span className="text-xl font-bold text-[#295A47]">
                          ₹
                          {(() => {
                            const finalProductCost = Number(
                              selectedProduct.final_product_cost || 0
                            );
                            const gstPercentage = Number(
                              selectedProduct.gst_percentage || 0
                            );
                            const productCost =
                              (finalProductCost * 100) / (100 + gstPercentage);
                            return productCost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                          })()}
                        </span>
                      </div>

                      {/* Discount Section */}
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-[#295A47] mb-2">
                          Discount
                        </h4>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Percentage (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={discountPercentage}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setDiscountPercentage(Number(e.target.value) || 0)
                            }
                            onWheel={(e) => e.preventDefault()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                            placeholder="0"
                          />
                        </div>
                        {discountPercentage > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                Discount Amount:
                              </span>
                              <span className="text-red-600">
                                -₹
                                {(() => {
                                  const finalProductCost = Number(
                                    selectedProduct.final_product_cost || 0
                                  );
                                  const gstPercentage = Number(
                                    selectedProduct.gst_percentage || 0
                                  );
                                  const productCost =
                                    (finalProductCost * 100) /
                                    (100 + gstPercentage);
                                  return (
                                    (productCost * discountPercentage) /
                                    100
                                  ).toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* GST Section */}
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-[#295A47] mb-2">
                          GST Details
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">GST(%):</span>
                            <span className="text-gray-600">
                              {Number(selectedProduct.gst_percentage || 0)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">GST Amount:</span>
                            <span className="text-blue-600">
                              ₹
                              {(() => {
                                const finalProductCost = Number(
                                  selectedProduct.final_product_cost || 0
                                );
                                const gstPercentage = Number(
                                  selectedProduct.gst_percentage || 0
                                );
                                const productCost =
                                  (finalProductCost * 100) /
                                  (100 + gstPercentage);
                                const gstCalculated =
                                  productCost * (gstPercentage / 100);
                                return gstCalculated.toFixed(2);
                              })()}
                            </span>
                          </div>

                          {/* <div className="flex justify-between items-center">
                            <span className="font-medium">
                              Transportation Cost:
                            </span>
                            <span className="text-gray-600">
                              ₹
                              {Number(
                                selectedProduct.transportation_cost || 0
                              ).toFixed(2)}
                            </span>
                          </div> */}

                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              Final Price (per unit):
                            </span>
                            <div className="flex items-center gap-2">
                              {Number((selectedProduct as any).sell_mrp) >
                                0 && (
                                  <span className="text-red-500 line-through text-sm">
                                    ₹
                                    {Number(
                                      (selectedProduct as any).sell_mrp
                                    ).toLocaleString()}
                                  </span>
                                )}
                              <span className="text-xl font-bold text-green-600">
                                ₹
                                {(() => {
                                  const finalProductCost = Number(
                                    selectedProduct.final_product_cost || 0
                                  );
                                  const gstPercentage = Number(
                                    selectedProduct.gst_percentage || 0
                                  );

                                  const productCost =
                                    100 + gstPercentage !== 0
                                      ? (finalProductCost * 100) /
                                      (100 + gstPercentage)
                                      : 0;

                                  const discountAmount =
                                    (productCost * discountPercentage) / 100;
                                  const gstAmount =
                                    productCost * (gstPercentage / 100);

                                  const finalPrice =
                                    productCost - discountAmount + gstAmount;
                                  return finalPrice.toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extra Transport Cost Section - Only for transport excluded products */}
                      {selectedProduct.transport_exclude === 1 && (
                        <div className="border-t pt-3">
                          <h4 className="font-medium text-[#295A47] mb-2">
                            Extra Transport Cost
                          </h4>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={extraTransportCost}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                setExtraTransportCost(
                                  Number(e.target.value) || 0
                                )
                              }
                              onWheel={(e) => e.preventDefault()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">Quantity:</span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setQuantity(
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-12 text-center font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {discountPercentage > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Total Discount
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        -₹
                        {(() => {
                          const finalProductCost = Number(
                            selectedProduct.final_product_cost || 0
                          );
                          const gstPercentage = Number(
                            selectedProduct.gst_percentage || 0
                          );

                          const productCost =
                            100 + gstPercentage !== 0
                              ? (finalProductCost * 100) / (100 + gstPercentage)
                              : 0;

                          const totalDiscount =
                            ((productCost * discountPercentage) / 100) *
                            quantity;
                          return totalDiscount.toFixed(2);
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Total Price(including GST)
                    </div>
                    <div className="text-xl font-bold text-[#295A47]">
                      ₹
                      {(() => {
                        const finalProductCost = Number(
                          selectedProduct.final_product_cost || 0
                        );
                        const gstPercentage = Number(
                          selectedProduct.gst_percentage || 0
                        );

                        const productCost =
                          100 + gstPercentage !== 0
                            ? (finalProductCost * 100) / (100 + gstPercentage)
                            : 0;

                        const discountAmount =
                          (productCost * discountPercentage) / 100;
                        const gstAmount = productCost * (gstPercentage / 100);

                        const finalPrice =
                          productCost - discountAmount + gstAmount;

                        const transportCost =
                          selectedProduct.transport_exclude === 1
                            ? extraTransportCost
                            : 0;
                        return (finalPrice * quantity + transportCost).toFixed(
                          2
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
                    <button
                      onClick={() => {
                        if (selectedProduct) {
                          setEditFormData({
                            mrp: selectedProduct.base_mrp.toString(),
                            sell_mrp:
                              selectedProduct.sell_mrp?.toString() || "",
                            productType: selectedProduct.product_type || "",
                            commissionPercentage:
                              selectedProduct.commission_percentage,
                            gstIncluded: selectedProduct.gst_exclude === 0,
                            gstPercentage:
                              selectedProduct.gst_percentage.toString(),
                            transportationIncluded:
                              selectedProduct.transportation_cost === 0,
                            transportationCost:
                              selectedProduct.transportation_cost.toString(),
                            discussTransportationLater:
                              selectedProduct.transport_exclude === 1,
                            final_product_cost:
                              selectedProduct.final_product_cost.toString(),
                          });
                          setShowEditModal(true);
                        }
                      }}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-5 h-5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={addToCart}
                      className="w-full bg-[#295A47] text-white py-3 px-6 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CartModal
        showCart={showCart}
        setShowCart={setShowCart}
        cart={cart}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        companies={companies}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        agents={agents}
        filteredCart={filteredCart}
        selectedOrderIds={selectedOrderIds}
        setSelectedOrderIds={setSelectedOrderIds}
        pendingClientNames={pendingClientNames}
        setPendingClientNames={setPendingClientNames}
        handleClientNameChange={handleClientNameChange}
        handlePlus={handlePlus}
        handleMinus={handleMinus}
        removeFromCart={removeFromCart}
        getTotalAmount={getTotalAmount}
        getTotalCommission={getTotalCommission}
        getTotalGST={getTotalGST}
        getTotalTransportation={getTotalTransportation}
        setBuyFormData={setBuyFormData}
        setShowBuyModal={setShowBuyModal}
        session={session}
        buyFormData={buyFormData}
        completePurchase={completePurchase}
        generateInvoice={generateInvoice}
        showBuyModal={showBuyModal}
      />

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white p-3 sm:p-4 lg:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Edit Pricing Configuration
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8"
            >
              {/* MRP */}
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
                    value={editFormData.sell_mrp}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        sell_mrp: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    min="0"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                  />
                </div>
              </div>

              {/* Selling Price */}
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
                    value={editFormData.mrp}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, mrp: e.target.value })
                    }
                    placeholder="0.00"
                    min="0"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                  />
                </div>
              </div>

              {/* Commission Selection */}
              <div className="p-3 sm:p-4 bg-white rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Commission Percentage
                </div>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    name="commissionPercentage"
                    value={editFormData.commissionPercentage}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        commissionPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    %
                  </span>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    For discussion about commission(%), contact MR. John Bor -
                    7044400100
                  </p>
                </div>
                {editFormData.commissionPercentage > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Charge ({editFormData.commissionPercentage}%) +
                      18% GST
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={(() => {
                          const commission =
                            (parseFloat(editFormData.mrp) || 0) *
                            (editFormData.commissionPercentage / 100);
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
                    className={`px-3 py-1 rounded-full text-xs font-medium ${editFormData.gstIncluded
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                      }`}
                  >
                    {editFormData.gstIncluded ? "Included" : "Excluded"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData({
                      ...editFormData,
                      gstIncluded: !editFormData.gstIncluded,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editFormData.gstIncluded ? "bg-green-600" : "bg-orange-600"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editFormData.gstIncluded
                      ? "translate-x-6"
                      : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              <div
                className={`ml-0 sm:ml-4 p-3 rounded-lg border mt-3 sm:mt-0 ${editFormData.gstIncluded
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                  }`}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Percentage (%)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editFormData.gstPercentage}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      gstPercentage: e.target.value,
                    })
                  }
                  placeholder="18"
                  disabled={editFormData.gstIncluded}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none [&::-moz-appearance]:textfield [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:invisible [&::-webkit-inner-spin-button]:invisible ${editFormData.gstIncluded
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
                      value={(editFormData.gstIncluded
                        ? (((parseFloat(editFormData.mrp) || 0) * 100) /
                          (100 +
                            (parseFloat(editFormData.gstPercentage) || 0))) *
                        ((parseFloat(editFormData.gstPercentage) || 0) / 100)
                        : ((parseFloat(editFormData.mrp) || 0) *
                          (parseFloat(editFormData.gstPercentage) || 0)) /
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
                    className={`px-3 py-1 rounded-full text-xs font-medium ${editFormData.transportationIncluded
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                      }`}
                  >
                    {editFormData.transportationIncluded
                      ? "Included"
                      : "Excluded"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData({
                      ...editFormData,
                      transportationIncluded:
                        !editFormData.transportationIncluded,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editFormData.transportationIncluded
                    ? "bg-green-600"
                    : "bg-orange-600"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editFormData.transportationIncluded
                      ? "translate-x-6"
                      : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {!editFormData.transportationIncluded && (
                <>
                  <div className="ml-0 sm:ml-4 p-3 bg-orange-50 rounded-lg border border-orange-200 mt-3 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="text-sm font-medium text-gray-700">
                        Discuss Transportation Cost later
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            discussTransportationLater:
                              !editFormData.discussTransportationLater,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editFormData.discussTransportationLater
                          ? "bg-green-600"
                          : "bg-orange-600"
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editFormData.discussTransportationLater
                            ? "translate-x-6"
                            : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {editFormData.discussTransportationLater && (
                    <div className="ml-0 sm:ml-4 p-3 bg-red-100 rounded-lg border border-blue-200 mt-3 sm:mt-0">
                      <p className="text-sm text-gray-700">
                        For this product, Client will discuss the Transportation
                        Cost with you.
                      </p>
                    </div>
                  )}

                  {!editFormData.discussTransportationLater && (
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
                          value={editFormData.transportationCost}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              transportationCost: e.target.value,
                            })
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
                      {editFormData.gstIncluded
                        ? parseFloat(editFormData.mrp || "0").toFixed(2)
                        : (
                          parseFloat(editFormData.mrp || "0") +
                          ((parseFloat(editFormData.mrp) || 0) *
                            (parseFloat(editFormData.gstPercentage) || 0)) /
                          100 +
                          (!editFormData.transportationIncluded &&
                            !editFormData.discussTransportationLater
                            ? parseFloat(editFormData.transportationCost) || 0
                            : 0)
                        ).toFixed(2)}
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-right flex justify-between sm:block items-center mt-2 sm:mt-0">
                    <div className="text-sm font-medium text-gray-700 sm:mb-1">
                      Final Product Cost(Kayapalat will sell to customer)
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{editFinalProductCost.toFixed(2)}
                    </div>
                  </div>
                </div>
                {editCostError && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">
                      {editCostError}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32]"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Modal */}
      {showFullImage && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 pb-15">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedProduct.images[currentImageIndex]?.image_url}
              alt={selectedProduct.product_name}
              className="max-w-full max-h-full object-contain"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = "/placeholder_person.jpg";
              }}
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-2 right-2 sm:top-6 sm:right-6 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      {/* Kayapalat Chat Modal */}
      {selectedProduct && (
        <BusinessBrandKayapalatChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          productId={selectedProduct.product_id}
        />
      )}
    </div>
  );
};

export default ProductsTab;
