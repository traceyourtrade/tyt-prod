import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Assuming you have a User model import
import { getUserModel } from "@/models/main/user.model";

export async function POST(req: Request) {
  try {
    const User = await getUserModel();
    const body = await req.json();
    const { token } = body;

    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as { email: string };
    const email = decoded.email;

    // Mock User find - replace with your actual User model
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // if (user.isEmailVerified) {
    //   return NextResponse.json({ message: "Email is already verified" }, { status: 400 });
    // }

    user.isEmailVerified = true;
    await user.save();

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Link expired. Please request a new verification email.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}