"use client";
import React from "react";
interface Props {
    show: boolean;
    onClose: () => void;
    newEmployeeData: {
        department: string;
        name: string;
        email: string;
        phone: string;
        whatsapp: string;
        address: string;
        password: string;
        profile_picture: File | null;
        profile_preview: string;
    };
    setNewEmployeeData: React.Dispatch<
        React.SetStateAction<{
            department: string;
            name: string;
            email: string;
            phone: string;
            whatsapp: string;
            address: string;
            password: string;
            profile_picture: File | null;
            profile_preview: string;
        }>
    >;
}
export default function AddNewEmployeeModal({
    show,
    onClose,
    newEmployeeData,
    setNewEmployeeData,
}: Props) {
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append(
                "department",
                newEmployeeData.department
            );
            formData.append(
                "name",
                newEmployeeData.name
            );
            formData.append(
                "email",
                newEmployeeData.email
            );
            formData.append(
                "phone",
                newEmployeeData.phone
            );
            formData.append(
                "whatsapp",
                newEmployeeData.whatsapp
            );
            formData.append(
                "address",
                newEmployeeData.address
            );
            formData.append(
                "password",
                newEmployeeData.password
            );
            if (newEmployeeData.profile_picture) {
                formData.append(
                    "profile_picture",
                    newEmployeeData.profile_picture
                );
            }
            const res = await fetch(
                "/api/employees/add-new-user",
                {
                    method: "POST",
                    body: formData,
                }
            );
            const data = await res.json();
            if (res.ok) {
                alert(
                    `Employee Added Successfully\nUser ID: ${data.user_id}`
                );
                setNewEmployeeData({
                    department: "",
                    name: "",
                    email: "",
                    phone: "",
                    whatsapp: "",
                    address: "",
                    password: "",
                    profile_picture: null,
                    profile_preview: "",
                });
                onClose();
            } else {
                alert(data.message || data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        }
    };
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4">
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-[#295A47]">
                            Add New Employee
                        </h3>
                        <p className="text-xs text-red-500 mt-1 leading-5">
                            Here you can add IT Professionals, Digital Marketing, Showroom Staff,
                            Relationship Managers, Casual Staff, and Metro Sales Managers.
                            Sales Admins and Supervisors must be added from their respective sidebar panels.
                            Designers should sign up directly from the website.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center text-xl"
                    >
                        ✕
                    </button>
                </div>
                {/* BODY */}
                <div className="overflow-y-auto px-4 sm:px-6 py-4">
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {/* DEPARTMENT */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Department
                            </label>
                            <select
                                value={newEmployeeData.department}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        department: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="IT Professionals">
                                    IT Professionals
                                </option>
                                <option value="Digital Marketing">
                                    Digital Marketing
                                </option>
                                <option value="Showroom Staff">
                                    Showroom Staff
                                </option>
                                <option value="Relationship Manager">
                                    Relationship Manager
                                </option>
                                <option value="Casual Staff">
                                    Casual Staff
                                </option>
                                <option value="Metro Sales Manager">
                                    Metro Sales Manager
                                </option>
                            </select>
                        </div>
                        {/* NAME */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                value={newEmployeeData.name}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter Name"
                                required
                            />
                        </div>
                        {/* EMAIL */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={newEmployeeData.email}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        email: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter Email"
                                required
                            />
                        </div>
                        {/* PHONE */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={newEmployeeData.phone}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        phone: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter Phone"
                                required
                            />
                        </div>
                        {/* WHATSAPP */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                WhatsApp
                            </label>
                            <input
                                type="text"
                                value={newEmployeeData.whatsapp}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        whatsapp: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter WhatsApp Number"
                            />
                        </div>
                        {/* PASSWORD */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                value={newEmployeeData.password}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter Password"
                                required
                            />
                        </div>
                        {/* ADDRESS */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">
                                Address
                            </label>
                            <textarea
                                value={newEmployeeData.address}
                                onChange={(e) =>
                                    setNewEmployeeData({
                                        ...newEmployeeData,
                                        address: e.target.value,
                                    })
                                }
                                className="w-full border border-gray-300 rounded-xl p-2.5 mt-1 text-sm"
                                placeholder="Enter Address"
                                rows={3}
                            />
                        </div>
                        {/* PROFILE */}
                        {/* PROFILE */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Profile Picture
                            </label>
                            <div className="border-2 border-dashed border-gray-300 hover:border-[#295A47] transition rounded-2xl p-6 bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center text-center">
                                    {/* PREVIEW */}
                                    {newEmployeeData.profile_picture ? (
                                        <img
                                            src={URL.createObjectURL(newEmployeeData.profile_picture)}
                                            alt="Preview"
                                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl mb-4">
                                            👤
                                        </div>
                                    )}
                                    {/* TEXT */}
                                    <p className="text-sm font-medium text-gray-700">
                                        Upload Employee Profile Picture
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG, JPEG up to 5MB
                                    </p>
                                    {/* FILE INPUT */}
                                    <label className="mt-4 cursor-pointer">
                                        <span className="bg-[#295A47] hover:bg-[#1f4637] transition text-white px-5 py-2 rounded-xl text-sm shadow-sm inline-block">
                                            Choose Image
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) =>
                                                setNewEmployeeData({
                                                    ...newEmployeeData,
                                                    profile_picture: e.target.files?.[0] || null,
                                                })
                                            }
                                        />
                                    </label>
                                    {/* FILE NAME */}
                                    {newEmployeeData.profile_picture && (
                                        <p className="text-xs text-gray-600 mt-3 break-all">
                                            {newEmployeeData.profile_picture.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* FOOTER */}
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-[#295A47] hover:bg-[#1f4637] text-white px-5 py-2 rounded-xl"
                            >
                                Save Employee
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}