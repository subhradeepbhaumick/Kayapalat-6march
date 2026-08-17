"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
interface Vendor {
    user_id: string;
    vendor_name: string;
    email: string;
    phone: string;
    profilePic: string;
}
interface AssignedVendor {
    id: number;
    vendor_id: string;
    vendor_name: string | null;
    profile_pic: string;
}

interface ProjectAllotment {
    id: string;
    appointment_id: string;
    project_name: string;
    client_name: string;
    project_value: number;
    vendors: AssignedVendor[];
}
const supervisor_Vendor = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState("All");
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [projectAllotments, setProjectAllotments] = useState<ProjectAllotment[]>([]);
    const [activeAllotmentId, setActiveAllotmentId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        vendor_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        profilePic: null as File | null,
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState({
        email: "",
        phone: "",
    });
    // ============================================
    // FETCH VENDORS
    // ============================================
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // FETCH VENDORS
            const vendorRes = await fetch("/api/supervisor/vendor");
            const vendorData = await vendorRes.json();

            if (vendorRes.ok) {
                const formattedVendors = vendorData.vendors.map((v: any) => ({
                    ...v,
                    profilePic:
                        v.profile_pic || "/placeholder_person.jpg",
                }));

                setVendors(formattedVendors);
            }

            // FETCH PROJECTS + ASSIGNMENTS
            const projectRes = await fetch(
                "/api/supervisor/project-vendor"
            );

            const projectData = await projectRes.json();

            if (projectRes.ok) {
                setProjectAllotments(
                    projectData.projects.map((p: any) => ({
                        ...p,
                        vendors:
                            projectData.assignments?.[
                            p.appointment_id
                            ] || [],
                    }))
                );
            }
        } catch (err) {
            console.log(err);
        }
    };
    const fetchVendors = async () => {
        try {
            const res = await fetch("/api/supervisor/vendor");
            const data = await res.json();
            if (res.ok) {
                const formattedVendors = data.vendors.map((v: any) => ({
                    ...v,
                    profilePic:
                        v.profile_pic || "/placeholder_person.jpg",
                }));
                setVendors(formattedVendors);
            }
        } catch (err) {
            console.log(err);
        }
    };
    // ============================================
    // FILTER
    // ============================================
    const uniqueVendors = Array.from(
        new Set(vendors.map((v) => v.vendor_name))
    );
    const filteredVendors = vendors.filter(
        (vendor) =>
            selectedVendor === "All" ||
            vendor.vendor_name === selectedVendor
    );
    // ============================================
    // INPUT CHANGE
    // ============================================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        // EMAIL VALIDATION
        if (name === "email") {
            if (!value.includes("@")) {
                setErrors((prev) => ({
                    ...prev,
                    email: "Email must contain @",
                }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    email: "",
                }));
            }
        }
        // PHONE VALIDATION
        if (name === "phone") {
            if (value.length !== 10) {
                setErrors((prev) => ({
                    ...prev,
                    phone: "Phone must be 10 digits",
                }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    phone: "",
                }));
            }
        }
    };
    // ============================================
    // FILE CHANGE
    // ============================================
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileURL = URL.createObjectURL(file);
            setPreview(fileURL);
            setFormData({
                ...formData,
                profilePic: file,
            });
        }
    };
    // ============================================
    // SUBMIT VENDOR
    // ============================================
    const submitVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vendor_name || !formData.email) {
            alert("Vendor name and email required");
            return;
        }
        if (errors.email || errors.phone) {
            alert("Please fix validation errors");
            return;
        }
        if (!isEditing && !formData.password) {
            alert("Password required");
            return;
        }
        try {
            const formDataToSend = new FormData();
            formDataToSend.append(
                "vendor_name",
                formData.vendor_name
            );
            formDataToSend.append("email", formData.email);
            formDataToSend.append("phone", formData.phone);
            formDataToSend.append("address", formData.address);
            formDataToSend.append(
                "password",
                formData.password
            );
            if (formData.profilePic) {
                formDataToSend.append(
                    "profilePic",
                    formData.profilePic
                );
            }
            if (isEditing) {
                formDataToSend.append(
                    "user_id",
                    editingVendor?.user_id || ""
                );
            }
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(
                "/api/supervisor/vendor",
                {
                    method,
                    body: formDataToSend,
                }
            );
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchVendors();
                resetForm();
            } else {
                alert(data.error || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };
    // ============================================
    // DELETE VENDOR
    // ============================================
    const handleDeleteVendor = async (user_id: string) => {
        const confirmDelete = confirm(
            "Are you sure you want to delete this vendor?"
        );
        if (!confirmDelete) return;
        try {
            const res = await fetch(
                `/api/supervisor/vendor?user_id=${user_id}`,
                {
                    method: "DELETE",
                }
            );
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setVendors((prev) =>
                    prev.filter(
                        (vendor) => vendor.user_id !== user_id
                    )
                );
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.log(err);
            alert("Failed to delete vendor");
        }
    };
    // ============================================
    // RESET FORM
    // ============================================
    const resetForm = () => {
        setFormData({
            vendor_name: "",
            email: "",
            phone: "",
            address: "",
            password: "",
            profilePic: null,
        });
        setPreview(null);
        setIsEditing(false);
        setEditingVendor(null);
        setShowAddPopup(false);
    };
    // ============================================
    // EDIT CLICK
    // ============================================
    const handleEditClick = (vendor: Vendor) => {
        setIsEditing(true);
        setEditingVendor(vendor);
        setFormData({
            vendor_name: vendor.vendor_name,
            email: vendor.email,
            phone: vendor.phone,
            address: "",
            password: "",
            profilePic: null,
        });
        setPreview(vendor.profilePic);
        setShowAddPopup(true);
    };
    const handleAddVendor = async (
        projectId: string,
        vendorId: string
    ) => {
        try {
            const res = await fetch(
                "/api/supervisor/project-vendor",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        appointment_id: projectId,
                        vendor_id: vendorId,
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                const vendor = vendors.find(
                    (v) => v.user_id === vendorId
                );

                setProjectAllotments((prev) =>
                    prev.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                vendors: [
                                    ...p.vendors,
                                    {
                                        id: data.assignment.id,
                                        vendor_id: vendorId,
                                        vendor_name:
                                            vendor?.vendor_name || null,
                                        profile_pic:
                                            vendor?.profilePic ||
                                            "/placeholder_person.jpg",
                                    },
                                ],
                            }
                            : p
                    )
                );

                setActiveAllotmentId(null);
            } else {
                alert(data.error || "Failed to add vendor");
            }
        } catch (err) {
            console.log(err);
            alert("Failed to add vendor");
        }
    };
    const handleRemoveVendor = async (
        projectId: string,
        assignmentId: number
    ) => {
        try {
            const res = await fetch(
                `/api/supervisor/project-vendor?id=${assignmentId}`,
                {
                    method: "DELETE",
                }
            );

            if (res.ok) {
                setProjectAllotments((prev) =>
                    prev.map((p) =>
                        p.id === projectId
                            ? {
                                ...p,
                                vendors: p.vendors.filter(
                                    (v) => v.id !== assignmentId
                                ),
                            }
                            : p
                    )
                );
            }
        } catch (err) {
            console.log(err);
        }
    };
    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-[#295A47] mb-4">
                    Vendor Management
                </h1>
                <p className="text-gray-600 text-lg">
                    Manage vendors and their details.
                </p>
            </div>
            {/* TOP BAR */}
            <div className="flex items-end justify-between mb-6">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">
                        Select Vendor
                    </label>
                    <select
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
                        value={selectedVendor}
                        onChange={(e) =>
                            setSelectedVendor(e.target.value)
                        }
                    >
                        <option value="All">All</option>
                        {uniqueVendors.map(
                            (vendorName, index) => (
                                <option
                                    key={index}
                                    value={vendorName}
                                >
                                    {vendorName}
                                </option>
                            )
                        )}
                    </select>
                </div>
                <button
                    className="bg-green-900 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    onClick={() => {
                        resetForm();
                        setShowAddPopup(true);
                    }}
                >
                    Add Vendor
                </button>
            </div>
            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full border border-gray-200 bg-white">
                    <thead className="bg-[#D7E7D0] text-gray-700">
                        <tr>
                            <th className="px-4 py-3 border">
                                Vendor ID
                            </th>
                            <th className="px-4 py-3 border">
                                Profile
                            </th>
                            <th className="px-4 py-3 border">
                                Vendor Name
                            </th>
                            <th className="px-4 py-3 border">
                                Email
                            </th>
                            <th className="px-4 py-3 border">
                                Phone
                            </th>
                            <th className="px-4 py-3 border">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVendors.length > 0 ? (
                            filteredVendors.map((vendor) => (
                                <tr
                                    key={vendor.user_id}
                                    className="hover:bg-green-50 transition"
                                >
                                    <td className="px-4 py-3 border text-center">
                                        {vendor.user_id}
                                    </td>
                                    <td className="px-4 py-3 border text-center">
                                        <img
                                            src={vendor.profilePic}
                                            alt="vendor"
                                            className="w-10 h-10 rounded-full mx-auto object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 border">
                                        {vendor.vendor_name}
                                    </td>
                                    <td className="px-4 py-3 border">
                                        {vendor.email}
                                    </td>
                                    <td className="px-4 py-3 border">
                                        {vendor.phone}
                                    </td>
                                    <td className="px-4 py-3 border">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                onClick={() =>
                                                    handleEditClick(
                                                        vendor
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                                onClick={() =>
                                                    handleDeleteVendor(
                                                        vendor.user_id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center py-6 text-gray-500 border"
                                >
                                    No vendors found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-10">
                <h2 className="text-2xl font-bold text-[#295A47] mb-4">
                    Project Vendor Allotment
                </h2>

                <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full border border-gray-200 bg-white">
                        <thead className="bg-[#D7E7D0] text-gray-700">
                            <tr>
                                <th className="px-4 py-2 border">
                                    Project ID
                                </th>

                                <th className="px-4 py-2 border">
                                    Project Name
                                </th>

                                <th className="px-4 py-2 border">
                                    Client
                                </th>

                                <th className="px-4 py-2 border">
                                    Vendor
                                </th>

                                <th className="px-4 py-2 border">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {projectAllotments.map((project) => (
                                <tr
                                    key={project.id}
                                    className="hover:bg-green-50 transition"
                                >
                                    <td className="px-4 py-2 border text-center">
                                        {project.appointment_id}
                                    </td>

                                    <td className="px-4 py-2 border">
                                        {project.project_name}
                                    </td>

                                    <td className="px-4 py-2 border">
                                        {project.client_name}
                                    </td>

                                    <td className="px-4 py-2 border">
                                        {activeAllotmentId === project.id ? (
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="border border-gray-300 rounded px-2 py-1"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleAddVendor(
                                                                project.id,
                                                                e.target.value
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <option
                                                        value=""
                                                        disabled
                                                    >
                                                        Select Vendor
                                                    </option>

                                                    {vendors
                                                        .filter(
                                                            (v) =>
                                                                !project.vendors.some(
                                                                    (pv) =>
                                                                        pv.vendor_id ===
                                                                        v.user_id
                                                                )
                                                        )
                                                        .map((v) => (
                                                            <option
                                                                key={v.user_id}
                                                                value={v.user_id}
                                                            >
                                                                {v.user_id}
                                                            </option>
                                                        ))}
                                                </select>

                                                <button
                                                    className="text-sm text-gray-500"
                                                    onClick={() =>
                                                        setActiveAllotmentId(null)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {project.vendors.length > 0 ? (
                                                    project.vendors.map((v) => (
                                                        <div
                                                            key={v.id}
                                                            className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1"
                                                        >
                                                            <span>
                                                                {v.vendor_id}
                                                            </span>

                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveVendor(
                                                                        project.id,
                                                                        v.id
                                                                    )
                                                                }
                                                            >
                                                                <X
                                                                    size={14}
                                                                    className="text-red-500"
                                                                />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Not Assigned
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-2 border text-center">
                                        <button
                                            className="bg-[#295A47] text-white px-3 py-1 rounded hover:bg-[#1e3d32]"
                                            onClick={() =>
                                                setActiveAllotmentId(
                                                    activeAllotmentId === project.id
                                                        ? null
                                                        : project.id
                                                )
                                            }
                                        >
                                            {activeAllotmentId === project.id
                                                ? "Close"
                                                : "Add"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* ADD / EDIT POPUP */}
            {showAddPopup && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
                        <button
                            className="absolute top-3 right-3 text-gray-600 hover:text-black"
                            onClick={() => setShowAddPopup(false)}
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-semibold mb-4 text-center">
                            {isEditing
                                ? "Edit Vendor"
                                : "Add New Vendor"}
                        </h2>
                        <form
                            onSubmit={submitVendor}
                            encType="multipart/form-data"
                            className="space-y-3"
                        >
                            <input
                                name="vendor_name"
                                placeholder="Vendor Name"
                                className="w-full border p-2 rounded"
                                onChange={handleInputChange}
                                value={formData.vendor_name}
                            />
                            <div>
                                <input
                                    name="email"
                                    placeholder="Email"
                                    className="w-full border p-2 rounded"
                                    onChange={handleInputChange}
                                    value={formData.email}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <input
                                    name="phone"
                                    placeholder="Phone"
                                    className="w-full border p-2 rounded"
                                    onChange={handleInputChange}
                                    value={formData.phone}
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                            <input
                                name="address"
                                placeholder="Address"
                                className="w-full border p-2 rounded"
                                onChange={handleInputChange}
                                value={formData.address}
                            />
                            {/* IMAGE */}
                            <div className="flex items-center gap-4">
                                {preview ? (
                                    <img
                                        src={preview}
                                        className="w-20 h-20 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                        No Image
                                    </div>
                                )}
                                <div>
                                    <input
                                        id="profilePic"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="profilePic"
                                        className="cursor-pointer bg-[#295A47] text-white px-4 py-2 rounded-md hover:bg-[#1e3d32]"
                                    >
                                        Upload Photo
                                    </label>
                                </div>
                            </div>
                            <input
                                name="password"
                                type="password"
                                placeholder={
                                    isEditing
                                        ? "New Password (optional)"
                                        : "Password"
                                }
                                className="w-full border p-2 rounded"
                                onChange={handleInputChange}
                                value={formData.password}
                            />
                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 rounded-md mt-3 hover:bg-green-700"
                            >
                                {isEditing
                                    ? "Update Vendor"
                                    : "Add Vendor"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};
export default supervisor_Vendor;