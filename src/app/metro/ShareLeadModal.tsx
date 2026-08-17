import React, { useState } from 'react';
import {
    X,
    Search,
    Filter,
    Share2
} from 'lucide-react';
import { useEffect } from "react";
interface ShareLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
}
interface MetroManager {
    user_id: string;
    name: string;
}
interface Lead {
    appointment_id: string;
    lead_id: string;
    client_name: string;
    client_phone: string;
    project_name: string;
    cold_call_status: string;
    created_at: string;
}
const ShareLeadModal: React.FC<ShareLeadModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showEntries, setShowEntries] = useState("10");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);
    const [metroManagers, setMetroManagers] = useState<MetroManager[]>([]);
    const [selectedMetroManager, setSelectedMetroManager] = useState("");
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [sharing, setSharing] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        const fetchLeads = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/metro/share-leads", {
                    credentials: "include",
                });
                const data = await res.json();
                console.log("API Response:", data);
                console.log("Leads:", data.leads);
                console.log("Metro Managers:", data.metroManagers);
                if (res.ok) {
                    setLeads(data.leads);
                    setMetroManagers(data.metroManagers || []);
                    if (data.metroManagers?.length > 0) {
                        setSelectedMetroManager(data.metroManagers[0].user_id);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [isOpen]);
    if (!isOpen) return null;
    const toggleLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(x => x !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };
    const handleShareLeads = async () => {
        if (selectedLeads.length === 0) return;

        const confirmed = window.confirm(
            `Are you sure you want to share ${selectedLeads.length} lead(s) with this Metro Sales Manager?`
        );

        if (!confirmed) return;

        try {
            setSharing(true);

            const response = await fetch("/api/metro/share-leads", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    appointmentIds: selectedLeads,
                    adminId: selectedMetroManager,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Leads shared successfully.");

                // Remove shared leads from table
                setLeads((prev) =>
                    prev.filter(
                        (lead) =>
                            !selectedLeads.includes(lead.appointment_id)
                    )
                );

                setSelectedLeads([]);
            } else {
                alert(data.message || "Failed to share leads.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        } finally {
            setSharing(false);
        }
    };
    const handleSelectAll = () => {
        if (
            filteredLeads.length > 0 &&
            filteredLeads.every((lead) =>
                selectedLeads.includes(lead.appointment_id)
            )
        ) {
            setSelectedLeads(
                selectedLeads.filter(
                    (id) =>
                        !filteredLeads.some(
                            (lead) => lead.appointment_id === id
                        )
                )
            );
        } else {
            setSelectedLeads([
                ...new Set([
                    ...selectedLeads,
                    ...filteredLeads.map((lead) => lead.appointment_id),
                ]),
            ]);
        }
    };
    const filteredLeads = leads
        .filter((lead) => {
            // ---------------- Search ----------------
            const searchText = search.trim().toLowerCase();

            const matchesSearch =
                searchText === "" ||
                lead.lead_id?.toLowerCase().includes(searchText) ||
                lead.client_name?.toLowerCase().includes(searchText) ||
                lead.client_phone?.toLowerCase().includes(searchText) ||
                lead.project_name?.toLowerCase().includes(searchText) ||
                lead.cold_call_status?.toLowerCase().includes(searchText) ||
                lead.appointment_id?.toLowerCase().includes(searchText);

            // ---------------- Status ----------------
            const matchesStatus =
                status === "all" ||
                lead.cold_call_status === status;

            // ---------------- Date ----------------
            const createdDate = new Date(lead.created_at);

            const matchesFromDate =
                !fromDate || createdDate >= new Date(fromDate);

            const toDateObj = new Date(toDate);
            toDateObj.setHours(23, 59, 59, 999);

            const matchesToDate =
                !toDate || createdDate <= toDateObj;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesFromDate &&
                matchesToDate
            );
        })
        .slice(0, Number(showEntries));
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h2 className="text-2xl font-bold text-[#295A47]">
                        Share Leads
                    </h2>
                    <button onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Search */}
                    <div className="relative mb-5">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Lead ID, Client Name, Phone or Project..."
                            className="w-full border rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#295A47] outline-none"
                        />
                    </div>
                    {/* Filters */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="text-sm font-medium">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full mt-1 border rounded-lg p-2"
                            >
                                <option value="all">All Status</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="Responding">Responding</option>
                                <option value="Interested">Interested</option>
                                <option value="Prospect">Prospect</option>
                                <option value="Confirmed">Confirmed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full mt-1 border rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Show Entries
                            </label>
                            <select
                                value={showEntries}
                                onChange={(e) => setShowEntries(e.target.value)}
                                className="w-full mt-1 border rounded-lg p-2"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                    {/* Share To */}
                    <div className="bg-[#F5F8F6] border-l-4 border-[#295A47] rounded-lg p-4 mb-6">
                        <div className="text-lg font-semibold text-[#295A47] mb-3">
                            Share To
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Metro Sales Manager
                        </label>

                        <select
                            value={selectedMetroManager}
                            onChange={(e) => setSelectedMetroManager(e.target.value)}
                            className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                        >
                            {metroManagers.length === 0 ? (
                                <option value="">No Metro Manager Found</option>
                            ) : (
                                metroManagers.map((manager) => (
                                    <option
                                        key={manager.user_id}
                                        value={manager.user_id}
                                    >
                                        {manager.user_id} - {manager.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    {/* Lead Count */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-semibold text-gray-700">
                            Total Leads:{" "}
                            <span className="text-[#295A47]">{leads.length}</span>
                        </div>

                        <div className="text-sm text-gray-500">
                            Showing {filteredLeads.length} of {leads.length}
                        </div>
                    </div>
                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredLeads.length > 0 &&
                                                filteredLeads.every((lead) =>
                                                    selectedLeads.includes(lead.appointment_id)
                                                )
                                            }
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-center">Lead ID</th>
                                    <th className="px-4 py-3 text-center">Client Name</th>
                                    <th className="px-4 py-3 text-center">Phone</th>
                                    <th className="px-4 py-3 text-center">Project</th>
                                    <th className="px-4 py-3 text-center">Cold Call Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center ">
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-gray-500 text-center py-8 ">
                                            No leads found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.appointment_id}
                                            className="border-t hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-2xl text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.includes(lead.appointment_id)}
                                                    onChange={() => toggleLead(lead.appointment_id)}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">{lead.lead_id}</td>
                                            <td className="px-4 py-3 text-center">{lead.client_name}</td>
                                            <td className="px-4 py-3 text-center">{lead.client_phone}</td>
                                            <td className="px-4 py-3 text-center">{lead.project_name}</td>
                                            <td className="px-4 py-3 text-center">{lead.cold_call_status}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Footer */}
                <div className="border-t px-6 py-4 flex justify-between items-center">
                    <div className="font-semibold text-gray-700">
                        {selectedLeads.length} Lead(s) Selected
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="border px-5 py-2 rounded-lg hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShareLeads}
                            disabled={
                                selectedLeads.length === 0 ||
                                !selectedMetroManager ||
                                sharing
                            }
                            className="bg-[#295A47] disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Share2 size={18} />
                            {sharing ? "Sharing..." : "Share Selected Leads"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ShareLeadModal;