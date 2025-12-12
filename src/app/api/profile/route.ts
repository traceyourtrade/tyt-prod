import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';

async function getUserFromToken(token: string) {
    const User = await getUserModel();
    return await User.findOne({ "tokens.token": token });
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const rootUser = await getUserFromToken(token);

        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const userObj = rootUser.toObject ? rootUser.toObject() : rootUser;
        
        let firstName = userObj.firstName || "";
        let lastName = userObj.lastName || "";
        
        if (!firstName && !lastName && userObj.fullName) {
            const nameParts = userObj.fullName.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
        }

        return NextResponse.json({
            firstName,
            lastName,
            fullName: userObj.fullName || "",
            email: userObj.email || "",
            country: userObj.country || "",
            phone: userObj.phone?.toString() || "",
            bio: userObj.bio || "",
            profilePicture: userObj.profilePicture || null,
        });

    } catch (error) {
        console.error("GET profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        const userId = cookieStore.get('userId')?.value;

        if (!token || !userId) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const { firstName, lastName, country, phone, bio } = body;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const fullName = `${firstName || ""} ${lastName || ""}`.trim();

        const User = await getUserModel();
        await User.updateOne(
            { email: rootUser.email }, 
            { 
                $set: { 
                    fullName, 
                    firstName: firstName || "",
                    lastName: lastName || "",
                    country, 
                    phone, 
                    bio 
                } 
            }
        );

        return NextResponse.json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("PUT profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return PUT(req);
}
