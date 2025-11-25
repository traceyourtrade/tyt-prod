import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserModel } from "@/models/main/user.model";

export async function POST(req: Request) {

  try {

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
    }
console.log("the rmail is",email ,password)
    const User = await getUserModel();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User is not registered" }, { status: 401 });
    }
console.log("the user is",user.password)
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("the isMatch is",isMatch)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await user.generateAuthToken();

    const response = NextResponse.json({
      message: "Login successful",
      id: user.uniqueId,
      name: user.fullName.split(" ")[0],
    });

    // ✅ Secure cookie handling (backend only)
    const fiveDays = 5 * 24 * 60 * 60; // seconds

    // use a safer cookie name (no spaces) for reliable retrieval in middleware
    response.cookies.set({
      name: "authToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: fiveDays,
      path: "/",
    });

    response.cookies.set({
      name: "userId",
      value: user.uniqueId,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: fiveDays,
      path: "/",
    });

    response.cookies.set({
      name: "name",
      value: user.fullName,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: fiveDays,
      path: "/",
    });

    return response;

  } catch (error) {

    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });

  }
}