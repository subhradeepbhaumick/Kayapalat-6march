'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Eye, X } from 'lucide-react';
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

const SalesQuotationPdfsTab: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotationPdfs, setQuotationPdfs] = useState<QuotationPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<QuotationPdf | null>(null);
  const [filterClient, setFilterClient] = useState<string>('');

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/sales-admin/clients', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuotationPdfs = async () => {
    try {
      const url = filterClient
        ? `/api/sales-admin/quotation-pdfs?client_id=${filterClient}`
        : '/api/sales-admin/quotation-pdfs';
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuotationPdfs(data.quotationPdfs);
      }
    } catch (error) {
      console.error('Error fetching quotation PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchQuotationPdfs();
  }, [filterClient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedClient || !selectedFile) {
      toast.error('Please select a client and PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('client_id', selectedClient);
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('/api/sales-admin/quotation-pdfs', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('PDF uploaded successfully');
        setSelectedClient('');
        setSelectedFile(null);
        fetchQuotationPdfs();
      } else {
        toast.error(data.error || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdfId: number) => {
    if (!confirm('Are you sure you want to delete this quotation PDF?')) return;

    try {
      const response = await fetch(`/api/sales-admin/quotation-pdfs?id=${pdfId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('PDF deleted successfully');
        fetchQuotationPdfs();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete PDF');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete PDF');
    }
  };

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
        <h1 className="text-3xl font-bold text-[#295A47] mb-4">PDF Quotations</h1>
        <p className="text-gray-600">Upload and manage quotation PDFs for clients</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Upload New Quotation PDF</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a client</option>
              {clients.map(client => (
                <option key={client.user_id} value={client.user_id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedClient || !selectedFile}
              className="w-full bg-[#295A47] text-white py-2 px-4 rounded-lg hover:bg-[#1e3d32] disabled:opacity-50 flex items-center justify-center"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload size={20} className="mr-2" />
                  Upload PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">Filter Quotation PDFs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Client</label>
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
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">
          Existing Quotation PDFs {filterClient && `(Filtered by ${clients.find(c => c.user_id === filterClient)?.name})`}
        </h2>
        {quotationPdfs.length === 0 ? (
          <p className="text-gray-600">No quotation PDFs uploaded yet.</p>
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(pdf)}
                    className="text-blue-500 hover:text-blue-700 p-2"
                    title="View PDF"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Delete PDF"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
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

export default SalesQuotationPdfsTab;
