import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserModel } from '@/models/main/user.model';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.PHOTO_BUCKET_REGION!,
    credentials: {
        accessKeyId: process.env.PHOTO_ACCESS_KEY!,
        secretAccessKey: process.env.PHOTO_SECRET_ACCESS_KEY!,
    },
});

async function uploadProfilePicture(base64Data: string, userId: string): Promise<string> {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 image format");
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `profile-pictures/${userId}-${uuidv4()}.${extension}`;

    const params = {
        Bucket: process.env.PHOTO_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType,
    };

    await s3Client.send(new PutObjectCommand(params));
    return `https://${process.env.PHOTO_BUCKET_NAME}.s3.${process.env.PHOTO_BUCKET_REGION}.amazonaws.com/${fileName}`;
}

async function deleteOldProfilePicture(url: string): Promise<void> {
    try {
        const bucketName = process.env.PHOTO_BUCKET_NAME!;
        const region = process.env.PHOTO_BUCKET_REGION!;
        const urlPrefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;
        const urlPrefixAlt = `https://${bucketName}.s3.amazonaws.com/`;
        
        let key = '';
        if (url.startsWith(urlPrefix)) {
            key = url.replace(urlPrefix, '');
        } else if (url.startsWith(urlPrefixAlt)) {
            key = url.replace(urlPrefixAlt, '');
        }
        
        if (key) {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            }));
        }
    } catch (error) {
        console.warn("Failed to delete old profile picture:", error);
    }
}

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
        const { firstName, lastName, country, phone, bio, profilePicture } = body;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const fullName = `${firstName || ""} ${lastName || ""}`.trim();

        const updateData: Record<string, unknown> = {
            fullName, 
            firstName: firstName || "",
            lastName: lastName || "",
            country, 
            phone, 
            bio 
        };

        if (profilePicture) {
            if (profilePicture.startsWith('data:')) {
                const oldPictureUrl = rootUser.profilePicture;
                
                const newPictureUrl = await uploadProfilePicture(profilePicture, userId);
                updateData.profilePicture = newPictureUrl;
                
                if (oldPictureUrl && (oldPictureUrl.includes('s3.amazonaws.com') || oldPictureUrl.includes('.s3.'))) {
                    await deleteOldProfilePicture(oldPictureUrl);
                }
            } else if (profilePicture.startsWith('http')) {
                updateData.profilePicture = profilePicture;
            }
        }

        const User = await getUserModel();
        await User.updateOne(
            { email: rootUser.email }, 
            { $set: updateData }
        );

        return NextResponse.json({ 
            message: "Profile updated successfully",
            profilePicture: updateData.profilePicture || rootUser.profilePicture
        });

    } catch (error) {
        console.error("PUT profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return PUT(req);
}
