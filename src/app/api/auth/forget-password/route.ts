import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import PasswordResetEmail from "@/emails/PasswordResetEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const User = await getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security reasons, don't reveal if user exists
      return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set token on user model (needs schema update or we use existing verification field if possible)
    // For now, let's use a dynamic update since we might not want to update schema immediately
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetPasswordToken: hashedToken,
          resetPasswordExpires: Date.now() + 3600000 // 1 hour
        } 
      }
    );

    // Send email using Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const resetUrl = `${appUrl}/change-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      react: PasswordResetEmail({ resetUrl }),
    });

    return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forget password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
