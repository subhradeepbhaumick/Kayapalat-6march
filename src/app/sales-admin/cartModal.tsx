"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  X,
  Minus,
  Plus,
  Image as ImageIcon,
  Check,
  BadgeIndianRupeeIcon,
} from "lucide-react";
import type { Session } from "next-auth";
import { CartItem } from "@/types/cart";
import toast from "react-hot-toast";

interface BuyFormData {
  agentId: string;
  clientName: string;
  clientPhone: string;
  client_gstin: string;
  paymentType: string;
  transactionId: string;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  orderIds: string[];
  siteNameAddress: string;
  deliveryType: "Site" | "Kayapalat";
  extraTransportationCost: number;
}

interface CartModalProps {
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  cart: CartItem[];
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  companies: string[];
  selectedAgent: string;
  setSelectedAgent: (agent: string) => void;
  agents: string[];
  filteredCart: CartItem[];
  selectedOrderIds: string[];
  setSelectedOrderIds: React.Dispatch<React.SetStateAction<string[]>>;
  pendingClientNames: { [key: string]: string };
  setPendingClientNames: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  handleClientNameChange: (orderIds: string[], clientName: string) => void;
  handlePlus: (item: CartItem) => Promise<void>;
  handleMinus: (item: CartItem) => Promise<void>;
  removeFromCart: (orderId: string) => Promise<void>;
  getTotalAmount: () => number;
  getTotalCommission: () => number;
  getTotalGST: () => number;
  getTotalTransportation: () => number;
  setBuyFormData: (data: BuyFormData) => void;
  setShowBuyModal: (show: boolean) => void;
  session: Session | null;
  buyFormData: BuyFormData;
  completePurchase: () => void;
  generateInvoice: () => void;
  showBuyModal: boolean;
}

