"use client";

import React, { useState, useEffect, useRef } from "react";
import { Share2, Users, Gift, PlusCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Client {
  client_name: string;
  email?: string;
  client_phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lead_date: string;
  appointment_id?: string;
}

const ReferAndEarnPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const formRef = useRef<HTMLDivElement | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const [formData, setFormData] = useState<Client>({
    client_name: "",
    email: "",
    client_phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    lead_date: "",
  });

  // ✅ Fetch Clients
  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;

    const fetchClients = async () => {
      const res = await fetch(`/api/client/leads?agent_id=${session.user.id}`, {
        credentials: "include",
      });

      if (res.status === 401) return router.push("/login");

      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    };

    fetchClients();
  }, [session?.user?.id, status]);

  // ✅ Scroll handler
  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  // ✅ Form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(formData.client_phone)) {
      alert("Phone must be 10 digits");
      return;
    }

    const lead_date = new Date().toISOString().split("T")[0];

    const newClient = {
      ...formData,
      lead_date,
      agent_id: session?.user?.id,
    };

    const res = await fetch("/api/client/leads", {
      method: "POST",
      body: JSON.stringify(newClient),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (res.ok) {
      const updated = await fetch(
        `/api/client/leads?agent_id=${session?.user?.id}`
      );
      setClients(await updated.json());
      setShowPopup(true);
      setShowForm(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      {/* ✅ HERO SECTION */}
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#295A47] mb-3 leading-tight">
          Refer & Earn Dashboard
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Refer clients & earn commission easily 🚀
        </p>

        <button
          onClick={scrollToForm}
          className="mt-4 sm:mt-6 w-full sm:w-auto bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-[#295A47] transition-colors"
        >
          Start Referring Now
        </button>
      </div>

      {/* ✅ HOW IT WORKS */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#295A47] mb-6 text-center">
          How It Works
        </h2>

        <div className="text-center p-4 sm:p-5 bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-white" />
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">
              1. Share Client Details
            </h3>

            <p className="text-gray-600 text-sm">
              Fill in your client’s basic details like name, phone number, and
              location using the form below. This helps our team understand the
              requirement and connect with them quickly.
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
              2. We Contact & Close Deal
            </h3>

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Our Kayapalat team will reach out to your referred client,
              understand their needs, and handle the complete process — from
              discussion to project completion.
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#295A47] rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
              3. Earn Your Reward
            </h3>

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Once the client confirms and the deal is completed, you will
              receive your commission or reward directly from us — simple and
              hassle-free!
            </p>
          </div>
          </div>
        </div>
      </div>
      {/* ✅ COMMISSION EXAMPLE */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto my-8 text-center border-l-4 border-[#295A47]">
        <h3 className="text-xl font-bold text-[#295A47] mb-3">
          💰 How Much Can You Earn?
        </h3>

        <p className="text-gray-600 mb-4">
          You earn a commission when your referred clients complete their
          project.
        </p>

        {/* 🔹 Example 1 */}
        <div className="bg-gray-50 p-4 rounded-lg text-left mb-4">
          <p className="text-sm text-gray-700 font-semibold mb-2">
            Example 1: Basic Commission
          </p>

          <p className="text-sm text-gray-700">
            Project Budget: <span className="font-semibold">₹15,00,000</span>
          </p>

          <p className="text-sm text-gray-700">
            Commission Rate: <span className="font-semibold">3%</span>
          </p>

          <p className="text-sm text-gray-700 mt-2">
            Your Earnings:
            <span className="font-bold text-green-600 ml-1">₹45,000 🎉</span>
          </p>

          <p className="text-xs text-red-500 mt-1 font-medium">
            *This amount will be directly credited to your bank account
          </p>
        </div>

        {/* 🔹 Example 2 (Advanced Benefit) */}
        <div className="bg-[#f0f7f4] p-4 rounded-lg text-left border border-[#295A47]">
          <p className="text-sm text-gray-700 font-semibold mb-2">
            Example 2: Smart Earnings (3% + Extra 6% Benefit)
          </p>

          <p className="text-sm text-gray-700">
            Commission Earned: <span className="font-semibold">₹45,000</span>
          </p>

          <p className="text-sm text-gray-700">
            If you invest this amount in Kayapalat showroom purchase:
          </p>

          <p className="text-sm text-gray-700 mt-2">
            Extra Discount:{" "}
            <span className="font-semibold">6% of ₹45,000 = ₹2,700</span>
          </p>

          <p className="text-sm text-gray-700 mt-2">
            <span className="font-semibold">Total Benefit:</span>
            <span className="font-bold text-green-600 ml-1">₹47,700 🚀</span>
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          *Refer more, earn more, and maximize your benefits by reinvesting
          smartly 💡
        </p>
      </div>
      {/* ✅ ADD CLIENT BUTTON */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="group bg-red-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 mx-auto 
               transition-all duration-300 ease-in-out
               hover:bg-[#295A47] hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <PlusCircle className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          Add Client
        </button>
      </div>

      {/* ✅ FORM */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-white p-6 rounded-lg max-w-3xl mx-auto mb-8"
        >
          <button onClick={() => setShowForm(false)} className="float-right">
            <X />
          </button>

          <h2 className="text-xl mb-4 text-center">Client Form</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <input
              name="client_name"
              placeholder="Name *"
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"            />

            <input
              name="email"
              placeholder="Email (optional)"
              onChange={handleChange}
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />

            <input
              name="client_phone"
              placeholder="Phone *"
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />

            <input
              name="whatsapp"
              placeholder="WhatsApp (optional)"
              onChange={handleChange}
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />

            <input
              name="city"
              placeholder="City (optional)"
              onChange={handleChange}
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />

            <input
              name="state"
              placeholder="State (optional)"
              onChange={handleChange}
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              className="w-full p-2.5 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#295A47]"
            />
            <div className="col-span-1 sm:col-span-2 text-center">
              <button
                type="submit"
                className="w-full sm:w-auto bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-[#295A47] transition-all"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-lg text-center">
            <h2 className="text-green-600 text-xl">Success 🎉</h2>
            <p>Client Added</p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ✅ CLIENT TABLE */}
      {/* ✅ CLIENT DATA */}
<div className="bg-white p-4 sm:p-6 rounded-lg max-w-6xl mx-auto">
  <h2 className="text-xl mb-4 text-center">Client Records</h2>

  {/* ✅ MOBILE VIEW (CARDS) */}
  <div className="block sm:hidden space-y-4">
    {clients.length === 0 ? (
      <p className="text-center text-gray-400 italic">No records found</p>
    ) : (
      clients.map((c, i) => (
        <div
          key={i}
          className="border rounded-lg p-4 shadow-sm bg-gray-50"
        >
          <p className="font-semibold text-[#295A47] text-lg">
            {c.client_name}
          </p>

          <p className="text-sm text-gray-600">
            📞 {c.client_phone}
          </p>

          {c.email && (
            <p className="text-sm text-gray-600">📧 {c.email}</p>
          )}

          {c.whatsapp && (
            <p className="text-sm text-gray-600">💬 {c.whatsapp}</p>
          )}

          <p className="text-sm text-gray-600">
            📍 {c.city || "-"}, {c.state || "-"} - {c.pincode || "-"}
          </p>

          <p className="text-sm text-gray-600">
            🏠 {c.address || "-"}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Lead:{" "}
            {c.lead_date
              ? new Date(c.lead_date).toLocaleDateString("en-IN")
              : "-"}
          </p>

          {c.appointment_id && (
            <p className="text-xs text-blue-600">
              Appointment: {c.appointment_id}
            </p>
          )}
        </div>
      ))
    )}
  </div>

  {/* ✅ DESKTOP TABLE */}
  <div className="hidden sm:block overflow-x-auto">
    <table className="w-full border text-sm">
      <thead className="bg-[#d7e7d0]">
        <tr>
          <th className="border px-3 py-2">Name</th>
          <th className="border px-3 py-2">Email</th>
          <th className="border px-3 py-2">Phone</th>
          <th className="border px-3 py-2">WhatsApp</th>
          <th className="border px-3 py-2">City</th>
          <th className="border px-3 py-2">State</th>
          <th className="border px-3 py-2">Pincode</th>
          <th className="border px-3 py-2">Address</th>
          <th className="border px-3 py-2">Lead Date</th>
          <th className="border px-3 py-2">Appointment ID</th>
        </tr>
      </thead>

      <tbody>
        {clients.map((c, i) => (
          <tr key={i} className="text-center border-t hover:bg-gray-50">
            <td className="border px-3 py-2">{c.client_name}</td>
            <td className="border px-3 py-2">{c.email || "null"}</td>
            <td className="border px-3 py-2">{c.client_phone}</td>
            <td className="border px-3 py-2">{c.whatsapp || "null"}</td>
            <td className="border px-3 py-2">{c.city || "null"}</td>
            <td className="border px-3 py-2">{c.state || "null"}</td>
            <td className="border px-3 py-2">{c.pincode || "null"}</td>
            <td className="border px-3 py-2">{c.address || "null"}</td>
            <td className="border px-3 py-2">
              {c.lead_date
                ? new Date(c.lead_date).toLocaleDateString("en-IN")
                : "null"}
            </td>
            <td className="border px-3 py-2">
              {c.appointment_id || "null"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
};

export default ReferAndEarnPage;
