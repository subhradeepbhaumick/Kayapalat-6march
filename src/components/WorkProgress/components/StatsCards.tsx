"use client";
import React, { useEffect, useState } from "react";
import {
    ClipboardCheck,
    Clock3,
    ListTodo,
    TrendingUp,
    ArrowUpRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
interface StatsData {
    updatesSubmitted: number;
    totalSlots: number;
    nextUpdate: string;
    pendingTasks: number;
    productivity: number;
    monthlyCompletedSlots: number;
    monthlyTotalSlots: number;
}
export default function StatsCards() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<StatsData>({
        updatesSubmitted: 0,
        totalSlots: 0,
        nextUpdate: "--",
        pendingTasks: 0,
        productivity: 0,
        monthlyCompletedSlots: 0,
        monthlyTotalSlots: 0,
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!session?.user?.id) return;
        fetchStats();
    }, [session]);
    async function fetchStats() {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/employees/workprogress/stats?emp_id=${session?.user?.id}`,
                {
                    cache: "no-store",
                }
            );
            const data = await res.json();
            if (data.success) {
                setStats({
                    updatesSubmitted: data.updatesSubmitted,
                    totalSlots: data.totalSlots,
                    nextUpdate: data.nextUpdate,
                    pendingTasks: data.pendingTasks,
                    productivity: data.productivity,
                    monthlyCompletedSlots: data.monthlyFilledSlots,
                    monthlyTotalSlots: data.monthlyTotalSlots,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    const productivityGradient =
        stats.productivity >= 90
            ? "from-green-500 to-emerald-600"
            : stats.productivity >= 75
                ? "from-lime-500 to-green-500"
                : stats.productivity >= 50
                    ? "from-yellow-500 to-orange-500"
                    : "from-red-500 to-rose-600";
    const cards = [
        {
            title: "Updates Submitted",
            value: loading
                ? "--"
                : `${stats.updatesSubmitted}/${stats.totalSlots}`,
            subtitle: "Today's progress",
            icon: ClipboardCheck,
            bg: "from-emerald-500 to-green-600",
        },
        {
            title: "Next Update",
            value: loading ? "--" : stats.nextUpdate,
            subtitle: "Upcoming slot",
            icon: Clock3,
            bg: "from-blue-500 to-cyan-600",
        },
        {
            title: "Pending Tasks",
            value: loading ? "--" : stats.pendingTasks,
            subtitle: "Needs attention",
            icon: ListTodo,
            bg: "from-orange-500 to-amber-500",
        },
        {
            title: "Productivity",
            value: loading ? "--" : `${stats.productivity}%`,
            subtitle: `${stats.monthlyCompletedSlots}/${stats.monthlyTotalSlots} slots this month`,
            icon: TrendingUp,
            bg: productivityGradient,
        },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                        {/* Top Gradient */}
                        <div
                            className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${card.bg}`}
                        />
                        {/* Background Circle */}
                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gray-100 opacity-60 group-hover:scale-125 transition-all duration-500" />
                        <div className="relative p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {card.title}
                                    </p>
                                    <h2 className="mt-3 text-3xl font-bold text-[#295A47]">
                                        {card.value}
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-400">
                                        {card.subtitle}
                                    </p>
                                </div>
                                <div
                                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${card.bg} flex items-center justify-center shadow-lg`}
                                >
                                    <Icon
                                        size={26}
                                        className="text-white"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-xs">
                                    {stats.productivity < 50 ? (
                                        <div className="space-y-1">
                                            <p className="font-semibold text-red-600">
                                                ⚠ Productivity: {stats.productivity}%
                                            </p>
                                            <p className="text-red-500">
                                                Below 50% — 1 day salary deduction applicable
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="font-semibold text-green-600">
                                                ✅ Productivity: {stats.productivity}%
                                            </p>
                                            <p className="text-green-500">
                                                Good productivity. No salary deduction.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <ArrowUpRight
                                    size={18}
                                    className="text-gray-400 group-hover:text-[#295A47] transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}