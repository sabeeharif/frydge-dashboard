"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { PackageSearch, RefreshCw, Plus } from "lucide-react";
import Loader from "@/app/components/Loader";
import ManageProductsModal from "@/app/components/products/ManageProductsModal";
import ProductTable from "@/app/components/products/ProductTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import CreateProductModal from "@/app/components/products/CreateProductModal";
import EditProductModal from "@/app/components/products/EditProductModal";
import DeleteModal from "@/app/components/products/DeleteModal";
import { AuthService, api } from "@/app/lib/auth"

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
  const [limit, setLimit] = useState(10); // dynamic limit
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLastKey, setSupplierLastKey] = useState(null);
  const [hasMoreSuppliers, setHasMoreSuppliers] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [productLastKey, setProductLastKey] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const pageHistoryRef = useRef([]);

  // Modal State
  const categoryTimeoutRef = useRef(null)
  const isFetchingAllCategoriesRef = useRef(false)

  const [allCategories, setAllCategories] = useState([])
  const [categorySearchLoading, setCategorySearchLoading] = useState(false)
  const [categoryFetchProgress, setCategoryFetchProgress] = useState({
    current: 0,
    total: 0
  })

  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  // Products State
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const pageSize = 10
const pageCacheRef = useRef({});
const currentPageRef = useRef(0);


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


  // Handle next page
const handleNextPage = async () => {
  const nextPage = currentPageRef.current + 1;

  // ❌ No next page
  if (!hasNextPage) return;

  // ✅ Serve from cache
  if (pageCacheRef.current[nextPage]) {
    currentPageRef.current = nextPage;
    const cached = pageCacheRef.current[nextPage];

    setProducts(cached.products);
    setProductLastKey(cached.lastKey);

    setHasPrevPage(true);
    setHasNextPage(!!cached.lastKey);
    return;
  }

  // ✅ API call only once
  currentPageRef.current = nextPage;
  await fetchProducts(productLastKey, nextPage);
};

const handlePrevPage = () => {
  const prevPage = currentPageRef.current - 1;

  // ❌ Already on first page → disable
  if (prevPage < 0) return;

  const cached = pageCacheRef.current[prevPage];
  if (!cached) return;

  currentPageRef.current = prevPage;

  setProducts(cached.products);
  setProductLastKey(cached.lastKey);

  // 🔒 Disable prev on first page
  setHasPrevPage(prevPage > 0);
  setHasNextPage(true);
};


useEffect(() => {
  const init = async () => {
    currentPageRef.current = 0;
    await fetchProducts(null, 0);
  };

  init();
}, []);


  const handleRefresh = async () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 600); // stop after animation};
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

  // Modal
  const handleManage = (product) => {
    setSelectedProduct(product);
    setIsManageModalOpen(true);
  };

  // Input Form
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Create Product
  const handleCreateProduct = () => {
    setCreatingProduct(true);

    const newProduct = {
      id: products.length + 1,
      ...formData,
    };

    setProducts((prev) => [...prev, newProduct]);

    setCreatingProduct(false);
    setShowCreateProductModal(false);

    // Reset form
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      isActive: true,
      supplierId: "",
    });
  };

  // Modal
  const closeCreateProductModal = () => {
    setShowCreateProductModal(false);

    // Optional: reset form after closing
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      isActive: true,
      supplierId: "",
    });
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

  // Function to Perform Deletion
  const confirmDeleteProduct = () => {
    setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
    setShowDeleteProductModal(false);
    setSelectedProduct(null);
  };
  const handelSyncProduct = () => {
    setIsRotating(true)
    setTimeout(() => {
      fetchProducts();
    }, 60000); // 1 minute = 60,000 ms
  }
  // Fetch
const fetchProducts = async (lastKey = null, pageIndex) => {
  try {
    setIsRotating(true);

    const response = await api.getProducts({
      limit: pageSize,
      lastKey,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const fetchedProducts = data.products || data.results || [];
    const newLastKey = data.lastKey || null;

    // ✅ Cache page
    pageCacheRef.current[pageIndex] = {
      products: fetchedProducts,
      lastKey: newLastKey,
    };

    setProducts(fetchedProducts);
    setProductLastKey(newLastKey);

    setHasNextPage(!!newLastKey);
    setHasPrevPage(pageIndex > 0);

  } catch (error) {
    console.error("Failed to load products", error);
  } finally {
    setIsRotating(false);
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
  // const fetchProductsCategories = async (useLastKey = null) => {
  //   try {
  //     const response = await api.getProductsCategories({
  //       // dynamic limit
  //       lastKey: useLastKey        // pagination key
  //     });

  //     console.log("Category fetch response:", response.status);

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
  //       throw new Error(errorData.error || `HTTP ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log("Category data received:", data);

  //     const fetchedCategory = data.productCategories || data.results || [];


  //     setCategoriesOptions(fetchedCategory);

  //   } catch (error) {
  //     console.error("Failed to load suppliers", error);
  //   }
  // };

  useEffect(() => {
    fetchProducts();
  }, [limit]); // refetch when limit changes

  useEffect(() => {
    // fetchProductsCategories()
    fetchSuppliers();
  }, [supplierPageSize]);



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
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
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

      {/* Table */}
      <ProductTable
        products={products}
        suppliers={suppliers}
        onManage={openEditModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <PaginationControls
        paginatedItems={products}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onRefresh={handlePrevPage}
        onNextPage={handleNextPage}
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