const CartModal: React.FC<CartModalProps> = ({
  showCart,
  setShowCart,
  cart,
  selectedCompany,
  setSelectedCompany,
  companies,
  selectedAgent,
  setSelectedAgent,
  agents,
  filteredCart,
  selectedOrderIds,
  setSelectedOrderIds,
  pendingClientNames,
  setPendingClientNames,
  handleClientNameChange,
  handlePlus,
  handleMinus,
  removeFromCart,
  getTotalAmount,
  getTotalCommission,
  getTotalGST,
  getTotalTransportation,
  setBuyFormData,
  setShowBuyModal,
  session,
  buyFormData,
  completePurchase,
  generateInvoice,
  showBuyModal,
}) => {
  const [phoneAlertShown, setPhoneAlertShown] = useState(false);
  const [isCompositeGST, setIsCompositeGST] = useState(false);
  return (
    <>
      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 sm:p-6">
              {/* Cart Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-[#295A47] flex items-center">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  <span className="truncate">
                    Shopping Cart ({filteredCart.length} items)
                  </span>
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Company and Agent Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                <label
                  htmlFor="company-select"
                  className="font-medium text-[#295A47] text-sm sm:text-base"
                >
                  Filter by Company:
                </label>
                <select
                  id="company-select"
                  value={selectedCompany}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedCompany(e.target.value)
                  }
                  className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="ALL">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
                <label
                  htmlFor="agent-select"
                  className="font-medium text-[#295A47] text-sm sm:text-base"
                >
                  Filter by Agent:
                </label>
                <select
                  id="agent-select"
                  value={selectedAgent}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedAgent(e.target.value)
                  }
                  className="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="ALL">All Agents</option>
                  {agents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500">
                    Add some products to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Select All Checkbox */}
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={
                        filteredCart.length > 0 &&
                        selectedOrderIds.length === filteredCart.length
                      }
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          const allOrderIds = filteredCart.map(
                            (item) => item.order_id
                          );
                          setSelectedOrderIds(allOrderIds);
                        } else {
                          setSelectedOrderIds([]);
                        }
                      }}
                      className="w-4 h-4 text-[#295A47] bg-gray-100 border-gray-300 rounded focus:ring-[#295A47] focus:ring-2"
                    />
                    <label className="text-sm font-medium text-[#295A47]">
                      Select All
                    </label>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4">
                    {filteredCart
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((item: CartItem) => (
                        <div
                          key={item.order_id}
                          className="bg-gray-50 rounded-lg p-3 sm:p-4"
                        >
                          {/* Mobile: Stack actions below details. Desktop: Horizontal row */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Product Info Group (Checkbox + Image + Details) */}
                            <div className="flex flex-1 items-start space-x-3 sm:space-x-4 w-full">
                              {/* Checkbox */}
                              <div className="pt-2 sm:pt-0 sm:self-center">
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.includes(
                                    item.order_id
                                  )}
                                  onChange={(e) => {
                                    const orderId = item.order_id;
                                    if (e.currentTarget.checked) {
                                      setSelectedOrderIds((prev: string[]) => [
                                        ...prev,
                                        orderId,
                                      ]);
                                    } else {
                                      setSelectedOrderIds((prev: string[]) =>
                                        prev.filter(
                                          (id: string) => id !== orderId
                                        )
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 sm:w-4 sm:h-4 text-[#295A47] bg-gray-100 border-gray-300 rounded focus:ring-[#295A47] focus:ring-2"
                                />
                              </div>

                              {/* Image */}
                              <div className="w-16 h-16 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {item.images && item.images.length > 0 ? (
                                  <img
                                    src={item.images[0].image_url}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/placeholder_person.jpg";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <h3 className="font-semibold text-[#295A47] text-sm sm:text-base">
                                  {item.product_name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {item.company_name}
                                </p>
                                {/* <p className="text-xs sm:text-sm text-gray-500">
                                ₹{item.changed_price.toLocaleString()} each
                              </p> */}
                                <p className="text-xs sm:text-sm font-medium text-blue-600">
                                  Order ID: {item.order_id}
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-purple-600">
                                  Agent ID: {item.agent_id}
                                </p>
                                <div className="text-xs text-gray-400 mt-2">
                                  <label className="block mb-1 text-xs">
                                    Client Name:
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={
                                        pendingClientNames[item.order_id] ??
                                        item.client_name ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        setPendingClientNames((prev) => ({
                                          ...prev,
                                          [item.order_id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#295A47] focus:border-transparent"
                                      placeholder="Enter client name"
                                    />
                                    <button
                                      onClick={() =>
                                        handleClientNameChange(
                                          [item.order_id],
                                          pendingClientNames[item.order_id] ||
                                            ""
                                        )
                                      }
                                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex-shrink-0"
                                      title="Update Client Name"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls and Price */}
                            <div className="flex items-center justify-between sm:justify-end sm:space-x-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleMinus(item)}
                                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center touch-manipulation"
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <span className="w-8 sm:w-12 text-center font-semibold text-sm sm:text-base">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handlePlus(item)}
                                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center touch-manipulation"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </div>

                              <div className="text-right ml-4 sm:ml-0">
                                <div className="font-bold text-[#295A47] text-sm sm:text-base">
                                  ₹{item.calculatedPrice}
                                </div>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.order_id)}
                                className="text-red-500 hover:text-red-700 ml-2 sm:ml-0 touch-manipulation"
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Bill Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-[#295A47] mb-4 flex items-center">
                      <BadgeIndianRupeeIcon className="w-4 h-4" />
                      Bill Summary
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{getTotalAmount().toLocaleString()}</span>
                      </div>

                      <hr className="my-3" />
                      <div className="flex justify-between text-xl font-bold text-green-600">
                        <span>Grand Total:</span>
                        <span>₹{getTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-full sm:flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={async () => {
                        const selectedItems = cart.filter((item) =>
                          selectedOrderIds.includes(item.order_id)
                        );

                        if (selectedItems.length === 0) {
                          toast.error("Please select at least one item.");
                          return;
                        }

                        const firstCompany = selectedItems[0].company_name;
                        const isSameCompany = selectedItems.every(
                          (item) => item.company_name === firstCompany
                        );

                        if (!isSameCompany) {
                          toast.error(
                            "Please select products from only one company to proceed."
                          );
                          return;
                        }

                        // Check composite GST scheme for the dealer
                        const dealerId = selectedItems[0].dealer_id;
                        try {
                          const res = await fetch(
                            `/api/sales-admin/check-composite-gst?dealer_id=${dealerId}`
                          );
                          const data = await res.json();
                          setIsCompositeGST(data.composite_gst_scheme === 1);
                        } catch {
                          setIsCompositeGST(false);
                        }

                        const subtotal = getTotalAmount();
                        setBuyFormData({
                          ...buyFormData,
                          totalAmount: Number(subtotal.toFixed(2)),
                          advanceAmount: 0,
                          dueAmount: Number(subtotal.toFixed(2)),
                          agentId: session?.user?.id || "",
                          orderIds: selectedOrderIds,
                          siteNameAddress: "",
                          deliveryType: "Kayapalat",
                          extraTransportationCost: 0,
                          client_gstin: "",
                        });
                        setShowBuyModal(true);
                      }}
                      className="w-full sm:flex-1 bg-[#295A47] text-white py-3 px-6 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2"
                    >
                      <BadgeIndianRupeeIcon className="w-4 h-4" />
                      <span>Buy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#295A47]">
                  Complete Purchase
                </h2>
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Purchase Form */}
              <div className="space-y-6">
                {/* Agent ID */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Agent ID
                  </label>
                  <input
                    type="text"
                    value={buyFormData.agentId}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Agent ID"
                  />
                </div>

                {/* Selected Order IDs */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Selected Order IDs
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                    {buyFormData.orderIds.length > 0
                      ? buyFormData.orderIds.join(", ")
                      : "No orders selected"}
                  </div>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={buyFormData.clientName}
                    onChange={(e) =>
                      setBuyFormData({
                        ...buyFormData,
                        clientName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    placeholder="Enter client name"
                  />
                </div>

                {/* Client Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    value={buyFormData.clientPhone}
                    onChange={(e) =>
                      setBuyFormData({
                        ...buyFormData,
                        clientPhone: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      // Allow only numeric keys, backspace, delete, tab, enter, and navigation keys
                      const allowedKeys = [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Enter",
                        "Home",
                        "End",
                        "ArrowLeft",
                        "ArrowRight",
                      ];
                      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={(e) => {
                      const phone = e.target.value;
                      if (phone && phone.length < 10 && !phoneAlertShown) {
                        setPhoneAlertShown(true);
                        alert(
                          "Client phone number must be at least 10 digits."
                        );
                        e.target.focus();
                        setTimeout(() => setPhoneAlertShown(false), 100);
                      }
                    }}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    placeholder="Enter client phone number (10 digits)"
                  />
                </div>

                {/* Client GSTIN - hidden for composite GST dealers */}
                {!isCompositeGST && (
                  <div>
                    <label className="block text-sm font-medium text-[#295A47] mb-2">
                      Client GSTIN
                    </label>
                    <input
                      type="text"
                      value={buyFormData.client_gstin}
                      onChange={(e) =>
                        setBuyFormData({
                          ...buyFormData,
                          client_gstin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                      placeholder="Enter client GSTIN"
                    />
                  </div>
                )}

                {/* Delivery Type */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Delivery Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="Kayapalat"
                        checked={buyFormData.deliveryType === "Kayapalat"}
                        onChange={(e) =>
                          setBuyFormData({
                            ...buyFormData,
                            deliveryType: e.target.value as
                              | "Site"
                              | "Kayapalat",
                          })
                        }
                        className="mr-2"
                      />
                      Kayapalat
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="Site"
                        checked={buyFormData.deliveryType === "Site"}
                        onChange={(e) =>
                          setBuyFormData({
                            ...buyFormData,
                            deliveryType: e.target.value as
                              | "Site"
                              | "Kayapalat",
                          })
                        }
                        className="mr-2"
                      />
                      Site
                    </label>
                  </div>
                </div>

                {/* Site Name & Address */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Site Name & Address
                  </label>
                  <textarea
                    value={buyFormData.siteNameAddress}
                    onChange={(e) =>
                      setBuyFormData({
                        ...buyFormData,
                        siteNameAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    placeholder="Enter site name and address"
                    rows={3}
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={buyFormData.totalAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                {/* Extra Transportation Cost */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Extra Transportation Cost
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={buyFormData.extraTransportationCost}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numeric input
                      if (/^\d*\.?\d*$/.test(value)) {
                        const newCost = Number(value) || 0;
                        const subtotal = getTotalAmount();
                        const newTotal = subtotal + newCost;
                        setBuyFormData({
                          ...buyFormData,
                          extraTransportationCost: newCost,
                          totalAmount: newTotal,
                          dueAmount: Number(
                            (newTotal - buyFormData.advanceAmount).toFixed(2)
                          ),
                        });
                      }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onKeyDown={(e) => {
                      // Allow only numeric keys, decimal, and navigation keys (no arrow keys)
                      const allowedKeys = [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Enter",
                        "Home",
                        "End",
                      ];
                      if (
                        !allowedKeys.includes(e.key) &&
                        !/^\d$/.test(e.key) &&
                        e.key !== "."
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "textfield",
                      appearance: "none",
                    }}
                    placeholder="0"
                  />
                </div>

                {/* Advance Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Advance Amount
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={buyFormData.advanceAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numeric input
                      if (/^\d*\.?\d*$/.test(value)) {
                        const advance = Number(value) || 0;
                        setBuyFormData({
                          ...buyFormData,
                          advanceAmount: Number(advance.toFixed(2)),
                          dueAmount: Number(
                            (buyFormData.totalAmount - advance).toFixed(2)
                          ),
                        });
                      }
                    }}
                    onWheel={(e) => e.preventDefault()}
                    onKeyDown={(e) => {
                      // Allow only numeric keys, decimal, and navigation keys (no arrow keys)
                      const allowedKeys = [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Enter",
                        "Home",
                        "End",
                      ];
                      if (
                        !allowedKeys.includes(e.key) &&
                        !/^\d$/.test(e.key) &&
                        e.key !== "."
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "textfield",
                      appearance: "none",
                    }}
                    placeholder="0"
                  />
                </div>

                {/* Due Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Due Amount
                  </label>
                  <input
                    type="number"
                    value={buyFormData.dueAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-[#295A47] mb-2">
                    Payment Type
                  </label>
                  <select
                    value={buyFormData.paymentType}
                    onChange={(e) =>
                      setBuyFormData({
                        ...buyFormData,
                        paymentType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                {/* Transaction ID and QR Code (only for UPI payment) */}
                {buyFormData.paymentType === "UPI" && (
                  <div>
                    <label className="block text-sm font-medium text-[#295A47] mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={buyFormData.transactionId}
                      onChange={(e) =>
                        setBuyFormData({
                          ...buyFormData,
                          transactionId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                      placeholder="Enter transaction ID"
                    />
                    {/* QR Code for UPI Payment */}
                    <div className="mt-4 flex justify-center">
                      <img
                        src="/kayapalat_payment_qr.jpeg"
                        alt="Kayapalat Payment QR Code"
                        className="w-32 h-32 rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0 pt-4">
                  <button
                    onClick={() => {
                      setShowBuyModal(false);
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
                    }}
                    className="w-full sm:flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={completePurchase}
                    className="w-full sm:flex-1 bg-[#295A47] text-white py-3 px-6 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2"
                  >
                    <BadgeIndianRupeeIcon className="w-4 h-4" />
                    <span>Complete Purchase</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartModal;
