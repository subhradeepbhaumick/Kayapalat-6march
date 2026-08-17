"use client";

import React, { useState, useEffect } from "react";

interface Transaction {
  id: number;
  plan_type: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  status: "pending" | "approved";
  created_at: string;
}

interface DesignTransactionsTabProps {
  setActiveTab: (tab: string) => void;
}

export default function DesignTransactionsTab({ setActiveTab }: DesignTransactionsTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/client/design-fees");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.payments);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

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
      <div className="text-center mb-8">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#295A47] mb-4">
          Your Design Request Transactions
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
          View details of your design fee payments.
        </p>
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
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Plan Type</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Amount</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">GST</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Total</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left hidden sm:table-cell">Method</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize">{transaction.plan_type}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">₹{transaction.amount.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 hidden sm:table-cell">₹{transaction.gst_amount.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">₹{transaction.total_amount.toLocaleString("en-IN")}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 capitalize hidden sm:table-cell">{transaction.payment_method}</td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${transaction.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">{new Date(transaction.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6 text-center">
        <button onClick={() => setActiveTab("Transactions")} className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm sm:text-base">
          Back to Transactions
        </button>
      </div>
    </>
  );
}