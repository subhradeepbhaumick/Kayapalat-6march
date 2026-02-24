"use client";

import React, { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Space {
  space_type: string;
  size: string;
  price: number;
  booking_status: string;
}

export default function BusinessBrandBookMySpace() {
  const { data: session, status } = useSession();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedSpace, setSelectedSpace] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [estimate, setEstimate] = useState(0);
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
  const [showBookedPopup, setShowBookedPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [dealerId, setDealerId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [timePeriod, setTimePeriod] = useState(6);
  const [advance, setAdvance] = useState(0);
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [finalCost, setFinalCost] = useState(0);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  const images = [
    "/showroom wall1.bmp",
    "/showroom wall2.jpeg",
    "/showroom wall3.jpeg",
    "/showroom wall4.jpeg",
  ];
  const formatINR = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
  const due = Math.max(finalCost - advance, 0);

  const getDiscountPercentage = (timePeriod: number) => {
    switch (timePeriod) {
      case 6:
        return 0;
      case 12:
        return 7;
      case 18:
        return 12;
      case 24:
        return 15;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      const fetchSpaces = async () => {
        try {
          const response = await fetch("/api/businessBrand/spaces"); // ✅ FIXED
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

      fetchSpaces();
    }
  }, [status]);

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

  const handleSpaceSelect = (space: string) => {
    setSelectedSpace(space);
    const spaceData = spaces.find((s) => s.space_type === space);
    if (spaceData) {
      const available = parseInt(spaceData.size.split(" ")[0]);
      const price = spaceData.price;
      setEstimate(available * price);
      // Reset advance when space changes
      setAdvance(0);
    }
  };

  const getAvailableSpace = (space: string) => {
    const spaceData = spaces.find((s) => s.space_type === space);
    return spaceData ? spaceData.size : "";
  };

  const getPricePerSqft = (space: string) => {
    const spaceData = spaces.find((s) => s.space_type === space);
    return spaceData ? formatINR(spaceData.price) : "";
  };

  const handleBookingSubmit = async () => {
    try {
      const response = await fetch(
        `/api/businessBrand/spaces?space_type=${encodeURIComponent(
          selectedSpace
        )}`
      );
      if (response.ok) {
        const spaceData = await response.json();
        if (spaceData.dealer_id !== null) {
          setShowBookedPopup(true);
        } else {
          setDealerId(session?.user?.id || "");
          const calculatedTotalCost = estimate * timePeriod;
          setTotalCost(calculatedTotalCost);
          const discount = getDiscountPercentage(timePeriod);
          const calculatedFinalCost =
            calculatedTotalCost * (1 - discount / 100);
          setFinalCost(calculatedFinalCost);
          setAdvance(Math.ceil(calculatedFinalCost * 0.1)); // Set minimum 10% of final cost
          setShowBookingForm(true);
        }
      } else {
        alert("Failed to check space availability");
      }
    } catch (error) {
      console.error("Error checking space:", error);
      alert("Error checking space availability");
    }
  };

  const handleBookSubmit = async () => {
    if (!dealerId || !companyName || advance <= 0 || !transactionProof) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("space_type", selectedSpace);
      formData.append("dealer_id", dealerId);
      formData.append("company_name", companyName);
      formData.append("advance", advance.toString());
      formData.append("booking_cost", finalCost.toString());
      formData.append("due", due.toString());
      formData.append("time_period", timePeriod.toString());
      formData.append("transaction_proof", transactionProof);

      const response = await fetch("/api/businessBrand/spaces", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowSuccessPopup(true);
        setShowBookingForm(false);
        setDealerId("");
        setCompanyName("");
        setAdvance(0);
        setTransactionProof(null);
        setSelectedSpace("");
        setEstimate(0);
        // Refresh spaces list
        const fetchSpaces = async () => {
          try {
            const response = await fetch("/api/businessBrand/spaces");
            if (response.ok) {
              const data = await response.json();
              setSpaces(data);
            }
          } catch (error) {
            console.error("Error fetching spaces:", error);
          }
        };
        fetchSpaces();
      } else if (response.status === 409) {
        alert(
          "Sorry! This Slot is already booked by someone else. Kindly Book some other space or kindly wait to book this slot until the current booking expires."
        );
        setShowBookingForm(false);
      } else {
        alert("Failed to book space");
      }
    } catch (error) {
      console.error("Error booking space:", error);
      alert("Error booking space");
    }
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

  const handleBookingHistoryClick = async () => {
    try {
      const response = await fetch("/api/businessBrand/booking-history");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        setShowBookingHistory(true);
      } else {
        alert("Failed to fetch booking history");
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
      alert("Error fetching booking history");
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Showroom Architecture Plan
            </h1>
            <p className="text-lg text-gray-600">
              Explore our showroom layout to book space for branding your
              company
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="relative">
              <div
                className="flex justify-center items-center overflow-hidden rounded-lg border bg-gray-100 min-h-[600px] cursor-move"
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
                Contact us to book your preferred space for brand installation
                and display.
              </p>
            </div>
          </div>

          {/* Booking Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Book Your Space
              </h2>
              <button
                onClick={handleBookingHistoryClick}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                <History size={20} />
                Booking History
              </button>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label
                    htmlFor="bookingSpace"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Booking Space
                  </label>
                  <select
                    id="bookingSpace"
                    value={selectedSpace}
                    onChange={(e) => handleSpaceSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a space</option>
                    {spaces.map((space) => (
                      <option key={space.space_type} value={space.space_type}>
                        {space.space_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="availableSpace"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Available Space (sqft)
                  </label>
                  <input
                    type="text"
                    id="availableSpace"
                    value={
                      selectedSpace ? getAvailableSpace(selectedSpace) : ""
                    }
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Select space first"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pricePerSqft"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Price per sqft (Per Month)
                  </label>
                  <input
                    type="text"
                    id="pricePerSqft"
                    value={selectedSpace ? getPricePerSqft(selectedSpace) : ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Select space first"
                  />
                </div>
                <div>
                  <label
                    htmlFor="timePeriod"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Time Period (Months)
                  </label>

                  <select
                    id="timePeriod"
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>

              {/* Estimate Section */}
              {selectedSpace && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Estimate
                  </h3>
                  <p className="text-blue-800 font-medium">
                    Monthly Cost{" "}(Excluded GST): 
                    <span className="text-lg font-bold">
                      ₹{estimate.toLocaleString("en-IN")}
                    </span>
                  </p>
                  <p className="text-blue-800 font-medium">
                    Total Cost:{" "}
                    <span className="text-lg font-bold text-blue-800">
                      ₹{(estimate * timePeriod).toLocaleString("en-IN")}
                    </span>
                  </p>
                  <p className="text-blue-800 font-medium">
                    Discount (%):{" "}
                    <span className="text-lg font-bold text-red-500">
                      {getDiscountPercentage(timePeriod)}%
                    </span>
                  </p>
                  <p className="text-blue-800 font-medium">
                    Final Cost:{" "}
                    <span className="text-lg font-bold text-red-500">
                      ₹
                      {(
                        estimate *
                        timePeriod *
                        (1 - getDiscountPercentage(timePeriod) / 100)
                      ).toLocaleString("en-IN")}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-center py-4">
              <button
                onClick={handleBookingSubmit}
                disabled={!selectedSpace}
                className={` py-2 px-4 rounded-md font-medium transition-colors ${
                  selectedSpace
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Book Space
              </button>
            </div>
          </div>

          {/* Booked Popup */}
          {showBookedPopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md text-center shadow-lg">
                <h3 className="text-lg font-bold text-red-600 mb-3">
                  Slot Already Booked
                </h3>
                <p className="text-gray-700 mb-4">
                  Sorry! This Slot is already booked by someone else. Kindly
                  book some other space or wait until the current booking
                  expires.
                </p>
                <button
                  onClick={() => setShowBookedPopup(false)}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Success Popup */}
          {showSuccessPopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md text-center shadow-lg">
                <h3 className="text-lg font-bold text-green-600 mb-3">
                  Booking Submitted Successfully
                </h3>
                <p className="text-gray-700 mb-4">
                  Your Booking is now in process. Kindly wait for approval from
                  KayaPalat. Thank you to book your slot in our showroom.
                </p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Booking Form Modal */}
          {showBookingForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center ">
                  <h3 className="text-xl font-bold mb-6">Confirm Booking</h3>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Dealer ID
                  </label>
                  <input
                    type="text"
                    value={dealerId}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Final Cost (₹)
                  </label>
                  <input
                    type="text"
                    value={formatINR(finalCost)}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Advance Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={advance}
                    onChange={(e) => setAdvance(Number(e.target.value))}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full border p-2 rounded no-spinner"
                    placeholder="Enter advance amount"
                  />
                </div>

                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Notice:</strong> Minimum payable amount is 10% at
                    least as advance.
                    <br />
                    For further discussion please contact Mr. John Bor -
                    7044400100
                  </p>
                </div>

                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-md font-semibold text-blue-900 mb-2">
                    Bank Details for Payment
                  </h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Bank:</strong> HDFC</p>
                    <p><strong>A/C No:</strong> 50200112029048</p>
                    <p><strong>IFSC Code:</strong> HDFC0004283</p>
                    <p><strong>Branch:</strong> BAGHAJATIN</p>
                    <p><strong>Name:</strong> KAYAPALAT</p>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <img
                      src="/Kayapalat Payment Qr .jpeg"
                      alt="Kayapalat Payment QR Code"
                      className="max-w-xs h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Due Amount (₹)
                  </label>
                  <input
                    type="text"
                    value={formatINR(due)}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    Transaction Proof <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setTransactionProof(e.target.files?.[0] || null)
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Upload a file
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookSubmit}
                    disabled={
                      !dealerId ||
                      !companyName ||
                      advance <= 0 ||
                      !transactionProof
                    }
                    className={`px-4 py-2 rounded ${
                      !dealerId ||
                      !companyName ||
                      advance <= 0 ||
                      !transactionProof
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Booking History Modal */}
          {showBookingHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Booking History</h3>
                  <button
                    onClick={() => setShowBookingHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Space Type
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Company Name
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Booking Date
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Time Period
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Expiry Date
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Total Cost
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Due Amount
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              {booking.space_type}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {booking.client_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {new Date(
                                booking.booking_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {booking.time_period} months
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {new Date(
                                booking.expire_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {formatINR(booking.booking_cost)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {formatINR(booking.due)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.booking_status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : booking.booking_status === "booked"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {booking.booking_status === "pending"
                                  ? "Pending"
                                  : booking.booking_status === "booked"
                                  ? "Booked"
                                  : booking.booking_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No booking history found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
