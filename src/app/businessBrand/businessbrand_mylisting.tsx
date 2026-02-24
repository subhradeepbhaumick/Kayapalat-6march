'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, Edit, Trash2, Plus, Package, Star, ShoppingCart, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BusinessBrandAddProduct from './businessbrand_addproduct';

interface Product {
  product_id: number;
  dealer_id: number;
  category: string;
  product_name: string;
  short_description: string;
  about_product: string;
  sell_mrp: number;
  mrp: number;
  product_type: string;
  commission_percentage: number;
  commission_amount: number;
  gst_percentage: number;
  gst_exclude: number;
  gst_amount: number;
  transportation_cost: number;
  transport_exclude: number;
  base_mrp: number;
  final_product_cost: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  images: Array<{
    image_id: number;
    product_id: number;
    dealer_id: number;
    image_url: string;
    image_alt_text: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
  }>;
}

const BusinessBrandMyListing = ({
  refreshTrigger,
  onNavigateToAddProduct,
}: {
  refreshTrigger?: boolean;
  onNavigateToAddProduct: () => void;
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [stockStatus, setStockStatus] = useState<{[key: number]: boolean}>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const updateStockStatus = async (productId: number, inStock: boolean) => {
    try {
      const res = await fetch('/api/businessBrand/products/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          inStock_sts: inStock
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh the products list to get updated data
        await fetchProducts();
        toast.success('Stock status updated successfully');
      } else {
        toast.error(data.error || 'Failed to update stock status');
      }
    } catch (error) {
      console.error('Error updating stock status:', error);
      toast.error('Failed to update stock status');
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchProducts();
  }, [session, status, router]);

  // Auto-refresh when window regains focus (e.g., when returning from add product page)
  useEffect(() => {
    const handleFocus = () => {
      if (session && status === 'authenticated') {
        fetchProducts();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session, status]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/businessBrand/products', {
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        const products = data.products || [];
        setProducts(products);

        // Initialize stock status from database values
        const initialStockStatus: {[key: number]: boolean} = {};
        products.forEach((product: Product) => {
          initialStockStatus[product.product_id] = product.is_active === 1;
        });
        setStockStatus(initialStockStatus);
      } else {
        toast.error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'In Stock') return product.is_active;
    if (filter === 'Out Of Stock') return !product.is_active;
    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your product listings</p>
            </div>
            <button
              onClick={onNavigateToAddProduct}
              className="bg-gradient-to-r from-[#295A47] to-[#1e3d32] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-[#1e3d32] hover:to-[#0f2a1f] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add New Product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filter === 'all'
                  ? 'bg-[#295A47] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => setFilter('In Stock')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filter === 'In Stock'
                  ? 'bg-[#295A47] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              In Stock ({products.filter(p => p.is_active === 1).length})
            </button>
            <button
              onClick={() => setFilter('Out Of Stock')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filter === 'Out Of Stock'
                  ? 'bg-[#295A47] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Out Of Stock ({products.filter(p => p.is_active === 0).length})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't added any products yet."
                : `No ${filter} products found.`
              }
            </p>
            
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].image_url}
                      alt={product.images[0].image_alt_text || product.product_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* In Stock Checkbox */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stockStatus[product.product_id] ?? true}
                        onChange={(e) => {
                          const newStatus = e.target.checked;
                          updateStockStatus(product.product_id, newStatus);
                        }}
                        className="w-4 h-4 text-[#295A47] border-gray-300 rounded focus:ring-[#295A47] focus:ring-2"
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {stockStatus[product.product_id] ?? true ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setModalMode('view');
                          setSelectedProduct(product);
                          setShowModal(true);
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          setModalMode('edit');
                          setSelectedProduct(product);
                          setShowModal(true);
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Category */}
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    {product.category}
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {product.product_name}
                  </h3>

                  {/* Price */}
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-xl font-bold text-[#295A47]">
                      {formatPrice(product.final_product_cost)}
                    </span>
                    <span className="text-sm text-red-600">
                      Including Commission, GST{product.transport_exclude === 1 ? '. Transportation cost to be discussed.' : ', Transportation cost.'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {truncateText(product.short_description || product.about_product || '', 80)}
                  </p>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{product.images?.length || 0} images</span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for View/Edit Product */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalMode === 'edit' ? 'Edit Product' : 'View Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <BusinessBrandAddProduct
                mode={modalMode}
                productData={selectedProduct}
                onClose={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                  // Refresh products after edit
                  if (modalMode === 'edit') {
                    fetchProducts();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessBrandMyListing;
