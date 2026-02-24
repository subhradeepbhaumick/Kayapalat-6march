'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Filter, Search, UserCog } from 'lucide-react';

const InvoiceTab = () => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('All');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [agentAdminMap, setAgentAdminMap] = useState<Record<string, string[]>>({});
  const [totalDue, setTotalDue] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
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

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/superadmin/invoices');
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data);
        setTotalDue(result.totalDue || 0);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesFilter = filter === 'All' || invoice.payment_status === filter;
    const matchesSearch =
      (invoice.agent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoice_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });



  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-2">Generated Invoices</h1>
        <p className="text-gray-600 text-lg">
          View and manage all generated invoices by Admin and Agent.
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
            placeholder="Search by Invoice No, Agent ID, Agent or Client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full outline-none text-gray-700"
          />
        </div>
      </div>
      
      {/* Summary */}
      {!loading && filteredInvoices.length > 0 && (
        <div className="mt-6 bg-[#D7E7D0] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold text-[#295A47]">
                {filteredInvoices.length}
              </h3>
              <p className="text-gray-700">Total Invoices</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#295A47]">
                ₹{filteredInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0).toLocaleString()}
              </h3>
              <p className="text-gray-700">Total Paid</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#295A47]">
                ₹{totalDue.toLocaleString()}
              </h3>
              <p className="text-gray-700">Total Due</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#295A47]">
                {filteredInvoices.filter(inv => inv.payment_status === 'Paid').length}
              </h3>
              <p className="text-gray-700">Paid</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
          <thead className="bg-[#295A47] text-white">
            <tr>
              <th className="px-4 py-2">Sl. No</th>
              <th className="px-4 py-2">Invoice ID</th>
              <th className="px-4 py-2">Agent</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Paid</th>
              <th className="px-4 py-2">Due Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47]"></div>
                    <span className="ml-2 text-gray-600">Loading invoices...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  No invoices found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice, i) => (
                <tr key={invoice.invoice_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{highlightText(invoice.invoice_id)}</td>
                  <td className="px-4 py-2">{highlightText(invoice.agent_name)}</td>
                  <td className="px-4 py-2">{highlightText(invoice.client_name)}</td>
                  <td className="px-4 py-2">{highlightText(invoice.project_name)}</td>
                  <td className="px-4 py-2">{highlightText(invoice.admin_name)}</td>
                  <td className="px-4 py-2">₹{(invoice.paid || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">₹{(invoice.due || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-white font-medium ${
                        invoice.payment_status === 'Paid'
                          ? 'bg-green-500'
                          : invoice.payment_status === 'Due'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {invoice.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(invoice.payment_date).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


    </>
  );
};

export default InvoiceTab;
