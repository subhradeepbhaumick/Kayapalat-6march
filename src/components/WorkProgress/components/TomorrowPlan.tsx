"use client";
import React, { useState, useEffect } from "react";
import {
    Search,
    ClipboardList,
    Hash,
    FileText,
    Save,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const workTypeGroups = {
    Sales: [
        "Builder Meet", "Client Meet", "Project Visit", "Leads Calling",
        "Clients Followup", "Quotation Making", "Payment Collection",
        "Payment Followup", "Builder Followup", "Client Visit",
        "Leads Distribution", "Leads Management", "Sale Confirmation Making",
        "Homeloan Meet", "Resale Searching", "Site Visit",
        "Site Visit Arranging", "New Project Visit", "Project Verify",
        "Resale Signing", "Builder Signing",
    ],
    HR: [
        "Interview Taking", "Candidate Followup", "Offer Letter Making",
        "Attendance Checking", "Training Deliver", "Employee Salary Updating",
        "Sales Team Training", "Sales Team Followup",
    ],
    Software: [
        "API Integration", "Frontend Make", "Deployment", "Server Handling",
        "Logic Building", "Rearrange Software Logic", "Software Testing",
        "Database Management", "Project Planning", "Github Handle",
        "Pipeline Management", "Employee Dashboard Handle",
        "Project Data Management",
    ],
    Marketing: [
        "Website Posting", "Ad Posting", "SEO Management",
        "Website Offpage Submission", "Article Submission",
        "Classified Submission", "Social Bookmarking", "Forums Posting",
        "Facebook Post", "Instagram Post", "LinkedIn Post", "Pinterest",
        "Youtube", "Business Page Create/Posting", "Mailer", "SMS Blasting",
        "Google Businesspage Create & Link Share", "Google Ads.",
    ],
    Design: [
        "Design Making", "Design Changes", "Design Upload",
        "Client Project Measure", "Design Followup/Check",
    ],
    Management: [
        "Office Meeting", "Office Meeting/Training",
        "Purchase/Project Coordinator Meeting", "PR Meeting and Followup",
        "Agreement Check", "Agreement Signing", "Invoice Deliver",
        "Vendor Payment", "Report Make/Check", "Documentation",
        "Banking Work", "Group Discussion",
    ],
    Break: ["Lunch", "Tea Break"],
    Others: ["Others"],
};

interface TomorrowTask {
    id?: number;
    work_types: string[];
    work_number: string;
    note: string;
    priority: "High" | "Medium" | "Low";
    status?: string;
    search: string;
    customType: string;
    isNoteEdited: boolean;
}

const emptyTask = (): TomorrowTask => ({
    work_types: [],
    work_number: "",
    note: "",
    priority: "Medium",
    search: "",
    customType: "",
    isNoteEdited: false,
});

export default function TomorrowPlan() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const [tasks, setTasks] = useState<TomorrowTask[]>([emptyTask()]);

    useEffect(() => {
        if (!session?.user?.id) return;
        fetchTomorrowPlans();
    }, [session]);

    async function fetchTomorrowPlans() {
        try {
            const res = await fetch(
                `/api/employees/workprogress/tomorrow-plan?emp_id=${session?.user?.id}`
            );
            const data = await res.json();
            if (!data.success) return;
            if (!data.plans.length) return;
            setTasks(
                data.plans.map((plan: any) => ({
                    id: plan.id,
                    work_types: Array.isArray(plan.work_types)
                        ? plan.work_types
                        : JSON.parse(plan.work_types),
                    work_number: plan.work_number || "",
                    note: plan.note || "",
                    priority: plan.priority,
                    status: plan.status,
                    search: "",
                    customType: "",
                    isNoteEdited: true,
                }))
            );
            setIsUpdated(true);
        } catch (err) {
            console.log(err);
        }
    }

    async function saveTomorrowPlan() {
        if (!session?.user?.id) return;
        if (tasks.length < 3) {
            toast.error("Please add at least 3 tasks for tomorrow.");
            return;
        }
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.work_types.length === 0) {
                toast.error(`Task ${i + 1}: Select at least one work type.`);
                return;
            }
            if (!task.note.trim()) {
                toast.error(`Task ${i + 1}: Please enter work note.`);
                return;
            }
        }
        setLoading(true);
        try {
            const method = isUpdated ? "PUT" : "POST";
            const res = await fetch("/api/employees/workprogress/tomorrow-plan", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emp_id: session.user.id,
                    tasks: tasks.map((task) => ({
                        id: task.id,
                        work_types: task.work_types,
                        work_number: task.work_number,
                        note: task.note,
                        priority: task.priority,
                    })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setIsUpdated(true);
                fetchTomorrowPlans();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    function addTask() {
        setTasks((prev) => [...prev, emptyTask()]);
    }

    function removeTask(index: number) {
        setTasks((prev) => prev.filter((_, i) => i !== index));
    }

    function addWorkType(index: number, type: string) {
        const copy = [...tasks];
        if (copy[index].work_types.includes(type)) return;
        copy[index] = {
            ...copy[index],
            work_types: [...copy[index].work_types, type],
            search: "",
        };
        if (!copy[index].isNoteEdited) {
            copy[index].note = copy[index].work_types
                .map((item) => `${item}:\n`)
                .join("\n");
        }
        setTasks(copy);
    }

    function removeWorkType(index: number, type: string) {
        const copy = [...tasks];
        copy[index] = {
            ...copy[index],
            work_types: copy[index].work_types.filter((t) => t !== type),
        };
        if (!copy[index].isNoteEdited) {
            copy[index].note = copy[index].work_types
                .map((item) => `${item}:\n`)
                .join("\n");
        }
        setTasks(copy);
    }

    function addCustomType(index: number) {
        const copy = [...tasks];
        const task = copy[index];
        if (!task.customType.trim()) return;
        if (task.work_types.includes(task.customType)) return;
        copy[index] = {
            ...task,
            work_types: [...task.work_types, task.customType],
            customType: "",
        };
        if (!copy[index].isNoteEdited) {
            copy[index].note = copy[index].work_types
                .map((item) => `${item}:\n`)
                .join("\n");
        }
        setTasks(copy);
    }

    function updateField(index: number, field: keyof TomorrowTask, value: any) {
        const copy = [...tasks];
        copy[index] = { ...copy[index], [field]: value };
        if (field === "note") {
            copy[index].isNoteEdited = true;
        }
        setTasks(copy);
    }

    const priorityStyles: Record<string, string> = {
        High: "text-red-600",
        Medium: "text-orange-500",
        Low: "text-green-600",
    };

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#295A47] to-[#3C7862] px-5 sm:px-8 py-5 sm:py-6 text-white">
                <h2 className="text-2xl sm:text-3xl font-bold">
                    Tomorrow's Work Planning
                </h2>
                <p className="text-white/80 mt-2 text-sm sm:text-base">
                    Plan at least three tasks for tomorrow. These tasks will be
                    available once your workday starts.
                </p>
            </div>

            {/* Summary */}
            <div className="bg-[#EEF6EE] border-y border-[#D6E7D5] px-5 sm:px-8 py-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                    <span className="font-semibold text-[#295A47]">Total Tasks :</span>{" "}
                    {tasks.length}
                </div>
                <div>
                    <span className="font-semibold text-[#295A47]">Minimum Required :</span>{" "}
                    3
                </div>
                <div>
                    <span className="font-semibold text-[#295A47]">Status :</span>{" "}
                    <span
                        className={`font-bold ${
                            tasks.length >= 3 ? "text-green-700" : "text-red-600"
                        }`}
                    >
                        {tasks.length >= 3 ? "Ready" : "Add More Tasks"}
                    </span>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-10">
                {tasks.map((task, index) => (
                    <div
                        key={index}
                        className="border rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gray-50"
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-[#295A47]">
                                Task #{index + 1}
                            </h3>
                            {tasks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTask(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    aria-label="Remove task"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        {/* Work Type Search */}
                        <div>
                            <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                                <ClipboardList size={18} />
                                Work Type
                            </label>
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={task.search}
                                    placeholder="Search work type..."
                                    onChange={(e) =>
                                        updateField(index, "search", e.target.value)
                                    }
                                    className="w-full rounded-2xl border-2 border-gray-200 py-3.5 sm:py-4 pl-12 pr-4 outline-none focus:border-[#295A47] transition-colors text-sm sm:text-base"
                                />
                            </div>

                            {/* Suggestions */}
                            <div className="mt-4 border rounded-2xl bg-white max-h-72 sm:max-h-80 overflow-y-auto">
                                {Object.entries(workTypeGroups).map(([group, items]) => {
                                    const visible = items.filter((item) =>
                                        item.toLowerCase().includes(task.search.toLowerCase())
                                    );
                                    if (!visible.length) return null;
                                    return (
                                        <div key={group}>
                                            <div className="sticky top-0 bg-[#EEF6EE] px-4 sm:px-5 py-2 font-semibold text-[#295A47] border-b text-sm sm:text-base">
                                                {group}
                                            </div>
                                            <div className="p-3 flex flex-wrap gap-2 sm:gap-3">
                                                {visible.map((item) => {
                                                    const active = task.work_types.includes(item);
                                                    return (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => addWorkType(index, item)}
                                                            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                                                                active
                                                                    ? "bg-[#295A47] text-white"
                                                                    : "bg-white border hover:border-[#295A47] hover:text-[#295A47]"
                                                            }`}
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

                        {/* Selected Work Types */}
                        <div className="mt-6 sm:mt-8">
                            <label className="font-semibold text-gray-700 mb-3 block text-sm sm:text-base">
                                Selected Work Types
                            </label>
                            <div className="min-h-[70px] rounded-2xl border border-dashed p-4 flex flex-wrap gap-2 sm:gap-3 bg-white">
                                {task.work_types.length === 0 && (
                                    <p className="text-gray-400 text-sm">No work type selected.</p>
                                )}
                                {task.work_types.map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2 bg-[#295A47] text-white px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm"
                                    >
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => removeWorkType(index, item)}
                                            aria-label={`Remove ${item}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom type */}
                        {task.work_types.includes("Others") && (
                            <div className="mt-6">
                                <label className="font-semibold text-gray-700 block mb-3 text-sm sm:text-base">
                                    Custom Work Type
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        value={task.customType}
                                        onChange={(e) =>
                                            updateField(index, "customType", e.target.value)
                                        }
                                        placeholder="Enter custom work type..."
                                        className="flex-1 border rounded-2xl p-3.5 sm:p-4 outline-none focus:border-[#295A47] border-gray-200 border-2 transition-colors text-sm sm:text-base"
                                    />
                                    <button
                                        type="button"
                                        className="px-6 py-3.5 sm:py-0 rounded-2xl bg-[#295A47] hover:bg-[#214839] text-white font-medium transition-colors"
                                        onClick={() => addCustomType(index)}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Work Number & Priority */}
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                            <div>
                                <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                                    <Hash size={18} />
                                    Work Number / Reference
                                </label>
                                <input
                                    value={task.work_number}
                                    onChange={(e) =>
                                        updateField(index, "work_number", e.target.value)
                                    }
                                    placeholder="Lead ID / Project ID / Builder ID..."
                                    className="w-full rounded-2xl border-2 border-gray-200 p-3.5 sm:p-4 outline-none focus:border-[#295A47] transition-colors text-sm sm:text-base"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-700 mb-3 block text-sm sm:text-base">
                                    Priority
                                </label>
                                <select
                                    value={task.priority}
                                    onChange={(e) =>
                                        updateField(index, "priority", e.target.value)
                                    }
                                    className="w-full rounded-2xl border-2 border-gray-200 p-3.5 sm:p-4 outline-none focus:border-[#295A47] transition-colors text-sm sm:text-base"
                                >
                                    <option value="High">🔴 High</option>
                                    <option value="Medium">🟠 Medium</option>
                                    <option value="Low">🟢 Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 sm:mt-8 rounded-2xl bg-[#EEF6EE] border border-[#D6E7D5] p-4 sm:p-6">
                            <h3 className="font-bold text-[#295A47] text-base sm:text-lg">
                                Planning Summary
                            </h3>
                            <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Selected Work Types</span>
                                    <span className="font-semibold text-[#295A47]">
                                        {task.work_types.length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Priority</span>
                                    <span className={`font-semibold ${priorityStyles[task.priority]}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Reference</span>
                                    <span className="font-semibold text-[#295A47]">
                                        {task.work_number || "--"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Note Length</span>
                                    <span className="font-semibold text-[#295A47]">
                                        {task.note.length}/1000
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Work Note */}
                        <div className="mt-6 sm:mt-8">
                            <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                                <FileText size={18} />
                                Work Note
                            </label>
                            <textarea
                                rows={6}
                                maxLength={1000}
                                value={task.note}
                                onChange={(e) => updateField(index, "note", e.target.value)}
                                placeholder="Describe tomorrow's work..."
                                className="w-full rounded-2xl border-2 border-gray-200 p-4 sm:p-5 resize-none outline-none focus:border-[#295A47] transition-colors text-sm sm:text-base"
                            />
                            <div className="flex justify-end mt-2">
                                <span className="text-sm text-[#295A47] font-semibold">
                                    {task.note.length}/1000
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Bottom Buttons */}
                <div className="border-t pt-6 sm:pt-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    <button
                        type="button"
                        onClick={addTask}
                        className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 px-6 py-3.5 sm:py-4 rounded-2xl font-semibold transition-colors"
                    >
                        <Plus size={18} />
                        Add Another Task
                    </button>
                    <button
                        type="button"
                        onClick={saveTomorrowPlan}
                        disabled={loading || tasks.length < 3}
                        className="flex items-center justify-center gap-2 bg-[#295A47] hover:bg-[#214839] text-white px-8 py-3.5 sm:py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : isUpdated ? "Update Tomorrow Plan" : "Save Tomorrow Plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}