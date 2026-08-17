"use client";
import React, { useEffect, useState } from "react";
import {
    Menu,
    LayoutDashboard,
    Users,
    ShoppingCart,
    BarChart3,
    ClipboardList,
    IndianRupee,
    User,
    LogOut,
    Bell,
    TrendingUp,
    Package,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import EmployeeAttendancePage from "@/components/EmployeeAttendance";
const showroom_staffDashboard= () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [activeTab, setActiveTab] = useState("Dashboard");
    const { data: session } = useSession();
    const user = session?.user;
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
    });
    useEffect(() => {
        const handleResize = () => {
            setSidebarCollapsed(window.innerWidth < 1024);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    useEffect(() => {
        // Example static data
        setStats({
            totalSales: 245,
            totalOrders: 180,
            totalCustomers: 96,
            totalRevenue: 458000,
        });
    }, []);
    const handleLogout = async () => {
        try {
            const callbackUrl = `${window.location.origin}/login`;
            await signOut({ callbackUrl });
            toast.success("Logged out successfully");
        } catch (error) {
            console.error(error);
            toast.error("Logout failed");
        }
    };
    const sidebarItems = [
        {
            icon: LayoutDashboard,
            label: "Dashboard",
            key: "Dashboard",
        },
        {
            icon: Users,
            label: "Attendance",
            key: "Attendance",
        },
    ];
    return (
        <div className="min-h-screen bg-[#EEF6EE] flex">
            {/* SIDEBAR */}
            <div
                className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transition-all duration-300
        ${sidebarCollapsed ? "-translate-x-full lg:w-20" : "translate-x-0 w-72"}
        lg:translate-x-0`}
            >
                {/* PROFILE */}
                <div className="p-5 border-b bg-[#D7E7D0]">
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                                    <img
                                        src={user?.image || "/placeholder_person.jpg"}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[#295A47] text-lg">
                                        {user?.name || "Showroom Staff"}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Showroom Staff
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ID: {user?.id || "N/A"}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed((prev) => !prev)}
                            className="text-[#295A47]"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
                {/* MENU */}
                <nav className="mt-8">
                    {sidebarItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setActiveTab(item.key)}
                            className={`flex items-center cursor-pointer transition-all duration-200
              ${activeTab === item.key
                                    ? "bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]"
                                    : "hover:bg-gray-100 text-gray-700"
                                }
              ${sidebarCollapsed ? "justify-center py-4" : "px-6 py-4"}
              `}
                        >
                            <item.icon size={22} />
                            {!sidebarCollapsed && (
                                <span className="ml-4 font-medium">{item.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
            {/* MAIN CONTENT */}
            <div
                className={`flex-1 transition-all duration-300
        ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}
            >
                {/* NAVBAR */}
                <div
                    className={`fixed top-0 right-0 z-40 bg-white shadow-md h-20 flex items-center justify-between px-6 transition-all duration-300
          ${sidebarCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-72"}`}
                >
                    {/* LEFT */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarCollapsed((prev) => !prev)}
                            className="lg:hidden text-[#295A47]"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#295A47]">
                                Showroom Staff Dashboard
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage office activities
                            </p>
                        </div>
                    </div>
                    {/* RIGHT */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md"
                            style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "50%",
                                backgroundColor: "rgb(253, 25, 25)",
                                transition: "0.3s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.width = "125px";
                                e.currentTarget.style.borderRadius = "40px";
                                const iconElement =
                                    e.currentTarget.querySelector(".logout-icon");
                                if (iconElement instanceof HTMLElement) {
                                    iconElement.style.width = "30%";
                                    iconElement.style.paddingLeft = "20px";
                                }
                                const labelElement =
                                    e.currentTarget.querySelector(".logout-text");
                                if (labelElement instanceof HTMLElement) {
                                    labelElement.style.opacity = "1";
                                    labelElement.style.width = "70%";
                                    labelElement.style.paddingRight = "10px";
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.width = "45px";
                                e.currentTarget.style.borderRadius = "50%";
                                const iconElement =
                                    e.currentTarget.querySelector(".logout-icon");
                                if (iconElement instanceof HTMLElement) {
                                    iconElement.style.width = "100%";
                                    iconElement.style.paddingLeft = "0px";
                                }
                                const labelElement =
                                    e.currentTarget.querySelector(".logout-text");
                                if (labelElement instanceof HTMLElement) {
                                    labelElement.style.opacity = "0";
                                    labelElement.style.width = "0%";
                                    labelElement.style.paddingRight = "0px";
                                }
                            }}
                        >
                            <div
                                className="logout-icon flex items-center justify-center"
                                style={{
                                    width: "100%",
                                    transition: "0.3s",
                                }}
                            >
                                <svg viewBox="0 0 512 512" width="17px">
                                    <path
                                        fill="white"
                                        d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                                    />
                                </svg>
                            </div>
                            <div
                                className="logout-text absolute right-0 font-semibold text-white"
                                style={{
                                    width: "0%",
                                    opacity: 0,
                                    transition: "0.3s",
                                    fontSize: "1.1em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Logout
                            </div>
                        </button>
                    </div>
                </div>
                {/* CONTENT */}
                <div className="pt-24 p-6">
                    {activeTab === "Dashboard" && (
                        <div className="bg-white rounded-3xl p-10 shadow-md border">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                                <div>
                                    <h1 className="text-4xl font-bold text-[#295A47]">
                                        Welcome Back 👋
                                    </h1>
                                    <p className="text-gray-500 mt-3 text-lg">
                                        Showroom Staff Dashboard
                                    </p>
                                </div>
                                <div className="bg-[#295A47]/10 px-6 py-4 rounded-2xl">
                                    <p className="text-sm text-gray-500">
                                        Logged in as
                                    </p>
                                    <h2 className="text-2xl font-bold text-[#295A47]">
                                        {user?.name || "Showroom Staff"}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "Attendance" && (
                        <EmployeeAttendancePage />
                    )}
                    {activeTab !== "Dashboard" &&
                        activeTab !== "Attendance" && (
                            <div className="bg-white rounded-3xl p-10 shadow-md border text-center">
                                <h2 className="text-3xl font-bold text-[#295A47]">
                                    {activeTab}
                                </h2>
                                <p className="text-gray-500 mt-3">
                                    This section is under development.
                                </p>
                            </div>
                        )}
                </div>
            </div>
            {/* MOBILE OVERLAY */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}
        </div>
    );
};
export default showroom_staffDashboard;