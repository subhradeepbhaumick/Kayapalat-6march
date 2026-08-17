"use client";
import { useEffect, useMemo, useState } from "react";
import {
    ClipboardList,
    Search,
    X,
    Hash,
    FileText,
    Save,
} from "lucide-react";
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
    Break: ["Lunch", "Tea Break"],
    Others: ["Others"],
};
interface Employee {
    emp_id: string;
    name: string;
}
export default function AllotTask() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [empId, setEmpId] = useState("");
    const [search, setSearch] = useState("");
    const [workTypes, setWorkTypes] = useState<string[]>([]);
    const [workNumber, setWorkNumber] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [note, setNote] = useState("");
    const [isEdited, setIsEdited] = useState(false);
    useEffect(() => {
        fetchEmployees();
    }, []);

    async function fetchEmployees() {
        try {
            const res = await fetch(
                "/api/superadmin/workprogress/employees"
            );

            const data = await res.json();

            if (data.success) {
                setEmployees(data.employees);
            }
        } catch (err) {
            console.error(err);
        }
    }
    const visibleGroups = useMemo(() => {
        return Object.entries(workTypeGroups).map(([group, items]) => ({
            group,
            items: items.filter((x) =>
                x.toLowerCase().includes(search.toLowerCase())
            ),
        }));
    }, [search]);
    function addType(type: string) {
        if (workTypes.includes(type)) return;
        const updated = [...workTypes, type];
        setWorkTypes(updated);
        if (!isEdited) {
            setNote(updated.map((x) => `${x}:\n`).join("\n"));
        }
        setSearch("");
    }
    function removeType(type: string) {
        const updated = workTypes.filter((x) => x !== type);
        setWorkTypes(updated);
        if (!isEdited) {
            setNote(updated.map((x) => `${x}:\n`).join("\n"));
        }
    }
    async function saveTask() {
        if (!empId) {
            alert("Select Employee");
            return;
        }

        if (workTypes.length === 0) {
            alert("Select Work Type");
            return;
        }

        if (!note.trim()) {
            alert("Enter Note");
            return;
        }

        try {
            const res = await fetch(
                "/api/superadmin/workprogress/employees",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        emp_id: empId,
                        work_types: workTypes,
                        work_number: workNumber,
                        note,
                        priority,
                    }),
                }
            );

            const data = await res.json();

            if (data.success) {
                alert("Task allotted successfully.");

                // Reset form
                setEmpId("");
                setWorkTypes([]);
                setWorkNumber("");
                setPriority("Medium");
                setNote("");
                setSearch("");
                setIsEdited(false);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        }
    }
    return (
        <div className="space-y-8">
            {/* Employee */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="font-semibold mb-2 block">
                        Employee ID
                    </label>
                    <select
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        className="w-full rounded-xl border p-3"
                    >
                        <option value="">Select Employee</option>

                        {employees.map((emp) => (
                            <option
                                key={emp.emp_id}
                                value={emp.emp_id}
                            >
                                {emp.emp_id} - {emp.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="font-semibold mb-2 block">
                        Work Number
                    </label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                            value={workNumber}
                            onChange={(e) => setWorkNumber(e.target.value)}
                            placeholder="Lead ID / Project ID"
                            className="w-full rounded-xl border py-3 pl-11 pr-3"
                        />
                    </div>
                </div>
                <div>
                    <label className="font-semibold mb-2 block">
                        Priority
                    </label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-xl border p-3"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </div>
            </div>
            {/* Search */}
            <div>
                <label className="font-semibold mb-2 block">
                    Work Types
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search work type..."
                        className="w-full rounded-xl border py-3 pl-11 pr-3"
                    />
                </div>
            </div>
            {/* Work Types */}
            <div className="max-h-80 overflow-y-auto rounded-2xl border">
                {visibleGroups.map((group) => {
                    if (!group.items.length) return null;
                    return (
                        <div key={group.group}>
                            <div className="sticky top-0 bg-slate-100 px-5 py-2 font-bold">
                                {group.group}
                            </div>
                            <div className="flex flex-wrap gap-2 p-4">
                                {group.items.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => addType(item)}
                                        className={`rounded-full border px-4 py-2 text-sm transition
                                            ${workTypes.includes(item)
                                                ? "bg-blue-600 text-white"
                                                : "hover:border-blue-500"
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Selected */}
            <div>
                <label className="font-semibold mb-3 block">
                    Selected Work Types
                </label>
                <div className="min-h-[70px] rounded-xl border border-dashed p-4 flex flex-wrap gap-2">
                    {workTypes.length === 0 && (
                        <span className="text-slate-400">
                            No work type selected
                        </span>
                    )}
                    {workTypes.map((item) => (
                        <div
                            key={item}
                            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white"
                        >
                            {item}
                            <button
                                onClick={() => removeType(item)}
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Note */}
            <div>
                <label className="mb-2 flex items-center gap-2 font-semibold">
                    <FileText className="h-5 w-5" />
                    Note
                </label>
                <textarea
                    rows={8}
                    value={note}
                    onChange={(e) => {
                        setIsEdited(true);
                        setNote(e.target.value);
                    }}
                    className="w-full rounded-xl border p-4"
                />
            </div>
            {/* Save */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={saveTask}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                    <Save className="h-5 w-5" />
                    Allot Task
                </button>
            </div>
        </div>
    );
}