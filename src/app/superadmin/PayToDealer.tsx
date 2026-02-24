"use client";

import React, { useState, useEffect } from "react";
import { X, Edit, Save, XCircle, Eye } from "lucide-react";
import ManufacturerDetailsModal from "./ManufacturerDetailsModal";

interface BoughtProduct {
  o_id: string;
  dealer_id: string;
  client_name: string;
  client_phone: string;
  client_gstin: string;
  order_list: string;
  payment_type: string;
  total_amount: number;
  advance: number;
  due: number;
  transaction_id: string;
  delivery_type: string;
  site_address: string;
  extra_trsnsport_cost: number;
  status: string;
  company_total_payment: number;
  company_paid: number;
  company_due: number;
  created_at: string;
  updated_at: string;
}

interface PayToDealerProps {
  onClose: () => void;
}

const PayToDealer: React.FC<PayToDealerProps> = ({ onClose }) => {
  const [data, setData] = useState<BoughtProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<{ [key: string]: { company_total_payment: number; company_paid: number; company_due: number } }>({});
  const [saving, setSaving] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
    const res = await fetch("/api/superadmin/paytodealer", {
      credentials: "include",
    });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          console.error("Failed to fetch bought products");
        }
      } catch (error) {
        console.error("Error fetching bought products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (o_id: string) => {
    setEditingRowId(o_id);
    const item = data.find(d => d.o_id === o_id);
    if (item) {
      setEditedValues(prev => ({
        ...prev,
        [o_id]: {
          company_total_payment: item.company_total_payment || 0,
          company_paid: item.company_paid || 0,
          company_due: item.company_due || 0
        }
      }));
    }
  };

  const handleCancel = (o_id: string) => {
    setEditingRowId(null);
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[o_id];
      return newValues;
    });
  };

  const handleSave = async (o_id: string) => {
    setSaving(true);
    try {
      const values = editedValues[o_id];
      const response = await fetch('/api/superadmin/paytodealer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          o_id,
          company_total_payment: values.company_total_payment,
          company_paid: values.company_paid,
          company_due: values.company_due
        }),
      });

      if (response.ok) {
        // Refresh data
        const res = await fetch("/api/superadmin/paytodealer", {
          credentials: "include",
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
        setEditingRowId(null);
        setEditedValues(prev => {
          const newValues = { ...prev };
          delete newValues[o_id];
          return newValues;
        });
      } else {
        console.error('Failed to update record');
        alert('Failed to update record. Please try again.');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter((item) => {
    if (!filterDate) return true;
    try {
      return new Date(item.created_at).toISOString().split('T')[0] === filterDate;
    } catch (e) {
      return false;
    }
  });

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#295A47] bg-gradient-to-r from-[#295A47] to-green-600 bg-clip-text text-transparent">Pay to Dealer</h2>
                <p className="text-gray-600 mt-1">Total Orders: {filteredData.length}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Billed Date:</span>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                  />
                  {filterDate && (
                    <button 
                      onClick={() => setFilterDate("")}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#295A47] to-[#1e3a2e] text-white shadow-lg">
                      <th className="border border-gray-300 px-4 py-3 font-semibold sticky left-0 z-10 bg-[#295A47]">O_ID</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Actions</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Dealer ID</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Company Total Payment</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Company Paid</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Company Due</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Client Name</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Client Phone</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Client GSTIN</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Payment Type</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Total Amount</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Advance</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Due</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Transaction ID</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Delivery Type</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Site Address</th>
                      <th className="border border-gray-300 px-4 py-3 font-semibold">Extra Transport Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => {
                      const isEditing = editingRowId === item.o_id;
                      const editedValue = editedValues[item.o_id] || {
                        company_total_payment: item.company_total_payment || 0,
                        company_paid: item.company_paid || 0,
                        company_due: item.company_due || 0
                      };

                      return (
                        <tr key={item.o_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200 group`}>
                          <td className={`border border-gray-300 px-4 py-3 font-medium text-gray-800 sticky left-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} group-hover:bg-blue-50`}>{item.o_id}</td>
                          <td className="border border-gray-300 px-4 py-3">
                            {isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSave(item.o_id)}
                                  disabled={saving}
                                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => handleCancel(item.o_id)}
                                  className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(item.o_id)}
                                className="flex items-center px-3 py-1 bg-[#295A47] text-white rounded hover:bg-[#1e3a2e] transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            <button
                              onClick={() => setSelectedDealerId(item.dealer_id)}
                              className="flex items-center text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {item.dealer_id}
                            </button>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editedValue.company_total_payment}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedValues(prev => {
                                    const current = prev[item.o_id];
                                    return {
                                      ...prev,
                                      [item.o_id]: { 
                                        ...current, 
                                        company_total_payment: val,
                                        company_due: val - (current.company_paid || 0)
                                      }
                                    };
                                  });
                                }}
                                className="w-full min-w-[180px] px-4 py-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-lg h-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-purple-600 font-semibold">₹{(item.company_total_payment || 0).toLocaleString()}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editedValue.company_paid}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedValues(prev => {
                                    const current = prev[item.o_id];
                                    return {
                                      ...prev,
                                      [item.o_id]: { 
                                        ...current, 
                                        company_paid: val,
                                        company_due: (current.company_total_payment || 0) - val
                                      }
                                    };
                                  });
                                }}
                                className="w-full min-w-[180px] px-4 py-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-lg h-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-green-600 font-semibold">₹{(item.company_paid || 0).toLocaleString()}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editedValue.company_due}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedValues(prev => {
                                    const current = prev[item.o_id];
                                    return {
                                      ...prev,
                                      [item.o_id]: { 
                                        ...current, 
                                        company_due: val,
                                        company_paid: (current.company_total_payment || 0) - val
                                      }
                                    };
                                  });
                                }}
                                className="w-full min-w-[180px] px-4 py-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#295A47] focus:border-transparent text-lg h-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span className="text-red-600 font-semibold">₹{(item.company_due || 0).toLocaleString()}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.client_name}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.client_phone}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.client_gstin}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.payment_type}</td>
                          <td className="border border-gray-300 px-4 py-3 text-green-600 font-semibold">₹{(item.total_amount || 0).toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-3 text-blue-600 font-semibold">₹{(item.advance || 0).toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-3 text-red-600 font-semibold">₹{(item.due || 0).toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.transaction_id}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.delivery_type}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.site_address}</td>
                          <td className="border border-gray-300 px-4 py-3 text-orange-600 font-semibold">₹{(item.extra_trsnsport_cost || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDealerId && (
        <ManufacturerDetailsModal
          dealerId={selectedDealerId}
          onClose={() => setSelectedDealerId(null)}
        />
      )}
    </>
  );
};

export default PayToDealer;
