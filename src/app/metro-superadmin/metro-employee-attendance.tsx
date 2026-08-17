"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, X } from "lucide-react";
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

        const filtered = (Array.isArray(attendance) ? attendance : []).filter((item) => {
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
                setMonthlySalaryTotal(
                    Number(data.total_salary || 0)
                );
                setMonthlyPaymentStatus(
                    data.payment_status || "Pending"
                );
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
            const list = Array.isArray(data) ? data : [];
            if (!Array.isArray(data)) {
                console.error("Unexpected attendance response:", data);
            }
            setAttendance(list);
            setFilteredAttendance(list);
        } catch (error) {
            console.error(error);
            setAttendance([]);
            setFilteredAttendance([]);
        }
    };
    const openMapModal = (location: string) => {
        setMapLocation(location);
        setShowMapModal(true);
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
        </div>
    );
}