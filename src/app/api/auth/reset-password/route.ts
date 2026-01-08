import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const User = await getUserModel();
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update password
    user.password = password;
    user.cpassword = password; // Assuming cpassword should match
    
    // Clear reset tokens
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
