"use client";
import { useEffect, useMemo, useState } from "react";
import {
    ClipboardList,
    PlusCircle,
    Search,
    Users,
    RefreshCw,
} from "lucide-react";
import AllotTask from "./AllotTask";
type Tab = "pending" | "allot";
interface Employee {
    emp_id: string;
    name: string;
}
interface PendingTask {
    id: number;
    emp_id: string;
    employee_name: string;
    work_date: string;
    work_types: string[];
    work_number: string;
    note: string;
    priority: "High" | "Medium" | "Low";
    status: "Pending" | "Started" | "Completed" | "Cancelled";
}
export default function PendingTasksModal() {
    const [activeTab, setActiveTab] =
        useState<Tab>("pending");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [employees, setEmployees] =
        useState<Employee[]>([]);
    const [tasks, setTasks] =
        useState<PendingTask[]>([]);
    const [selectedEmployee, setSelectedEmployee] =
        useState("");
    const [search, setSearch] =
        useState("");
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            setRefreshing(true);

            const res = await fetch(
                "/api/superadmin/workprogress/pending-tasks",
                {
                    cache: "no-store",
                }
            );

            const data = await res.json();

            if (data.success) {
                setEmployees(data.employees || []);
                setTasks(data.tasks || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const employeeMatch =
                selectedEmployee === "" ||
                task.emp_id === selectedEmployee;
            const searchMatch =
                search === "" ||
                task.employee_name
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                task.emp_id
                    .toLowerCase()
                    .includes(search.toLowerCase());
            return employeeMatch && searchMatch;
        });
    }, [tasks, selectedEmployee, search]);
    const priorityColor = (priority: string) => {
        switch (priority) {
            case "High":
                return "bg-red-100 text-red-700";
            case "Medium":
                return "bg-orange-100 text-orange-700";
            case "Low":
                return "bg-green-100 text-green-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };
    const statusColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-700";
            case "Started":
                return "bg-blue-100 text-blue-700";
            case "Completed":
                return "bg-green-100 text-green-700";
            case "Cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };
    return (
        <div>
            <div className="mb-5 flex justify-end">
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                            }`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>
            {/* Toggle */}
            <div className="mb-6 flex justify-center">
                <div className="inline-flex rounded-2xl border bg-slate-100 p-1">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${activeTab === "pending"
                            ? "bg-white text-blue-600 shadow"
                            : "text-slate-600"
                            }`}
                    >
                        <ClipboardList className="h-5 w-5" />
                        Pending Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab("allot")}
                        className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${activeTab === "allot"
                            ? "bg-white text-blue-600 shadow"
                            : "text-slate-600"
                            }`}
                    >
                        <PlusCircle className="h-5 w-5" />
                        Allot Tasks
                    </button>
                </div>
            </div>
            {activeTab === "pending" && (
                <>
                    {/* Filters */}
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-sm">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search Employee..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-slate-500" />
                            <select
                                value={selectedEmployee}
                                onChange={(e) =>
                                    setSelectedEmployee(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    All Employees
                                </option>
                                {employees.map((emp) => (
                                    <option
                                        key={emp.emp_id}
                                        value={emp.emp_id}
                                    >
                                        {emp.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-100">
                                    <tr className="text-center text-sm font-semibold text-slate-700">
                                        <th className="px-5 py-4 text-center">Employee</th>
                                        <th className="px-5 py-4 text-center">Work Date</th>
                                        <th className="px-5 py-4 text-center">Work Types</th>
                                        <th className="px-5 py-4 text-center">Work No.</th>
                                        <th className="px-5 py-4 text-center">Priority</th>
                                        <th className="px-5 py-4 text-center">Status</th>
                                        <th className="w-[380px] px-5 py-4 text-center">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-16 text-center text-slate-500"
                                            >
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : filteredTasks.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-16 text-center text-slate-400"
                                            >
                                                No Pending Tasks Found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map((task) => (
                                            <tr
                                                key={task.id}
                                                className="border-t align-top hover:bg-slate-50 transition"
                                            >
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {task.employee_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {task.emp_id}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {new Date(
                                                        task.work_date
                                                    ).toLocaleDateString("en-IN")}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {task.work_types.length >
                                                            0 ? (
                                                            task.work_types.map(
                                                                (type) => (
                                                                    <span
                                                                        key={
                                                                            type
                                                                        }
                                                                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                                                                    >
                                                                        {type}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            <span className="text-slate-400">
                                                                -
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-medium">
                                                    {task.work_number || "-"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColor(
                                                            task.priority
                                                        )}`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                                                            task.status
                                                        )}`}
                                                    >
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="w-[380px] px-5 py-4 align-top">
                                                    <div className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                                                        {task.note || "-"}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            {activeTab === "allot" && <AllotTask />}
        </div>
    );
}
