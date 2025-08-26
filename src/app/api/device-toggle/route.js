import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";

export async function PATCH(request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { deviceId, machineId, enabled } = body;

    if (!deviceId || !machineId || enabled === undefined) {
      return NextResponse.json(
        { error: "deviceId, machineId, and enabled are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://vendlive.com/api/2.0/devices/${deviceId}/?machineId=${machineId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${session.authToken}`,
          accept: "application/json",
        },
        body: JSON.stringify({
          enabled: enabled,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Device Toggle API Error:", errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Device Toggle API Route Error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
