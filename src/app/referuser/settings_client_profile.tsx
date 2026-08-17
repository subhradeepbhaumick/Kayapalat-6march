

"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, X } from "lucide-react";
import { useSession } from 'next-auth/react';
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
  pickup_type: "For Sale" | "For Commission"; // New field for pick up type
}

const ClientPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
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
    pickup_type: "For Commission", // Default selected
  });

  const [agentDBInfo, setAgentDBInfo] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) return;

    const fetchClients = async () => {
      try {
        const res = await fetch(`/api/lead?agent_id=${session.user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });

        if (res.status === 401) {
          console.log("Unauthorized, session expired");
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setClients(data);
        } else {
          console.error("Failed to fetch clients");
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };

    fetchClients();
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/referuser/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });

        if (res.status === 401) {
          console.log("Unauthorized, session expired");
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setAgentDBInfo(data.agent || null);
        }

      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (agentDBInfo && (!agentDBInfo.representativeId || agentDBInfo.representativeId.trim() === '' || agentDBInfo.representativeId === agentDBInfo.agent_id)) {
      setShowReminderModal(true);
    }
  }, [agentDBInfo]);
  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_phone) return;

    // Validation alerts
    if (!/^\d{10}$/.test(formData.client_phone)) {
      alert('Phone should contain exactly 10 digits');
      return;
    }

    const today = new Date();
    const lead_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    const newClient = {
      ...formData,
      lead_date,
      agent_id: session?.user?.id || null, // <-- automatically pass logged-in agent
      admin_id: session?.user?.id || null  // optional, if you want admin_id also
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok) {
        // Fetch updated list from server
        const fetchRes = await fetch(`/api/lead?agent_id=${session?.user?.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });
        if (fetchRes.ok) {
          const updatedClients = await fetchRes.json();
          setClients(updatedClients);
        }
        setFormData({
          client_name: "",
          email: "",
          client_phone: "",
          whatsapp: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          lead_date: "",
          pickup_type: "For Commission", // Reset to default
        });
        setShowForm(false);
        setShowPopup(true);
      } else {
        console.error(result);
        alert("Failed to save client: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving client");
    }
  };



  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      client_name: "",
      email: "",
      client_phone: "",
      whatsapp: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      lead_date: "",
      pickup_type: "For Commission",
    });
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center text-green-900 mb-8">
        Client Details Management
      </h1>

      {/* Add Client Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-500 text-white px-2 py-2 rounded-2xl hover:bg-gray-400 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Client
        </button>
      </div>

      {/* Client Form */}
      {showForm && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200 relative">
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Add Client Details
          </h2>
          {/* Pick Up Type */}
          <div className="md:col-span-2 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              Pick Up Type
            </label>

            <div className="flex justify-center">
              <div className="inline-flex rounded-lg border border-gray-300 bg-gray-100 p-1 shadow-sm">
                <label
                  className={`px-6 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ${formData.pickup_type === "For Sale"
                      ? "bg-red-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <input
                    type="radio"
                    name="pickup_type"
                    value="For Sale"
                    checked={formData.pickup_type === "For Sale"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  For Sale
                </label>

                <label
                  className={`px-6 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ${formData.pickup_type === "For Commission"
                      ? "bg-red-600 text-white shadow"
                      : "text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <input
                    type="radio"
                    name="pickup_type"
                    value="For Commission"
                    checked={formData.pickup_type === "For Commission"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  For Commission
                </label>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Client Name */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Client Name *</label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="Client Name"
                required
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email ID"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="WhatsApp Number"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Address"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* City */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">City / Town</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City / Town"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pincode */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Pincode"
                className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>




            <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
              <button
                type="submit"
                className="bg-red-500 text-white px-3 py-2 rounded-2xl hover:bg-gray-400 transition"
              >
                Submit Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Congratulations Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Congratulations!</h2>
            <p className="text-gray-700 mb-6">You have successfully referred a new client.</p>
            <button
              onClick={closePopup}
              className="bg-red-500 text-white px-4 py-2 rounded-2xl hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Reminder</h3>
            <p className="text-gray-600 mb-6">
              You do not have a Representative ID in your profile yet.
              Do not start referring until you get your Representative ID,
              otherwise you will not get any reward.
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  // redirect to My Profile by switching tabs
                  window.dispatchEvent(new CustomEvent("goToMyProfile"));
                }}
                className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Table */}
      <div className="max-w-6xl mx-auto mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
          Client Records
        </h2>

        <div className="overflow-x-auto">
          <table className=" min-w-full border border-gray-300">
            <thead className="bg-[#d7e7d0]">
              <tr>
                <th className="border px-1 py-2 text-center">Appointment ID</th>
                <th className="border px-4 py-2 text-center">Client Name</th>
                <th className="border px-4 py-2 text-center">Email</th>
                <th className="border px-4 py-2 text-center">Phone</th>
                <th className="border px-4 py-2 text-center">WhatsApp</th>
                <th className="border px-4 py-2 text-center">Address</th>
                <th className="border px-4 py-2 text-center">City</th>
                <th className="border px-4 py-2 text-center">State</th>
                <th className="border px-4 py-2 text-center">Pincode</th>
                <th className="border px-4 py-2 text-center">Lead Date</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr className="hover:bg-gray-50">
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                  <td className="border px-4 py-2 text-center italic text-gray-400">null</td>
                </tr>
              ) : (
                clients.map((client, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{client.appointment_id}</td>
                    <td className="border px-4 py-2">{client.client_name}</td>
                    <td className="border px-4 py-2">{client.email || <span className="italic text-gray-400">null</span>}</td>
                    <td className="border px-4 py-2">{client.client_phone}</td>
                    <td className="border px-4 py-2">{client.whatsapp}</td>
                    <td className="border px-4 py-2">{client.address}</td>
                    <td className="border px-4 py-2">{client.city}</td>
                    <td className="border px-4 py-2">{client.state}</td>
                    <td className="border px-4 py-2">{client.pincode}</td>
                    <td className="border px-4 py-2">{formatDate(client.lead_date)}</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
