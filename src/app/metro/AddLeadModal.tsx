'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

type AddLeadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        clientPhone: '',
        projectName: '',
        budget: '',
        location: '',
        details: '',
        propertyType: 'Residential',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.clientName.trim()) {
            setError('Client Name is required');
            return;
        }
        if (!formData.clientPhone.trim()) {
            setError('Client Phone is required');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/metro/add-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    clientName: formData.clientName.trim(),
                    clientPhone: formData.clientPhone.trim(),
                    projectName: formData.projectName.trim() || null,
                    budget: formData.budget ? parseInt(formData.budget) : null,
                    location: formData.location.trim() || null,
                    details: formData.details.trim() || null,
                    propertyType: formData.propertyType,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add lead');
            }

            // Reset form and close modal
            setFormData({
                clientName: '',
                clientPhone: '',
                projectName: '',
                budget: '',
                location: '',
                details: '',
                propertyType: 'Residential',
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#295A47]">Add New Lead</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Client Name - REQUIRED */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="Enter client name"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Client Phone - REQUIRED */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="clientPhone"
                            value={formData.clientPhone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Project Name - OPTIONAL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name
                        </label>
                        <input
                            type="text"
                            name="projectName"
                            value={formData.projectName}
                            onChange={handleChange}
                            placeholder="Enter project name (optional)"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Budget - OPTIONAL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Budget
                        </label>
                        <input
                            type="number"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            placeholder="Enter budget amount (optional)"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Location - OPTIONAL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter property location (optional)"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Property Type - OPTIONAL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Property Type
                        </label>
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none"
                        >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                        </select>
                    </div>

                    {/* Details - OPTIONAL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Details
                        </label>
                        <textarea
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            placeholder="Enter additional details (optional)"
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4335] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? 'Adding...' : 'Add Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;