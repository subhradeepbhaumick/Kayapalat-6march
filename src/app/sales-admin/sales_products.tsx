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
} from "lucide-react";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import CartModal from "./cartModal";
import { Product } from "@/types/product";
import { CartItem } from "@/types/cart";

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
  const [showroomStockFilter, setShowroomStockFilter] = useState<"all" | "in_showroom">("all");
  const [selectedCompanyFilter, setSelectedCompanyFilter] =
    useState<string>("All");
  const [productNameSearch, setProductNameSearch] = useState<string>("");

  const [pendingClientNames, setPendingClientNames] = useState<{
    [key: string]: string;
  }>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [showBuyModal, setShowBuyModal] = useState(false);
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
  const selectedCart = cart.filter((item) =>
    selectedOrderIds.includes(item.order_id)
  );

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  // Get unique company names for filter
  const companyNamesForFilter = [
    "All",
    ...Array.from(new Set(products.map((product) => product.company_name))),
  ];

  // Filter products based on selected category and company
  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "All" || product.category === selectedCategory;
    const companyMatch =
      selectedCompanyFilter === "All" ||
      product.company_name === selectedCompanyFilter;
    const nameMatch =
      !productNameSearch ||
      product.product_name
        .toLowerCase()
        .includes(productNameSearch.toLowerCase());
    const showroomMatch = showroomStockFilter === "all" ||(showroomStockFilter === "in_showroom" && product.showroom_stock === 2);
    return categoryMatch && companyMatch && nameMatch && showroomMatch;
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
              calculatedPrice: Number(item.discounted_amount) || 0,
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

      // Fetch dealer info for invoice customization
      let dealerCompanyName = "KAYAPALAT";
      let dealerCompositeGST = false;
      let dealerAddress: string | null = null;
      let dealerPhone: string | null = null;
      try {
        const dealerRes = await fetch(
          `/api/sales-admin/check-composite-gst?dealer_id=${selectedCart[0]?.dealer_id}`
        );
        const dealerData = await dealerRes.json();
        dealerCompositeGST = dealerData.composite_gst_scheme === 1;
        if (dealerData.composite_gst_scheme === 1 && dealerData.company_name) {
          dealerCompanyName = dealerData.company_name;
          dealerAddress = dealerData.address ?? null;
          dealerPhone = dealerData.phone ?? null;
        }
      } catch {
        // fallback to defaults
      }

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
      doc.text(dealerCompanyName.toUpperCase(), PAGE_WIDTH / 2, 18, {
        align: "center",
      });

      if (dealerCompositeGST) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        if (dealerAddress) {
          doc.text(dealerAddress, PAGE_WIDTH / 2, 26, { align: "center" });
        }
        if (dealerPhone) {
          doc.text(`Phone/WhatsApp: ${dealerPhone}`, PAGE_WIDTH / 2, 32, {
            align: "center",
          });
        }
      } else {
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
      }

      // =====================
      // INVOICE NUMBER + DATE (SAME LINE)
      // =====================
      // const invoiceNumber = `INV-O-${new Date()
      //   .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      //   .replace(/[-: ]/g, "")}`;

      const invoiceDate = new Date().toLocaleString('en-IN');

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
      const tableColumns = dealerCompositeGST
        ? [
            "S.No",
            "Product",
            "Company",
            "Unit Price",
            "Discount",
            "Quantity",
            "Transport Cost",
            "Total",
          ]
        : [
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

      const tableRows = selectedCart.map((item, index) =>
        dealerCompositeGST
          ? [
              index + 1,
              item.product_name,
              item.company_name,
              `Rs. ${item.product_mrp.toLocaleString()}`,
              item.discount_percentage > 0
                ? `${
                    item.discount_percentage
                  }% - ${item.discount.toLocaleString()}`
                : "-",
              item.quantity,
              `Rs. ${item.transport_exclude.toLocaleString()}`,
              `Rs. ${item.calculatedPrice.toLocaleString()}`,
            ]
          : [
              index + 1,
              item.product_name,
              item.company_name,
              `Rs. ${item.product_mrp.toLocaleString()}`,
              item.discount_percentage > 0
                ? `${
                    item.discount_percentage
                  }% - ${item.discount.toLocaleString()}`
                : "-",
              `${item.gst}% - ${item.gst_amount.toLocaleString()}`,
              item.quantity,
              `Rs. ${item.transport_exclude.toLocaleString()}`,
              `Rs. ${item.calculatedPrice.toLocaleString()}`,
            ]
      );

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
      const totalProductCost = selectedCart.reduce(
        (sum, item) => sum + item.product_mrp * item.quantity,
        0
      );
      const totalDiscount = selectedCart.reduce(
        (sum, item) => sum + item.discount * item.quantity,
        0
      );
      const totalGSTAmount = getTotalGST();

      autoTable(doc, {
        head: [["Description", "Amount"]],
        body: [
          ["Total Product Cost", `Rs. ${totalProductCost.toLocaleString()}`],
          ["Total Discount", `Rs. ${totalDiscount.toLocaleString()}`],
          // Only show GST row if NOT composite GST scheme
          ...(!dealerCompositeGST
            ? [["Total GST", `Rs. ${totalGSTAmount.toLocaleString()}`]]
            : []),
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

      if (dealerCompositeGST) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 0, 0);
        doc.text(
          "Declaration: Composition taxable person, not eligible to collect tax on supplies",
          PAGE_WIDTH / 2,
          finalY + 18,
          { align: "center" }
        );
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleString('en-IN')}`,
          PAGE_WIDTH / 2,
          finalY + 28,
          { align: "center" }
        );
      } else {
        doc.text(
          `Generated on ${new Date().toLocaleString('en-IN')}`,
          PAGE_WIDTH / 2,
          finalY + 16,
          { align: "center" }
        );
      }

      // Save the PDF
      doc.save(`Invoice_${orderId}.pdf`);

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
        `Generated on ${new Date().toLocaleString('en-IN')}`,
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
        {/* Category Filter */}
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

        {/* Company Filter */}
        <div>
          <label
            htmlFor="company-filter-select"
            className="block font-medium text-[#295A47] text-sm mb-1"
          >
            Company
          </label>
          <select
            id="company-filter-select"
            value={selectedCompanyFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedCompanyFilter(e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm"
          >
            {companyNamesForFilter.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Product Name Search */}
        <div>
          <label
            htmlFor="product-name-search"
            className="block font-medium text-[#295A47] text-sm mb-1"
          >
            Product Name
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
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setShowroomStockFilter("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showroomStockFilter === "all"
                ? "bg-[#295A47] text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            All Products({products.length})
          </button>

          <button
            onClick={() => setShowroomStockFilter("in_showroom")}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              showroomStockFilter === "in_showroom"
                ? "bg-[#295A47] text-white"
                : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            Showroom Stock (
            {products.filter((p) => p.showroom_stock === 2).length}
            )
          </button>
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
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.is_active
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
                      const gstPercentage = Number(product.gst_percentage || 0);
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
                              className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 ${
                                currentImageIndex === index
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
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedProduct.is_active
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
                                    100 + gstPercentage !== 0
                                      ? (finalProductCost * 100) /
                                        (100 + gstPercentage)
                                      : 0;
                                  const discountAmount =
                                    (productCost * discountPercentage) / 100;
                                  return discountAmount.toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* GST Section */}
                      {Number(selectedProduct.composite_gst_scheme || 0) ===
                      0 ? (
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
                                    100 + gstPercentage !== 0
                                      ? (finalProductCost * 100) /
                                        (100 + gstPercentage)
                                      : 0;
                                  const calculatedGstAmount =
                                    productCost * (gstPercentage / 100);
                                  return calculatedGstAmount.toFixed(2);
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
                      ) : null}

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
                              ) => {
                                setExtraTransportCost(
                                  Number(e.target.value) || 0
                                );
                              }}
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
                    <div className="text-sm text-gray-500">Total Price</div>
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

      {/* Cart Modal */}
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

      {/* Full Image Modal for Product Details */}
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
    </div>
  );
};

export default ProductsTab;
