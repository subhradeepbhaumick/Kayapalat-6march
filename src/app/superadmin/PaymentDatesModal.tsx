"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

const PaymentDatesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && projectId) {
      const fetchPaymentDates = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/superadmin/interior-payments/${projectId}/payment-dates`
          );
          if (res.ok) {
            const data = await res.json();
            setFormData(data || {});
          }
        } catch (err) {
          console.error("Error fetching payment dates:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPaymentDates();
    }
  }, [isOpen, projectId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/superadmin/interior-payments/${projectId}/payment-dates`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        toast.success("Payment schedule updated successfully");
        onClose();
      } else {
        toast.error("Failed to save schedule");
      }
    } catch (err) {
      console.error("Error saving payment dates:", err);
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { n: 1, s: "st" },
    { n: 2, s: "nd" },
    { n: 3, s: "rd" },
    { n: 4, s: "th" },
    { n: 5, s: "th" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-[#295A47]">
              Set Payment Schedule - {projectName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {steps.map(({ n, s }) => (
              <div
                key={n}
                className="p-4 rounded-lg bg-gray-50 border border-gray-100"
              >
                <h3 className="font-bold text-sm text-[#295A47] mb-4 uppercase tracking-wider">
                  {n}
                  {s} Installment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={formData[`p${n}_date`] || ""}
                      onChange={(e) =>
                        handleInputChange(`p${n}_date`, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#295A47] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData[`p${n}_amount`] || ""}
                      onChange={(e) =>
                        handleInputChange(`p${n}_amount`, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#295A47] outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      Paid Date
                    </label>
                    <input
                      type="date"
                      value={formData[`p${n}_paid_date`] || ""}
                      onChange={(e) =>
                        handleInputChange(`p${n}_paid_date`, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#295A47] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData[`p${n}_paid_amount`] || ""}
                      onChange={(e) =>
                        handleInputChange(`p${n}_paid_amount`, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#295A47] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      Status
                    </label>

                    <select
                      value={formData[`p${n}_status`] || "Pending"}
                      onChange={(e) =>
                        handleInputChange(`p${n}_status`, e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none
      ${
        formData[`p${n}_status`] === "Early"
          ? "bg-green-50 border-green-300 text-green-700"
          : formData[`p${n}_status`] === "Late"
          ? "bg-red-50 border-red-300 text-red-700"
          : "bg-yellow-50 border-yellow-300 text-yellow-700"
      }
    `}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Early">Early</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end mt-8 border-t pt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDatesModal;
