"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Camera, LogIn, LogOut, X } from "lucide-react";

interface Attendance {
  id: number;
  checkin: string;
  checkout: string | null;
  text: string | null;
  picture: string | null;
}

const SiteVisitPage = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

  const getKolkataTime = () => {
  const now = new Date();

  const istDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");

  const hours = String(istDate.getHours()).padStart(2, "0");
  const minutes = String(istDate.getMinutes()).padStart(2, "0");
  const seconds = String(istDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

  const fetchAttendance = async () => {
    const res = await fetch("/api/supervisor/sitevisit?type=history");
    const data = await res.json();
    setAttendance(data);
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = () => {
    const time = getKolkataTime();
    setCheckInTime(time);
  };
  const handleSubmit = async () => {
    if (!checkInTime) {
      alert("Please check in first");
      return;
    }
    if (!image) {
      alert("Please upload a site image");
      return;
    }

    if (!note.trim()) {
      alert("Please write a site visit note");
      return;
    }

    const formData = new FormData();
    formData.append("checkin", checkInTime);
    formData.append("text", note);

    if (image) {
      formData.append("image", image);
    }

    await fetch("/api/supervisor/sitevisit", {
      method: "POST",
      body: formData,
    });
    setCheckInTime(null);
    setNote("");
    setImage(null);
    fetchAttendance();
  };
  const handleCheckOut = async (id: number) => {
    const time = getKolkataTime();

    await fetch("/api/supervisor/sitevisit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        checkout: time,
      }),
    });

    setCheckOutTime(time);
    fetchAttendance();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#295A47]">
          Site Visit
        </h1>
      </div>

      {/* Checkin Card */}

      <div className="bg-white rounded-2xl shadow-md p-6 mb-10 max-w-3xl border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Site Visit Check-In
        </h2>

        {/* Checkin Button */}

        <button
          onClick={handleCheckIn}
          disabled={checkInTime !== null}
          className="flex items-center gap-2 bg-[#295A47] text-white px-5 py-2.5 rounded-lg hover:bg-[#1f4537] transition disabled:bg-gray-400"
        >
          <LogIn size={18} />
          Check In
        </button>

        {checkInTime && (
          <p className="mt-3 text-green-600 font-medium text-sm">
            Checked In at: {formatDateTime(checkInTime)}
          </p>
        )}

        {/* Upload */}

        <div className="mt-6">
          <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
            <Camera size={18} />
            Upload Site Image
          </label>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Site Image
            </label>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#295A47] transition bg-gray-50">
              {image ? (
                <div className="flex flex-col items-center gap-2 p-3">
                  <img
                    src={URL.createObjectURL(image)}
                    className="w-24 h-24 object-cover rounded-lg shadow"
                  />

                  <p className="text-xs text-gray-600 text-center break-all">
                    {image.name}
                  </p>

                  <span className="text-xs text-[#295A47] font-medium">
                    Click to change image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Camera size={28} className="mb-2" />

                  <p className="text-sm font-medium">Upload Site Image</p>

                  <p className="text-xs text-gray-400">Click to browse</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Note */}

        <div className="mt-6">
          <label className="font-medium text-gray-700">Site Detail</label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write site visit notes..."
            className="w-full border border-gray-200 rounded-lg p-3 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#295A47]"
            rows={4}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!checkInTime}
          className="mt-4 flex items-center gap-2 bg-[#295A47] text-white px-6 py-2.5 rounded-lg hover:bg-[#1f4537] transition disabled:bg-gray-400"
        >
          Submit
        </button>
      </div>

      {/* Attendance History */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">
            Attendance History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Check In</th>
                <th className="p-3 text-left">Check Out</th>
                <th className="p-3 text-left">Note</th>
                <th className="p-3 text-center">Image</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((att) => (
                <tr
                  key={att.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">{formatDateTime(att.checkin)}</td>

                  <td className="p-3">
                    {att.checkout ? (
                      <span className="text-gray-700">
                        {formatDateTime(att.checkout)}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckOut(att.id)}
                        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-xs"
                      >
                        <LogOut size={14} />
                        Check Out
                      </button>
                    )}
                  </td>

                  <td className="p-3 text-gray-600 max-w-xs">
                    {att.text || "-"}
                  </td>

                  <td className="p-3 text-center">
                    {att.picture ? (
                      <img
                        src={att.picture}
                        onClick={() => setSelectedImage(att.picture!)}
                        className="w-14 h-14 object-cover rounded-lg mx-auto border cursor-pointer hover:scale-110 transition"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 bg-white/90 hover:bg-white text-black rounded-full p-2 shadow-lg"
          >
            <X size={22} />
          </button>

          {/* Image */}
          <img
            src={selectedImage}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default SiteVisitPage;
