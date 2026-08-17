"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Hash,
    CheckCircle2,
    XCircle,
    Loader2,
    ListChecks,
    ArrowUpDown,
    CalendarDays,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export interface TimelineTask {
    id: number;
    emp_id: string;
    work_date: string;
    work_types: string[] | string;
    work_number: string;
    note: string;
    priority: "High" | "Medium" | "Low";
    status: "Pending" | "Started" | "Completed" | "Cancelled";
    created_at: string;
    updated_at: string;
}

function parseWorkTypes(wt: string[] | string): string[] {
    if (Array.isArray(wt)) return wt;
    try {
        return JSON.parse(wt);
    } catch {
        return [];
    }
}

// Timezone-agnostic — always resolves to Asia/Kolkata regardless of the
// browser's local timezone. Used to default the date filter to "today".
function getKolkataDateKey(offsetDays = 0): string {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kolkata = new Date(utcMs + 5.5 * 60 * 60000);
    kolkata.setDate(kolkata.getDate() + offsetDays);
    return kolkata.toISOString().split("T")[0];
}

const priorityBadge: Record<string, string> = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-orange-100 text-orange-700 border-orange-200",
    Low: "bg-green-100 text-green-700 border-green-200",
};

const statusBadge: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-600 border-gray-200",
    Started: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
};

const priorityRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

type PriorityFilter = "All" | "High" | "Medium" | "Low";
type SortOrder = "priority-desc" | "priority-asc";

