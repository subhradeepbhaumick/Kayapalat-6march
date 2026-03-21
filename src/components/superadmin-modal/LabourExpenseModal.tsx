"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  appointmentId: string;
  onClose: () => void;
  editData?: any;
  refreshData?: () => void;
}

interface ArticleItem {
  id?: string;
  article: string;
  rate: string;
  rate_unit: string;
  size: string;
}

const LabourExpenseModal: React.FC<Props> = ({
  appointmentId,
  onClose,
  editData,
  refreshData,
}) => {
  const [workType, setWorkType] = useState("");
  const [labourName, setLabourName] = useState("");

  const [items, setItems] = useState<ArticleItem[]>([
    { article: "", rate: "", rate_unit: "", size: "" },
  ]);
  /* =========================
   PREFILL DATA FOR EDIT
========================= */
  useEffect(() => {
    if (editData) {
      setWorkType(editData.work_type || "");
      setLabourName(editData.labour_name || "");

      const formattedItems = editData.items.map((item: any) => ({
        article: item.article,
        rate: item.rate.toString(),
        rate_unit: item.rate_unit,
        size: item.size.toString(),
        id: item.id, // keep existing id
      }));

      setItems(formattedItems);
    }
  }, [editData]);
  /* =========================
     UPDATE ITEM
  ========================= */
  const updateItem = (
    index: number,
    field: keyof ArticleItem,
    value: string
  ) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  /* =========================
     ADD NEW ARTICLE ROW
  ========================= */
  const addRow = () => {
    setItems([...items, { article: "", rate: "", rate_unit: "", size: "" }]);
  };

  /* =========================
     REMOVE ROW
  ========================= */
  const removeRow = async (index: number) => {
    const item = items[index];

    // delete from DB if item already exists
    if (item.id) {
      await fetch(
        `/api/superadmin/myprojects?id=${item.id}&type=labour_expense`,
        {
          method: "DELETE",
        }
      );
    }

    const updated = [...items];
    updated.splice(index, 1);

    // prevent empty list
    if (updated.length === 0) {
      updated.push({ article: "", rate: "", rate_unit: "", size: "" });
    }

    setItems(updated);
  };

  /* =========================
     TOTAL AMOUNT
  ========================= */
  const totalAmount = items.reduce((sum, item) => {
    return sum + Number(item.rate) * Number(item.size);
  }, 0);

  /* =========================
     SAVE DATA
  ========================= */
  const handleSave = async () => {
    for (const item of items) {
      const amount = Number(item.rate) * Number(item.size);

      // =============================
      // UPDATE EXISTING ITEM
      // =============================
      if (item.id) {
        await fetch("/api/superadmin/myprojects", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "update_labour_expense",
            id: item.id,
            work_type: workType,
            labour_name: labourName,
            article: item.article,
            rate: item.rate,
            rate_unit: item.rate_unit,
            size: item.size,
            amount,
          }),
        });
      }

      // =============================
      // INSERT NEW ITEM
      // =============================
      else {
        await fetch("/api/superadmin/myprojects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "add_labour_expense",
            appointment_id: appointmentId,
            work_type: workType,
            labour_name: labourName,
            article: item.article,
            rate: item.rate,
            rate_unit: item.rate_unit,
            size: item.size,
            amount,
          }),
        });
      }
    }
    if (refreshData) {
      refreshData(); // fetch latest DB data
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-bold text-gray-800">Add Labour Work</h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-6">
          {/* WORK TYPE */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Work Type
            </label>

            <input
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              placeholder="Example: Mason Work"
              className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#295A47] outline-none"
            />
          </div>

          {/* LABOUR NAME */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Labour Name
            </label>

            <input
              value={labourName}
              onChange={(e) => setLabourName(e.target.value)}
              placeholder="Enter labour name"
              className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#295A47] outline-none"
            />
          </div>

          {/* ARTICLE LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-700">Work Articles</h4>

              <button
                onClick={addRow}
                className="flex items-center gap-1 text-[#295A47] hover:text-red-600 text-sm font-medium"
              >
                <Plus size={16} />
                Add Article
              </button>
            </div>

            {items.map((item, index) => {
              const amount = Number(item.rate) * Number(item.size);

              return (
                <div
                  key={index}
                  className="border rounded-xl p-4 bg-gray-50 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      placeholder="Article"
                      value={item.article}
                      onChange={(e) =>
                        updateItem(index, "article", e.target.value)
                      }
                      className="border rounded-lg px-3 py-2"
                    />

                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                      className="border rounded-lg px-3 py-2"
                    />

                    <select
                      value={item.rate_unit}
                      onChange={(e) =>
                        updateItem(index, "rate_unit", e.target.value)
                      }
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="">Select Unit</option>
                      <option value="unit">Unit</option>
                      <option value="sqft">Sqft</option>
                      <option value="day">Day</option>
                      <option value="piece">Piece</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Size/Number"
                      value={item.size}
                      onChange={(e) =>
                        updateItem(index, "size", e.target.value)
                      }
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Amount:{" "}
                      <span className="font-bold text-[#295A47]">
                        ₹ {amount || 0}
                      </span>
                    </p>

                    {items.length > 1 && (
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-500 flex hover:text-blue-600 items-center gap-1 text-sm"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOTAL CARD */}
          <div className="bg-[#F5F8F6] border border-[#D7E7D0] rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Labour Cost</span>

            <span className="text-xl font-bold text-red-500">
              ₹ {totalAmount}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4637]"
          >
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabourExpenseModal;
