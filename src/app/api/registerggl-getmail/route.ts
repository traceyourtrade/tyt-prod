// app/api/registerggl-getmail/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

import { getUserModel } from "@/models/main/user.model";
import { GoogleTokenRequest, GooglePayload } from '@/types/auth';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  'https://app.projournx.com/auth/google/callback'
);

export async function POST(request: NextRequest): Promise<NextResponse> {

  try {
    
    const User = await getUserModel();
    const body: GoogleTokenRequest = await request.json();
    const { code } = body;
    
    console.log('Received code:', code);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens:', tokens);

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload() as GooglePayload;
    console.log("Payload:", payload);

    if (!payload?.email) {
      return NextResponse.json(
        { error: "Invalid Google payload" },
        { status: 400 }
      );
    }

    const isUser = await User.findOne({ email: payload.email });

    if (!isUser) {
      return NextResponse.json({
        msg: "unregistered user",
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
    } else {
      const token = await isUser.generateAuthToken();

      const response = NextResponse.json({
        msg: "registered user",
        message: token,
        id: isUser.uniqueId,
        name: (isUser.fullName).split(" ")[0]
      });

      // Set cookie in response
      response.cookies.set("authToken", token, {
        expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });
       response.cookies.set({
      name: "userId",
      value: isUser.uniqueId,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:  5 * 24 * 60 * 60,
      path: "/",
    });

      console.log("Google login successful");
      return response;
    }

  } catch (error) {
    console.error('Error exchanging code:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}