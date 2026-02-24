"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { X, Upload, Package } from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceData {
  invoiceId: string;
  appointmentId: string;
  agentDetails: {
    name: string;
    id: string;
  };
  clientDetails: {
    name: string;
    contact: string;
  };
  propertyDetails: {
    name: string;
    location: string;
  };
  totalEstimate: number;
  agentShare: number;
  agentPaid: number;
  lastDue: number;
  paid: number;
  due: number;
  paymentStatus: string;
  invoiceDate: string;
  invoiceTime: string;
  proof?: string | null;
}

interface ProjectData {
  appointmentId: string;
  agentName: string;
  agentId: string;
  clientName: string;
  clientContact: string;
  projectName: string;
  location: string;
  totalEstimate: number;
  agentShare: number;
  agentPaid: number;
}

const InvoicesTable = () => {
  const [appointmentInput, setAppointmentInput] = useState("");
  const [appointmentIds, setAppointmentIds] = useState<
    { appointment_id: string }[]
  >([]);
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<ProjectData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoicesList, setInvoicesList] = useState<InvoiceData[]>([]);
  const [showPreviousInvoices, setShowPreviousInvoices] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [nextInvoiceId, setNextInvoiceId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [previousPaid, setPreviousPaid] = useState(0);

  // Transaction Proof Modal states
  const [showProofModal, setShowProofModal] = useState(false);
  const [transactionProofs, setTransactionProofs] = useState<any[]>([]);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<
    string | null
  >(null);

  // Fetch appointment IDs for dropdown
  useEffect(() => {
    const fetchAppointmentIds = async () => {
      try {
        const response = await fetch(
          "/api/sales-admin/invoice?appointmentList=true",
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAppointmentIds(
            (data.appointmentIds || []).filter(
              (item: { appointment_id: string }) => item && item.appointment_id
            )
          );
        } else {
          console.error("Failed to fetch appointment IDs");
        }
      } catch (error) {
        console.error("Error fetching appointment IDs:", error);
      }
    };
    fetchAppointmentIds();
  }, []);

  // Fetch projects data from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/sales-admin/invoice", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("API Response Data:", data.data); // Debug log
          const transformedData = (data.data || []).map((item: any) => ({
            appointmentId: (item?.appointment_id?.toString() || "").trim(),
            agentName: item?.agent_name || "",
            agentId: item?.agent_id?.toString() || "",
            clientName: item?.client_name || "",
            clientContact: "", // Not available in API
            projectName: item?.project_name || "",
            location: item?.location || "",
            totalEstimate: item?.client_estimate || 0,
            agentShare: item?.agent_share || 0,
            agentPaid: item?.agent_paid || 0,
          }));
          console.log("Transformed Data:", transformedData); // Debug log
          setProjectsData(transformedData);
          setLoadingProjects(false);
        } else {
          console.error("Failed to fetch projects data");
          setLoadingProjects(false);
        }
      } catch (error) {
        console.error("Error fetching projects data:", error);
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch invoices data from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/sales-admin/invoice?invoices=true", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const transformedInvoices = (data.data || []).map((item: any) => ({
            invoiceId: item?.invoice_id || "",
            appointmentId: item?.appointment_id || "",
            agentDetails: {
              name: item?.agent_name || "",
              id: item?.agent_id || "",
            },
            clientDetails: {
              name: item?.client_name || "",
              contact: item?.client_contact || "",
            },
            propertyDetails: {
              name: item?.project_name || "",
              location: item?.location || "",
            },
            totalEstimate: item?.total_estimate || 0,
            agentShare: item?.agent_share || 0,
            agentPaid: item?.agent_paid || 0,
            lastDue: item?.last_due || 0,
            paid: item?.paid || 0,
            due: item?.due || 0,
            paymentStatus: item?.payment_status || "due",
            invoiceDate: item?.invoice_date || "",
            invoiceTime: item?.invoice_time || "",
            proof: item?.proof || null,
          }));
          setInvoicesList(transformedInvoices);
        } else {
          console.error("Failed to fetch invoices data");
        }
      } catch (error) {
        console.error("Error fetching invoices data:", error);
      }
    };
    fetchInvoices();
  }, []);

  // Fetch next invoice ID when modal opens
  useEffect(() => {
    if (modalOpen) {
      const fetchNextId = async () => {
        try {
          const response = await fetch("/api/sales-admin/invoice?nextId=true", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setNextInvoiceId(data.nextInvoiceId);
          } else {
            console.error("Failed to fetch next invoice ID");
          }
        } catch (error) {
          console.error("Error fetching next invoice ID:", error);
        }
      };
      fetchNextId();
    }
  }, [modalOpen]);

  // Update time every second
  useEffect(() => {
    if (!modalOpen || !invoiceData) return;
    const interval = setInterval(() => {
      const now = new Date();
      setInvoiceData((prev) =>
        prev
          ? {
              ...prev,
              invoiceTime: now.toLocaleTimeString("en-US", {
                timeZone: "Asia/Kolkata",
                hour12: true,
              }),
            }
          : null
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [modalOpen, invoiceData]);

  const handleSearch = async () => {
    const trimmedInput = (appointmentInput || "").trim();
    if (!trimmedInput) {
      setSelectedAppointment(null);
      setErrorMessage("Please select an appointment ID.");
      return;
    }

    try {
      const response = await fetch(
        `/api/sales-admin/invoice?appointmentId=${encodeURIComponent(
          trimmedInput
        )}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const item = data.data[0];
          const appointment = {
            appointmentId: (item?.appointment_id?.toString() || "").trim(),
            agentName: item?.agent_name || "",
            agentId: item?.agent_id?.toString() || "",
            clientName: item?.client_name || "",
            clientContact: "", // Not available in API
            projectName: item?.project_name || "",
            location: item?.location || "",
            totalEstimate: item?.client_estimate || 0,
            agentShare: item?.agent_share || 0,
            agentPaid: item?.agent_paid || 0,
          };
          setSelectedAppointment(appointment);
          setErrorMessage("");
        } else {
          setSelectedAppointment(null);
          setErrorMessage("No such appointment ID exists in the database.");
        }
      } else {
        setSelectedAppointment(null);
        setErrorMessage("Failed to fetch appointment data.");
      }
    } catch (error) {
      console.error("Error fetching appointment data:", error);
      setSelectedAppointment(null);
      setErrorMessage("Error fetching appointment data.");
    }
  };

  const handleInvoiceClick = async () => {
    if (!selectedAppointment) return;

    // Reset uploaded states for new invoice
    setUploadedImage(null);
    setUploadedFile(null);

    // Fetch next invoice ID first
    let invoiceId = "I0001"; // fallback
    try {
      const response = await fetch("/api/sales-admin/invoice?nextId=true", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        invoiceId = data.nextInvoiceId;
      } else {
        console.error("Failed to fetch next invoice ID");
      }
    } catch (error) {
      console.error("Error fetching next invoice ID:", error);
    }

    const now = new Date();
    const invoiceDate = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const invoiceTime = now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: true,
    });

    // Fetch agent_share from projects for the first invoice
    const fetchDue = async () => {
      try {
        const response = await fetch(
          `/api/sales-admin/invoice?due=true&appointmentId=${selectedAppointment.appointmentId}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data.due;
        } else {
          console.error("Failed to fetch due");
          return selectedAppointment.agentShare; // fallback
        }
      } catch (error) {
        console.error("Error fetching due:", error);
        return selectedAppointment.agentShare; // fallback
      }
    };

    const fetchedDue = await fetchDue();

    // Calculate total paid from previous invoices for this appointment
    const previousPaid = invoicesList
      .filter((inv) => inv.appointmentId === selectedAppointment.appointmentId)
      .reduce((sum, inv) => sum + inv.paid, 0);

    // Agent details from selectedAppointment
    const agentDetails = {
      name: selectedAppointment.agentName,
      id: selectedAppointment.agentId,
    };

    const lastDue = fetchedDue;
    const initialPaid = 0;
    const due = Math.max(lastDue - initialPaid, 0);
    const paymentStatus = due <= 0 ? "Paid" : "due";

    setInvoiceData({
      invoiceId,
      appointmentId: selectedAppointment.appointmentId,
      agentDetails,
      clientDetails: {
        name: selectedAppointment.clientName,
        contact: selectedAppointment.clientContact,
      },
      propertyDetails: {
        name: selectedAppointment.projectName,
        location: selectedAppointment.location,
      },
      totalEstimate: selectedAppointment.totalEstimate,
      agentShare: selectedAppointment.agentShare,
      agentPaid: previousPaid,
      lastDue,
      paid: initialPaid,
      due,
      paymentStatus,
      invoiceDate,
      invoiceTime,
      proof: null,
    });
    setModalOpen(true);
  };

  const handlePaidChange = (value: string) => {
    if (!invoiceData) return;
    const paid = parseFloat(value) || 0;
    const due = Math.max(invoiceData.lastDue - paid, 0);
    const paymentStatus = due <= 0 ? "Paid" : "due";
    setInvoiceData({
      ...invoiceData,
      paid,
      due,
      paymentStatus,
    });
  };

  const handleSave = async () => {
    if (!invoiceData) return;

    try {
      const response = await fetch("/api/sales-admin/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Invoice saved successfully:", result);

        const newTotalPaid = (invoiceData.agentPaid || 0) + invoiceData.paid;
        const newInvoiceForList = { ...invoiceData, agentPaid: newTotalPaid };

        // Add to local list
        setInvoicesList((prev) => [...prev, newInvoiceForList]);

        // Also update projectsData locally to reflect the new payment
        setProjectsData((prev) =>
          prev.map((p) =>
            p.appointmentId === invoiceData.appointmentId
              ? { ...p, agentPaid: newTotalPaid }
              : p
          )
        );

        setModalOpen(false);
      } else {
        const error = await response.json();
        console.error("Failed to save invoice:", error);
        alert("Failed to save invoice: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(
        "Error saving invoice: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setUploadedImage(null);
    setUploadedFile(null);
    const fileInput = document.getElementById(
      "receiptUpload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleProofView = async (appointmentId: string) => {
    if (!appointmentId) return;

    try {
      const response = await fetch(
        `/api/superadmin/payments/proofs?appointment_id=${encodeURIComponent(
          appointmentId
        )}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactionProofs(data.data || []);
        setCurrentAppointmentId(appointmentId);
        setShowProofModal(true);
      } else {
        console.error("Failed to fetch transaction proofs");
        alert("Failed to fetch transaction proofs");
      }
    } catch (error) {
      console.error("Error fetching transaction proofs:", error);
      alert("Error fetching transaction proofs");
    }
  };

  const generatePDF = (invoice: InvoiceData, invoiceId: string) => {
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica", "normal");

    // Title
    doc.setFontSize(14);
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("Invoice", 105, 20, { align: "center" });
    doc.setTextColor(0);

    // Invoice ID
    doc.setFontSize(8);
    doc.text(`Invoice ID: ${invoiceId}`, 20, 35);

    // Date and Time
    doc.text(`Date: ${invoice.invoiceDate}`, 20, 45);
    doc.text(`Time: ${invoice.invoiceTime}`, 20, 55);

    // Left Side: Agent Details
    doc.setFontSize(10);
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("Billed To (Agent):", 20, 70);
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(`Name: ${invoice.agentDetails.name}`, 20, 80);
    doc.text(`ID: ${invoice.agentDetails.id}`, 20, 90);

    // Right Side: Client Details
    doc.setFontSize(10);
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("Client Details:", 110, 70);
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(`Name: ${invoice.clientDetails.name}`, 110, 80);

    // Right Side: Property Details
    doc.setFontSize(10);
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("Property Details:", 110, 105);
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(`Name: ${invoice.propertyDetails.name}`, 110, 115);
    doc.text(`Location: ${invoice.propertyDetails.location}`, 110, 120);


    // Financial Details Table
    doc.setFontSize(10);
    doc.setTextColor(41, 90, 71); // #295A47
    doc.text("Financial Details:", 20, 130);
    doc.setTextColor(0);

    // Find the project to get the correct agent share from projects table
    const project = projectsData.find(
      (p) => p.appointmentId === invoice.appointmentId
    );
    const displayAgentShare = project ? project.agentShare : invoice.agentShare;

    // Calculate cumulative paid
    const relatedInvoices = invoicesList.filter(
      (inv) => inv.appointmentId === invoice.appointmentId
    );
    relatedInvoices.sort((a, b) => a.invoiceId.localeCompare(b.invoiceId));

    let totalPaidSoFar = 0;
    for (const inv of relatedInvoices) {
      totalPaidSoFar += inv.paid;
      if (inv.invoiceId === invoice.invoiceId) {
        break;
      }
    }

    const financialData = [
      ["Total Estimate", `INR ${invoice.totalEstimate.toLocaleString()}`],
      ["Agent's Share", `INR ${displayAgentShare.toLocaleString()}`],
      ["Paid", `INR ${invoice.paid.toLocaleString()}`],
      [
        "Total Paid",
        `INR ${totalPaidSoFar.toLocaleString()}`,
      ],
      ["Due", `INR ${invoice.due.toLocaleString()}`],
      ["Payment Status", invoice.paymentStatus],
    ];

    autoTable(doc, {
      startY: 140,
      head: [["Description", "Amount"]],
      body: financialData,
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94], // green-600
        textColor: [255, 255, 255], // white
        fontStyle: "bold",
      },
      styles: {
        fontSize: 6,
        cellPadding: 1,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
    });

    // Footer for first page
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text("Thank you for your business!", 105, pageHeight - 30, {
      align: "center",
    });
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      105,
      pageHeight - 20,
      { align: "center" }
    );
    doc.setTextColor(0);

    // Add proof image on second page if available
    if (invoice.proof) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(41, 90, 71); // #295A47
      doc.text("Proof", 105, 20, { align: "center" });
      doc.setTextColor(0);
      try {
        doc.addImage(invoice.proof, "JPEG", 20, 30, 170, 250); // Full view size
      } catch (error) {
        console.error("Error adding proof image to PDF:", error);
        doc.setFontSize(12);
        doc.text("Proof image could not be loaded.", 20, 30);
      }
      // Footer for second page
      doc.setFontSize(6);
      doc.setTextColor(100);
      doc.text("Thank you for your business!", 105, pageHeight - 30, {
        align: "center",
      });
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        105,
        pageHeight - 20,
        { align: "center" }
      );
      doc.setTextColor(0);
    }

    // Save the PDF
    doc.save(`${invoiceId}.pdf`);
    toast.success("Invoice downloaded");
  };

  return (
    <>
      <style>{`datalist { max-height: 200px; overflow-y: auto; }`}</style>
      <div className="p-8 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Generate Invoices
        </h2>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gradient-to-r from-[#295A47] to-[#3a7d5f] text-white font-semibold">
              <tr>
                <th className="h-full px-3 py-2 text-center">Appointment ID</th>
                <th className="px-3 py-2 text-center">Agent ID</th>
                <th className="px-3 py-2 text-center">Agent Name</th>
                <th className="px-3 py-2 text-center">Project Name</th>
                <th className="px-3 py-2 text-center">Transaction Proof</th>
                <th className="px-3 py-2 text-center">Generate Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-12">
                {/* Appointment column with search */}
                <td className="px-2 py-1 border">
                  <div className="flex space-x-2">
                    <select
                      value={appointmentInput}
                      onChange={(e) => {
                        setAppointmentInput(e.target.value);
                      }}
                      className="flex-1 border rounded px-2 py-1"
                    >
                      <option value="">Select Appointment ID</option>
                      {appointmentIds.map(
                        (item: { appointment_id: string }, index) => (
                          <option
                            key={`${item.appointment_id}-${index}`}
                            value={item.appointment_id.trim()}
                          >
                            {item.appointment_id.trim()}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      onClick={handleSearch}
                      disabled={loadingProjects}
                      className={`px-3 py-1 text-white rounded ${
                        loadingProjects
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-700"
                      }`}
                    >
                      {loadingProjects ? "Loading..." : "Search"}
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                  )}
                </td>

                {/* Agent ID */}
                <td className="px-3 py-1 border text-center">
                  {selectedAppointment?.agentId || ""}
                </td>

                {/* Agent Name */}
                <td className="px-3 py-1 border text-center">
                  {selectedAppointment?.agentName || ""}
                </td>

                {/* Project Name */}
                <td className="px-3 py-1 border text-center">
                  {selectedAppointment?.projectName || ""}
                </td>

                {/* Transaction Proof Button */}
                <td className="px-3 py-1 border text-center">
                  <button
                    onClick={() => handleProofView(appointmentInput)}
                    disabled={!appointmentInput}
                    className={`px-4 py-1 rounded text-white ${
                      appointmentInput
                        ? "bg-red-500 hover:bg-red-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    View
                  </button>
                </td>

                {/* Generate Invoice Button */}
                <td className="px-3 py-1 border text-center">
                  <button
                    onClick={handleInvoiceClick}
                    disabled={!selectedAppointment}
                    className={`px-4 py-1 rounded text-white ${
                      selectedAppointment
                        ? "bg-red-500 hover:bg-red-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Invoice
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Generated Invoices List */}
        {invoicesList.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Generated Invoices
            </h3>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-[#295A47] text-white font-semibold">
                  <tr>
                    <th className="px-3 py-2">SL NO</th>
                    <th className="px-3 py-2">Invoice ID</th>
                    <th className="px-3 py-2">Appointment ID</th>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Due Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Download PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesList.map((invoice, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{invoice.invoiceId}</td>
                      <td className="px-3 py-2">{invoice.appointmentId}</td>
                      <td className="px-3 py-2">{invoice.agentDetails.name}</td>
                      <td className="px-3 py-2">
                        {invoice.clientDetails.name}
                      </td>
                      <td className="px-3 py-2">
                        {invoice.propertyDetails.name}
                      </td>
                      <td className="px-3 py-2">
                        INR {invoice.paid.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        INR {invoice.due.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const d = new Date(invoice.invoiceDate);
                          return `${String(d.getDate()).padStart(
                            2,
                            "0"
                          )}-${String(d.getMonth() + 1).padStart(
                            2,
                            "0"
                          )}-${d.getFullYear()}`;
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() =>
                            generatePDF(invoice, invoice.invoiceId)
                          }
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-900 text-xs"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Previous Invoices Modal */}
        {showPreviousInvoices && (
          <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-6 rounded-t-lg">
                <h3 className="text-3xl font-bold text-center">
                  Previous Invoices for {selectedAppointment?.projectName}
                </h3>
              </div>
              <div className="p-8">
                {invoicesList.filter(
                  (invoice) =>
                    invoice.appointmentId === selectedAppointment?.appointmentId
                ).length > 0 ? (
                  <div className=" overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="bg-[#D7E7D0] text-red font-semibold">
                        <tr>
                          <th className="px-3 py-2">Invoice ID</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Agent's Share</th>
                          <th className="px-3 py-2">Paid</th>
                          <th className="px-3 py-2">Due</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Download PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesList
                          .filter(
                            (invoice) =>
                              invoice.appointmentId ===
                              selectedAppointment?.appointmentId
                          )
                          .map((invoice, index) => {
                            const invoiceId = `INV-${String(
                              invoicesList.indexOf(invoice) + 1
                            ).padStart(3, "0")}`;
                            return (
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-3 py-2">{invoiceId}</td>
                                <td className="px-3 py-2">
                                  {invoice.invoiceDate}
                                </td>
                                <td className="px-3 py-2">
                                  {invoice.invoiceTime}
                                </td>
                                <td className="px-3 py-2">
                                  ₹{invoice.agentShare.toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  ₹{invoice.paid.toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  ₹{invoice.due.toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      invoice.paymentStatus === "Paid"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {invoice.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() =>
                                      generatePDF(invoice, invoiceId)
                                    }
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                  >
                                    PDF
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No previous invoices found for this project.
                  </p>
                )}
              </div>
              <div className="bg-gray-100 p-6 rounded-b-lg flex justify-end">
                <button
                  onClick={() => setShowPreviousInvoices(false)}
                  className={`px-2 py-1 rounded-xl text-white ${
                    selectedAppointment
                      ? "bg-red-500 hover:bg-green-900"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {modalOpen && invoiceData && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#295A47]">
                      Invoice {invoiceData.invoiceId}
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base">
                      Appointment {invoiceData.appointmentId}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Receipt/Proof Section */}
                  <div className="space-y-4">
                    {/* Uploaded Receipt Preview */}
                    {uploadedImage || invoiceData.proof ? (
                      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={uploadedImage || invoiceData.proof!}
                          alt="Receipt/Proof"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder_person.jpg";
                          }}
                        />
                        <button
                          onClick={() => {
                            setUploadedImage(null);
                            if (invoiceData) {
                              setInvoiceData({ ...invoiceData, proof: null });
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition"
                          aria-label="Remove uploaded image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <div className="text-center">
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No receipt uploaded</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Receipt Button */}
                    <label
                      htmlFor="receiptUpload"
                      className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] transition-colors flex items-center justify-center space-x-2 text-sm font-medium cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Receipt</span>
                    </label>
                    <input
                      type="file"
                      id="receiptUpload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setUploadedImage(base64);
                            if (invoiceData) {
                              setInvoiceData({ ...invoiceData, proof: base64 });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  {/* Invoice Details */}
                  <div className="space-y-6">
                    {/* Invoice Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            invoiceData.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoiceData.paymentStatus}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice ID:</span>
                          <span className="font-medium">
                            {invoiceData.invoiceId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Appointment ID:</span>
                          <span className="font-medium">
                            {invoiceData.appointmentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Date:</span>
                          <span className="font-medium">
                            {(() => {
                              const d = new Date(invoiceData.invoiceDate);
                              return `${String(d.getDate()).padStart(
                                2,
                                "0"
                              )}-${String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              )}-${d.getFullYear()}`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Time:</span>
                          <span className="font-medium">
                            {invoiceData.invoiceTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agent Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Agent Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agent Name:</span>
                          <span className="font-medium">
                            {invoiceData.agentDetails.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Agent ID:</span>
                          <span className="font-medium">
                            {invoiceData.agentDetails.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Client Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Client Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Client Name:</span>
                          <span className="font-medium">
                            {invoiceData.clientDetails.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Property Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project Name:</span>
                          <span className="font-medium">
                            {selectedAppointment?.projectName || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">
                            {selectedAppointment?.location || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Financial Details
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-green-600 text-white">
                              <th className="px-4 py-2 text-left font-medium">
                                Description
                              </th>
                              <th className="px-4 py-2 text-left font-medium">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 font-medium">
                                Total Estimate
                              </td>
                              <td className="px-4 py-2">
                                ₹{invoiceData.totalEstimate.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 font-medium">
                                Agent's Share
                              </td>
                              <td className="px-4 py-2">
                                ₹
                                {selectedAppointment?.agentShare.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 font-medium">Paid</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={invoiceData.paid}
                                  onChange={(e) =>
                                    handlePaidChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "ArrowUp" ||
                                      e.key === "ArrowDown"
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500 appearance-none"
                                  placeholder="0"
                                  style={{ MozAppearance: "textfield" }}
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 font-medium">
                                Total Paid
                              </td>
                              <td className="px-4 py-2">
                                ₹
                                {(
                                  invoiceData.agentPaid + invoiceData.paid
                                ).toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300">
                              <td className="px-4 py-2 font-medium">Due</td>
                              <td className="px-4 py-2">
                                ₹{invoiceData.due.toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium">
                                Payment Status
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`${
                                    invoiceData.paymentStatus === "Paid"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  } font-semibold`}
                                >
                                  {invoiceData.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowPreviousInvoices(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                      >
                        View Previous
                      </button>
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleSave}
                        className={`px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm ${
                          selectedAppointment
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Proof Modal */}
        {showProofModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-6 rounded-t-lg flex justify-between items-center">
                <h3 className="text-3xl font-bold text-center flex-1">
                  Transaction Proofs for {currentAppointmentId}
                </h3>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-white text-3xl font-bold hover:text-gray-300 ml-auto"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="p-8">
                {transactionProofs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {transactionProofs.map((proof, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <img
                          src={proof.transaction_proof || proof.image || proof}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-auto rounded mb-2"
                        />
                        <p className="text-sm text-gray-600 mb-2">
                          Date: {proof.date}
                        </p>
                        <a
                          href={proof.transaction_proof || proof.image || proof}
                          download
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No transaction proofs found.
                  </p>
                )}
              </div>
              <div className="bg-gray-100 p-6 rounded-b-lg flex justify-end">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoicesTable;
