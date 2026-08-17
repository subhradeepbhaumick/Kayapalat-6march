"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    CalendarDays,
    Clock3,
    Briefcase,
    UserCircle2,
    Sunrise,
} from "lucide-react";

interface HeaderProps {
    employeeName: string;
    employeeId: string;
    department: string;
}

const Header: React.FC<HeaderProps> = ({
    employeeName,
    employeeId,
    department,
}) => {
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const { data: session } = useSession();
    const [checkInTime, setCheckInTime] = useState("--:--");
    const [checkInDateTime, setCheckInDateTime] = useState<Date | null>(null);
    const [workingHours, setWorkingHours] = useState("00:00:00");
    const [employeeInfo, setEmployeeInfo] = useState<any>(null);
    const [currentSlot, setCurrentSlot] = useState<any>(null);
    const [slotProgress, setSlotProgress] = useState(0);

    useEffect(() => {
        const fetchHeader = async () => {
            if (!session?.user?.id) return;

            try {
                const res = await fetch(
                    `/api/employees/workprogress/checkin?emp_id=${session.user.id}`
                );

                const data = await res.json();

                if (data.success) {
                    setEmployeeInfo(data.employee);

                    if (data.currentSlot) {
                        setCurrentSlot(data.currentSlot);
                    }

                    if (data.attendance?.checkin) {
                        // API now returns plain "YYYY-MM-DD HH:MM:SS" strings
                        // (dateStrings: true on the connection), so append
                        // +05:30 to parse it as an absolute IST instant.
                        const checkin = new Date(
                            String(data.attendance.checkin).replace(" ", "T") + "+05:30"
                        );

                        setCheckInDateTime(checkin);

                        setCheckInTime(
                            checkin.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                            })
                        );
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchHeader();
    }, [session]);

    useEffect(() => {
        if (!currentSlot) return;

        const updateProgress = () => {
            // Date.now() is already the true UTC epoch — no offset needed,
            // since start/end below are also true epoch values (parsed with
            // an explicit +05:30 offset).
            const now = Date.now();

            const start = new Date(
                String(currentSlot.slot_start).replace(" ", "T") + "+05:30"
            ).getTime();

            const end = new Date(
                String(currentSlot.slot_end).replace(" ", "T") + "+05:30"
            ).getTime();

            const total = end - start;
            const elapsed = now - start;

            let percent = (elapsed / total) * 100;

            if (Number.isNaN(percent)) percent = 0;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            setSlotProgress(percent);
        };

        updateProgress();

        const timer = setInterval(updateProgress, 1000);

        return () => clearInterval(timer);
    }, [currentSlot]);

    useEffect(() => {
        if (!checkInDateTime) return;

        const updateWorkingTime = () => {
            const diff = Date.now() - checkInDateTime.getTime();

            if (diff < 0) return;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setWorkingHours(
                `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
                    2,
                    "0"
                )}:${String(seconds).padStart(2, "0")}`
            );
        };

        updateWorkingTime();

        const interval = setInterval(updateWorkingTime, 1000);

        return () => clearInterval(interval);
    }, [checkInDateTime]);

    const formattedDate = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#295A47] via-[#3B735D] to-[#4F8D73] text-white shadow-xl">
            {/* Background Blur Circles */}
            <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    {/* LEFT */}
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                            <Sunrise size={18} />
                            {greeting()}
                        </div>
                        <h1 className="mt-5 text-4xl font-bold tracking-tight">
                            Daily Work Progress
                        </h1>
                        <p className="mt-2 text-white/80 text-lg">
                            Update your work every 2 hours and plan tomorrow's
                            tasks before checkout.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                                <CalendarDays size={18} />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                                <Clock3 size={18} />
                                Check In : {checkInTime}
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                                <Briefcase size={18} />
                                Working : {workingHours}
                            </div>
                        </div>
                    </div>
                    {/* RIGHT */}
                    <div className="w-full lg:w-80 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 p-6">
                        <h2 className="text-xl font-bold">
                            {employeeInfo?.name || employeeName}
                        </h2>

                        <p className="text-white/80 text-sm">
                            {employeeInfo?.emp_type || department}
                        </p>

                        <p className="text-white/70 text-xs mt-1">
                            Employee ID : {employeeInfo?.emp_id || employeeId}
                        </p>
                        <div className="mt-6 border-t border-white/20 pt-5">
                            <div className="flex justify-between text-sm mb-6">
                                <span className="text-white/70">
                                    Today's Progress
                                </span>

                                <span className="font-semibold">
                                    {currentSlot ? `Slot ${currentSlot.slot_no}` : "--"}
                                </span>
                            </div>

                            {currentSlot && (
                                <>
                                    {/* Start / End */}
                                    <div className="flex justify-between text-xs text-white/70 mb-2">
                                        <span>
                                            {new Date(
                                                String(currentSlot.slot_start).replace(" ", "T") + "+05:30"
                                            ).toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                                timeZone: "Asia/Kolkata",
                                            })}
                                        </span>

                                        <span>
                                            {new Date(
                                                String(currentSlot.slot_end).replace(" ", "T") + "+05:30"
                                            ).toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                                timeZone: "Asia/Kolkata",
                                            })}
                                        </span>
                                    </div>

                                    {/* Progress Line */}
                                    <div className="relative h-2 rounded-full bg-white/20">
                                        <div
                                            className="absolute left-0 top-0 h-2 rounded-full bg-white"
                                            style={{
                                                width: `${slotProgress}%`,
                                            }}
                                        />

                                        <div
                                            className="absolute top-1/2 h-5 w-5 rounded-full bg-white border-4 border-[#295A47] shadow-xl"
                                            style={{
                                                left: `calc(${slotProgress}% - 10px)`,
                                                transform: "translateY(-50%)",
                                            }}
                                        />
                                    </div>

                                    <div className="mt-5 flex justify-between text-sm">
                                        <span className="text-white/70">
                                            Current Time Progress
                                        </span>

                                        <span className="font-bold">
                                            {slotProgress.toFixed(0)}%
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;