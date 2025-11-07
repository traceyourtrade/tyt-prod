import { NextResponse } from "next/server";
import { getUserModel } from "@/models/main/user.model";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const User = await getUserModel();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await import("bcryptjs").then((b) =>
      b.compare(password, user.password)
    );
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await user.generateAuthToken();

    return NextResponse.json(
      { message: token, name: user.fullName, id: user._id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
