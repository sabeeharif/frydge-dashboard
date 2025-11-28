"use client"
import { useState } from "react"
import { Plus, Trash2, Download, Calendar, Package, AlertCircle } from "lucide-react"
import Loader from "@/app/components/Loader"

// Mock data
const mockSuppliers = [
    { id: "1", name: "Fresh Foods Ltd", supplierId: "SUP001" },
    { id: "2", name: "Tech Hardware Inc.", supplierId: "SUP002" },
]

const mockMachines = [
    { id: "M001", name: "Machine A", location: "Factory 1" },
    { id: "M002", name: "Machine B", location: "Factory 1" },
    { id: "M003", name: "Machine C", location: "Factory 2" },
]

const mockProducts = {
    "1": [
        { id: "p1", name: "Product 1A", sku: "SKU001", price: 100 },
        { id: "p2", name: "Product 1B", sku: "SKU002", price: 150 },
    ],
    "2": [
        { id: "p3", name: "Product 2A", sku: "SKU003", price: 200 },
        { id: "p4", name: "Product 2B", sku: "SKU004", price: 250 },
    ],
}

// Standard Quantity Management Modal
function StandardQuantityModal({ isOpen, onClose, onSave }) {
    const [quantities, setQuantities] = useState(
        mockMachines.map((m) => ({ machineId: m.id, quantity: 10 })),
    )

    const handleQuantityChange = (machineId, value) => {
        setQuantities((prev) => prev.map((q) => (q.machineId === machineId ? { ...q, quantity: value } : q)))
    }

    const handleSubmit = () => {
        onSave(quantities)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={onClose}></div>
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6 z-50">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">Manage Standard Quantities</h3>
                    <p className="text-sm text-gray-500">Set the standard order quantity for each machine</p>
                </div>

                <div className="space-y-4 mb-6">
                    {quantities.map((q) => {
                        const machine = mockMachines.find((m) => m.id === q.machineId)
                        return (
                            <div key={q.machineId} className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">{machine?.name}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={q.quantity}
                                        onChange={(e) => handleQuantityChange(q.machineId, Number.parseInt(e.target.value) || 0)}
                                        placeholder="Enter quantity"
                                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                    >
                        Save Quantities
                    </button>
                </div>
            </div>
        </div>
    )
}

// Create Order Modal
function CreateOrderModal({ isOpen, onClose, onSave, standardQuantities }) {
    const [date, setDate] = useState("")
    const [selectedItems, setSelectedItems] = useState([])
    const [currentMachine, setCurrentMachine] = useState("")
    const [currentSupplier, setCurrentSupplier] = useState("")
    const [currentProduct, setCurrentProduct] = useState("")
    const [currentQuantity, setCurrentQuantity] = useState("")
    const [isLowOrder, setIsLowOrder] = useState(false)

    const currentProducts = currentSupplier ? mockProducts[currentSupplier] || [] : []

    const handleAddItem = () => {
        if (!currentMachine || !currentProduct) return

        const product = currentProducts.find((p) => p.id === currentProduct)
        const machine = mockMachines.find((m) => m.id === currentMachine)
        if (!product || !machine) return

        let quantity = Number.parseInt(currentQuantity) || 0

        if (quantity === 0) {
            const standardQty = standardQuantities.find((q) => q.machineId === currentMachine)?.quantity || 10
            quantity = isLowOrder ? Math.ceil(standardQty / 2) : standardQty
        }

        const newItem = {
            machineId: currentMachine,
            machineName: machine.name,
            supplierId: currentSupplier,
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price,
            total: quantity * product.price,
        }

        setSelectedItems((prev) => [...prev, newItem])
        setCurrentProduct("")
        setCurrentQuantity("")
    }

    const handleRemoveItem = (index) => {
        setSelectedItems((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        if (!date || selectedItems.length === 0) {
            alert("Please select date and add items")
            return
        }

        const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0)

        onSave({
            date,
            items: selectedItems,
            totalAmount,
        })

        setDate("")
        setSelectedItems([])
        setCurrentMachine("")
        setCurrentSupplier("")
        setCurrentProduct("")
        setCurrentQuantity("")
        setIsLowOrder(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={onClose}></div>
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-2xl font-semibold">Create New Order</h3>
                    <p className="text-sm text-gray-500">Step 1: Select Date → Step 2: Select Machine and Products</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label htmlFor="order-date" className=" flex gap-1  text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            Order Date
                        </label>
                        <input
                            id="order-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {date && (
                        <div className="border rounded-lg p-4 space-y-4 bg-gray-100/50">
                            <h4 className="font-semibold">Add Products to Order</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="machine" className="text-sm font-medium block mb-1">Machine</label>
                                    <select
                                        id="machine"
                                        value={currentMachine}
                                        onChange={(e) => setCurrentMachine(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
                                    >
                                        <option value="">Select machine</option>
                                        {mockMachines.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="supplier" className="text-sm font-medium block mb-1">Supplier</label>
                                    <select
                                        id="supplier"
                                        value={currentSupplier}
                                        onChange={(e) => setCurrentSupplier(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
                                    >
                                        <option value="">Select supplier</option>
                                        {mockSuppliers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {currentSupplier && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="product" className="text-sm font-medium block mb-1">Product</label>
                                        <select
                                            id="product"
                                            value={currentProduct}
                                            onChange={(e) => setCurrentProduct(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
                                        >
                                            <option value="">Select product</option>
                                            {currentProducts.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="quantity" className="text-sm font-medium block mb-1">Quantity (optional)</label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="0"
                                            value={currentQuantity}
                                            onChange={(e) => setCurrentQuantity(e.target.value)}
                                            placeholder="Leave blank for default"
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
                                        />
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={() => setIsLowOrder(!isLowOrder)}
                                            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100"
                                        >
                                            {isLowOrder ? "Low Order 50%" : "Standard Order"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAddItem}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item to Order
                            </button>
                        </div>
                    )}

                    {selectedItems.length > 0 && (
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="w-full ">
                                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="h-12 px-4 text-left font-medium">Machine</th>
                                            <th className="h-12 px-4 text-left font-medium">Product</th>
                                            <th className="h-12 px-4 text-right font-medium">Qty</th>
                                            <th className="h-12 px-4 text-right font-medium">Price</th>
                                            <th className="h-12 px-4 text-right font-medium">Total</th>
                                            <th className="h-12 px-4 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.map((item, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="p-4">{item.machineName}</td>
                                                <td className="p-4">{item.productName}</td>
                                                <td className="p-4 text-right">{item.quantity}</td>
                                                <td className="p-4 text-right">${item.price}</td>
                                                <td className="p-4 text-right font-semibold">${item.total}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="inline-flex items-center justify-center rounded-md h-9 px-3 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="px-6 py-4 bg-gray-100/50 border-t font-semibold text-right">
                                    Total: ${selectedItems.reduce((sum, item) => sum + item.total, 0)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!date || selectedItems.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Order
                    </button>
                </div>
            </div>
        </div>
    )
}

// Main Orders Page
export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showQuantityModal, setShowQuantityModal] = useState(false)
    const [standardQuantities, setStandardQuantities] = useState(
        mockMachines.map((m) => ({ machineId: m.id, quantity: 10 })),
    )

    const generateCSV = (order) => {
        const headers = ["Date", "Machine", "Supplier", "Product", "Quantity", "Price", "Total"]
        const rows = order.items.map((item) => [
            order.date,
            item.machineName,
            mockSuppliers.find((s) => s.id === item.supplierId)?.name || "",
            item.productName,
            item.quantity,
            item.price,
            item.total,
        ])

        const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `order-${order.id}-${order.date}.csv`
        a.click()
    }

    const generateXLSX = (order) => {
        const data = {
            date: order.date,
            orderId: order.id,
            items: order.items.map((item) => ({
                machine: item.machineName,
                supplier: mockSuppliers.find((s) => s.id === item.supplierId)?.name || "",
                product: item.productName,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            })),
            totalAmount: order.totalAmount,
        }

        const jsonContent = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonContent], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `order-${order.id}-${order.date}.json`
        a.click()
    }

    const handleCreateOrder = (orderData) => {
        const newOrder = {
            ...orderData,
            id: `ORD${Date.now()}`,
            createdAt: new Date().toISOString(),
        }
        setOrders((prev) => [newOrder, ...prev])
        setShowCreateModal(false)
    }

    const handleDeleteOrder = (orderId) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 space-y-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">Error Loading Suppliers</h3>
                            <p className="text-red-700 mt-1">{error}</p>
                            <button
                                // onClick={() => fetchUsers()}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <main className="container mx-auto py-8 px-4">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h3 className="text-3xl font-bold mb-2">Order Management</h3>
                    <p className="text-gray-500">Create and manage supplier orders with automatic quantity settings</p>
                </div>
                <button
                    onClick={() => setShowQuantityModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                >
                    <Package className="w-4 h-4" />
                    Manage Standard Quantities
                </button>
            </div>

            <div className="mb-6">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create New Order
                </button>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="rounded-lg border bg-white shadow-sm p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{order.id}</h3>
                                    <p className="text-sm text-gray-500">Date: {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">${order.totalAmount}</p>
                                    <p className="text-sm text-gray-500">{order.items.length} items</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-gray-100/50">
                                        <tr>
                                            <th className="h-12 px-4 text-left font-medium">Machine</th>
                                            <th className="h-12 px-4 text-left font-medium">Supplier</th>
                                            <th className="h-12 px-4 text-left font-medium">Product</th>
                                            <th className="h-12 px-4 text-right font-medium">Qty</th>
                                            <th className="h-12 px-4 text-right font-medium">Price</th>
                                            <th className="h-12 px-4 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-4">{item.machineName}</td>
                                                <td className="p-4">{mockSuppliers.find((s) => s.id === item.supplierId)?.name}</td>
                                                <td className="p-4">{item.productName}</td>
                                                <td className="p-4 text-right">{item.quantity}</td>
                                                <td className="p-4 text-right">${item.price}</td>
                                                <td className="p-4 text-right font-semibold">${item.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Created: {new Date(order.createdAt).toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generateCSV(order)}
                                        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 border border-gray-300 bg-white hover:bg-gray-100"
                                    >
                                        <Download className="w-4 h-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => generateXLSX(order)}
                                        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 border border-gray-300 bg-white hover:bg-gray-100"
                                    >
                                        <Download className="w-4 h-4" />
                                        JSON (XLSX)
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border bg-white shadow-sm p-12 text-center">
                    <p className="text-gray-500">No orders created yet. Click "Create New Order" to get started.</p>
                </div>
            )}

            <StandardQuantityModal
                isOpen={showQuantityModal}
                onClose={() => setShowQuantityModal(false)}
                onSave={setStandardQuantities}
            />

            <CreateOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateOrder}
                standardQuantities={standardQuantities}
            />
        </main>
    )
}