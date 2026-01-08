import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";
import crypto from "crypto";
import nodemailer from "nodemailer";

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

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/change-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"ProJournX Support" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">ProJournX - Premium Trading Journal</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forget password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
