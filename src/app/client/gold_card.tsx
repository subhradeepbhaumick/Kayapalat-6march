"use client";

import { CheckCircle, Star, Gift, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function GoldMembershipPage() {
  const [showShare, setShowShare] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const referralLink = "https://kayapalat.co/signup";
  const message = `Join Kayapalat as "Client" and unlock amazing benefits! Sign up here: ${referralLink}`;
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">(
    "online"
  );
  const [contactNumber, setContactNumber] = useState("");
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/client/cashback-payment");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };
  const isGoldApproved = payments.some(
    (p) => p.plan_type === "gold_membership" && p.status === "approved"
  );
  const isGoldPending = payments.some(
    (p) => p.plan_type === "gold_membership" && p.status === "pending"
  );
  const handleMembershipPayment = async () => {
    if (paymentMethod === "online" && !transactionProof) {
      toast.error("Upload payment proof");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      const amount = 5000;
      const gst = 0; // or 0.18 * amount if needed
      const total = amount;
      formData.append("plan_type", "gold_membership");
      formData.append("amount", "5000");
      formData.append("payment_method", paymentMethod);
      formData.append("contact_number", contactNumber);

      if (transactionProof) {
        formData.append("transaction_proof", transactionProof);
      }
      if (!contactNumber) {
        toast.error("Enter contact number");
        return;
      }
      const res = await fetch("/api/client/cashback-payment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Membership purchased successfully ✅");
        setShowCheckout(false);
        setTransactionProof(null);
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white p-6 md:p-10">
      {/* 🔶 Header */}
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-center relative">
  <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-wider">
    KAYAPALAT GOLD MEMBERSHIP
  </span>

  <span className="block text-xl md:text-2xl mt-2 text-gray-600 font-medium tracking-normal">
    Exclusive Lifetime Benefits Card
  </span>
</h1>
        <p className="mt-4 text-base md:text-lg text-gray-600 px-4">
          Invest once. Save forever. Unlock premium benefits for your home &
          lifestyle.
        </p>
      </div>
      {isGoldApproved && (
        <div className="max-w-6xl mx-auto mt-6 bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-center font-medium">
          🎉 Your membership card has been issued successfully after verifying
          your payment details. It will be handover in the showroom.
        </div>
      )}
      {isGoldPending && (
        <div className="max-w-6xl mx-auto mt-6 bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-xl text-center font-medium">
          ⏳ Thank you for Your Gold Card Request. It is on the process, you can contact Mr. John
          for further details - 9830477791
        </div>
      )}
      {/* 🔶 Card Highlight */}
      <div
        id="purchase-section"
        className="max-w-5xl mx-auto mt-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 opacity-20 text-7xl sm:text-8xl md:text-9xl font-bold pointer-events-none">
          GOLD
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold">Gold Membership Card</h2>
        <p className="mt-2 text-lg">Lifetime Validity</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-4xl font-bold">₹5000</div>
          <span className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-semibold">
            One-time Payment
          </span>
        </div>

        <button
          onClick={() => setShowCheckout(true)}
          disabled={submitting} // 👈 prevents multiple clicks
          className="mt-8 w-full sm:w-auto bg-black text-white px-8 py-3 rounded-xl font-semibold 
             hover:bg-yellow-500 hover:text-black
             hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,215,0,0.6)]
             transition-all duration-300 active:scale-95
             disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Processing..." : "Purchase Now"}
        </button>
      </div>
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-y-auto flex justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-yellow-600 mb-3">
                💳 Gold Membership Checkout
              </h2>

              {/* Price */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm">
                Membership Price: <b>₹5000</b> (One-time)
              </div>

              {/* ✅ ADD HERE */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
               focus:outline-none focus:ring-2 focus:ring-yellow-500 
               text-sm"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Used for payment verification
                </p>
              </div>
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

              {/* ONLINE SECTION */}
              {paymentMethod === "online" && (
                <>
                  {/* Bank Details */}
                  <div className="bg-blue-50 border p-3 rounded-lg text-sm mb-4">
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

                  {/* QR */}
                  <div className="flex flex-col items-center mb-4">
                    <p className="text-sm mb-2">Scan QR to Pay</p>
                    <img
                      src="/kayapalat_payment_qr.jpeg"
                      className="w-32 h-32 border rounded-lg"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Payment Proof{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      {/* Hidden Input */}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setTransactionProof(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id="uploadProof"
                      />

                      {/* Upload Box */}
                      <label
                        htmlFor="uploadProof"
                        className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl cursor-pointer 
                 hover:border-yellow-500 hover:bg-yellow-50 transition-all"
                      >
                        <span className="text-sm text-gray-600">
                          {transactionProof ? "Change file" : "Upload file"}
                        </span>

                        <span className="text-xs text-gray-400">
                          JPG / PNG / PDF
                        </span>
                      </label>
                    </div>

                    {/* File Preview */}
                    {transactionProof && (
                      <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                        <p className="text-sm text-green-700 truncate">
                          ✅ {transactionProof.name}
                        </p>

                        <button
                          onClick={() => setTransactionProof(null)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-gray-300 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleMembershipPayment}
                  disabled={submitting}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg disabled:opacity-50 "
                >
                  {submitting ? "Submitting..." : "Submit Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔶 Benefits Section */}
      <div className="max-w-6xl mx-auto mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-2 sm:px-0">
        {/* Benefit 1 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
          <div className="flex items-center gap-3">
            <Gift className="text-yellow-500" />
            <h3 className="text-lg sm:text-xl font-semibold">Flat 2% Discount</h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
            Get a flat 2% discount on every product you purchase from Kayapalat
            showroom.
          </p>
        </div>

        {/* Benefit 2 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
          <div className="flex items-center gap-3">
            <Star className="text-yellow-500" />
            <h3 className="text-lg sm:text-xl font-semibold">
              Flat 1% Discount on Interior Work
            </h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
            Enjoy exclusive discount on interior project budget — Get a flat 1% discount on your project quotation value.
          </p>
        </div>

        {/* Benefit 3 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-yellow-500" />
            <h3 className="text-lg sm:text-xl font-semibold">Lifetime Validity</h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
            Pay once and enjoy benefits forever — no renewal, no hidden charges.
          </p>
        </div>

        {/* Benefit 4 */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-yellow-500" />
            <h3 className="text-lg sm:text-xl font-semibold">High ROI</h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
            Recover your ₹5000 quickly through savings on purchases and interior
            payments.
          </p>
        </div>
      </div>

      {/* 🔶 Why Buy Section */}
      <div className="max-w-5xl mx-auto mt-12 sm:mt-16 text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Why Should You Buy This?
        </h2>

        <p className="mt-4 text-gray-600 text-base sm:text-lg">
          If you're planning purchases or interior work, this card pays for
          itself — and keeps saving money every time.
        </p>

        <div className="mt-8 bg-yellow-100 p-5 sm:p-6 rounded-2xl">
          <p className="text-lg font-semibold text-gray-800">💡 Example:</p>
          <p className="mt-2 text-sm sm:text-base text-gray-700">
            Spend ₹2,50,000 → Save ₹5,000 instantly (2%) → Your card cost is
            recovered!
          </p>
        </div>
      </div>

      {/* 🔶 Referral Push */}
      <div className="max-w-5xl mx-auto mt-12 sm:mt-16 bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center mx-2 sm:mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Share & Help Your Friends Save 💛
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600">
          Recommend this card to your friends & family so they can also enjoy
          exclusive benefits.
        </p>

        <button
          onClick={() => setShowShare(true)}
          className="mt-6 w-full sm:w-auto bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition"
        >
          Refer Now
        </button>
      </div>
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800">
              Share with Friends
            </h3>

            {/* 🔴 Important Message */}
            <p className="mt-3 text-red-600 text-sm font-medium">
              Through this link tell your friends to join themselves in
              Kayapalat website as a "Client" and take the opportunity.
            </p>

            {/* 🔗 Link Box */}
            <div className="mt-4 flex items-center border rounded-lg overflow-hidden">
              <input
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 outline-none text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  alert("Link copied!");
                }}
                className="bg-gray-800 text-white px-4 py-2 text-sm"
              >
                Copy
              </button>
            </div>

            {/* 📤 Share Options */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white text-center py-2 rounded-lg"
              >
                WhatsApp
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${referralLink}`}
                target="_blank"
                className="bg-blue-600 text-white text-center py-2 rounded-lg"
              >
                Facebook
              </a>

              {/* Gmail */}
              <a
                href={`mailto:?subject=Join Kayapalat&body=${encodeURIComponent(
                  message
                )}`}
                className="bg-red-500 text-white text-center py-2 rounded-lg"
              >
                Gmail
              </a>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowShare(false)}
              className="mt-6 w-full border py-2 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* 🔶 Final CTA */}
      <div className="max-w-4xl mx-auto mt-12 sm:mt-16 text-center pb-10 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Start Saving Today 🚀
        </h2>

        <button
          onClick={() => {
            document
              .getElementById("purchase-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-6 w-full sm:w-auto bg-black text-white px-10 py-4 text-lg rounded-xl 
             transition-all duration-300 
             hover:bg-gray-900 
             hover:scale-105 
             hover:shadow-2xl 
             active:scale-95"
        >
          Buy Gold Membership Card
        </button>
      </div>
    </div>
  );
}
