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

interface Project {
  project_id: string;
  project_name: string;
  location: string;
  start_date: string;
  status: "Active" | "Completed" | "Pending";
  progress: number;
  team_size: number;
  issues_count: number;
}

const MyProjectsPage = () => {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const handleStatusChange = (projectId: string, newStatus: "Active" | "Completed" | "Pending") => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.project_id === projectId 
          ? { ...project, status: newStatus }
          : project
      )
    );
    setEditingStatusId(null);
  };

  // Fake data for now
  useEffect(() => {
    const fakeProjects: Project[] = [
      {
        project_id: "PRJ001",
        project_name: "Park Street Interior",
        location: "Park Street, Kolkata",
        start_date: "2026-02-01",
        status: "Active",
        progress: 65,
        team_size: 12,
        issues_count: 2,
      },

      {
        project_id: "PRJ002",
        project_name: "Saltlake Office Design",
        location: "Saltlake, Kolkata",
        start_date: "2026-01-15",
        status: "Active",
        progress: 30,
        team_size: 8,
        issues_count: 0,
      },

      {
        project_id: "PRJ003",
        project_name: "Newtown Flat",
        location: "Newtown, Kolkata",
        start_date: "2025-12-10",
        status: "Completed",
        progress: 100,
        team_size: 5,
        issues_count: 0,
      },
    ];

    setProjects(fakeProjects);

    setLoading(false);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.project_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase());
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
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                  ${
                    project.status === "Active"
                      ? "bg-blue-100 text-blue-700"
                      : project.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {project.status}
                </span>
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
                  <span className="font-semibold text-[#295A47]">
                    {project.progress}%
                  </span>
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
                  <div className="font-semibold text-gray-800 text-sm">
                    {project.team_size} Members
                  </div>
                </div>
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
  const [activeTab, setActiveTab] = useState("overview");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Safety inspection for Block B", timestamp: "Yesterday" },
    { id: 2, text: "Plumbing check for Floor 3", timestamp: "Today" },
  ]);
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const [activities, setActivities] = useState([
      { id: 1, text: "Material delivery received", details: "Cement & Sand", timestamp: "2 hours ago" },
      { id: 2, text: "Electrical wiring started for Block A", details: "Team Elektra", timestamp: "5 hours ago" },
  ]);
  const [showNewActivityInput, setShowNewActivityInput] = useState(false);
  const [newActivityText, setNewActivityText] = useState("");

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    const newTask = {
        id: Date.now(),
        text: newTaskText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText("");
    setShowNewTaskInput(false);
  };

  const handleAddActivity = () => {
    if (newActivityText.trim() === "") return;
    const newActivity = { id: Date.now(), text: newActivityText, details: "By You", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) };
    setActivities(prev => [newActivity, ...prev]);
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
                    <p className="text-sm text-gray-500">Active on site today</p>
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
                      Expected completion: Dec 2026
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
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
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center justify-between" >
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
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
                            <p className="text-xs text-gray-400 mt-1">{task.timestamp}</p>
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
                  <h3 className="text-xl font-bold text-gray-800">
                    Labour Management
                  </h3>
                  <button className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]">
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
                          Check-in
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-4 text-sm font-medium text-gray-800">
                            Worker Name {i}
                          </td>
                          <td className="p-4 text-sm text-gray-600">Mason</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Present
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            08:30 AM
                          </td>
                        </tr>
                      ))}
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
                  <button className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]">
                    + Add Expense
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Total Budget</p>
                    <p className="text-lg font-bold text-gray-800">₹5,00,000</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Spent</p>
                    <p className="text-lg font-bold text-red-600">₹1,25,000</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹3,75,000
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Cement Bags (50kg)
                          </p>
                          <p className="text-xs text-gray-500">
                            Added by Supervisor • Today
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-800">₹4,500</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "issues" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Site Issues & Chat
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-[400px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        AD
                      </div>
                      <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%]">
                        <p className="text-sm text-gray-800">
                          Please check the wiring in the main hall.
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          10:00 AM
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-[#295A47] flex items-center justify-center text-white text-xs">
                        ME
                      </div>
                      <div className="bg-[#D7E7D0] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%]">
                        <p className="text-sm text-[#1e3d32]">
                          Sure, I will inspect it today.
                        </p>
                        <span className="text-xs text-[#1e3d32]/60 mt-1 block">
                          10:05 AM
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                    />
                    <button className="bg-[#295A47] text-white p-2 rounded-lg hover:bg-[#1f4637]">
                      <ArrowRightCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MyProjectsPage;
