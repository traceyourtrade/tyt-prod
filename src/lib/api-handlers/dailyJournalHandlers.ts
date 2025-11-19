import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Import models
import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getASAccountModel } from '@/models/accounts/asAccounts.model';
import { getOpenTradeModel } from '@/models/accounts/openTrades.model';

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

// Helper function to get trade model
function getTradeModel(accountType: string) {
    switch (accountType) {
        case 'File Upload':
            return getFileUploadModel();
        case 'Manual':
            return getManualModel();
        case 'Auto Sync':
        case 'Broker Sync':
            return getAutoSyncModel();
        default:
            throw new Error("Invalid account type");
    }
}

// -------------------- UPLOAD IMAGE --------------
export async function uploadImageHandler(formData, userId: string, token: string) {
    try {
        // const formData = await req.formData();
        const id = formData.get('id') as string;
        const imgType = formData.get('imgType') as string;
        const accountType = formData.get('accountType') as string;
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Validate imgType
        const validImgTypes = ['beforeURL', 'afterURL'];
        if (!validImgTypes.includes(imgType)) {
            return NextResponse.json({
                error: "Invalid image type. Must be 'beforeURL' or 'afterURL'"
            }, { status: 400 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        // Generate file name and upload to S3
        const fileName = generateFileName();
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

        const imageUrl = `https://${process.env.PHOTO_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        // Find the trade in the specified collection
        const tradeDoc = await TradeModel.findOne({
            uniqueId: rootUser.uniqueId,
            "tradeData.id": id
        });

        if (!tradeDoc) {
            return NextResponse.json({ error: "Trade not found in the specified collection." }, { status: 404 });
        }

        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) => td.id === id);
        if (tradeIndex === -1) {
            return NextResponse.json({ error: "Trade ID not found in the document." }, { status: 404 });
        }

        // Update the image URL
        tradeDoc.tradeData[tradeIndex][imgType] = imageUrl;
        tradeDoc.markModified('tradeData');
        await tradeDoc.save();

        return NextResponse.json({
            message: "Image uploaded and trade updated successfully.",
            imageUrl,
            collection: accountType,
            tradeId: id
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}

// DELETE IMAGE
export async function deleteImageHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "Enter all details" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Extract the file key from the URL
        const parts = url.split("/");
        const hash = parts[parts.length - 1];

        // Delete from S3 first
        try {
            const awsRes = await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: process.env.PHOTO_BUCKET_NAME!,
                    Key: hash,
                })
            );

            if (awsRes.$metadata.httpStatusCode !== 204) {
                console.warn("S3 deletion returned non-204 status:", awsRes.$metadata.httpStatusCode);
            }
        } catch (s3Error) {
            console.error("S3 deletion error:", s3Error);
            // Continue with database cleanup even if S3 deletion fails
        }

        // Search in all collections
        const collections = [
            { name: 'fileUpload', model: getFileUploadModel() },
            { name: 'manual', model: getManualModel() },
            { name: 'autoSync', model: getAutoSyncModel() }
        ];

        let imageRemoved = false;
        let collectionName = '';

        for (const collection of collections) {
            const TradeModel = await collection.model;
            const tradeDoc = await TradeModel.findOne({
                uniqueId: rootUser.uniqueId,
                $or: [
                    { "tradeData.beforeURL": url },
                    { "tradeData.afterURL": url }
                ]
            });

            if (tradeDoc) {
                collectionName = collection.name;

                // Update all trades that have this URL
                tradeDoc.tradeData.forEach((trade: any) => {
                    if (trade.beforeURL === url) {
                        trade.beforeURL = "";
                        imageRemoved = true;
                    }
                    if (trade.afterURL === url) {
                        trade.afterURL = "";
                        imageRemoved = true;
                    }
                });

                if (imageRemoved) {
                    tradeDoc.markModified('tradeData');
                    await tradeDoc.save();
                    break;
                }
            }
        }

        if (!imageRemoved) {
            return NextResponse.json({
                error: "Image URL not found in any trade.",
                message: "Image was deleted from storage but not found in database."
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Image deleted and URL removed successfully.",
            collection: collectionName,
            imageUrl: url
        });

    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

// CHANGE SELECT QUALITY
export async function changeSelectQualityHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { id, option, accountType } = await req.json();

        if (!id || !option || !accountType) {
            return NextResponse.json({ error: "Enter all details" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Validate option
        const validOptions = ['select', 'high', 'medium', 'low'];
        if (!validOptions.includes(option)) {
            return NextResponse.json({ error: "Invalid quality option" }, { status: 400 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        // Find the trade document
        const tradeDoc = await TradeModel.findOne({
            uniqueId: rootUser.uniqueId,
            "tradeData.id": id
        });

        if (!tradeDoc) {
            return NextResponse.json({ error: "Trade not found in the specified collection" }, { status: 404 });
        }

        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) => td.id === id);
        if (tradeIndex === -1) {
            return NextResponse.json({ error: "Trade ID not found in the document" }, { status: 404 });
        }

        const trade = tradeDoc.tradeData[tradeIndex];

        // Initialize quality object if needed
        if (!trade.Quality) {
            trade.Quality = {
                select: false,
                high: false,
                medium: false,
                low: false
            };
        }

        // Update quality based on option
        trade.Quality = {
            select: option === 'select',
            high: option === 'high',
            medium: option === 'medium',
            low: option === 'low'
        };

        tradeDoc.markModified('tradeData');
        await tradeDoc.save();

        return NextResponse.json({
            message: "Trade quality updated successfully",
            collection: accountType,
            tradeId: id,
            Quality: option
        });

    } catch (error) {
        console.error("Trade update error:", error);
        return NextResponse.json({ error: "Failed to update trade quality" }, { status: 500 });
    }
}

// UPLOAD JOURNAL DATA
export async function uploadJournalDataHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { id, jrData, accountType } = await req.json();

        if (!id || !jrData || !accountType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        // Update directly with findOneAndUpdate
        const result = await TradeModel.findOneAndUpdate(
            {
                uniqueId: user.uniqueId,
                "tradeData.id": id
            },
            {
                $set: {
                    "tradeData.$.jrData": jrData
                }
            },
            {
                new: true
            }
        );

        if (!result) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Journal data updated successfully",
            jrData: jrData
        });

    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Server error during update" }, { status: 500 });
    }
}

// ADD OTHER DATA
export async function addOtherDataHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { type, value } = await req.json();

        if (!type || !value) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const User = await getUserModel();
        const user = await User.findOne({ "tokens.token": token });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Validate the type is one of the allowed fields
        const allowedTypes = ['strategy', 'rfe', 'btm', 'dtm', 'atm'];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
        }

        // Update the specific array in otherData
        const updateQuery: any = {};
        updateQuery[`otherData.${type}`] = value;

        // $addToSet prevents duplicates
        const updatedUser = await User.findOneAndUpdate(
            { "tokens.token": token },
            { $addToSet: updateQuery },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User update failed" }, { status: 404 });
        }

        return NextResponse.json({
            message: `${value} added to ${type} successfully`,
            updatedUser
        });

    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({
            error: "Server error updating all trades",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE OTHER DATA
export async function deleteOtherDataHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { type, value } = await req.json();

        if (!type || !value) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const allowedTypes = ['strategy', 'rfe', 'btm', 'dtm', 'atm'];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
        }

        const User = await getUserModel();
        
        // Remove value from `otherData`
        const user = await User.findOneAndUpdate(
            { "tokens.token": token },
            { $pull: { [`otherData.${type}`]: value } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: `${value} removed from ${type}.`,
            updatedUser: user
        });

    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({
            error: "Server error deleting value",
            details: error.message
        }, { status: 500 });
    }
}

// EDIT DROPDOWNS
export async function editDropdownsHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { id, type, value, accountType } = await req.json();

        if (!id || !value || !type || !accountType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const allowedTypes = ['strategy', 'rfe', 'btm', 'dtm', 'atm'];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        // Update directly with findOneAndUpdate using positional operator
        const result = await TradeModel.findOneAndUpdate(
            {
                uniqueId: user.uniqueId,
                "tradeData.id": id
            },
            {
                $set: {
                    [`tradeData.$.${type}`]: value
                }
            },
            {
                new: true
            }
        );

        if (!result) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `${type} updated to "${value}" for trade ${id}`,
            updatedValue: value,
            field: type,
            tradeId: id,
            collection: accountType
        });

    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({
            error: "Server error during update"
        }, { status: 500 });
    }
}