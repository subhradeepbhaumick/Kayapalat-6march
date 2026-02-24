"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Camera, CheckCircle, XCircle } from "lucide-react";

interface Labour {
  id: number;
  name: string;
  status: "present" | "absent";
  photo?: File | null;
}

const LabourPage = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  // Fake labour list
  const [labours, setLabours] = useState<Labour[]>([
    { id: 1, name: "Rahul Das", status: "present" },
    { id: 2, name: "Amit Shaw", status: "present" },
    { id: 3, name: "Raju Khan", status: "absent" },
  ]);

  // Toggle status
  const toggleStatus = (id: number) => {
    setLabours(
      labours.map((l) =>
        l.id === id
          ? { ...l, status: l.status === "present" ? "absent" : "present" }
          : l
      )
    );
  };

  // Upload photo
  const handlePhoto = (id: number, file: File) => {
    setLabours(labours.map((l) => (l.id === id ? { ...l, photo: file } : l)));
  };

  // Submit
  const handleSubmit = () => {
    alert("Attendance Submitted (Frontend)");
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#295A47] mb-6">
        Labour Attendance — {projectId}
      </h1>

      <div className="bg-white shadow rounded p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Name</th>

              <th>Status</th>

              <th>Photo</th>
            </tr>
          </thead>

          <tbody>
            {labours.map((labour) => (
              <tr key={labour.id} className="border-b text-center">
                {/* Name */}

                <td className="text-left py-3">{labour.name}</td>

                {/* Status */}

                <td>
                  <button
                    onClick={() => toggleStatus(labour.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-white mx-auto ${
                      labour.status === "present"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {labour.status === "present" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}

                    {labour.status}
                  </button>
                </td>

                {/* Photo */}

                <td>
                  <label className="cursor-pointer flex justify-center">
                    <Camera />

                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        if (e.target.files)
                          handlePhoto(labour.id, e.target.files[0]);
                      }}
                    />
                  </label>

                  {labour.photo && (
                    <p className="text-xs">{labour.photo.name}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Submit */}

        <button
          onClick={handleSubmit}
          className="mt-6 bg-[#295A47] text-white px-6 py-2 rounded hover:bg-[#1f4637]"
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
};

export default LabourPage;
