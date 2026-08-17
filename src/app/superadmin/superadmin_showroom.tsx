"use client";

import React, { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
interface Space {
  space_type: string;
  size: string;
  price: number;
  booking_status: string;
}

interface ShowroomSpace {
  space_id: number;
  space_type: string;
  size: string;
  price: number;
  dealer_id: string | null;
  client_name: string | null;
  advance: number | null;
  booking_cost: number | null;
  due: number | null;
  special_discount: string | null;
  discounted_price: number | null;
  deal_price: number | null;
  time_period: number | null;
  transaction_proof: string | null;
  booking_status: string | null;
  booking_date: string | null;
  expire_date: string | null;
  updated_at: string | null;
  invoice_id: string | null;
  agreement: string | null;
}
export default function SuperAdminShowroom() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pictureZoom, setPictureZoom] = useState(1);
  const [picturePan, setPicturePan] = useState({ x: 0, y: 0 });
  const [isPictureDragging, setIsPictureDragging] = useState(false);
  const [lastPictureMousePos, setLastPictureMousePos] = useState({
    x: 0,
    y: 0,
  });
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [pictureInitialDistance, setPictureInitialDistance] = useState(0);
  const [pictureInitialZoom, setPictureInitialZoom] = useState(1);
  const [pictureInitialPan, setPictureInitialPan] = useState({ x: 0, y: 0 });
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [showroomSpaces, setShowroomSpaces] = useState<ShowroomSpace[]>([]);
  const [editedShowroomSpaces, setEditedShowroomSpaces] = useState<
    ShowroomSpace[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const images = [
    "/showroom wall1.bmp",
    "/showroom wall2.jpeg",
    "/showroom wall3.jpeg",
    "/showroom wall4.jpeg",
  ];

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch("/api/businessBrand/spaces");
        if (response.ok) {
          const data = await response.json();
          setSpaces(data);
        } else {
          console.error("Failed to fetch spaces");
        }
      } catch (error) {
        console.error("Error fetching spaces:", error);
      }
    };

    const fetchShowroomSpaces = async () => {
      try {
        const response = await fetch("/api/superadmin/showroom");
        if (response.ok) {
          const data = await response.json();
          setShowroomSpaces(data as ShowroomSpace[]);
          setEditedShowroomSpaces(
            (data as ShowroomSpace[]).map((space) => ({ ...space }))
          );
        } else {
          console.error("Failed to fetch showroom spaces");
        }
      } catch (error) {
        console.error("Error fetching showroom spaces:", error);
      }
    };

    fetchSpaces();
    fetchShowroomSpaces();
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setInitialDistance(distance);
      setInitialZoom(zoom);
      setInitialPan(pan);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / initialDistance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 3);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setInitialDistance(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handlePictureZoomIn = () => {
    setPictureZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handlePictureZoomOut = () => {
    setPictureZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePictureMouseDown = (e: React.MouseEvent) => {
    if (pictureZoom > 1) {
      setIsPictureDragging(true);
      setLastPictureMousePos({ x: e.clientX, y: e.clientY });
    }
  };
  const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-GB"); 
  // en-GB → dd/mm/yyyy format
};
const handleGenerateInvoice = (space: any) => {
  if (!space.transaction_proof) {
    toast.error("Transaction proof required");
    return;
  }

  try {
    const doc = new jsPDF();

    const PAGE_WIDTH = doc.internal.pageSize.width;

    // ================= HEADER =================
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 90, 71);
    doc.text("KAYAPALAT", PAGE_WIDTH / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Interior Studio Invoice", PAGE_WIDTH / 2, 28, {
      align: "center",
    });

    // ================= ADDRESS =================
    doc.setFontSize(9);
    doc.setTextColor(80);

    const addressLines = [
      "Kayapalat Showroom",
      "1160 Chadpur Poleghat, Mouza 80",
      "P.O.- Malancha, P.S.- Sonarpur",
      "Kolkata - 700145",
      "India",
    ];

    addressLines.forEach((line, index) => {
      doc.text(line, PAGE_WIDTH / 2, 34 + index * 5, {
        align: "center",
      });
    });

    // ================= INVOICE INFO =================
    const invoiceNo = space.invoice_id || "N/A";
    const date = new Date().toLocaleString("en-IN");

    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNo}`, 14, 40);
    doc.text(`Date: ${date}`, PAGE_WIDTH - 14, 40, { align: "right" });

    // ================= CLIENT / DEALER =================
    doc.setFont("helvetica", "bold");
    doc.text("Booking Details", 14, 55);

    doc.setFont("helvetica", "normal");

    doc.text(`Company: ${space.client_name || "N/A"}`, 14, 63);
    doc.text(`Dealer ID: ${space.dealer_id || "N/A"}`, 14, 71);
    doc.text(`Booking Status: ${space.booking_status || "Available"}`, 14, 79);

    // ================= TABLE =================
    const tableColumns = [
      "Space Type",
      "Size (Sqft)",
      "Price(Per Sqft)",
      "Booking Duration (Months)",
    ];

    const tableRows = [
      [
        space.space_type,
        space.size,
        `Rs.${space.price?.toLocaleString() || 0}`,
        space.time_period || "-",
      ],
    ];

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 90,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 90, 71],
        textColor: 255,
      },
    });

    // ================= SUMMARY =================
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Payment Summary", 14, finalY);

    doc.setFont("helvetica", "normal");

    doc.text(
      `Booking Cost: Rs. ${space.booking_cost?.toLocaleString() || 0}`,
      14,
      finalY + 8
    );
    doc.text(
      `Advance Paid: Rs. ${space.advance?.toLocaleString() || 0}`,
      14,
      finalY + 16
    );
    // ✅ SHOW DISCOUNT ONLY IF EXISTS
    let nextY = finalY + 24;

    if (space.discounted_price != null && space.discounted_price > 0) {
      doc.text(
        `Discount: Rs. ${space.discounted_price.toLocaleString()}`,
        14,
        nextY
      );
      nextY += 8; // shift next line down
    }
    doc.text(
      `Due Amount: Rs. ${space.due?.toLocaleString() || 0}`,
      14,
      nextY
    );

    // ================= DATES =================
    doc.text(
      `Booking Date: ${formatDate(space.booking_date)}`,
      PAGE_WIDTH - 14,
      finalY + 8,
      { align: "right" }
    );

    doc.text(
      `Expiry Date: ${formatDate(space.expire_date)}`,
      PAGE_WIDTH - 14,
      finalY + 16,
      { align: "right" }
    );

    // ================= FOOTER =================
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Thank you for your business!",
      PAGE_WIDTH / 2,
      finalY + 40,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.text(
      "Terms & Conditions: Booking once confirmed is non-refundable.",
      PAGE_WIDTH / 2,
      finalY + 48,
      { align: "center" }
    );

    doc.text(
      `Generated on ${new Date().toLocaleString("en-IN")}`,
      PAGE_WIDTH / 2,
      finalY + 56,
      { align: "center" }
    );

    // ================= SAVE =================
    doc.save(`Showroom_Invoice_${space.space_type}_${Date.now()}.pdf`);

    toast.success("Invoice generated successfully!");
  } catch (error) {
    console.error(error);
    toast.error("Failed to generate invoice");
  }
};
  const handlePictureMouseMove = (e: React.MouseEvent) => {
    if (isPictureDragging && pictureZoom > 1) {
      const deltaX = e.clientX - lastPictureMousePos.x;
      const deltaY = e.clientY - lastPictureMousePos.y;
      setPicturePan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastPictureMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePictureMouseUp = () => {
    setIsPictureDragging(false);
  };

  const handlePictureTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setPictureInitialDistance(distance);
      setPictureInitialZoom(pictureZoom);
      setPictureInitialPan(picturePan);
    }
  };

  const handlePictureTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const scale = distance / pictureInitialDistance;
      const newZoom = Math.min(Math.max(pictureInitialZoom * scale, 0.5), 3);
      setPictureZoom(newZoom);
    }
  };

  const handlePictureTouchEnd = () => {
    setPictureInitialDistance(0);
  };

  const handleFieldChange = (
    index: number,
    field: keyof ShowroomSpace,
    value: string | number | null
  ) => {
    setEditedShowroomSpaces((prev) =>
      prev.map((space, i) => {
        if (i === index) {
          const updatedSpace = { ...space, [field]: value };
          if (field === "special_discount") {
            const isBlank = value === "";
            const discountPercent = isBlank ? 0 : (parseFloat(value as string) || 0);
            const bookingCost = updatedSpace.booking_cost || 0;
            const advance = updatedSpace.advance || 0;
            const discountAmount = (discountPercent / 100) * bookingCost;
            updatedSpace.special_discount = isBlank ? null : (value as string);
            updatedSpace.discounted_price = isBlank ? null : discountAmount;
            updatedSpace.deal_price = isBlank ? null : (bookingCost - discountAmount);
            updatedSpace.due = bookingCost - advance - (isBlank ? 0 : discountAmount);
          } else if (field === "advance") {
            const isBlank = value === "" || value === null;
            const advanceValue = isBlank ? 0 : parseFloat(value as string);
            const dealPrice = updatedSpace.deal_price;
            const bookingCost = updatedSpace.booking_cost || 0;

            const baseForDue = dealPrice !== null ? dealPrice : bookingCost;
            updatedSpace.due = baseForDue - advanceValue;
          }
          return updatedSpace;
        }
        return space;
      })
    );
  };

  const openModal = (url: string) => {
    setSelectedImageUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageUrl(null);
  };

  const handleDownload = () => {
    if (selectedImageUrl) {
      const link = document.createElement('a');
      link.href = selectedImageUrl;
      link.download = 'transaction_proof_' + Date.now() + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);

  const isFieldModified = (index: number, field: keyof ShowroomSpace) => {
    return editedShowroomSpaces[index][field] !== showroomSpaces[index][field];
  };

  const handleSaveField = async (index: number, field: keyof ShowroomSpace) => {
    setIsUpdating(true);
    try {
      const space = editedShowroomSpaces[index];
      let value = space[field];
      if (field === "special_discount") {
        value = parseFloat(value as string) || 0;
      }
      const updates = { [field]: value };
      const response = await fetch("/api/superadmin/showroom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_id: space.space_id, ...updates }),
      });
      if (response.ok) {
        setShowroomSpaces((prev) =>
          prev.map((s, i) => (i === index ? { ...space } : s))
        );
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevertField = (index: number, field: keyof ShowroomSpace) => {
    setEditedShowroomSpaces((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: showroomSpaces[index][field] } : s
      )
    );
  };
  const handleAutoUpdate = async (
    index: number,
    field: keyof ShowroomSpace,
    value: any
  ) => {
    try {
      const space = editedShowroomSpaces[index];

      let updatedSpace = { ...space, [field]: value };

      // ✅ If special discount changes → recalculate
      if (field === "special_discount") {
        const isBlank = value === "";
        const discountPercent = isBlank ? 0 : (parseFloat(value) || 0);
        const bookingCost = updatedSpace.booking_cost || 0;
        const advance = updatedSpace.advance || 0;

        const discountAmount = (discountPercent / 100) * bookingCost;
        const dealPrice = isBlank ? null : (bookingCost - discountAmount);
        // If discount is cleared, due should be calculated from base booking cost
        const due = (isBlank ? bookingCost : (dealPrice || 0)) - advance;

        updatedSpace.special_discount = isBlank ? null : value;
        updatedSpace.discounted_price = isBlank ? null : discountAmount;
        updatedSpace.deal_price = dealPrice;
        updatedSpace.due = due;
      } else if (field === "advance") {
        const isBlank = value === "" || value === null;
        const advanceValue = isBlank ? 0 : parseFloat(value);
        const dealPrice = updatedSpace.deal_price;
        const bookingCost = updatedSpace.booking_cost || 0;

        const baseForDue = dealPrice !== null ? dealPrice : bookingCost;
        updatedSpace.due = baseForDue - advanceValue;
        updatedSpace.advance = isBlank ? null : advanceValue;
      }

      // ✅ Update UI instantly
      setEditedShowroomSpaces((prev) =>
        prev.map((s, i) => (i === index ? updatedSpace : s))
      );

      // ✅ API Call (NO Save button needed)
      const response = await fetch("/api/superadmin/showroom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: updatedSpace.space_id,
          special_discount: updatedSpace.special_discount === null ? null : parseFloat(updatedSpace.special_discount),
          discounted_price: updatedSpace.discounted_price,
          deal_price: updatedSpace.deal_price,
          due: updatedSpace.due,
          advance: updatedSpace.advance,
        }),
      });

      if (response.ok) {
        setShowroomSpaces((prev) =>
          prev.map((s, i) => (i === index ? { ...updatedSpace } : s))
        );
      }

    } catch (error) {
      console.error("Auto update failed:", error);
    }
  };
  return (
    <>
      <style>{`
      .no-spinner::-webkit-outer-spin-button,
      .no-spinner::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .no-spinner {
        -moz-appearance: textfield;
      }
    `}</style>
      <div className="min-h-screen bg-gray-50 py-4 px-2 sm:py-8 sm:px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Showroom Architecture Plan
            </h1>
            <p className="text-base sm:text-lg text-gray-600">Explore our showroom layout</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="relative">
              <div
                className="flex justify-center items-center overflow-hidden rounded-lg border bg-gray-100 min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoom > 1 ? "grab" : "default" }}
              >
                <img
                  src="/show room plan Model.jpg"
                  alt="Showroom Architecture Plan"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center",
                    transition: isDragging ? "none" : "transform 0.3s ease",
                    cursor:
                      zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                  }}
                  draggable={false}
                />
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Use the controls to zoom and rotate the plan. Drag to pan when
                zoomed in.
              </p>
            </div>
          </div>

          {/* Picture Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Showroom Pictures
            </h2>
            <div className="relative">
              <div
                className="flex justify-center items-center overflow-hidden rounded-lg border bg-gray-100 min-h-[400px] cursor-move"
                onMouseDown={handlePictureMouseDown}
                onMouseMove={handlePictureMouseMove}
                onMouseUp={handlePictureMouseUp}
                onMouseLeave={handlePictureMouseUp}
                style={{ cursor: pictureZoom > 1 ? "grab" : "default" }}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={`Showroom Wall ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `translate(${picturePan.x}px, ${picturePan.y}px) scale(${pictureZoom})`,
                    transformOrigin: "center",
                    transition: isPictureDragging
                      ? "none"
                      : "transform 0.3s ease",
                    cursor:
                      pictureZoom > 1
                        ? isPictureDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                  draggable={false}
                />
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handlePictureZoomOut}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={handlePictureZoomIn}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Use the controls to zoom and rotate the pictures. Drag to pan
                when zoomed in.
              </p>
            </div>
          </div>

          {/* Space Details Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Available Space Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(
                spaces.reduce((acc, space) => {
                  const type = space.space_type.split("-")[0];
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(space);
                  return acc;
                }, {} as Record<string, Space[]>)
              ).map(([type, typeSpaces]) => (
                <div
                  key={type}
                  className={`bg-gradient-to-r ${
                    type === "Ceiling"
                      ? "from-blue-50 to-blue-100 border-blue-200"
                      : type === "Flooring"
                      ? "from-green-50 to-green-100 border-green-200"
                      : type === "Wall"
                      ? "from-purple-50 to-purple-100 border-purple-200"
                      : "from-yellow-50 to-yellow-100 border-yellow-200"
                  } rounded-lg p-6 border`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {type} Spaces (Sqft)
                  </h3>
                  <div className="space-y-3">
                    {typeSpaces.map((space) => (
                      <div
                        key={space.space_type}
                        className={`flex justify-between items-center p-2 rounded ${
                          space.booking_status === 'pending' || space.booking_status === 'booked'
                            ? 'bg-red-700 border border-red-500 '
                            : 'bg-green-700 border border-green-500'
                        }`}
                      >
                        <span className="text-white font-medium">
                          {space.space_type}
                        </span>
                        <span className="text-white font-bold">
                          {space.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Contact us for more information about space availability.
              </p>
            </div>
          </div>

          {/* Showroom Spaces Details Section */}
          <div className="bg-white rounded-xl shadow-xl p-8 mt-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent">
              Showroom Spaces Details
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full table-auto">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gradient-to-r from-green-900 to-green-600 text-white">
                    <th className="sticky left-0 z-30 bg-green-900 px-6 py-4 text-center font-semibold text-sm uppercase">
                      Space Type
                    </th>

                    <th className="sticky left-[180px] z-30 bg-green-900 px-6 py-4 text-center font-semibold text-sm uppercase">
                      Booking Status
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Generate Invoice
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Transaction Proof
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Agreement
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Size (Sqft)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Price (₹)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Dealer ID
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Booking Cost (₹)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Advance (₹)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Due (₹)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Special Discount (%)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Deal Price
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Time Period (Months)
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Booking Date
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
                      Expire Date
                    </th>
                    
                  </tr>
                </thead>
                <tbody>
                  {editedShowroomSpaces.map((space, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-20 bg-white border px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={space.space_type}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "space_type",
                                e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "space_type") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "space_type")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "space_type")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="sticky left-[180px] z-20 bg-white border px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <select
                            value={space.booking_status || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "booking_status",
                                e.target.value || null
                              )
                            }
                            className={`flex-1 px-2 py-1 border rounded text-white font-medium
                              ${
                                space.booking_status === "confirmed"
                                  ? "bg-red-500 border-red-600"
                                  : space.booking_status === "pending"
                                  ? "bg-yellow-400 border-yellow-500 text-black"
                                  : "bg-green-500 border-green-600"
                              }
                            `}
                          >
                            <option value="">Available</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                          </select>

                          {isFieldModified(index, "booking_status") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "booking_status")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "booking_status")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleGenerateInvoice(space)}
                          disabled={!space.transaction_proof}
                          className={`px-3 py-1 rounded text-sm font-medium transition ${
                            space.transaction_proof
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Invoice
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {space.transaction_proof ? (
                          <button
                            onClick={() => openModal(space.transaction_proof!)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Proof
                          </button>
                        ) : (
                          <span className="text-gray-500">No Proof</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {space.agreement ? (
                          <a
                            href={space.agreement}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm"
                            download
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400">No Agreement</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={space.size}
                            onChange={(e) =>
                              handleFieldChange(index, "size", e.target.value)
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "size") && (
                            <>
                              <button
                                onClick={() => handleSaveField(index, "size")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleRevertField(index, "size")}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.price}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                          {isFieldModified(index, "price") && (
                            <>
                              <button
                                onClick={() => handleSaveField(index, "price")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "price")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={space.dealer_id || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "dealer_id",
                                e.target.value || null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "dealer_id") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "dealer_id")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "dealer_id")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={space.client_name || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "client_name",
                                e.target.value || null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "client_name") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "client_name")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "client_name")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.booking_cost || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "booking_cost",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                          {isFieldModified(index, "booking_cost") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "booking_cost")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "booking_cost")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.advance || ""}
                            onChange={(e) => handleAutoUpdate(index, "advance", e.target.value)}
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.due || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "due",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                          {isFieldModified(index, "due") && (
                            <>
                              <button
                                onClick={() => handleSaveField(index, "due")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleRevertField(index, "due")}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={space.special_discount || ""}
                            onChange={(e) =>
                              handleAutoUpdate(index, "special_discount", e.target.value)
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.discounted_price || ""}
                            // onChange={(e) =>
                            //   handleFieldChange(
                            //     index,
                            //     "discounted_price",
                            //     e.target.value
                            //       ? parseFloat(e.target.value)
                            //       : null
                            //   )
                            // } 
                            readOnly
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.deal_price || ""}
                            // onChange={(e) =>
                            //   handleFieldChange(
                            //     index,
                            //     "deal_price",
                            //     e.target.value
                            //       ? parseFloat(e.target.value)
                            //       : null
                            //   )
                            // }
                            readOnly
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={space.time_period || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "time_period",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded no-spinner"
                          />
                          {isFieldModified(index, "time_period") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "time_period")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "time_period")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={space.booking_date || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "booking_date",
                                e.target.value || null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "booking_date") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "booking_date")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "booking_date")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={space.expire_date || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "expire_date",
                                e.target.value || null
                              )
                            }
                            className="flex-1 px-2 py-1 border rounded"
                          />
                          {isFieldModified(index, "expire_date") && (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveField(index, "expire_date")
                                }
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRevertField(index, "expire_date")
                                }
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Revert"
                              >
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showroomSpaces.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No showroom spaces found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal for viewing transaction proof */}
      {isModalOpen && selectedImageUrl && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transaction Proof</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleDownload}
                  className="text-blue-600 hover:text-blue-800"
                  title="Download"
                >
                  <Download size={24} />
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <img
              src={selectedImageUrl}
              alt="Transaction Proof"
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
