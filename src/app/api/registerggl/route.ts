// app/api/registerggl/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getUserModel } from "@/models/main/user.model";
import { getNoteModel } from "@/models/main/notes.model";
import { GoogleAuthRequest, UserData, NotesData } from '@/types/auth'


export async function POST(request: NextRequest): Promise<NextResponse> {

  try {
    
        const User = await getUserModel();
        const Notes = await getNoteModel();
    const body: GoogleAuthRequest = await request.json();
    const { email, fullName, phone, password, cpassword, countryCode, country } = body;

    console.log('Registration data:', { email, fullName, phone, countryCode, country });

    if (!email || !fullName || !phone || !password || !cpassword || !countryCode || !country) {
      return NextResponse.json(
        { error: "Enter all the details" },
        { status: 400 }
      );
    }

    if (password !== cpassword) {
      return NextResponse.json(
        { error: "Passwords don't match" },
        { status: 400 }
      );
    }

    const isUser = await User.findOne({ email });

    if (!isUser) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      
      const generateRandomCode = (): string => {
        let uniqueId = "";
        for (let i = 0; i < 12; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          uniqueId += characters[randomIndex];
        }
        return uniqueId;
      };

      const generateUniqueCode = async (): Promise<string> => {
        let uniqueId: string;
        let isUserId: any;

        do {
          uniqueId = generateRandomCode();
          isUserId = await User.findOne({ uniqueId });
        } while (isUserId);

        return uniqueId;
      };

      const uniqueId = await generateUniqueCode();

      const userData: UserData = {
        isEmailVerified: true,
        uniqueId,
        email,
        fullName,
        phone,
        password,
        cpassword,
        countryCode,
        country
      };

      const notesData: NotesData = {
        uniqueId,
        email
      };

      const user = new User(userData);
      const notes = new Notes(notesData);

      await user.save();
      await notes.save();

      const isRegistered = await User.findOne({ email });

      if (isRegistered) {
        const token = await isRegistered.generateAuthToken();

        const response = NextResponse.json({
          msg: "registered user",
          message: token,
          id: isRegistered.uniqueId,
          name: (isRegistered.fullName).split(" ")[0]
        });

        // Set cookie in response
        response.cookies.set("authTOken", token, {
          expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
         response.cookies.set({
      name: "userId",
      value: user.uniqueId,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:  5 * 24 * 60 * 60,
      path: "/",
    });

        return response;
      } else {
        return NextResponse.json(
          { error: "Registration failed" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "email already registered" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}