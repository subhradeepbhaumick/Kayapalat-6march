'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, User, Eye, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
interface GalleryCategory {
  id: number;
  name: string;
}
interface GalleryImage {
  id: number;
  image_path: string;
  title: string;
}
const QuotationPdfsTab: React.FC = () => {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [quotationPdfs, setQuotationPdfs] = useState<QuotationPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<QuotationPdf | null>(null);
  const [filterClient, setFilterClient] = useState<string>('');
  const [referClient, setReferClient] = useState("");
  const [articleName, setArticleName] = useState("");
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<GalleryImage[]>([]);
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReferredModal, setShowReferredModal] = useState(false);
  const [referredClient, setReferredClient] = useState("");
  const [referredDesigns, setReferredDesigns] = useState<any[]>([]);
  const [loadingReferredDesigns, setLoadingReferredDesigns] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<any>(null);
  const [deletingDesign, setDeletingDesign] = useState(false);
  const fetchReferredDesigns = async (clientId: string) => {
    if (!clientId) {
      setReferredDesigns([]);
      return;
    }
    try {
      setLoadingReferredDesigns(true);
      const res = await fetch(
        `/api/superadmin/reference-image-upload/referred-designs?client_id=${encodeURIComponent(clientId)}`
      );
      const data = await res.json();
      if (data.success) {
        setReferredDesigns(data.designs || []);
      } else {
        setReferredDesigns([]);
        toast.error(data.message || "Failed to fetch referred designs");
      }
    } catch (error) {
      console.error("Error fetching referred designs:", error);
      setReferredDesigns([]);
      toast.error("Failed to load referred designs");
    } finally {
      setLoadingReferredDesigns(false);
    }
  };
  const handleDeleteReferredDesign = async () => {
    if (!designToDelete?.id) return;
    try {
      setDeletingDesign(true);
      const res = await fetch(
        "/api/superadmin/reference-image-upload/referred-designs",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: designToDelete.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete design"
        );
      }
      // Remove from current modal immediately
      setReferredDesigns((prev) =>
        prev.filter(
          (design) => design.id !== designToDelete.id
        )
      );
      toast.success("Design deleted successfully");
      // Close confirmation
      setDeleteConfirmOpen(false);
      setDesignToDelete(null);
    } catch (error) {
      console.error(
        "Error deleting referred design:",
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete design"
      );
    } finally {
      setDeletingDesign(false);
    }
  };
  const fetchCategories = async () => {
    const res = await fetch(
      "/api/superadmin/reference-image-upload/categories",
      {
        credentials: "include",
      }
    );
    if (res.ok) {
      const data = await res.json();
      console.log("Raw API response for categories:", data); // Debug: Log raw API response
      // The API returns an array where the first element is the data array.
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        setCategories(data[0]);
      } else {
        // Fallback for when data is not a nested array, assuming it's directly data.categories
        setCategories(data.categories || []);
      }
    }
  };
  const fetchGalleryImages = async (categoryId: string) => {
    const res = await fetch(
      `/api/superadmin/reference-image-upload/images?category_id=${categoryId}`,
      {
        credentials: "include",
      }
    );
    if (res.ok) {
      const data = await res.json();
      setGalleryImages(data.images);
    }
  };
  const openDesignModal = () => {
    fetchCategories();
    setSelectedCategory("");
    setGalleryImages([]);
    setDesignModalOpen(true);
  };
  useEffect(() => {
    console.log("Categories state after update:", categories); // Debug: Log categories state
  }, [categories]);
  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id);
    fetchGalleryImages(id);
  };
  const toggleImage = (img: GalleryImage) => {
    const exists = selectedImages.find((i) => i.id === img.id);
    if (exists) {
      setSelectedImages((prev) => prev.filter((i) => i.id !== img.id));
    } else {
      setSelectedImages((prev) => [...prev, img]);
    }
  };
  const handleSaveSelectedImages = async () => {
    if (
      !referClient ||
      !selectedCategory ||
      !articleName.trim() ||
      selectedImages.length === 0
    ) {
      toast.error(
        "Please select a client, category, enter an article, and select at least one image."
      );
      return;
    }
    const client = clients.find(
      (c) => c.user_id === referClient
    );
    const category = categories.find(
      (cat) => cat.id === parseInt(selectedCategory)
    );
    if (!client) {
      toast.error("Selected client not found.");
      return;
    }
    if (!category) {
      toast.error("Selected category not found.");
      return;
    }
    const imagePaths = selectedImages.map(
      (img) => img.image_path
    );
    try {
      const response = await fetch(
        "/api/superadmin/reference-image-upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: client.user_id,
            clientName: client.name,
            categoryId: category.id,
            categoryName: category.name,
            // NEW
            articleName: articleName.trim(),
            images: imagePaths,
          }),
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(
          data.message ||
          "Reference images uploaded successfully."
        );
        setDesignModalOpen(false);
        // Clear selected data
        setSelectedImages([]);
        setSelectedCategory("");
        setArticleName("");
      } else {
        toast.error(
          data.error ||
          "Failed to upload reference images."
        );
      }
    } catch (error) {
      console.error(
        "Error uploading reference images:",
        error
      );
      toast.error(
        "Failed to upload reference images."
      );
    }
  };
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/superadmin/clients', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };
  // Fetch quotation PDFs
  const fetchQuotationPdfs = async () => {
    try {
      const url = filterClient
        ? `/api/superadmin/quotation-pdfs?client_id=${filterClient}`
        : '/api/superadmin/quotation-pdfs';
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
      const response = await fetch('/api/superadmin/quotation-pdfs', {
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
      const response = await fetch(`/api/superadmin/quotation-pdfs?id=${pdfId}`, {
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
      {/* Upload Section */}
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
        <h2 className="text-xl font-semibold text-[#295A47] mb-4">
          Refer Designs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Client */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Client
            </label>
            <select
              value={referClient}
              onChange={(e) => setReferClient(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Choose Client</option>
              {clients.map((client) => (
                <option
                  key={client.user_id}
                  value={client.user_id}
                >
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          {/* Buttons */}
          <div className="flex items-end gap-3">
            {/* Choose Designs */}
            <button
              onClick={openDesignModal}
              disabled={!referClient}
              className="bg-[#295A47] text-white px-5 py-2 rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-[#214a3b] transition"
            >
              Choose Designs
            </button>
            {/* Show Referred Designs */}
            <button
              onClick={() => {
                setReferredClient("");
                setReferredDesigns([]);
                setShowReferredModal(true);
              }}
              className="border border-[#295A47] text-[#295A47]
                   px-5 py-2 rounded-lg font-medium
                   hover:bg-[#295A47] hover:text-white
                   transition"
            >
              Show Referred Designs
            </button>
          </div>
        </div>
        {/* Selected Designs */}
        {selectedImages.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4">
              Selected Designs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedImages.map((img) => (
                <div
                  key={img.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <img
                    src={img.image_path}
                    alt={img.title || "Design"}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-sm">
                    {img.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Filter Section */}
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
      {/* Existing PDFs */}
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
      {/* ================= Referred Designs Modal ================= */}
      {showReferredModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-[#295A47]">
                  Referred Designs
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select a client to view the designs referred to them.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReferredModal(false);
                  setReferredClient("");
                  setReferredDesigns([]);
                }}
                className="w-9 h-9 rounded-full hover:bg-gray-100
                     flex items-center justify-center text-gray-600
                     text-xl"
              >
                ×
              </button>
            </div>
            {/* Client Selection */}
            <div className="px-6 py-5 border-b bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Client
              </label>
              <select
                value={referredClient}
                onChange={(e) => {
                  const clientId = e.target.value;
                  setReferredClient(clientId);
                  setReferredDesigns([]);
                  if (clientId) {
                    fetchReferredDesigns(clientId);
                  }
                }}
                className="w-full md:w-[450px] border border-gray-300
                     rounded-lg px-4 py-3 bg-white
                     focus:outline-none focus:ring-2
                     focus:ring-[#295A47]/20
                     focus:border-[#295A47]"
              >
                <option value="">
                  Choose Client
                </option>
                {clients.map((client) => (
                  <option
                    key={client.user_id}
                    value={client.user_id}
                  >
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>
            {/* Designs */}
            <div className="flex-1 overflow-y-auto p-6">
              {!referredClient ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-100
                            flex items-center justify-center mb-4">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <p className="font-medium">
                    Select a client
                  </p>
                  <p className="text-sm mt-1">
                    Their referred designs will appear here.
                  </p>
                </div>
              ) : loadingReferredDesigns ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-gray-200
                            border-t-[#295A47] rounded-full animate-spin">
                  </div>
                  <p className="text-gray-500 mt-4">
                    Loading referred designs...
                  </p>
                </div>
              ) : referredDesigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-100
                            flex items-center justify-center mb-4">
                    <span className="text-2xl">📂</span>
                  </div>
                  <p className="font-medium text-gray-600">
                    No referred designs found
                  </p>
                  <p className="text-sm mt-1">
                    This client has no designs referred to them yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {referredDesigns.map((design) => (
                    <div
                      key={design.id}
                      className="group bg-white border border-gray-200
               rounded-xl overflow-hidden shadow-sm
               hover:shadow-lg transition"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={design.image_path}
                          alt={
                            design.article_name ||
                            design.category_name ||
                            "Referred Design"
                          }
                          className="w-full h-full object-cover
                   group-hover:scale-105 transition-transform
                   duration-300"
                        />
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDesignToDelete(design);
                            setDeleteConfirmOpen(true);
                          }}
                          className="absolute top-3 right-3
                   w-9 h-9 rounded-full
                   bg-red-600 text-white
                   flex items-center justify-center
                   shadow-lg
                   hover:bg-red-700
                   transition
                   opacity-0 group-hover:opacity-100"
                          title="Delete referred design"
                        >
                          🗑️
                        </button>
                      </div>
                      {/* Details */}
                      <div className="p-3">
                        {design.category_name && (
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {design.category_name}
                          </p>
                        )}
                        {design.article_name && (
                          <p className="text-sm font-semibold text-red-600 mt-1">
                            {design.article_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowReferredModal(false);
                  setReferredClient("");
                  setReferredDesigns([]);
                }}
                className="px-6 py-2 border border-gray-300
                     rounded-lg text-gray-700
                     hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= Delete Confirmation Modal ================= */}
      {deleteConfirmOpen && designToDelete && (
        <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100
                        flex items-center justify-center">
                <span className="text-2xl">
                  🗑️
                </span>
              </div>
            </div>
            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800 text-center">
              Delete Design?
            </h2>
            {/* Message */}
            <p className="text-gray-500 text-center mt-3 leading-relaxed">
              Are you sure you want to delete this referred design?
              This action cannot be undone.
            </p>
            {/* Design information */}
            <div className="mt-5 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <img
                src={designToDelete.image_path}
                alt="Design"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="min-w-0">
                {designToDelete.category_name && (
                  <p className="text-xs text-gray-500">
                    {designToDelete.category_name}
                  </p>
                )}
                {designToDelete.article_name && (
                  <p className="font-semibold text-red-600 truncate">
                    {designToDelete.article_name}
                  </p>
                )}
              </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={deletingDesign}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDesignToDelete(null);
                }}
                className="px-5 py-2.5 rounded-lg
                     border border-gray-300
                     text-gray-700
                     hover:bg-gray-100
                     transition
                     disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDesign}
                onClick={handleDeleteReferredDesign}
                className="px-5 py-2.5 rounded-lg
                     bg-red-600 text-white
                     hover:bg-red-700
                     transition
                     disabled:opacity-50
                     flex items-center gap-2"
              >
                {deletingDesign ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-white
                           border-t-transparent rounded-full
                           animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    🗑️ Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {designModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto p-6 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold">Choose Designs</h2>
                <button
                  onClick={() => setDesignModalOpen(false)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X />
                </button>
              </div>
              {/* Category */}
              <div>
                <label className="block mb-2 font-medium">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    handleCategoryChange(e.target.value);
                    setCurrentPage(1); // Reset to page 1 on category change
                  }}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Article */}
              <div className="mt-5">
                <label className="block mb-2 font-medium">Article</label>
                <input
                  type="text"
                  value={articleName}
                  onChange={(e) => setArticleName(e.target.value)}
                  placeholder="Enter article name"
                  maxLength={100}
                  className="w-full border rounded-lg p-3 outline-none focus:border-[#295A47]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the article/type for the selected designs.
                </p>
              </div>
              {/* Images */}
              {galleryImages.length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {galleryImages
                      .slice((currentPage - 1) * 10, currentPage * 10)
                      .map((img) => {
                        const selected = selectedImages.some(
                          (i) => i.id === img.id
                        );
                        return (
                          <div
                            key={img.id}
                            onClick={() => toggleImage(img)}
                            className={`cursor-pointer rounded-lg overflow-hidden border-4 ${selected ? "border-green-600" : "border-transparent"
                              }`}
                          >
                            <img
                              src={img.image_path}
                              alt="Reference design"
                              className="w-full h-44 object-cover"
                            />
                          </div>
                        );
                      })}
                  </div>
                  {/* Pagination Controls */}
                  {galleryImages.length > 10 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 font-medium">
                        Page {currentPage} of {Math.ceil(galleryImages.length / 10)}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, Math.ceil(galleryImages.length / 10))
                          )
                        }
                        disabled={
                          currentPage === Math.ceil(galleryImages.length / 10)
                        }
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDesignModalOpen(false)}
                className="border px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSelectedImages}
                disabled={selectedImages.length === 0 || !articleName.trim()}
                className={`px-6 py-2 rounded-lg text-white ${selectedImages.length === 0 || !articleName.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#295A47] hover:bg-[#214a3b]"
                  }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF View Modal */}
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
export default QuotationPdfsTab;
