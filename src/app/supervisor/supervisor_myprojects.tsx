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
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import AddWorkerModal from "@/components/supervisor-modal/AddWorkerModal";
import ExpenseModal from "@/components/supervisor-modal/ExpenseModal";
import LabourExpenseTab from "@/components/supervisor-modal/LabourExpenseTab";
import LabourExpenseModal from "@/components/supervisor-modal/LabourExpenseModal";
interface Project {
  project_id: string;
  project_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: "Active" | "Completed" | "Pending";
  progress: number;
  team_size: number;
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
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center flex-1 min-w-[90px] sm:min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Total
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#295A47]">
              {stats.total}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center flex-1 min-w-[90px] sm:min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Active
            </span>
            <span className="text-lg sm:text-xl font-bold text-blue-600">
              {stats.active}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center flex-1 min-w-[90px] sm:min-w-[100px]">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Done
            </span>
            <span className="text-lg sm:text-xl font-bold text-green-600">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={project.project_id}
              className="bg-white shadow-md rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Project Name + Status */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                {/* Left Section (Project Info) */}
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
                {/* Right Section (Status Dropdown) */}
                <div className="w-full sm:w-auto">
                  <select
                    value={project.status}
                    onChange={(e) =>
                      handleStatusChange(
                        project.project_id,
                        e.target.value as "Active" | "Completed" | "Pending"
                      )
                    }
                    className={`w-full sm:w-auto px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border-none outline-none cursor-pointer
      ${project.status === "Active"
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
              </div>
              {/* Location */}
              <div className="flex items-center text-gray-600 mb-4 text-sm">
                <MapPin size={16} className="mr-2 text-gray-400" />
                {project.location}
              </div>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={project.progress}
                      onChange={(e) => {
                        let value = parseInt(e.target.value);
                        if (isNaN(value)) value = 0;
                        if (value > 100) value = 100;
                        if (value < 0) value = 0;
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.project_id === project.project_id
                              ? { ...p, progress: value }
                              : p
                          )
                        );
                      }}
                      onBlur={(e) => {
                        let value = parseInt(e.target.value);
                        if (isNaN(value)) value = 0;
                        if (value > 100) value = 100;
                        if (value < 0) value = 0;
                        // ❗ Restriction (cannot decrease)
                        if (value < project.progress) {
                          value = project.progress;
                        }
                        handleProgressChange(project.project_id, value);
                      }}
                      className="font-semibold text-[#295A47] text-sm bg-transparent outline-none w-12 text-right"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#295A47] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(project.progress, 100)}%` }}
                  ></div>
                </div>
                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={project.progress}
                  // store starting value (no new variable needed)
                  onMouseDown={(e) => {
                    e.currentTarget.dataset.start = String(project.progress);
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.dataset.start = String(project.progress);
                  }}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setProjects((prev) =>
                      prev.map((p) =>
                        p.project_id === project.project_id
                          ? { ...p, progress: value }
                          : p
                      )
                    );
                  }}
                  onMouseUp={(e) => {
                    let value = parseInt(e.currentTarget.value);
                    const start = parseInt(
                      e.currentTarget.dataset.start || "0"
                    );
                    // ❗ Restriction (cannot decrease)
                    if (value < start) value = start;
                    // snap back UI if needed
                    setProjects((prev) =>
                      prev.map((p) =>
                        p.project_id === project.project_id
                          ? { ...p, progress: value }
                          : p
                      )
                    );
                    handleProgressChange(project.project_id, value);
                  }}
                  onTouchEnd={(e) => {
                    let value = parseInt(e.currentTarget.value);
                    const start = parseInt(
                      e.currentTarget.dataset.start || "0"
                    );
                    if (value < start) value = start;
                    setProjects((prev) =>
                      prev.map((p) =>
                        p.project_id === project.project_id
                          ? { ...p, progress: value }
                          : p
                      )
                    );
                    handleProgressChange(project.project_id, value);
                  }}
                  className="w-full cursor-pointer accent-[#295A47]"
                />
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                {/* <button className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#295A47] transition-colors font-medium">
                  View Details
                </button> */}
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [paidBy, setPaidBy] = useState<"myself" | "sir">("myself");
  const [activities, setActivities] = useState<any[]>([]);
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
  const [orderId, setOrderId] = useState("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [labourOptions, setLabourOptions] = useState<any[]>([]);
  const [selectedLabourId, setSelectedLabourId] = useState<string>("");
  const fetchOrder = async () => {
    if (!orderId) {
      alert("Enter Order ID");
      return;
    }
    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=order_details&o_id=${orderId}`
      );
      const data = await res.json();
      if (!data || !data.materials || data.materials.length === 0) {
        alert("Order not found or has no items.");
        setMaterials([]);
        setExpensePerAmount("");
        return;
      }
      setMaterials(data.materials || []); // ✅ important
      setExpensePerAmount(data.total_amount || "0");
      if (orderId) {
        setExpenseTitle(`Website Order: ${orderId}`);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
      alert("An error occurred while fetching the order details.");
    }
  };
  const fetchLabourOptions = async () => {
    if (!project?.project_id) return;
    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=labour_summary&appointment_id=${project.project_id}`
      );
      if (res.ok) {
        const data = await res.json();
        console.log("LABOUR OPTIONS:", data);
        setLabourOptions(
          Array.isArray(data) ? data : data.labours || data.data || []
        );
      }
    } catch (err) {
      console.error("Failed to fetch labour options:", err);
      setLabourOptions([]);
    }
  };
  type ExpenseType = "unit" | "sqft" | "labour" | "website";
  const [expenseType, setExpenseType] = useState<ExpenseType>("unit");
  // Fetch labour options when switching to labour type
  useEffect(() => {
    if (expenseType === "labour") {
      fetchLabourOptions();
    } else {
      setLabourOptions([]);
      setSelectedLabourId("");
    }
  }, [expenseType, project?.project_id]);
  const [labourExpenses, setLabourExpenses] = useState([]);
  const [showLabourExpenseModal, setShowLabourExpenseModal] = useState(false);
  const [editLabourExpense, setEditLabourExpense] = useState<any>(null);
  const fetchTasks = async () => {
    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=tasks&appointment_id=${project.project_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };
  const fetchActivities = async () => {
    try {
      const res = await fetch(
        `/api/supervisor/myprojects?type=activities&appointment_id=${project.project_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    }
  };
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
    if (activeTab === "overview" && project?.project_id) {
      fetchActivities();
      fetchTasks();
    }
  }, [activeTab, project?.project_id]);
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
  const [newActivityDetails, setNewActivityDetails] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [labourFilter, setLabourFilter] = useState("All");
  // 🔹 EXPENSE STATES
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [cashInHand, setCashInHand] = useState<number>(0);
  const [cashSpent, setCashSpent] = useState<number>(0);
  const [cashDue, setCashDue] = useState<number>(0);
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
        setBudget(Number(data.budget) || 0);
        // 🔹 NEW VALUES FROM BACKEND
        setCashInHand(Number(data.cash_in_hand) || 0);
        setCashSpent(Number(data.paid) || 0);
        setCashDue(Number(data.due) || 0);
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
  const handleAddWorker = async (
    name: string,
    role: string,
    phone: string,
    imageFile?: File
  ) => {
    if (!name || !role || !session?.user?.id) return;
    try {
      const formData = new FormData();
      formData.append("type", "labour");
      formData.append("appointment_id", project.project_id);
      formData.append("role", role);
      formData.append("labour_name", name);
      formData.append("phone", phone || "");
      if (imageFile) {
        formData.append("identity_image", imageFile);
      }
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Refresh workers list
        const refreshRes = await fetch(
          `/api/supervisor/myprojects?type=labour&appointment_id=${project.project_id}`
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setWorkers(data);
        }
      }
    } catch (error) {
      console.error("Failed to add worker", error);
    }
  };
  const handleAddExpense = async () => {
    if (!expenseTitle) {
      alert("Please enter title");
      return;
    }
    if (expenseType === "labour" && !selectedLabourId) {
      alert("Please select labour");
      return;
    }
    let quantity = 1;
    let per_amount = Number(expensePerAmount);
    if (expenseType === "unit" || expenseType === "sqft") {
      if (!expenseQuantity || !expensePerAmount) {
        alert("Please fill all fields");
        return;
      }
      quantity = Number(expenseQuantity);
      per_amount = Number(expensePerAmount);
    }
    if (expenseType === "labour" || expenseType === "website") {
      if (!expensePerAmount) {
        alert("Please enter amount");
        return;
      }
      quantity = 1;
      per_amount = Number(expensePerAmount);
    }
    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "add_expense",
          appointment_id: project.project_id,
          title: expenseTitle,
          quantity,
          per_amount,
          labour_id: expenseType === "labour" ? selectedLabourId : null,
          expense_type: expenseType,
          paid_by: paidBy,
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
  const handleDeleteExpense = async (exp: any) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!confirmDelete) return;
    try {
      const response = await fetch(
        `/api/supervisor/delete-supervisor-expense?id=${exp.id}&appointment_id=${exp.appointment_id}&labour_id=${exp.labour_id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Expense deleted successfully");
        setExpenses((prev: any) =>
          prev.filter((item: any) => item.id !== exp.id)
        );
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };
  const handleAddTask = async () => {
    if (newTaskText.trim() === "") return;
    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "task",
          appointment_id: project.project_id,
          text: newTaskText,
        }),
      });
      if (res.ok) {
        setNewTaskText("");
        setShowNewTaskInput(false);
        fetchTasks(); // reload tasks
      }
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };
  const handleAddActivity = async () => {
    if (newActivityText.trim() === "") return;
    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "activity",
          appointment_id: project.project_id,
          text: newActivityText,
          details: newActivityDetails,
        }),
      });
      if (res.ok) {
        setNewActivityText("");
        setNewActivityDetails("");
        setShowNewActivityInput(false);
        fetchActivities(); // reload activities
      }
    } catch (err) {
      console.error("Failed to add activity", err);
    }
  };
  const handleCompleteTask = async (taskId: number) => {
    try {
      const res = await fetch("/api/supervisor/myprojects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "complete_task",
          id: taskId,
        }),
      });
      if (res.ok) {
        fetchTasks();
        fetchActivities(); // optional: log completion
      }
    } catch (error) {
      console.error("Failed to complete task", error);
    }
  };
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "labour", label: "Labour", icon: Users },
    { id: "expenses", label: "Expenses", icon: Wallet },
    { id: "issues", label: "Issues", icon: MessageSquare },
    { id: "labour_expense", label: "Labour Expense", icon: Wallet },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-[#295A47] text-white shrink-0">
          <div className="p-4 md:p-6 flex justify-between items-center">
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
          <div className="px-4 md:px-6 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/10">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${activeTab === tab.id
                      ? "bg-white/10"
                      : "text-green-100 hover:bg-white/5"
                    }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-64">
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Project Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div
                    onClick={() => setActiveTab("labour")}
                    className="bg-blue-50 p-6 rounded-xl border border-blue-100 cursor-pointer hover:shadow-md transition"
                  >
                    {" "}
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
                  <div
                    onClick={() => setActiveTab("issues")}
                    className="bg-orange-50 p-6 rounded-xl border border-orange-100 cursor-pointer hover:shadow-md transition"
                  >
                    {" "}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <AlertCircle size={24} />
                      </div>
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
                        {project.remaining_days}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Timeline</h4>
                    <p className="text-sm text-gray-500">
                      Expected completion:
                      <span className="font-bold text-red-500">
                        {" "}
                        {project.end_date}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-green-500" />
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
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={newActivityText}
                            onChange={(e) => setNewActivityText(e.target.value)}
                            placeholder="Activity title..."
                            className="border-b-2 focus:border-[#295A47] outline-none text-sm"
                            autoFocus
                          />
                          <textarea
                            value={newActivityDetails}
                            onChange={(e) =>
                              setNewActivityDetails(e.target.value)
                            }
                            placeholder="Activity details (optional)..."
                            className="border-b-2 focus:border-[#295A47] outline-none text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddActivity}
                              className="text-sm bg-[#295A47] text-white px-3 py-1 rounded-md hover:bg-[#1f4637]"
                            >
                              Save
                            </button>
                          </div>
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
                            <p className="text-xs font-bold italic text-red-600">
                              {new Date(activity.created_at).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}{" "}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-red-500" />
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
                          className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{task.text}</p>
                            <p className="text-xs font-bold italic text-red-600 mt-1">
                              {new Date(task.created_at).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                          >
                            Done
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "labour" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Labour Management
                    </h3>
                    <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg">
                      {["All", "Present", "Absent"].map((filter: string) => (
                        <button
                          key={filter}
                          onClick={() => setLabourFilter(filter)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${labourFilter === filter
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
                <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
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
                          Phone
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Identity
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="p-4 text-sm font-semibold text-gray-600">
                          Attendance
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
                            <td className="p-4 text-sm text-gray-600">
                              {worker.phone || ""}
                            </td>
                            <td className="p-4">
                              {worker.identity_image ? (
                                <img
                                  src={worker.identity_image}
                                  alt="ID"
                                  className="w-12 h-16 object-cover rounded-lg border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() =>
                                    setPreviewImage(worker.identity_image)
                                  }
                                />
                              ) : (
                                <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-gray-400">
                                    No ID
                                  </span>
                                </div>
                              )}
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
                                    Mark Absent
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleToggleStatus(worker.id, 1)
                                  }
                                  className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                  Mark Present
                                </button>
                              )}
                            </td>
                            <td className="p-4 text-sm text-gray-600">{worker.total_present} days</td>
                            <td className="p-4 text-sm text-gray-600">
                              {worker.updated_at
                                ? new Date(
                                  worker.updated_at
                                ).toLocaleTimeString([], {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Project Expenses
                  </h3>
                  <button
                    onClick={() => {
                      setExpenseTitle("");
                      setExpenseQuantity("");
                      setExpensePerAmount("");
                      setSelectedLabourId("");
                      setExpenseType("unit");
                      setShowExpenseModal(true);
                    }}
                    className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]"
                  >
                    + Add Expense
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Cash In Hand</p>
                    <p className="text-lg font-bold text-gray-800">
                      ₹{cashInHand?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Spent</p>
                    <p className="text-lg font-bold text-red-600">
                      ₹{cashSpent?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Due</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{cashDue?.toLocaleString()}
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm gap-3"
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
                              <span className="font-semibold text-red-500">
                                {new Date(exp.created_at).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>{" "}
                              • Added By{" "}
                              <span className="font-semibold text-red-500">
                                {exp.added_by}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">
                            ₹{Number(exp.total_amount).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
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
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-[50vh] md:h-[400px] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {chatMessages.map((msg: any) => {
                      const isMe = msg.sender_id === session?.user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""
                            }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${isMe ? "bg-[#295A47]" : "bg-blue-500"
                              }`}
                          >
                            {isMe ? "ME" : msg.sender_id}
                          </div>
                          <div
                            className={`p-3 rounded-lg shadow-sm max-w-[90%] sm:max-w-[80%] ${isMe
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
                              {(() => {
                                const date = new Date(msg.created_at.replace(" ", "T"));
                                return date.toLocaleString("en-IN", {
                                  timeZone: "UTC",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              })()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedImage && (
                    <div className="mb-3 flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="preview"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                      <span className="text-sm text-gray-600 flex-1 truncate">
                        {selectedImage.name}
                      </span>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
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
            {activeTab === "labour_expense" && (
              <LabourExpenseTab
                appointmentId={project.project_id}
                onAddClick={(editData) => {
                  setEditLabourExpense(editData || null);
                  setShowLabourExpenseModal(true);
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
      {/* Add Worker Modal */}
      <AddWorkerModal
        show={showAddWorkerModal}
        onClose={() => setShowAddWorkerModal(false)}
        onAdd={(newWorkerName, newWorkerRole, newWorkerPhone, imageFile) =>
          handleAddWorker(
            newWorkerName,
            newWorkerRole,
            newWorkerPhone,
            imageFile
          )
        }
      />
      <ExpenseModal
        show={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenseType={expenseType}
        setExpenseType={setExpenseType}
        expenseTitle={expenseTitle}
        setExpenseTitle={setExpenseTitle}
        expenseQuantity={expenseQuantity}
        setExpenseQuantity={setExpenseQuantity}
        expensePerAmount={expensePerAmount}
        setExpensePerAmount={setExpensePerAmount}
        onSave={handleAddExpense}
        orderId={orderId}
        setOrderId={setOrderId}
        fetchOrder={fetchOrder}
        materials={materials}
        paidBy={paidBy}
        setPaidBy={setPaidBy}
        labourList={labourOptions}
        selectedLabour={selectedLabourId}
        setSelectedLabour={setSelectedLabourId}
      />
      {showLabourExpenseModal && (
        <LabourExpenseModal
          appointmentId={project.project_id}
          editData={editLabourExpense}
          refreshData={() => {
            const event = new Event("refreshLabourExpenses");
            window.dispatchEvent(event);
          }}
          onClose={() => setShowLabourExpenseModal(false)}
        />
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
