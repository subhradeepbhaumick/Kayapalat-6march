"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { Gift, Clock, BadgeCheck, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
interface Payment {
  id: number;
  plan_type: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

interface OfferRewardsPageProps {
  setActiveTab: (tab: string) => void;
}

const OfferRewardsPage = ({ setActiveTab }: OfferRewardsPageProps) => {
   const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">(
    "online"
  );
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Cashback calculation
  const cashback = amount ? Math.min(parseFloat(amount) * 0.01, 10000) : 0;
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/client/cashback-payment");

      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };
  const getPaymentStatus = () => {
    return payments.length > 0 ? payments[0] : null; // latest payment
  };
  const handlePaymentSubmit = async () => {
    if (!amount) {
      toast.error("Enter amount");
      return;
    }

    if (paymentMethod === "online" && !transactionProof) {
      toast.error("Upload payment proof");
      return;
    }

    setSubmitting(true);

    try {
      const gst = parseFloat(amount) * 0.18;
      const total = parseFloat(amount) + gst;

      const formData = new FormData();
      formData.append("plan_type", "early_payment");
      formData.append("amount", amount);
      formData.append("gst_amount", gst.toString());
      formData.append("total_amount", total.toString());
      formData.append("payment_method", paymentMethod);

      if (transactionProof) {
        formData.append("transaction_proof", transactionProof);
      }

      const res = await fetch("/api/client/cashback-payment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Payment submitted successfully ✅");

        // reset
        setShowCheckout(false);
        setAmount("");
        setTransactionProof(null);

        // refresh data
        fetchPayments();
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 px-3 py-5 sm:px-6 lg:px-10">
      {/* 🔥 HERO */}
      <div className="bg-gradient-to-r from-[#295A47] to-green-700 text-white rounded-2xl p-5 sm:p-8 lg:p-10 shadow-lg mb-6">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2">
          🎁 Offer & Rewards
        </h1>
        <p className="text-xs sm:text-base opacity-90 max-w-2xl">
          Pay early and unlock exciting cashback rewards directly in your bank
          account.
        </p>
      </div>

      {/* 💰 OFFER CARD */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 mb-6 border-l-4 border-[#295A47]">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <Gift className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
            Early Payment Cashback Offer
          </h2>
        </div>

        <p className="text-gray-600 mb-3 text-xs sm:text-sm lg:text-base">
          Pay your due amount{" "}
          <span className="font-semibold">7 days before the due date </span>
          and earn guaranteed cashback rewards.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm">
          <p className="flex items-center gap-2 text-green-700 font-medium">
            <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            Minimum 1% Cashback Guaranteed
          </p>

          <p className="mt-2 text-green-700">
            💰 Cashback up to <span className="font-semibold">₹10,000</span>
          </p>
        </div>
      </div>

      {/* 📊 EXAMPLES */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
          📊 Cashback Examples
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border">
            <p className="text-sm text-gray-700">
              Project Value: <span className="font-semibold">₹5,00,000</span>
            </p>
            <p className="text-sm mt-1 text-gray-700">
              Cashback: <span className="text-green-600 font-bold">₹5,000</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border">
            <p className="text-sm text-gray-700">
              Project Value: <span className="font-semibold">₹12,00,000</span>
            </p>
            <p className="text-sm mt-1 text-gray-700">
              Cashback:{" "}
              <span className="text-green-600 font-bold">₹10,000</span>
            </p>
          </div>
        </div>
      </div>

      {/* ⏳ CONDITION */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Important Condition
          </h3>
        </div>

        <p className="text-gray-600 text-sm">
          Payment must be completed{" "}
          <span className="font-semibold text-red-500">
            at least 7 days before
          </span>{" "}
          your due date.
        </p>
      </div>

      {/* 💸 BENEFIT */}
      <div className="bg-gradient-to-r from-green-600 to-[#295A47] text-white rounded-2xl p-5 sm:p-8 text-center shadow-lg mb-6">
        <IndianRupee className="mx-auto mb-2 w-6 h-6 sm:w-8 sm:h-8" />
        <h3 className="text-base sm:text-xl font-bold mb-2">
          Direct Cashback Benefit
        </h3>
        <p className="text-sm opacity-90">
          Cashback will be directly credited to your bank account after
          verification.
        </p>
      </div>

      {/* 🚀 CTA */}
      <div className="text-center space-y-3">
        <button
          onClick={() => setActiveTab("InteriorPayments")}
          disabled={getPaymentStatus()?.status === "pending"}
          className="w-full sm:w-auto bg-red-500 text-white px-6 py-3 rounded-xl 
    text-sm sm:text-base font-medium
    hover:bg-[#295A47] transition-all duration-300 
    shadow-md hover:scale-105 active:scale-95
    disabled:opacity-50"
        >
          {getPaymentStatus()?.status === "pending"
            ? "Payment Under Review"
            : "Pay Early & Earn Cashback"}
        </button>

        {/* ✅ STATUS DISPLAY */}
        {/* {getPaymentStatus() && (
          <div className="text-sm">
            {getPaymentStatus()?.status === "pending" && (
              <p className="text-yellow-600 font-medium">
                ⏳ Your payment is under verification
              </p>
            )}

            {getPaymentStatus()?.status === "approved" && (
              <p className="text-green-600 font-medium">
                ✅ Payment approved! Cashback will be credited soon
              </p>
            )}

            {getPaymentStatus()?.status === "rejected" && (
              <p className="text-red-600 font-medium">
                ❌ Payment rejected. Please try again
              </p>
            )}
          </div>
        )} */}
      </div>

      {/* 🧾 CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#295A47] mb-3">
                ⚡ Early Payment Checkout
              </h2>

              {/* Cashback Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
                🎉 Minimum 1% Cashback Guaranteed
                <br />
                💰 Up to ₹10,000
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-sm font-medium">Enter Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Cashback Preview */}
              {amount && (
                <p className="text-sm text-green-600 font-semibold mb-4">
                  You will earn approx ₹{cashback.toLocaleString("en-IN")}{" "}
                  cashback 🎉
                </p>
              )}

              {/* Payment Method */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Payment Method</p>

                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="mr-2"
                  />
                  Online
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="mr-2"
                  />
                  Cash
                </label>
              </div>

              {/* Online Section */}
              {paymentMethod === "online" && (
                <>
                  {/* Bank Details */}
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm mb-4">
                    <p>
                      <b>Bank:</b> HDFC
                    </p>
                    <p>
                      <b>A/C:</b> 50200112029048
                    </p>
                    <p>
                      <b>IFSC:</b> HDFC0005690
                    </p>
                    <p>
                      <b>Name:</b> KAYAPALAT
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">Scan QR to Pay</p>

                    <img
                      src="/kayapalat_payment_qr.jpeg"
                      alt="Payment QR"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-lg shadow-md border"
                    />
                  </div>

                  {/* Upload Proof */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Payment Proof{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition">
                      {/* Upload Icon */}
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1"
                        />
                      </svg>

                      {/* File Input */}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setTransactionProof(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id="fileUpload"
                      />

                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer text-sm text-[#295A47] font-medium hover:underline"
                      >
                        Click to upload or drag & drop
                      </label>

                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPG, PNG, PDF
                      </p>

                      {/* Selected File Name */}
                      {transactionProof && (
                        <p className="mt-3 text-sm text-green-600 font-medium">
                          ✅ {transactionProof.name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-gray-300 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={
                    submitting ||
                    !amount ||
                    (paymentMethod === "online" && !transactionProof)
                  }
                  className="w-full bg-[#295A47] text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Payment"}
                </button>
              </div>

              <p className="text-xs text-red-500 mt-3 text-center">
                *Cashback will be credited after verification
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferRewardsPage;
