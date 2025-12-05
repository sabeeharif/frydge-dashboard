"use client";

import React, { Suspense, useState } from "react";
import { PackageSearch, RefreshCw, Plus } from "lucide-react";
import Loader from "@/app/components/Loader";
import ManageProductsModal from "@/app/components/products/ManageProductsModal";
import ProductTable from "@/app/components/products/ProductTable";
import PaginationControls from "@/app/components/products/PaginationControls";

const ProductManagement = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Basmati Rice",
      category: "Grains",
      price: 950,
      stock: 60,
      isActive: true,
      supplierId: null,
    },
    {
      id: 2,
      name: "Olive Oil",
      category: "Cooking Oil",
      price: 1250,
      stock: 40,
      isActive: true,
      supplierId: null,
    },
    {
      id: 3,
      name: "Sugar",
      category: "Essentials",
      price: 180,
      stock: 150,
      isActive: true,
      supplierId: null,
    },
    {
      id: 4,
      name: "Milk",
      category: "Dairy",
      price: 220,
      stock: 35,
      isActive: false,
      supplierId: null,
    },
    {
      id: 5,
      name: "Brown Bread",
      category: "Bakery",
      price: 150,
      stock: 22,
      isActive: true,
      supplierId: null,
    },
  ]);

  const allSuppliers = [
    { id: "1", name: "Supplier A" },
    { id: "2", name: "Supplier B" },
    { id: "3", name: "Supplier C" },
  ];

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Pagination state
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const hasNextPage = startIndex + itemsPerPage < products.length;

  const handleNextPage = () => {
    if (hasNextPage) setPage((p) => p + 1);
  };

  const handleRefresh = () => {
    setPage(1);
  };

  const handleAssignSupplier = (productId, supplierId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, supplierId } : p))
    );
  };

  const handleManage = (product) => {
    setSelectedProduct(product);
    setIsManageModalOpen(true);
  };

  const handleEdit = (product) => {
    console.log("Edit:", product);
  };

  const handleDelete = (product) => {
    console.log("Delete:", product);
  };

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
            // onClick={() => fetchUsers()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            // onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Product
          </button>
        </div>
      </div>

      {/* Table */}
      <ProductTable
        products={paginatedProducts}
        suppliers={allSuppliers}
        onManage={handleManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <PaginationControls
        paginatedItems={paginatedProducts}
        hasNextPage={hasNextPage}
        onRefresh={handleRefresh}
        onNextPage={handleNextPage}
      />

      {/* Modal */}
      {isManageModalOpen && (
        <ManageProductsModal
          product={selectedProduct}
          suppliers={allSuppliers}
          onAssign={handleAssignSupplier}
          onClose={() => setIsManageModalOpen(false)}
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
