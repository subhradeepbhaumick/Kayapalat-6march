'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Designer {
  user_id: string;
  name: string;
  email: string;
}

interface Client {
  user_id: string;
  name: string;
  email: string;
}

interface Assignment {
  id: number;
  designer_id: string;
  client_id: string;
  assigned_by: string | null;
  created_at: string;
  designer_name: string | null;
  designer_email: string | null;
  client_name: string | null;
  client_email: string | null;
}

const SuperAdminDesignerAssignments: React.FC = () => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [filterDesigner, setFilterDesigner] = useState('');

  const fetchDesigners = async () => {
    try {
      const response = await fetch('/api/superadmin/designers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDesigners(data.designers);
      }
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/superadmin/clients', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const url = filterDesigner
        ? `/api/superadmin/designer-assignments?designer_id=${filterDesigner}`
        : '/api/superadmin/designer-assignments';
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigners();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [filterDesigner]);

  const handleAssign = async () => {
    if (!selectedDesigner || !selectedClient) {
      toast.error('Please select a designer and a client');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/superadmin/designer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designer_id: selectedDesigner, client_id: selectedClient }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Assignment saved');
        setSelectedClient('');
        fetchAssignments();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to assign client');
      }
    } catch (error) {
      console.error('Error assigning client:', error);
      toast.error('Failed to assign client');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!confirm('Remove this assignment?')) return;

    try {
      const response = await fetch(`/api/superadmin/designer-assignments?id=${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Assignment removed');
        fetchAssignments();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#295A47] mb-2">Designer Client Assignments</h1>
        <p className="text-gray-600">Assign clients to designers for uploads and quotations</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Create Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Designer</label>
            <select
              value={selectedDesigner}
              onChange={(e) => setSelectedDesigner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a designer</option>
              {designers.map(designer => (
                <option key={designer.user_id} value={designer.user_id}>
                  {designer.name} ({designer.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a client</option>
              {clients.map(client => (
                <option key={client.user_id} value={client.user_id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedDesigner || !selectedClient}
              className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] disabled:opacity-50 flex items-center justify-center"
            >
              <Link2 size={18} className="mr-2" />
              {assigning ? 'Assigning...' : 'Assign Client'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Filter Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Designer</label>
            <select
              value={filterDesigner}
              onChange={(e) => setFilterDesigner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All designers</option>
              {designers.map(designer => (
                <option key={designer.user_id} value={designer.user_id}>
                  {designer.name} ({designer.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Existing Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-600">No assignments found.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-[#295A47]">
                    {assignment.designer_name || assignment.designer_id} 
                    <span className="text-gray-500">→</span> 
                    {assignment.client_name || assignment.client_id}
                  </p>
                  <p className="text-sm text-gray-600">Designer: {assignment.designer_email || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Client: {assignment.client_email || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Assigned: {new Date(assignment.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(assignment.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove assignment"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDesignerAssignments;
