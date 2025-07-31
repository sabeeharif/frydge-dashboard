import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get("machineId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!machineId || !startDate || !endDate) {
      return NextResponse.json({ error: "Machine ID, start date, and end date are required" }, { status: 400 })
    }

    console.log("Fetching sales data for machine:", machineId, "from:", startDate, "to:", endDate)

    const response = await fetch(
      `https://frydge.com/testing2/vlCalls/orderSalesGET.php?machineId=${machineId}&startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sales API Error:", errorText)
      return NextResponse.json({ error: `Sales API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("Sales API Success - Orders count:", data.length)

    // Process the sales data to generate reporting metrics
    const processedData = processSalesData(data)

    return NextResponse.json(processedData, { status: 200 })
  } catch (error) {
    console.error("Sales API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}

function processSalesData(salesData) {
  if (!salesData || salesData.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topProducts: [],
      successfulOrders: 0,
      failedOrders: 0,
      totalDiscount: 0,
      totalVat: 0,
      ordersByDate: {},
      productSales: {},
      rawData: salesData,
    }
  }

  let totalSales = 0
  const totalOrders = salesData.length
  let successfulOrders = 0
  let failedOrders = 0
  let totalDiscount = 0
  let totalVat = 0
  const productSales = {}
  const ordersByDate = {}

  salesData.forEach((order) => {
    const orderDate = order.createdAt?.split("T")[0] || "Unknown"
    ordersByDate[orderDate] = (ordersByDate[orderDate] || 0) + 1

    // Check if order was successful
    if (order.charged === "Yes") {
      successfulOrders++
      totalSales += Number.parseFloat(order.totalCharged || 0)
      totalDiscount += Number.parseFloat(order.discountTotal || 0)
      totalVat += Number.parseFloat(order.totalVat || 0)
    } else {
      failedOrders++
    }

    // Process product sales
    if (order.productSales && Array.isArray(order.productSales)) {
      order.productSales.forEach((productSale) => {
        const productName = productSale.product?.name || "Unknown Product"
        const productRevenue = Number.parseFloat(productSale.totalPaid || 0)

        if (!productSales[productName]) {
          productSales[productName] = { count: 0, revenue: 0 }
        }

        productSales[productName].count += 1
        if (order.charged === "Yes") {
          productSales[productName].revenue += productRevenue
        }
      })
    }
  })

  // Get top products by count
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
    }))

  const averageOrderValue = successfulOrders > 0 ? totalSales / successfulOrders : 0

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    totalOrders,
    successfulOrders,
    failedOrders,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    topProducts,
    ordersByDate,
    productSales,
    rawData: salesData,
  }
}
