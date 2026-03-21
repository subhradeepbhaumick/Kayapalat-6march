"use client";

import React, { useState } from "react";

interface AddWorkerModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (name: string, role: string) => void;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  show,
  onClose,
  onAdd,
}) => {
  const [workerName, setWorkerName] = useState("");
  const [workerRole, setWorkerRole] = useState("");

  const handleAdd = () => {
    if (workerName.trim() && workerRole.trim()) {
      onAdd(workerName, workerRole);
      setWorkerName("");
      setWorkerRole("");
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Worker</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker Name
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={workerRole}
              onChange={(e) => setWorkerRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              placeholder="Enter role (e.g. Mason, Helper)"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1f4637]"
            >
              Add Worker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWorkerModal;