"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Attendance {
  id: number;
  supervisor_id: string;
  checkin: string;
  checkout: string | null;
  picture: string | null;
  text: string | null;
}

const SupervisorAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [rowsToShow, setRowsToShow] = useState<number | "all">(10);

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/superadmin/supervisor_attendence");

      if (!res.ok) {
        console.error("Failed to fetch attendance");
        return;
      }

      const data = await res.json();

      // ✅ Step 1: Log API response
      console.log("API RESPONSE:", data);

      // ✅ Step 2: Safely set state
      if (data && Array.isArray(data.attendance)) {
        setAttendance(data.attendance);
      } else {
        setAttendance(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Loading attendance...
      </div>
    );
  }
  const filteredAttendance = attendance.filter((att) => {
    const matchesSupervisor = supervisorFilter
      ? att.supervisor_id.toLowerCase().includes(supervisorFilter.toLowerCase())
      : true;

    const matchesDate = dateFilter
      ? new Date(att.checkin).toISOString().slice(0, 10) === dateFilter
      : true;

    return matchesSupervisor && matchesDate;
  });

  const displayedAttendance =
    rowsToShow === "all"
      ? filteredAttendance
      : filteredAttendance.slice(0, rowsToShow);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#295A47] mb-6">
        Supervisor Attendance
      </h2>
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Supervisor Filter */}
        <input
          type="text"
          placeholder="Filter by Supervisor ID"
          value={supervisorFilter}
          onChange={(e) => setSupervisorFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />

        {/* Date Filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={rowsToShow}
          onChange={(e) =>
            setRowsToShow(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value={5}>Show 5</option>
          <option value={10}>Show 10</option>
          <option value={15}>Show 15</option>
          <option value="all">Show All</option>
        </select>
        {/* Clear Filters */}
        <button
          onClick={() => {
            setSupervisorFilter("");
            setDateFilter("");
            setRowsToShow(10);
          }}
          className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
        >
          Clear
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-2">
        Showing {displayedAttendance.length} of {filteredAttendance.length}{" "}
        records
      </p>
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Supervisor ID</th>
              <th className="p-3 text-left">Check In</th>
              <th className="p-3 text-left">Check Out</th>
              <th className="p-3 text-left">Note</th>
              <th className="p-3 text-center">Image</th>
            </tr>
          </thead>

          <tbody>
            {displayedAttendance.map((att, index) => (
              <tr
                key={`${att.id}-${index}`}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-3 font-medium">{att.supervisor_id}</td>

                <td className="p-3">{formatDateTime(att.checkin)}</td>

                <td className="p-3">
                  {att.checkout ? (
                    formatDateTime(att.checkout)
                  ) : (
                    <span className="text-red-500 font-medium">
                      Not Checked Out
                    </span>
                  )}
                </td>

                <td className="p-3 max-w-xs text-gray-600">
                  {att.text || "-"}
                </td>

                <td className="p-3">
                  {att.picture ? (
                    <div className="flex justify-center">
                      <img
                        key={`img-${att.id}-${index}`}
                        src={att.picture}
                        onClick={() => setSelectedImage(att.picture)}
                        className="w-14 h-14 object-cover rounded-lg cursor-pointer border hover:scale-110 transition"
                      />
                    </div>
                  ) : (
                    <div className="text-center">-</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 bg-white rounded-full p-2"
          >
            <X size={22} />
          </button>

          <img
            src={selectedImage}
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default SupervisorAttendance;
