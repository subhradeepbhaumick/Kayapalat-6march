'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Eye, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Complaint {
  id: number;
  client_id: string;
  title: string;
  details: string;
  images: string[];
  status: 'pending' | 'addressed';
  admin_comments?: string;
  admin_commented_at?: string;
  created_at: string;
  client_name: string;
  client_email: string;
  client_phone: string;
}

interface Client {
  user_id: string;
  name: string;
  email: string;
}

const ClientComplaintsTab = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [selectedClient, selectedStatus, sortBy, sortOrder]);

  const fetchComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClient) params.append('clientId', selectedClient);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/superadmin/client-complaints?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints);
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedComplaint || !commentText.trim()) return;

    try {
      const response = await fetch('/api/superadmin/client-complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedComplaint.id,
          admin_comments: commentText
        })
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setShowCommentModal(false);
        setCommentText('');
        setSelectedComplaint(null);
        fetchComplaints();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = async (complaintId: number, newStatus: 'pending' | 'addressed') => {
    try {
      const response = await fetch('/api/superadmin/client-complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: complaintId,
          status: newStatus
        })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchComplaints();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
          Client Complaints
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          Manage and respond to client complaints
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.user_id} value={client.user_id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="addressed">Addressed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
            >
              <option value="created_at">Date</option>
              <option value="client_name">Client Name</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#D7E7D0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{complaint.client_name}</div>
                      <div className="text-sm text-gray-500">{complaint.client_email}</div>
                      <div className="text-sm text-gray-500">{complaint.client_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{complaint.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{complaint.details}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {complaint.images ? complaint.images.length : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value as 'pending' | 'addressed')}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="addressed">Addressed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setCommentText(complaint.admin_comments || '');
                          setShowCommentModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Add Comment"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {complaints.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No complaints found.</p>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#295A47]">Add Comment</h2>
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setSelectedComplaint(null);
                    setCommentText('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900">{selectedComplaint.title}</h3>
                <p className="text-sm text-gray-600">{selectedComplaint.client_name}</p>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent h-32 resize-none"
                placeholder="Enter your comment..."
              />

              <div className="flex gap-4 justify-end mt-4">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setSelectedComplaint(null);
                    setCommentText('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] transition"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#295A47]">Complaint Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Complaint Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <p className="text-gray-900">{selectedComplaint.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Details</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.details}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedComplaint.status === 'addressed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="text-gray-900">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedComplaint.client_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedComplaint.client_email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{selectedComplaint.client_phone}</p>
                    </div>
                  </div>

                  {selectedComplaint.admin_comments && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Admin Comment</h3>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.admin_comments}</p>
                        {selectedComplaint.admin_commented_at && (
                          <p className="text-sm text-gray-500 mt-2">
                            Commented on {new Date(selectedComplaint.admin_commented_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedComplaint.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Complaint image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientComplaintsTab;
