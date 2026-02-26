'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  client_id: string;
  client_name: string;
  project_name: string;
  total_bill: number;
  paid: number;
  outstanding: number;
}

interface Client {
  user_id: string;
  name: string;
  email: string;
  total_projects: number;
  total_bill: number;
  total_paid: number;
  total_outstanding: number;
}

interface LedgerEntry {
  id: number;
  type: 'charge' | 'payment' | 'adjustment' | 'extra_work';
  amount: number;
  description: string;
  payment_method?: string;
  transaction_proof_path?: string;
  status: string;
  created_at: string;
}

const InteriorPaymentsAdmin = () => {
  const [view, setView] = useState<'clients' | 'projects'>('clients');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'charges' | 'payments' | 'adjustments'>('ledger');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    if (view === 'clients') {
      fetchClients();
    } else {
      fetchProjects();
    }
  }, [view]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/interior-payments/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      } else {
        toast.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/interior-payments');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        toast.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientProjects = async (clientId: string) => {
    try {
      const response = await fetch(`/api/superadmin/interior-payments?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClientProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching client projects:', error);
    }
  };

  const fetchProjectDetails = async (projectId: number) => {
    try {
      const response = await fetch(`/api/superadmin/interior-payments/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setLedger(data.ledger);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    fetchProjectDetails(project.id);
    setActiveTab('ledger');
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    fetchClientProjects(client.user_id);
  };

  const handleApproveReject = async (entryId: number, action: 'approve' | 'reject') => {
    setApproving(entryId);
    try {
      const response = await fetch(`/api/superadmin/interior-payments/ledger/${entryId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(`Payment ${action}d successfully`);
        if (selectedProject) {
          fetchProjectDetails(selectedProject.id);
          fetchProjects(); // Refresh summaries
        }
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} payment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      toast.error(`Failed to ${action} payment`);
    } finally {
      setApproving(null);
    }
  };

  const filterLedger = (type: 'charge' | 'payment' | 'adjustment') => {
    return ledger.filter(entry => entry.type === type);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading interior payments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47] mb-3 sm:mb-4">Interior Project Payments Admin</h1>
        <p className="text-gray-600">Manage interior project payments and approvals</p>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 justify-center">
        <button
          onClick={() => {
            setView('clients');
            setSelectedProject(null);
            setSelectedClient(null);
          }}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === 'clients'
              ? 'bg-[#295A47] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Clients
        </button>
        <button
          onClick={() => {
            setView('projects');
            setSelectedProject(null);
            setSelectedClient(null);
          }}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === 'projects'
              ? 'bg-[#295A47] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Projects
        </button>
      </div>

      {/* Clients View */}
      {view === 'clients' && !selectedClient ? (
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="min-w-[980px] w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-[#D7E7D0]">
                <th className="border border-gray-300 px-4 py-2 text-left">Client Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Projects</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Total Bill</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Paid</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Outstanding</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.user_id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold">{client.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{client.email}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                      {client.total_projects}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₹{client.total_bill.toLocaleString('en-IN')}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-green-600 font-semibold">
                    ₹{client.total_paid.toLocaleString('en-IN')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-red-600 font-semibold">
                    ₹{client.total_outstanding.toLocaleString('en-IN')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => handleClientClick(client)}
                      className="px-3 py-1 bg-[#295A47] text-white rounded hover:bg-[#1a3a2f] transition text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No clients with interior payment accounts found.
            </div>
          )}
        </div>
      ) : view === 'clients' && selectedClient ? (
        // Client Details View
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#295A47]">{selectedClient.name}</h2>
              <p className="text-gray-600">Email: {selectedClient.email}</p>
              <p className="text-gray-600">Total Outstanding: ₹{selectedClient.total_outstanding.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Back to Clients
            </button>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-[#295A47]">Client Projects ({clientProjects.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {clientProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  handleProjectClick(project);
                  setView('projects');
                }}
                className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47] hover:shadow-xl cursor-pointer transition"
              >
                <h3 className="text-xl font-semibold text-[#295A47] mb-2">{project.project_name}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Bill: ₹{project.total_bill.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-600">Paid: ₹{project.paid.toLocaleString('en-IN')}</p>
                  <p className="text-lg font-semibold text-[#295A47]">Outstanding: ₹{project.outstanding.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedProject ? (
        // Projects Overview
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47] hover:shadow-xl cursor-pointer transition"
            >
              <h3 className="text-xl font-semibold text-[#295A47] mb-2">{project.project_name}</h3>
              <p className="text-sm text-gray-600 mb-1">Client: {project.client_name}</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Bill: ₹{project.total_bill.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-600">Paid: ₹{project.paid.toLocaleString('en-IN')}</p>
                <p className="text-lg font-semibold text-[#295A47]">Outstanding: ₹{project.outstanding.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Project Details
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#295A47]">{selectedProject.project_name}</h2>
              <p className="text-gray-600">Client: {selectedProject.client_name}</p>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              {view === 'clients' ? 'Back to Client' : 'Back to Projects'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-6">
            {(['ledger', 'charges', 'payments', 'adjustments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  activeTab === tab
                    ? 'bg-[#295A47] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'ledger' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Complete Ledger</h3>
                <div className="w-full overflow-x-auto overscroll-x-contain">
                  <table className="min-w-[860px] w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#D7E7D0]">
                        <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 capitalize">
                            {entry.type === 'adjustment' ? 'cancelled work' : entry.type === 'extra_work' ? 'extra work' : entry.type}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">₹{entry.amount.toLocaleString('en-IN')}</td>
                          <td className="border border-gray-300 px-4 py-2">{entry.description}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              entry.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : entry.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(entry.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'charges' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Billing Charges</h3>
                <div className="w-full overflow-x-auto overscroll-x-contain">
                  <table className="min-w-[680px] w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#D7E7D0]">
                        <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterLedger('charge').map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">₹{entry.amount.toLocaleString('en-IN')}</td>
                          <td className="border border-gray-300 px-4 py-2">{entry.description}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(entry.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Payment Transactions</h3>
                <div className="w-full overflow-x-auto overscroll-x-contain">
                  <table className="min-w-[980px] w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#D7E7D0]">
                        <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Method</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Proof</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterLedger('payment').map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">₹{entry.amount.toLocaleString('en-IN')}</td>
                          <td className="border border-gray-300 px-4 py-2 capitalize">{entry.payment_method}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {entry.transaction_proof_path ? (
                              <img
                                src={entry.transaction_proof_path}
                                alt="Transaction Proof"
                                className="w-16 h-16 object-cover cursor-pointer rounded"
                                onClick={() => setModalImage(entry.transaction_proof_path!)}
                              />
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              entry.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : entry.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(entry.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {entry.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveReject(entry.id, 'approve')}
                                  disabled={approving === entry.id}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                                >
                                  {approving === entry.id ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleApproveReject(entry.id, 'reject')}
                                  disabled={approving === entry.id}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                                >
                                  {approving === entry.id ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'adjustments' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Adjustments</h3>
                <div className="w-full overflow-x-auto overscroll-x-contain">
                  <table className="min-w-[680px] w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#D7E7D0]">
                        <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterLedger('adjustment').map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">₹{entry.amount.toLocaleString('en-IN')}</td>
                          <td className="border border-gray-300 px-4 py-2">{entry.description}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(entry.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for viewing transaction proof */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-full overflow-auto relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
            <img
              src={modalImage}
              alt="Transaction Proof"
              className="max-w-full max-h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InteriorPaymentsAdmin;
