'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  plan_type: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface DesigningFeesProps {
  onViewTransactions: () => void;
}

const DesigningFees: React.FC<DesigningFeesProps> = ({ onViewTransactions }) => {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('online');
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    { type: '1BHK', amount: 20000 },
    { type: '2BHK', amount: 25000 },
    { type: '3BHK', amount: 35000 },
    { type: '4BHK', amount: 42000 },
    { type: '5BHK', amount: 50000 },
  ];

  const gstRate = 0.18;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/client/design-fees');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (planType: string) => {
    return payments.find(p => p.plan_type === planType);
  };

  const isPlanBlocked = (planType: string) => {
    const payment = getPaymentStatus(planType);
    if (!payment || payment.status !== 'approved') return false;
    const approvedTime = new Date(payment.updated_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - approvedTime) < twentyFourHours;
  };

  const calculateGST = (amount: number) => amount * gstRate;
  const calculateTotal = (amount: number) => amount + calculateGST(amount);

  const handleSelectPlan = (planType: string) => {
    if (isPlanBlocked(planType)) {
      toast.error('This plan is temporarily blocked. Please try again after 24 hours from approval.');
      return;
    }
    setSelectedPlan(planType);
    setShowCheckout(true);
  };

  const handleRetryPlan = (planType: string, amount?: number) => {
    if (planType === 'custom' && amount) {
      setCustomAmount(amount.toString());
    }
    handleSelectPlan(planType);
  };

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (isPlanBlocked('custom')) {
      toast.error('This plan is temporarily blocked. Please try again after 24 hours from approval.');
      return;
    }
    setSelectedPlan('custom');
    setShowCheckout(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      const planData = plans.find(p => p.type === selectedPlan);
      const amount = planData ? planData.amount : parseFloat(customAmount);
      const gstAmount = calculateGST(amount);
      const totalAmount = calculateTotal(amount);

      const formData = new FormData();
      formData.append('plan_type', selectedPlan);
      formData.append('amount', amount.toString());
      formData.append('gst_amount', gstAmount.toString());
      formData.append('total_amount', totalAmount.toString());
      formData.append('payment_method', paymentMethod);

      if (paymentMethod === 'online' && transactionProof) {
        formData.append('transaction_proof', transactionProof);
      }

      const response = await fetch('/api/client/design-fees', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Payment submitted successfully');
        setShowCheckout(false);
        setSelectedPlan(null);
        setTransactionProof(null);
        setCustomAmount('');
        fetchPayments(); // Refresh payments
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
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-lg sm:text-xl font-bold text-[#295A47] mb-4">Interior Designing Advance</h1>
        <p className="text-gray-600 text-sm sm:text-base">This fees is adjustable with your Final Bill</p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={onViewTransactions}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
          >
            View Your Transactions
          </button>
        </div>
      </div>

      {/* Predefined Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const payment = getPaymentStatus(plan.type);
          return (
            <div
              key={plan.type}
              className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
                isPlanBlocked(plan.type) ? 'border-red-300' : payment && payment.status === 'pending' ? 'border-yellow-300' : payment && payment.status === 'rejected' ? 'border-red-300' : 'border-[#295A47] hover:shadow-xl'
              } transition-shadow`}
            >
              <h3 className="text-xl font-semibold text-[#295A47] mb-2">{plan.type}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ₹{plan.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                + GST (18%): ₹{calculateGST(plan.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-lg font-semibold text-[#295A47] mb-4">
                Total: ₹{calculateTotal(plan.amount).toLocaleString('en-IN')}
              </p>

              {isPlanBlocked(plan.type) ? (
                <div className="text-center bg-green-100">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Your payment has been approved recently.
                    <br />
                    Blocked (Available after 24 hours)
                  </span>
                </div>
              ) : payment && payment.status === 'pending' ? (
                <div className="text-center bg-yellow-100">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </span>
                </div>
              ) : payment && payment.status === 'rejected' ? (
                <div className="text-center space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-200 text-red-800">
                    Rejected
                  </span>
                  <button
                    onClick={() => handleRetryPlan(plan.type)}
                    className="w-full bg-[#295A47] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.type)}
                  className="w-full bg-[#295A47] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
                >
                  Select this Plan
                </button>
              )}
            </div>
          );
        })}

        {/* Custom Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#295A47]">
          <h3 className="text-xl font-semibold text-[#295A47] mb-2">Custom Plan</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Amount (₹)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter amount"
            />
          </div>
          {customAmount && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                GST (18%): ₹{calculateGST(parseFloat(customAmount) || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-lg font-semibold text-[#295A47]">
                Total: ₹{calculateTotal(parseFloat(customAmount) || 0).toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {isPlanBlocked('custom') ? (
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Blocked (Available after 24 hours)
              </span>
            </div>
          ) : getPaymentStatus('custom') && getPaymentStatus('custom')!.status === 'pending' ? (
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Pending Approval
              </span>
            </div>
          ) : getPaymentStatus('custom') && getPaymentStatus('custom')!.status === 'rejected' ? (
            <div className="text-center space-y-3">
              <span className="inline-block px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Rejected
              </span>
              <button
                onClick={() => {
                  const rejectedPayment = getPaymentStatus('custom');
                  handleRetryPlan('custom', rejectedPayment?.amount);
                }}
                className="bg-red-100 text-red-700 py-1 px-2 sm:px-2 rounded-lg hover:bg-red-200 transition text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={handleCustomSubmit}
              className="w-full bg-[#295A47] text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-[#1e3d32] transition text-sm sm:text-base"
            >
              Select this Plan
            </button>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-2xl font-bold text-[#295A47] mb-4">Checkout</h2>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Plan: {selectedPlan}</h3>
                {(() => {
                  const planData = plans.find(p => p.type === selectedPlan);
                  const amount = planData ? planData.amount : parseFloat(customAmount);
                  const gstAmount = calculateGST(amount);
                  const totalAmount = calculateTotal(amount);

                  return (
                    <div className="text-sm text-gray-600">
                      <p>Amount: ₹{amount.toLocaleString('en-IN')}</p>
                      <p>GST (18%): ₹{gstAmount.toLocaleString('en-IN')}</p>
                      <p className="font-semibold text-[#295A47]">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  );
                })()}
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
                      <p><strong>IFSC Code:</strong> HDFC0005690</p>
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
                    setShowCheckout(false);
                    setSelectedPlan(null);
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

export default DesigningFees;
