"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DesignAgreementModal from "./DesignAgreementModal";
interface Transaction {
  id: number;
  client_id: string;
  plan_type: string;
  contact?: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  transaction_proof_path: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
}

const ClientDesignTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [agreementModal, setAgreementModal] = useState(false);
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/superadmin/design-fees-payments");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      } else {
        toast.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = async (transactionId: number, currentStatus: string) => {
    setApproving(transactionId);
    const isApprove = currentStatus !== "approved";
    try {
      const endpoint = isApprove ? "approve" : "reject";
      const response = await fetch(
        `/api/superadmin/design-fees-payments/${transactionId}/${endpoint}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const newStatus = isApprove ? "approved" : "rejected";
        toast.success(
          `Transaction ${isApprove ? "approved" : "rejected"} successfully`
        );
        // Update the local state
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? {
                ...t,
                status: newStatus as "pending" | "approved" | "rejected",
              }
              : t
          )
        );
      } else {
        const error = await response.json();
        toast.error(
          error.error ||
          `Failed to ${isApprove ? "approve" : "reject"} transaction`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isApprove ? "approving" : "rejecting"} transaction:`,
        error
      );
      toast.error(`Failed to ${isApprove ? "approve" : "reject"} transaction`);
    } finally {
      setApproving(null);
    }
  };
  const handleDelete = async (transactionId: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `/api/superadmin/design-fees-payments/${transactionId}/delete`,
        { method: "POST" }
      );

      if (res.ok) {
        toast.success("Transaction deleted");

        // ✅ Update UI
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId ? { ...t, status: "deleted" as any } : t
          )
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-[#295A47] mb-2">
            Client Design Transactions
          </h1>

          <p className="text-gray-600 text-base md:text-lg">
            Manage and approve client design fee payments.
          </p>
        </div>

        {/* DESIGN AGREEMENT BUTTON */}
        <button
          onClick={() => {
            setAgreementModal(true);          }}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all"
        >
          Design Agreement
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-[#D7E7D0]">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Client ID
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Client Name
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Contact
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Plan Type
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Amount
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  GST
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Total
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Payment Method
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Proof
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Status
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Date
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions
                .filter(t => t.status !== "deleted") // ✅ HERE
                .map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {transaction.client_id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {transaction.client_name || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {transaction.contact || ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 capitalize">
                      {transaction.plan_type}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      ₹{transaction.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      ₹{transaction.gst_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      ₹{transaction.total_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 capitalize">
                      {transaction.payment_method}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {transaction.transaction_proof_path ? (
                        <img
                          src={transaction.transaction_proof_path}
                          alt="Transaction Proof"
                          className="w-16 h-16 object-cover cursor-pointer rounded"
                          onClick={() =>
                            setModalImage(transaction.transaction_proof_path)
                          }
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${transaction.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(transaction.created_at).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center gap-2">
                        {/* Approve / Reject */}
                        <button
                          onClick={() =>
                            handleToggle(transaction.id, transaction.status)
                          }
                          disabled={approving === transaction.id}
                          className={`w-[110px] text-center px-3 py-1 text-white rounded text-sm ${transaction.status === "approved"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                            }`}
                        >
                          {approving === transaction.id
                            ? transaction.status === "approved"
                              ? "Rejecting..."
                              : "Approving..."
                            : transaction.status === "approved"
                              ? "Reject"
                              : "Approve"}
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="w-[90px] text-center px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for viewing transaction proof */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl max-h-full overflow-auto relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
            <img
              src={modalImage}
              alt="Transaction Proof"
              className="max-w-full max-h-full"
            />
          </div>
        </div>
      )}
      <DesignAgreementModal
        isOpen={agreementModal}
        onClose={() => setAgreementModal(false)}
      />
    </>
  );
};

export default ClientDesignTransactions;
