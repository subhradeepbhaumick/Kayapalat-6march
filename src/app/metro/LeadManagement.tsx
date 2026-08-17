"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Search, Plus, Phone, Mail, MapPin, Eye, EyeOff } from "lucide-react";
import SiteVisitModal from "./SiteVisitModal";
interface Lead {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    whatsapp: string | null;
    occupation: string | null;
    address: string | null;
    role: string;
    created_at: string;
}
const LeadManagement = () => {
    const [search, setSearch] = useState("");
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showLeadDetails, setShowLeadDetails] = useState(false);
    const [selectedLeadForVisit, setSelectedLeadForVisit] =
        useState<Lead | null>(null);
    const [leadForm, setLeadForm] = useState({
        client_name: "",
        client_email: "",
        client_phone: "",
        client_whatsapp: "",
        client_location: "",
        occupation: "",
        password: "",
    });
    const [errors, setErrors] = useState({
        client_name: "",
        client_email: "",
        client_phone: "",
        password: "",
    });
    useEffect(() => {
        fetchLeads();
    }, []);
    const fetchLeads = async () => {
        try {
            const res = await fetch("/api/metro");
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const validateForm = () => {
        const newErrors = {
            client_name: "",
            client_email: "",
            client_phone: "",
            password: "",
        };
        let isValid = true;
        // Client Name
        if (!leadForm.client_name.trim()) {
            newErrors.client_name = "Client name is required";
            isValid = false;
        }
        // Email
        if (!leadForm.client_email.trim()) {
            newErrors.client_email = "Email is required";
            isValid = false;
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.client_email)
        ) {
            newErrors.client_email = "Invalid email address";
            isValid = false;
        }
        // Phone
        if (!leadForm.client_phone.trim()) {
            newErrors.client_phone = "Phone number is required";
            isValid = false;
        } else if (!/^\d{10}$/.test(leadForm.client_phone)) {
            newErrors.client_phone =
                "Phone number must be exactly 10 digits";
            isValid = false;
        }
        // Password
        if (!leadForm.password.trim()) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (leadForm.password.length < 6) {
            newErrors.password =
                "Password must be at least 6 characters";
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showSiteVisitModal, setShowSiteVisitModal] = useState(false);
    const [editForm, setEditForm] = useState({
        user_id: "",
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        occupation: "",
        address: "",
        password: "",
    });
    const filteredLeads = leads.filter(
        (lead) =>
            lead.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.includes(search)
    );
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-md border p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#295A47]">
                    Lead Management
                </h2>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Notice */}
                    <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 max-w-2xl">
                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Important Notice
                            </p>
                            <p className="text-sm text-red-600">
                                After creating a client profile or when a client registers
                                through the dashboard, please update the corresponding Lead
                                ID in the <span className="font-semibold">Lead Track</span>{" "}
                                page with the newly generated <span className="font-semibold">Client ID</span> to ensure accurate record mapping and tracking.
                            </p>
                        </div>
                    </div>

                    {/* Add Lead Button */}
                    <button
                        onClick={() => setShowAddLeadModal(true)}
                        className="bg-[#295A47] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Add Lead
                    </button>
                </div>
            </div>
            <div className="relative mb-6">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                />
                <input
                    type="text"
                    placeholder="Search Lead..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border rounded-xl pl-10 pr-4 py-2 md:py-3 outline-none focus:ring-2 focus:ring-[#295A47] text-sm md:text-base"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#EEF6EE] text-[#295A47]">
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">ID</th>
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">Name</th>
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">Phone</th>
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">Email</th>
                            {/* <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">Site Visit</th> */}
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">City</th>
                            <th className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead) => (
                                <tr key={lead.user_id} className="border-b text-center hover:bg-gray-50">
                                    <td className="p-2 md:p-3 font-medium text-xs md:text-sm">
                                        {lead.user_id}
                                    </td><td className="p-2 md:p-3 font-medium text-xs md:text-sm">{lead.name}</td>
                                    <td className="p-2 md:p-3 text-xs md:text-sm">
                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                            {lead.phone}
                                        </div>
                                    </td>
                                    <td className="p-2 md:p-3 text-xs md:text-sm text-center">
                                        <div className="flex items-center gap-2 whitespace-nowrap text-center">
                                            {lead.email}
                                        </div>
                                    </td>
                                    {/* <td className="p-3">
                                        <button
                                            onClick={() => {
                                                setSelectedLeadForVisit(lead);
                                                setShowSiteVisitModal(true);
                                            }}
                                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                                        >
                                            Check
                                        </button>
                                    </td> */}
                                    <td className="p-2 md:p-3 text-xs md:text-sm">
                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                            {lead.address || "-"}
                                        </div>
                                    </td>
                                    <td className="p-2 md:p-3">
                                        <button
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setEditForm({
                                                    user_id: lead.user_id,
                                                    name: lead.name || "",
                                                    email: lead.email || "",
                                                    phone: lead.phone || "",
                                                    whatsapp: lead.whatsapp || "",
                                                    occupation: lead.occupation || "",
                                                    address: lead.address || "",
                                                    password: "",
                                                });
                                                setShowViewModal(true);
                                            }}
                                            className="bg-[#295A47] text-white px-3 py-1.5 rounded-lg text-xs md:text-sm"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    No leads found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showAddLeadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-start p-4 md:p-6 border-b">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[#295A47]">
                                    Add New Lead
                                </h2>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">
                                    Fields marked with
                                    <span className="text-red-500 font-bold"> *</span>
                                    are mandatory.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddLeadModal(false)}
                                className="text-gray-500 hover:text-red-500 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Form */}
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={leadForm.client_name}
                                        onChange={(e) => {
                                            setLeadForm({
                                                ...leadForm,
                                                client_name: e.target.value,
                                            });
                                            setErrors({
                                                ...errors,
                                                client_name: "",
                                            });
                                        }}
                                        className={`w-full rounded-xl px-4 py-3 border ${errors.client_name
                                            ? "border-red-500"
                                            : "border-gray-300"
                                            }`}
                                    />
                                    {errors.client_name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.client_name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Email<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={leadForm.client_email}
                                        onChange={(e) => {
                                            setLeadForm({
                                                ...leadForm,
                                                client_email: e.target.value,
                                            });
                                            setErrors({
                                                ...errors,
                                                client_email: "",
                                            });
                                        }}
                                        className={`w-full rounded-xl px-4 py-3 border ${errors.client_email
                                            ? "border-red-500"
                                            : "border-gray-300"
                                            }`}
                                    />
                                    {errors.client_email && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.client_email}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Phone<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={leadForm.client_phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            setLeadForm({
                                                ...leadForm,
                                                client_phone: value,
                                            });
                                            setErrors({
                                                ...errors,
                                                client_phone: "",
                                            });
                                        }}
                                        className={`w-full rounded-xl px-4 py-3 border ${errors.client_phone
                                            ? "border-red-500"
                                            : "border-gray-300"
                                            }`}
                                    />
                                    {errors.client_phone && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.client_phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Whatsapp
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={leadForm.client_whatsapp}
                                        onChange={(e) =>
                                            setLeadForm({
                                                ...leadForm,
                                                client_whatsapp: e.target.value.replace(/\D/g, ""),
                                            })
                                        }
                                        className="w-full border rounded-xl px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Location
                                    </label>
                                    <input
                                        type="text"
                                        value={leadForm.client_location}
                                        onChange={(e) =>
                                            setLeadForm({
                                                ...leadForm,
                                                client_location: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-xl px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Occupation
                                    </label>
                                    <input
                                        type="text"
                                        value={leadForm.occupation}
                                        onChange={(e) =>
                                            setLeadForm({
                                                ...leadForm,
                                                occupation: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-xl px-4 py-3"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">
                                        Password<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={leadForm.password}
                                            onChange={(e) => {
                                                setLeadForm({
                                                    ...leadForm,
                                                    password: e.target.value,
                                                });
                                                setErrors({
                                                    ...errors,
                                                    password: "",
                                                });
                                            }}
                                            className={`w-full rounded-xl px-4 py-3 pr-12 border ${errors.password
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#295A47]"
                                        >
                                            {showPassword ? (
                                                <EyeOff size={20} />
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Footer */}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowAddLeadModal(false)}
                                    className="px-5 py-3 rounded-xl border"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!validateForm()) return;
                                        try {
                                            const res = await fetch("/api/metro", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify(leadForm),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                alert(data.message);
                                                return;
                                            }
                                            alert(`Lead Created Successfully (${data.user_id})`);
                                            await fetchLeads();
                                            setShowAddLeadModal(false);
                                            setLeadForm({
                                                client_name: "",
                                                client_email: "",
                                                client_phone: "",
                                                client_whatsapp: "",
                                                client_location: "",
                                                occupation: "",
                                                password: "",
                                            });
                                            setErrors({
                                                client_name: "",
                                                client_email: "",
                                                client_phone: "",
                                                password: "",
                                            });
                                        } catch (error) {
                                            console.error(error);
                                            alert("Failed to create lead");
                                        }
                                    }}
                                    className="bg-[#295A47] text-white px-6 py-3 rounded-xl"
                                >
                                    Save Lead
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showViewModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[#295A47]">
                                    Lead Details
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="text-sm font-medium">User ID</label>
                                <input
                                    value={editForm.user_id}
                                    disabled
                                    className="w-full border rounded-xl p-2.5 md:p-3 bg-gray-100 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Phone</label>
                                <input
                                    value={editForm.phone}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            phone: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Whatsapp</label>
                                <input
                                    value={editForm.whatsapp}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            whatsapp: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Occupation</label>
                                <input
                                    value={editForm.occupation}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            occupation: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Address</label>
                                <input
                                    value={editForm.address}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            address: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Update Password</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep old password"
                                    value={editForm.password}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            password: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl p-2.5 md:p-3 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 md:gap-3 mt-6">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="border px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch("/api/metro", {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify(editForm),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            alert(data.message);
                                            return;
                                        }
                                        alert("Lead Updated Successfully");
                                        await fetchLeads();
                                        setShowViewModal(false);
                                    } catch (error) {
                                        console.error(error);
                                        alert("Update Failed");
                                    }
                                }}
                                className="bg-[#295A47] text-white px-5 py-3 rounded-xl"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <SiteVisitModal
                open={showSiteVisitModal}
                onClose={() => setShowSiteVisitModal(false)}
                lead={selectedLeadForVisit}
            />
        </div>
    );
};
export default LeadManagement;