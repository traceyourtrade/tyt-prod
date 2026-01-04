import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const User = await getUserModel();
    let user = null;

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("authToken")?.value;

      if (authToken) {
        try {
          const decoded = jwt.verify(authToken, process.env.SECRET_KEY || "") as { _id: string };
          user = await User.findById(decoded._id);
        } catch {
          return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 200 });
    }

    const signUpVerificationToken = jwt.sign(
      { email: user.email },
      process.env.SECRET_KEY as string,
      { expiresIn: "15m" }
    );

    await User.updateOne(
      { _id: user._id },
      { $set: { signUpVerificationToken } }
    );

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAILPOS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: user.email,
      subject: "Email Verification: ProJournX",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
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
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px;">Click to verify your email</h1>
                      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                        Welcome to ProJournX. Click the button below to confirm your email and unlock your full potential.
                      </p>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://app.projournx.com/verify?t=${signUpVerificationToken}" 
                               style="display: inline-block; width: 100%; max-width: 280px; background: linear-gradient(135deg, #3b82f6, #2563eb); background-color: #3b82f6; color: #ffffff; padding: 16px 0; border-radius: 14px; font-weight: 600; text-decoration: none; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                              Verify Account
                            </a>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin: 0;">
                          Didn't request this? No worries, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 0 0; color: #52525b; font-size: 12px;">
                  Need help? Contact <a href="mailto:support@projournx.com" style="color: #3b82f6; text-decoration: none;">support@projournx.com</a>
                </p>
                <p style="margin: 8px 0 0 0; color: #3f3f46; font-size: 11px;">
                  © 2025 ProJournX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
