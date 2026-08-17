"use client";

import { useState } from "react";
import {
    ListChecks,
    ClipboardList,
    CalendarClock,
} from "lucide-react";

import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import Timeline from "./components/Timeline";
import UpdateForm from "./components/UpdateForm";
import TomorrowPlan from "./components/TomorrowPlan";

type Tab = "timeline" | "update" | "tomorrow";

export default function WorkProgress() {
    const [activeTab, setActiveTab] = useState<Tab>("update");

    return (
        <div className="space-y-8">

            <Header
                employeeName=""
                employeeId=""
                department=""
            />

            <StatsCards />

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow border p-2 flex flex-wrap gap-2">



                <button
                    onClick={() => setActiveTab("update")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                        ${activeTab === "update"
                            ? "bg-[#295A47] text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    <ClipboardList size={18} />
                    Update Work
                </button>
                <button
                    onClick={() => setActiveTab("timeline")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                        ${activeTab === "timeline"
                            ? "bg-[#295A47] text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    <ListChecks size={18} />
                    Pending Tasks
                </button>
                <button
                    onClick={() => setActiveTab("tomorrow")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                        ${activeTab === "tomorrow"
                            ? "bg-[#295A47] text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    <CalendarClock size={18} />
                    Tomorrow Plan
                </button>

            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">



                {activeTab === "update" && <UpdateForm />}
                {activeTab === "timeline" && <Timeline />}
                {activeTab === "tomorrow" && <TomorrowPlan />}

            </div>

        </div>
    );
}