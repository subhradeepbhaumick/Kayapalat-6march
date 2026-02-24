'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { getSession } from 'next-auth/react';

interface InvoiceData {
  invoice_id: string;
  appointment_id: string;
  agent_share: number;
  paid: number;
  due: number;
  payment_status: string;
  invoice_date: string;
  proof: string | null;
  client_name: string;
  client_contact: string;
  project_name: string;
  total_estimate: number;
}

const RefererInvoice = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/referuser/invoices', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.data || []);
        } else {
          setError('Failed to fetch invoices');
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Error fetching invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const generatePDF = (invoice: InvoiceData) => {
    const doc = new jsPDF();

    // Set font
    doc.setFont('helvetica', 'normal');

    // Title
    doc.setFontSize(20);
    doc.text('Invoice', 105, 20, { align: 'center' });

    // Invoice ID
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice.invoice_id}`, 20, 35);

    // Date
    doc.text(`Date: ${invoice.invoice_date}`, 20, 45);

    // Client Details
    doc.setFontSize(14);
    doc.text('Client Details:', 20, 60);
    doc.setFontSize(12);
    doc.text(`Name: ${invoice.client_name}`, 20, 70);
    doc.text(`Contact: ${invoice.client_contact}`, 20, 80);

    // Property Details
    doc.setFontSize(14);
    doc.text('Property Details:', 20, 95);
    doc.setFontSize(12);
    doc.text(`Name: ${invoice.project_name}`, 20, 105);

    // Financial Details
    doc.setFontSize(14);
    doc.text('Financial Details:', 20, 120);
    doc.setFontSize(12);
    doc.text(`Total Estimate: ₹${invoice.total_estimate.toLocaleString()}`, 20, 130);
    doc.text(`Agent's Share: ₹${invoice.agent_share.toLocaleString()}`, 20, 140);
    doc.text(`Paid: ₹${invoice.paid.toLocaleString()}`, 20, 150);
    doc.text(`Due: ₹${invoice.due.toLocaleString()}`, 20, 160);
    doc.text(`Payment Status: ${invoice.payment_status}`, 20, 170);

    // Add proof image if available
    if (invoice.proof) {
      doc.setFontSize(14);
      doc.text('Proof:', 20, 185);
      try {
        doc.addImage(invoice.proof, 'JPEG', 20, 190, 100, 75);
      } catch (error) {
        console.error('Error adding proof image to PDF:', error);
        doc.setFontSize(12);
        doc.text('Proof image could not be loaded.', 20, 190);
      }
    }

    return doc;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-4">
          My Invoices
        </h1>
        <p className="text-gray-600 text-lg">
          View and download your commission invoices and payment history.
        </p>
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#295A47]">Invoice History</h2>
        </div>
        <div className="p-6">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-[#295A47] text-white font-semibold">
                  <tr>
                    <th className="px-3 py-2">SL NO</th>
                    <th className="px-3 py-2">Invoice ID</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Due Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{invoice.invoice_id}</td>
                      <td className="px-3 py-2">{invoice.client_name}</td>
                      <td className="px-3 py-2">{invoice.project_name}</td>
                      <td className="px-3 py-2">₹{invoice.paid.toLocaleString()}</td>
                      <td className="px-3 py-2">₹{invoice.due.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{(() => { const d = new Date(invoice.invoice_date); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })()}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={async () => {
                            const doc = generatePDF(invoice);
                            const pdfData = doc.output('datauristring');

                            try {
                              const response = await fetch('/api/referuser/invoices', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  pdf: pdfData,
                                  invoice_id: invoice.invoice_id,
                                }),
                              });
                              if (response.ok) {
                                alert('Invoice sent successfully!');
                              } else {
                                const errorData = await response.json();
                                alert(`Failed to send invoice: ${errorData.error}`);
                              }
                            } catch (error) {
                              console.error('Error sending invoice:', error);
                              alert('Error sending invoice.');
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-900 text-xs"
                        >
                          Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Invoices Yet</h3>
              <p className="text-gray-500">Your commission invoices will appear here once you start earning rewards.</p>
            </div>
          )}
        </div>
      </div>

      {/* Download Section */}
      {invoices.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#295A47] mb-4">Download Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors">
              Download All Invoices
            </button>
            <button className="bg-white border border-[#295A47] text-[#295A47] px-4 py-2 rounded-lg hover:bg-[#D7E7D0] transition-colors">
              Export to CSV
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RefererInvoice;
