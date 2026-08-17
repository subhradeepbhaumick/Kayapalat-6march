"use client";
import React, { useState, useEffect } from "react";
interface Props {
    open: boolean;
    onClose: () => void;
    lead: any;
}
const SiteVisitModal = ({
    open,
    onClose,
    lead,
}: Props) => {
    const [siteVisits, setSiteVisits] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editVisit, setEditVisit] = useState<any>({});
    const formatDateTime = (dateString: string) => {
        if (!dateString) return "";

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };
    const [form, setForm] = useState({
        client_name: "",
        property: "",
        budget: "",
        visit_from: "",
        visit_to: "",
    });
    useEffect(() => {
        if (lead) {
            setForm((prev) => ({
                ...prev,
                client_name: lead.name || "",
            }));
        }
    }, [lead]);
    const fetchVisits = async () => {
        try {
            const res = await fetch(
                `/api/metro/site-visit?client_id=${lead.user_id}`
            );
            const data = await res.json();
            if (data.success) {
                setSiteVisits(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        if (lead?.user_id) {
            fetchVisits();
        }
    }, [lead]);
    const toLocalDatetimeValue = (dateString: string) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
            `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#295A47]">
                        Site Visit Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-xl"
                    >
                        ✕
                    </button>
                </div>
                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block mb-2">
                            Client Name
                        </label>
                        <input
                            value={form.client_name}
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Property
                        </label>
                        <input
                            value={form.property}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    property: e.target.value,
                                })
                            }
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Budget
                        </label>
                        <input
                            value={form.budget}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    budget: e.target.value,
                                })
                            }
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Visit From
                        </label>
                        <input
                            type="datetime-local"
                            value={form.visit_from}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    visit_from: e.target.value,
                                })
                            }
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">
                            Visit To
                        </label>
                        <input
                            type="datetime-local"
                            value={form.visit_to}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    visit_to: e.target.value,
                                })
                            }
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                </div>
                <div className="flex justify-end mb-8">
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch("/api/metro/site-visit", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        client_id: lead.user_id,
                                        property: form.property,
                                        budget: form.budget,
                                        visit_from: form.visit_from,
                                        visit_to: form.visit_to,
                                    }),
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                    alert(data.message);
                                    return;
                                }
                                alert("Site Visit Saved");
                                setForm({
                                    client_name: lead.name,
                                    property: "",
                                    budget: "",
                                    visit_from: "",
                                    visit_to: "",
                                });
                                fetchVisits();
                            } catch (error) {
                                console.error(error);
                                alert("Failed");
                            }
                        }}
                        className="bg-[#295A47] text-white px-6 py-3 rounded-xl"
                    >
                        Save Visit
                    </button>
                </div>
                {/* Site Visit Table */}
                <div>
                    <h3 className="font-bold text-lg mb-4">
                        Previous Site Visits
                    </h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#EEF6EE]">
                                <th className="p-3 text-center">
                                    Property
                                </th>
                                <th className="p-3 text-center">
                                    Budget
                                </th>
                                <th className="p-3 text-center">
                                    From
                                </th>
                                <th className="p-3 text-center">
                                    To
                                </th>
                                <th className="p-3 text-center">
                                    Status
                                </th>
                                <th className="p-3 text-center">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {siteVisits.length > 0 ? (
                                siteVisits.map((visit) => (
                                    <tr key={visit.id} className="border-b">
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <input
                                                    value={editVisit.property}
                                                    onChange={(e) =>
                                                        setEditVisit({
                                                            ...editVisit,
                                                            property: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            ) : (
                                                visit.property
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <input
                                                    value={editVisit.budget}
                                                    onChange={(e) =>
                                                        setEditVisit({
                                                            ...editVisit,
                                                            budget: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            ) : (
                                                visit.budget
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <input
                                                    type="datetime-local"
                                                    value={editVisit.visit_from || ""}
                                                    onChange={(e) =>
                                                        setEditVisit({
                                                            ...editVisit,
                                                            visit_from: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            ) : (
                                                formatDateTime(visit.visit_from)
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <input
                                                    type="datetime-local"
                                                    value={editVisit.visit_to || ""}
                                                    onChange={(e) =>
                                                        setEditVisit({
                                                            ...editVisit,
                                                            visit_to: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            ) : (
                                                formatDateTime(visit.visit_to)
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <select
                                                    value={editVisit.status || "Pending"}
                                                    onChange={(e) =>
                                                        setEditVisit({
                                                            ...editVisit,
                                                            status: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded px-2 py-1"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Done">Done</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            ) : (
                                                visit.status || "Pending"
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingId === visit.id ? (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(
                                                                "/api/metro/site-visit",
                                                                {
                                                                    method: "PUT",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                    },
                                                                    body: JSON.stringify(editVisit),
                                                                }
                                                            );
                                                            const data = await res.json();
                                                            if (!res.ok) {
                                                                alert(data.message);
                                                                return;
                                                            }
                                                            alert("Updated");
                                                            setEditingId(null);
                                                            fetchVisits();
                                                        } catch (error) {
                                                            console.error(error);
                                                        }
                                                    }}
                                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                                >
                                                    Save
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingId(visit.id);
                                                        + setEditVisit({
                                                            ...visit,
                                                            visit_from: toLocalDatetimeValue(visit.visit_from),
                                                            visit_to: toLocalDatetimeValue(visit.visit_to),
                                                        });
                                                    }}
                                                    className="bg-[#295A47] text-white px-3 py-1 rounded"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center p-6 text-gray-500"
                                    >
                                        No Site Visits Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default SiteVisitModal;