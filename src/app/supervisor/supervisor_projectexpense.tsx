"use client";

import React, { useState } from "react";
import { Receipt, PlusCircle } from "lucide-react";

interface Expense {
  item: string;
  quantity: number;
  price: number;
  total: number;
  receipt?: File | null;
}

const ExpensesPage = () => {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [receipt, setReceipt] = useState<File | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceipt(e.target.files[0]);
    }
  };

  const handleAddExpense = () => {
    if (!item || price <= 0) {
      alert("Fill all fields");

      return;
    }

    const newExpense: Expense = {
      item,
      quantity,
      price,
      total: quantity * price,
      receipt,
    };

    setExpenses([...expenses, newExpense]);

    setItem("");
    setQuantity(1);
    setPrice(0);
    setReceipt(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#295A47] mb-6">
        Expense Management
      </h1>

      {/* Add Expense Form */}

      <div className="bg-white shadow-lg rounded-lg p-6 max-w-xl mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PlusCircle size={20} />
          Add Expense
        </h2>

        {/* Item */}

        <input
          type="text"
          placeholder="Item Name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Quantity */}

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Price */}

        <input
          type="number"
          placeholder="Price per unit"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Receipt */}

        <input
          type="file"
          onChange={handleReceipt}
          className="w-full border p-2 rounded mb-3"
        />

        {/* Button */}

        <button
          onClick={handleAddExpense}
          className="bg-[#295A47] text-white px-6 py-2 rounded hover:bg-[#1f4637] w-full"
        >
          Submit Expense
        </button>
      </div>

      {/* Expense List */}

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Receipt size={20} />
          Expense List
        </h2>

        {expenses.length === 0 ? (
          <p>No expenses added</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>

                <th>Qty</th>

                <th>Price</th>

                <th>Total</th>

                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((exp, index) => (
                <tr key={index} className="border-b text-center">
                  <td className="py-2 text-left">{exp.item}</td>

                  <td>{exp.quantity}</td>

                  <td>₹{exp.price}</td>

                  <td className="font-semibold">₹{exp.total}</td>

                  <td>{exp.receipt ? exp.receipt.name : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