const Timeline: React.FC = () => {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<TimelineTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [completingId, setCompletingId] = useState<number | null>(null);
    const [fromDate, setFromDate] = useState(getKolkataDateKey(-6)); // past 7 days by default
    const [toDate, setToDate] = useState(getKolkataDateKey(1));
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
    const [sortOrder, setSortOrder] = useState<SortOrder>("priority-desc");

    const fetchTasks = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/employees/workprogress/timeline?emp_id=${session.user.id}&from=${fromDate}&to=${toDate}`
            );
            const data = await res.json();
            if (data.success) {
                setTasks(data.tasks || []);
            } else {
                toast.error(data.message || "Failed to load tasks.");
                setTasks([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    }, [session, fromDate, toDate]);
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    async function completeTask(id: number) {
        if (!session?.user?.id) return;
        setCompletingId(id);
        try {
            const res = await fetch("/api/employees/workprogress/timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, emp_id: session.user.id }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t))
                );
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong.");
        } finally {
            setCompletingId(null);
        }
    }

    const visibleTasks = useMemo(() => {
        let list = [...tasks];
        if (priorityFilter !== "All") {
            list = list.filter((t) => t.priority === priorityFilter);
        }
        list.sort((a, b) => {
            const diff = priorityRank[a.priority] - priorityRank[b.priority];
            return sortOrder === "priority-desc" ? diff : -diff;
        });
        return list;
    }, [tasks, priorityFilter, sortOrder]);
    const completedCount = tasks.filter((t) => t.status === "Completed").length;
    function toDateStr(val: any): string {
        if (val instanceof Date) return val.toISOString().slice(0, 10);
        return String(val).slice(0, 10);
    }
    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1F3A34] to-[#295A47] px-5 sm:px-8 py-5 sm:py-6 text-white">
                <div className="flex items-center gap-3">
                    <ListChecks size={26} />
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Work Timeline</h2>
                        <p className="text-white/80 text-sm mt-1">
                            Track and complete your planned tasks.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#EEF6EE] border-y border-[#D6E7D5] px-5 sm:px-8 py-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-[#295A47]" />
                    <label className="text-sm font-semibold text-[#295A47]">From</label>
                    <input
                        type="date"
                        value={fromDate}
                        max={toDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="rounded-xl border border-[#D6E7D5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#295A47]"
                    />
                    <label className="text-sm font-semibold text-[#295A47]">To</label>
                    <input
                        type="date"
                        value={toDate}
                        min={fromDate}
                        max={getKolkataDateKey(1)}
                        onChange={(e) => setToDate(e.target.value)}
                        className="rounded-xl border border-[#D6E7D5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#295A47]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-[#295A47]">Priority</label>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                        className="rounded-xl border border-[#D6E7D5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#295A47]"
                    >
                        <option value="All">All</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-[#295A47]" />
                    <label className="text-sm font-semibold text-[#295A47]">Sort</label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                        className="rounded-xl border border-[#D6E7D5] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#295A47]"
                    >
                        <option value="priority-desc">High → Low</option>
                        <option value="priority-asc">Low → High</option>
                    </select>
                </div>

                {tasks.length > 0 && (
                    <div className="ml-auto text-sm text-[#295A47] font-medium">
                        {completedCount}/{tasks.length} completed
                    </div>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Loading tasks...
                </div>
            ) : visibleTasks.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ListChecks size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">
                        No tasks found between {fromDate} and {toDate}.
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop table — row-wise */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#EEF6EE] text-[#295A47] text-left border-b border-[#D6E7D5]">
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Work Type(s)</th>
                                    <th className="px-5 py-3 font-semibold">Reference</th>
                                    <th className="px-5 py-3 font-semibold">Note</th>
                                    <th className="px-5 py-3 font-semibold">Priority</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleTasks.map((task, i) => {
                                    const wt = parseWorkTypes(task.work_types);
                                    const isDone = task.status === "Completed";
                                    const isCancelled = task.status === "Cancelled";
                                    const today = getKolkataDateKey(0);
                                    const tomorrow = getKolkataDateKey(1);

                                    const taskDate = toDateStr(task.work_date);

                                    const isToday = taskDate === today;
                                    const isTomorrow = taskDate === tomorrow;
                                    return (
                                        <tr
                                            key={task.id}
                                            className={`border-b border-gray-100
                                                    ${isTomorrow
                                                    ? "bg-blue-50"
                                                    : isToday
                                                        ? "bg-green-50"
                                                        : i % 2 === 0
                                                            ? "bg-white"
                                                            : "bg-gray-50/50"
                                                }
                                                 hover:bg-[#EEF6EE]/40 transition-colors`}
                                        >
                                            <td className="px-5 py-4 align-top text-gray-600 whitespace-nowrap">
                                                {isTomorrow
                                                    ? "Tomorrow"
                                                    : isToday
                                                        ? "Today"
                                                        : taskDate}
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                                    {wt.map((w) => (
                                                        <span
                                                            key={w}
                                                            className="text-[11px] font-medium bg-[#EEF6EE] text-[#295A47] px-2.5 py-1 rounded-full border border-[#D6E7D5]"
                                                        >
                                                            {w}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-top text-gray-600">
                                                {task.work_number ? (
                                                    <span className="flex items-center gap-1">
                                                        <Hash size={13} />
                                                        {task.work_number}
                                                    </span>
                                                ) : (
                                                    "--"
                                                )}
                                            </td>
                                            <td className="px-5 py-4 align-top text-gray-700 max-w-[280px]">
                                                <p className="line-clamp-3 whitespace-pre-line">{task.note}</p>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <span
                                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${priorityBadge[task.priority]}`}
                                                >
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <span
                                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge[task.status]}`}
                                                >
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 align-top text-right">
                                                {isDone ? (
                                                    <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                                                        <CheckCircle2 size={16} />
                                                        Completed
                                                    </span>
                                                ) : isCancelled ? (
                                                    <span className="inline-flex items-center gap-1.5 text-red-500 font-semibold text-sm">
                                                        <XCircle size={16} />
                                                        Cancelled
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => completeTask(task.id)}
                                                        disabled={completingId === task.id}
                                                        className="inline-flex items-center gap-1.5 bg-[#295A47] hover:bg-[#214839] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                                                    >
                                                        {completingId === task.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={14} />
                                                        )}
                                                        Completed
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {visibleTasks.map((task) => {
                            const wt = parseWorkTypes(task.work_types);
                            const isDone = task.status === "Completed";
                            const isCancelled = task.status === "Cancelled";
                            return (
                                <div key={task.id} className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {wt.map((w) => (
                                                <span
                                                    key={w}
                                                    className="text-[11px] font-medium bg-[#EEF6EE] text-[#295A47] px-2.5 py-1 rounded-full border border-[#D6E7D5]"
                                                >
                                                    {w}
                                                </span>
                                            ))}
                                        </div>
                                        <span
                                            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${priorityBadge[task.priority]}`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>

                                    {task.work_number && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Hash size={13} />
                                            {task.work_number}
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-700 whitespace-pre-line">{task.note}</p>

                                    <div className="flex items-center justify-between pt-2">
                                        <span
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge[task.status]}`}
                                        >
                                            {task.status}
                                        </span>

                                        {isDone ? (
                                            <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                                                <CheckCircle2 size={16} />
                                                Completed
                                            </span>
                                        ) : isCancelled ? (
                                            <span className="flex items-center gap-1.5 text-red-500 text-sm font-semibold">
                                                <XCircle size={16} />
                                                Cancelled
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => completeTask(task.id)}
                                                disabled={completingId === task.id}
                                                className="flex items-center gap-1.5 bg-[#295A47] hover:bg-[#214839] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {completingId === task.id ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle2 size={15} />
                                                )}
                                                Completed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default Timeline;