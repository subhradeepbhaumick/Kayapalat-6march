"use client";
import React, { useEffect, useState } from "react";
import { FolderKanban, User, IndianRupee, CalendarDays, Eye, X, Plus, Trash2, } from "lucide-react";
import { useSession } from "next-auth/react";
interface Project {
    appointment_id: string;
    client_name: string;
    project_name: string;
    location: string;
    project_value: number;
    booking_date: string;
}
interface LabourExpense {
    id?: number;
    labour_name: string;
    work_type: string;
    article: string;
    rate: string;
    rate_unit: string;
    size: string;
    amount: string;
}
const VendorMyProjects = () => {
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] =
        useState<Project | null>(null);
    const [showExpenseModal, setShowExpenseModal] =
        useState(false);
    const [expenses, setExpenses] = useState<
        LabourExpense[]
    >([
        {
            labour_name: session?.user?.name || "",
            work_type: "",
            article: "",
            rate: "",
            rate_unit: "",
            size: "",
            amount: "",
        },
    ]);
    const [paymentSummary, setPaymentSummary] =
        useState({
            total: 0,
            paid: 0,
            due: 0,
        });
    // ============================================
    // FETCH PROJECTS
    // ============================================
    useEffect(() => {
        if (session?.user?.id) {
            fetchProjects();
        }
    }, [session]);
    const fetchProjects = async () => {
        try {
            const res = await fetch(
                `/api/vendor/my-projects?vendor_id=${session?.user?.id}`
            );
            const data = await res.json();
            if (res.ok) {
                setProjects(data.projects);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };
    // ============================================
    // OPEN MODAL
    // ============================================
    const openExpenseModal = async (
        project: Project
    ) => {
        try {
            setSelectedProject(project);
            const res = await fetch(
                `/api/vendor/my-projects?type=labour_expenses&vendor_id=${session?.user?.id}&appointment_id=${project.appointment_id}`
            );
            const data = await res.json();
            if (res.ok) {
                setPaymentSummary(
                    data.payment_summary || {
                        total: 0,
                        paid: 0,
                        due: 0,
                    }
                );
                // ====================================
                // IF DATA EXISTS
                // ====================================
                if (
                    data.expenses &&
                    data.expenses.length > 0
                ) {
                    setExpenses(
                        data.expenses.map(
                            (item: any) => ({
                                id: item.id,
                                labour_name:
                                    item.labour_name || "",
                                work_type:
                                    item.work_type || "",
                                article:
                                    item.article || "",
                                rate:
                                    String(item.rate || ""),
                                rate_unit:
                                    item.rate_unit || "",
                                size:
                                    String(item.size || ""),
                                amount:
                                    String(item.amount || ""),
                            })
                        )
                    );
                } else {
                    // ====================================
                    // DEFAULT EMPTY ROW
                    // ====================================
                    setExpenses([
                        {
                            labour_name:
                                session?.user?.name || "",
                            work_type: "",
                            article: "",
                            rate: "",
                            rate_unit: "",
                            size: "",
                            amount: "",
                        },
                    ]);
                }
                setShowExpenseModal(true);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.log(error);
            alert("Failed to fetch expenses");
        }
    };
    // ============================================
    // ADD ROW
    // ============================================
    const addExpenseRow = () => {
        const commonWorkType =
            expenses[0]?.work_type || "";
        setExpenses((prev) => [
            ...prev,
            {
                labour_name:
                    session?.user?.name || "",
                // ====================================
                // SAME WORK TYPE
                // ====================================
                work_type: commonWorkType,
                article: "",
                rate: "",
                rate_unit: "",
                size: "",
                amount: "",
            },
        ]);
    };
    // ============================================
    // HANDLE CHANGE
    // ============================================
    const handleChange = (
        index: number,
        field: keyof LabourExpense,
        value: string
    ) => {
        const updated = [...expenses];

        if (field === "work_type") {
            updated.forEach((item) => {
                item.work_type = value;
            });
        } else {
            updated[index] = {
                ...updated[index],
                [field]: value,
            };

            // Recalculate amount when rate or size changes
            if (field === "rate" || field === "size") {
                updated[index].amount = String(
                    Number(
                        field === "rate"
                            ? value
                            : updated[index].rate || 0
                    ) *
                    Number(
                        field === "size"
                            ? value
                            : updated[index].size || 0
                    )
                );
            }
        }

        setExpenses(updated);
    };
    // ============================================
    // SAVE
    // ============================================
    const saveExpenses = async () => {
        try {

            for (const expense of expenses) {

                // ====================================
                // UPDATE EXISTING ROW
                // ====================================
                if (expense.id) {

                    const res = await fetch(
                        "/api/vendor/my-projects",
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                id: expense.id,

                                work_type:
                                    expense.work_type,

                                labour_name:
                                    expense.labour_name,

                                article:
                                    expense.article,

                                rate:
                                    expense.rate,

                                rate_unit:
                                    expense.rate_unit,

                                size:
                                    expense.size,
                            }),
                        }
                    );

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error);
                        return;
                    }

                } else {

                    // ====================================
                    // INSERT NEW ROW
                    // ====================================
                    const res = await fetch(
                        "/api/vendor/my-projects",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                appointment_id:
                                    selectedProject?.appointment_id,

                                vendor_id:
                                    session?.user?.id,

                                work_type:
                                    expense.work_type,

                                labour_name:
                                    expense.labour_name,

                                article:
                                    expense.article,

                                rate:
                                    expense.rate,

                                rate_unit:
                                    expense.rate_unit,

                                size:
                                    expense.size,
                            }),
                        }
                    );

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error);
                        return;
                    }
                }
            }

            alert("Expenses saved successfully");

            setShowExpenseModal(false);

            // OPTIONAL REFRESH
            if (selectedProject) {
                openExpenseModal(selectedProject);
            }

        } catch (err) {

            console.log(err);

            alert("Failed to save expenses");
        }
    };
    // ============================================
    // DELETE EXPENSE
    // ============================================
    const deleteExpense = async (
        expenseId?: number,
        index?: number
    ) => {

        // ========================================
        // CONFIRM DELETE
        // ========================================
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this expense?"
        );

        if (!confirmDelete) {
            return;
        }

        // ========================================
        // REMOVE UNSAVED ROW
        // ========================================
        if (!expenseId) {

            const updated = [...expenses];

            updated.splice(index || 0, 1);

            setExpenses(updated);

            return;
        }

        // ========================================
        // DELETE FROM DATABASE
        // ========================================
        try {

            const res = await fetch(
                `/api/vendor/my-projects?id=${expenseId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await res.json();

            if (res.ok) {

                setExpenses((prev) =>
                    prev.filter(
                        (item) => item.id !== expenseId
                    )
                );

                alert("Expense deleted successfully");

            } else {

                alert(data.error);
            }

        } catch (error) {

            console.log(error);

            alert("Failed to delete expense");
        }
    };
    return (
        <div className="min-h-screen bg-[#f5f7f9] p-6">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#295A47]">
                    My Projects
                </h1>
                <p className="text-gray-600 mt-2">
                    Manage your assigned projects
                    and labour expenses.
                </p>
            </div>
            {/* PROJECTS */}
            {loading ? (
                <div className="text-center py-20 text-lg font-medium text-gray-500">
                    Loading projects...
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center">
                    <FolderKanban
                        size={60}
                        className="mx-auto text-gray-300 mb-4"
                    />
                    <h2 className="text-2xl font-semibold text-gray-700">
                        No Projects Assigned
                    </h2>
                    <p className="text-gray-500 mt-2">
                        You don&apos;t have any
                        assigned projects yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.appointment_id}
                            className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition"
                        >
                            {/* TOP */}
                            <div className="bg-[#295A47] p-5 text-white">
                                <h2 className="text-2xl font-bold">
                                    {
                                        project.project_name
                                    }
                                </h2>
                                <p className="text-sm opacity-90 mt-1">
                                    Appointment ID :{" "}
                                    {
                                        project.appointment_id
                                    }
                                </p>
                            </div>
                            {/* BODY */}
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <User
                                        className="text-[#295A47]"
                                        size={20}
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Client: {
                                            project.client_name
                                        }
                                    </span>
                                </div>
                                <div className="pt-3">
                                    <button
                                        onClick={() =>
                                            openExpenseModal(
                                                project
                                            )
                                        }
                                        className="w-full bg-[#295A47] hover:bg-[#1d4334] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                                    >
                                        <Eye size={18} />
                                        Open Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* LABOUR EXPENSE MODAL */}
            {showExpenseModal &&
                selectedProject && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden">
                            {/* HEADER */}
                            <div className="bg-[#295A47] text-white px-6 py-5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Labour Expenses
                                    </h2>
                                    <p className="text-sm opacity-90 mt-1">
                                        {
                                            selectedProject.project_name
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setShowExpenseModal(
                                            false
                                        )
                                    }
                                    className="hover:bg-white/20 p-2 rounded-full transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            {/* BODY */}
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                {/* SUMMARY CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                                    {/* TOTAL */}
                                    <div className="bg-[#F5F8F6] border border-[#D7E7D0] rounded-xl p-5">
                                        <p className="text-sm text-gray-500">
                                            Total Labour Cost
                                        </p>

                                        <p className="text-3xl font-bold text-[#295A47] mt-1">
                                            ₹
                                            {paymentSummary.total.toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                    </div>

                                    {/* PAID */}
                                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5">
                                        <p className="text-sm text-gray-500">
                                            Paid
                                        </p>

                                        <p className="text-3xl font-bold text-blue-600 mt-1">
                                            ₹
                                            {paymentSummary.paid.toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                    </div>

                                    {/* DUE */}
                                    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5">
                                        <p className="text-sm text-gray-500">
                                            Due
                                        </p>

                                        <p className="text-3xl font-bold text-red-600 mt-1">
                                            ₹
                                            {paymentSummary.due.toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                    </div>

                                </div>
                                {/* TABLE */}
                                <div className="overflow-x-auto border rounded-2xl">
                                    <table className="w-full min-w-275 text-sm">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="p-3 text-left">
                                                    Labour Name
                                                </th>
                                                <th className="p-3 text-left">
                                                    Work Type
                                                </th>
                                                <th className="p-3 text-left">
                                                    Article
                                                </th>
                                                <th className="p-3 text-left">
                                                    Rate
                                                </th>
                                                <th className="p-3 text-left">
                                                    Rate Unit
                                                </th>
                                                <th className="p-3 text-left">
                                                    Size
                                                </th>
                                                <th className="p-3 text-left">
                                                    Amount
                                                </th>
                                                {/* <th className="p-3 text-center">
                                                    Delete
                                                </th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.map(
                                                (expense, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-t"
                                                    >
                                                        {/* LABOUR NAME */}
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    expense.labour_name
                                                                }
                                                                readOnly
                                                                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                                                            />
                                                        </td>
                                                        {/* WORK TYPE */}
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Work Type"
                                                                value={
                                                                    expense.work_type
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        index,
                                                                        "work_type",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#295A47]"
                                                            />
                                                        </td>
                                                        {/* ARTICLE */}
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Article"
                                                                value={expense.article}
                                                                disabled={!!expense.id}
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        index,
                                                                        "article",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className={`w-full border rounded-lg px-3 py-2 outline-none
                                                                        ${expense.id
                                                                        ? "bg-gray-100 cursor-not-allowed"
                                                                        : "focus:ring-2 focus:ring-[#295A47]"
                                                                    }`}
                                                            />
                                                        </td>
                                                        {/* RATE */}
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                placeholder="Rate"
                                                                value={expense.rate}
                                                                disabled={!!expense.id}
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        index,
                                                                        "rate",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className={`w-full border rounded-lg px-3 py-2 outline-none
                                                                    ${expense.id
                                                                        ? "bg-gray-100 cursor-not-allowed"
                                                                        : "focus:ring-2 focus:ring-[#295A47]"
                                                                    }`}
                                                            />
                                                        </td>
                                                        {/* RATE UNIT */}
                                                        <td className="p-3">
                                                            <select
                                                                value={
                                                                    expense.rate_unit
                                                                }
                                                                onChange={(e) =>
                                                                    handleChange(
                                                                        index,
                                                                        "rate_unit",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#295A47]"
                                                            >
                                                                <option value="">
                                                                    Select
                                                                </option>
                                                                <option value="sqft">
                                                                    Sqft
                                                                </option>
                                                                <option value="piece">
                                                                    Piece
                                                                </option>
                                                                <option value="day">
                                                                    Day
                                                                </option>
                                                                <option value="unit">
                                                                    Unit
                                                                </option>
                                                            </select>
                                                        </td>
                                                        {/* SIZE */}
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                placeholder="Size"
                                                                value={expense.size}
                                                                disabled={!!expense.id}
                                                                onChange={(e) => {
                                                                    const size = e.target.value;

                                                                    const updated = [...expenses];

                                                                    updated[index].size = size;

                                                                    updated[index].amount = String(
                                                                        Number(updated[index].rate || 0) *
                                                                        Number(size || 0)
                                                                    );

                                                                    setExpenses(updated);
                                                                }}
                                                                className={`w-full border rounded-lg px-3 py-2 outline-none
                                                                        ${expense.id
                                                                        ? "bg-gray-100 cursor-not-allowed"
                                                                        : "focus:ring-2 focus:ring-[#295A47]"
                                                                    }`}
                                                            />
                                                        </td>
                                                        {/* AMOUNT */}
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    expense.amount
                                                                }
                                                                readOnly
                                                                className="w-full border rounded-lg px-3 py-2 bg-gray-100 font-semibold text-[#295A47]"
                                                            />
                                                        </td>
                                                        {/* DELETE */}
                                                        {/* <td className="p-3 text-center">
                                                            <button
                                                                onClick={() =>
                                                                    deleteExpense(
                                                                        expense.id,
                                                                        index
                                                                    )
                                                                }
                                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td> */}
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* ADD ROW */}
                                <button
                                    onClick={addExpenseRow}
                                    className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition"
                                >
                                    <Plus size={18} />
                                    Add More
                                </button>
                            </div>
                            {/* FOOTER */}
                            <div className="border-t p-5 flex justify-end gap-4">
                                <button
                                    onClick={() =>
                                        setShowExpenseModal(
                                            false
                                        )
                                    }
                                    className="px-6 py-3 rounded-xl border font-medium hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={
                                        saveExpenses
                                    }
                                    className="px-6 py-3 rounded-xl bg-[#295A47] hover:bg-[#1d4334] text-white font-semibold"
                                >
                                    Save Expenses
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};
export default VendorMyProjects;