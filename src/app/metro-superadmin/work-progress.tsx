"use client";
import { useEffect, useMemo, useState } from "react";
import {
    Users,
    TrendingUp,
    ClipboardList,
    RefreshCw,
    ArrowUpRight,
    Search,
} from "lucide-react";
import PendingTasksModal from "./PendingTasksModal";
type SlotNo = 1 | 2 | 3 | 4;
interface DashboardStats {
    presentEmployees: number;
    totalEmployees: number;
    productivity: number;
    monthProductivity: number;
    pendingTasks: number;
    todayPendingTasks: number;
}
export interface WorkProgress {
    id: number;
    emp_id: string;
    employee_name?: string;
    employee_designation?: string;
    work_date: string;
    slot_no: SlotNo;
    slot_start: string;
    slot_end: string;
    status: "Pending" | "Current" | "Finished";
    work_types: string[];
    work_number: string;
    note: string;
}
export default function WorkProgress() {
    const [loading, setLoading] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    // API Stats
    const [stats, setStats] = useState<DashboardStats>({
        presentEmployees: 0,
        totalEmployees: 0,
        productivity: 0,
        monthProductivity: 0,
        pendingTasks: 0,
        todayPendingTasks: 0,
    });
    // API Data
    const [workProgress, setWorkProgress] = useState<WorkProgress[]>([]);
    // Search
    const [search, setSearch] = useState("");
    // Active Slot
    const [activeSlot, setActiveSlot] = useState<SlotNo>(1);
    const getKolkataToday = () => {
        const now = new Date();
        const india = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
            })
        );
        return india.toISOString().split("T")[0];
    };
    const [selectedDate, setSelectedDate] = useState(getKolkataToday());
    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/superadmin/workprogress/metro-progress?date=${selectedDate}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setWorkProgress(data.employees);
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboard();
    }, [selectedDate]);
    const handleRefresh = () => {
        fetchDashboard();
    };
    const filteredEmployees = useMemo(() => {
        return workProgress.filter((emp) => {
            const matchesSlot = emp.slot_no === activeSlot;
            const matchesSearch =
                search === "" ||
                emp.emp_id.toLowerCase().includes(search.toLowerCase()) ||
                emp.employee_name
                    ?.toLowerCase()
                    .includes(search.toLowerCase());
            return matchesSlot && matchesSearch;
        });
    }, [activeSlot, search, workProgress]);
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* ================= Header ================= */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Work Progress Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Monitor employee productivity and work progress.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border bg-white px-5 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-slate-400">
                                Today
                            </p>
                            <p className="mt-1 font-semibold text-slate-800">
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition hover:scale-105"
                        >
                            <RefreshCw
                                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                            />
                        </button>
                    </div>
                </div>
                {/* ================= Stats ================= */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">
                                    Present Employees
                                </p>
                                <h2 className="mt-3 flex items-end gap-2">
                                    <span className="text-5xl font-bold">
                                        {stats.presentEmployees}
                                    </span>
                                    <span className="pb-1 text-2xl font-semibold text-white/80">
                                        / {stats.totalEmployees}
                                    </span>
                                </h2>
                                <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                    Active Today
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-4">
                                <Users className="h-10 w-10" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white shadow-xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm opacity-90">
                                    Today's Productivity
                                </p>
                                <h2 className="mt-2 text-4xl font-bold">
                                    {stats.productivity}%
                                </h2>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-4">
                                <TrendingUp className="h-10 w-10" />
                            </div>
                        </div>
                        <div className="mt-5 h-3 rounded-full bg-white/20">
                            <div
                                className="h-3 rounded-full bg-white transition-all duration-500"
                                style={{
                                    width: `${stats.productivity}%`,
                                }}
                            />
                        </div>
                        <div className="my-6 border-t border-white/20" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">
                                    Month's Productivity
                                </p>
                                <h3 className="mt-1 text-3xl font-bold">
                                    {stats.monthProductivity}%
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Till Today
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {new Date().toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-white/20">
                            <div
                                className="h-2 rounded-full bg-lime-200 transition-all duration-500"
                                style={{
                                    width: `${stats.monthProductivity}%`,
                                }}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPendingModal(true)}
                        className="w-full cursor-pointer rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-6 text-left text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]">                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm opacity-90">
                                    Total Pending Tasks
                                </p>
                                <h2 className="mt-2 text-4xl font-bold">
                                    {stats.pendingTasks}
                                </h2>
                            </div>
                            <div className="rounded-2xl bg-white/20 p-4">
                                <ClipboardList className="h-10 w-10" />
                            </div>
                        </div>
                        <div className="mt-5 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs">
                            Requires Attention
                        </div>
                        <div className="my-6 border-t border-white/20" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80">
                                    Today's Pending
                                </p>
                                <h3 className="mt-1 text-3xl font-bold">
                                    {stats.todayPendingTasks}
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-white/70">
                                    Today
                                </p>
                                <p className="mt-1 text-sm font-medium">
                                    {new Date().toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-white/20">
                            <div
                                className="h-2 rounded-full bg-yellow-200 transition-all duration-500"
                                style={{
                                    width:
                                        stats.pendingTasks === 0
                                            ? "0%"
                                            : `${(stats.todayPendingTasks / stats.pendingTasks) * 100}%`,
                                }}
                            />
                        </div>
                    </button>
                </div>
                {/* ================= Search & Tabs ================= */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 md:flex-row">
                        {/* Search */}
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Employee..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-blue-500"
                            />
                        </div>
                        {/* Date */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>
                    {/* Slots */}
                    <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4].map((slot) => (
                            <button
                                key={slot}
                                onClick={() => setActiveSlot(slot as SlotNo)}
                                className={`rounded-xl px-6 py-3 font-semibold transition ${activeSlot === slot
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "border bg-white text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                Slot {slot}
                            </button>
                        ))}
                    </div>
                </div>
                {/* ================= Employee Cards ================= */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Slot {activeSlot} Work Progress
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Employee tasks assigned for the selected slot.
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 px-4 py-2">
                            <span className="text-sm font-semibold text-blue-700">
                                {filteredEmployees.length} Employee
                                {filteredEmployees.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                    {filteredEmployees.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
                            <ClipboardList className="mx-auto h-14 w-14 text-slate-300" />
                            <h3 className="mt-5 text-xl font-semibold text-slate-700">
                                No Work Progress Found
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                No employee has updated work progress for Slot {activeSlot}.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {filteredEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between border-b bg-slate-50 px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-xl font-bold text-white">
                                                {employee.employee_name
                                                    ? employee.employee_name.charAt(0).toUpperCase()
                                                    : employee.emp_id.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {employee.employee_name || employee.emp_id}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {employee.emp_id}
                                                </p>
                                                {employee.employee_designation && (
                                                    <p className="mt-1 text-xs font-medium text-blue-600">
                                                        {employee.employee_designation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-4 py-2 text-xs font-semibold ${employee.status === "Finished"
                                                ? "bg-green-100 text-green-700"
                                                : employee.status === "Current"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "bg-slate-200 text-slate-700"
                                                }`}
                                        >
                                            {employee.status}
                                        </span>
                                    </div>
                                    {/* Body */}
                                    <div className="space-y-5 p-6">
                                        {/* Work Types */}
                                        <div>
                                            <p className="mb-2 text-sm font-semibold text-slate-600">
                                                Work Types
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {employee.work_types.length > 0 ? (
                                                    employee.work_types.map((type) => (
                                                        <span
                                                            key={type}
                                                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                                                        >
                                                            {type}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        No Work Type
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Work Number */}
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                    Work Number
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-800">
                                                    {employee.work_number || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                    Slot
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-800">
                                                    Slot {employee.slot_no}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Time */}
                                        <div>
                                            <p className="mb-2 text-sm font-semibold text-slate-600">
                                                Duration
                                            </p>
                                            <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4">
                                                <div>
                                                    <p className="text-xs text-slate-400">
                                                        Start
                                                    </p>
                                                    <p className="font-semibold text-slate-800">
                                                        {employee.slot_start
                                                            ? new Date(employee.slot_start).toLocaleTimeString(
                                                                "en-IN",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )
                                                            : "--"}
                                                    </p>
                                                </div>
                                                <div className="h-[2px] flex-1 mx-5 bg-slate-300" />
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">
                                                        End
                                                    </p>
                                                    <p className="font-semibold text-slate-800">
                                                        {employee.slot_end
                                                            ? new Date(employee.slot_end).toLocaleTimeString(
                                                                "en-IN",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )
                                                            : "--"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Notes */}
                                        <div>
                                            <p className="mb-2 text-sm font-semibold text-slate-600">
                                                Notes
                                            </p>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-sm leading-6 text-slate-600">
                                                    {employee.note || "No notes available."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showPendingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    Pending Tasks
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    View all pending tasks.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowPendingModal(false)}
                                className="rounded-lg p-2 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="max-h-[70vh] overflow-y-auto p-6">

                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-orange-50 p-5">
                                    <p className="text-sm text-slate-500">
                                        Total Pending
                                    </p>
                                    <h3 className="mt-2 text-3xl font-bold text-orange-600">
                                        {stats.pendingTasks}
                                    </h3>
                                </div>

                                <div className="rounded-xl bg-red-50 p-5">
                                    <p className="text-sm text-slate-500">
                                        Today's Pending
                                    </p>
                                    <h3 className="mt-2 text-3xl font-bold text-red-600">
                                        {stats.todayPendingTasks}
                                    </h3>
                                </div>
                            </div>

                            {/* Your pending task list goes here */}
                            <PendingTasksModal />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}