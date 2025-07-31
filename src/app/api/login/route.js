import { createSession } from "@/app/lib/session";
import { NextResponse } from "next/server";


export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;
  const accountId = 121;
  
  try {
    const vendLiveRes = await fetch("https://vendlive.com/api/1.0/custom/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "e91c470f2413536befad8ae6df34541e5dff5b2e",
      },
      body: JSON.stringify({
        email,
        password,
        account_id: accountId,
      }),
    });
    
    const vendLiveData = await vendLiveRes.json();
    console.log(vendLiveData, "vendLiveData");
    
    if (vendLiveRes.status === 200 && vendLiveData.key) {
      // Create session with the auth token
      await createSession(vendLiveData.key);
      
      return NextResponse.json({
        message: "Login successful",
        authToken: vendLiveData.key,
      });
    } else if (vendLiveRes.status === 400 && vendLiveData.nonFieldErrors) {
      return NextResponse.json({ error: "Wrong username or password!" }, { status: 401 });
    } else {
      return NextResponse.json(
        { error: `API authentication failed: ${vendLiveRes.status}` },
        { status: vendLiveRes.status },
      );
    }
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}