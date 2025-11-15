import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserModel } from "@/models/main/user.model";
import { getNotesModel } from "@/models/main/notes.model"; // assuming Notes is a model too
import nodemailer from "nodemailer"
export async function POST(req: Request) {
  try {
    const { email, fullName, phone, password, cpassword, countryCode, country } = await req.json();

    // ✅ Validate input
    if (!email || !fullName || !phone || !password || !cpassword || !countryCode || !country) {
      return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
    }

    if (password !== cpassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const User = await getUserModel();
    const Notes = await getNotesModel();

    const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    // }

    // ✅ Generate unique user ID
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const generateRandomCode = () =>
      Array.from({ length: 12 }, () => characters[Math.floor(Math.random() * characters.length)]).join("");

    let uniqueId;
    while (true) {
      const code = generateRandomCode();
      const exists = await User.findOne({ uniqueId: code });
      if (!exists) {
        uniqueId = code;
        break;
      }
    }

    // ✅ Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate signup verification token (expires in 15 minutes)
    const signUpVerificationToken = jwt.sign(
      { email },
      process.env.SECRET_KEY as string,
      { expiresIn: "15m" }
    );

    // ✅ Create user and notes documents
    const user = new User({
      uniqueId,
      email,
      fullName,
      phone,
      password: hashedPassword,
      cpassword: hashedPassword,
      countryCode,
      country,
    });

    const notes = new Notes({
      uniqueId,
      email,
    });

    await user.save();
    await notes.save();

    // ✅ Send verification email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAILPOS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: "Email Verification: Trace Your Trade",
      html: `
        <div style="width:95vw; height:80vh; margin:10px auto; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <h1 style="font-size:18px;">Click to verify your email</h1>
          <br/>
          <a 
            style="font-size:12px; background-color:rgb(172,72,172); text-decoration:none; width:100px; height:25px; border-radius:25px; color:white; display:flex; align-items:center; justify-content:center;"
            href="${process.env.BASE_URL}/verify/token?t=${signUpVerificationToken}">
            Verify
          </a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Registration successful. Verification email sent." }, { status: 200 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
