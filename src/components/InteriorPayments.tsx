'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Project {
  id: number;
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
}

const InteriorPayments = () => {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLedger, setShowLedger] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('online');
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getDaysRemaining = (dueDate?: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/client/interior-payments');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (projectId: number) => {
    try {
      const response = await fetch(`/api/client/interior-payments?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setLedger(data.ledger);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    }
  };

  const handleViewLedger = (project: Project) => {
    setSelectedProject(project);
    fetchLedger(project.id);
    setShowLedger(true);
  };

  const handleMakePayment = (project: Project) => {
    setSelectedProject(project);
    setShowPayment(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedProject || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('project_id', selectedProject.id.toString());
      formData.append('amount', amount.toString());
      formData.append('payment_method', paymentMethod);

      if (paymentMethod === 'online' && transactionProof) {
        formData.append('transaction_proof', transactionProof);
      }

      const response = await fetch('/api/client/interior-payments', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Payment submitted successfully');
        setShowPayment(false);
        setPaymentAmount('');
        setTransactionProof(null);
        fetchProjects(); // Refresh projects
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#295A47] mb-4">Interior Project Payments</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your interior project payments</p>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]"
          >
            <h3 className="text-xl font-semibold text-[#295A47] mb-2">{project.project_name}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Amount (excluding GST): ₹{(project.base_total ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">GST: ₹{(project.gst_total ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">Total (including GST): ₹{(project.gross_total ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">Paid: ₹{project.paid.toLocaleString('en-IN')}</p>
              <p className="text-lg font-semibold text-[#295A47]">Outstanding (including GST): ₹{project.outstanding_including_gst.toLocaleString('en-IN')}</p>
              {project.delivery_due_date ? (
                <p className="text-sm text-gray-600">Delivery: {getDaysRemaining(project.delivery_due_date)} days left</p>
              ) : (
                <p className="text-sm text-gray-500">Delivery not set</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleViewLedger(project)}
                className="flex-1 bg-gray-500 text-white text-sm py-1 px-2 sm:px-2 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
              >
                View Ledger
              </button>
              <button
                onClick={() => handleMakePayment(project)}
                className="flex-1 bg-[#295A47] text-white text-sm py-1 px-2 sm:px-2 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
              >
                Make Payment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Modal */}
      {showLedger && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#295A47] mb-4">
                Ledger - {selectedProject.project_name}
                {selectedProject.delivery_due_date && (
                  <span className="block sm:inline sm:ml-3 text-sm font-medium text-gray-600">
                    Delivery: {getDaysRemaining(selectedProject.delivery_due_date)} days left
                  </span>
                )}
              </h2>

              <div className="w-full overflow-x-auto overscroll-x-contain">
                <table className="min-w-[760px] w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-[#D7E7D0]">
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Amount (₹)</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">GST Details</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize">
                          {entry.type === 'work'
                            ? `Work (${entry.adjustment_type === 'credit' ? 'addition' : 'deduction'})`
                            : entry.type === 'extra_work'
                              ? 'extra work'
                            : entry.type === 'adjustment'
                              ? 'cancelled work'
                              : entry.type}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          {entry.type === 'charge'
                            ? `₹${(entry.total_amount ?? 0).toLocaleString('en-IN')}`
                            : entry.type === 'work' && entry.adjustment_type === 'debit'
                            ? `-₹${entry.amount.toLocaleString('en-IN')}`
                            : entry.type === 'work' && entry.adjustment_type === 'credit'
                            ? `₹${entry.amount.toLocaleString('en-IN')}`
                            : `₹${entry.amount.toLocaleString('en-IN')}`}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">{entry.description}</td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          {entry.type === 'charge'
                            ? `GST ${entry.gst_rate ?? 0}% • GST ₹${Number(entry.gst_amount || 0).toLocaleString('en-IN')} • Gross ₹${Number(entry.total_amount || 0).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
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
                        <td className="border border-gray-300 px-2 sm:px-4 py-2">
                          {new Date(entry.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLedger(false)}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">Make Payment - {selectedProject.project_name}</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter amount"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                      className="mr-2"
                    />
                    Cash
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'online')}
                      className="mr-2"
                    />
                    Online
                  </label>
                </div>
              </div>

              {paymentMethod === 'cash' ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Cash Payment</h4>
                  <p className="text-sm text-green-700">
                    Please contact Mr. John Bor at 7044400100 for payment status details.
                    Your payment will be approved by our superadmin shortly.
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Bank Details</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Bank:</strong> HDFC</p>
                      <p><strong>A/C No:</strong> 50200112029048</p>
                      <p><strong>IFSC Code:</strong> HDFC0004283</p>
                      <p><strong>Branch:</strong> BAGHAJATIN</p>
                      <p><strong>Name:</strong> KAYAPALAT</p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <img
                        src="/kayapalat_payment_qr.jpeg"
                        alt="Payment QR Code"
                        className="max-w-32 h-auto rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Payment Proof <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setTransactionProof(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowPayment(false);
                    setPaymentAmount('');
                    setTransactionProof(null);
                  }}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={submitting || (paymentMethod === 'online' && !transactionProof)}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50 text-sm sm:text-base"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteriorPayments;
