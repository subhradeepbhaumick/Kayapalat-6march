'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  admin: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  profilePic: string;
  location: string;
  lastLeadDate: string | null;
}

interface ApiResponse {
  agents: Agent[];
  admins: string[];
}

const SuperAdmin_Agents = () => {

  const [agents, setAgents] = useState<Agent[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/superadmin/agents');
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data: ApiResponse = await response.json();
        setAgents(data.agents);
        setAdmins(data.admins);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Filters & search
  const [selectedAdmin, setSelectedAdmin] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Filter + Search logic
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      const matchesAdmin = selectedAdmin === 'All' || a.admin === selectedAdmin;
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchesSearch =
        (a.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (a.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (a.phone || '').includes(search) ||
        (a.location?.toLowerCase() || '').includes(search.toLowerCase());

      const join = new Date(a.joinDate);
      const matchesFrom = !fromDate || join >= fromDate;
      const matchesTo = !toDate || join <= toDate;

      return matchesAdmin && matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [agents, selectedAdmin, statusFilter, search, fromDate, toDate]);

  // Highlight search term
  const highlight = (text: string) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };



  // Handle admin change
  const handleAdminChange = async (agentId: number, newAdmin: string) => {
    try {
      const response = await fetch('/api/superadmin/agents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId, admin_id: newAdmin }),
      });
      if (!response.ok) {
        throw new Error('Failed to update admin');
      }
      // Update local state
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === agentId ? { ...agent, admin: newAdmin } : agent
        )
      );
    } catch (error) {
      console.error('Error updating admin:', error);
      // Optionally, show an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-2">Agents Management</h1>
        <p className="text-gray-600 text-lg">
          View and monitor all sales agents under all admins.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end">
        {/* Admin Filter */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Admin</label>
          <select
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
          >
            <option value="All">All</option>
            {admins.map((a, i) => (
              <option key={i} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">From Date</label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            placeholderText="Select start date"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">To Date</label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            placeholderText="Select end date"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <label className="block text-sm text-gray-600 mb-1">Search</label>
          <Search className="absolute left-3 top-9 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search agents..."
            className="pl-9 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full border border-gray-200 bg-white">
          <thead className="bg-[#d7e7d0] text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Agent ID</th>
              <th className="px-4 py-2 border">Profile</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Location</th>
              <th className="px-4 py-2 border">Admin</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Last Lead</th>
              <th className="px-4 py-2 border">Join Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent, index) => (
                <tr
                  key={agent.id}
                  className="hover:bg-green-50 transition"
                >
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border text-center">
                    <img
                      src={agent.profilePic}
                      alt={agent.name}
                      className="w-10 h-10 rounded-full mx-auto object-cover"
                    />
                  </td>
                  <td
                    className="px-4 py-2 border"
                    dangerouslySetInnerHTML={{ __html: highlight(agent.name) }}
                  />
                  <td
                    className="px-4 py-2 border"
                    dangerouslySetInnerHTML={{ __html: highlight(agent.email) }}
                  />
                  <td
                    className="px-4 py-2 border"
                    dangerouslySetInnerHTML={{ __html: highlight(agent.phone) }}
                  />
                  <td
                    className="px-4 py-2 border"
                    dangerouslySetInnerHTML={{ __html: highlight(agent.location) }}
                  />
                  <td className="px-4 py-2 border">
                    <select
                      value={agent.admin || ''}
                      onChange={(e) => handleAdminChange(agent.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="" disabled>Select to choose the admin_id</option>
                      {admins.map((a, i) => (
                        <option key={i} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className={`px-4 py-2 border text-center font-medium ${
                      agent.status === 'Active'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {agent.status}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {agent.lastLeadDate ? new Date(agent.lastLeadDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {new Date(agent.joinDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-4 text-gray-500 border"
                >
                  No matching agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No Agents Found
          </h3>
          <p className="text-gray-500">
            Try adjusting filters or check your data connection.
          </p>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin_Agents;
