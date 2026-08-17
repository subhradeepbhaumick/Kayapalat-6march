"use client";
import React, { useState, useEffect } from "react";
import {
    Menu,
    X,
    User,
    LogOut,
    FileText,
    Package,
    Truck,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import VendorMyProjects from "./myprojects";
interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    role: string;
    profileImage?: string;
}
interface ProfileData {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    profileImage?: string;
}
const VendorDashboard = () => {
    const [sidebarCollapsed, setSidebarCollapsed] =
        useState(false);
    const [activeTab, setActiveTab] =
        useState("Profile");
    const [showWelcomeBar, setShowWelcomeBar] =
        useState(true);
    const { data: session, update } = useSession();
    const [isEditingProfile, setIsEditingProfile] =
        useState(false);
    const [isLogoutHovered, setIsLogoutHovered] =
        useState(false);
    const [profileData, setProfileData] =
        useState<ProfileData>({
            name: "",
            email: "",
            phone: "",
            whatsapp: "",
        });
    const [profileImage, setProfileImage] =
        useState<string>("");

    const [selectedImage, setSelectedImage] =
        useState<File | null>(null);
    const [user, setUser] = useState<UserProfile>({
        name: "",
        id: "",
        email: "",
        phone: "",
        whatsapp: "",
        role: "Vendor",
        profileImage: "",
    });
    // =========================
    // LOGOUT
    // =========================
    const handleLogout = async () => {
        try {
            await signOut({
                callbackUrl: "/login",
            });
            toast.success("Logged out successfully");
        } catch (error) {
            console.error(error);
            toast.error("Logout failed");
        }
    };
    // =========================
    // SESSION USER
    // =========================
    useEffect(() => {
        if (session?.user) {
            const userData = {
                name: session.user.name || "",
                id: session.user.id || "",
                email: session.user.email || "",
                phone: session.user.phone || "",
                whatsapp:
                    session.user.whatsapp || "",
                role: "Vendor",
                profileImage:
                    session.user.profile_pic || "",
            };
            setUser(userData);
            setProfileData({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                whatsapp: userData.whatsapp,
            });
            setProfileImage(
                session.user.profile_pic || ""
            );
        }
    }, [session]);
    // =========================
    // RESPONSIVE SIDEBAR
    // =========================
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            } else {
                setSidebarCollapsed(false);
            }
        };
        handleResize();
        window.addEventListener(
            "resize",
            handleResize
        );
        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );
        };
    }, []);
    // =========================
    // SIDEBAR ITEMS
    // =========================
    const sidebarItems = [
        {
            icon: User,
            label: "My Profile",
            key: "Profile",
        },
        {
            icon: FileText,
            label: "My Projects",
            key: "MyProjects",
        },
    ];
    return (
        <div className="min-h-screen bg-[#D2EBD0] flex">
            {/* ========================= */}
            {/* SIDEBAR */}
            {/* ========================= */}
            <div
                className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300
        ${sidebarCollapsed
                        ? "-translate-x-full lg:translate-x-0 lg:w-16"
                        : "translate-x-0 w-64"
                    }`}
            >
                <div className="p-4 border-b bg-[#D7E7D0]">
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#295A47]">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {user.role}
                                    </p>
                                    <p className="text-red-500 font-semibold">
                                        ID: {user.id}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() =>
                                setSidebarCollapsed(
                                    !sidebarCollapsed
                                )
                            }
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
                {/* NAVIGATION */}
                <nav className="mt-8">
                    {sidebarItems.map((item) => (
                        <div
                            key={item.key}
                            onClick={() =>
                                setActiveTab(item.key)
                            }
                            className={`flex items-center py-3 cursor-pointer
              ${sidebarCollapsed
                                    ? "justify-center px-3"
                                    : "px-6"
                                }
              ${activeTab === item.key
                                    ? "bg-[#D7E7D0] text-[#295A47]"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {!sidebarCollapsed && (
                                <span className="ml-3">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
            {/* ========================= */}
            {/* MAIN CONTENT */}
            {/* ========================= */}
            <div
                className={`flex-1 overflow-y-auto pt-20
        ${sidebarCollapsed
                        ? "lg:ml-16"
                        : "lg:ml-64"
                    }`}
            >
                {/* ========================= */}
                {/* NAVBAR */}
                {/* ========================= */}
                <div
                    className={`bg-white shadow-md p-3 md:p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40 ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}
                >
                    <button
                        onClick={() =>
                            setSidebarCollapsed(
                                !sidebarCollapsed
                            )
                        }
                        className="lg:hidden p-2 text-[#295A47]"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center">
                        <img
                            src="/kayapalat-logo.png"
                            alt="Logo"
                            className="h-6 w-auto"
                        />
                    </div>
                    {/* LOGOUT BUTTON */}
                    <button
                        onClick={handleLogout}
                        onMouseEnter={() =>
                            setIsLogoutHovered(true)
                        }
                        onMouseLeave={() =>
                            setIsLogoutHovered(false)
                        }
                        className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md"
                        style={{
                            width: isLogoutHovered
                                ? "125px"
                                : "45px",
                            height: "45px",
                            borderRadius:
                                isLogoutHovered
                                    ? "40px"
                                    : "50%",
                            backgroundColor:
                                "rgb(255,65,65)",
                            transition:
                                "width 0.3s, border-radius 0.3s",
                        }}
                    >
                        {/* ICON */}
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: isLogoutHovered
                                    ? "30%"
                                    : "100%",
                                paddingLeft:
                                    isLogoutHovered
                                        ? "20px"
                                        : "0px",
                                transition:
                                    "width 0.3s, padding-left 0.3s",
                            }}
                        >
                            <LogOut
                                size={18}
                                color="white"
                            />
                        </div>
                        {/* TEXT */}
                        <div
                            className="absolute right-0 font-semibold text-white"
                            style={{
                                opacity:
                                    isLogoutHovered ? 1 : 0,
                                width: isLogoutHovered
                                    ? "70%"
                                    : "0%",
                                paddingRight:
                                    isLogoutHovered
                                        ? "10px"
                                        : "0px",
                                transition:
                                    "opacity 0.3s, width 0.3s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Logout
                        </div>
                    </button>
                </div>
                {/* ========================= */}
                {/* WELCOME BAR */}
                {/* ========================= */}
                {showWelcomeBar && (
                    <div className="bg-[#295A47] text-white py-3 px-6 relative">
                        <h4 className="text-center font-semibold text-lg">
                            Welcome to Vendor Dashboard
                        </h4>
                        <button
                            onClick={() =>
                                setShowWelcomeBar(false)
                            }
                            className="absolute top-1/2 right-4 -translate-y-1/2"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                {/* ========================= */}
                {/* PAGE CONTENT */}
                {/* ========================= */}
                <div className="p-4 md:p-8">
                    <div className="max-w-8xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
                            {/* PROFILE */}
                            {activeTab === "Profile" && (
                                <>
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
                                            My Profile
                                        </h1>
                                        <p className="text-gray-600">
                                            View and manage your
                                            vendor account information.
                                        </p>
                                    </div>
                                    <div className="max-w-2xl mx-auto">
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <div className="space-y-4">
                                                {/* PROFILE IMAGE */}
                                                <div className="flex flex-col items-center mb-6">
                                                    <div className="relative">
                                                        {profileImage ? (
                                                            <img
                                                                src={profileImage}
                                                                alt="Profile"
                                                                className="w-32 h-32 rounded-full object-cover border-4 border-[#295A47] shadow-lg"
                                                            />
                                                        ) : (
                                                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-[#295A47]">
                                                                <User className="w-14 h-14 text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditingProfile && (
                                                        <div className="mt-4">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file =
                                                                        e.target.files?.[0];

                                                                    if (file) {
                                                                        setSelectedImage(file);

                                                                        const imageUrl =
                                                                            URL.createObjectURL(
                                                                                file
                                                                            );

                                                                        setProfileImage(
                                                                            imageUrl
                                                                        );
                                                                    }
                                                                }}
                                                                className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#295A47]
                file:text-white
                hover:file:bg-[#1e3d32]"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* NAME */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            isEditingProfile
                                                                ? profileData.name
                                                                : user.name
                                                        }
                                                        onChange={(e) =>
                                                            setProfileData(
                                                                (
                                                                    prev
                                                                ) => ({
                                                                    ...prev,
                                                                    name:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        readOnly={
                                                            !isEditingProfile
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                {/* EMAIL */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={user.email}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                                    />
                                                </div>
                                                {/* PHONE */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            isEditingProfile
                                                                ? profileData.phone
                                                                : user.phone
                                                        }
                                                        onChange={(e) =>
                                                            setProfileData(
                                                                (
                                                                    prev
                                                                ) => ({
                                                                    ...prev,
                                                                    phone:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        readOnly={
                                                            !isEditingProfile
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                {/* WHATSAPP */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        WhatsApp
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            isEditingProfile
                                                                ? profileData.whatsapp
                                                                : user.whatsapp
                                                        }
                                                        onChange={(e) =>
                                                            setProfileData(
                                                                (
                                                                    prev
                                                                ) => ({
                                                                    ...prev,
                                                                    whatsapp:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        readOnly={
                                                            !isEditingProfile
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                {/* USER ID */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        User ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.id}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                                    />
                                                </div>
                                                {/* ROLE */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Role
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.role}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                                    />
                                                </div>
                                            </div>
                                            {/* BUTTONS */}
                                            <div className="mt-6 text-center">
                                                {!isEditingProfile ? (
                                                    <button
                                                        onClick={() =>
                                                            setIsEditingProfile(
                                                                true
                                                            )
                                                        }
                                                        className="px-6 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32]"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-4 justify-center">
                                                        <button
                                                            onClick={() => {
                                                                setIsEditingProfile(
                                                                    false
                                                                );
                                                                setProfileData({
                                                                    name: user.name,
                                                                    email:
                                                                        user.email,
                                                                    phone:
                                                                        user.phone,
                                                                    whatsapp:
                                                                        user.whatsapp,
                                                                });
                                                            }}
                                                            className="px-6 py-2 bg-gray-600 text-white rounded-lg"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const formData = new FormData();

                                                                    formData.append(
                                                                        "name",
                                                                        profileData.name
                                                                    );

                                                                    formData.append(
                                                                        "phone",
                                                                        profileData.phone
                                                                    );

                                                                    formData.append(
                                                                        "whatsapp",
                                                                        profileData.whatsapp
                                                                    );

                                                                    if (selectedImage) {
                                                                        formData.append(
                                                                            "profileImage",
                                                                            selectedImage
                                                                        );
                                                                    }

                                                                    const response = await fetch(
                                                                        "/api/vendor/profile",
                                                                        {
                                                                            method: "PUT",
                                                                            credentials: "include",
                                                                            body: formData,
                                                                        }
                                                                    );

                                                                    if (!response.ok) {
                                                                        throw new Error("Failed");
                                                                    }

                                                                    const data = await response.json();

                                                                    if (data.user && data.user[0]) {
                                                                        const updatedUser = data.user[0];

                                                                        setUser((prev) => ({
                                                                            ...prev,
                                                                            name: updatedUser.name,
                                                                            phone: updatedUser.phone,
                                                                            whatsapp: updatedUser.whatsapp,
                                                                            profileImage:
                                                                                updatedUser.profile_pic,
                                                                        }));

                                                                        setProfileImage(
                                                                            updatedUser.profile_pic
                                                                        );
                                                                    }

                                                                    setIsEditingProfile(false);

                                                                    toast.success(
                                                                        "Profile updated"
                                                                    );
                                                                } catch (error) {
                                                                    console.error(error);

                                                                    toast.error(
                                                                        "Failed to update"
                                                                    );
                                                                }
                                                            }}
                                                            className="px-6 py-2 bg-green-600 text-white rounded-lg"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* MY PROJECTS */}
                            {activeTab === "MyProjects" && (
                                <VendorMyProjects />
                            )}

                        </div>
                    </div>
                </div>
            </div>
            {/* MOBILE OVERLAY */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() =>
                        setSidebarCollapsed(true)
                    }
                />
            )}
        </div>
    );
};
export default VendorDashboard;