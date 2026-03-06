"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapPin,
  Calendar,
  Building2,
  ArrowRightCircle,
  Search,
  Filter,
  X,
  LayoutDashboard,
  Users,
  Wallet,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Activity,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface Project {
  project_id: string;
  project_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: "Active" | "Completed" | "Pending";
  progress: number;
  team_size: number;
  issues_count: number;
  remaining_days: string;
}

const MyProjectsPage = () => {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const handleStatusChange = async (
    projectId: string,
    newStatus: "Active" | "Completed" | "Pending"
  ) => {
    try {
      const response = await fetch("/api/supervisor/myprojects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointment_id: projectId, status: newStatus }),
      });

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? { ...project, status: newStatus }
              : project
          )
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleTeamSizeChange = async (
    projectId: string,
    newTeamSize: number
  ) => {
    try {
      const response = await fetch("/api/supervisor/myprojects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: projectId,
          today_labour: newTeamSize,
        }),
      });

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? { ...project, team_size: newTeamSize }
              : project
          )
        );
      } else {
        console.error("Failed to update team size");
      }
    } catch (error) {
      console.error("Error updating team size:", error);
    }
  };

  const handleProgressChange = async (
    projectId: string,
    newProgress: number
  ) => {
    try {
      const response = await fetch("/api/supervisor/myprojects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: projectId,
          progress: newProgress,
        }),
      });

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? { ...project, progress: newProgress }
              : project
          )
        );
      } else {
        console.error("Failed to update progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };
  const calculateRemainingDays = (end: string) => {
    if (!end || end === "N/A") return "N/A";

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = formatter.format(now);

    if (end === todayStr) {
      return "Should be completed by today";
    }

    const endDate = new Date(end);
    const todayDate = new Date(todayStr);

    const diffTime = endDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Delayed Handover. End Date was ${end}`;
    }

    return `Ends in ${diffDays} days`;
  };
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/supervisor/myprojects");
        if (response.ok) {
          const data = await response.json();
          const mappedProjects: Project[] = data.map((item: any) => {
            const startDate = item.start_date
              ? new Date(item.start_date).toLocaleDateString("en-CA", {
                  timeZone: "Asia/Kolkata",
                })
              : "N/A";

            const endDate = item.end_date
              ? new Date(item.end_date).toLocaleDateString("en-CA", {
                  timeZone: "Asia/Kolkata",
                })
              : "N/A";

            return {
              project_id: item.appointment_id,
              project_name: item.project_name || "",
              location: item.location || "",
              start_date: startDate,
              end_date: endDate,
              status: item.status || "Pending",
              progress: parseInt(item.progress) || 0,
              team_size: item.today_labour || 0,
              issues_count: 0,
              remaining_days: calculateRemainingDays(endDate),
            };
          });
          setProjects(mappedProjects);
        } else {
          console.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        (project.project_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (project.location || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === "Active").length,
      completed: projects.filter((p) => p.status === "Completed").length,
    };
  }, [projects]);

  const handleEnterSite = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#295A47]">My Projects</h1>
          <p className="text-gray-500 mt-1">
            Manage and oversee your ongoing construction sites.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Total
            </span>
            <span className="text-xl font-bold text-[#295A47]">
              {stats.total}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Active
            </span>
            <span className="text-xl font-bold text-blue-600">
              {stats.active}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Done
            </span>
            <span className="text-xl font-bold text-green-600">
              {stats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects by name or location..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-gray-500 w-5 h-5" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47] bg-white w-full md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47]"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={project.project_id}
              className="bg-white shadow-md rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Project Name */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Building2 className="text-[#295A47] w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 line-clamp-1">
                      {project.project_name}
                    </h2>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {project.project_id}
                    </span>
                  </div>
                </div>
                <select
                  value={project.status}
                  onChange={(e) =>
                    handleStatusChange(
                      project.project_id,
                      e.target.value as "Active" | "Completed" | "Pending"
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border-none outline-none cursor-pointer
                  ${
                    project.status === "Active"
                      ? "bg-blue-100 text-blue-700"
                      : project.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-4 text-sm">
                <MapPin size={16} className="mr-2 text-gray-400" />
                {project.location}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <input
                    type="number"
                    min={project.progress}
                    value={project.progress}
                    onChange={(e) => {
                      const newProgress = parseInt(e.target.value) || 0;
                      if (newProgress >= project.progress) {
                        setProjects((prevProjects) =>
                          prevProjects.map((p) =>
                            p.project_id === project.project_id
                              ? { ...p, progress: newProgress }
                              : p
                          )
                        );
                      }
                    }}
                    onBlur={(e) => {
                      const newProgress = parseInt(e.target.value) || 0;
                      if (newProgress >= project.progress) {
                        handleProgressChange(project.project_id, newProgress);
                      } else {
                        // Reset to original if invalid
                        setProjects((prevProjects) =>
                          prevProjects.map((p) =>
                            p.project_id === project.project_id
                              ? { ...p, progress: project.progress }
                              : p
                          )
                        );
                      }
                    }}
                    className="font-semibold text-[#295A47] text-sm bg-transparent outline-none w-12"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#295A47] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <Calendar size={14} />
                    Start Date
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {project.start_date}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <Users size={14} />
                    Team Size
                  </div>
                  <input
                    type="number"
                    value={project.team_size}
                    onChange={(e) =>
                      setProjects((prevProjects) =>
                        prevProjects.map((p) =>
                          p.project_id === project.project_id
                            ? { ...p, team_size: parseInt(e.target.value) || 0 }
                            : p
                        )
                      )
                    }
                    onBlur={(e) =>
                      handleTeamSizeChange(
                        project.project_id,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full font-semibold text-gray-800 text-sm bg-transparent outline-none"
                  />
                </div>
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {project.remaining_days}
                </p>
              </div>

              {/* Buttons */}
              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => handleEnterSite(project)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#295A47] text-white px-4 py-2.5 rounded-lg hover:bg-[#1f4637] transition-colors font-medium shadow-sm hover:shadow"
                >
                  Enter Site
                  <ArrowRightCircle size={18} />
                </button>
                <button className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#295A47] transition-colors font-medium">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Project Dashboard Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectModal = ({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Safety inspection for Block B", timestamp: "Yesterday" },
    { id: 2, text: "Plumbing check for Floor 3", timestamp: "Today" },
  ]);
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const [activities, setActivities] = useState([
    {
      id: 1,
      text: "Material delivery received",
      details: "Cement & Sand",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      text: "Electrical wiring started for Block A",
      details: "Team Elektra",
      timestamp: "5 hours ago",
    },
  ]);
  // 🔹 CHAT STATES
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // 🔹 EXPENSE MODAL STATES
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseQuantity, setExpenseQuantity] = useState("");
  const [expensePerAmount, setExpensePerAmount] = useState("");
  const [expenseType, setExpenseType] = useState<"unit" | "sqft">("unit");
  // 🔹 Live Total Calculation
  const calculatedTotal =
    Number(expenseQuantity || 0) * Number(expensePerAmount || 0);
  // 🔹 FETCH CHAT
  const fetchChat = async () => {
    if (!project?.project_id) return;

    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=chat&appointment_id=${project.project_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat", err);
    }
  };

  // 🔹 AUTO FETCH WHEN TAB OPENS
  useEffect(() => {
    if (activeTab === "issues") {
      fetchChat();
      const interval = setInterval(fetchChat, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, project.project_id]);

  // 🔹 SEND MESSAGE
  const sendChat = async () => {
    if (!chatInput && !selectedImage) return;

    const formData = new FormData();
    formData.append("type", "chat");
    formData.append("appointment_id", project.project_id);
    formData.append("message", chatInput);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      await fetch("/api/supervisor/myprojects", {
        method: "POST",
        body: formData,
      });

      setChatInput("");
      setSelectedImage(null);
      fetchChat();
    } catch (err) {
      console.error("Failed to send chat", err);
    }
  };
  const [showNewActivityInput, setShowNewActivityInput] = useState(false);
  const [newActivityText, setNewActivityText] = useState("");

  const [workers, setWorkers] = useState<any[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerRole, setNewWorkerRole] = useState("");
  const [labourFilter, setLabourFilter] = useState("All");
  // 🔹 EXPENSE STATES
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);

  const labourStats = useMemo(() => {
    const total = workers.length;
    const present = workers.filter((w) => w.present_tinytint === 1).length;
    const absent = total - present;
    return { total, present, absent };
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    if (labourFilter === "Present")
      return workers.filter((w) => w.present_tinytint === 1);
    if (labourFilter === "Absent")
      return workers.filter((w) => w.present_tinytint === 0);
    return workers;
  }, [workers, labourFilter]);

  useEffect(() => {
    if (activeTab === "labour" && project.project_id) {
      const fetchWorkers = async () => {
        try {
          const res = await fetch(
            `/api/supervisor/myprojects?type=labour&appointment_id=${project.project_id}`
          );
          if (res.ok) {
            const data = await res.json();
            setWorkers(data);
          }
        } catch (error) {
          console.error("Failed to fetch workers", error);
        }
      };
      fetchWorkers();
    }
  }, [activeTab, project.project_id]);
  // 🔹 FETCH EXPENSES
  const fetchExpenses = async () => {
    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=expenses&appointment_id=${project.project_id}`
      );

      if (res.ok) {
        const data = await res.json();

        console.log("EXPENSE DATA:", data); // debug once

        setExpenses(Array.isArray(data) ? data : data.expenses || []);
      }
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    }
  };

  useEffect(() => {
    if (activeTab === "expenses" && project.project_id) {
      fetchExpenses();
    }
  }, [activeTab, project.project_id]);
  const totalSpent = expenses.reduce(
    (sum, exp) => sum + Number(exp.total_amount),
    0
  );

  const remaining = budget - totalSpent;

  const handleAddWorker = async () => {
    if (!newWorkerName || !newWorkerRole || !session?.user?.id) return;
    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "labour",
          supervisor_id: session.user.id,
          appointment_id: project.project_id,
          role: newWorkerRole,
          labour_name: newWorkerName,
          present_tinytint: 1,
        }),
      });

      if (res.ok) {
        const newWorker = await res.json();
        setWorkers([newWorker, ...workers]);
        setNewWorkerName("");
        setNewWorkerRole("");
        setShowAddWorkerModal(false);
      }
    } catch (error) {
      console.error("Failed to add worker", error);
    }
  };
  const handleAddExpense = async () => {
    if (!expenseTitle || !expenseQuantity || !expensePerAmount) {
      alert("Please fill all fields");
      return;
    }

    const quantity =
      expenseType === "unit"
        ? Number(expenseQuantity)
        : Number(expenseQuantity); // per sqft price

    const per_amount =
      expenseType === "unit"
        ? Number(expensePerAmount)
        : Number(expensePerAmount); // total sqft

    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "add_expense",
          appointment_id: project.project_id,
          title:
            expenseType === "sqft" ? `${expenseTitle} (Sqft)` : expenseTitle,
          quantity,
          per_amount,
        }),
      });

      if (res.ok) {
        await fetchExpenses();
        setShowExpenseModal(false);

        setExpenseTitle("");
        setExpenseQuantity("");
        setExpensePerAmount("");
      }
    } catch (error) {
      console.error("Failed to add expense", error);
    }
  };
  const handleToggleStatus = async (workerId: number, newStatus: number) => {
    const updatedAt = new Date()
      .toLocaleString("sv-SE", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace("T", " ");

    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "labour_status",
          id: workerId,
          present_tinytint: newStatus,
          updated_at: updatedAt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkers((prev) =>
          prev.map((w) =>
            w.id === workerId
              ? {
                  ...w,
                  present_tinytint: newStatus,
                  updated_at:
                    data.worker?.updated_at || new Date().toISOString(),
                }
              : w
          )
        );
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    const newTask = {
      id: Date.now(),
      text: newTaskText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText("");
    setShowNewTaskInput(false);
  };

  const handleAddActivity = () => {
    if (newActivityText.trim() === "") return;
    const newActivity = {
      id: Date.now(),
      text: newActivityText,
      details: "By You",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setActivities((prev) => [newActivity, ...prev]);
    setNewActivityText("");
    setShowNewActivityInput(false);
  };

  const handleCompleteTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setActivities((prev) => [
        {
          id: Date.now(),
          text: `Completed: ${task.text}`,
          details: "Task marked as done",
          timestamp: "Just now",
        },
        ...prev,
      ]);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "labour", label: "Labour", icon: Users },
    { id: "expenses", label: "Expenses", icon: Wallet },
    { id: "issues", label: "Issues", icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-[#295A47] text-white shrink-0">
          <div className="p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                <Building2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project.project_name}</h2>
                <div className="flex items-center gap-4 text-green-100 text-sm mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {project.location}
                  </span>
                  <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                    <Clock size={14} /> {project.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-6 pb-4 flex justify-between items-center gap-8 border-t border-white/10">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                    activeTab === tab.id
                      ? "bg-white/10"
                      : "text-green-100 hover:bg-white/5"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="w-64">
              <div className="flex justify-between text-xs text-green-100 mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Project Overview
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Users size={24} />
                      </div>
                      <span className="text-blue-600 font-bold text-xl">
                        {project.team_size}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">
                      Total Workforce
                    </h4>
                    <p className="text-sm text-gray-500">
                      Active on site today
                    </p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <AlertCircle size={24} />
                      </div>
                      <span className="text-orange-600 font-bold text-xl">
                        {project.issues_count}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Open Issues</h4>
                    <p className="text-sm text-gray-500">Requires attention</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-purple-600 font-bold text-xl">
                        On Track
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Timeline</h4>
                    <p className="text-sm text-gray-500">
                      Expected completion: {project.end_date}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-[#295A47]" />
                        Recent Activity
                      </div>
                      <button
                        onClick={() => setShowNewActivityInput(true)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <PlusCircle size={18} className="text-gray-500" />
                      </button>
                    </h4>
                    <div className="space-y-4">
                      {showNewActivityInput && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newActivityText}
                            onChange={(e) => setNewActivityText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddActivity()
                            }
                            placeholder="Add new activity..."
                            className="flex-1 border-b-2 focus:border-[#295A47] outline-none text-sm"
                            autoFocus
                          />
                          <button
                            onClick={handleAddActivity}
                            className="text-sm bg-[#295A47] text-white px-3 py-1 rounded-md hover:bg-[#1f4637]"
                          >
                            Save
                          </button>
                        </div>
                      )}
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-[#295A47]"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {activity.text}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.timestamp} • {activity.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[#295A47]" />
                        Pending Tasks
                      </div>
                      <button
                        onClick={() => setShowNewTaskInput(true)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <PlusCircle size={18} className="text-gray-500" />
                      </button>
                    </h4>
                    <div className="space-y-3">
                      {showNewTaskInput && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddTask()
                            }
                            placeholder="Add new task..."
                            className="flex-1 border-b-2 focus:border-[#295A47] outline-none text-sm"
                            autoFocus
                          />
                          <button
                            onClick={handleAddTask}
                            className="text-sm bg-[#295A47] text-white px-3 py-1 rounded-md hover:bg-[#1f4637]"
                          >
                            Save
                          </button>
                        </div>
                      )}
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-2 border-gray-300 cursor-pointer text-[#295A47] focus:ring-[#295A47]"
                            onChange={() => handleCompleteTask(task.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{task.text}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {task.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "labour" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Labour Management
                    </h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {["All", "Present", "Absent"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setLabourFilter(filter)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            labourFilter === filter
                              ? "bg-white text-[#295A47] shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {filter}{" "}
                          <span className="ml-1 opacity-70">
                            {filter === "All"
                              ? labourStats.total
                              : filter === "Present"
                              ? labourStats.present
                              : labourStats.absent}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddWorkerModal(true)}
                    className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]"
                  >
                    + Add Worker
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Name
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Role
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Updated At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-gray-500"
                          >
                            No workers found.
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map((worker) => (
                          <tr key={worker.id} className="hover:bg-gray-50">
                            <td className="p-4 text-sm font-medium text-gray-800">
                              {worker.labour_name}
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {worker.role}
                            </td>
                            <td className="p-4">
                              {worker.present_tinytint === 1 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-700 font-medium text-sm">
                                    Is Present
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleToggleStatus(worker.id, 0)
                                    }
                                    className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                                  >
                                    Absent
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleToggleStatus(worker.id, 1)
                                  }
                                  className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                  Present
                                </button>
                              )}
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {worker.updated_at
                                ? new Date(
                                    worker.updated_at
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "expenses" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Project Expenses
                  </h3>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]"
                  >
                    + Add Expense
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Total Budget</p>
                    <p className="text-lg font-bold text-gray-800">
                      ₹{budget.toLocaleString()}
                    </p>{" "}
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Spent</p>
                    <p className="text-lg font-bold text-red-600">
                      ₹{totalSpent.toLocaleString()}
                    </p>{" "}
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {expenses.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No expenses added yet.
                    </p>
                  ) : (
                    expenses.map((exp: any) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {exp.title} ({exp.quantity} × ₹{exp.per_amount})
                            </p>
                            <p className="text-xs text-gray-500">
                              Added on{" "}
                              {new Date(exp.created_at).toLocaleDateString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800">
                          ₹{Number(exp.total_amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "issues" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Site Issues & Chat
                </h3>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-[400px] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {chatMessages.map((msg: any) => {
                      const isMe = msg.sender_id === session?.user?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            isMe ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              isMe ? "bg-[#295A47]" : "bg-blue-500"
                            }`}
                          >
                            {isMe ? "ME" : "AD"}
                          </div>

                          <div
                            className={`p-3 rounded-lg shadow-sm max-w-[80%] ${
                              isMe
                                ? "bg-[#D7E7D0] rounded-tr-none"
                                : "bg-white rounded-tl-none"
                            }`}
                          >
                            {msg.message && (
                              <p className="text-sm text-gray-800">
                                {msg.message}
                              </p>
                            )}

                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="chat-img"
                                className="mt-2 rounded-lg max-h-40 cursor-pointer hover:opacity-80 transition"
                                onClick={() => setPreviewImage(msg.image_url)}
                              />
                            )}

                            <span className="text-xs text-gray-400 mt-1 block">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Section */}
                  <div className="mt-4 flex gap-2 items-center">
                    <input
                      type="file"
                      id="chatImage"
                      hidden
                      onChange={(e) =>
                        setSelectedImage(e.target.files?.[0] || null)
                      }
                    />

                    <label
                      htmlFor="chatImage"
                      className="cursor-pointer text-gray-500 hover:text-[#295A47]"
                    >
                      📎
                    </label>

                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                    />

                    <button
                      onClick={sendChat}
                      className="bg-[#295A47] text-white p-2 rounded-lg hover:bg-[#1f4637]"
                    >
                      <ArrowRightCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Add New Worker
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worker Name
                </label>
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  placeholder="Enter role (e.g. Mason, Helper)"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWorker}
                  className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4637]"
                >
                  Add Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Add Material Expense
            </h3>
            {/* Expense Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExpenseType("unit")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  expenseType === "unit"
                    ? "bg-[#295A47] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Unit Wise
              </button>

              <button
                onClick={() => setExpenseType("sqft")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  expenseType === "sqft"
                    ? "bg-[#295A47] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Sqft Wise
              </button>
            </div>
            <div className="space-y-4">
              {/* 🔹 Expense Type Toggle */}
              

              {/* 🔹 Title */}
              <input
                type="text"
                placeholder="Material Title"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              />

              {/* 🔹 Conditional Fields */}
              {expenseType === "unit" ? (
                <>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  />

                  <input
                    type="number"
                    placeholder="Per Unit Amount"
                    value={expensePerAmount}
                    onChange={(e) => setExpensePerAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  />
                </>
              ) : (
                <>
                  <input
                    type="number"
                    placeholder="Per Sqft Price"
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  />

                  <input
                    type="number"
                    placeholder="Total Sqft"
                    value={expensePerAmount}
                    onChange={(e) => setExpensePerAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  />
                </>
              )}
              {/* 🔹 Live Total */}
              <div className="bg-gray-50 border rounded-lg p-3 text-center mt-2">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-[#295A47]">
                  ₹{" "}
                  {(
                    Number(expenseQuantity || 0) * Number(expensePerAmount || 0)
                  ).toLocaleString("en-IN")}
                </p>
              </div>
              {/* 🔹 Footer Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4637]"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white p-4 rounded-xl max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg"
            >
              ✕
            </button>

            {/* Full Image */}
            <img
              src={previewImage}
              alt="preview"
              className="max-h-[70vh] w-auto mx-auto rounded-lg"
            />

            {/* Download Button */}
            <div className="text-center mt-4">
              <a
                href={previewImage}
                download
                className="bg-[#295A47] text-white px-4 py-2 rounded-lg inline-block hover:bg-[#1f4637]"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
