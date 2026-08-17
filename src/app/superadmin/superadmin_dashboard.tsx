"use client";
import React, { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  ClipboardList,
  Building2,
  User,
  Settings,
  X,
  Store,
  CreditCard,
  Plus,
  MessageSquare,
  FileText,
  Link2,
  Pencil,
  Download,Loader2,
} from "lucide-react";
import ClientComplaintsTab from "@/components/ClientComplaintsTab";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdminTab from "./superadmin_admin";
import AgentTab from "./superadmin_agent";
import LeadTab from "./superadmin_lead";
import PaymentTab from "./superadmin_payment";
import InvoiceTab from "./superadmin_invoice";
import SuperAdminShowroom from "./superadmin_showroom";
import ClientDesignTransactions from "./superadmin_client_design_transactions";
import ProductsTab from "./superadmin_products";
import OrdersTab from "./superadmin_showorder";
import QuotationPdfsTab from "./superadmin_quotation_pdfs";
import SuperAdminDesignerAssignments from "./superadmin_designer_assignments";
import SuperAdmin_Supervisor from "./superadmin_supervisor";
import SupervisorAttendance from "./superadmin_supervisor_attendance";
import PaymentDatesModal from "./PaymentDatesModal";
import SuperAdminMyProjects from "./superadmin_myprojects";
import EmployeeManagementPage from "./superadmin_employee";
import VendorManagementPage from "./superadmin_vendor";
import { downloadPaymentReceipt } from "@/components/InteriorPaymentReceipt";
import WorkProgress from "./Workprogress";
import MetroSales from "./metro_sales";
interface Client {
  user_id: string;
  name: string;
  email: string;
}
interface Project {
  id: number;
  project_name: string;
  client_id?: string;
  client_name?: string;
  paid: number;
  outstanding_including_gst: number;
  delivery_days_total?: number | null;
  delivery_due_date?: string | null;
  base_total?: number;
  gst_total?: number;
  gross_total?: number;
}
interface LedgerEntry {
  id: number;
  type: "charge" | "payment" | "adjustment" | "work" | "extra_work";
  amount: number;
  base_amount?: number;
  description: string;
  payment_method?: string;
  transaction_proof_path?: string;
  status: string;
  adjustment_type?: string;
  category?: string;
  gst_rate?: number;
  gst_amount?: number;
  total_amount?: number;
  gst_included?: number | boolean;
  created_at: string;
  entry_id?: number;
}
const SuperAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalLeads: 0,
    totalRevenue: 0,
  });
  const [showWelcomeBar, setShowWelcomeBar] = useState(true);
  // Interior Payments states
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentDatesModal, setShowPaymentDatesModal] = useState(false);
  const [editingEntryKey, setEditingEntryKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", description: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [approving, setApproving] = useState<{ [key: string]: boolean }>({});
  const [createForm, setCreateForm] = useState({
    client_id: "",
    project_name: "",
    total_bill: "",
    delivery_days_total: "",
    gst_mode: "excluding" as "excluding" | "including",
    gst_rate: "18",
  });
  const [deliveryDaysInput, setDeliveryDaysInput] = useState("");
  const [addForm, setAddForm] = useState({
    entry_type: "charge" as
      | "charge"
      | "payment"
      | "adjustment"
      | "work"
      | "extra_work",
    amount: "",
    description: "",
    payment_method: "cash" as "cash" | "online",
    adjustment_type: "debit" as "credit" | "debit",
    adjustment_category: "adjustment" as "adjustment" | "work",
    work_action: "add" as "add" | "deduct",
    gst_rate: "18",
    transaction_proof: null as File | null,
  });
  const [selectedTransactionImage, setSelectedTransactionImage] = useState<
    string | null
  >(null);
  const handleViewTransactionHistory = async (entry: any) => {
    try {
      // Only for payment entries
      if (entry.type !== "payment") {
        alert("Transaction history is available only for payments.");
        return;
      }
      const response = await fetch(
        `/api/superadmin/interior-payments/transaction-history/${entry.id}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transaction history");
      }
      if (!data.transaction_proof_path) {
        alert("No transaction proof uploaded.");
        return;
      }
      setSelectedTransactionImage(data.transaction_proof_path);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong");
    }
  };
  const loadStampImage = () => {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = "/stamp.png"; // from public folder
      img.onload = () => resolve(img);
    });
  };
  const handleDownloadPDF = async () => {
    if (!selectedProject || !ledger.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    // ================= HEADER =================
    doc.setFontSize(16);
    doc.setTextColor(41, 90, 71);
    doc.text("KAYAPALAT", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Professional Interior Solutions", 14, 21);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      "1160 Chadpur Poleghat, Mouza 80, Sonarpur, Kolkata - 700145, WB, India",
      14,
      26
    );
    doc.text("Phone/WhatsApp: 602-602-602-6", 14, 31);
    // Date (Top Right)
    const currentDate = new Date().toLocaleDateString("en-IN");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Date: ${currentDate}`, pageWidth - 14, 15, { align: "right" });
    // Divider Line
    doc.setDrawColor(200);
    doc.line(14, 35, pageWidth - 14, 35);
    // ================= TITLE =================
    doc.setFontSize(18);
    doc.setTextColor(41, 90, 71);
    doc.text(`Project - ${selectedProject.project_name}`, 14, 45);
    // ================= PROJECT INFO =================
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Client: ${selectedProject.client_name || "N/A"}`, 14, 55);
    const summaryY = 65;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(
      `Amount (excl. GST): INR ${(
        selectedProject.base_total ?? 0
      ).toLocaleString("en-IN")}`,
      14,
      summaryY
    );
    doc.text(
      `GST Total: INR ${(selectedProject.gst_total ?? 0).toLocaleString(
        "en-IN"
      )}`,
      14,
      summaryY + 7
    );
    doc.text(
      `Gross Total: INR ${(selectedProject.gross_total ?? 0).toLocaleString(
        "en-IN"
      )}`,
      14,
      summaryY + 14
    );
    doc.text(
      `Outstanding: INR ${selectedProject.outstanding_including_gst.toLocaleString(
        "en-IN"
      )}`,
      14,
      summaryY + 21
    );
    // ================= TABLE =================
    const tableColumn = [
      "Type",
      "Amount (Excl. GST)",
      "Description",
      "GST Details",
      "Date",
    ];
    const tableRows = ledger.map((entry) => [
      entry.type === "adjustment"
        ? "Cancelled Work"
        : entry.type === "extra_work"
          ? "Extra Work"
          : entry.type,
      `INR ${(entry.base_amount ?? entry.amount ?? 0).toLocaleString("en-IN")}`,
      entry.description,
      entry.gst_rate
        ? `GST ${entry.gst_rate}% (INR ${Number(
          entry.gst_amount || 0
        ).toLocaleString("en-IN")})`
        : "—",
      new Date(entry.created_at).toLocaleDateString("en-IN"),
    ]);
    const stampImg = await loadStampImage();
    autoTable(doc, {
      startY: summaryY + 30,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 90, 71] },
      styles: { fontSize: 9 },
      // ================= FOOTER =================
      didDrawPage: function () {
        const pageHeight = doc.internal.pageSize.getHeight();
        const generatedOn = new Date().toLocaleString("en-IN");
        // LEFT
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Generated on: ${generatedOn}`, 14, pageHeight - 10);
        // RIGHT - IMAGE STAMP
        doc.addImage(stampImg, "PNG", pageWidth - 35, pageHeight - 30, 25, 25);
        // CENTER
        doc.setTextColor(150);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });
    doc.save(`Ledger-${selectedProject.project_name}.pdf`);
  };
  const formatClientLabel = (name: string, email: string, maxLen = 36) => {
    const label = `${name} (${email})`;
    return label.length > maxLen ? `${label.slice(0, maxLen - 1)}...` : label;
  };
  const { data: session } = useSession();
  const router = useRouter();
  // Initialize sidebar state based on screen size
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  // Fetch dashboard stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/sales-admin/dashboard_stats");
        if (!res.ok) {
          console.error("Failed to fetch stats:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);
  // Interior Payments effects
  React.useEffect(() => {
    if (activeTab === "InteriorPayments") {
      fetchClients();
      fetchProjects();
    }
  }, [activeTab]);
  React.useEffect(() => {
    if (activeTab === "InteriorPayments") {
      fetchProjects();
    }
  }, [selectedClient]);
  React.useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [projects]);
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      console.log("Fullscreen change detected:", {
        fullscreenElement: document.fullscreenElement,
        webkitFullscreenElement: doc.webkitFullscreenElement,
        mozFullScreenElement: doc.mozFullScreenElement,
        msFullscreenElement: doc.msFullscreenElement,
      });
      if (
        !document.fullscreenElement &&
        !doc.webkitFullscreenElement &&
        !doc.mozFullScreenElement &&
        !doc.msFullscreenElement
      ) {
        console.log("Exiting fullscreen, collapsing sidebar");
        setSidebarCollapsed(true);
      }
    };
    // Add event listeners for cross-browser support
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };
  // Interior Payments functions
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/superadmin/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };
  const fetchProjects = async () => {
    try {
      const url = selectedClient
        ? `/api/superadmin/interior-payments?clientId=${selectedClient}`
        : "/api/superadmin/interior-payments";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };
  const fetchLedger = async (projectId: number) => {
    try {
      const response = await fetch(
        `/api/superadmin/interior-payments/${projectId}`
      );
      if (response.ok) {
        const data = await response.json();
        setLedger(data.ledger);
        if (data.project) {
          setSelectedProject((prev) =>
            prev ? { ...prev, ...data.project } : prev
          );
        }
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    }
  };
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    fetchLedger(project.id);
    setShowLedgerModal(true);
  };
  const handleDeleteProjectClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteProjectModal(true);
  };
  const handleDeleteProjectConfirm = async () => {
    if (!projectToDelete) return;
    setDeletingProject(true);
    try {
      const response = await fetch(
        `/api/superadmin/interior-payments/${projectToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success("Project and ledger deleted successfully");
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(null);
          setLedger([]);
          setShowLedgerModal(false);
        }
        setShowDeleteProjectModal(false);
        setProjectToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeletingProject(false);
    }
  };
  const handleCreateProject = async () => {
    if (!createForm.client_id || !createForm.project_name) return;
    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/interior-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: createForm.client_id,
          project_name: createForm.project_name,
          delivery_days_total: createForm.delivery_days_total
            ? Number(createForm.delivery_days_total)
            : null,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const projectId = data.id;
        toast.success("Project created successfully");
        if (createForm.total_bill) {
          // Add initial charge
          const formData = new FormData();
          const gstRate = Number(createForm.gst_rate || "18");
          const rawAmount = Number(createForm.total_bill);
          const baseAmount =
            createForm.gst_mode === "including"
              ? Number((rawAmount / (1 + gstRate / 100)).toFixed(2))
              : rawAmount;
          formData.append("entry_type", "charge");
          formData.append("project_id", projectId.toString());
          formData.append("amount", baseAmount.toString());
          formData.append("description", "Initial total bill");
          formData.append("gst_rate", createForm.gst_rate || "18");
          const chargeResponse = await fetch(
            "/api/superadmin/interior-payments/ledger",
            {
              method: "POST",
              body: formData,
            }
          );
          if (!chargeResponse.ok) {
            toast.error("Project created but failed to set total bill");
          }
        }
        setShowCreateModal(false);
        setCreateForm({
          client_id: "",
          project_name: "",
          total_bill: "",
          delivery_days_total: "",
          gst_mode: "excluding",
          gst_rate: "18",
        });
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };
  const getDaysRemaining = (dueDate?: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };
  const getGstPreview = () => {
    if (
      (addForm.entry_type !== "charge" &&
        addForm.entry_type !== "extra_work") ||
      !addForm.amount
    )
      return null;
    const amount = Number(addForm.amount);
    const rate = Number(addForm.gst_rate || "18");
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!Number.isFinite(rate) || rate < 0) return null;
    const gstAmount = Number((amount * (rate / 100)).toFixed(2));
    const totalAmount = Number((amount + gstAmount).toFixed(2));
    return { baseAmount: amount, gstAmount, totalAmount };
  };
  const handleDownloadReceipt = (entry: any) => {
    console.log("Receipt Entry:", entry);
    downloadPaymentReceipt({
      projectName: entry.project_name,
      amount: Number(entry.amount),
      paymentMethod: entry.payment_method,
      paymentDate: new Date(entry.created_at).toLocaleDateString("en-IN"),

      receiptNo: `I${entry.client_id}${entry.project_id}${entry.id}`,

      customerName: entry.customer_name,
      customerPhone: entry.customer_phone,

      paymentStatus: entry.status,
      transactionId: entry.id?.toString(),
    });
  };
  const handleAddEntry = async () => {
    if (!selectedProject || !addForm.amount) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("entry_type", addForm.entry_type);
      formData.append("project_id", selectedProject.id.toString());
      formData.append("amount", addForm.amount);
      formData.append("description", addForm.description);
      if (addForm.entry_type === "payment") {
        formData.append("payment_method", addForm.payment_method);
        if (addForm.payment_method === "online" && addForm.transaction_proof) {
          formData.append("transaction_proof", addForm.transaction_proof);
        }
      }
      if (
        addForm.entry_type === "adjustment" ||
        addForm.entry_type === "work" ||
        addForm.entry_type === "extra_work"
      ) {
        const adjustmentType =
          addForm.entry_type === "adjustment"
            ? "debit"
            : addForm.entry_type === "extra_work"
              ? "credit"
              : addForm.work_action === "add"
                ? "credit"
                : "debit";
        formData.append("adjustment_type", adjustmentType);
        formData.append(
          "adjustment_category",
          addForm.entry_type === "extra_work"
            ? "work"
            : addForm.entry_type === "work"
              ? "work"
              : "adjustment"
        );
      }
      if (
        addForm.entry_type === "charge" ||
        addForm.entry_type === "extra_work"
      ) {
        formData.append("gst_rate", addForm.gst_rate || "18");
      }
      const response = await fetch("/api/superadmin/interior-payments/ledger", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        toast.success("Entry added successfully");
        setShowAddModal(false);
        setAddForm({
          entry_type: "charge",
          amount: "",
          description: "",
          payment_method: "cash",
          adjustment_type: "debit",
          adjustment_category: "adjustment",
          work_action: "add",
          gst_rate: "18",
          transaction_proof: null,
        });
        fetchLedger(selectedProject.id);
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add entry");
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };
  const getEntryKey = (entry: LedgerEntry) => `${entry.type}-${entry.id}`;
  const canEditLedgerEntry = (entry: LedgerEntry) => entry.type !== "payment";
  const startEditLedgerEntry = (entry: LedgerEntry) => {
    if (!canEditLedgerEntry(entry)) return;
    setEditingEntryKey(getEntryKey(entry));
    setEditForm({
      amount: String(entry.base_amount ?? entry.amount ?? ""),
      description: entry.description || "",
    });
  };
  const cancelEditLedgerEntry = () => {
    if (savingEdit) return;
    setEditingEntryKey(null);
    setEditForm({ amount: "", description: "" });
  };
  const getInlineGstPreview = (entry: LedgerEntry) => {
    const baseAmount = Number(editForm.amount);
    const gstRate = Number(entry.gst_rate || 0);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) return null;
    const gstAmount = Number((baseAmount * (gstRate / 100)).toFixed(2));
    const totalAmount = Number((baseAmount + gstAmount).toFixed(2));
    return { gstRate, gstAmount, totalAmount };
  };
  const saveLedgerEntryEdit = async (entry: LedgerEntry) => {
    const amount = Number(editForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSavingEdit(true);
    try {
      const entryId = entry.entry_id || entry.id;
      const response = await fetch(
        `/api/superadmin/interior-payments/ledger/${entryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entry_type: entry.type,
            amount,
            description: editForm.description,
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update entry");
        return;
      }
      toast.success("Ledger entry updated");
      if (selectedProject) {
        await fetchLedger(selectedProject.id);
      }
      fetchProjects();
      setEditingEntryKey(null);
      setEditForm({ amount: "", description: "" });
    } catch (error) {
      console.error("Error updating ledger entry:", error);
      toast.error("Failed to update entry");
    } finally {
      setSavingEdit(false);
    }
  };
  const handleUpdateDelivery = async () => {
    if (!selectedProject || !deliveryDaysInput) return;
    const deliveryDays = Number(deliveryDaysInput);
    if (!Number.isFinite(deliveryDays) || deliveryDays <= 0) {
      toast.error("Please enter valid delivery days");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/superadmin/interior-payments/${selectedProject.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_days_total: deliveryDays }),
        }
      );
      if (response.ok) {
        toast.success("Delivery time updated");
        setShowDeliveryModal(false);
        setDeliveryDaysInput("");
        fetchLedger(selectedProject.id);
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update delivery time");
      }
    } catch (error) {
      console.error("Error updating delivery time:", error);
      toast.error("Failed to update delivery time");
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = async (
    entry: LedgerEntry,
    action: "approve" | "reject"
  ) => {
    if (!selectedProject) return;
    const key = `${entry.type}-${entry.id}`;
    setApproving((prev) => ({ ...prev, [key]: true }));
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      const idToUse = entry.entry_id || entry.id;
      const response = await fetch(
        `/api/superadmin/interior-payments/ledger/${idToUse}/${endpoint}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        toast.success(`Entry ${action}d successfully`);
        setLedger((prev) =>
          prev.map((e) =>
            e.id === entry.id && e.type === entry.type
              ? {
                ...e,
                status: action === "approve" ? "confirmed" : "declined",
              }
              : e
          )
        );
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} entry`);
      }
    } catch (error) {
      console.error(`Error ${action}ing entry:`, error);
      toast.error(`Failed to ${action} entry`);
    } finally {
      setApproving((prev) => ({ ...prev, [key]: false }));
    }
  };
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", key: "Dashboard" },
    { icon: Users, label: "Admin", key: "Admin" },
    { icon: Users, label: "Supervisor", key: "Supervisor" },
    { icon: Building2, label: "Vendor", key: "Vendor" },
    {
      icon: ClipboardList,
      label: "Supervisor Attendance",
      key: "SupervisorAttendance",
    },
    { icon: Building2, label: "All Projects", key: "AllProjects" },
    { icon: Users, label: "Agent", key: "Agent" },
    { icon: Users, label: "Lead", key: "Lead" },
    { icon: Users, label: "Metro Leads", key: "MetroSales" },
    { icon: UserPlus, label: "Payments", key: "Payments" },
    { icon: UserPlus, label: "Invoices", key: "Invoices" },
    { icon: CreditCard, label: "Interior Payments", key: "InteriorPayments" },
    {
      icon: CreditCard,
      label: "Client Design Transactions",
      key: "ClientDesignTransactions",
    },
    {
      icon: MessageSquare,
      label: "Client Complaints",
      key: "ClientComplaints",
    },
    { icon: FileText, label: "PDF Quotations", key: "PDFQuotations" },
    { icon: Link2, label: "Designer Assignments", key: "DesignerAssignments" },
    { icon: Store, label: "Showroom", key: "Showroom" },
    { icon: Store, label: "Products", key: "Products" },
    { icon: Store, label: "Orders", key: "Orders" },
    { icon: Pencil, label: "Employee Attendance", key: "EmployeeAttendance" },
    { icon: Loader2, label: "Work Progress", key: "WorkProgress" },
    // { icon: BarChart3, label: 'Business Insights', key: 'Business Insights' },
    // { icon: Bell, label: 'Notifications', key: 'Notifications' },
    // { icon: Settings, label: 'Maintenance', key: 'Maintenance' },
    { icon: ClipboardList, label: "Admin Panel", key: "Admin Panel" },
    // { icon: Settings, label: 'Settings', key: 'Settings' },
  ];
  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 pb-5 bg-white shadow-lg transition-all duration-300 ease-in-out transform
  ${sidebarCollapsed
            ? "-translate-x-full lg:translate-x-0 lg:w-16"
            : "translate-x-0 w-64"
          }
  flex flex-col`}
      >
        {/* Header Section */}
        <div className="p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img
                    src="/founder.jpg"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <User className="w-6 h-6 text-gray-500 hidden" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#DC0835]">
                    {session?.user?.name}
                  </h3>
                  <p className="text-sm text-gray-600">{"Super Admin"}</p>
                  <p className="text-sm text-black-600">
                    ID: <strong>{session?.user?.id}</strong>
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#295A47] hover:text-[#1e3d32] transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        <nav
          className="
    mt-4
    flex-1
    overflow-y-auto
    scrollbar-thin
    scrollbar-thumb-gray-300
    scrollbar-track-transparent
  "
        >
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.key === "Admin Panel") {
                  router.push("/admin");
                } else {
                  setActiveTab(item.key);
                }
              }}
              className={`flex items-center ${sidebarCollapsed ? "justify-center px-3" : "px-6"
                } py-3 cursor-pointer transition-colors ${activeTab === item.key
                  ? "bg-[#D7E7D0] text-[#295A47] border-r-4 border-[#295A47]"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="font-medium ml-3">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>
      {/* Main Content */}
      <div
        className={`
    flex-1
    h-screen
    overflow-y-auto
    overflow-x-hidden
    pt-20
    ${sidebarCollapsed ? "lg:ml-16 ml-0" : "lg:ml-64 ml-0"}
  `}
      >
        {/* Navbar */}
        <div
          className={`bg-white shadow-md p-2 md:p-4 flex justify-between items-center fixed top-0 z-40 ${sidebarCollapsed ? "lg:left-16 left-0" : "lg:left-64 left-0"
            } right-0`}
        >
          {/* Hamburger Menu Button for Mobile/Tablet */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-[#295A47] hover:text-[#1e3d32] transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 mr-2">
            <div className="flex items-center space-x-1 md:space-x-3 pr-4 md:pr-8 pl-1 md:pl-2 shrink-0">
              <img
                src="/kayapalat-logo.png"
                alt="Kayapalat Logo"
                className="h-5 md:h-6 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = "none";
                  const nextSibling = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = "block";
                  }
                }}
              />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="relative flex items-center justify-start cursor-pointer overflow-hidden shadow-md"
            style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              backgroundColor: "rgb(255, 65, 65)",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => {
              // Expand button
              e.currentTarget.style.width = "125px";
              e.currentTarget.style.borderRadius = "40px";
              // ICON changes
              const icon = e.currentTarget.querySelector(
                ".logout-icon"
              ) as HTMLElement;
              if (icon) {
                icon.style.width = "30%";
                icon.style.paddingLeft = "20px";
              }
              // TEXT appears
              const label = e.currentTarget.querySelector(".logout-text");
              if (label) {
                (label as HTMLElement).style.opacity = "1";
                (label as HTMLElement).style.width = "70%";
                (label as HTMLElement).style.paddingRight = "10px";
              }
            }}
            onMouseLeave={(e) => {
              // Collapse button
              e.currentTarget.style.width = "45px";
              e.currentTarget.style.borderRadius = "50%";
              // ICON reset
              const icon = e.currentTarget.querySelector(
                ".logout-icon"
              ) as HTMLElement;
              if (icon) {
                icon.style.width = "100%";
                icon.style.paddingLeft = "0px";
              }
              // TEXT reset
              const label = e.currentTarget.querySelector(".logout-text");
              if (label) {
                (label as HTMLElement).style.opacity = "0";
                (label as HTMLElement).style.width = "0%";
                (label as HTMLElement).style.paddingRight = "0px";
              }
            }}
          >
            {/* ICON */}
            <div
              className="logout-icon flex items-center justify-center"
              style={{
                width: "100%",
                transition: "0.3s",
              }}
            >
              <svg viewBox="0 0 512 512" width="17px">
                <path
                  fill="white"
                  d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                />
              </svg>
            </div>
            {/* TEXT */}
            <div
              className="logout-text absolute right-0 font-semibold text-white"
              style={{
                width: "0%",
                opacity: 0,
                transition: "0.3s",
                fontSize: "1.1em",
                whiteSpace: "nowrap",
              }}
            >
              Logout
            </div>
          </button>
        </div>
        {/* Welcome Bar */}
        {showWelcomeBar && (
          <div className="bg-[#295A47] text-white py-2 md:py-3 px-4 md:px-8 relative">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-sm md:text-lg font-semibold text-center">
                Welcome to Super Admin Dashboard
              </h4>
            </div>
            <button
              onClick={() => setShowWelcomeBar(false)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {/* Hero Section */}
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-8xl pt-4 mx-auto lg:mx-auto">
            <div className="min-w-0 bg-white rounded-lg shadow-lg p-4 md:p-6 lg:p-8 mb-4 md:mb-8">
              {activeTab === "Dashboard" && (
                <>
                  <div className="text-center mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#295A47] mb-2 md:mb-4">
                      Super Admin Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base lg:text-lg px-2">
                      Manage your sales operations, agents, leads, and business
                      insights.
                    </p>
                  </div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div
                      className="bg-[#D7E7D0] rounded-lg p-6 text-center cursor-pointer"
                      onClick={() => setActiveTab("Agent")}
                    >
                      <Users className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">
                        {stats.activeAgents}
                      </h3>
                      <p className="text-gray-700">Active Agents</p>
                    </div>
                    <div
                      className="bg-[#D7E7D0] rounded-lg p-6 text-center cursor-pointer"
                      onClick={() => setActiveTab("Lead")}
                    >
                      <UserPlus className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">
                        {stats.totalLeads}
                      </h3>
                      <p className="text-gray-700">Total Leads</p>
                    </div>
                    <div className="bg-[#D7E7D0] rounded-lg p-6 text-center">
                      <BarChart3 className="w-12 h-12 text-[#295A47] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#295A47]">
                        ₹{stats.totalRevenue.toLocaleString()}
                      </h3>
                      <p className="text-gray-700">Revenue</p>
                    </div>
                  </div>
                </>
              )}
              {activeTab === "Admin" && <AdminTab />}
              {activeTab === "Agent" && <AgentTab />}
              {activeTab === "Supervisor" && <SuperAdmin_Supervisor />}
              {activeTab === "Vendor" && <VendorManagementPage />}
              {activeTab === "SupervisorAttendance" && <SupervisorAttendance />}
              {activeTab === "AllProjects" && <SuperAdminMyProjects />}
              {activeTab === "Lead" && <LeadTab />}
              {activeTab === "MetroSales" && <MetroSales />}
              {activeTab === "Payments" && <PaymentTab />}
              {activeTab === "Invoices" && <InvoiceTab />}
              {activeTab === "Showroom" && <SuperAdminShowroom />}
              {activeTab === "Products" && <ProductsTab />}
              {activeTab === "Orders" && <OrdersTab />}
              {activeTab === "ClientDesignTransactions" && (
                <ClientDesignTransactions />
              )}
              {activeTab === "InteriorPayments" && (
                <>
                  <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47] mb-3 sm:mb-4">
                      Interior Projects
                    </h1>
                    <p className="text-gray-600">
                      Manage interior project payments
                    </p>
                  </div>
                  <div className="mb-6 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-center">
                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <label className="text-sm font-medium">
                        Filter by Client:
                      </label>
                      <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="client-name-select w-full min-w-0 sm:w-[320px] max-w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg truncate"
                      >
                        <option value="">All Clients</option>
                        {clients.map((client) => (
                          <option key={client.user_id} value={client.user_id}>
                            {formatClientLabel(client.name, client.email)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-full sm:w-auto bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#1e3d32] flex items-center justify-center"
                    >
                      <Plus size={20} className="mr-2" />
                      Create Project
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]"
                      >
                        <h3 className="text-xl font-semibold text-[#295A47] mb-2">
                          {project.project_name}
                        </h3>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">
                            Amount (excluding GST): ₹
                            {(project.base_total ?? 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-600">
                            GST: ₹
                            {(project.gst_total ?? 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total (including GST): ₹
                            {(project.gross_total ?? 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-600">
                            Paid: ₹{project.paid.toLocaleString("en-IN")}
                          </p>
                          <p className="text-lg font-semibold text-[#295A47]">
                            Outstanding (including GST): ₹
                            {project.outstanding_including_gst.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                          {project.client_name && (
                            <p className="text-sm text-gray-600">
                              Client: {project.client_name}
                            </p>
                          )}
                          {project.delivery_due_date ? (
                            <p className="text-sm text-gray-600">
                              Delivery:{" "}
                              {getDaysRemaining(project.delivery_due_date)} days
                              left
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Delivery not set
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => handleProjectSelect(project)}
                            className="w-full bg-[#295A47] text-white text-s py-1 px-2 rounded-lg hover:bg-[#1e3d32] transition"
                          >
                            View Ledger
                          </button>
                          <button
                            onClick={() => handleDeleteProjectClick(project)}
                            className="w-full bg-gray-600 text-white text-s py-1 px-2 rounded-lg hover:bg-red-700 transition"
                          >
                            Delete Project
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeTab === "ClientComplaints" && <ClientComplaintsTab />}
              {activeTab === "PDFQuotations" && <QuotationPdfsTab />}
              {activeTab === "DesignerAssignments" && (<SuperAdminDesignerAssignments />)}
              {activeTab === "EmployeeAttendance" && (<EmployeeManagementPage />)}
              {activeTab === "WorkProgress" && (<WorkProgress/>)}
            </div>
          </div>
        </div>
      </div>
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">
                Create New Project
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <select
                    value={createForm.client_id}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        client_id: e.target.value,
                      }))
                    }
                    className="client-name-select w-full min-w-0 max-w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg truncate"
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.user_id} value={client.user_id}>
                        {formatClientLabel(client.name, client.email)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={createForm.project_name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        project_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time (days)
                  </label>
                  <input
                    type="number"
                    value={createForm.delivery_days_total}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        delivery_days_total: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. 30"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (excluding GST) (₹)
                  </label>
                  <input
                    type="number"
                    value={createForm.total_bill}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        total_bill: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter total bill amount"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GST Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          gst_mode: "excluding",
                        }))
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${createForm.gst_mode === "excluding"
                        ? "bg-[#295A47] text-white"
                        : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      Excluding GST
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          gst_mode: "including",
                        }))
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${createForm.gst_mode === "including"
                        ? "bg-[#295A47] text-white"
                        : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      Including GST
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST %
                    </label>
                    <input
                      type="number"
                      value={createForm.gst_rate}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          gst_rate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min={0}
                      step="0.01"
                    />
                  </div>
                  {createForm.total_bill && (
                    <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {(() => {
                        const raw = Number(createForm.total_bill);
                        const rate = Number(createForm.gst_rate || "18");
                        if (
                          !Number.isFinite(raw) ||
                          raw <= 0 ||
                          !Number.isFinite(rate) ||
                          rate < 0
                        )
                          return null;
                        const base =
                          createForm.gst_mode === "including"
                            ? Number((raw / (1 + rate / 100)).toFixed(2))
                            : raw;
                        const gst = Number((base * (rate / 100)).toFixed(2));
                        const total = Number((base + gst).toFixed(2));
                        return (
                          <>
                            <div>
                              Amount (excluding GST): ₹
                              {base.toLocaleString("en-IN")}
                            </div>
                            <div>GST: ₹{gst.toLocaleString("en-IN")}</div>
                            <div className="font-semibold">
                              Total (including GST): ₹
                              {total.toLocaleString("en-IN")}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={
                    loading || !createForm.client_id || !createForm.project_name
                  }
                  className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Ledger Modal */}
      {showLedgerModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#295A47] mb-2">
                    Ledger - {selectedProject.project_name}
                    {selectedProject.client_name && (
                      <span className="block sm:inline sm:ml-3 text-sm font-medium text-gray-600">
                        Client: {selectedProject.client_name}
                      </span>
                    )}
                    {selectedProject.delivery_due_date && (
                      <span className="block sm:inline sm:ml-3 text-sm font-medium text-gray-600">
                        Delivery:{" "}
                        {getDaysRemaining(selectedProject.delivery_due_date)}{" "}
                        days left
                      </span>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 text-sm">
                    <div>
                      Amount (excluding GST): ₹
                      {(selectedProject.base_total ?? 0).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                    <div>
                      GST: ₹
                      {(selectedProject.gst_total ?? 0).toLocaleString("en-IN")}
                    </div>
                    <div>
                      Total (including GST): ₹
                      {(selectedProject.gross_total ?? 0).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                    <div>
                      Outstanding (including GST): ₹
                      {selectedProject.outstanding_including_gst.toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex w-full lg:w-auto flex-wrap gap-3 items-center">
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="w-full sm:w-auto bg-green-600 text-white px-2 py-1 text-s rounded-lg hover:bg-gray-700"
                  >
                    Set Delivery Time
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto bg-[#295A47] text-white px-2 py-1 text-s rounded-lg hover:bg-[#1e3d32]"
                  >
                    Add Entry
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto bg-red-500 text-white px-2 py-1 text-s rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowPaymentDatesModal(true)}
                    className="w-full sm:w-auto bg-blue-500 text-white px-2 py-1 text-s rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    Set Payment Date
                  </button>
                </div>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="w-full overflow-x-auto overscroll-x-contain">
                <table className="min-w-245 w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-[#D7E7D0]">
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Type
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Amount (₹) (Excluding GST)
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Description
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Transaction History
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        GST Details
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Status
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Date
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Actions
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Edit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr
                        key={`${entry.type}-${entry.id}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="border border-gray-300 px-4 py-2 capitalize">
                          {entry.type === "adjustment"
                            ? "cancelled work"
                            : entry.type === "extra_work"
                              ? "extra work"
                              : entry.type}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {editingEntryKey === getEntryKey(entry) ? (
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              className="w-36 px-2 py-1 border border-gray-300 rounded"
                              min={0}
                              step="0.01"
                            />
                          ) : entry.type === "charge" ||
                            entry.type === "extra_work" ? (
                            `₹${(entry.base_amount ?? 0).toLocaleString(
                              "en-IN"
                            )}`
                          ) : entry.type === "work" &&
                            entry.adjustment_type === "debit" ? (
                            `-₹${entry.amount.toLocaleString("en-IN")}`
                          ) : entry.type === "work" &&
                            entry.adjustment_type === "credit" ? (
                            `₹${entry.amount.toLocaleString("en-IN")}`
                          ) : (
                            `₹${entry.amount.toLocaleString("en-IN")}`
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {editingEntryKey === getEntryKey(entry) ? (
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full min-w-55 px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            entry.description
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {entry.transaction_proof_path ? (
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              onClick={() =>
                                handleViewTransactionHistory(entry)
                              }
                            >
                              View
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm"
                            >
                              View
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {entry.type === "charge" ||
                            entry.type === "adjustment" ||
                            entry.type === "work" ||
                            entry.type === "extra_work"
                            ? editingEntryKey === getEntryKey(entry)
                              ? (() => {
                                const preview = getInlineGstPreview(entry);
                                if (!preview) return "—";
                                return `GST ${preview.gstRate
                                  }% • GST: ₹${preview.gstAmount.toLocaleString(
                                    "en-IN"
                                  )} • Gross: ₹${preview.totalAmount.toLocaleString(
                                    "en-IN"
                                  )}`;
                              })()
                              : `GST ${entry.gst_rate ?? 0}% • GST: ₹${Number(
                                entry.gst_amount || 0
                              ).toLocaleString("en-IN")} • Gross: ₹${Number(
                                entry.total_amount || 0
                              ).toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize w-fit ${entry.status === "approved" ||
                                entry.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : entry.status === "declined" ||
                                  entry.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              {entry.status}
                            </span>

                            {(entry.status === "approved" ||
                              entry.status === "confirmed") &&
                              (entry.description === "Payment via cash" ||
                                entry.description === "Payment via online") && (
                                <button
                                  onClick={() => handleDownloadReceipt(entry)}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                  Receipt
                                </button>
                              )}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(entry.created_at).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {entry.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggle(entry, "approve")}
                                disabled={
                                  approving[`${entry.type}-${entry.id}`]
                                }
                                className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                              >
                                {approving[`${entry.type}-${entry.id}`]
                                  ? "Confirming..."
                                  : "Confirm"}
                              </button>
                              <button
                                onClick={() => handleToggle(entry, "reject")}
                                disabled={
                                  approving[`${entry.type}-${entry.id}`]
                                }
                                className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                              >
                                {approving[`${entry.type}-${entry.id}`]
                                  ? "Declining..."
                                  : "Decline"}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {editingEntryKey === getEntryKey(entry) ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveLedgerEntryEdit(entry)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEditLedgerEntry}
                                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 text-sm"
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditLedgerEntry(entry)}
                              className="p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-300"
                              disabled={!canEditLedgerEntry(entry)}
                              title={
                                canEditLedgerEntry(entry)
                                  ? "Edit row"
                                  : "Editing not available for payments"
                              }
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedTransactionImage && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-4xl w-full max-h-[95vh] overflow-auto">
            <button
              onClick={() => setSelectedTransactionImage(null)}
              className="absolute top-3 right-3 z-1000000 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Close
            </button>
            <img
              src={selectedTransactionImage}
              alt="Transaction Proof"
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      {/* Add Entry Modal */}
      {showAddModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">
                Add Ledger Entry
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Type
                  </label>
                  <select
                    value={addForm.entry_type}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        entry_type: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="charge">Charge</option>
                    <option value="payment">Payment</option>
                    <option value="adjustment">
                      Adjustments (Deduct Work)
                    </option>
                    <option value="extra_work">Extra Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (excluding GST) (₹)
                  </label>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter description"
                  />
                </div>
                {(addForm.entry_type === "charge" ||
                  addForm.entry_type === "extra_work") && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GST %
                        </label>
                        <input
                          type="number"
                          value={addForm.gst_rate}
                          onChange={(e) =>
                            setAddForm((prev) => ({
                              ...prev,
                              gst_rate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          min={0}
                          step="0.01"
                        />
                      </div>
                      {getGstPreview() && (
                        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div>
                            Amount (excluding GST): ₹
                            {getGstPreview()!.baseAmount.toLocaleString("en-IN")}
                          </div>
                          <div>
                            GST: ₹
                            {getGstPreview()!.gstAmount.toLocaleString("en-IN")}
                          </div>
                          <div className="font-semibold">
                            Total (including GST): ₹
                            {getGstPreview()!.totalAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                {addForm.entry_type === "adjustment" && (
                  <p className="text-sm text-gray-600">
                    Adjustment will be recorded as deduction from base amount
                    (excluding GST).
                  </p>
                )}
                {addForm.entry_type === "payment" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={addForm.payment_method}
                        onChange={(e) =>
                          setAddForm((prev) => ({
                            ...prev,
                            payment_method: e.target.value as any,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    {addForm.payment_method === "online" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction Proof
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            setAddForm((prev) => ({
                              ...prev,
                              transaction_proof: e.target.files?.[0] || null,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={loading || !addForm.amount}
                  className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delivery Time Modal */}
      {showDeliveryModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-l font-bold text-[#295A47] mb-4">
                Set Delivery Time
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time (days)
                  </label>
                  <input
                    type="number"
                    value={deliveryDaysInput}
                    onChange={(e) => setDeliveryDaysInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. 30"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDelivery}
                  disabled={loading || !deliveryDaysInput}
                  className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Project Modal */}
      {showDeleteProjectModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#295A47] mb-4">
                Delete Project
              </h2>
              <p className="text-gray-700">
                Are you sure you want to delete this project and ledger of{" "}
                {projectToDelete.client_name || "this client"} for the project{" "}
                {projectToDelete.project_name}?
              </p>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    if (deletingProject) return;
                    setShowDeleteProjectModal(false);
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={deletingProject}
                >
                  No
                </button>
                <button
                  onClick={handleDeleteProjectConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={deletingProject}
                >
                  {deletingProject ? "Deleting..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Dates Modal */}
      <PaymentDatesModal
        isOpen={showPaymentDatesModal}
        onClose={() => setShowPaymentDatesModal(false)}
        projectId={selectedProject?.id || 0}
        projectName={selectedProject?.project_name || ""}
      />
      {/* Overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/70 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};
export default SuperAdmin;
