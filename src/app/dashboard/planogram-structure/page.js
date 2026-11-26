"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/app/lib/auth";
import Loader from "@/app/components/Loader";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/app/contexts/ToastContext";
import { OrderFileForSupplier } from "@/app/components/planogram/OrderFileForSupplier"

const getGermanTime = () => {
  const now = new Date();

  // Format the current date to German time string
  const germanTimeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Berlin",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  return germanTimeStr; // Returns "HH:mm"
};

const PlanogramStructure = () => {
  const [date, setDate] = useState("");
  // const [time, setTime] = useState("");
  const [time, setTime] = useState(getGermanTime());

  const { success: toastSuccess } = useToast()
  const [structure, setStructure] = useState({})
  const [currentStructure, setCurrentStructure] = useState({})
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [maxOrder, setMaxOrder] = useState({})
  const [updatingPlanogram, setUpdatingPlanogram] = useState()
  const [planogramMeta, setPlanogramMeta] = useState(null)
  const [productSearch, setProductSearch] = useState("")
  const [productOptions, setProductOptions] = useState([])

  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [supplierFetchProgress, setSupplierFetchProgress] = useState()
  const [allProducts, setAllProducts] = useState([])
  const [allSuppliers, setAllSuppliers] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedReApplyDate, setSelectedReApplyDate] = useState("")
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isReapplyPlanModalDateOpen, setIsReapplyPlanModalDateOpen] = useState(false)
  const [isNotify, setIsNotify] = useState(false)
  const [selectedPlanDate, setSelectedPlanDate] = useState("")
  const [categoryFetchProgress, setCategoryFetchProgress] = useState()
  const [supplierLoading, setSupplierLoading] = useState()
  const [categoryLoading, setCategoryLoading] = useState()
  const [groupMachines, setGroupMachines] = useState([]) // all machines
  const [excludeEnabled, setExcludeEnabled] = useState(false)
  const [excludedMachineIds, setExcludedMachineIds] = useState([])
  const [includeEnabled, setIncludeEnabled] = useState(false)
  const [includedMachineIds, setIncludedMachineIds] = useState([])
  const [applyToGroup, setApplyToGroup] = useState(true)
  const [dateLoader, setDateLoader] = useState()
  const searchTimeoutRef = useRef(null)
  const hasFetchedPlanogramRef = useRef(false)
  const isFetchingCategoriesRef = useRef(false)
  const isFetchingSuppliersRef = useRef(false)
  const shelfRefs = useRef({});
  const searchParams = useSearchParams()
  const machineStructureId = searchParams.get("machineStructureId")
  const machineId = searchParams.get("machineId")
  const planogramVersionId = searchParams.get("planogramVersionId")
  const action = searchParams.get("action")
  const pageSize = 10
  const router = useRouter()

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


  const formatNewPlanDate = (dateString, dateOnly = false) => {
    try {
      if (!dateString) return "";

      // Split date and time
      const [datePart, timePart] = dateString.split("T");
      const [day, month, year] = datePart.split("-");

      // Use real time if present
      const formattedDate = `${year}-${month}-${day}T${timePart || "00:00:00"}`;

      const date = new Date(formattedDate);

      if (dateOnly) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTimeOnly = (dateString) => {
    try {
      if (!dateString) return "";

      // Split date and time
      const [datePart, timePart] = dateString.split("T");
      const [hoursStr, minutesStr] = (timePart || "00:00").split(":");

      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;

      return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    } catch (error) {
      return "";
    }
  };

  // fetch orders Dates 
  const fetchOrderDates = async () => {
    setDateLoader(true)
    try {
      const res = await api.getInternalOrederDates({ machineStructureId: machineStructureId, planogramVersionId: planogramVersionId, limit: 10 })
      const data = await res.json()
      setAvailableDates(data?.planogramOrderDates || [])
      if (data?.planogramOrderDates?.length > 0) {
        setDateLoader(false)
      }
    } catch (error) {
      console.error("Failed to fetch dates", error)
      setDateLoader(false)
    } finally {
      setDateLoader(false)
    }
  }

  // Open edit modal funtion
  const openEditModal = (item, channelNumber, shelfIndex) => {
    console.log(item);
    setEditItem({ ...item, channelNumber, shelfIndex })
    setProductSearch(item?.productName)
    setCategories(item.categoryIds || [])
    setSuppliers(item.supplierIds || [])
    setMaxOrder(item.maxOrderCapacity || {})
    fetchProducts(item)
  }

  // shelf data save function
  const handleSave = async () => {
    try {
      // Simulated API call
      console.log("Saving:", {
        channelNumber: editItem.channelNumber,
        shelfIndex: editItem.shelfIndex,
        categoryIds: categories,
        supplierIds: suppliers,
        maxOrderCapacity: maxOrder,
        productName: editItem?.productName,
        productId: editItem?.productId,
        externalProductId: editItem?.externalProductId,
        price: editItem?.price,
        productImage: editItem?.productImage
      })

      setStructure((prev) => {
        const updated = { ...prev }
        updated[editItem.channelNumber][editItem.shelfIndex] = {
          ...updated[editItem.channelNumber][editItem.shelfIndex],
          categoryIds: categories,
          supplierIds: suppliers,
          maxOrderCapacity: maxOrder,
          channelModified: true,
          productName: editItem?.productName,
          productId: editItem?.productId,
          externalProductId: editItem?.externalProductId,
          price: editItem?.price,
          productImage: editItem?.productImage
        }
        return updated
      })

      setEditItem(null)
    } catch (err) {
      console.error(err)
      alert("Update failed")
    }
  }

  // update planogram fucntion
  const handleUpdatePlanogram = async () => {
    setUpdatingPlanogram(true)
    const channelDetails = Object.values(structure).flat()
    const payload = {
      machineStructureId: planogramMeta.machineStructureId,
      planogramVersionId: planogramMeta.planogramVersionId,
      primeMachine: planogramMeta?.primeMachine,
      machineId: planogramMeta.machineId,
      friendlyName: planogramMeta?.friendlyName,
      venueName: planogramMeta?.venueName,
      channelDetails: channelDetails,
    }

    try {
      // // 🔹 API call
      const response = await api.updatePlangoramVersionStructure(payload.planogramVersionId, payload)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      toastSuccess("Successfully Update Planogram Structure")

      setEditItem(null)
      fetchPlanogramStructure()
    } catch (err) {
      console.error("Update failed:", err)

      alert("Update failed. Please try again.")
    } finally {
      setUpdatingPlanogram(false)
    }
  }

  // finalize planogram function
  const handleFinalizePlanogram = async () => {
    setUpdatingPlanogram(true)
    const channelDetails = Object.values(structure || {}).flat();
    // console.log("groupMachines", groupMachines)
    // console.log("selectedPlanDate", selectedPlanDate)

    // Split date and time
    const timePart = selectedPlanDate?.split('T')[1]; // "00:00:01"

    // Get hours and minutes
    let [hours, minutes] = timePart?.split(':')?.map(Number);

    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    // Format time string without seconds
    const plannedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    // console.log("Planned Time:", plannedTime);

    const machineIds = groupMachines.map(machine => machine.machineId);
    const payload = {
      orderSnapshotId: planogramMeta?.orderSnapshotId && selectedDate && !selectedReApplyDate ? planogramMeta?.orderSnapshotId : "",
      planogramOrderId: selectedReApplyDate || !selectedDate && planogramMeta?.planogramOrderId ? "" : planogramMeta?.planogramOrderId,
      plannedPlanogramDate: selectedDate && !selectedReApplyDate ? selectedDate : (selectedPlanDate || selectedReApplyDate),
      excludedMachineIds: excludedMachineIds,
      includedMachineIds: includedMachineIds,
      allMachineIds: machineIds,
      productAssignments: channelDetails,
      plannedPlanogramTime: plannedTime
    }

    // console.log("payload", payload);
    try {
      const response = await api.finalizePlangoramVersionStructure(planogramMeta.planogramVersionId, payload)
      console.log(response.status);
      if (!response.ok || !response.status === 200) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      toastSuccess(`Structure Finalize Successfully`)
      router.push(
        `/dashboard/planogram-version-details?planogramVersionId=${planogramMeta?.planogramVersionId}`
      )
      setEditItem(null)
    } catch (err) {
      console.error("Update failed:", err)
      console.log("erer", err);
      alert("Update failed. Please try again.")
    } finally {
      setUpdatingPlanogram(false)
    }
  }

  // Progressively function to return the multiply data
  const fetchProgressively = async ({
    fetchFn,
    onData,
    maxPages = 50,
    limit = 20,
    delay = 300,
    setLoading,
    isFetchingRef,
    setProgress,
    label = "items",
  }) => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    // setLoading(true)

    try {
      let allItems = []
      let lastKey = null
      let pageCount = 0

      setProgress({ current: 0, total: maxPages })

      do {
        pageCount++
        setProgress({ current: pageCount, total: maxPages })

        const response = await fetchFn({ limit, lastKey })

        if (!response.ok) break

        const data = await response.json()
        const items = data.results || data.products || data.productCategories || data.suppliers || []

        allItems = [...allItems, ...items]
        onData([...allItems])

        lastKey = data.lastKey || null

        if (lastKey && pageCount < maxPages) {
          await new Promise((res) => setTimeout(res, delay))
        }
      } while (lastKey && pageCount < maxPages)

    } catch (err) {
      console.error(`Error fetching ${label}:`, err)
    } finally {
      // setLoading(false)
      isFetchingRef.current = false
    }
  }

  // const fetchAllProductsProgressively = async () => {
  //   if (isFetchingAllProductsRef.current) return

  //   isFetchingAllProductsRef.current = true
  //   setProductSearchLoading(true)

  //   try {
  //     let allFetchedProducts = []
  //     let currentLastKey = null
  //     let pageCount = 0
  //     const maxPages = 50

  //     setFetchProgress({ current: 0, total: maxPages })

  //     do {
  //       pageCount++
  //       setFetchProgress({ current: pageCount, total: maxPages })

  //       const response = await api.getProducts({
  //         limit: 20,
  //         lastKey: currentLastKey,
  //       })

  //       if (response.ok) {
  //         const data = await response.json()
  //         const newProducts = data.products || data.results || []
  //         allFetchedProducts = [...allFetchedProducts, ...newProducts]
  //         setAllProducts([...allFetchedProducts])
  //         setProductOptions([...allFetchedProducts])
  //         currentLastKey = data.lastKey || null
  //       } else {
  //         break
  //       }

  //       // Small delay between pages
  //       if (pageCount < maxPages && currentLastKey) {
  //         await new Promise((resolve) => setTimeout(resolve, 300))
  //       }
  //     } while (currentLastKey && pageCount < maxPages)

  //   } catch (err) {
  //     console.error("Error fetching products:", err)
  //   } finally {
  //     setProductSearchLoading(false)
  //     isFetchingAllProductsRef.current = false
  //   }
  // }



  //  fetch suppliers to use the progressively function
  const fetchAllSuppliersProgressively = () =>
    fetchProgressively({
      fetchFn: api.getSuppliers,
      onData: setAllSuppliers,
      isFetchingRef: isFetchingSuppliersRef,
      setProgress: setSupplierFetchProgress,
      label: "suppliers",
    })

  //  fetch categories to use the progressively function
  const fetchAllCategoriesProgressively = () =>
    fetchProgressively({
      fetchFn: api.getProductsCategories,
      onData: setAllCategories,
      setLoading: setCategoryLoading,
      isFetchingRef: isFetchingCategoriesRef,
      setProgress: setCategoryFetchProgress,
      label: "categories",
    })

  // fetch all products
  const fetchProducts = async (item) => {
    setProductSearchLoading(true)
    try {
      const response = await api.getProductsByCategoryAndSupplier(
        item.categoryIds,   // dynamic limit
        item?.supplierIds        // pagination key
      );


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const fetchedCategory = data.products || data.results || [];


      setAllProducts(fetchedCategory);
      setProductSearchLoading(false)

    } catch (error) {
      setProductSearchLoading(false)
      console.error("Failed to load suppliers", error);
    } finally {
      setProductSearchLoading(false)
    }
  };

  // category selector
  const handleCategorySelect = (e) => {
    const value = e.target.value
    if (value && !categories.includes(value)) {
      setCategories([...categories, value])
    }
  }

  // supplier Selector
  const handleSupplierSelect = (e) => {
    const value = e.target.value
    if (value && !suppliers.includes(value)) {
      setSuppliers([...suppliers, value])
    }
  }

  //  exclude Machine selector fun
  const handleExcludeMachinesSelect = (e) => {
    const value = e.target.value
    if (value && !excludedMachineIds.includes(value)) {
      setExcludedMachineIds([...excludedMachineIds, value])
    }
  }

  //  include Machine selector fun
  const handleIncludeMachinesSelect = (e) => {
    const value = e.target.value
    if (value && !includedMachineIds.includes(value)) {
      setIncludedMachineIds([...includedMachineIds, value])
    }
  }

  //  remove category fun
  const removeCategory = (catId) => {
    setCategories(categories.filter((c) => c !== catId))
  }

  // remove supplier func
  const removeSupplier = (supId) => {
    setSuppliers(suppliers.filter((s) => s !== supId))
  }

  // fetch planogram structure 
  const fetchPlanogramStructure = async () => {
    setLoading(true)
    try {
      const response = await api.getPlanogramStructure({
        machineId: machineId,
        planogramVersionId: planogramVersionId
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.planogramStructure?.length > 0) {
        setPlanogramMeta({
          machineStructureId: result?.planogramStructure[0].machineStructureId,
          planogramVersionId: result?.planogramStructure[0].planogramVersionId,
          machineId: result?.planogramStructure[0].machineId,
          primeMachine: result?.planogramStructure[0].primeMachine,
          friendlyName: result?.planogramStructure[0].friendlyName,
          venueName: result?.planogramStructure[0].venueName
        })
        const channels =
          result.planogramStructure[0].channelDetails || [];

        // 🔹 Group by channel
        const grouped = channels.reduce((acc, item) => {
          if (!acc[item.shelf]) acc[item.shelf] = [];
          acc[item.shelf].push(item);
          return acc;
        }, {});

        // 🔹 Sort internalChannel inside each channel
        Object.keys(grouped).forEach((shelf) => {
          grouped[shelf].sort(
            (a, b) => a.channel - b.channel
          );
        });
        setStructure(grouped);
        setCurrentStructure(grouped)
      }
    } catch (error) {
      console.error("Failed to fetch planogram structure", error);
    } finally {
      setLoading(false)
      setSelectedDate("")
      setExcludedMachineIds([])
      setExcludeEnabled(false)
      setIncludedMachineIds([])
      setIncludeEnabled(false)
    }
  };

  const fetchInteranalOrdersStructure = async (item) => {
    const planogramOrderId = item?.planogramOrderId;
    if (!planogramOrderId) return;

    setLoading(true);
    try {
      // 1️⃣ Fetch internal orders
      const response = await api.getInternalOreders({
        planogramOrderId,
        machineId: planogramMeta?.machineId,
        limit: 10,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      console.log("Internal Orders:", result);

      if (result.planogramOrders?.length > 0) {
        const order = result.planogramOrders[0]; // assuming only one internal order
        let snapshotData = null;
        // 2️⃣ Fetch channels using orderSnapshotId
        const snapshotId = order.orderSnapshotId || order?.orderSnapshot?.[0]?.id;
        if (snapshotId) {
          const snapshotResponse = await api.getOrderSnapshotChannels({ orderSnapshotId: snapshotId, machineId: planogramMeta?.machineId, });
          if (!snapshotResponse.ok) throw new Error(`Snapshot HTTP ${snapshotResponse.status}`);
          snapshotData = await snapshotResponse.json();
          console.log("Snapshot Channels:", snapshotData);

          const channels = Object.values(snapshotData?.
            orderSnapshots[0]?.orderDetails || {}).flat();

          // 🔹 Group by shelf
          const grouped = channels.reduce((acc, item) => {
            if (!acc[item.shelf]) acc[item.shelf] = [];
            acc[item.shelf].push(item);
            return acc;
          }, {});

          // 🔹 Sort channels inside each shelf
          Object.keys(grouped).forEach((shelf) => {
            grouped[shelf].sort((a, b) => a.channel - b.channel);
          });

          // compare products with currect products
          const comparedGrouped = {}

          Object.entries(grouped).forEach(([shelf, items]) => {
            comparedGrouped[shelf] = items.map((item) => {

              const currentItem =
                currentStructure?.[shelf]?.find(
                  (c) => String(c.channel) === String(item.channel)
                )

              const isDifferent =
                currentItem?.productId !== item?.productId

              return {
                ...item,

                comparedProductId: currentItem?.productId || null,
                comparedProductName: currentItem?.productName || null,
                comparedExternalProductId:
                  currentItem?.externalProductId || null,

                isDifferent,

                currentProduct: currentItem || null,
              }
            })
          })

          setStructure(comparedGrouped);
        }
        // 3️⃣ Set planogram meta
        setPlanogramMeta({
          orderSnapshotId: order.orderSnapshotId,
          planogramOrderId: order.planogramOrderId,
          planogramVersionId: order.planogramVersionId,
          includedMachineIds: order.includedMachineIds || [],
          excludedMachineIds: order.excludedMachineIds || [],
          machineId: snapshotData?.orderSnapshots?.[0]?.machineId,
          createdAt: order.createdAt,
          friendlyName: snapshotData?.orderSnapshots?.[0]?.friendlyName,
          venueName: snapshotData?.orderSnapshots?.[0]?.venueName,
          draft: order?.draft,
          supplierOrderFiles: order?.supplierOrderFiles,
        });

        // 4️⃣ Handle included/excluded machines
        if (order.includedMachineIds?.length && order.excludedMachineIds?.length) {
          setExcludedMachineIds(order.excludedMachineIds);
          setExcludeEnabled(true);
          setIncludedMachineIds(order.includedMachineIds);
          setIncludeEnabled(true);
        } else if (order.includedMachineIds?.length) {
          setIncludedMachineIds(order.includedMachineIds);
          setIncludeEnabled(true);
        } else if (order.excludedMachineIds?.length) {
          setExcludedMachineIds(order.excludedMachineIds);
          setExcludeEnabled(true);
        } else {
          setIncludedMachineIds([]);
          setIncludeEnabled(false);
          setExcludedMachineIds([]);
          setExcludeEnabled(false);
        }
      } else {
        setStructure(result?.internalOrders || []);
      }
    } catch (error) {
      console.error("Failed to fetch internal order structure", error);
    } finally {
      setLoading(false);
    }
  };

  // fetch planogram Version

  const fetchPlanogramVersions = async (useLastKey = null) => {
    try {
      let apiUrl = `/api/planogram_versions?limit=${pageSize}`
      if (useLastKey) {
        apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
      }

      const response = await api.getPlanogramVersions({
        limit: pageSize,
        lastKey: useLastKey,
        planogramVersionId: planogramMeta?.planogramVersionId
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Handle different response structures
      const fetchedProducts = data?.planogramVersions[0] || data.results || []
      // console.log("fetchedProducts", fetchedProducts);

      const detailResponse = await api.planogramVersionDetails({
        versionDetailId: fetchedProducts?.versionDetailId, // assuming _id is the version ID
        limit: 10, // or any limit you want
      });

      if (!detailResponse.ok) {
        alert("Failed to fetch planogram details. Please try again.");
        return;
      }

      const detailData = await detailResponse.json();
      // console.log("detailData", detailData)

      // Filter out
      const machines = detailData.versionDetails
        .filter(item => !item.error)

      // set
      setGroupMachines(machines)
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false)
    }
  };

  // get machine by id 
  const getMachineNameById = (machineId) => {
    if (!machineId || !groupMachines?.length) return "N/A";

    const machine = groupMachines?.find(
      (m) => String(m.machineId) === String(machineId)
    );

    return machine?.friendlyName || "";
  };

  // date selector
  const handelSelectDate = (date) => {
    if (!date) return ""

    setSelectedPlanDate(date)
    setSelectedDate("")
    setDate("")
    setTime("")
  }

  // ReApply-date selector
  const handelReapplySelectDate = (date) => {
    if (!date) return ""

    setSelectedPlanDate(date)
    setSelectedReApplyDate(date)
    setDate("")
    setTime("")
  }

  useEffect(() => {
    const id = setTimeout(() => {
      const search = productSearch.toLowerCase().trim()

      if (!search) {
        setProductOptions(allProducts)
      } else {
        setProductOptions(
          allProducts.filter(p =>
            p.name?.toLowerCase().includes(search) ||
            p.productId?.toString().includes(search) ||
            p.externalId?.toLowerCase().includes(search)
          )
        )
      }
    }, 150)


    return () => clearTimeout(id)
  }, [productSearch, allProducts])


  useEffect(() => {
    if (planogramMeta?.planogramVersionId) {
      fetchPlanogramVersions()
    }
  }, [planogramMeta])


  useEffect(() => {
    // if (!machineStructureId) return
    if (!machineId) return
    if (hasFetchedPlanogramRef.current) return

    hasFetchedPlanogramRef.current = true
    fetchPlanogramStructure()
  }, [machineId])


  // 🔹 Sync all cards height in each shelf row
  useEffect(() => {
    Object.values(shelfRefs.current).forEach((cards) => {
      if (!cards || cards.length === 0) return;
      const maxHeight = Math?.max(...cards?.map((el) => el?.offsetHeight));
      cards?.forEach((el) => {
        if (el) el.style.height = `${maxHeight}px`;
      });
    });
  }, [structure]);


  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(() => {
      // if (!isFetchingAllProductsRef.current && allProducts.length === 0) {
      //   fetchAllProductsProgressively()
      // }

      if (!isFetchingSuppliersRef.current && allSuppliers.length === 0) {
        fetchAllSuppliersProgressively()
      }

      if (!isFetchingCategoriesRef.current && allCategories.length === 0) {
        fetchAllCategoriesProgressively()
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])


  useEffect(() => {
    if (action === "finalize" && planogramVersionId) {

      fetchOrderDates()
    }
  }, [planogramVersionId])


  const handelReapplyFunc = () => {
    setIsReapplyPlanModalDateOpen(true)
  }


  const handleConfirm = () => {
    setIsNotify(false)
    handleFinalizePlanogram()
  }

  const combineDateTime = (date, time) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");
    const finalTime = time ? `${time}:00` : "00:00:01";

    return `${day}-${month}-${year}T${finalTime}`;
  };

  const handelAppplyAllMachines = (check) => {
    setApplyToGroup(check)
    if (check === true) {
      setIncludeEnabled(false)
      setExcludeEnabled(false)
      setIncludedMachineIds([])
      setExcludedMachineIds([])
    }
  }

  const getTomorrowDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-2 sm:pt-4 w-full min-w-0">
      <button
        onClick={() => router.push(
          `/dashboard/planogram-version-details?planogramVersionId=${planogramMeta?.planogramVersionId}`
        )}
        className="mb-3 flex items-center gap-2 rounded-lg bg-gray-100 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-800 hover:bg-gray-200"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="sm:hidden">Back</span>
        <span className="hidden sm:inline">Back to Planogram Details</span>
      </button>


      <div className="mx-auto flex-1 w-full min-w-0">
        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div className="mb-2 lg:mb-8 space-y-2">
            <h3 className="flex flex-wrap items-center gap-2 lg:gap-3 text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 text-left">
              Planogram Structure

              {planogramMeta?.primeMachine && (
                <span className="flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold text-white bg-green-500 rounded-full">
                  Prime
                </span>
              )}
            </h3>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-xs sm:text-base lg:text-lg">
              <span className="font-semibold text-gray-800 break-all">
                Machine ID:
                <span className="ml-2 font-medium text-gray-800">
                  {planogramMeta?.machineId}
                </span>
              </span>

              <span className="font-semibold text-gray-800 break-words">
                Venue:
                <span className="ml-2 font-medium text-gray-800">
                  {planogramMeta?.venueName}
                </span>
              </span>

              <span className="font-semibold text-gray-800 break-words">
                Friendly Name:
                <span className="ml-2 font-medium text-gray-800">
                  {planogramMeta?.friendlyName}
                </span>
              </span>
            </div>

            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              Manage channel configurations and shelf assignments
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0">
            {!selectedDate ? <button
              onClick={action === "finalize" ? handleFinalizePlanogram : handleUpdatePlanogram}
              disabled={updatingPlanogram}
              className="w-full lg:w-auto px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {updatingPlanogram && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {updatingPlanogram ? "Updating..." : action === "finalize" ? (
                <>
                  <span className="sm:hidden">Apply</span>
                  <span className="hidden sm:inline">Apply Structure</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Update</span>
                  <span className="hidden sm:inline">Update Structure</span>
                </>
              )}
            </button> : <button
              onClick={action === "finalize" && handleFinalizePlanogram}
              disabled={updatingPlanogram}
              className="w-full lg:w-auto px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {updatingPlanogram && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {updatingPlanogram ? "Updating..." : action === "finalize" ? (
                <>
                  <span className="sm:hidden">Update</span>
                  <span className="hidden sm:inline">Update Structure</span>
                </>
              ) : ""}
            </button>}
          </div>
        </div>

        {/* actions exclude ,include and apply meachines */}
        {action === "finalize" && (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-4">
            <div className="mb-2 lg:mb-6 w-full lg:w-[55%] min-w-0">

              {/* Exclude Machines Checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={excludeEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setExcludeEnabled(checked)
                      setApplyToGroup(false)
                      setIncludeEnabled(false)
                      setIncludedMachineIds([])

                      if (!checked) {
                        setExcludedMachineIds([]) // clear selection
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Exclude machines
                  </span>
                </label>
              </div>

              {excludeEnabled && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select machines to exclude
                  </label>

                  <select
                    multiple
                    value={excludedMachineIds}
                    onChange={handleExcludeMachinesSelect}
                    className="w-full min-h-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >

                    {groupMachines
                      .filter(
                        (machine) =>
                          !includedMachineIds.includes(String(machine.machineId))
                      )
                      .map((machine) => (
                        <option
                          key={machine.machineId}
                          value={machine.machineId}
                        >
                          {machine.friendlyName}
                          {machine.primePlanogram ? " (Prime)" : ""}
                        </option>
                      ))}

                  </select>

                  {/* Selected Preview */}
                  {excludedMachineIds.length > 0 && (
                    <div className="my-3 flex flex-wrap gap-2">
                      {excludedMachineIds?.map(id => (
                        <span
                          key={id}
                          className="flex items-center gap-2 bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1 rounded-full text-xs"
                        >
                          {groupMachines.find(m => String(m.machineId) === String(id))?.friendlyName} ({id})

                          <button
                            type="button"
                            onClick={() =>
                              setExcludedMachineIds(
                                excludedMachineIds.filter(m => m !== id)
                              )
                            }
                            className="font-bold hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Include Machines Checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={includeEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIncludeEnabled(checked)
                      setApplyToGroup(false)
                      setExcludeEnabled(false)
                      setExcludedMachineIds([])

                      if (!checked) {
                        setIncludedMachineIds([]) // clear selection
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include machines
                  </span>
                </label>
              </div>

              {/* Multi Select */}
              {includeEnabled && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select machines to include
                  </label>

                  <select
                    multiple
                    value={includedMachineIds}
                    onChange={handleIncludeMachinesSelect}
                    className="w-full min-h-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >

                    {groupMachines
                      .filter(
                        (machine) =>
                          !excludedMachineIds.includes(String(machine.machineId))
                      )
                      .map((machine) => (
                        <option
                          key={machine.machineId}
                          value={(machine.machineId)}
                        >
                          {machine.friendlyName}
                          {machine.primePlanogram ? " (Prime)" : ""}
                        </option>
                      ))}

                  </select>

                  {/* Selected Preview */}
                  {includedMachineIds.length > 0 && (
                    <div className="my-3 flex flex-wrap gap-2">
                      {includedMachineIds.map(id => (
                        <span
                          key={id}
                          className="flex items-center gap-2 bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1 rounded-full text-xs"
                        >
                          {groupMachines.find(m => String(m.machineId) === String(id))?.friendlyName} ({id})
                          <button
                            type="button"
                            onClick={() =>
                              setIncludedMachineIds(
                                includedMachineIds.filter(m => m !== String(id))
                              )
                            }
                            className="font-bold hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Apply to Group */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="applyToGroup"
                  checked={applyToGroup}
                  onChange={(e) => handelAppplyAllMachines(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <label
                  htmlFor="applyToGroup"
                  className="text-sm font-medium text-gray-700"
                >
                  Apply to all machines in this group
                </label>
              </div>
            </div>
            {
              selectedDate &&
              <div className="w-full lg:w-[45%] relative min-w-0">
                <OrderFileForSupplier supplierOrderFiles={planogramMeta?.supplierOrderFiles} />
              </div>
            }
          </div>
        )}

        {action === "finalize" &&
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-end mb-6">

            {selectedDate &&
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={fetchPlanogramStructure}
                  className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center justify-center gap-2"
                >
                  <span className="sm:hidden">Current Planogram</span>
                  <span className="hidden sm:inline">Current Applied Planogram</span>
                </button>
                <div
                  className="h-3 w-3 absolute top-[-4px] right-[-4px]  rounded-full bg-green-500 animate-pulse"
                  title="Modified"
                />
              </div>
            }

            {/* Date Dropdown */}
            <div className="flex flex-col gap-1 w-full sm:w-auto sm:ml-2 min-w-0">
              <label className="text-sm font-semibold  block text-gray-900">
                Select Order
              </label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  const selected = availableDates.find(item => item.plannedPlanogramDate === e.target.value);
                  setSelectedDate(e.target.value); // store the selected createdAt
                  setSelectedPlanDate("")
                  if (selected) fetchInteranalOrdersStructure(selected); // pass the whole item
                }}
                className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select date</option>
                {availableDates?.map((item) => (
                  <option key={item?.plannedPlanogramDate} value={item?.plannedPlanogramDate}>
                    {formatNewPlanDate(item?.plannedPlanogramDate, true)}{" "}
                    {formatTimeOnly(item?.plannedPlanogramDate)}{" "}
                    {item?.draft && "(Draft)"}
                  </option>
                ))}
              </select>
            </div>

            {dateLoader && (
              <div className="ml-2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              </div>
            )}

            {!selectedPlanDate && (
              <>
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
               hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  New Plan
                </button>
              </>
            )}

            {selectedDate && (
              <>
                <button
                  onClick={handelReapplyFunc}
                  className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
               hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  Apply Again
                </button>
              </>
            )}


            {selectedPlanDate && (
              <div className="w-full sm:w-auto px-3 relative py-2 rounded-lg bg-green-100 text-green-700 text-xs sm:text-sm font-medium">
                Plan Date: {formatNewPlanDate(`${selectedPlanDate}T${time}:00`)}

                <button
                  onClick={() => setSelectedPlanDate("")}
                  className="text-sm cursor-pointer absolute top-[-9px] right-0 text-red-500 "
                >
                  X
                </button>

              </div>
            )}

          </div>
        }

        <div className="w-full min-w-0">
          <label className="text-base sm:text-xl lg:text-2xl mb-2 font-semibold block text-gray-900 break-words">
            {selectedDate ? <>Selected Order ({formatNewPlanDate(selectedDate)}) <span> {planogramMeta?.draft && "(Draft)"} </span>  </> : <></>} </label>
          {structure.length === 0 ?
            <div className="min-w-full flex items-center justify-center py-12 sm:py-20 px-2">
              <p className="text-gray-500 text-sm sm:text-lg font-medium text-center">
                No orders available for machine <span className="text-red-500 break-all">{getMachineNameById(planogramMeta?.machineId)}({planogramMeta?.machineId})</span>, for the date <span className="text-red-500">{formatNewPlanDate(selectedDate)}</span>.
              </p>
            </div>
            :
            Object.entries(structure)
              .sort(([a], [b]) => Number(b) - Number(a)) // shelves descending
              .map(([shelfNumber, shelves]) => (
                <div key={shelfNumber} className="space-y-3 mb-4 sm:mb-6">

                  {/* Shelves Grid */}
                  <div
                    className="flex sm:grid items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-2"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      gridTemplateColumns: `repeat(${shelves.length}, minmax(140px, 1fr))`,
                    }}
                  >
                    {shelves.map((item, shelfIndex) => {
                      return (
                        <div
                          key={`${item.channel}-${item.shelf}`}
                          ref={(el) => {
                            if (!shelfRefs.current[shelfNumber])
                              shelfRefs.current[shelfNumber] = [];
                            shelfRefs.current[shelfNumber][shelfIndex] = el;
                          }}
                          className={`relative border ${item.isDifferent
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                            } min-h-64 sm:min-h-72 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto shrink-0 sm:shrink`} >

                          {/* Top Badge */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 whitespace-nowrap text-blue-600">
                              {item.shelf} - {item.channel}
                            </div>
                            {/* {item.channelModified && (
                              <div
                                className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                                title="Modified"
                              />
                            )} */}
                          </div>

                          {/* Warning: Missing External ID */}
                          {!item.productExternalId && (
                            <div className="absolute top-2 right-2 group cursor-pointer">
                              <AlertTriangle
                                className="h-5 w-5 text-yellow-500"
                                strokeWidth={2}
                              />

                              {/* Tooltip */}
                              <div className="absolute right-0 mt-2 w-44 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 z-50">
                                External ID not available
                              </div>
                            </div>
                          )}

                          {item?.productImage?.file && (
                            <div className="flex flex-col items-center gap-2 min-w-0">
                              <img
                                // src={`/products/${item.image}`}
                                src={item?.productImage?.file}
                                className="h-20 sm:h-24 w-auto max-w-full object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.png";
                                }}
                              />
                              <div className="text-[11px] sm:text-xs font-semibold text-gray-700 text-center break-words w-full">
                                {item.productName}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col justify-center items-center min-w-0">
                            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">

                              {/* Categories */}
                              {item?.categoryIds?.length > 0 && (
                                <div
                                  className="relative inline-block group bg-green-500 text-white px-2 py-0.5 rounded-lg"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {/* Trigger */}
                                  <span className="text-xs font-semibold cursor-pointer">
                                    Categories
                                  </span>

                                  {/* Tooltip */}
                                  <div className="absolute left-0 top-full  hidden group-hover:block z-50">
                                    <div className="w-56 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700 max-h-40 overflow-y-auto">
                                      {allCategories
                                        ?.filter((cat) =>
                                          item.categoryIds.includes(cat.productCategoryId)
                                        )
                                        .map((cat) => (
                                          <div
                                            key={cat.productCategoryId}
                                            className="py-0.5 whitespace-nowrap"
                                          >
                                            {cat.name}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}



                              {/* Suppliers */}
                              {item?.supplierIds?.length > 0 && (
                                <div
                                  className="relative px-2 py-0.5 bg-blue-600 text-white  rounded-lg inline-block group "
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {/* Trigger */}
                                  <span className=" text-xs font-semibold cursor-pointer">
                                    Suppliers
                                  </span>

                                  {/* Tooltip */}
                                  <div className="absolute left-0 top-full hidden group-hover:block z-50">
                                    <div
                                      className="w-56 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700 max-h-40 overflow-y-auto"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {allSuppliers
                                        ?.filter((sup) =>
                                          item.supplierIds.includes(sup.supplierId)
                                        )
                                        .map((sup) => (
                                          <div
                                            key={sup.supplierId}
                                            className="py-0.5 whitespace-nowrap"
                                          >
                                            {sup.name}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Max Order */}
                            <div
                              className="relative inline-block group mt-2 bg-gray-500 text-white px-2 py-0.5 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Trigger */}
                              <span className="text-xs font-semibold cursor-pointer">
                                Max Orders
                              </span>

                              {/* Tooltip */}
                              <div className="absolute left-0 top-full  hidden group-hover:block z-50">
                                <div className="w-36 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700">
                                  {Object.entries(item.maxOrderCapacity || {}).map(
                                    ([day, val]) => (
                                      <div
                                        key={day}
                                        className="py-0.5 flex justify-between gap-2"
                                      >
                                        <span>{day}</span>
                                        <span className="font-semibold">{val}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Configure Button */}

                          {action === "finalize" ?
                            <button
                              onClick={() => openEditModal(item, shelfNumber, shelfIndex)}
                              className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Edit Product
                            </button> :
                            <button
                              onClick={() => openEditModal(item, shelfNumber, shelfIndex)}
                              className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                            >
                              Configure
                            </button>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
        </div>

      </div>

      {/* Edit Modal */}
      {
        editItem && (
          action === "finalize" ?
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl sm:rounded-lg p-3 sm:p-6 shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                <div className="flex justify-center sm:hidden pb-2">
                  <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                {/* Modal Header */}
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-2xl font-bold text-gray-900 mb-1">
                    Configure Channel {editItem?.channel} - Shelf {editItem?.shelf}
                  </h3>
                  <p className="text-sm text-gray-600">Edit product details, categories, suppliers, and capacity limits</p>
                </div>

                {/* Product Image */}
                {editItem?.productImage?.file && (
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <img
                      src={editItem.productImage.file}
                      className="h-32 w-full object-contain rounded"
                      onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                    />
                  </div>
                )}


                {/* Product Name Input */}
                <div className="mb-6 relative">
                  <label htmlFor="product-search" className="text-base font-semibold mb-2 block text-gray-900">
                    Product
                  </label>
                  <input
                    id="product-search"
                    type="text"
                    disabled={productSearchLoading}
                    placeholder="Search product..."
                    value={productSearch || ""}
                    onFocus={() => {
                      setIsProductModalOpen(true)
                      setProductOptions(allProducts) // show all products on focus
                    }}
                    onChange={(e) => {
                      const value = e.target.value
                      setProductSearch(value) // 🔥 instant UI update
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsProductModalOpen(false), 150)
                    }}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />

                  {productSearchLoading && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    </div>
                  )}

                  {productOptions?.length > 0 && isProductModalOpen && (
                    <ul className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded mt-1 shadow-lg">
                      {productOptions.map((p) => (
                        <li
                          key={p.productId}
                          onMouseDown={() => {
                            // use onMouseDown to select before input loses focus
                            setEditItem({
                              ...editItem,
                              productName: p.name,
                              productId: p.productId,
                              externalProductId: p.externalId,
                              price: p.costPrice,
                              productImage: p.image,
                            })
                            setProductSearch(p.name)

                            setIsProductModalOpen(false)
                          }}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        >
                          Id:{p.productId}, Exteranal-Id:{p.externalId ? p.externalId : "Null"}, Name:{p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditItem(null)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </div> :
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl sm:rounded-lg p-3 sm:p-6 shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                <div className="flex justify-center sm:hidden pb-2">
                  <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                {/* Modal Header */}
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-2xl font-bold text-gray-900 mb-1">
                    Configure Channel {editItem?.channel} - Shelf {editItem?.shelf}
                  </h3>
                  <p className="text-sm text-gray-600">Set categories, suppliers, and capacity limits</p>
                </div>

                {planogramMeta?.primeMachine && <div className="mb-6">
                  <label htmlFor="category-select" className="text-base font-semibold mb-3 block text-gray-900">
                    Categories
                  </label>
                  <select
                    id="category-select"
                    onChange={handleCategorySelect}
                    value=""
                    disabled={!planogramMeta.primeMachine}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select a category...</option>
                    {allCategories
                      .filter((cat) => !categories.includes(cat.productCategoryId))
                      .map((cat) => (
                        <option key={cat.productCategoryId} value={cat.productCategoryId}>
                          {cat.name}
                        </option>
                      ))}
                  </select>

                  {categories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {categories?.map((productCategoryId) => {
                        const cat = allCategories.find((c) => c.productCategoryId === productCategoryId)
                        return (
                          <span
                            key={productCategoryId}
                            className="bg-gray-100 text-gray-700 border border-gray-300 rounded pl-3 pr-2 py-1.5 text-sm inline-flex items-center"
                          >
                            {cat?.name}
                            <button
                              onClick={() => removeCategory(productCategoryId)}
                              className="ml-2 hover:text-red-600 font-bold text-lg"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>}

                {planogramMeta?.primeMachine && <div className="mb-6">
                  <label htmlFor="supplier-select" className="text-base font-semibold mb-3 block text-gray-900">
                    Suppliers
                  </label>
                  <select
                    id="supplier-select"
                    onChange={handleSupplierSelect}
                    value=""
                    disabled={!planogramMeta.primeMachine}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select a supplier...</option>
                    {allSuppliers
                      .filter((sup) => !suppliers.includes(sup.supplierId))
                      .map((sup) => (
                        <option key={sup.supplierId} value={sup.supplierId}>
                          {sup.name}
                        </option>
                      ))}
                  </select>

                  {suppliers?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {suppliers?.map((supplierId) => {
                        const sup = allSuppliers?.find((s) => s.supplierId === supplierId)
                        return (
                          <span
                            key={supplierId}
                            className="bg-blue-100 text-blue-700 border border-blue-300 rounded pl-3 pr-2 py-1.5 text-sm inline-flex items-center"
                          >
                            {sup?.name}
                            <button
                              onClick={() => removeSupplier(supplierId)}
                              className="ml-2 hover:text-red-600 font-bold text-lg"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>}

                {/* Max Order Capacity Section */}
                <div className="mb-6">
                  <div className="flex justify-between">
                    <label className="text-base font-semibold mb-3 block text-gray-900">
                      Max Order Capacity <span className="text-gray-600 font-normal">(per day)</span>
                    </label>
                    <label className="text-base font-semibold mb-3 block text-gray-900">
                      Max Channel Capacity <span className="text-gray-600 font-normal">({editItem?.idealCapacity})</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <label htmlFor={day} className="min-w-[100px] text-sm text-gray-700">
                          {day}
                        </label>
                        <input
                          id={day}
                          type="number"
                          min={0}
                          placeholder="0"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={maxOrder[day] || ""}
                          onChange={(e) =>
                            setMaxOrder({
                              ...maxOrder,
                              [day]: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditItem(null)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
        )
      }

      {/* Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-sm pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <div className="flex justify-center sm:hidden pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold mb-4">Select Date & Time</h3>

            {/* DATE */}
            <input
              type="date"
              value={date}
              // min={getTomorrowDate()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            {/* TIME */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Select Time</label>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                  German Time Zone
                </span>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsPlanModalOpen(false);
                  setDate("")
                  setTime("")
                }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm text-gray-600"
              >
                Cancel
              </button>

              <button
                disabled={!date || !time}
                onClick={() => {
                  const finalDateTime = combineDateTime(date, time);
                  handelSelectDate(finalDateTime)
                  setIsPlanModalOpen(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal */}
      {isNotify && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-lg pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <div className="flex justify-center sm:hidden pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <h3 className="text-sm sm:text-base font-semibold mb-4">
              Are you sure you want to re-apply the structure for this plan date:
              <span className="text-red-600 text-center"> {formatNewPlanDate(selectedReApplyDate)}</span>
            </h3>


            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setIsNotify(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm text-gray-600"
              >
                Cancel
              </button>

              <button
                disabled={!selectedReApplyDate}
                onClick={handleConfirm}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {updatingPlanogram && isNotify && <Loader2 className="h-4 w-4 animate-spin" />}
                {updatingPlanogram && isNotify ? "Updating" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isReapplyPlanModalDateOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-sm pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <div className="flex justify-center sm:hidden pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold mb-4">Select Reapply Plan Date</h3>

            {/* DATE */}
            <input
              type="date"
              value={date}
              // min={getTomorrowDate()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            {/* TIME */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Select Time</label>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                  German Time Zone
                </span>
              </div>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsReapplyPlanModalDateOpen(false);
                  setDate("")
                  setTime("")
                }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm text-gray-600"
              >
                Cancel
              </button>

              <button
                disabled={!date || !time}
                onClick={() => {
                  const finalDateTime = combineDateTime(date, time);
                  handelReapplySelectDate(finalDateTime)
                  setIsNotify(true)
                  setIsReapplyPlanModalDateOpen(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div >

  )

}

export default function PlanogramStructurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <PlanogramStructure />
    </Suspense>
  )
}
