"use client";
import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useSession } from "next-auth/react";

interface FormDataType {
  agent_id: string;
  accountHolderName: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiQr: string;
}

const BankDetailsPage: React.FC = () => {
  const { data: session } = useSession();

  const initialFormData: FormDataType = {
    agent_id: session?.user?.user_id || session?.user?.id || "",
    accountHolderName: "",
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiQr: "",
  };

  const [selectedType, setSelectedType] = useState<"Bank Account Details" | "UPI Details">(
    "Bank Account Details"
  );
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [submittedData, setSubmittedData] = useState<FormDataType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Update agent_id when user changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, agent_id: session?.user?.user_id || session?.user?.id || "" }));
  }, [session]);

  // Fetch existing bank details on component mount
  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!session?.user?.user_id && !session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/referuser/bank-details", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setFormData({
              agent_id: result.data.agent_id,
              accountHolderName: result.data.accountHolderName || "",
              bankName: result.data.bankName || "",
              accountNumber: result.data.accountNumber || "",
              ifscCode: result.data.ifscCode || "",
              upiId: result.data.upiId || "",
              upiQr: result.data.upiQr || "",
            });
            setSubmittedData({
              agent_id: result.data.agent_id,
              accountHolderName: result.data.accountHolderName || "",
              bankName: result.data.bankName || "",
              accountNumber: result.data.accountNumber || "",
              ifscCode: result.data.ifscCode || "",
              upiId: result.data.upiId || "",
              upiQr: result.data.upiQr || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching bank details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [session]);

  // Handle text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedFile(file); // this is what backend needs
    const fileURL = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, upiQr: fileURL })); // preview only
  }
};

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.user_id && !session?.user?.id) {
      alert("You must be logged in to submit bank details.");
      return;
    }

  // Validation
  if (
    !formData.agent_id ||
    (selectedType === "Bank Account Details" &&
      (!formData.accountHolderName ||
        !formData.bankName ||
        !formData.accountNumber ||
        !formData.ifscCode)) ||
    (selectedType === "UPI Details" &&
      (!formData.accountHolderName || !formData.upiId || !selectedFile))
  ) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    const fd = new FormData();
    fd.append("agent_id", formData.agent_id);
    fd.append("accountHolderName", formData.accountHolderName);
    fd.append("upiId", formData.upiId);
    fd.append("bankName", formData.bankName);
    fd.append("accountNumber", formData.accountNumber);
    fd.append("ifscCode", formData.ifscCode);

    if (selectedFile) {
      fd.append("upiQr", selectedFile);
    }

    const res = await fetch("/api/referuser/bank-details", {
      method: "POST",
      credentials: 'include',
      body: fd, // NO headers needed — browser handles it
    });

    const result = await res.json();

    if (result.success) {
      alert("Bank details saved successfully.");
      setSubmittedData({ ...formData, upiQr: formData.upiQr });
    } else {
      alert("Failed to save bank details: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    alert("Error saving bank details.");
    console.error(error);
  }
};


  const handleReset = () => {
    setFormData({ ...initialFormData, agent_id: session?.user?.user_id || session?.user?.id || "" });
    setSubmittedData(null);
  };

  // Keep form keys consistent
  useEffect(() => {
    setFormData((prev) => ({ ...initialFormData, ...prev }));
  }, [selectedType, session]);

  const displayData = submittedData ?? formData;

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center text-[#295A47] mb-8">
        Upload Your Bank Details
      </h1>

      {/* Select Type */}
      <div className="mb-6">
        <select
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as "Bank Account Details" | "UPI Details")
          }
          className="border border-gray-300 rounded-md p-2 w-72 shadow-sm focus:ring-2 focus:ring-[#295A47]"
        >
          <option value="Bank Account Details">Bank Account Details</option>
          <option value="UPI Details">UPI Details</option>
        </select>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl w-full bg-white shadow-md rounded-lg p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{selectedType}</h2>

        {selectedType === "Bank Account Details" ? (
          <div className="grid grid-cols-2 gap-6">
            <InputField
              label="Agent ID"
              name="agent_id"
              value={formData.agent_id}
              onChange={handleChange}
              placeholder="Agent ID"
              required
              disabled // prevent manual edits
            />
            <InputField
              label="Account Holder Name"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="Enter account holder name"
              required
            />
            <InputField
              label="Bank Name"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder="Enter bank name"
              required
            />
            <InputField
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              required
            />
            <InputField
              label="IFSC Code"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              placeholder="Enter IFSC code"
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <InputField
              label="Agent ID"
              name="agent_id"
              value={formData.agent_id}
              onChange={handleChange}
              placeholder="Agent ID"
              required
              disabled
            />
            <InputField
              label="Account Holder Name"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="Enter name"
              required
            />
            <InputField
              label="UPI ID"
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              placeholder="example@upi"
              required
            />
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Upload UPI QR Code<span className="text-red-500">*</span>
              </label>
              <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-md overflow-hidden flex items-center justify-center">
                {formData.upiQr ? (
                  <img
                    src={formData.upiQr}
                    alt="UPI QR Code"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Upload QR</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            type="submit"
            disabled={!session?.user?.user_id && !session?.user?.id}
            className="bg-green-900 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="max-w-5xl w-full bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Bank Details Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-center">
            <thead className="bg-[#295A47] text-white">
              <tr>
                <th className="px-4 py-2 border">Agent ID</th>
                <th className="px-4 py-2 border">Account Holder Name</th>
                <th className="px-4 py-2 border">UPI ID</th>
                <th className="px-4 py-2 border">Bank Name</th>
                <th className="px-4 py-2 border">Account Number</th>
                <th className="px-4 py-2 border">IFSC Code</th>
                <th className="px-4 py-2 border">UPI QR Code</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.agent_id || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.accountHolderName || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.upiId || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.bankName || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.accountNumber || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.ifscCode || "null"}
                </td>
                <td className="px-4 py-2 border italic text-gray-500">
                  {displayData.upiQr ? (
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="text-blue-600 underline"
                    >
                      View
                    </button>
                  ) : (
                    "null"
                  )}
                </td>
              </tr>
            </tbody>
        </table>
      </div>
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-sm w-full">
            <img src={displayData.upiQr} alt="UPI QR Code" className="w-full h-auto" />
            <button onClick={() => setIsQrModalOpen(false)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

// Reusable InputField
interface InputFieldProps {
  label: string;
  name: keyof FormDataType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-gray-600 mb-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      type="text"
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full border rounded-md p-2"
    />
  </div>
);

export default BankDetailsPage;
