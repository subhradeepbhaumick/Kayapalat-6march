"use client";
import React, { useState, useEffect } from "react";
import { Users, X } from "lucide-react";

interface Supervisor {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
}

interface AssignedSupervisor {
  id: number;
  supervisor_id: string;
  supervisor_name: string | null;
  profile_pic: string;
}

interface ProjectAllotment {
  id: string;
  appointment_id: string;
  project_name: string;
  project_value: number;
  supervisors: AssignedSupervisor[];
}

const SuperAdmin_Supervisor = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("All");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(
    null
  );

  const [projectAllotments, setProjectAllotments] = useState<
    ProjectAllotment[]
  >([]);
  const [activeAllotmentId, setActiveAllotmentId] = useState<string | null>(
    null
  );
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedProjectForDates, setSelectedProjectForDates] =
    useState<ProjectAllotment | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch dates when date modal opens
  useEffect(() => {
    if (showDateModal && selectedProjectForDates) {
      const fetchDates = async () => {
        try {
          const res = await fetch("/api/superadmin/project-supervisor");
          const data = await res.json();
          if (
            res.ok &&
            data.assignments[selectedProjectForDates.appointment_id]
          ) {
            const assignments =
              data.assignments[selectedProjectForDates.appointment_id];
            if (assignments.length > 0) {
              const firstAssignment = assignments[0];
              setStartDate(firstAssignment.start_date || "");
              setEndDate(firstAssignment.end_date || "");
            }
          }
        } catch (err) {
          console.error("Failed to fetch dates:", err);
        }
      };
      fetchDates();
    } else {
      // Clear dates when modal closes
      setStartDate("");
      setEndDate("");
    }
  }, [showDateModal, selectedProjectForDates]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    password: "",
    profilePic: null as File | null,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  });

  // Fetch supervisors and projects from DB on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch supervisors
        const supRes = await fetch("/api/superadmin/supervisor");
        const supData = await supRes.json();
        if (supRes.ok) {
          const supervisorsWithPic = supData.supervisors.map((s: any) => ({
            ...s,
            profilePic: s.profile_pic || "/placeholder_person.jpg",
          }));
          setSupervisors(supervisorsWithPic);
        }

        // Fetch projects
        const projRes = await fetch("/api/superadmin/supervisor");
        const projData = await projRes.json();
        if (projRes.ok) {
          // Set project allotments
          setProjectAllotments(
            projData.projects.map((p: any) => ({
              ...p,
              supervisors: [],
            }))
          );
        }

        // Fetch existing project-supervisor assignments
        const assignRes = await fetch("/api/superadmin/project-supervisor");
        const assignData = await assignRes.json();
        if (assignRes.ok && assignData.assignments) {
          setProjectAllotments((prev) =>
            prev.map((p) => ({
              ...p,
              supervisors: assignData.assignments[p.appointment_id] || [],
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const uniqueSupervisors = Array.from(new Set(supervisors.map((s) => s.name)));

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      selectedSupervisor === "All" || supervisor.name === selectedSupervisor
  );

  // Add supervisor to project
  const handleAddSupervisor = async (
    projectId: string,
    supervisorId: string
  ) => {
    const project = projectAllotments.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const res = await fetch("/api/superadmin/project-supervisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: projectId,
          supervisor_id: supervisorId,
          total_budget: project.project_value,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        const supervisor = supervisors.find((s) => s.user_id === supervisorId);
        setProjectAllotments((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  supervisors: [
                    ...p.supervisors,
                    {
                      id: data.assignment.id,
                      supervisor_id: supervisorId,
                      supervisor_name: supervisor?.name || null,
                      profile_pic:
                        supervisor?.profilePic || "/placeholder_person.jpg",
                    },
                  ],
                }
              : p
          )
        );
        setActiveAllotmentId(null);
      } else {
        alert(data.error || "Failed to add supervisor");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add supervisor");
    }
  };

  // Remove supervisor from project
  const handleRemoveSupervisor = async (
    projectId: string,
    assignmentId: number
  ) => {
    try {
      const res = await fetch(
        `/api/superadmin/project-supervisor?id=${assignmentId}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        // Update local state
        setProjectAllotments((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  supervisors: p.supervisors.filter(
                    (s) => s.id !== assignmentId
                  ),
                }
              : p
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove supervisor");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove supervisor");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate fields
    if (name === "email") {
      if (!value.includes("@")) {
        setErrors((prev) => ({ ...prev, email: "Email must contain @" }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    } else if (name === "phone") {
      if (value && value.length !== 10) {
        setErrors((prev) => ({ ...prev, phone: "Phone must be 10 digits" }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fileURL = URL.createObjectURL(file);
      setPreview(fileURL);
      setFormData({ ...formData, profilePic: file });
    }
  };

  const submitSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Name and Email are required");
      return;
    }
    if (errors.email || errors.phone) {
      alert("Please fix the validation errors");
      return;
    }
    if (!isEditing && !formData.password) {
      alert("Password is required for new supervisors");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("whatsapp", formData.whatsapp);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("password", formData.password);
      if (formData.profilePic) {
        formDataToSend.append("profilePic", formData.profilePic);
      }
      if (isEditing) {
        formDataToSend.append("user_id", editingSupervisor?.user_id || "");
      }

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch("/api/superadmin/supervisor", {
        method,
        body: formDataToSend,
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (isEditing) {
          // Update local state for edit
          setSupervisors((prev) =>
            prev.map((s) =>
              s.user_id === editingSupervisor?.user_id
                ? {
                    ...s,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                  }
                : s
            )
          );
        } else {
          // Add new supervisor to local state
          setSupervisors((prev) => [
            ...prev,
            {
              user_id: data.user_id,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              profilePic: "/default-profile.png",
            },
          ]);
        }
        resetForm();
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleEditClick = (supervisor: Supervisor, e: React.MouseEvent) => {
    setIsEditing(true);
    setEditingSupervisor(supervisor);
    setFormData({
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone || "",
      whatsapp: "",
      address: "",
      password: "",
      profilePic: null, // Can't prefill file input
    });
    setShowAddPopup(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      password: "",
      profilePic: null,
    });
    setSelectedFile(null);
    setPreview(null);
    setIsEditing(false);
    setEditingSupervisor(null);
    setShowAddPopup(false);
  };

  const handleSupervisorSelect = (projectId: string, supervisorId: string) => {
    const supervisor = supervisors.find((s) => s.user_id === supervisorId);
    if (supervisor) {
      setProjectAllotments((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                supervisor_id: supervisor.user_id,
                supervisor_name: supervisor.name,
              }
            : p
        )
      );
      setActiveAllotmentId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-4">
          Supervisor Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your supervisors and their details.
        </p>
      </div>

      <div className="flex items-end justify-between mb-6">
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Select Supervisor
          </label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
          >
            <option key="All" value="All">
              All
            </option>
            {uniqueSupervisors.map((supervisorName, index) => (
              <option key={index} value={supervisorName}>
                {supervisorName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            className="bg-green-900 text-white px-3 py-1 mr-7 rounded-md hover:bg-green-700"
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                phone: "",
                whatsapp: "",
                address: "",
                password: "",
                profilePic: null,
              });
              setSelectedFile(null);
              setPreview(null);
              setIsEditing(false);
              setEditingSupervisor(null);
              setShowAddPopup(true);
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full border border-gray-200 bg-white">
          <thead className="bg-[#D7E7D0] text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Supervisor Id</th>
              <th className="px-4 py-2 border">Profile</th>
              <th className="px-4 py-2 border">Supervisor Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSupervisors.length > 0 ? (
              filteredSupervisors.map((supervisor, index) => (
                <tr
                  key={supervisor.user_id}
                  className="hover:bg-green-50 transition"
                >
                  <td className="px-4 py-2 border text-center">
                    {supervisor.user_id}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <img
                      src={supervisor.profilePic}
                      className="w-10 h-10 rounded-full mx-auto"
                    />
                  </td>
                  <td className="px-4 py-2 border">{supervisor.name}</td>
                  <td className="px-4 py-2 border">{supervisor.email}</td>
                  <td className="px-4 py-2 border">{supervisor.phone}</td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-gray-500"
                      onClick={(e) => handleEditClick(supervisor, e)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-4 text-gray-500 border"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-[#295A47] mb-4">
          Project Allotment
        </h2>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full border border-gray-200 bg-white">
            <thead className="bg-[#D7E7D0] text-gray-700">
              <tr>
                <th className="px-4 py-2 border">Appointment ID</th>
                <th className="px-4 py-2 border">Project Name</th>
                <th className="px-4 py-2 border">Supervisor</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectAllotments.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-green-50 transition cursor-pointer"
                  onClick={() => {
                    setSelectedProjectForDates(project);
                    setShowDateModal(true);
                  }}
                >
                  <td className="px-4 py-2 border text-center">
                    {project.appointment_id}
                  </td>
                  <td className="px-4 py-2 border">{project.project_name}</td>
                  <td className="px-4 py-2 border">
                    {activeAllotmentId === project.id ? (
                      <div className="flex flex-col gap-2">
                        <select
                          className="border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-green-600"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddSupervisor(project.id, e.target.value);
                            }
                          }}
                          defaultValue=""
                          autoFocus
                        >
                          <option value="" disabled>
                            Select Supervisor
                          </option>
                          {supervisors
                            .filter(
                              (s) =>
                                !project.supervisors.some(
                                  (ps) => ps.supervisor_id === s.user_id
                                )
                            )
                            .map((s) => (
                              <option key={s.user_id} value={s.user_id}>
                                {s.user_id}
                              </option>
                            ))}
                        </select>
                        <button
                          className="text-gray-500 text-sm hover:text-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAllotmentId(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {project.supervisors.length > 0 ? (
                          project.supervisors.map((sup) => (
                            <div
                              key={sup.id}
                              className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                            >
                              <span>{sup.supervisor_id}</span>
                              <button
                                className="text-red-500 hover:text-red-700 ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSupervisor(project.id, sup.id);
                                }}
                                title="Remove supervisor"
                              >
                                <X size={14} />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAllotmentId(
                          activeAllotmentId === project.id ? null : project.id
                        );
                      }}
                    >
                      {activeAllotmentId === project.id ? "Close" : "Add"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              {isEditing ? "Edit Supervisor" : "Add New Supervisor"}
            </h2>

            <form
              onSubmit={submitSupervisor}
              encType="multipart/form-data"
              className="space-y-3"
            >
              <input
                name="name"
                placeholder="Name"
                className="w-full border p-2 rounded"
                onChange={handleInputChange}
                value={formData.name}
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
                  <p className="text-red-500 text-sm">{errors.email}</p>
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
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>
              <input
                name="whatsapp"
                placeholder="WhatsApp"
                className="w-full border p-2 rounded"
                onChange={handleInputChange}
                value={formData.whatsapp}
              />
              <input
                name="address"
                placeholder="Address"
                className="w-full border p-2 rounded"
                onChange={handleInputChange}
                value={formData.address}
              />
              <div className="flex items-center space-x-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
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
                    className="cursor-pointer bg-[#295A47] text-white px-4 py-2 rounded-md hover:bg-[#1e3d32] transition"
                  >
                    Upload Photo
                  </label>
                </div>
              </div>
              <input
                name="password"
                type="password"
                placeholder={isEditing ? "New Password (optional)" : "Password"}
                className="w-full border p-2 rounded"
                onChange={handleInputChange}
                value={formData.password}
              />

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md mt-3 hover:bg-green-700"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
              onClick={() => setShowDateModal(false)}
            >
              <X size={22} />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Set Project Dates
            </h2>
            <p className="mb-4">
              Project: {selectedProjectForDates?.project_name}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={() => {
                  setShowDateModal(false);
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={async () => {
                  if (!selectedProjectForDates) return;

                  try {
                    const res = await fetch(
                      "/api/superadmin/project-supervisor",
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          appointment_id:
                            selectedProjectForDates.appointment_id,
                          start_date: startDate,
                          end_date: endDate,
                        }),
                      }
                    );

                    if (res.ok) {
                      // 🔥 Re-fetch assignments immediately
                      const assignRes = await fetch(
                        "/api/superadmin/project-supervisor"
                      );
                      const assignData = await assignRes.json();

                      if (assignRes.ok && assignData.assignments) {
                        setProjectAllotments((prev) =>
                          prev.map((p) => ({
                            ...p,
                            supervisors:
                              assignData.assignments[p.appointment_id] || [],
                          }))
                        );
                      }

                      alert("Dates saved successfully!");
                      setShowDateModal(false);
                    } else {
                      const data = await res.json();
                      alert(data.error || "Failed to save dates");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to save dates");
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin_Supervisor;
