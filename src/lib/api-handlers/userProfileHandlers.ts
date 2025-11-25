import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { getUserModel } from '@/models/main/user.model';


// Helper to generate unique filenames
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const s3Client = new S3Client({
    region: process.env.PHOTO_BUCKET_REGION!,
    credentials: {
        accessKeyId: process.env.PHOTO_ACCESS_KEY!,
        secretAccessKey: process.env.PHOTO_SECRET_ACCESS_KEY!,
    },
});

// Helper function to get user from token
async function getUserFromToken(token: string) {
    const User = await getUserModel();
    return await User.findOne({ "tokens.token": token });
}

// CHANGE PASSWORD
export async function changePasswordHandler(req: any, userId: string, token: string) {
    try {
        const { password, newPassword } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const email = rootUser.email;

        if (!email || !password || !newPassword) {
            return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
        }

        const User = await getUserModel();
        const isUser = await User.findOne({ email });

        if (!isUser) {
            return NextResponse.json({ error: "user not registered" }, { status: 400 });
        }

        // Note: In the original code, it compares plain text passwords
        // You might want to use bcrypt.compare here for security
        if (isUser.password === password) {
            // You should hash the new password before saving
            const passUpdate = await User.updateOne(
                { email: email }, 
                { $set: { password: newPassword, cpassword: newPassword } }
            );
            return NextResponse.json({ message: "Password changed successfully" });
        } else {
            return NextResponse.json({ error: "invalid credentials" }, { status: 404 });
        }

    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE ACCOUNT
export async function deleteAccountHandler(req: any, userId: string, token: string) {
    try {
        const { password } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const email = rootUser.email;

        if (!email || !password) {
            return NextResponse.json({ error: "enter all the details" }, { status: 400 });
        }

        const User = await getUserModel();
        const isUser = await User.findOne({ email });
        
        if (!isUser) {
            return NextResponse.json({ error: "email not found" }, { status: 400 });
        }

        // Note: In the original code, it compares plain text passwords
        // You might want to use bcrypt.compare here for security
        if (isUser.password !== password) {
            return NextResponse.json({ error: "invalid credentials" }, { status: 400 });
        }

        const deleteUser = await User.deleteOne({ email: email });
        return NextResponse.json({ message: "account deleted successfully" });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// IS USER AUTHENTICATED (FOR PROFILE)
export async function isUserAuthenticatedProfileHandler( token: string) {
    try {
        const rootUser = await getUserFromToken(token);

        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        return NextResponse.json({ rootUser });

    } catch (error) {
        console.error("Authentication check error:", error);
        return NextResponse.json({ error: "Unauthorized: No tokens found" }, { status: 401 });
    }
}

// UPLOAD PROFILE PICTURE
export async function uploadProfilePictureHandler(formData:any, userId: string, token: string) {
    try {
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "user not logged in" }, { status: 404 });
        }

        // Generate file name
        const fileName = generateFileName();

        // Upload to AWS S3
        const fileBuffer = await file.arrayBuffer();
        const params = {
            Bucket: process.env.PHOTO_BUCKET_NAME!,
            Key: fileName,
            Body: Buffer.from(fileBuffer),
            ContentType: file.type,
        };

        const awsRes = await s3Client.send(new PutObjectCommand(params));

        if (awsRes.$metadata.httpStatusCode !== 200) {
            return NextResponse.json({ error: "Failed to store image." }, { status: 500 });
        }

        // Construct image URL
        const imageUrl = `https://${process.env.PHOTO_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        const User = await getUserModel();
        await User.updateOne({ email: rootUser.email }, { $set: { profilePicture: imageUrl } });

        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error("Upload profile picture error:", error);
        return NextResponse.json({ error: "Failed to upload profile picture" }, { status: 500 });
    }
}

// DELETE PROFILE PICTURE
export async function deleteProfilePictureHandler(req: any, userId: string, token: string) {
    try {
        const { url } = req;

        if (!url) {
            return NextResponse.json({ error: "enter all details" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "user not found" }, { status: 401 });
        }

        // Extract the file key from the URL
        const parts = url.split("/");
        const hash = parts[parts.length - 1];

        // Delete from S3
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.PHOTO_BUCKET_NAME!,
                Key: hash,
            })
        );

        // Remove profile picture from user record
        const User = await getUserModel();
        await User.updateOne({ email: rootUser.email }, { $set: { profilePicture: "" } });

        return NextResponse.json({
            message: "Profile picture deleted successfully.",
        });

    } catch (error) {
        console.error("Delete profile picture error:", error);
        return NextResponse.json({ error: "Failed to delete profile picture" }, { status: 500 });
    }
}

// EDIT PROFILE
export async function editProfileHandler(req: any, userId: string, token: string) {
    try {
        const { fullName, phone, bio } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "user not logged in" }, { status: 404 });
        }

        const User = await getUserModel();
        const isUser = await User.findOne({ email: rootUser.email });
        
        if (!isUser) {
            return NextResponse.json({ error: "user not registered" }, { status: 400 });
        }

        await User.updateOne(
            { email: rootUser.email }, 
            { $set: { fullName, phone, bio } }
        );

        return NextResponse.json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("Edit profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}