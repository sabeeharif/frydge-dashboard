// import { getSession } from "@/app/lib/session";
import { getSession } from "@/app/lib/session";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const session = await getSession();
    
    if (session.isLoggedIn && session.authToken) {
      return NextResponse.json({
        isLoggedIn: true,
        authToken: session.authToken
      });
    } else {
      return NextResponse.json({
        isLoggedIn: false
      });
    }
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({
      isLoggedIn: false
    });
  }
}