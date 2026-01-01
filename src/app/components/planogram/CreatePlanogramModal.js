"use client";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthService, api } from "@/app/lib/auth";
const CreatePlanogramModal = ({
  closeModal,
  handleCreatePlanogram,
  creatingProduct,
  formData,
  handleInputChange,
  setFormData
}) => {
  const [machines, setMachines] = useState()
  const [errors, setErrors] = useState({
    machine: "",
    primePlanogram: "",
  });

  const fetchMachines = async (page) => {
    try {
      // setLoading(true);
      const pageSize = 100
      console.log("Fetching machines for page:", page);
      const response = await api.getMachines({ page, pageSize });
      console.log("Client fetch response status:", response.status);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log("Client received data:", {
        count: data.count,
        resultsLength: data.results?.length,
      });
      setMachines(data.results || []);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setMachines([]);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines(1);
  }, []);

  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      versionDetails: [
        ...prev.versionDetails,
        { machineId: "", primePlanogram: false, venueName: null },
      ],
    }));
  };

  const updateRow = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.versionDetails];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return {
        ...prev,
        versionDetails: updated,
      };
    });
  };


  const handleDelete = (index) => {
    setFormData((prev) => {
      if (prev.versionDetails.length === 0) return prev;
      return {
        ...prev,
        versionDetails: prev.versionDetails.filter((_, i) => i !== index),
      };
    });
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">
              Add Planogram Versions
            </h3>
            <button
              onClick={closeModal}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          {/* Version Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter Version name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-4">

            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Machine Details
            </h3>
            {/* Empty State */}
            {formData?.versionDetails?.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">No data available</p>
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add First
                </button>
              </div>
            ) : (
              /* Table */
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Machine
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Vanue Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Prime
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {formData?.versionDetails?.map((row, index) => (
                        <tr key={index} className="border-t border-gray-300">



                          {/* Machine Dropdown */}
                          <td className="px-4 py-3 text-center text-gray-500">
                            <select
                              value={row.machineId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;

                                // Check duplicate machine
                                const isDuplicate = formData.versionDetails.some(
                                  (item, i) => item.machineId === selectedId && i !== index
                                );

                                if (isDuplicate) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    machine: "This machine is already selected.",
                                  }));
                                  return;
                                }

                                setErrors((prev) => ({ ...prev, machine: "" }));

                                const selectedMachine = machines.find(
                                  (m) => String(m.id) === selectedId
                                );

                                updateRow(index, "machineId", selectedId);
                                updateRow(
                                  index,
                                  "friendlyName",
                                  selectedMachine?.friendlyName || ""
                                );
                                updateRow(
                                  index,
                                  "venueName",
                                  selectedMachine?.venue?.name || null
                                );
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="">Select Machine</option>
                              {machines?.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m?.friendlyName}
                                </option>
                              ))}
                            </select>

                          </td>
                          {/* 🔹 Venue Name  */}
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <h3>{row.venueName || "N/A"}</h3>
                          </td>

                          {/* Prime Planogram Checkbox */}
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={row.primePlanogram}
                              onChange={(e) => {
                                const checked = e.target.checked;

                                if (checked) {
                                  const alreadyPrime = formData.versionDetails.some(
                                    (item, i) => item.primePlanogram && i !== index
                                  );
                                  console.log(alreadyPrime);
                                  if (alreadyPrime) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      primePlanogram: "Only one Prime Planogram is allowed.",
                                    }));
                                    return;
                                  } else {
                                    setErrors((prev) => ({ ...prev, primePlanogram: "" }));
                                  }
                                }

                                setErrors((prev) => ({ ...prev, primePlanogram: "" }));
                                updateRow(index, "primePlanogram", checked);
                              }}
                              className="w-5 h-5"
                            />

                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center space-x-3">
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {errors.machine && (
                    <p className="text-sm text-red-600 mt-2">{errors.machine}</p>
                  )}

                  {errors?.primePlanogram && (
                    <p className="text-sm text-red-600 mt-2">{errors.primePlanogram}</p>
                  )}

                </div>

                {/* Add More Button Below Table */}
                {formData?.versionDetails?.length > 0 && <div className="p-4 pt-0 text-right">
                  <button
                    onClick={handleAddRow}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    Add More
                  </button>
                </div>}
              </div>
            )}
          </div>
        </div>


        {/* Footer */}
        <div className="p-6  border-gray-200 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleCreatePlanogram}
            disabled={
              creatingProduct ||
              !!errors.machine ||
              !!errors.prime
            }
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:opacity-50"
          >

            {creatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
            {creatingProduct ? "Creating..." : "Create Planogram"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlanogramModal;
