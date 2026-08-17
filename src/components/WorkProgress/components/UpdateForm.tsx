"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
    Search,
    X,
    ClipboardList,
    Hash,
    FileText,
    Save,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
const workTypeGroups = {
    Sales: [
        "Builder Meet",
        "Client Meet",
        "Project Visit",
        "Leads Calling",
        "Clients Followup",
        "Quotation Making",
        "Payment Collection",
        "Payment Followup",
        "Builder Followup",
        "Client Visit",
        "Leads Distribution",
        "Leads Management",
        "Sale Confirmation Making",
        "Homeloan Meet",
        "Resale Searching",
        "Site Visit",
        "Site Visit Arranging",
        "New Project Visit",
        "Project Verify",
        "Resale Signing",
        "Builder Signing",
    ],
    HR: [
        "Interview Taking",
        "Candidate Followup",
        "Offer Letter Making",
        "Attendance Checking",
        "Training Deliver",
        "Employee Salary Updating",
        "Sales Team Training",
        "Sales Team Followup",
    ],
    Software: [
        "API Integration",
        "Frontend Make",
        "Deployment",
        "Server Handling",
        "Logic Building",
        "Rearrange Software Logic",
        "Software Testing",
        "Database Management",
        "Project Planning",
        "Github Handle",
        "Pipeline Management",
        "Employee Dashboard Handle",
        "Project Data Management",
    ],
    Marketing: [
        "Website Posting",
        "Ad Posting",
        "SEO Management",
        "Website Offpage Submission",
        "Article Submission",
        "Classified Submission",
        "Social Bookmarking",
        "Forums Posting",
        "Facebook Post",
        "Instagram Post",
        "LinkedIn Post",
        "Pinterest",
        "Youtube",
        "Business Page Create/Posting",
        "Mailer",
        "SMS Blasting",
        "Google Businesspage Create & Link Share",
        "Google Ads.",
    ],
    Design: [
        "Design Making",
        "Design Changes",
        "Design Upload",
        "Client Project Measure",
        "Design Followup/Check",
    ],
    Management: [
        "Office Meeting",
        "Office Meeting/Training",
        "Purchase/Project Coordinator Meeting",
        "PR Meeting and Followup",
        "Agreement Check",
        "Agreement Signing",
        "Invoice Deliver",
        "Vendor Payment",
        "Report Make/Check",
        "Documentation",
        "Banking Work",
        "Group Discussion",
    ],
    Break: [
        "Lunch",
        "Tea Break",
    ],
    Others: [
        "Others",
    ],
};
export default function UpdateForm() {
    const [search, setSearch] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [customType, setCustomType] = useState("");
    const [workNumber, setWorkNumber] = useState("");
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [slotLoading, setSlotLoading] = useState(true);
    const [currentSlot, setCurrentSlot] = useState<any>(null);
    const [slotStatus, setSlotStatus] = useState("");
    const [slotTime, setSlotTime] = useState("");
    const [note, setNote] = useState("");
    const [isUpdated, setIsUpdated] = useState(false);
    const [hasCheckedIn, setHasCheckedIn] = useState(true);
    const [isNoteEdited, setIsNoteEdited] = useState(false);
    const allOptions = useMemo(() => {
        return Object.values(workTypeGroups).flat();
    }, []);
    const filtered = useMemo(() => {
        if (!search.trim()) return allOptions;
        return allOptions.filter((item) =>
            item.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);
    const addType = (value: string) => {
        if (selectedTypes.includes(value)) return;
        setSelectedTypes((prev) => [...prev, value]);
        setSearch("");
        setIsNoteEdited(false);
    };
    const removeType = (value: string) => {
        setSelectedTypes((prev) =>
            prev.filter((v) => v !== value)
        );
        setIsNoteEdited(false);
    };
    useEffect(() => {
        if (!session?.user?.id) return;
        fetchSlot();
    }, [session]);
    useEffect(() => {
    if (isNoteEdited) return;

    if (selectedTypes.length === 0) {
        setNote("");
        return;
    }

    const autoNote = selectedTypes
        .map((type) => `${type}: `)
        .join("\n\n");

    setNote(autoNote);
}, [selectedTypes, isNoteEdited]);
    async function fetchSlot() {
        try {
            setSlotLoading(true);
            const res = await fetch(
                `/api/employees/workprogress/work-detail?emp_id=${session?.user?.id}`
            );
            const data = await res.json();
            if (!data.success) {
                if (data.message === "Employee has not checked in today.") {
                    setHasCheckedIn(false);
                    return;
                }
                toast.error(data.message);
                return;
            }
            setHasCheckedIn(true);
            const current = data.slot;
            if (!current) {
                toast.error("No active work slot.");
                return;
            }
            setCurrentSlot(current);
            setSlotStatus(current.status);
            setSlotTime(
                `${new Date(current.slot_start).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                })} - ${new Date(current.slot_end).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`
            );

            // work_types comes back already parsed by mysql2 (JSON column) — don't JSON.parse an array
            const parsedWorkTypes: string[] = Array.isArray(current.work_types)
                ? current.work_types
                : current.work_types
                    ? JSON.parse(current.work_types)
                    : [];

            setSelectedTypes(parsedWorkTypes);
            setWorkNumber(current.work_number || "");
            setNote(current.note || "");
            setSearch("");
            setCustomType("");
            setIsUpdated(
                !!(current.work_number || current.note || parsedWorkTypes.length > 0)
            );
        } catch (err) {
            console.log(err);
        } finally {
            setSlotLoading(false);
        }
    }
    async function saveWorkUpdate() {
        if (!session?.user?.id) return;
        if (selectedTypes.length === 0) {
            toast.error("Select at least one work type.");
            return;
        }
        setLoading(true);
        try {
            const method = isUpdated ? "PUT" : "POST";
            const res = await fetch(
                "/api/employees/workprogress/work-detail",
                {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        emp_id: session.user.id,
                        work_types: selectedTypes,
                        work_number: workNumber,
                        note,
                    }),
                }
            );
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setIsUpdated(true);
                fetchSlot();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("Something went wrong.");
        }
        setLoading(false);
    }
    const readOnly = slotStatus === "Finished";
    const disableForm = readOnly || !hasCheckedIn;
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#295A47] to-[#3C7862] px-8 py-6 text-white">
                <h2 className="text-3xl font-bold">
                    Work Progress Update
                </h2>
                <p className="text-white/80 mt-2">
                    Select one or more work types, enter the reference number and explain today's work.
                </p>
            </div>
            <div className="bg-[#EEF6EE] border-y border-[#D6E7D5] px-8 py-4 flex flex-wrap gap-8 text-sm">
                <div>
                    <span className="font-semibold text-[#295A47]">
                        Current Slot :
                    </span>{" "}
                    {slotLoading ? "Loading..." : slotTime}
                </div>

                <div>
                    <span className="font-semibold text-[#295A47]">
                        Status :
                    </span>{" "}
                    <span
                        className={`font-bold ${slotStatus === "Current"
                            ? "text-green-700"
                            : slotStatus === "Finished"
                                ? "text-red-600"
                                : "text-orange-500"
                            }`}
                    >
                        {slotLoading ? "Loading..." : slotStatus}
                    </span>
                </div>
            </div>
            <div className="p-8 space-y-8">
                {/* WORK TYPE */}
                <div>
                    <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <ClipboardList size={20} />
                        Work Type
                    </label>
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-4 text-gray-400"
                        />
                        <input
                            value={search}
                            disabled={readOnly}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search work type..."
                            className="w-full rounded-2xl border-2 border-gray-200 py-4 pl-12 pr-4 outline-none focus:border-[#295A47]"
                        />
                    </div>
                    {/* Suggestions */}
                    <div className="mt-4 border rounded-2xl bg-gray-50 max-h-80 overflow-y-auto">
                        {Object.entries(workTypeGroups).map(([group, items]) => {
                            const visible = items.filter((item) =>
                                item.toLowerCase().includes(search.toLowerCase())
                            );
                            if (!visible.length) return null;
                            return (
                                <div key={group}>
                                    <div className="sticky top-0 bg-[#EEF6EE] px-5 py-2 font-semibold text-[#295A47] border-b">
                                        {group}
                                    </div>
                                    <div className="p-3 flex flex-wrap gap-3">
                                        {visible.map((item) => {
                                            const active =
                                                selectedTypes.includes(item);
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => addType(item)}
                                                    className={`
                                                    px-4 py-2 rounded-full text-sm font-medium transition-all
                                                    ${active
                                                            ? "bg-[#295A47] text-white"
                                                            : "bg-white border hover:border-[#295A47] hover:text-[#295A47]"
                                                        }
                                                            ${readOnly ? "opacity-60 cursor-not-allowed" : ""}
                                                        `}
                                                >
                                                    {item}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Selected */}
                <div>
                    <label className="font-semibold text-gray-700 mb-3 block">
                        Selected Work Types
                    </label>
                    <div className="min-h-[70px] rounded-2xl border border-dashed p-4 flex flex-wrap gap-3">
                        {selectedTypes.length === 0 && (
                            <p className="text-gray-400">
                                No work type selected.
                            </p>
                        )}
                        {selectedTypes.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-2 bg-[#295A47] text-white px-4 py-2 rounded-full animate-in fade-in"
                            >
                                {item}
                                <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => removeType(item)}
                                    className={readOnly ? "cursor-not-allowed opacity-60" : ""}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Others */}
                {selectedTypes.includes("Others") && (
                    <div>
                        <label className="font-semibold text-gray-700 mb-2 block">
                            Custom Work Type
                        </label>
                        <div className="flex gap-3">
                            <input
                                disabled={readOnly}
                                onChange={(e) =>
                                    setCustomType(e.target.value)
                                }
                                placeholder="Write your own work type..."
                                className="flex-1 border rounded-2xl p-4"
                            />
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => {
                                    if (!customType.trim()) return;
                                    const value = customType.trim();
                                    if (
                                        value &&
                                        !selectedTypes.some(
                                            (v) => v.toLowerCase() === value.toLowerCase()
                                        )
                                    ) {
                                        setSelectedTypes((prev) => [
                                            ...prev,
                                            customType,
                                        ]);
                                    }
                                    setCustomType("");
                                }}
                                className="px-6 rounded-2xl bg-[#295A47] text-white"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
                {/* Work Number */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                            <Hash size={20} />
                            Work Number / Reference
                        </label>
                        <input
                            value={workNumber}
                            disabled={readOnly}
                            onChange={(e) => setWorkNumber(e.target.value)}
                            placeholder="Lead ID / Project ID / Builder ID / Invoice No..."
                            className="w-full rounded-2xl border-2 border-gray-200 p-4 outline-none focus:border-[#295A47] transition"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Example: LD-2356, PRJ-103, INV-0023, EMP-001
                        </p>
                    </div>
                    {/* Quick Summary */}
                    <div className="rounded-2xl bg-[#EEF6EE] border border-[#D6E7D5] p-6">
                        <h3 className="font-bold text-[#295A47] text-lg">
                            Current Update
                        </h3>
                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Selected Types
                                </span>
                                <span className="font-semibold text-[#295A47]">
                                    {selectedTypes.length} Selected
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Reference
                                </span>
                                <span className="font-semibold text-[#295A47] truncate ml-3">
                                    {workNumber || "--"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Note Length
                                </span>
                                <span className="font-semibold text-[#295A47]">
                                    {note.length}/1000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Note */}
                <div>
                    <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                        <FileText size={20} />
                        Work Note
                    </label>
                    <textarea
                        rows={8}
                        maxLength={1000}
                        value={note}
                        disabled={readOnly}
                        onChange={(e) => {setIsNoteEdited(true);setNote(e.target.value);}}
                        placeholder="Describe today's work in detail...
Example:
• Completed Attendance API
• Fixed login issue
• Added employee salary module
• Tested mobile responsiveness
• Deployed latest build to VPS
Mention blockers (if any), discussions held, meetings attended, or important observations."
                        className="w-full rounded-2xl border-2 border-gray-200 p-5 resize-none outline-none focus:border-[#295A47] transition"
                    />
                    <div className="flex justify-between mt-2">
                        <span className="text-gray-400 text-sm">
                            Write a meaningful update for your reporting manager.
                        </span>
                        <span
                            className={`text-sm font-semibold ${note.length > 900
                                ? "text-red-500"
                                : "text-[#295A47]"
                                }`}
                        >
                            {note.length}/1000
                        </span>
                    </div>
                </div>
                {/* Save */}
                <div className="border-t pt-8 flex flex-col lg:flex-row items-center justify-between gap-5">
                    <div>
                        <h3 className="font-bold text-[#295A47] text-lg">
                            {isUpdated ? "Update Current Work" : "Ready to Submit?"}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                            {isUpdated
                                ? "You can modify this work update until the current slot ends."
                                : "Once submitted, you can continue editing until this slot is finished."}
                        </p>
                    </div>
                    {!hasCheckedIn && (
                        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4">
                            <p className="text-yellow-800 font-medium">
                                Please check in first to start updating your work progress.
                            </p>
                        </div>
                    )}
                    <button
                        type="button"
                        className="w-full lg:w-auto flex items-center justify-center gap-3 bg-[#295A47] hover:bg-[#214839] transition text-white px-10 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl"
                        onClick={saveWorkUpdate}
                        disabled={loading || disableForm}
                    >
                        <Save size={20} />
                        {loading
                            ? "Saving..."
                            : !hasCheckedIn
                                ? "Check In Required"
                                : readOnly
                                    ? "Current Slot Finished"
                                    : isUpdated
                                        ? "Update Work Progress"
                                        : "Save Work Progress"}
                    </button>
                </div>
            </div>
        </div>
    )
};