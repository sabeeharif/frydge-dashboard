"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { PackageSearch, RefreshCw, Plus, Search, Loader2 } from "lucide-react";
import Loader from "@/app/components/Loader";
import ManageProductsModal from "@/app/components/products/ManageProductsModal";
import ProductTable from "@/app/components/products/ProductTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import CreateProductModal from "@/app/components/products/CreateProductModal";
import EditProductModal from "@/app/components/products/EditProductModal";
import DeleteModal from "@/app/components/products/DeleteModal";
import { AuthService, api } from "@/app/lib/auth"
import CategoryTable from "../../components/products/CategoryTable";
import DeleteCategoryModal from "../../components/products/DeleteCategoryModal";

const ProductManagement = () => {
  // States
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    supplierId: "",
    productCategoryId: "",
    externalId: "",
    costPrice: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLastKey, setSupplierLastKey] = useState(null);
  const [hasMoreSuppliers, setHasMoreSuppliers] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isRefreshRotating, setIsRefreshRotating] = useState(false);
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState()
  const [loading, setLoading] = useState()
  0
  // Modal State
  const categoryTimeoutRef = useRef(null)
  const isFetchingAllCategoriesRef = useRef(false)

  const [allCategories, setAllCategories] = useState([])
  const [deleteCategoryModal, setDeleteCategoryModal] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState()
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);

  const [categorySearchLoading, setCategorySearchLoading] = useState(false)
  const [categoryFetchProgress, setCategoryFetchProgress] = useState({
    current: 0,
    total: 0
  })
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  // Products State
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const pageSize = 10
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  // Pagination states
  const [categoryPage, setCategoryPage] = useState(1);

  const fetchAllCategoriesProgressively = async () => {
    if (isFetchingAllCategoriesRef.current) return;

    isFetchingAllCategoriesRef.current = true;
    setCategorySearchLoading(true);

    try {
      let allFetchedCategories = [];
      let currentLastKey = null;
      let pageCount = 0;
      const maxPages = 50;

      setCategoryFetchProgress({ current: 0, total: maxPages });

      do {
        pageCount++;
        setCategoryFetchProgress({ current: pageCount, total: maxPages });

        const response = await api.getProductsCategories({ limit: 20, lastKey: currentLastKey });
        if (!response.ok) break;

        const data = await response.json();
        const newCategories = data.productCategories || data.results || [];

        allFetchedCategories = [...allFetchedCategories, ...newCategories];
        setAllCategories([...allFetchedCategories]);

        currentLastKey = data.lastKey || null;

        if (pageCount < maxPages && currentLastKey) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } while (currentLastKey && pageCount < maxPages);

      console.log(`Successfully fetched ${allFetchedCategories.length} categories`);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategorySearchLoading(false);
      isFetchingAllCategoriesRef.current = false;
    }
  };

  useEffect(() => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);

    if (!isFetchingAllCategoriesRef.current && allCategories.length === 0) {
      categoryTimeoutRef.current = setTimeout(() => {
        fetchAllCategoriesProgressively();
      }, 500);
    }

    return () => {
      if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshRotating(true);
    fetchAllProducts()
  }

  // Update suppliers
  const handleAssignSupplier = async (productId, supplierId) => {
    try {
      // 1️⃣ Immediately update UI (optimistic update)
      setProducts((prev) =>
        prev.map((p) => (p.productId === productId ? { ...p, supplierId } : p))
      );

      // 2️⃣ Send update to backend
      const response = await api.updateProduct({
        productId: productId, supplierId: supplierId, productCategoryId: "",
        costPrice: ""
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      console.log("Supplier assigned successfully");

    } catch (error) {
      console.error("Error assigning supplier:", error);

      // 3️⃣ Optional: Undo UI change on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === productId ? { ...p, supplierId: null } : p
        )
      );
    }
  };


  // Input Form
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };



  // Modal
  const openEditModal = (product) => {
    setEditingProductId(product.productId);

    setFormData({
      name: product.name || "",
      supplierId: product.supplierId || "",
      productCategoryId: product.productCategoryId || "",
      externalId: product.externalId || "",
      costPrice: product.costPrice || "",
    });

    setShowEditProductModal(true);
  };

  // Update Product
  const handleUpdateProduct = async () => {
    setUpdatingProduct(true);

    // Backup previous state in case API fails
    const previousProducts = [...products];

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.productId === editingProductId ? { ...p, ...formData } : p))
    );

    try {
      // Call the API
      const response = await api.updateProduct({ productId: editingProductId, ...formData });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const updated = await response.json();
      console.log("Product updated successfully:", updated);

      // Close modal on success
      setShowEditProductModal(false);

    } catch (error) {
      console.error("Update failed:", error);

      // Rollback on API error
      setProducts(previousProducts);

      alert("Failed to update product. Please try again.");
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Remove Product
  const handleDelete = (product) => {
    setSelectedProduct(product); // store the product to delete
    setShowDeleteProductModal(true); // open modal
  };

  const handelSyncProduct = async () => {
    try {
      setIsRotating(true);

      // 1️⃣ Call sync API
      const res = await api.syncProducts();

      if (!res.ok) {
        throw new Error("Sync failed");
      }

      // 2️⃣ After API success → wait 1 minute
      setTimeout(() => {
        fetchProducts();
        setIsRotating(false);
      }, 60000); // 1 minute

    } catch (error) {
      console.error("Product sync error:", error);
      setIsRotating(false);
    }
  }

  // Fetch
  const fetchAllProducts = async () => {
    if (!isRotating) {
      setLoading(true)
    }
    try {

      setIsRotating(true);

      const response = await api.getProducts({ limit: -1 });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      const products = data.products || data.results || [];

      setAllProducts(products);
      setFilteredProducts(products);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setIsRotating(false);
      setIsRefreshRotating(false);
      setLoading(false)
    }
  };


  // Fetch
  const fetchSuppliers = async (useLastKey = null) => {
    try {
      const response = await api.getSuppliers({
        limit: supplierPageSize,   // dynamic limit
        lastKey: useLastKey        // pagination key
      });

      console.log("Supplier fetch response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Supplier data received:", data);

      const fetchedSuppliers = data.suppliers || data.results || [];
      const newLastKey = data.lastKey || null;

      setSuppliers(fetchedSuppliers);
      setSupplierLastKey(newLastKey);
      setHasMoreSuppliers(!!newLastKey);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []); // refetch when limit changes

  useEffect(() => {
    fetchSuppliers();
  }, [supplierPageSize]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);

    if (!value) {
      setFilteredProducts(allProducts);
      return;
    }

    const lower = value.toLowerCase();

    const filtered = allProducts.filter((p) =>
      p.name?.toLowerCase().includes(lower) ||
      p.externalId?.toLowerCase().includes(lower)
    );

    setFilteredProducts(filtered);
  };

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleNextPage = () => {
    console.log(totalPages);
    console.log(currentPage);
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      setCategoryLoading(true);

      const res = await api.createProductCategory({
        name: categoryName
      });

      if (!res.ok) throw new Error("Create failed");

      await fetchAllCategoriesProgressively();
      setCategoryName("");
    } catch (e) {
      console.error(e);
    } finally {
      setCategoryLoading(false);
    }
  };
  const handleUpdateCategory = async () => {
    try {
      setCategoryLoading(true);

      const res = await api.updateProductCategory({
        productCategoryId: editingCategory.productCategoryId,
        name: categoryName
      });

      if (!res.ok) throw new Error("Update failed");

      await fetchAllCategoriesProgressively();
      setEditingCategory(null);
      setCategoryName("");
    } catch (e) {
      console.error(e);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    setDeleteCategoryLoading(true)
    try {
      await api.deleteProductCategory({ productCategoryId: selectedCategory });
      setDeleteCategoryModal(false)
      await fetchAllCategoriesProgressively();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteCategoryLoading(false)
    }
  };

  const openDeleteModal = (categoryId) => {
    setSelectedCategory(categoryId)
    setDeleteCategoryModal(true)
  }

  const filteredCategories = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );
  const totalCategoryPages = Math.ceil(filteredCategories.length / pageSize);
  const displayedCategories = filteredCategories.slice(
    (categoryPage - 1) * pageSize,
    categoryPage * pageSize
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }
  return (
    <div className="p-8 space-y-8">
      {/* Head */}
      <div className="">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <PackageSearch className="h-10 w-10 text-blue-600" />
          <span className="text-gray-800">Products</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {products?.length} products</span>
        </div>
      </div>

      {/* Head - 2 */}
      <div className="">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Manage Categories
          </button>

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshRotating ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => handelSyncProduct()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
            Sync Products
          </button>
        </div>
      </div>

      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allProducts?.length > 0 ? `Search through all ${allProducts?.length} products...` : "Search by name"
            }
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {paginatedProducts.length} product {paginatedProducts.length !== 1 ? "s" : ""} matching "{search}"
            {allProducts.length > 0
              ? ` (searching through ${allProducts.length} total products)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      {/* Table */}
      <ProductTable
        products={paginatedProducts}
        suppliers={suppliers}
        categories={allCategories}
        currentPage={currentPage}
        pageSize={pageSize}
        onManage={openEditModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />


      {/* Pagination Controls */}
      <PaginationControls
        paginatedItems={paginatedProducts}
        hasNextPage={currentPage < totalPages}
        hasPrevPage={currentPage > 1}
        onNextPage={handleNextPage}
        onRefresh={handlePrevPage}
        currentPage={currentPage}
        totalPages={totalPages}
      />


      {/* Modal */}
      {isManageModalOpen && (
        <ManageProductsModal
          product={selectedProduct}
          suppliers={suppliers}
          onAssign={handleAssignSupplier}
          onClose={() => setIsManageModalOpen(false)}
        />
      )}

      {showEditProductModal && (
        <EditProductModal
          closeModal={() => setShowEditProductModal(false)}
          updatingProduct={updatingProduct}
          handleUpdateProduct={handleUpdateProduct}
          formData={formData}
          handleInputChange={handleInputChange}
          allSuppliers={suppliers}
          allCategories={allCategories}
        />
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900">Manage Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Create / Edit Form */}
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-3">
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />

                {editingCategory ? (
                  <>
                    <button
                      onClick={handleUpdateCategory}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                    >
                      {categoryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {categoryLoading ? "Updating..." : "Update"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryName('');
                      }}
                      className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                  >
                    {categoryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {categoryLoading ? "Adding..." : "Add Category"}
                  </button>
                )}
              </div>
            </div>

            {/* Search + Table + Pagination */}
            <div className="flex-1 overflow-auto p-6 relative">
              {/* Loading */}
              {categorySearchLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}

              {/* Search */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Table */}
              <CategoryTable
                categories={displayedCategories}
                onEdit={(cat) => {
                  setEditingCategory(cat);
                  setCategoryName(cat.name);
                }}
                onDelete={openDeleteModal}
              />

              {/* Pagination */}
              <div className="mt-4 flex justify-end items-center gap-2">
                <button
                  onClick={() => setCategoryPage((prev) => Math.max(prev - 1, 1))}
                  disabled={categoryPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {categoryPage} of {totalCategoryPages}
                </span>
                <button
                  onClick={() => setCategoryPage((prev) => Math.min(prev + 1, totalCategoryPages))}
                  disabled={categoryPage === totalCategoryPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* Delete Modal */}
              <DeleteCategoryModal
                open={deleteCategoryModal}
                onClose={() => setDeleteCategoryModal(false)}
                onDelete={handleDeleteCategory}
                isLoading={deleteCategoryLoading}
                setIsLoading={setDeleteCategoryLoading}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default function ProductManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-gray-100">
          <Loader />
        </div>
      }
    >
      <ProductManagement />
    </Suspense>
  );
}
