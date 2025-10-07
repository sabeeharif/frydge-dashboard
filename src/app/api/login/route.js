import { createSession } from "@/app/lib/session";
import { NextResponse } from "next/server";


export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;

  
  try {
    const vendLiveRes = await fetch("https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
      },
      body: JSON.stringify({
        email,
        password,
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
        user: vendLiveData.user,
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