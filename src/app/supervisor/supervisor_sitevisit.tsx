"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Camera, LogIn, LogOut } from "lucide-react";

const SiteVisitPage = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // Check In
  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString();

    setCheckInTime(time);
  };

  // Check Out
  const handleCheckOut = () => {
    const time = new Date().toLocaleTimeString();

    setCheckOutTime(time);
  };

  // Upload Image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  // Submit Report
  const handleSubmit = () => {
    alert("Site Visit Data Submitted (Frontend)");
  };

  return (
    <div className="p-8">
      {/* Title */}

      <h1 className="text-3xl font-bold text-[#295A47] mb-6">
        Site Visit — {projectId}
      </h1>

      <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl">
        {/* Check In */}

        <div className="mb-4">
          <button
            onClick={handleCheckIn}
            disabled={checkInTime !== null}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            <LogIn size={18} />
            Check In
          </button>

          {checkInTime && (
            <p className="mt-2 text-green-700">Checked In at: {checkInTime}</p>
          )}
        </div>

        {/* Check Out */}

        <div className="mb-4">
          <button
            onClick={handleCheckOut}
            disabled={!checkInTime || checkOutTime !== null}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            <LogOut size={18} />
            Check Out
          </button>

          {checkOutTime && (
            <p className="mt-2 text-red-700">Checked Out at: {checkOutTime}</p>
          )}
        </div>

        {/* Upload Image */}

        <div className="mb-4">
          <label className="flex items-center gap-2 font-medium mb-2">
            <Camera size={18} />
            Upload Site Image
          </label>

          <input
            type="file"
            onChange={handleImageChange}
            className="border p-2 w-full rounded"
          />

          {image && <p className="text-sm text-gray-600 mt-1">{image.name}</p>}
        </div>

        {/* Note */}

        <div className="mb-4">
          <label className="font-medium">Add Note</label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            rows={4}
          />
        </div>

        {/* Submit */}

        <button
          onClick={handleSubmit}
          className="bg-[#295A47] text-white px-6 py-2 rounded hover:bg-[#1f4637]"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SiteVisitPage;
