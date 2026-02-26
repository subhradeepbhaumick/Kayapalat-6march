'use client';

import React, { useState, useEffect } from 'react';
import { Menu, FileText, CreditCard, Plus, Pencil } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Client {
  user_id: string;
  name: string;
  email: string;
}

interface Project {
  id: number;
  client_id?: string;
  client_name?: string;
  project_name: string;
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
  type: 'charge' | 'payment' | 'adjustment' | 'work' | 'extra_work';
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
  entry_id?: number; // For approve/reject actions
}

const InteriorPaymentsAdmin = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Projects');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingEntryKey, setEditingEntryKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deliveryDaysInput, setDeliveryDaysInput] = useState('');
  const [approving, setApproving] = useState<{[key: string]: boolean}>({});
  const [addForm, setAddForm] = useState({
    entry_type: 'charge' as 'charge' | 'payment' | 'adjustment' | 'work' | 'extra_work',
    amount: '',
    description: '',
    payment_method: 'cash' as 'cash' | 'online',
    adjustment_type: 'debit' as 'credit' | 'debit',
    adjustment_category: 'adjustment' as 'adjustment' | 'work',
    work_action: 'add' as 'add' | 'deduct',
    gst_rate: '18',
    gst_included: false as boolean,
    transaction_proof: null as File | null,
  });
  const [createForm, setCreateForm] = useState({
    client_id: '',
    project_name: '',
    delivery_days_total: '',
  });

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchClients();
    }
  }, [session]);

  useEffect(() => {
    fetchProjects();
  }, [selectedClient]);

  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [projects]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/superadmin/clients');
      if (response.ok) {
        const data = await response.json();
        console.log('Clients fetched:', data.clients);
        setClients(data.clients);
      } else {
        console.error('Error fetching clients:', response.statusText);
        toast.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error fetching clients');
    }
  };

  const fetchProjects = async () => {
    try {
      const url = selectedClient ? `/api/superadmin/interior-payments?clientId=${selectedClient}` : '/api/superadmin/interior-payments';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchLedger = async (projectId: number) => {
    try {
      const response = await fetch(`/api/superadmin/interior-payments/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setLedger(data.ledger);
        if (data.project) {
          setSelectedProject(prev => prev ? { ...prev, ...data.project } : prev);
        }
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    fetchLedger(project.id);
    setActiveTab('Ledger');
  };

  const handleAddEntry = async () => {
    if (!selectedProject || !addForm.amount) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('entry_type', addForm.entry_type);
      formData.append('project_id', selectedProject.id.toString());
      formData.append('amount', addForm.amount);
      formData.append('description', addForm.description);

      if (addForm.entry_type === 'payment') {
        formData.append('payment_method', addForm.payment_method);
        if (addForm.payment_method === 'online' && addForm.transaction_proof) {
          formData.append('transaction_proof', addForm.transaction_proof);
        }
      }

      if (addForm.entry_type === 'adjustment' || addForm.entry_type === 'work' || addForm.entry_type === 'extra_work') {
        const adjustmentType = addForm.entry_type === 'adjustment'
          ? 'debit'
          : addForm.entry_type === 'extra_work'
            ? 'credit'
            : (addForm.work_action === 'add' ? 'credit' : 'debit');
        formData.append('adjustment_type', adjustmentType);
        formData.append('adjustment_category', addForm.entry_type === 'extra_work' ? 'work' : addForm.entry_type === 'work' ? 'work' : 'adjustment');
        formData.append('gst_rate', addForm.gst_rate || '18');
        formData.append('gst_included', addForm.entry_type === 'adjustment' ? '0' : (addForm.gst_included ? '1' : '0'));
      }

      if (addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work') {
        formData.append('gst_rate', addForm.gst_rate || '18');
        formData.append('gst_included', addForm.gst_included ? '1' : '0');
      }

      const response = await fetch('/api/superadmin/interior-payments/ledger', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Entry added successfully');
        setShowAddModal(false);
        setAddForm({
          entry_type: 'charge',
          amount: '',
          description: '',
          payment_method: 'cash',
          adjustment_type: 'debit',
          adjustment_category: 'adjustment',
          work_action: 'add',
          gst_rate: '18',
          gst_included: false,
          transaction_proof: null,
        });
        fetchLedger(selectedProject.id);
        fetchProjects(); // Refresh totals
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!createForm.client_id || !createForm.project_name) return;

    setLoading(true);
    try {
      const response = await fetch('/api/superadmin/interior-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: createForm.client_id,
          project_name: createForm.project_name,
          delivery_days_total: createForm.delivery_days_total ? Number(createForm.delivery_days_total) : null,
        }),
      });

      if (response.ok) {
        toast.success('Project created successfully');
        setShowCreateModal(false);
        setCreateForm({ client_id: '', project_name: '', delivery_days_total: '' });
        fetchProjects(); // Refresh projects
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (entry: LedgerEntry, action: 'approve' | 'reject') => {
    if (!selectedProject) return;

    const key = `${entry.type}-${entry.id}`;
    setApproving(prev => ({ ...prev, [key]: true }));

    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const idToUse = entry.entry_id || entry.id;
      const response = await fetch(`/api/superadmin/interior-payments/ledger/${idToUse}/${endpoint}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(`Entry ${action}d successfully`);
        // Update the local state
        setLedger(prev =>
          prev.map(e =>
            e.id === entry.id && e.type === entry.type
              ? { ...e, status: action === 'approve' ? 'confirmed' : 'declined' }
              : e
          )
        );
        fetchProjects(); // Refresh totals
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} entry`);
      }
    } catch (error) {
      console.error(`Error ${action}ing entry:`, error);
      toast.error(`Failed to ${action} entry`);
    } finally {
      setApproving(prev => ({ ...prev, [key]: false }));
    }
  };

  const getDaysRemaining = (dueDate?: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getGstPreview = () => {
    if ((addForm.entry_type !== 'charge' && addForm.entry_type !== 'adjustment' && addForm.entry_type !== 'work' && addForm.entry_type !== 'extra_work') || !addForm.amount) return null;
    const amount = Number(addForm.amount);
    const rate = Number(addForm.gst_rate || '18');
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!Number.isFinite(rate) || rate < 0) return null;
    const isIncluded = addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work' ? addForm.gst_included : false;

    let baseAmount, gstAmount, totalAmount;
    if (isIncluded) {
      totalAmount = amount;
      baseAmount = Number((totalAmount / (1 + rate / 100)).toFixed(2));
      gstAmount = Number((totalAmount - baseAmount).toFixed(2));
    } else {
      baseAmount = amount;
      gstAmount = Number((baseAmount * (rate / 100)).toFixed(2));
      totalAmount = Number((baseAmount + gstAmount).toFixed(2));
    }
    return { baseAmount, gstAmount, totalAmount };
  };

  const getEntryKey = (entry: LedgerEntry) => `${entry.type}-${entry.id}`;
  const canEditLedgerEntry = (entry: LedgerEntry) => entry.type !== 'payment';

  const startEditLedgerEntry = (entry: LedgerEntry) => {
    if (!canEditLedgerEntry(entry)) return;
    setEditingEntryKey(getEntryKey(entry));
    setEditForm({
      amount: String(entry.base_amount ?? entry.amount ?? ''),
      description: entry.description || '',
    });
  };

  const cancelEditLedgerEntry = () => {
    if (savingEdit) return;
    setEditingEntryKey(null);
    setEditForm({ amount: '', description: '' });
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
      toast.error('Please enter a valid amount');
      return;
    }

    setSavingEdit(true);
    try {
      const entryId = entry.entry_id || entry.id;
      const response = await fetch(`/api/superadmin/interior-payments/ledger/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: entry.type,
          amount,
          description: editForm.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update entry');
        return;
      }

      toast.success('Ledger entry updated');
      if (selectedProject) {
        await fetchLedger(selectedProject.id);
      }
      fetchProjects();
      setEditingEntryKey(null);
      setEditForm({ amount: '', description: '' });
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpdateDelivery = async () => {
    if (!selectedProject || !deliveryDaysInput) return;
    const deliveryDays = Number(deliveryDaysInput);
    if (!Number.isFinite(deliveryDays) || deliveryDays <= 0) {
      toast.error('Please enter valid delivery days');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/superadmin/interior-payments/${selectedProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_days_total: deliveryDays }),
      });

      if (response.ok) {
        toast.success('Delivery time updated');
        setShowDeliveryModal(false);
        setDeliveryDaysInput('');
        fetchLedger(selectedProject.id);
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update delivery time');
      }
    } catch (error) {
      console.error('Error updating delivery time:', error);
      toast.error('Failed to update delivery time');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { icon: FileText, label: 'Projects', key: 'Projects' },
    { icon: CreditCard, label: 'Ledger', key: 'Ledger' },
  ];

  return (
    <div className="min-h-screen bg-[#D2EBD0] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-64'}`}>
        <div className="p-4 border-b bg-[#D7E7D0]">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && <h2 className="text-lg font-semibold text-[#295A47]">Interior Payments</h2>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center py-3 cursor-pointer ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'} ${activeTab === item.key ? 'bg-[#D7E7D0] text-[#295A47]' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden pt-20 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="p-4 md:p-8">
          <div className="max-w-8xl mx-auto">
            <div className="min-w-0 bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
              {activeTab === 'Projects' && (
                <>
                  <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47] mb-3 sm:mb-4">Interior Projects</h1>
                    <p className="text-gray-600">Manage interior project payments</p>
                  </div>

                  <div className="mb-6 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-center">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <label className="text-sm font-medium">Filter by Client:</label>
                      <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">All Clients</option>
                        {clients.map(client => (
                          <option key={client.user_id} value={client.user_id}>
                            {client.name} ({client.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={fetchProjects}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        Filter
                      </button>
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
                      <div key={project.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]">
                        <h3 className="text-xl font-semibold text-[#295A47] mb-2">{project.project_name}</h3>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">Amount (excluding GST): ₹{(project.base_total ?? 0).toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">GST: ₹{(project.gst_total ?? 0).toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">Total (including GST): ₹{(project.gross_total ?? 0).toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">Paid: ₹{project.paid.toLocaleString('en-IN')}</p>
                          <p className="text-lg font-semibold text-[#295A47]">Outstanding (including GST): ₹{project.outstanding_including_gst.toLocaleString('en-IN')}</p>
                          {project.client_name && (
                            <p className="text-sm text-gray-600">Client: {project.client_name}</p>
                          )}
                          {project.delivery_due_date ? (
                            <p className="text-sm text-gray-600">Delivery: {getDaysRemaining(project.delivery_due_date)} days left</p>
                          ) : (
                            <p className="text-sm text-gray-500">Delivery not set</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleProjectSelect(project)}
                          className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] transition"
                        >
                          View Ledger
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'Ledger' && selectedProject && (
                <>
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#295A47] mb-2">
                        Ledger - {selectedProject.project_name}
                        {selectedProject.client_name && (
                          <span className="block sm:inline sm:ml-3 text-sm font-medium text-gray-600">Client: {selectedProject.client_name}</span>
                        )}
                        {selectedProject.delivery_due_date && (
                          <span className="block sm:inline sm:ml-3 text-sm font-medium text-gray-600">
                            Delivery: {getDaysRemaining(selectedProject.delivery_due_date)} days left
                          </span>
                        )}
                      </h1>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div>Amount (excluding GST): ₹{(selectedProject.base_total ?? 0).toLocaleString('en-IN')}</div>
                        <div>GST: ₹{(selectedProject.gst_total ?? 0).toLocaleString('en-IN')}</div>
                        <div>Total (including GST): ₹{(selectedProject.gross_total ?? 0).toLocaleString('en-IN')}</div>
                        <div>Outstanding (including GST): ₹{selectedProject.outstanding_including_gst.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <div className="flex w-full lg:w-auto flex-wrap gap-3">
                      <button
                        onClick={() => setShowDeliveryModal(true)}
                        className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Set Delivery Time
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full sm:w-auto bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#1e3d32] flex items-center justify-center"
                      >
                        <Plus size={20} className="mr-2" />
                        Add Entry
                      </button>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto overscroll-x-contain">
                    <table className="min-w-[980px] w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-[#D7E7D0]">
                          <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Amount (₹)</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">GST Details</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((entry) => (
                          <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 capitalize">
                              {entry.type === 'work'
                                ? `Work (${entry.adjustment_type === 'credit' ? 'addition' : 'deduction'})`
                                : entry.type === 'extra_work'
                                  ? 'extra work'
                                : entry.type === 'adjustment'
                                  ? 'cancelled work'
                                  : entry.type}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {editingEntryKey === getEntryKey(entry) ? (
                                <input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-36 px-2 py-1 border border-gray-300 rounded"
                                  min={0}
                                  step="0.01"
                                />
                              ) : (
                                entry.type === 'charge' || entry.type === 'adjustment' || entry.type === 'work' || entry.type === 'extra_work'
                                  ? (entry.adjustment_type === 'debit' ? `-₹${(entry.total_amount ?? 0).toLocaleString('en-IN')}` : `₹${(entry.total_amount ?? 0).toLocaleString('en-IN')}`)
                                  : `₹${entry.amount.toLocaleString('en-IN')}`
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {editingEntryKey === getEntryKey(entry) ? (
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full min-w-[220px] px-2 py-1 border border-gray-300 rounded"
                                />
                              ) : (
                                entry.description
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {entry.type === 'charge' || entry.type === 'adjustment' || entry.type === 'work' || entry.type === 'extra_work'
                                ? editingEntryKey === getEntryKey(entry)
                                  ? (() => {
                                      const preview = getInlineGstPreview(entry);
                                      if (!preview) return '—';
                                      return `GST ${preview.gstRate}% • GST: ₹${preview.gstAmount.toLocaleString('en-IN')} • Gross: ₹${preview.totalAmount.toLocaleString('en-IN')}`;
                                    })()
                                  : `GST ${entry.gst_rate ?? 0}% • GST: ₹${Number(entry.gst_amount || 0).toLocaleString('en-IN')} • Gross: ₹${Number(entry.total_amount || 0).toLocaleString('en-IN')}`
                                : '—'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                entry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                entry.status === 'declined' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
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
                                    onClick={() => handleToggle(entry, 'approve')}
                                    disabled={approving[`${entry.type}-${entry.id}`]}
                                    className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                                  >
                                    {approving[`${entry.type}-${entry.id}`] ? 'Confirming...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => handleToggle(entry, 'reject')}
                                    disabled={approving[`${entry.type}-${entry.id}`]}
                                    className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                                  >
                                    {approving[`${entry.type}-${entry.id}`] ? 'Declining...' : 'Decline'}
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
                                    {savingEdit ? 'Saving...' : 'Save'}
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
                                  title={canEditLedgerEntry(entry) ? 'Edit row' : 'Editing not available for payments'}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">Create New Project</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    value={createForm.client_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.user_id} value={client.user_id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={createForm.project_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, project_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (days)</label>
                  <input
                    type="number"
                    value={createForm.delivery_days_total}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, delivery_days_total: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. 30"
                    min={1}
                  />
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
                  disabled={loading || !createForm.client_id || !createForm.project_name}
                  className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">Add Ledger Entry</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                  <select
                    value={addForm.entry_type}
                    onChange={(e) => setAddForm(prev => ({ ...prev, entry_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="charge">Charge</option>
                    <option value="payment">Payment</option>
                    <option value="adjustment">Adjustments (Deduct Work)</option>
                    <option value="extra_work">Extra Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({(addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work') && addForm.gst_included ? 'including' : 'excluding'} GST) (₹)
                  </label>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={(e) => setAddForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter description"
                  />
                </div>

                {(addForm.entry_type === 'charge' || addForm.entry_type === 'adjustment' || addForm.entry_type === 'extra_work') && (
                  <div className="space-y-3">
                    {(addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Mode</label>
                        <select
                          value={addForm.gst_included ? 'including' : 'excluding'}
                          onChange={(e) => setAddForm(prev => ({ ...prev, gst_included: e.target.value === 'including' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="excluding">Excluding GST</option>
                          <option value="including">Including GST</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount ({(addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work') && addForm.gst_included ? 'including' : 'excluding'} GST) (₹)
                      </label>
                      <input
                        type="number"
                        value={addForm.amount}
                        onChange={(e) => setAddForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                      <input
                        type="number"
                        value={addForm.gst_rate}
                        onChange={(e) => setAddForm(prev => ({ ...prev, gst_rate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min={0}
                        step="0.01"
                      />
                    </div>

                    {getGstPreview() && (
                      <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        {(addForm.entry_type === 'charge' || addForm.entry_type === 'extra_work') && addForm.gst_included ? (
                          <>
                            <div>Total (including GST): ₹{getGstPreview()!.totalAmount.toLocaleString('en-IN')}</div>
                            <div>GST: ₹{getGstPreview()!.gstAmount.toLocaleString('en-IN')}</div>
                            <div>Amount (excluding GST): ₹{getGstPreview()!.baseAmount.toLocaleString('en-IN')}</div>
                          </>
                        ) : (
                          <>
                            <div>Amount (excluding GST): ₹{getGstPreview()!.baseAmount.toLocaleString('en-IN')}</div>
                            <div>GST: ₹{getGstPreview()!.gstAmount.toLocaleString('en-IN')}</div>
                            <div className="font-semibold">Total (including GST): ₹{getGstPreview()!.totalAmount.toLocaleString('en-IN')}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {addForm.entry_type === 'payment' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={addForm.payment_method}
                        onChange={(e) => setAddForm(prev => ({ ...prev, payment_method: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                      </select>
                    </div>

                    {addForm.payment_method === 'online' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Proof</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setAddForm(prev => ({ ...prev, transaction_proof: e.target.files?.[0] || null }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </>
                )}

                {addForm.entry_type === 'adjustment' && (
                  <p className="text-sm text-gray-600">Adjustment will be recorded as deduction from base amount (excluding GST).</p>
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
                  {loading ? 'Adding...' : 'Add Entry'}
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
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">Set Delivery Time</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time (days)</label>
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
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}
    </div>
  );
};

export default InteriorPaymentsAdmin;
