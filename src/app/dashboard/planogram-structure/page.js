"use client";

import React, { Suspense, useEffect, useState } from "react";
import Loader from "@/app/components/Loader";
import { useSearchParams } from "next/navigation";
import { api } from "@/app/lib/auth";

const PlanogramStructure = () => {
  const searchParams = useSearchParams();
  const planogramVersionId = searchParams.get("planogramVersionId");

  const [structure, setStructure] = useState([]);

  const handleInitStructure = async () => {
    try {
      const planogramId = planogramVersionId;
      const response = await api.initPlanogramStructure(planogramId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to init structure' }));
        throw new Error(errorData.error);
      }

      const result = await response.json();
      console.log("Structure initialized:", result);

      // Map channelDetails to your structure format
      if (result.planogramVersionStructure?.length > 0) {
        const channels = result.planogramVersionStructure[0].channelDetails;

        // const mappedStructure = channels.map((channel, index) => ({
        //   id: channel.channelId,
        //   label: channel.channelId,
        //   details: `Max Capacity: ${channel.maxOrderCapacity?.max ?? "N/A"}`, // Example detail
        //   badge: "K", // Optional, you can adjust
        //   editable: true,
        // }));

        // // You can split them into rows if needed
        // const rowSize = 6; // e.g., 6 channels per row
        // const rows = [];
        // for (let i = 0; i < mappedStructure.length; i += rowSize) {
        //   rows.push(mappedStructure.slice(i, i + rowSize));
        // }

        setStructure(channels);
      }

    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
    }
  };

  useEffect(() => {
    handleInitStructure();
  }, [planogramVersionId]);
console.log(structure);
  return (
    <div className="">
      <h3 className="mb-6 text-2xl font-bold text-red-700">Prime Structure</h3>

      <div className="space-y-3">
        {structure.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
          
              {/* <div
                key={row.id}
                className={`flex flex-col items-start justify-between rounded-lg border-2 border-gray-400 bg-white p-3 h-28 w-28`}
              >
                {row?.label && (
                  <div className="flex w-full items-start justify-between">
                    <span className="text-sm font-semibold">{box?.label}</span>
                  </div>
                )}
                {row?.details && (
                  <div className="mt-1 text-xs text-gray-600">
                    {row?.details.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
                {row?.editable && (
                  <button className="text-xs font-semibold text-blue-600 hover:underline">
                    Edit
                  </button>
                )}
              </div> */}
          
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PlanogramStructurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-gray-100">
          <Loader />
        </div>
      }
    >
      <PlanogramStructure />
    </Suspense>
  );
}
