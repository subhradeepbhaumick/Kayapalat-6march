"use client";

import React from "react";

type ExpenseType = "unit" | "sqft" | "labour" | "website";
interface ExpenseModalProps {
  show: boolean;
  onClose: () => void;
  expenseType: ExpenseType;
  setExpenseType: (type: ExpenseType) => void;
  expenseTitle: string;
  setExpenseTitle: (v: string) => void;
  expenseQuantity: string;
  setExpenseQuantity: (v: string) => void;
  expensePerAmount: string;
  setExpensePerAmount: (v: string) => void;
  onSave: () => void;
  orderId: string;
  setOrderId: (v: string) => void;
  fetchOrder: () => void;
  materials: any[];
  paidBy: "myself" | "sir";
  setPaidBy: (v: "myself" | "sir") => void;
  labourList: any[];
  selectedLabour: string;
  setSelectedLabour: (v: string) => void;
  // appointmentId: string;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  show,
  onClose,
  expenseType,
  setExpenseType,
  expenseTitle,
  setExpenseTitle,
  expenseQuantity,
  setExpenseQuantity,
  expensePerAmount,
  setExpensePerAmount,
  onSave,
  orderId,
  setOrderId,
  fetchOrder,
  materials,
  paidBy,
  setPaidBy,
  labourList,
  selectedLabour,
  setSelectedLabour,
  // appointmentId,
}) => {
  if (!show) return null;

  let total = 0;

  if (expenseType === "unit" || expenseType === "sqft") {
    total = Number(expenseQuantity || 0) * Number(expensePerAmount || 0);
  }

  if (expenseType === "labour" || expenseType === "website") {
    total = Number(expensePerAmount || 0);
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Add Expense</h3>

        {/* Expense Type Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setExpenseType("unit")}
            className={`py-2 rounded-lg text-sm font-medium ${
              expenseType === "unit"
                ? "bg-[#295A47] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Unit Wise
          </button>

          <button
            onClick={() => setExpenseType("sqft")}
            className={`py-2 rounded-lg text-sm font-medium ${
              expenseType === "sqft"
                ? "bg-[#295A47] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Sqft Wise
          </button>

          <button
            onClick={() => setExpenseType("labour")}
            className={`py-2 rounded-lg text-sm font-medium ${
              expenseType === "labour"
                ? "bg-[#295A47] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Labour Paid
          </button>

          <button
            onClick={() => setExpenseType("website")}
            className={`py-2 rounded-lg text-sm font-medium ${
              expenseType === "website"
                ? "bg-[#295A47] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Website Order
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          {expenseType !== "website" && expenseType !== "labour" && (
            <input
              type="text"
              placeholder="Name and Work Type"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
            />
          )}

          {/* UNIT / SQFT */}
          {(expenseType === "unit" || expenseType === "sqft") && (
            <>
              <input
                type="number"
                placeholder={expenseType === "unit" ? "Quantity" : "Total Sqft"}
                value={expenseQuantity}
                onChange={(e) => setExpenseQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              />

              <input
                type="number"
                placeholder={
                  expenseType === "unit" ? "Per Unit Amount" : "Per Sqft Price"
                }
                value={expensePerAmount}
                onChange={(e) => setExpensePerAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              />
            </>
          )}

          {/* LABOUR */}
          {expenseType === "labour" && (
            <>
              {/* 🔽 Labour Dropdown */}
              <select
                value={selectedLabour}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSelectedLabour(selectedId);

                  const selected = labourList.find(
                    (lab: any) => String(lab.labour_id) === String(selectedId)
                  );

                  if (selected) {
                    setExpenseTitle(selected.labour_name);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              >
                <option value="">Select Labour</option>
                {labourList?.map((lab: any) => (
                  <option key={lab.labour_id} value={lab.labour_id}>
                    {lab.labour_name} — Due: ₹
                    {Number(lab.due_amount).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>

              {/* 💰 Amount Input */}
              <input
                type="number"
                placeholder="Total Labour Paid"
                value={expensePerAmount}
                onChange={(e) => setExpensePerAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              />
            </>
          )}

          {/* WEBSITE ORDER */}
          {expenseType === "website" && (
            <>
              {/* Order ID */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
                />

                <button
                  onClick={fetchOrder}
                  className="px-3 py-2 bg-[#295A47] text-white rounded-lg"
                >
                  Fetch
                </button>
              </div>

              {/* Material List */}
              {materials && materials.length > 0 && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 text-xs font-semibold text-gray-600 mb-2">
                    <span>Product ID</span>
                    <span>Product Name</span>
                    <span className="text-center">Quantity</span>
                    <span className="text-right">Cost</span>
                  </div>

                  {materials.map((item: any) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-4 text-sm py-1 border-b last:border-0"
                    >
                      <span>{item.product_id}</span>
                      <span>{item.product_name}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">
                        ₹{" "}
                        {item.cost != null
                          ? Number(item.cost).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto Filled Total */}
              <input
                type="number"
                placeholder="Order Amount"
                value={expensePerAmount}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              />
            </>
          )}

          {/* Total */}
          <div className="bg-gray-50 border rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-lg font-bold text-[#295A47]">
              ₹ {total.toLocaleString("en-IN")}
            </p>
          </div>
          {/* Paid By Toggle */}
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2 text-center">Paid By</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaidBy("myself")}
                className={`py-2 rounded-lg text-sm font-medium ${
                  paidBy === "myself"
                    ? "bg-[#295A47] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                By Myself
              </button>

              <button
                onClick={() => setPaidBy("sir")}
                className={`py-2 rounded-lg text-sm font-medium ${
                  paidBy === "sir"
                    ? "bg-[#295A47] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                By Management
              </button>
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4637]"
            >
              Save Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
