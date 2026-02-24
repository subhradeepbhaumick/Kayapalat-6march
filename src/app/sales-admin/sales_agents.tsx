'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Calendar, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useSession } from 'next-auth/react';

interface Project {
  agent_id: string;
  appointment_id: number;
  client_name: string;
  client_phone: string;
  location: string;
  project_value: number;
  commission: number;
  agent_share: number;
  property_type: string;
  cold_call_date: string;
  cold_call_time: string;
  cold_call_status: string;
  site_visit_date: string;
  site_visit_time: string;
  site_visit_status: string;
  booking_date: string;
  booking_time: string;
  booking_status: string;
  booking_id: string;
  agent_name: string;
}

const AgentsTab = () => {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      console.warn('No session found');
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/sales-admin/projects', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects.map((project: any) => ({
            agent_id: project.agent_id || 'N/A',
            agent_name: project.agent_name || 'N/A',
            appointment_id: project.appointment_id,
            client_name: project.client_name || 'N/A',
            client_phone: project.client_phone || 'N/A',
            location: project.location || 'N/A',
            project_value: project.project_value || 0,
            commission: project.commission || 0,
            agent_share: project.agent_share || 0,
            property_type: project.property_type || 'N/A',
            cold_call_date: project.cold_call_date || 'N/A',
            cold_call_time: project.cold_call_time || 'N/A',
            cold_call_status: project.cold_call_status || 'N/A',
            site_visit_date: project.site_visit_date || 'N/A',
            site_visit_time: project.site_visit_time || 'N/A',
            site_visit_status: project.site_visit_status || 'N/A',
            booking_date: project.booking_date || 'N/A',
            booking_time: project.booking_time || 'N/A',
            booking_status: project.booking_status || 'N/A',
            booking_id: project.booking_id || 'N/A',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [session, status]);

  // Extract agent names for dropdown
  const uniqueAgents = Array.from(new Set(projects.map((p) => p.agent_name)));
  const [selectedAgent, setSelectedAgent] = useState<string>('All');

  // Date filter states
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Filter logic
  const filteredProjects = projects.filter((project) => {
    const matchesAgent = selectedAgent === 'All' || project.agent_name === selectedAgent;
    const projectDate = new Date(project.cold_call_date !== 'N/A' ? project.cold_call_date : project.site_visit_date !== 'N/A' ? project.site_visit_date : project.booking_date !== 'N/A' ? project.booking_date : '1970-01-01');
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const matchesFromDate = !from || projectDate >= from;
    const matchesToDate = !to || projectDate <= to;
    return matchesAgent && matchesFromDate && matchesToDate;
  });

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-4">
          Projects Management
        </h1>
        <p className="text-gray-600 text-lg">
          View and manage projects assigned to agents.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-end items-center gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 block mb-1">From Date</label>
          <input
            type="date"
            className="border p-2 rounded-md mr-10"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">To Date</label>
          <input
            type="date"
            className="border p-2 rounded-md mr-145"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div>
          <label className="mr-3 font-medium text-gray-700">Agent:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="All">All</option>
            {uniqueAgents.map((agentName, index) => (
              <option key={index} value={agentName}>
                {agentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full border border-gray-200 bg-white">
          <thead className="bg-[#d7e7d0] text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Agent ID</th>
              <th className="px-4 py-2 border">Agent Name</th>
              <th className="px-4 py-2 border">Appointment ID</th>
              <th className="px-4 py-2 border">Client Name</th>
              <th className="px-4 py-2 border">Client Phone</th>
              <th className="px-4 py-2 border">Location</th>
              <th className="px-4 py-2 border">Project Value</th>
              <th className="px-4 py-2 border">Commission</th>
              <th className="px-4 py-2 border">Agent Share</th>
              <th className="px-4 py-2 border">Property Type</th>
              <th className="px-4 py-2 border">Booking Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <tr key={project.appointment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{project.agent_id}</td>
                  <td className="px-4 py-2 border text-center">{project.agent_name}</td>
                  <td className="px-4 py-2 border text-center">{project.appointment_id}</td>
                  <td className="px-4 py-2 border text-center">{project.client_name}</td>
                  <td className="px-4 py-2 border text-center">{project.client_phone}</td>
                  <td className="px-4 py-2 border text-center">{project.location}</td>
                  <td className="px-4 py-2 border text-center">₹{project.project_value.toLocaleString()}</td>
                  <td className="px-4 py-2 border text-center">{project.commission}%</td>
                  <td className="px-4 py-2 border text-center">₹{project.agent_share.toLocaleString()}</td>
                  <td className="px-4 py-2 border text-center">{project.property_type}</td>
                  <td className="px-4 py-2 border text-center">{project.booking_status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-4 text-gray-500 border"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No Projects Found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or check your database connection.
          </p>
        </div>
      )}
    </>
  );
};

export default AgentsTab;