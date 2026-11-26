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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/80" onClick={onClose}></div>
            <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-lg w-full max-w-lg p-4 sm:p-6 z-50 max-h-[92dvh] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                <div className="flex justify-center sm:hidden pb-2">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">Manage Standard Quantities</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Set the standard order quantity for each machine</p>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {quantities.map((q) => {
                        const machine = mockMachines.find((m) => m.id === q.machineId)
                        return (
                            <div key={q.machineId} className="flex items-end gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs sm:text-sm font-medium">{machine?.name}</label>
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
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
    const [isStandard, setIsStandard] = useState(false)
    const [isLow, setIsLow] = useState(false)
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
      const handleStandardChange = (checked) => {
    setIsStandard(checked)
    setIsLow(false)
    if (checked && currentMachine) {
      const standardQty = standardQuantities.find((q) => q.machineId === currentMachine)?.quantity || 10
      setCurrentQuantity(standardQty.toString())
    } else {
      setCurrentQuantity("")
    }
  }

  const handleLowChange = (checked) => {
    setIsLow(checked)
    setIsStandard(false)
    if (checked && currentMachine) {
      const standardQty = standardQuantities.find((q) => q.machineId === currentMachine)?.quantity || 10
      const lowQty = Math.ceil(standardQty / 2)
      setCurrentQuantity(lowQty.toString())
    } else {
      setCurrentQuantity("")
    }
  }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/80" onClick={onClose}></div>
            <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-lg w-full max-w-2xl p-4 sm:p-6 z-50 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                <div className="flex justify-center sm:hidden pb-2">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-2xl font-semibold">Create New Order</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Step 1: Select Date → Step 2: Select Machine and Products</p>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div>
                        <label htmlFor="order-date" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            <Calendar className="w-4 h-4 shrink-0" />
                            Order Date
                        </label>
                        <input
                            id="order-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {date && (
                        <div className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-100/50">
                            <h4 className="text-sm sm:text-base font-semibold">Add Products to Order</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label htmlFor="machine" className="text-xs sm:text-sm font-medium block mb-1">Machine</label>
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
                                    <label htmlFor="supplier" className="text-xs sm:text-sm font-medium block mb-1">Supplier</label>
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
                                <div className="space-y-3">

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label htmlFor="product" className="text-xs sm:text-sm font-medium block mb-1">Product</label>
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
                                            <label htmlFor="quantity" className="text-xs sm:text-sm font-medium block mb-1">Quantity (optional)</label>
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

                                    </div>
                                    <div className="border rounded-lg p-3 sm:p-4 bg-white space-y-3">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-700">Order Type:</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="standard-order"
                                                    checked={isStandard}
                                                    onChange={(e) => handleStandardChange(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                <label htmlFor="standard-order" className="cursor-pointer text-sm">
                                                    <span className="font-medium">Standard Order</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="low-order"
                                                    checked={isLow}
                                                    onChange={(e) => handleLowChange(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                                <label htmlFor="low-order" className="cursor-pointer text-sm">
                                                    <span className="font-medium">Low Order (50%)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="sm:hidden">Add Item</span>
                                <span className="hidden sm:inline">Add Item to Order</span>
                            </button>
                        </div>
                    )}

                    {selectedItems.length > 0 && (
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[480px] text-sm">
                                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="h-10 sm:h-12 px-2 sm:px-4 text-left text-[10px] sm:text-sm font-medium">Machine</th>
                                            <th className="h-10 sm:h-12 px-2 sm:px-4 text-left text-[10px] sm:text-sm font-medium">Product</th>
                                            <th className="h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Qty</th>
                                            <th className="hidden sm:table-cell h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Price</th>
                                            <th className="h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Total</th>
                                            <th className="h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.map((item, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.machineName}</td>
                                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.productName}</td>
                                                <td className="p-2 sm:p-4 text-right text-xs sm:text-sm">{item.quantity}</td>
                                                <td className="hidden sm:table-cell p-2 sm:p-4 text-right text-xs sm:text-sm">${item.price}</td>
                                                <td className="p-2 sm:p-4 text-right text-xs sm:text-sm font-semibold">${item.total}</td>
                                                <td className="p-2 sm:p-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="inline-flex items-center justify-center rounded-md h-8 sm:h-9 px-2 sm:px-3 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-100/50 border-t text-sm sm:text-base font-semibold text-right">
                                    Total: ${selectedItems.reduce((sum, item) => sum + item.total, 0)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!date || selectedItems.length === 0}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="p-3 sm:p-6 lg:p-8 space-y-4 lg:space-y-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-start sm:items-center">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                            <h3 className="text-sm sm:text-lg font-semibold text-red-800">Error Loading Suppliers</h3>
                            <p className="text-red-700 mt-1 text-xs sm:text-base">{error}</p>
                            <button
                                type="button"
                                // onClick={() => fetchUsers()}
                                className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        <main className="space-y-4 lg:space-y-8">
            <div className="mb-2 lg:mb-8 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 text-left">
                        <Package className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
                        <span>Order Management</span>
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600">Create and manage supplier orders with automatic quantity settings</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowQuantityModal(true)}
                        className="w-full sm:w-auto px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="sm:hidden">Quantities</span>
                        <span className="hidden sm:inline">Manage Standard Quantities</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="sm:hidden">New Order</span>
                        <span className="hidden sm:inline">Create New Order</span>
                    </button>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-lg font-semibold truncate">{order.id}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Date: {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900">${order.totalAmount}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">{order.items.length} items</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden mb-3 sm:mb-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[520px] text-sm">
                                        <thead className="border-b bg-gray-100/50">
                                            <tr>
                                                <th className="h-10 sm:h-12 px-2 sm:px-4 text-left text-[10px] sm:text-sm font-medium">Machine</th>
                                                <th className="hidden md:table-cell h-10 sm:h-12 px-2 sm:px-4 text-left text-[10px] sm:text-sm font-medium">Supplier</th>
                                                <th className="h-10 sm:h-12 px-2 sm:px-4 text-left text-[10px] sm:text-sm font-medium">Product</th>
                                                <th className="h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Qty</th>
                                                <th className="hidden sm:table-cell h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Price</th>
                                                <th className="h-10 sm:h-12 px-2 sm:px-4 text-right text-[10px] sm:text-sm font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.machineName}</td>
                                                    <td className="hidden md:table-cell p-2 sm:p-4 text-xs sm:text-sm">{mockSuppliers.find((s) => s.id === item.supplierId)?.name}</td>
                                                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.productName}</td>
                                                    <td className="p-2 sm:p-4 text-right text-xs sm:text-sm">{item.quantity}</td>
                                                    <td className="hidden sm:table-cell p-2 sm:p-4 text-right text-xs sm:text-sm">${item.price}</td>
                                                    <td className="p-2 sm:p-4 text-right text-xs sm:text-sm font-semibold">${item.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                                <div className="text-xs sm:text-sm text-gray-500">
                                    Created: {new Date(order.createdAt).toLocaleString()}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => generateCSV(order)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md text-xs sm:text-sm font-medium h-9 px-3 border border-gray-300 bg-white hover:bg-gray-100"
                                    >
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => generateXLSX(order)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md text-xs sm:text-sm font-medium h-9 px-3 border border-gray-300 bg-white hover:bg-gray-100"
                                    >
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="sm:hidden">JSON</span>
                                        <span className="hidden sm:inline">JSON (XLSX)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md text-xs sm:text-sm font-medium h-9 px-3 bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 sm:p-12 text-center">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm sm:text-base text-gray-500">No orders created yet. Click &quot;Create New Order&quot; to get started.</p>
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