import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    const oneHour = 60 * 60;

    const token = jwt.sign(
      { 
        _id: "demo-user",
        demoMode: true 
      },
      process.env.SECRET_KEY as string,
      { expiresIn: "1h" }
    );

    const response = NextResponse.json({
      message: "Demo login successful",
      id: "demo-user",
      name: "Demo User",
      demoMode: true,
    });

    response.cookies.set({
      name: "authToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneHour,
      path: "/",
    });

    response.cookies.set({
      name: "userId",
      value: "demo-user",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneHour,
      path: "/",
    });

    response.cookies.set({
      name: "name",
      value: "Demo User",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneHour,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
