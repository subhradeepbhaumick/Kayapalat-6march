"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, X } from "lucide-react";
import AddNewEmployeeModal from "./AddNewEmployeeModal";
interface EmployeeDetail {
    id: number;
    emp_id: string;
    name: string;
    emp_type: string;
    job_details: string;
    joining_date: string;
    resignation_date: string;
    weekoff: number;
    salary: number;
    profile_picture: string;
    login_time: string;
}
interface Attendance {
    id: number;
    emp_id: string;
    emp_type: string;
    name: string;
    checkin: string;
    ta_entry: string | null;
    ta_location: string | null;
    checkout: string;
    leave_type: string;
    login_location: string;
    note: string;
    per_day_income: number;
    salary_status: string;
    created_at: string;
    checkin_location: string;
    checkout_location: string;
}
export default function EmployeeManagementPage() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<EmployeeDetail[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [attendanceSearch, setAttendanceSearch] = useState("");
    const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryEmployees, setSalaryEmployees] = useState<EmployeeDetail[]>([]);
    const [selectedSalaryEmp, setSelectedSalaryEmp] = useState<any>(null);
    const [salaryAttendance, setSalaryAttendance] = useState<any[]>([]);
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [monthlySalaryTotal, setMonthlySalaryTotal] = useState(0);
    const [taAmount, setTaAmount] = useState<string>("0");
    const [incentiveAmount, setIncentiveAmount] = useState<string>("0");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);
    const [selectedMonth, setSelectedMonth] = useState(
        String(new Date().getMonth() + 1).padStart(2, "0")
    );
    const [selectedYear, setSelectedYear] = useState(
        String(new Date().getFullYear())
    );
    const currentDate = new Date();

    const [attendanceMonth, setAttendanceMonth] = useState(
        String(currentDate.getMonth() + 1).padStart(2, "0")
    );

    const [attendanceYear, setAttendanceYear] = useState(
        String(currentDate.getFullYear())
    );
    const [monthlyPaymentStatus, setMonthlyPaymentStatus] = useState("Pending");
    const [attendanceDate, setAttendanceDate] = useState("");
    const [formData, setFormData] = useState({
        emp_id: "",
        name: "",
        emp_type: "", // Intern / Provision / Permanent
        department: "",
        job_details: "", // Sales Admin / Designer / etc
        joining_date: "",
        resignation_date: "",
        weekoff: "",
        salary: "",
        login_time: "",
        profile_picture: null as File | null,
        profile_preview: "",
    });
    const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
    const [newEmployeeData, setNewEmployeeData] = useState({
        department: "",
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
        password: "",
        profile_picture: null as File | null,
        profile_preview: "",
    });
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapLocation, setMapLocation] = useState("");
    useEffect(() => {
        fetchEmployees();
        fetchAttendance();
    }, []);
    useEffect(() => {
        const search = attendanceSearch.toLowerCase();

        const filtered = attendance.filter((item) => {
            const matchesSearch =
                !attendanceSearch ||
                item.emp_id.toLowerCase().includes(search) ||
                item.name.toLowerCase().includes(search);

            const matchesDate =
                !attendanceDate ||
                item.checkin?.slice(0, 10) === attendanceDate;

            return matchesSearch && matchesDate;
        });

        setFilteredAttendance(filtered);
    }, [attendanceSearch, attendanceDate, attendance]);
    useEffect(() => {
        if (!selectedSalaryEmp) return;
        const fetchSalaryData = async () => {
            try {
                setSalaryLoading(true);
                const res = await fetch(
                    `/api/employees/salary-details?emp_id=${selectedSalaryEmp.emp_id}&month=${selectedMonth}&year=${selectedYear}`
                );
                const data = await res.json();
                setSalaryAttendance(data.attendance || []);
                setMonthlySalaryTotal(Number(data.total_salary || 0));
                setMonthlyPaymentStatus(data.payment_status || "Pending");
                setTaAmount(String(data.ta_amount ?? 0));
                setIncentiveAmount(String(data.incentive_amount ?? 0));
            } catch (error) {
                console.error(error);
            } finally {
                setSalaryLoading(false);
            }
        };
        fetchSalaryData();
    }, [selectedMonth, selectedYear, selectedSalaryEmp]);
    useEffect(() => {
        console.log(filteredAttendance);
    }, [filteredAttendance]);
    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/employees");
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error(error);
        }
    };
    const fetchAttendance = async () => {
        try {
            const res = await fetch("/api/employees/attendance/superadmin");
            const data = await res.json();
            setAttendance(data);
            setFilteredAttendance(data);
        } catch (error) {
            console.error(error);
        }
    };
    const openMapModal = (location: string) => {
        setMapLocation(location);
        setShowMapModal(true);
    };
    const handleRoleChange = async (role: string) => {
        setSelectedRole(role);
        setFormData((prev) => ({
            ...prev,
            job_details: role,
            emp_id: "",
            name: "",
        }));
        try {
            let dbRole = "";
            // OLD ROLES
            if (role === "Sales Admin") {
                dbRole = "sales_admin";
            } else if (role === "Designer") {
                dbRole = "designer";
            } else if (role === "Supervisor") {
                dbRole = "supervisor";
            }
            // NEW ROLES
            else if (role === "IT Professionals") {
                dbRole = "it";
            } else if (role === "Digital Marketing") {
                dbRole = "seo";
            } else if (role === "Showroom Staff") {
                dbRole = "showroom_staff";
            } else if (role === "Relationship Manager") {
                dbRole = "relationship_manager";
            } else if (role === "Casual Staff") {
                dbRole = "casual_staff";
            } else if (role === "Metro Sales Manager") {
                dbRole = "metro";
            }
            // FETCH USERS
            if (dbRole) {
                const res = await fetch(
                    `/api/employees/users?role=${dbRole}`
                );
                const data = await res.json();
                setUsers(data);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error(error);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            submitData.append("id", String(editingId || ""));
            submitData.append("emp_id", formData.emp_id);
            submitData.append("name", formData.name);
            submitData.append("emp_type", formData.emp_type);
            submitData.append("department", formData.department);
            submitData.append("job_details", formData.job_details);
            submitData.append("joining_date", formData.joining_date);
            submitData.append(
                "resignation_date",
                formData.resignation_date
            );
            submitData.append("weekoff", formData.weekoff);
            submitData.append("salary", formData.salary);
            submitData.append("login_time", formData.login_time);
            if (formData.profile_picture) {
                submitData.append(
                    "profile_picture",
                    formData.profile_picture
                );
            }
            const res = await fetch("/api/employees", {
                method: editMode ? "PUT" : "POST",
                body: submitData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(
                    editMode
                        ? "Employee Updated Successfully"
                        : "Employee Added Successfully"
                );
                setFormData({
                    emp_id: "",
                    name: "",
                    emp_type: "",
                    department: "",
                    job_details: "",
                    joining_date: "",
                    resignation_date: "",
                    weekoff: "",
                    salary: "",
                    profile_picture: null,
                    profile_preview: "",
                    login_time: "",
                });
                setSelectedRole("");
                setUsers([]);
                setShowForm(false);
                fetchEmployees();
            } else {
                alert(data.error || data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        }
    };
    const monthWiseAttendance = filteredAttendance
        .filter((item) => {
            if (!item.checkin) return false;

            const date = new Date(item.checkin);

            return (
                String(date.getMonth() + 1).padStart(2, "0") === attendanceMonth &&
                String(date.getFullYear()) === attendanceYear
            );
        })
        .sort(
            (a, b) =>
                new Date(b.checkin).getTime() -
                new Date(a.checkin).getTime()
        );
    const totalSalaryWithTA = monthlySalaryTotal + (Number(taAmount) || 0) + (Number(incentiveAmount) || 0);
    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6 space-y-6">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47]">
                        Employee Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage employees and attendance records
                    </p>
                </div>
            </div>
            {/* EMPLOYEE DETAILS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-5 overflow-hidden">
                <div className="mb-5">
                    <h2 className="text-xl font-bold text-[#295A47]">
                        Employee Details
                    </h2>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                        <thead className="bg-[#295A47] text-white text-sm">
                            <tr>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Emp ID
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Name
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Employee Type
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Department
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Joining Date
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Salary
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {employees.map((emp) => (
                                <tr
                                    key={emp.id}
                                    className="border-b last:border-0 hover:bg-gray-50 transition"
                                >
                                    <td className="p-3 text-sm whitespace-nowrap">
                                        {emp.emp_id}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap">
                                        {emp.name}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap">
                                        {emp.emp_type}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap">
                                        {emp.job_details}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap">
                                        {emp.joining_date
                                            ? new Date(emp.joining_date)
                                                .toLocaleDateString("en-CA", {
                                                    timeZone: "Asia/Kolkata",
                                                })
                                                .split("-")
                                                .reverse()
                                                .join("/")
                                            : "-"}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap font-medium">
                                        ₹{emp.salary}
                                    </td>
                                    <td className="p-3 text-sm whitespace-nowrap text-center">
                                        <button
                                            onClick={async () => {
                                                setEditMode(true);
                                                setEditingId(emp.id);
                                                setSelectedRole(emp.job_details);
                                                let dbRole = "";
                                                if (emp.job_details === "Sales Admin") {
                                                    dbRole = "sales_admin";
                                                } else if (emp.job_details === "Designer") {
                                                    dbRole = "designer";
                                                } else if (emp.job_details === "Supervisor") {
                                                    dbRole = "supervisor";
                                                } else if (
                                                    emp.job_details === "IT Professionals"
                                                ) {
                                                    dbRole = "it";
                                                } else if (
                                                    emp.job_details === "Digital Marketing"
                                                ) {
                                                    dbRole = "seo";
                                                } else if (
                                                    emp.job_details === "Showroom Staff"
                                                ) {
                                                    dbRole = "showroom_staff";
                                                } else if (
                                                    emp.job_details ===
                                                    "Relationship Manager"
                                                ) {
                                                    dbRole = "relationship_manager";
                                                } else if (
                                                    emp.job_details === "Casual Staff"
                                                ) {
                                                    dbRole = "casual_staff";
                                                } else if (
                                                    emp.job_details ===
                                                    "Metro Sales Manager"
                                                ) {
                                                    dbRole = "metro";
                                                }
                                                if (dbRole) {
                                                    try {
                                                        const res = await fetch(
                                                            `/api/employees/users?role=${dbRole}`
                                                        );
                                                        const data = await res.json();
                                                        setUsers(data);
                                                    } catch (error) {
                                                        console.error(error);
                                                    }
                                                }
                                                setFormData({
                                                    emp_id: emp.emp_id,
                                                    name: emp.name,
                                                    emp_type: emp.emp_type,
                                                    department: emp.job_details || "",
                                                    job_details: emp.job_details || "",
                                                    joining_date: emp.joining_date
                                                        ? new Date(emp.joining_date)
                                                            .toLocaleDateString("en-CA", {
                                                                timeZone:
                                                                    "Asia/Kolkata",
                                                            })
                                                        : "",
                                                    resignation_date:
                                                        emp.resignation_date
                                                            ? new Date(
                                                                emp.resignation_date
                                                            ).toLocaleDateString(
                                                                "en-CA",
                                                                {
                                                                    timeZone:
                                                                        "Asia/Kolkata",
                                                                }
                                                            )
                                                            : "",
                                                    weekoff: String(emp.weekoff),
                                                    salary: String(emp.salary),
                                                    login_time: emp.login_time || "",
                                                    profile_picture: null,
                                                    profile_preview:
                                                        emp.profile_picture || "",
                                                });
                                                setShowForm(true);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs sm:text-sm transition"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* ATTENDANCE TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-5 overflow-hidden">
                <div className="mb-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        {/* Heading */}
                        <h2 className="text-lg sm:text-xl font-bold text-[#295A47]">
                            Employee Attendance
                        </h2>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Search by Employee ID or Name"
                                value={attendanceSearch}
                                onChange={(e) => setAttendanceSearch(e.target.value)}
                                className="w-full sm:min-w-[280px] lg:w-80 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]/30"
                            />

                            {/* Date */}
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]/30"
                            />

                            {/* Button */}
                            <button
                                onClick={async () => {
                                    setShowSalaryModal(true);
                                    try {
                                        const res = await fetch("/api/employees");
                                        const data = await res.json();
                                        setSalaryEmployees(data);
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }}
                                className="w-full sm:w-auto bg-[#295A47] hover:bg-[#1f4637] text-white px-5 py-2 rounded-xl text-sm font-medium"
                            >
                                Employee Salary
                            </button>

                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <select
                        value={attendanceMonth}
                        onChange={(e) => setAttendanceMonth(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2"
                    >
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    <select
                        value={attendanceYear}
                        onChange={(e) => setAttendanceYear(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2"
                    >
                        {Array.from({ length: 6 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                        <thead className="bg-[#295A47] text-white text-sm">
                            <tr>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Emp ID
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Name
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Check In
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Check Out
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Leave
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Login Location
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Per Day Income
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Note
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Checkin Location
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    TA Entry
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    TA Location
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Salary Status
                                </th>
                                <th className="p-3 text-center whitespace-nowrap">
                                    Checkout Location
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {monthWiseAttendance.length > 0 ? (
                                monthWiseAttendance.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b last:border-0 hover:bg-gray-50 transition"
                                    >
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            {item.emp_id}
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            {item.name}
                                        </td>
                                        <td className="p-1">
                                            {item.checkin
                                                ? (() => {
                                                    const dateTime = item.checkin.replace("T", " ");
                                                    const [date, time] = dateTime.split(" ");
                                                    const [year, month, day] = date.split("-");
                                                    const [hours, minutes] = time.split(":");

                                                    return `${day}-${month}-${year.slice(2)}, ${hours}:${minutes}`;
                                                })()
                                                : "-"}
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            {item.checkout
                                                ? new Date(item.checkout).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        timeZone: "Asia/Kolkata",
                                                    }
                                                )
                                                : "-"}
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            {item.leave_type || "-"}
                                        </td>
                                        <td className="p-3 text-sm min-w-[220px]">
                                            {item.login_location || "-"}
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap font-medium text-green-700">
                                            ₹ {Number(item.per_day_income).toFixed(2)}
                                        </td>
                                        <td className="p-3 text-sm min-w-[220px]">
                                            {item.note || "-"}
                                        </td>
                                        <td className="p-3 text-sm min-w-[220px]">
                                            <div className="flex justify-center">
                                                {item.checkin_location ? (
                                                    <button
                                                        onClick={() => openMapModal(item.checkin_location)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            {item.ta_entry
                                                ? new Date(item.ta_entry).toLocaleString("en-IN", {
                                                    timeZone: "Asia/Kolkata",
                                                })
                                                : "-"}
                                        </td>

                                        <td className="p-3 text-sm min-w-[220px]">
                                            <div className="flex justify-center">
                                                {item.ta_location ? (
                                                    <button
                                                        onClick={() => openMapModal(item.ta_location!)}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                {item.salary_status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm min-w-[220px]">
                                            <div className="flex justify-center">
                                                {item.checkout_location ? (
                                                    <button
                                                        onClick={() => openMapModal(item.checkout_location)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={14}
                                        className="text-center py-6 text-gray-500"
                                    >
                                        No attendance records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AddNewEmployeeModal
                show={showNewEmployeeModal}
                onClose={() => {
                    setShowNewEmployeeModal(false);
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
                }}
                newEmployeeData={newEmployeeData}
                setNewEmployeeData={setNewEmployeeData}
            />
            {/* MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 sticky top-0 bg-white z-10">
                            <h3 className="text-lg sm:text-xl font-semibold text-[#295A47]">
                                {editMode ? "Edit Employee" : "Add Employee"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditMode(false);
                                    setEditingId(null);
                                    setFormData({
                                        emp_id: "",
                                        name: "",
                                        emp_type: "",
                                        department: "",
                                        job_details: "",
                                        joining_date: "",
                                        resignation_date: "",
                                        weekoff: "",
                                        salary: "",
                                        login_time: "",
                                        profile_picture: null,
                                        profile_preview: "",
                                    });
                                    setSelectedRole("");
                                    setUsers([]);
                                }}
                                className="text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        {/* BODY */}
                        <div className="overflow-y-auto px-4 sm:px-6 py-4">
                            <form
                                onSubmit={handleSubmit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
                            >
                                {/* ROLE */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Employee Role
                                    </label>
                                    <p className="text-xs text-red-500 mt-1">
                                        Note: If you don't find the employee here, first add the employee in the system backend.
                                    </p>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) =>
                                            handleRoleChange(e.target.value)
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    >
                                        <option value="">
                                            Select Role
                                        </option>
                                        <option value="Sales Admin">
                                            Sales Admin
                                        </option>
                                        <option value="Designer">
                                            Designer
                                        </option>
                                        <option value="Supervisor">
                                            Supervisor
                                        </option>
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
                                    {/* USER DROPDOWN */}
                                    {[
                                        "Sales Admin",
                                        "Designer",
                                        "Supervisor",
                                        "IT Professionals",
                                        "Digital Marketing",
                                        "Showroom Staff",
                                        "Relationship Manager",
                                        "Casual Staff",
                                        "Metro Sales Manager",
                                    ].includes(selectedRole) && (
                                            <select
                                                className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-3 text-sm"
                                                value={formData.emp_id}
                                                onChange={(e) => {
                                                    const selectedUser = users.find(
                                                        (u) => u.user_id === e.target.value
                                                    );
                                                    setFormData({
                                                        ...formData,
                                                        emp_id: selectedUser?.user_id || "",
                                                        name: selectedUser?.name || "",
                                                        job_details: selectedRole,
                                                    });
                                                }}
                                                required
                                            >
                                                <option value="">
                                                    Select Employee
                                                </option>
                                                {users.map((user) => (
                                                    <option
                                                        key={user.user_id}
                                                        value={user.user_id}
                                                    >
                                                        {user.name} ({user.user_id})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                </div>
                                {/* EMP ID */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.emp_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                emp_id: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required disabled
                                    />
                                </div>
                                {/* NAME */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Employee Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* EMPLOYEE TYPE */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Employee Type
                                    </label>
                                    <select
                                        value={formData.emp_type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                emp_type: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    >
                                        <option value="">
                                            Select Employee Type
                                        </option>
                                        <option value="Intern">
                                            Intern
                                        </option>
                                        <option value="Provision">
                                            Provision
                                        </option>
                                        <option value="Permanent">
                                            Permanent
                                        </option>
                                    </select>
                                </div>
                                {/* DEPARTMENT */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.job_details}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                job_details: e.target.value,
                                            })
                                        }
                                        placeholder="Enter Department"
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* JOINING */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                joining_date: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* RESIGN */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Resignation Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.resignation_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                resignation_date:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                    />
                                </div>
                                {/* WEEKOFF */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Week Off
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weekoff}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                weekoff: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* SALARY */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Salary
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.salary}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                salary: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* LOGIN TIME */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Login Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.login_time}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                login_time: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 focus:border-[#295A47] focus:ring-2 focus:ring-[#295A47]/20 outline-none rounded-xl p-2.5 mt-1 text-sm"
                                        required
                                    />
                                </div>
                                {/* PROFILE PICTURE */}
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Profile Picture
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 hover:border-[#295A47] transition rounded-2xl p-6 bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            {/* IMAGE PREVIEW */}
                                            {formData.profile_picture || formData.profile_preview ? (
                                                <img
                                                    src={
                                                        formData.profile_picture
                                                            ? URL.createObjectURL(formData.profile_picture)
                                                            : formData.profile_preview
                                                    }
                                                    alt="Profile Preview"
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
                                                        setFormData({
                                                            ...formData,
                                                            profile_picture:
                                                                e.target.files?.[0] || null,
                                                        })
                                                    }
                                                />
                                            </label>
                                            {/* FILE NAME */}
                                            {formData.profile_picture && (
                                                <p className="text-xs text-gray-600 mt-3 break-all">
                                                    {formData.profile_picture.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* FOOTER */}
                                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-4 sticky bottom-0 bg-white py-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditMode(false);
                                            setEditingId(null);
                                            setFormData({
                                                emp_id: "",
                                                name: "",
                                                emp_type: "",
                                                department: "",
                                                job_details: "",
                                                joining_date: "",
                                                resignation_date: "",
                                                weekoff: "",
                                                salary: "",
                                                login_time: "",
                                                profile_picture: null,
                                                profile_preview: "",
                                            });
                                            setSelectedRole("");
                                            setUsers([]);
                                        }}
                                        className="px-4 py-2.5 border rounded-xl hover:bg-gray-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#295A47] hover:bg-[#1f4637] transition text-white px-5 py-2.5 rounded-xl text-sm"
                                    >
                                        {editMode ? "Update Employee" : "Save Employee"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* MAP MODAL */}
            {showMapModal && (() => {
                const match = mapLocation.match(
                    /Lat:\s*([0-9.-]+),\s*Lng:\s*([0-9.-]+)/
                );
                const lat = match?.[1];
                const lng = match?.[2];
                const mapUrl =
                    lat && lng
                        ? `https://www.google.com/maps?q=${lat},${lng}&output=embed`
                        : "";
                return (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl">
                            {/* HEADER */}
                            <div className="flex items-center justify-between p-5 border-b">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <MapPin className="text-red-600" />
                                    Attendance Location
                                </h2>
                                <button
                                    onClick={() => setShowMapModal(false)}
                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            {/* MAP */}
                            <div className="h-[500px] w-full">
                                {mapUrl ? (
                                    <iframe
                                        src={mapUrl}
                                        width="100%"
                                        height="100%"
                                        loading="lazy"
                                        className="border-0"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        Invalid Location
                                    </div>
                                )}
                            </div>
                            {/* LOCATION TEXT */}
                            <div className="p-4 border-t bg-gray-50 text-sm">
                                {mapLocation}
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* EMPLOYEE SALARY MODAL */}
            {showSalaryModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b px-6 py-5 bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-[#295A47]">
                                    Employee Salary Details
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Monthly salary & attendance summary
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSalaryModal(false);
                                    setSelectedSalaryEmp(null);
                                    setSalaryAttendance([]);
                                    setMonthlySalaryTotal(0);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {/* BODY */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* EMPLOYEE SELECT */}
                            <div className="bg-gray-50 border rounded-2xl p-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Select Employee
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#295A47]/30"
                                    onChange={async (e) => {
                                        const empId = e.target.value;
                                        const employee = salaryEmployees.find(
                                            (emp) => emp.emp_id === empId
                                        );
                                        setSelectedSalaryEmp(employee);
                                        if (!empId) return;
                                        try {
                                            setSalaryLoading(true);
                                            const res = await fetch(
                                                `/api/employees/salary-details?emp_id=${empId}&month=${selectedMonth}&year=${selectedYear}`
                                            );
                                            const data = await res.json();
                                            setSalaryAttendance(data.attendance || []);
                                            setMonthlySalaryTotal(
                                                Number(data.total_salary || 0)
                                            );
                                            setTaAmount(String(data.ta_amount ?? 0));
                                            setIncentiveAmount(String(data.incentive_amount ?? 0));
                                        } catch (error) {
                                            console.error(error);
                                        } finally {
                                            setSalaryLoading(false);
                                        }
                                    }}
                                >
                                    <option value="">
                                        Select Employee
                                    </option>
                                    {salaryEmployees.map((emp) => (
                                        <option
                                            key={emp.emp_id}
                                            value={emp.emp_id}
                                        >
                                            {emp.name} ({emp.emp_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* EMPLOYEE DETAILS */}
                            {selectedSalaryEmp && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    {/* PROFILE */}
                                    <div className="bg-white border rounded-3xl p-6 shadow-sm">
                                        <div className="flex flex-col items-center text-center">
                                            <img
                                                src={
                                                    selectedSalaryEmp.profile_picture ||
                                                    "/default-user.png"
                                                }
                                                alt="Profile"
                                                className="w-32 h-32 rounded-full object-cover border-4 border-[#295A47]/20 shadow-lg"
                                            />
                                            <h3 className="text-2xl font-bold text-gray-800 mt-4">
                                                {selectedSalaryEmp.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {selectedSalaryEmp.emp_id}
                                            </p>
                                            <span className="mt-3 px-4 py-1 rounded-full bg-[#295A47]/10 text-[#295A47] text-sm font-semibold">
                                                {selectedSalaryEmp.emp_type}
                                            </span>
                                        </div>
                                    </div>
                                    {/* DETAILS */}
                                    <div className="lg:col-span-2 bg-white border rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-[#295A47] mb-5">
                                            Employee Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Department
                                                </p>
                                                <p className="font-semibold text-gray-800 mt-1">
                                                    {selectedSalaryEmp.job_details}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Email
                                                </p>
                                                <p className="font-semibold text-gray-800 mt-1">
                                                    {selectedSalaryEmp.email || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Joining Date
                                                </p>
                                                <p className="font-semibold text-gray-800 mt-1">
                                                    {selectedSalaryEmp.joining_date
                                                        ? new Date(
                                                            selectedSalaryEmp.joining_date
                                                        ).toLocaleDateString("en-IN")
                                                        : "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Monthly Salary
                                                </p>
                                                <p className="font-bold text-green-700 text-xl mt-1">
                                                    ₹ {selectedSalaryEmp.salary}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Login Time
                                                </p>
                                                <p className="font-semibold text-gray-800 mt-1">
                                                    {selectedSalaryEmp.login_time || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* MONTH SUMMARY */}
                            {selectedSalaryEmp && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                                        <p className="text-sm text-green-700 font-medium">
                                            Total Salary Till Last Day
                                        </p>
                                        <h2 className="text-3xl font-bold text-green-800 mt-2">
                                            ₹ {totalSalaryWithTA.toFixed(2)}
                                        </h2>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                        <p className="text-sm text-blue-700 font-medium mb-4">
                                            Leave Summary
                                        </p>
                                        <div className="space-y-3">
                                            {/* TOTAL ATTENDANCE */}
                                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Total Update
                                                </span>
                                                <span className="text-lg font-bold text-blue-700">
                                                    {salaryAttendance.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Total TA
                                                </span>
                                                <span className="text-lg font-bold text-orange-600">
                                                    {
                                                        salaryAttendance.filter(
                                                            (item) =>
                                                                item.ta_entry &&
                                                                item.ta_entry.toString().trim() !== "" &&
                                                                item.ta_location &&
                                                                item.ta_location.toString().trim() !== ""
                                                        ).length
                                                    }
                                                </span>
                                            </div>
                                            {/* NEW: TA AMOUNT INPUT */}
                                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">TA Amount</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={taAmount}
                                                        onChange={(e) => setTaAmount(e.target.value)}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#295A47]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!selectedSalaryEmp) return;
                                                            try {
                                                                const res = await fetch("/api/employees/salary-details", {
                                                                    method: "PUT",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        emp_id: selectedSalaryEmp.emp_id,
                                                                        month: selectedMonth,
                                                                        year: selectedYear,
                                                                        ta_amount: taAmount,
                                                                    }),
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    setSalaryAttendance((prev) =>
                                                                        prev.map((item) => ({
                                                                            ...item,
                                                                            ta: Number(taAmount),
                                                                        }))
                                                                    );
                                                                    const monthName = new Date(
                                                                        Number(selectedYear),
                                                                        Number(selectedMonth) - 1,
                                                                        1
                                                                    ).toLocaleString("en-IN", { month: "long" });
                                                                    setToast({
                                                                        message: `TA Amount is updated successfully for ${monthName} ${selectedYear}`,
                                                                        type: "success",
                                                                    });
                                                                } else {
                                                                    setToast({ message: data.error || "Failed to update TA amount", type: "error" });
                                                                }
                                                            } catch (error) {
                                                                console.error(error);
                                                                setToast({ message: "Something went wrong", type: "error" });
                                                            }
                                                        }}
                                                        className="bg-[#295A47] hover:bg-[#1f4637] text-white px-3 py-1 rounded-lg text-xs"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                            {/* NEW: INCENTIVE AMOUNT INPUT */}
                                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">Incentive</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={incentiveAmount}
                                                        onChange={(e) => setIncentiveAmount(e.target.value)}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#295A47]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!selectedSalaryEmp) return;
                                                            try {
                                                                const res = await fetch("/api/employees/salary-details", {
                                                                    method: "PUT",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        emp_id: selectedSalaryEmp.emp_id,
                                                                        month: selectedMonth,
                                                                        year: selectedYear,
                                                                        incentive_amount: incentiveAmount,
                                                                    }),
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    setSalaryAttendance((prev) =>
                                                                        prev.map((item) => ({ ...item, incentive: Number(incentiveAmount) }))
                                                                    );
                                                                    const monthName = new Date(
                                                                        Number(selectedYear),
                                                                        Number(selectedMonth) - 1,
                                                                        1
                                                                    ).toLocaleString("en-IN", { month: "long" });
                                                                    setToast({
                                                                        message: `Incentive is updated successfully for ${monthName} ${selectedYear}`,
                                                                        type: "success",
                                                                    });
                                                                } else {
                                                                    setToast({ message: data.error || "Failed to update incentive", type: "error" });
                                                                }
                                                            } catch (error) {
                                                                console.error(error);
                                                                setToast({ message: "Something went wrong", type: "error" });
                                                            }
                                                        }}
                                                        className="bg-[#295A47] hover:bg-[#1f4637] text-white px-3 py-1 rounded-lg text-xs"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                            {/* LEAVE COUNTS */}
                                            {Object.entries(
                                                salaryAttendance.reduce(
                                                    (acc: any, item: any) => {
                                                        const leave =
                                                            item.leave_type?.trim() || "Present";
                                                        acc[leave] = (acc[leave] || 0) + 1;
                                                        return acc;
                                                    },
                                                    {}
                                                )
                                            ).map(([leave, count]: any) => (
                                                <div
                                                    key={leave}
                                                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
                                                >
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {leave}
                                                    </span>
                                                    <span className="text-lg font-bold text-[#295A47]">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Late
                                                </span>
                                                <span className="text-lg font-bold text-red-600">
                                                    {salaryAttendance.filter((item) => item.is_late === 1).length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                                        <p className="text-sm text-orange-700 font-medium">
                                            Current Month
                                        </p>
                                        <h2 className="text-2xl font-bold text-orange-800 mt-2">
                                            {new Date().toLocaleString("en-IN", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </h2>
                                    </div>
                                </div>
                            )}
                            {/* MONTH FILTER + SUMMARY */}
                            {selectedSalaryEmp && (
                                <div className="space-y-5">
                                    {/* FILTERS */}
                                    <div className="bg-white border rounded-3xl p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {/* MONTH */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                                    Select Month
                                                </label>
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) =>
                                                        setSelectedMonth(e.target.value)
                                                    }
                                                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                                                >
                                                    {[
                                                        "January",
                                                        "February",
                                                        "March",
                                                        "April",
                                                        "May",
                                                        "June",
                                                        "July",
                                                        "August",
                                                        "September",
                                                        "October",
                                                        "November",
                                                        "December",
                                                    ].map((month, index) => (
                                                        <option
                                                            key={month}
                                                            value={String(index + 1).padStart(2, "0")}
                                                        >
                                                            {month}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* YEAR */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                                    Select Year
                                                </label>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) =>
                                                        setSelectedYear(e.target.value)
                                                    }
                                                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                                                >
                                                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                                                        <option
                                                            key={year}
                                                            value={year}
                                                        >
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* PAYMENT STATUS */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                                    Payment Status
                                                </label>
                                                <select
                                                    value={monthlyPaymentStatus}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        try {
                                                            const res = await fetch(
                                                                "/api/employees/salary-details",
                                                                {
                                                                    method: "PUT",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                    },
                                                                    body: JSON.stringify({
                                                                        emp_id:
                                                                            selectedSalaryEmp.emp_id,
                                                                        month: selectedMonth,
                                                                        year: selectedYear,
                                                                        salary_status: newStatus,
                                                                    }),
                                                                }
                                                            );
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                setMonthlyPaymentStatus(
                                                                    newStatus
                                                                );
                                                                // UPDATE TABLE UI
                                                                setSalaryAttendance((prev) =>
                                                                    prev.map((item) => ({
                                                                        ...item,
                                                                        salary_status: newStatus,
                                                                    }))
                                                                );
                                                            } else {
                                                                alert(data.error);
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                        }
                                                    }}
                                                    className={`w-full border rounded-xl px-4 py-3 font-semibold outline-none transition
                                                                ${monthlyPaymentStatus === "Paid"
                                                            ? "border-green-300 bg-green-50 text-green-700"
                                                            : "border-orange-300 bg-orange-50 text-orange-700"
                                                        }`}
                                                >
                                                    <option value="Pending">
                                                        Pending
                                                    </option>
                                                    <option value="Paid">
                                                        Paid
                                                    </option>
                                                </select>
                                            </div>
                                            {/* TOTAL SALARY */}
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                                    Total Salary Till Last Day
                                                </label>
                                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                                    <h2 className="text-2xl font-bold text-green-700">
                                                        ₹ {totalSalaryWithTA.toFixed(2)}
                                                    </h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* SUMMARY CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                            <p className="text-sm text-blue-700 font-medium mb-3">
                                                Attendance & Leaves Summary
                                            </p>
                                            {/* TOTAL ATTENDANCE */}
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500">
                                                    Total Present
                                                </p>
                                                <h2 className="text-3xl font-bold text-blue-800 mt-1">
                                                    {
                                                        salaryAttendance.filter(
                                                            (item) =>
                                                                !item.leave_type ||
                                                                item.leave_type === "-" ||
                                                                item.leave_type === ""
                                                        ).length
                                                    }
                                                </h2>
                                            </div>
                                            {/* LEAVE COUNTS */}
                                            <div className="space-y-2">
                                                {Object.entries(
                                                    salaryAttendance.reduce((acc: any, item: any) => {
                                                        if (
                                                            item.leave_type &&
                                                            item.leave_type !== "-" &&
                                                            item.leave_type.trim() !== ""
                                                        ) {
                                                            acc[item.leave_type] =
                                                                (acc[item.leave_type] || 0) + 1;
                                                        }
                                                        return acc;
                                                    }, {})
                                                ).length > 0 ? (
                                                    Object.entries(
                                                        salaryAttendance.reduce((acc: any, item: any) => {
                                                            if (
                                                                item.leave_type &&
                                                                item.leave_type !== "-" &&
                                                                item.leave_type.trim() !== ""
                                                            ) {
                                                                acc[item.leave_type] =
                                                                    (acc[item.leave_type] || 0) + 1;
                                                            }
                                                            return acc;
                                                        }, {})
                                                    ).map(([leave, count]: any) => (
                                                        <div
                                                            key={leave}
                                                            className="flex items-center justify-between bg-white border border-blue-100 rounded-xl px-3 py-2"
                                                        >
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {leave}
                                                            </span>
                                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-gray-500">
                                                        No leaves taken
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                                            <p className="text-sm text-purple-700 font-medium">
                                                Salary Status
                                            </p>
                                            <h2 className="text-3xl font-bold text-purple-800 mt-2">
                                                {monthlyPaymentStatus}
                                            </h2>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                                            <p className="text-sm text-orange-700 font-medium">
                                                Selected Period
                                            </p>
                                            <h2 className="text-2xl font-bold text-orange-800 mt-2">
                                                {new Date(
                                                    `${selectedYear}-${selectedMonth}-01`
                                                ).toLocaleString("en-IN", {
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </h2>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* TOAST */}
            {toast && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none px-4">
                    <div
                        className={`pointer-events-auto min-w-[280px] max-w-[90vw] sm:max-w-md rounded-xl px-5 py-4 shadow-2xl text-center text-sm font-medium
                ${toast.type === "success"
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                    >
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}