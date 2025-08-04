import { getSession } from "@/app/lib/session";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { machineId } = body;

    const session = await getSession();

    if (!session?.isLoggedIn || !session?.authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!machineId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }

    const response = await fetch(`https://vendlive.com/api/1.0/machine/${machineId}/sync-channels-to-machine/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${session.authToken}`,
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
