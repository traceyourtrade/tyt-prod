// changed - 12-13-25

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { getUserModel } from "@/models/main/user.model";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Enter all the details" },
        { status: 400 },
      );
    }
    console.log("the rmail is", email, password);
    const User = await getUserModel();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "User is not registered" },
        { status: 401 },
      );
    }
    console.log("the user is", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("the isMatch is", isMatch);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.isEmailVerified) {
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

      return NextResponse.json(
        { error: "Email not verified", emailNotVerified: true },
        { status: 403 }
      );
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
      sameSite: "lax",
      maxAge: fiveDays,
      path: "/",
    });

    response.cookies.set({
      name: "userId",
      value: user.uniqueId,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: fiveDays,
      path: "/",
    });

    response.cookies.set({
      name: "name",
      value: user.fullName,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: fiveDays,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
