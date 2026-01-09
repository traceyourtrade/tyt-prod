import { NextRequest, NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";

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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #040404; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #040404;">
            <tr>
              <td align="center" style="padding: 60px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 440px; background-color: #0c0c0c; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
                  <tr>
                    <td height="4" style="background: linear-gradient(90deg, #3b82f6, #10b981, #3b82f6); background-color: #3b82f6;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 32px; text-align: center;">
                      <div style="margin-bottom: 32px;">
                        <img src="https://www.projournx.com/images/logo-dark.png" alt="ProJournX Logo" style="height: 40px; display: block; margin: 0 auto;">
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px;">Reset Your Password</h1>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                        You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.
                      </p>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" 
                               style="display: inline-block; width: 100%; max-width: 280px; background: linear-gradient(135deg, #3b82f6, #2563eb); background-color: #3b82f6; color: #ffffff; padding: 16px 0; border-radius: 14px; font-weight: 600; text-decoration: none; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin: 0;">
                          If you didn't request this, please ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px;">
                  Need help? Contact <a href="mailto:support@projournx.com" style="color: #3b82f6; text-decoration: none;">support@projournx.com</a>
                </p>
                <p style="margin: 8px 0 0 0; color: #3f3f46; font-size: 11px;">
                  © 2026 ProJournX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ message: "If an account exists with this email, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forget password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
