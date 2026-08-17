"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    User,
    Briefcase,
    FileText,
    IndianRupee,
    LogIn,
    LogOut,
    Save,
    MapPin,
    AlertTriangle,
    X,
    Eye,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { generateSalarySlip } from "@/components/SalarySlip";
interface AttendanceForm {
    emp_id: string;
    emp_type: string;
    name: string;
    checkin: string;
    checkout: string;
    leave_type: string;
    login_location: string;
    ta_entry: string | null;
    ta_location: string | null;
    note: string;
    per_day_income: string;
    salary_status: string;
    checkin_location: string;
    checkout_location: string;
}
interface EmployeeData {
    emp_id: string;
    name: string;
    emp_type: string;
    salary: number;
}
const defaultForm: AttendanceForm = {
    emp_id: "",
    emp_type: "",
    name: "",
    checkin: "",
    checkout: "",
    leave_type: "",
    login_location: "",
    ta_entry: null,
    ta_location: null,
    note: "",
    per_day_income: "",
    salary_status: "Pending",
    checkin_location: "",
    checkout_location: "",
};
export default function EmployeeAttendance() {
    const { data: session } = useSession();
    const [form, setForm] = useState<AttendanceForm>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [checkingEmployee, setCheckingEmployee] = useState(true);
    const [employeeFound, setEmployeeFound] = useState(false);
    const [attendanceList, setAttendanceList] = useState<any[]>([]);
    const [basePerDayIncome, setBasePerDayIncome] = useState<number>(0);
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapLocation, setMapLocation] = useState("");
    const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
    const [previousMonthsIncome, setPreviousMonthsIncome] = useState<any[]>([]);
    const [monthlySalary, setMonthlySalary] = useState<number>(0);
    const [monthlySummary, setMonthlySummary] = useState<any[]>([]);
    const originalPerDayIncome = useMemo(() => {
        return form.per_day_income
            ? Number(form.per_day_income)
            : 0;
    }, [form.per_day_income]);
    const getISTDateTime = () => {
        const now = new Date();
        // CONVERT TO IST
        const istDate = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
            })
        );
        // FORMAT FOR INPUT STORAGE
        const year = istDate.getFullYear();
        const month = String(istDate.getMonth() + 1).padStart(2, "0");
        const day = String(istDate.getDate()).padStart(2, "0");
        const hours = String(istDate.getHours()).padStart(2, "0");
        const minutes = String(istDate.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    const currentDate = new Date();

    const [attendanceMonth, setAttendanceMonth] = useState(
        String(currentDate.getMonth() + 1).padStart(2, "0")
    );

    const [attendanceYear, setAttendanceYear] = useState(
        String(currentDate.getFullYear())
    );
    const currentDateTime = useMemo(() => {
        return getISTDateTime();
    }, []);
    // ===========================
    // CHECK EMPLOYEE ACCESS
    // ===========================
    useEffect(() => {
        const checkEmployee = async () => {
            try {
                if (!session?.user?.id) return;
                const response = await fetch(
                    `/api/employees/check-attendance-access?emp_id=${session.user.id}`
                );
                const data = await response.json();
                if (response.ok && data.exists) {
                    const employee: EmployeeData = data.employee;
                    setEmployeeFound(true);
                    const now = new Date();
                    const daysInCurrentMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                    ).getDate();
                    const dailyIncome = employee.salary
                        ? employee.salary / daysInCurrentMonth
                        : 0;
                    setBasePerDayIncome(dailyIncome);
                    setMonthlySalary(employee.salary || 0);
                    fetchMonthlySummary();
                    setForm((prev) => ({
                        ...prev,
                        emp_id: employee.emp_id,
                        name: employee.name,
                        emp_type: employee.emp_type,
                        per_day_income: dailyIncome.toFixed(2),
                        checkin: currentDateTime,
                    }));
                    // LOAD TODAY ATTENDANCE
                    fetchTodayAttendance();
                    fetchCurrentMonthIncome();
                    fetchPreviousMonthsIncome();
                } else {
                    setEmployeeFound(false);
                }
            } catch (error) {
                console.error(error);
                setEmployeeFound(false);
            } finally {
                setCheckingEmployee(false);
            }
        };
        checkEmployee();
    }, [session, currentDateTime]);
    const fetchCurrentMonthIncome = async () => {
        try {
            const response = await fetch(
                `/api/employees/attendance/month-income?emp_id=${session?.user?.id}`
            );
            const data = await response.json();
            if (response.ok) {
                setMonthlyIncome(data.total_income || 0);
            }
        } catch (error) {
            console.error(error);
        }
    };
    const fetchPreviousMonthsIncome = async () => {
        try {
            const response = await fetch(
                `/api/employees/attendance/all-month-income?emp_id=${session?.user?.id}`
            );
            const data = await response.json();
            if (response.ok) {
                setPreviousMonthsIncome(data.months || []);
            }
        } catch (error) {
            console.error(error);
        }
    };
    const fetchMonthlySummary = async () => {
        try {
            const response = await fetch(
                `/api/employees/attendance/monthly-summary?emp_id=${session?.user?.id}`
            );
            const data = await response.json();
            if (response.ok) {
                setMonthlySummary(data.summary || []);
            }
        } catch (error) {
            console.error(error);
        }
    };
    // ===========================
    // HANDLE CHANGE
    // ===========================
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        // HANDLE LEAVE TYPE
        if (name === "leave_type") {
            let updatedIncome = basePerDayIncome;
            // WEEKOFF
            if (value === "Weekoff") {
                updatedIncome = basePerDayIncome;
            }
            // HALF DAY
            if (value === "Half Day") {
                updatedIncome = basePerDayIncome / 2;
            }
            // ABSENT
            else if (value === "Absent") {
                updatedIncome = 0;
            }
            // NO LEAVE / SICK / CASUAL
            else {
                updatedIncome = basePerDayIncome;
            }
            setForm((prev) => ({
                ...prev,
                leave_type: value,
                per_day_income: updatedIncome.toFixed(2),
            }));
            return;
        }
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    // ===========================
    // CHECKIN NOW
    // ===========================
    const handleCheckinNow = () => {
        const now = getISTDateTime();
        setForm((prev) => ({
            ...prev,
            checkin: now,
        }));
    };
    const handleTAEntry = async (attendanceId: number) => {
        try {
            if (!navigator.geolocation) {
                alert("Geolocation not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const location = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
                    const res = await fetch("/api/employees/attendance/ta-entry", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            attendanceId,
                            location,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                        alert("TA Entry recorded");

                        setAttendanceList((prev) =>
                            prev.map((item) =>
                                item.id === attendanceId
                                    ? {
                                        ...item,
                                        ta_entry: new Date().toISOString(),
                                        ta_location: location,
                                    }
                                    : item
                            )
                        );
                    } else {
                        alert(data.error || "Failed");
                    }
                },
                () => {
                    alert("Location access denied");
                }
            );
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        }
    };
    // ===========================
    // CHECKOUT NOW
    // ===========================
    const handleCheckoutNow = () => {
        const now = getISTDateTime();
        setForm((prev) => ({
            ...prev,
            checkout: now,
        }));
    };
    const getMySQLISTDateTime = () => {
        const now = new Date();
        const ist = new Date(
            now.toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
            })
        );
        const year = ist.getFullYear();
        const month = String(ist.getMonth() + 1).padStart(2, "0");
        const day = String(ist.getDate()).padStart(2, "0");
        const hours = String(ist.getHours()).padStart(2, "0");
        const minutes = String(ist.getMinutes()).padStart(2, "0");
        const seconds = String(ist.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    const openMapModal = (location: string) => {
        setMapLocation(location);
        setShowMapModal(true);
    };
    // ===========================
    // FETCH LOCATION
    // ===========================
    const fetchLocation = async (
        type: "checkin_location" | "checkout_location"
    ) => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
                setForm((prev) => ({
                    ...prev,
                    [type]: location,
                }));
            },
            (error) => {
                console.error(error);
                alert("Unable to fetch location");
            }
        );
    };
    const fetchTodayAttendance = async () => {
        try {
            const response = await fetch(
                `/api/employees/attendance/today?emp_id=${session?.user?.id}`
            );
            const data = await response.json();
            if (response.ok) {
                setAttendanceList(data.attendance || []);
            }
        } catch (error) {
            console.error(error);
        }
    };
    const filteredAttendance = attendanceList.filter((item) => {
        if (!item.checkin) return false;

        const date = new Date(item.checkin);

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear());

        return month === attendanceMonth && year === attendanceYear;
    });
    const handleLogoutAttendance = async (id: number) => {
        try {
            let latitude = "";
            let longitude = "";
            if (navigator.geolocation) {
                const position = await new Promise<GeolocationPosition>(
                    (resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    }
                );
                latitude = position.coords.latitude.toString();
                longitude = position.coords.longitude.toString();
            }
            const response = await fetch("/api/employees/attendance/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id,
                    checkout: getMySQLISTDateTime(),
                    checkout_location: `Lat: ${latitude}, Lng: ${longitude}`,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                alert("Checked Out Successfully");
                fetchTodayAttendance();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Checkout failed");
        }
    };
    // ===========================
    // SUBMIT
    // ===========================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // ===========================
            // CHECK IF TODAY ATTENDANCE EXISTS
            // ===========================
            const checkResponse = await fetch(
                `/api/employees/attendance/check-today?emp_id=${form.emp_id}`
            );
            const checkData = await checkResponse.json();
            if (checkResponse.ok && checkData.exists) {
                alert(
                    "Today's attendance already exists. Please delete today's attendance first before submitting again."
                );
                setLoading(false);
                return;
            }
            let latitude = "";
            let longitude = "";
            // GET CURRENT LOCATION
            if (navigator.geolocation) {
                const position = await new Promise<GeolocationPosition>(
                    (resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    }
                );
                latitude = position.coords.latitude.toString();
                longitude = position.coords.longitude.toString();
            }
            const payload = {
                ...form,
                salary_status: "Pending",
                checkin_location: `Lat: ${latitude}, Lng: ${longitude}`,
            };
            const response = await fetch("/api/employees/attendance/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok) {
                alert("Attendance Saved Successfully");
                fetchTodayAttendance();
                // REFRESH CURRENT MONTH INCOME
                fetchCurrentMonthIncome();
                setForm((prev) => ({
                    ...prev,
                    checkout: "",
                    note: "",
                    leave_type: "",
                    checkin: currentDateTime,
                    per_day_income: basePerDayIncome.toFixed(2),
                }));
            } else {
                alert(data.message || "Failed to save attendance");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };
    // ===========================
    // LOADING SCREEN
    // ===========================
    if (checkingEmployee) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-[#295A47] mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">
                        Checking Employee Access...
                    </h2>
                </div>
            </div>
        );
    }
    // ===========================
    // ACCESS DENIED
    // ===========================
    if (!employeeFound) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl p-10 text-center border border-red-200">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-700 mb-4">
                        Attendance Access Denied
                    </h1>
                    <p className="text-gray-700 text-lg leading-relaxed">
                        Your Employee ID was not found in the employee database.
                    </p>
                    <p className="mt-4 text-gray-600">
                        Please contact <span className="font-bold">KAYAPALAT</span> for the
                        issue of attendance sheet access.
                    </p>
                </div>
            </div>
        );
    }
    // ===========================
    // MAIN FORM
    // ===========================
    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#295A47] text-white p-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CalendarDays className="w-8 h-8" />
                        Employee Attendance Form
                    </h1>
                    <p>
                        Please fill in your attendance details below. Make sure to check in and check out on time. If you are taking leave, select the appropriate leave type.
                    </p>
                    <div className="mb-6 rounded-xl border-l-4 border-[#295A47] bg-[#F5F8F6] p-4 shadow-sm">
                        <h3 className="text-lg font-semibold text-[#295A47] mb-2">
                            📢 Office Attendance Notice
                        </h3>

                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>
                                Office working hours are <strong>09:00 AM to 09:00 PM</strong>.
                            </li>
                            <li>
                                Lunch break timing is <strong>1:30 PM to 2:00 PM</strong>.
                            </li>
                            <li>
                                Tea break timing is <strong>5:00 PM to 5:15 PM</strong>.
                            </li>
                            <li>
                                All employees are requested to complete their personal work
                                before or after office hours.
                            </li>
                            <li>
                                During office hours, employees are expected to focus on their
                                assigned responsibilities and maintain professional discipline.
                            </li>
                            <li className="text-red-700 font-bold">
                                <strong>⚠️ Three late arrivals within a calendar month will be treated as one day absent.</strong>
                            </li>
                            <li className="text-amber-700 font-semibold">
                                <strong>💰 Salary Disbursement Notice:</strong> If an employee remains absent between the <strong>1st and 10th</strong> of any month, their salary may be credited <strong>one additional working day later for each day of absence</strong> during that period.
                            </li>
                        </ul>
                    </div>
                </div>
                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
                >
                    {/* EMP ID */}
                    <div>
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <User size={16} />
                            Employee ID
                        </label>
                        <input
                            type="text"
                            value={form.emp_id}
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    {/* NAME */}
                    <div>
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <User size={16} />
                            Employee Name
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    {/* EMP TYPE */}
                    <div>
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Briefcase size={16} />
                            Employee Type
                        </label>
                        <input
                            type="text"
                            value={form.emp_type}
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    {/* LEAVE TYPE */}
                    <div>
                        <label className="text-sm font-semibold mb-2">
                            Leave Type
                        </label>
                        <select
                            name="leave_type"
                            value={form.leave_type}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3"
                        >
                            <option value="">No Leave</option>
                            {/* ONLY PERMANENT EMPLOYEES */}
                            {form.emp_type === "Permanent" && (
                                <>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                </>
                            )}
                            <option value="Half Day">Half Day</option>
                            <option value="Absent">Absent</option>
                            <option value="Weekoff">Weekoff</option>
                        </select>
                    </div>
                    {/* LOGIN LOCATION */}
                    <div>
                        <label className="text-sm font-semibold mb-2">
                            Login Location
                        </label>
                        <select
                            name="login_location"
                            value={form.login_location || "Direct Office"}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3"
                        >
                            <option value="Direct Office">Direct Office</option>
                            <option value="Direct Site">Direct Site</option>
                            <option value="Market">Market</option>
                        </select>
                    </div>
                    {/* CHECKIN */}
                    <div>
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <LogIn size={16} />
                            Checkin Time
                        </label>
                        <div className="flex gap-2">
                            <div className="w-full border rounded-xl p-3 bg-gray-100 flex items-center">
                                {form.checkin
                                    ? new Date(form.checkin).toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                        timeZone: "Asia/Kolkata",
                                    })
                                    : "No Checkin Time"}
                            </div>
                            <button
                                type="button"
                                onClick={handleCheckinNow}
                                className="bg-[#295A47] text-white px-4 rounded-xl"
                            >
                                Now
                            </button>
                        </div>
                    </div>
                    {/* PER DAY INCOME */}
                    <div>
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <IndianRupee size={16} />
                            Per Day Income
                        </label>
                        <input
                            type="number"
                            value={form.per_day_income}
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    {/* SALARY STATUS */}
                    <div>
                        <label className="text-sm font-semibold mb-2">
                            Salary Status
                        </label>
                        <input
                            type="text"
                            value="Pending"
                            disabled
                            className="w-full border rounded-xl p-3 bg-gray-100"
                        />
                    </div>
                    {/* NOTE */}
                    <div className="md:col-span-2">
                        <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileText size={16} />
                            Note
                        </label>
                        <textarea
                            name="note"
                            value={form.note}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Enter note..."
                            className="w-full border rounded-xl p-3"
                        />
                    </div>
                    {/* SUBMIT */}
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#295A47] hover:bg-[#1f4637] text-white py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {loading ? "Saving..." : "Save Attendance"}
                        </button>
                    </div>
                </form>
                <div className="p-6 border-t">
                    <h2 className="text-2xl font-bold mb-6">
                        Today's Attendance
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#295A47] text-white">
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Checkin</th>
                                    <th className="p-3 text-left">Checkout</th>
                                    <th className="p-3 text-left">Leave</th>
                                    <th className="p-3 text-left">Checkin Location</th>
                                    <th className="p-3 text-left">Login Location</th>
                                    <th className="p-3 text-left">TA Checkout</th>
                                    <th className="p-3 text-left">Logout</th>
                                    <th className="p-3 text-left">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.length > 0 ? (
                                    filteredAttendance.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-3">
                                                {new Date(item.created_at).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    timeZone: "Asia/Kolkata",
                                                })}
                                            </td>
                                            <td className="p-3">
                                                {item.checkin
                                                    ? item.checkin.slice(11, 19)
                                                    : "-"}
                                            </td>
                                            <td className="p-3">
                                                {item.checkout
                                                    ? item.checkout.slice(11, 19)
                                                    : "Not Checked Out"}
                                            </td>
                                            <td className="p-3">
                                                {item.leave_type || "-"}
                                            </td>
                                            <td className="p-3">
                                                {item.checkin_location ? (
                                                    <button
                                                        onClick={() => openMapModal(item.checkin_location)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {item.login_location || "-"}
                                            </td>
                                            <td className="p-3">
                                                {!item.ta_entry ? (
                                                    <button
                                                        onClick={() => handleTAEntry(item.id)}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl"
                                                    >
                                                        Entry
                                                    </button>
                                                ) : (
                                                    <span className="text-orange-600 font-semibold">
                                                        {item.ta_entry.slice(11, 19)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {!item.checkout ? (
                                                    <button
                                                        onClick={() =>
                                                            handleLogoutAttendance(item.id)
                                                        }
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
                                                    >
                                                        Logout
                                                    </button>
                                                ) : (
                                                    <span className="text-green-600 font-semibold">
                                                        Completed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={async () => {
                                                        const confirmDelete = confirm(
                                                            "Are you sure you want to delete this attendance record?"
                                                        );
                                                        if (!confirmDelete) return;
                                                        try {
                                                            const res = await fetch(
                                                                `/api/employees/attendance?id=${item.id}`,
                                                                {
                                                                    method: "DELETE",
                                                                }
                                                            );
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                alert("Attendance deleted successfully");
                                                                setAttendanceList((prev) =>
                                                                    prev.filter((att) => att.id !== item.id)
                                                                );
                                                            } else {
                                                                alert(data.error || "Delete failed");
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                            alert("Something went wrong");
                                                        }
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No Attendance Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-6 border-t bg-green-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#295A47]">
                                Current Month Income
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Total income earned till today
                            </p>
                        </div>
                        <div className="bg-white shadow-lg rounded-2xl px-8 py-5 border border-green-200">
                            <div className="flex items-center gap-3">
                                <IndianRupee className="text-green-700 w-8 h-8" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Amount
                                    </p>
                                    <h3 className="text-3xl font-bold text-green-700">
                                        {Number(monthlyIncome).toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* SALARY PER MONTH */}
                <div className="p-6 border-t bg-yellow-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#295A47]">
                                Salary Per Month
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Fixed monthly salary
                            </p>
                        </div>
                        <div className="bg-white shadow-lg rounded-2xl px-8 py-5 border border-yellow-200">
                            <div className="flex items-center gap-3">
                                <IndianRupee className="text-yellow-700 w-8 h-8" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Monthly Salary
                                    </p>
                                    <h3 className="text-3xl font-bold text-yellow-700">
                                        ₹ {Number(monthlySalary).toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* MONTHLY ATTENDANCE SUMMARY */}
                <div className="p-6 border-t bg-purple-50">
                    <h2 className="text-2xl font-bold text-[#295A47] mb-6">
                        Monthly Attendance Summary
                    </h2>
                    {monthlySummary.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow">
                                <thead>
                                    <tr className="bg-[#295A47] text-white">
                                        <th className="p-4 text-left">Month</th>
                                        <th className="p-4 text-left">Year</th>
                                        <th className="p-4 text-left">Present</th>
                                        <th className="p-4 text-left">TA Site Visit</th>
                                        {form.emp_type === "Permanent" && (
                                            <>
                                                <th className="p-4 text-left">Sick Leave</th>
                                                <th className="p-4 text-left">Casual Leave</th>
                                            </>
                                        )}
                                        <th className="p-4 text-left">Weekoff</th>
                                        <th className="p-4 text-left">Half Day</th>
                                        <th className="p-4 text-left">Absent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlySummary.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-medium">
                                                {item.month_name}
                                            </td>
                                            <td className="p-4">
                                                {item.year}
                                            </td>
                                            <td className="p-4 font-bold text-green-700">
                                                {item.present_count}
                                            </td>
                                            <td className="p-4 font-bold text-orange-700">
                                                {item.ta_site_visit_count}
                                            </td>
                                            {form.emp_type === "Permanent" && (
                                                <>
                                                    <td className="p-4 font-bold text-cyan-700">
                                                        {item.sick_leave_count}
                                                    </td>
                                                    <td className="p-4 font-bold text-indigo-700">
                                                        {item.casual_leave_count}
                                                    </td>
                                                </>
                                            )}
                                            <td className="p-4 font-bold text-blue-700">
                                                {item.weekoff_count}
                                            </td>
                                            <td className="p-4 font-bold text-yellow-700">
                                                {item.halfday_count}
                                            </td>
                                            <td className="p-4 font-bold text-red-700">
                                                {item.absent_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            No attendance summary found
                        </div>
                    )}
                </div>
                {/* PREVIOUS MONTHS SALARY */}
                <div className="p-6 border-t bg-blue-50">
                    <h2 className="text-2xl font-bold text-[#295A47] mb-6">
                        Previous Months Salary
                    </h2>
                    {previousMonthsIncome.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow">
                                <thead>
                                    <tr className="bg-[#295A47] text-white">
                                        <th className="p-4 text-left">Month</th>
                                        <th className="p-4 text-left">Year</th>
                                        <th className="p-4 text-left">Total Salary</th>
                                        <th className="p-4 text-left">TA Amount</th>
                                        <th className="p-4 text-left">Incentive Amount</th>
                                        <th className="p-4 text-left">Payment Status</th>
                                        <th className="p-4 text-center">Salary Slip</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previousMonthsIncome.map((item: any, index: number) => (
                                        <tr
                                            key={index}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-medium">
                                                {item.month_name}
                                            </td>
                                            <td className="p-4">
                                                {item.year}
                                            </td>
                                            <td className="p-4 font-bold text-green-700">
                                                ₹ {Number(item.total_income).toFixed(2)}
                                            </td>
                                            <td className="p-4 font-bold text-orange-700">
                                                ₹ {Number(item.ta_amount || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 font-bold text-purple-700">
                                                ₹ {Number(item.incentive_amount || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${item.payment_status === "Paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                >
                                                    {item.payment_status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.payment_status === "Paid" ? (
                                                    <button
                                                        onClick={() =>
                                                            generateSalarySlip(
                                                                session?.user?.id!,
                                                                Number(item.month),
                                                                Number(item.year)
                                                            )
                                                        }
                                                        className="bg-[#295A47] hover:bg-[#214737] text-white px-4 py-2 rounded-lg font-medium transition"
                                                    >
                                                        Download
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        Not Available
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            No previous month salary found
                        </div>
                    )}
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
                        <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
                            {/* HEADER */}
                            <div className="flex items-center justify-between p-5 border-b">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <MapPin className="text-red-600" />
                                    Checkin Location
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