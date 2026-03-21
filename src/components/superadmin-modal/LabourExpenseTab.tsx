"use client";

import React, { useEffect, useState } from "react";

interface LabourExpense {
  id: number;
  work_type: string;
  labour_name: string;
  article: string;
  rate: number;
  rate_unit: string;
  size: number;
  amount: number;
  created_at: string;
}

interface Props {
  appointmentId: string;
  onAddClick: (editData?: any) => void;
}

const LabourExpenseTab: React.FC<Props> = ({ appointmentId, onAddClick }) => {
  const [labourExpenses, setLabourExpenses] = useState<LabourExpense[]>([]);
  const [labourSummary, setLabourSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH LABOUR EXPENSES
  ========================= */
  const fetchLabourExpenses = async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(
          `/api/superadmin/myprojects?type=labour_expenses&appointment_id=${appointmentId}`
        ),
        fetch(
          `/api/superadmin/myprojects?type=labour_summary&appointment_id=${appointmentId}`
        ),
      ]);

      const expensesData = await expensesRes.json();
      const summaryData = await summaryRes.json();

      setLabourExpenses(expensesData.expenses || []);
      setLabourSummary(summaryData.labours || []);
    } catch (error) {
      console.error("Error fetching labour expenses:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (appointmentId) fetchLabourExpenses();

    const refreshHandler = () => {
      fetchLabourExpenses();
    };

    window.addEventListener("refreshLabourExpenses", refreshHandler);

    return () => {
      window.removeEventListener("refreshLabourExpenses", refreshHandler);
    };
  }, [appointmentId]);

  /* =========================
     TOTAL COST
  ========================= */
  const totalAmount = labourExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  /* =========================
     GROUP EXPENSES
  ========================= */
  const groupedExpenses = labourExpenses.reduce((groups: any, item) => {
    const key = item.work_type + "_" + item.labour_name + "_";

    if (!groups[key]) {
      groups[key] = {
        work_type: item.work_type,
        labour_name: item.labour_name,
        created_at: item.created_at,
        items: [],
        total: 0,
      };
    }

    groups[key].items.push(item);
    groups[key].total += Number(item.amount);

    return groups;
  }, {});

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-gray-800">Labour Expenses</h3>

        <button
          onClick={() => onAddClick()}
          className="bg-[#295A47] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1f4637]"
        >
          + Add Work
        </button>
      </div>

      {/* TOTAL CARD */}
      <div className="bg-[#F5F8F6] border border-[#D7E7D0] rounded-lg p-4">
        <p className="text-sm text-gray-500">Total Labour Cost</p>

        <p className="text-2xl font-bold text-[#295A47]">
          ₹{totalAmount.toLocaleString()}
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left whitespace-nowrap">Work Type</th>
              <th className="p-3 text-left whitespace-nowrap">ID</th>
              <th className="p-3 text-left whitespace-nowrap">Labour</th>
              <th className="p-3 text-left whitespace-nowrap">Article</th>
              <th className="p-3 text-left whitespace-nowrap">Rate</th>
              <th className="p-3 text-left whitespace-nowrap">Size</th>
              <th className="p-3 text-left whitespace-nowrap">Amount</th>
              <th className="p-3 text-left whitespace-nowrap">Date</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-400">
                  Loading labour expenses...
                </td>
              </tr>
            ) : Object.keys(groupedExpenses).length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-500">
                  No labour expenses added yet
                </td>
              </tr>
            ) : (
              Object.values(groupedExpenses).map((group: any, index) => {
                const summary = labourSummary.find(
                  (s) =>
                    String(s.labour_id) === String(group.items[0]?.labour_id)
                );
                const paidAmount = summary
                  ? Number(summary.total_paid || 0)
                  : 0;
                const dueAmount = summary ? Number(summary.due_amount || 0) : 0;

                return (
                  <React.Fragment key={index}>
                    {/* GROUP HEADER */}
                    <tr className="bg-[#D7E7D0]  border-t font-bold">
                      <td className="p-3">{group.work_type}</td>
                      <td className="p-3 text-red-700">
                        {group.items[0]?.labour_id}
                      </td>

                      <td className="p-3">{group.labour_name}</td>

                      <td colSpan={4}></td>

                      <td className="p-3 whitespace-nowrap">
                        {new Date(group.created_at).toLocaleDateString("en-IN")}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => onAddClick(group)}
                          className="bg-white border border-blue-600 text-red-500 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-2xl shadow-xl text-sm font-semibold transition-colors duration-200"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>

                    {/* ARTICLES */}
                    {group.items.map((item: LabourExpense) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="p-3">{item.article}</td>

                        <td className="p-3 whitespace-nowrap">
                          ₹{item.rate} / {item.rate_unit}
                        </td>

                        <td className="p-3">{item.size}</td>

                        <td className="p-3 font-semibold text-[#295A47] whitespace-nowrap">
                          ₹{item.amount}
                        </td>

                        <td></td>

                        <td></td>
                      </tr>
                    ))}

                    {/* GROUP TOTAL */}
                    <tr className="bg-[#F5F8F6] border-t font-bold">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td colSpan={3} className="p-3 text-right">
                        Total
                      </td>

                      <td className="p-3 text-red-500 whitespace-nowrap">
                        ₹{group.total}
                      </td>

                      <td></td>
                      <td></td>
                    </tr>

                    {/* PAID */}
                    <tr className="bg-[#F5F8F6] border-t font-bold text-gray-700">
                      <td></td>
                      <td></td>
                      <td></td>

                      <td colSpan={3} className="p-3 text-right">
                        Paid
                      </td>

                      <td className="p-3 text-green-600 whitespace-nowrap">
                        ₹{paidAmount.toLocaleString("en-IN")}
                      </td>

                      <td></td>
                      <td></td>
                    </tr>

                    {/* DUE */}
                    <tr className="bg-[#F5F8F6] border-t font-bold text-gray-700">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td colSpan={3} className="p-3 text-right">
                        Due
                      </td>

                      <td className="p-3 text-red-600 whitespace-nowrap">
                        ₹{dueAmount.toLocaleString("en-IN")}
                      </td>

                      <td></td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabourExpenseTab;
