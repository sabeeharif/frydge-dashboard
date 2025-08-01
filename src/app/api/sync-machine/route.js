import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { machineId } = body;

    if (!machineId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }

    const response = await fetch(`https://vendlive.com/api/1.0/machine/${machineId}/sync-channels-to-machine/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "e91c470f2413536befad8ae6df34541e5dff5b2e" // Make sure this is not missing
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sync Machine API Error:", errorText);
      return NextResponse.json({ error: `Sync API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Sync Machine API Route Error:", error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
