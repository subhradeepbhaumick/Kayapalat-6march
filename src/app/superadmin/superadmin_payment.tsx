'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, Search, UserCog, X, Trash2, Upload } from 'lucide-react';

const PaymentsTab = () => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('All');
  const [showBankModal, setShowBankModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showNoBankDetailsPopup, setShowNoBankDetailsPopup] = useState(false);
  const [displayData, setDisplayData] = useState<any>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);
  const [currentAgentName, setCurrentAgentName] = useState<string>('');

  // Store transaction proofs per agent
  const [transactionProofs, setTransactionProofs] = useState<Record<string, any[]>>({});

  const [admins, setAdmins] = useState<any[]>([]);
  const [agentAdminMap, setAgentAdminMap] = useState<Record<string, string[]>>({});

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchPayments();
    fetchAdmins();
    fetchAgentAdminMap();
  }, []);

  const getAdminName = (agentId: string) => {
    for (const [adminId, agents] of Object.entries(agentAdminMap)) {
      if (agents.includes(agentId)) {
        const admin = admins.find(a => a.id === adminId);
        return admin ? admin.name : 'Unknown';
      }
    }
    return 'Unknown';
  };

  const getAdminId = (agentId: string): string | null => {
    for (const [adminId, agents] of Object.entries(agentAdminMap)) {
      if (agents.includes(agentId)) {
        return adminId;
      }
    }
    return null;
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/admins');
      const result = await response.json();
      if (result.success) {
        setAdmins(result.data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchAgentAdminMap = async () => {
    try {
      const response = await fetch('/api/superadmin/agent-admin-map');
      const result = await response.json();
      if (result.success) {
        setAgentAdminMap(result.data);
      }
    } catch (error) {
      console.error('Error fetching agent-admin map:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/superadmin/payments');
      const result = await response.json();
      if (result.success) {
        setPayments(result.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (appointmentId: string, field: string, value: any) => {
    try {
      const response = await fetch('/api/superadmin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          [field]: value,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Error updating payment:', result.error);
        // Revert local state on error
        fetchPayments();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      // Revert local state on error
      fetchPayments();
    }
  };

  const handleInputChange = (id: string, field: string, value: number) => {
    // Update local state immediately for better UX
    setPayments(prev =>
      prev.map(row =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              ...(field === 'agent_share'
                ? {
                    due: Math.max(value - row.agent_paid, 0),
                  }
                : field === 'agent_paid'
                ? {
                    due: Math.max(row.agent_share - value, 0),
                  }
                : {}),
            }
          : row
      )
    );

    // Update backend for both agent_share and agent_paid
    if (field === 'agent_share' || field === 'agent_paid') {
      updatePayment(id, field, value);
    }
  };

  const handleStatusChange = (id: string, value: string) => {
    // Update local state immediately
    setPayments(prev =>
      prev.map(row =>
        row.id === id ? { ...row, payment_status: value } : row
      )
    );

    // Update backend
    updatePayment(id, 'payment_status', value);
  };

  const handleBankView = async (agentId: string) => {
    try {
      const response = await fetch(`/api/superadmin/agents-bank-details?agent_id=${agentId}`);
      const result = await response.json();
      if (result.success) {
        setDisplayData(result.data);
        setShowBankModal(true);
      } else {
        // Find agent name from payments data
        const agent = payments.find(p => p.agent_id === agentId);
        setCurrentAgentId(agentId);
        setCurrentAgentName(agent?.agent_name || 'Unknown');
        setShowNoBankDetailsPopup(true);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const handleProofView = async (agentId: string, appointmentId: string) => {
    setCurrentAgentId(agentId);
    setCurrentAppointmentId(appointmentId);
    try {
      const response = await fetch(`/api/superadmin/payments/proofs?agent_id=${agentId}`);
      const result = await response.json();
      if (result.success) {
        setTransactionProofs(prev => ({
          ...prev,
          [agentId]: result.data
        }));
      }
    } catch (error) {
      console.error('Error fetching proofs:', error);
    }
    setShowProofModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentAgentId || !currentAppointmentId) return;
    const file = e.target.files?.[0];
    if (file) {
      const adminId = getAdminId(currentAgentId);
      if (!adminId) return;

      const formData = new FormData();
      formData.append('appointment_id', currentAppointmentId);
      formData.append('agent_id', currentAgentId);
      formData.append('admin_id', adminId);
      formData.append('file', file);

      try {
        const response = await fetch('/api/superadmin/payments/proofs', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          // Refresh proofs
          handleProofView(currentAgentId, currentAppointmentId);
        } else {
          console.error('Error uploading proof:', result.error);
        }
      } catch (error) {
        console.error('Error uploading proof:', error);
      }
    }
  };

  const handleDeleteProof = (agentId: string, proofId: number) => {
    setTransactionProofs(prev => ({
      ...prev,
      [agentId]: prev[agentId].filter(p => p.id !== proofId),
    }));
  };

  const highlightText = (text: string) => {
    if (!text || !searchTerm.trim()) return text || '';
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 text-black font-semibold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const filteredPayments = payments.filter(p => {
    const matchesAdmin =
      selectedAdmin === 'All' ||
      agentAdminMap[selectedAdmin]?.includes(p.agent_id);
    const matchesFilter = filter === 'All' || p.payment_status === filter;
    const matchesSearch =
      (p.agent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.agent_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBookingStatus = p.booking_status === 'Booked';
    return matchesAdmin && matchesFilter && matchesSearch && matchesBookingStatus;
  });

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-2">Payments</h1>
        <p className="text-gray-600 text-lg">
          Analyze and manage payments by Admin and Agent.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-gray-600" />
          <label className="text-gray-700 font-medium">Admin:</label>
          <select
            value={selectedAdmin}
            onChange={e => setSelectedAdmin(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
          >
            <option value="All">All</option>
            {admins.map(admin => (
              <option key={admin.id} value={admin.id}>{admin.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <label className="text-gray-700 font-medium">Status:</label>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Due">Due</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300 rounded-md px-3 py-1 w-full sm:w-1/3 focus-within:ring-2 focus-within:ring-[#295A47]">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search by Agent ID, Agent or Client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full outline-none text-gray-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
          <thead className="bg-[#295A47] text-white">
            <tr>
              <th className="px-4 py-2">Sl. No</th>
              <th className="px-4 py-2">Appointment ID</th>
              <th className="px-4 py-2">Agent ID</th>
              <th className="px-4 py-2">Agent Name</th>
              <th className="px-4 py-2">Admin Name</th>
              <th className="px-4 py-2">Client Name</th>
              <th className="px-4 py-2">Project Name</th>
              <th className="px-4 py-2">Client Estimate</th>
              <th className="px-4 py-2">Commission (%)</th>
              <th className="px-4 py-2">Agent Share (₹)</th>
              <th className="px-4 py-2">Agent Paid (₹)</th>
              <th className="px-4 py-2">Due (₹)</th>
              <th className="px-4 py-2">Payment Status</th>
              <th className="px-4 py-2">Bank Details</th>
              <th className="px-4 py-2">Transaction Proof</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((row, i) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{row.id}</td>
                <td className="px-4 py-2">{highlightText(row.agent_id)}</td>
                <td className="px-4 py-2">{highlightText(row.agent_name)}</td>
                <td className="px-4 py-2">{getAdminName(row.agent_id)}</td>
                <td className="px-4 py-2">{highlightText(row.client_name)}</td>
                <td className="px-4 py-2">{row.project_name}</td>
                <td className="px-4 py-2">₹{(row.client_estimate || 0).toLocaleString()}</td>
                <td className="px-4 py-2">{row.commission}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={row.agent_share}
                    onChange={e =>(row.id, 'agent_share', Number(e.target.value))}
                    className="border rounded-md px-2 py-1 w-28 bg-gray-200 cursor-not-allowed"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={row.agent_paid}
                    onChange={e => handleInputChange(row.id, 'agent_paid', Number(e.target.value))}
                    className="border rounded-md px-2 py-1 w-28"
                  />
                </td>
                <td className="px-4 py-2">
                  <input type="number" readOnly value={row.due} className="border bg-gray-100 rounded-md px-2 py-1 w-28" />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={row.payment_status}
                    onChange={e => handleStatusChange(row.id, e.target.value)}
                    className={`px-2 py-1 rounded-md border text-white font-medium cursor-pointer ${
                      row.payment_status === 'Paid'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  >
                    <option value="Paid" className="text-black">Paid</option>
                    <option value="Due" className="text-black">Due</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    className="bg-[#295A47] text-white px-3 py-1 rounded-md hover:bg-[#3a6b58] transition-colors"
                    onClick={() => handleBankView(row.agent_id)}
                  >
                    View
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    className="bg-[#295A47] text-white px-3 py-1 rounded-md hover:bg-[#3a6b58] transition-colors"
                    onClick={() => handleProofView(row.agent_id, row.id)}
                  >
                    Post
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bank Details Modal */}
      {showBankModal && displayData && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 h-96 mx-4 p-6 relative overflow-y-auto">
            <button
              onClick={() => setShowBankModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Bank Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Account Holder Name</label>
                <p className="mt-1 text-gray-900">{displayData.account_holder_name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">UPI ID</label>
                <p className="mt-1 text-gray-900">{displayData.upi_id || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Bank Name</label>
                <p className="mt-1 text-gray-900">{displayData.bank_name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Account Number</label>
                <p className="mt-1 text-gray-900">{displayData.account_number || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">IFSC Code</label>
                <p className="mt-1 text-gray-900">{displayData.ifsc_code || 'N/A'}</p>
              </div>

              {displayData.qr_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">UPI QR Code</label>
                  <img
                    src={displayData.qr_code}
                    alt="UPI QR Code"
                    className="mt-1 max-w-full h-auto max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Proof Modal */}
      {showProofModal && currentAgentId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 relative">
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Transaction Proofs - Agent {currentAgentId}
            </h2>

            <div className="flex items-center justify-center mb-6">
              <label className="cursor-pointer flex items-center gap-2 bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#3a6b58]">
                <Upload className="w-5 h-5" />
                Upload Proof
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="overflow-x-auto border-t pt-4">
              <table className="min-w-full border border-gray-300 text-center">
                <thead className="bg-[#295A47] text-white">
                  <tr>
                    <th className="px-4 py-2 border">Sl No</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Proof Image</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactionProofs[currentAgentId] || []).map((p, i) => (
                    <tr key={p.t_id} className="border-t">
                      <td className="px-4 py-2 border">{i + 1}</td>
                      <td className="px-4 py-2 border">{p.date}</td>
                      <td className="px-4 py-2 border">
                        <a
                          href={p.transaction_proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View
                        </a>
                      </td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleDeleteProof(currentAgentId, p.t_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!transactionProofs[currentAgentId] ||
                    transactionProofs[currentAgentId].length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="italic text-gray-500 py-4"
                      >
                        No transaction proofs uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Bank Details Popup */}
      {showNoBankDetailsPopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 mx-4 p-6 relative">
            <button
              onClick={() => setShowNoBankDetailsPopup(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Bank Details Not Found
            </h2>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Agent <strong>{currentAgentName}</strong> (ID: <strong>{currentAgentId}</strong>) has not provided their bank details yet.
              </p>
              <button
                onClick={() => setShowNoBankDetailsPopup(false)}
                className="bg-[#295A47] text-white px-4 py-2 rounded-md hover:bg-[#3a6b58] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentsTab;
