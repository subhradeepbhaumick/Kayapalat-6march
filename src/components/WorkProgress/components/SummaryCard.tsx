"use client";
import {
    CheckCircle2,
    Clock3,
    ListTodo,
    TrendingUp,
} from "lucide-react";
export default function SummaryCard() {
    const items = [
        {
            icon: Clock3,
            title: "Hours Worked",
            value: "4.5 hrs",
        },
        {
            icon: CheckCircle2,
            title: "Completed",
            value: "3 Tasks",
        },
        {
            icon: ListTodo,
            title: "Pending",
            value: "2 Tasks",
        },
        {
            icon: TrendingUp,
            title: "Productivity",
            value: "76%",
        },
    ];
    return (
        <div className="bg-white rounded-3xl border shadow-lg p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-[#295A47] mb-6">
                Today's Summary
            </h2>
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-2xl bg-[#EEF6EE]"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon
                                className="text-[#295A47]"
                                size={22}
                            />
                            <span>{item.title}</span>
                        </div>
                        <span className="font-bold text-[#295A47]">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}