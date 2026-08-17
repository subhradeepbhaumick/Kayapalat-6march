"use client";

import React, { useState } from "react";

interface AddWorkerModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (name: string, role: string, phone: string, image: File) => void;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  show,
  onClose,
  onAdd,
}) => {
  const [workerName, setWorkerName] = useState("");
  const [workerRole, setWorkerRole] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [documentImage, setDocumentImage] = useState<File | null>(null);

  const handleAdd = () => {
    if (
      workerName.trim() &&
      workerRole.trim() &&
      workerPhone.trim() &&
      documentImage
    ) {
      onAdd(workerName, workerRole, workerPhone, documentImage);
      setWorkerName("");
      setWorkerRole("");
      setWorkerPhone("");
      setDocumentImage(null);
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#295A47]"
              placeholder="Enter Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identity Document
            </label>

            <div className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#295A47] transition">
              {!documentImage ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    id="fileUpload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocumentImage(file);
                      }
                    }}
                  />

                  <label
                    htmlFor="fileUpload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="text-gray-400 text-4xl">📄</div>
                    <p className="text-sm text-gray-600">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG (Max 5MB)</p>
                  </label>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  {/* Preview */}
                  <img
                    src={URL.createObjectURL(documentImage)}
                    alt="preview"
                    className="h-24 w-24 object-cover rounded-lg border"
                  />

                  {/* File name */}
                  <p className="text-sm text-gray-700 truncate max-w-[200px]">
                    {documentImage.name}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <label className="text-xs text-blue-600 cursor-pointer hover:underline">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocumentImage(file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setDocumentImage(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
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
