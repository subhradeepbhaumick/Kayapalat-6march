'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Edit, Trash2, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Complaint {
  id: number;
  title: string;
  details: string;
  images: string[];
  status: 'pending' | 'addressed';
  admin_comments?: string;
  created_at: string;
  edited_at?: string;
}

const PostServiceTab = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    details: '',
    images: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/client/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (formData.images.length + files.length > 20) {
      toast.error('Maximum 20 images allowed');
      return;
    }

    setUploadingImages(true);
    const uploadedPaths: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formDataUpload
        });

        if (response.ok) {
          const data = await response.json();
          uploadedPaths.push(data.path);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedPaths]
      }));

      toast.success(`${uploadedPaths.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.details.trim()) {
      toast.error('Title and details are required');
      return;
    }

    try {
      const url = editingComplaint ? '/api/client/complaints' : '/api/client/complaints';
      const method = editingComplaint ? 'PUT' : 'POST';
      const body = editingComplaint
        ? { id: editingComplaint.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingComplaint ? 'Complaint updated successfully' : 'Complaint submitted successfully');
        setShowForm(false);
        setEditingComplaint(null);
        setFormData({ title: '', details: '', images: [] });
        fetchComplaints();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    }
  };

  const handleEdit = (complaint: Complaint) => {
    // Check 4-day edit window
    const createdAt = new Date(complaint.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 4) {
      toast.error('Edit window has expired (4 days)');
      return;
    }

    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      details: complaint.details,
      images: complaint.images || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    try {
      const response = await fetch(`/api/client/complaints?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Complaint deleted successfully');
        fetchComplaints();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete complaint');
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    }
  };

  const canEdit = (complaint: Complaint) => {
    const createdAt = new Date(complaint.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 4;
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
          Submit your complaint
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4">
          Action will be taken within 5 working days
        </p>
        <p className="text-gray-600 text-sm">
          Warranty upto 10 years{' '}
          <button
            onClick={() => setShowWarrantyModal(true)}
            className="text-[#295A47] underline hover:text-[#1e3d32]"
          >
            know more
          </button>
        </p>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={() => {
            setShowForm(true);
            setEditingComplaint(null);
            setFormData({ title: '', details: '', images: [] });
          }}
          className="bg-[#295A47] text-white px-6 py-3 rounded-lg hover:bg-[#1e3d32] transition flex items-center mx-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Complaint
        </button>
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white rounded-lg shadow-lg p-6 border">
            <h3 className="text-lg font-semibold text-[#295A47] mb-2">{complaint.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{complaint.details}</p>

            {complaint.images && complaint.images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Images ({complaint.images.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {complaint.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Complaint ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Status: <span className={`font-medium ${complaint.status === 'addressed' ? 'text-green-600' : 'text-yellow-600'}`}>
                {complaint.status}
              </span></span>
              <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>

            {complaint.admin_comments && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm font-medium text-gray-700">Admin Comment:</p>
                <p className="text-sm text-gray-600">{complaint.admin_comments}</p>
              </div>
            )}

            {canEdit(complaint) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(complaint)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition text-sm flex items-center justify-center"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(complaint.id)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition text-sm flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No complaints submitted yet.</p>
        </div>
      )}

      {/* Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#295A47]">
                  {editingComplaint ? 'Edit Complaint' : 'Submit Complaint'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingComplaint(null);
                    setFormData({ title: '', details: '', images: [] });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent"
                    placeholder="Enter complaint title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent h-32 resize-none"
                    placeholder="Describe your complaint in detail"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images ({formData.images.length}/20)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages || formData.images.length >= 20}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    <Upload size={20} className="mr-2" />
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                  </button>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingComplaint(null);
                      setFormData({ title: '', details: '', images: [] });
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] transition"
                  >
                    {editingComplaint ? 'Update' : 'Submit'} Complaint
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Warranty Modal */}
      {showWarrantyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#295A47]">Warranty Information</h2>
                <button
                  onClick={() => setShowWarrantyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-center">
                <Info size={48} className="text-[#295A47] mx-auto mb-4" />
                <p className="text-gray-600">
                  Please note that individual items warranty are different. Please refer to your quotations to check warranty details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostServiceTab;
