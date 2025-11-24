import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Import models

import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getStrategyModel } from '@/models/main/strategy.model';

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

// ADD STRATEGY
export async function addStrategyHandler(req:any, userId: string, token: string) {
    try {
        const { strategy, tags, description } = req;

        // Validate inputs
        if (!strategy) {
            return NextResponse.json({ error: "Enter all required details." }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const Strategy = await getStrategyModel();
        
        // Check if strategy already exists for this user
        const existingStrategy = await Strategy.findOne({
            uniqueId: rootUser.uniqueId,
            strategy: strategy.trim(),
        });

        if (existingStrategy) {
            return NextResponse.json({
                error: "Strategy with this name already exists for the user.",
            }, { status: 409 });
        }

        // Convert tags into array properly
        let processedTags: string[] = [];
        if (typeof tags === "string") {
            processedTags = tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
        } else if (Array.isArray(tags)) {
            processedTags = tags.map((tag) => tag.trim());
        }

        // Check if user already has strategies
        const existingStrategies = await Strategy.find({ uniqueId: rootUser.uniqueId });

        // If this is the first strategy, make it default
        const isDefault = existingStrategies.length === 0;

        // Create new strategy
        const newStrategy = new Strategy({
            uniqueId: rootUser.uniqueId,
            strategy: strategy.trim(),
            ...(description && { description }),
            ...(processedTags.length > 0 && { tags: processedTags }),
            isDefault,
        });

        await newStrategy.save();

        // Update user's otherData.strategy array
        const User = await getUserModel();
        await User.updateOne(
            { _id: rootUser._id },
            { $addToSet: { "otherData.strategy": strategy.trim() } }
        );

        return NextResponse.json({
            message: `✅ Strategy added successfully${
                isDefault ? " and set as default." : "."
            }`,
            strategy: newStrategy,
        });

    } catch (error: any) {
        console.error("Error adding strategy:", error);

        if (error.code === 11000) {
            return NextResponse.json({
                error: "Duplicate strategy name detected for this user.",
            }, { status: 409 });
        }

        return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
    }
}

// UPDATE STRATEGY
export async function updateStrategyHandler(req:any, userId: string, token: string) {
    try {
        const { id } = req; // Strategy _id from body for Next.js
        const { strategy, tags, description } = req;

        // Authenticate user
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const Strategy = await getStrategyModel();
        
        // Verify ownership of strategy
        const existingStrategy = await Strategy.findOne({
            _id: id,
            uniqueId: rootUser.uniqueId,
        });
        if (!existingStrategy) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        const oldName = existingStrategy.strategy;

        // Process tags (convert to array)
        let processedTags: string[] = [];
        if (typeof tags === "string") {
            processedTags = tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
        } else if (Array.isArray(tags)) {
            processedTags = tags.map((tag) => tag.trim());
        }

        // Update fields only if provided
        if (strategy) existingStrategy.strategy = strategy.trim();
        if (description) existingStrategy.description = description;
        if (processedTags.length > 0) existingStrategy.tags = processedTags;

        await existingStrategy.save();

        const newName = existingStrategy.strategy;

        // If strategy name changed → update user's array and all trade schemas
        if (newName !== oldName) {
            const User = await getUserModel();
            const AutoSync = await getAutoSyncModel();
            const Manual = await getManualModel();
            const Files = await getFileUploadModel();

            // Update in user data
            await User.updateOne(
                { _id: rootUser._id },
                {
                    $pull: { "otherData.strategy": oldName },
                    $addToSet: { "otherData.strategy": newName },
                }
            );

            // Function to update tradeData.strategy fields
            const updateTradeData = async (Model: any) => {
                await Model.updateMany(
                    { uniqueId: rootUser.uniqueId, "tradeData.strategy": oldName },
                    { $set: { "tradeData.$[elem].strategy": newName } },
                    { arrayFilters: [{ "elem.strategy": oldName }] }
                );
            };

            await Promise.all([
                updateTradeData(AutoSync),
                updateTradeData(Manual),
                updateTradeData(Files),
            ]);
        }

        return NextResponse.json({
            message: "✅ Strategy updated successfully",
            updated: existingStrategy,
        });

    } catch (error) {
        console.error("Error updating strategy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// UPDATE STRATEGY NAME
export async function updateStrategyNameHandler(req:any, userId: string, token: string) {
    try {
        const { id, newName } = req;

        // Authenticate user
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const Strategy = await getStrategyModel();
        
        // Find strategy
        const strategyDoc = await Strategy.findOne({
            _id: id,
            uniqueId: rootUser.uniqueId,
        });
        if (!strategyDoc) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        const oldName = strategyDoc.strategy;
        const trimmedNewName = newName.trim();

        // Update name in Strategy schema
        strategyDoc.strategy = trimmedNewName;
        await strategyDoc.save();

        // Update in User.otherData.strategy array
        const User = await getUserModel();
        await User.updateOne(
            { _id: rootUser._id },
            { $pull: { "otherData.strategy": oldName } }
        );

        await User.updateOne(
            { _id: rootUser._id },
            { $addToSet: { "otherData.strategy": trimmedNewName } }
        );

        // Update in all 3 trade schemas
        const AutoSync = await getAutoSyncModel();
        const Manual = await getManualModel();
        const Files = await getFileUploadModel();

        const updateTradeData = async (Model: any) => {
            await Model.updateMany(
                { uniqueId: rootUser.uniqueId, "tradeData.strategy": oldName },
                { $set: { "tradeData.$[elem].strategy": trimmedNewName } },
                { arrayFilters: [{ "elem.strategy": oldName }] }
            );
        };

        await Promise.all([
            updateTradeData(AutoSync),
            updateTradeData(Manual),
            updateTradeData(Files),
        ]);

        return NextResponse.json({
            message: "✅ Strategy name updated successfully",
            oldName,
            newName: trimmedNewName,
        });

    } catch (error) {
        console.error("Error updating strategy name:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE STRATEGY
export async function deleteStrategyHandler(req, userId: string, token: string) {
    try {
        const { id } = await req;

        // Verify user
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const Strategy = await getStrategyModel();
        
        // Find the strategy to delete
        const strategyToDelete = await Strategy.findOne({
            _id: id,
            uniqueId: rootUser.uniqueId,
        });

        if (!strategyToDelete) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }
console.log('Strategy to delete:', strategyToDelete);
        const deletedStrategyName = strategyToDelete.strategy;

        // Delete strategy document
        await Strategy.deleteOne({ _id: id });

        // Remove strategy from user's array
        const User = await getUserModel();
        await User.updateOne(
            { _id: rootUser._id },
            { $pull: { "otherData.strategy": deletedStrategyName } }
        );

        // Update all 3 trade collections
        const AutoSync = await getAutoSyncModel();
        const Manual = await getManualModel();
        const Files = await getFileUploadModel();

        const updateTradeData = async (Model: any) => {
            await Model.updateMany(
                { uniqueId: rootUser.uniqueId, "tradeData.strategy": deletedStrategyName },
                { $set: { "tradeData.$[elem].strategy": "Select" } },
                { arrayFilters: [{ "elem.strategy": deletedStrategyName }] }
            );
        };

        await Promise.all([
            updateTradeData(AutoSync),
            updateTradeData(Manual),
            updateTradeData(Files),
        ]);

        return NextResponse.json({ message: "Strategy deleted successfully" });

    } catch (error) {
        console.error("Error deleting strategy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET STRATEGIES
export async function getStrategiesHandler(req:any, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const Strategy = await getStrategyModel();
        const strategies = await Strategy.find({ uniqueId: rootUser.uniqueId }).sort({ createdDate: -1 });
        
        return NextResponse.json({ strategies });

    } catch (error) {
        console.error("Error fetching strategies:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// UPLOAD STRATEGY IMAGE
export async function uploadStrategyImageHandler(req:any, userId: string, token: string) {
    try {
        const formData = await req.formData();
        const strategy = formData.get('strategy') as string;
        const file = formData.get('image') as File;

        // Validate inputs
        if (!strategy) {
            return NextResponse.json({ error: "Missing required fields (token or strategy name)" }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: "No image file uploaded." }, { status: 400 });
        }

        // Find user via token
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
        }

        const Strategy = await getStrategyModel();
        
        // Find strategy via uniqueId + strategy name
        const targetStrategy = await Strategy.findOne({
            uniqueId: rootUser.uniqueId,
            strategy: strategy.trim()
        });

        if (!targetStrategy) {
            return NextResponse.json({ error: "Strategy not found for this user." }, { status: 404 });
        }

        // Generate unique file name
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
            return NextResponse.json({ error: "Failed to upload image to S3." }, { status: 500 });
        }

        // Construct public image URL
        const imageUrl = `https://${process.env.PHOTO_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        // Update strategy's image link
        targetStrategy.imgLink = imageUrl;
        await targetStrategy.save();

        return NextResponse.json({
            message: "Strategy image uploaded successfully",
            imageUrl,
            strategy,
        });

    } catch (error) {
        console.error("Error uploading strategy image:", error);
        return NextResponse.json({ error: "Failed to upload strategy image" }, { status: 500 });
    }
}

// SET DEFAULT STRATEGY
export async function setDefaultStrategyHandler(req:any, userId: string, token: string) {
    try {
        const { id } = req;

        const Strategy = await getStrategyModel();
        
        // Find the strategy
        const strategy = await Strategy.findById(id);
        if (!strategy) {
            return NextResponse.json({ success: false, message: "Strategy not found" }, { status: 404 });
        }

        // Get uniqueId to reset others for this user/account
        const { uniqueId } = strategy;

        // Step 1: Reset all strategies under this uniqueId to false
        await Strategy.updateMany({ uniqueId }, { $set: { isDefault: false } });

        // Step 2: Set the chosen strategy to true
        strategy.isDefault = true;
        await strategy.save();

        return NextResponse.json({
            success: true,
            message: `Strategy "${strategy.strategy}" is now default.`,
            data: strategy,
        });
    } catch (error) {
        console.error("Error setting default strategy:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}