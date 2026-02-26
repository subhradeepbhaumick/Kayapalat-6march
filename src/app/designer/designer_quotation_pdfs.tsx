'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  user_id: string;
  name: string;
  email: string;
}

interface QuotationPdf {
  id: number;
  client_id: string;
  pdf_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  client_name: string;
  client_email: string;
}

const DesignerQuotationPdfsTab: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotationPdfs, setQuotationPdfs] = useState<QuotationPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<QuotationPdf | null>(null);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuotationPdfs = async () => {
    try {
      const url = filterClient
        ? `/api/designer/quotation-pdfs?client_id=${filterClient}`
        : '/api/designer/quotation-pdfs';
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuotationPdfs(data.quotationPdfs);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to fetch quotation PDFs');
      }
    } catch (error) {
      console.error('Error fetching quotation PDFs:', error);
      toast.error('Failed to fetch quotation PDFs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchQuotationPdfs();
  }, [filterClient]);

  const handleView = (pdf: QuotationPdf) => {
    setSelectedPdf(pdf);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedPdf(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading quotation PDFs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#295A47] mb-2">Client Quotations</h1>
        <p className="text-gray-600">View quotation PDFs for your assigned clients</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Filter by Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All clients</option>
              {clients.map(client => (
                <option key={client.user_id} value={client.user_id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Quotation PDFs</h2>
        {quotationPdfs.length === 0 ? (
          <p className="text-gray-600">No quotation PDFs found.</p>
        ) : (
          <div className="space-y-4">
            {quotationPdfs.map((pdf) => (
              <div key={pdf.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="font-medium text-[#295A47]">{pdf.client_name}</p>
                    <p className="text-sm text-gray-600">{pdf.client_email}</p>
                    <p className="text-xs text-gray-500">
                      {pdf.file_name} ({(pdf.file_size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(pdf.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleView(pdf)}
                  className="text-blue-500 hover:text-blue-700 p-2"
                  title="View PDF"
                >
                  <Eye size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && selectedPdf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">View PDF: {selectedPdf.file_name}</h3>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={`/${selectedPdf.pdf_path}`}
                width="100%"
                height="600px"
                title={`PDF: ${selectedPdf.file_name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerQuotationPdfsTab;
