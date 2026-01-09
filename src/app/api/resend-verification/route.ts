import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserModel } from "@/models/main/user.model";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";

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

    const verificationUrl = `https://app.projournx.com/verify?t=${signUpVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Email Verification: ProJournX",
      react: VerificationEmail({ verificationUrl }),
    });

    return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
