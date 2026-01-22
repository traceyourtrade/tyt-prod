import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Import models
import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getOpenTradeModel } from '@/models/accounts/openTrades.model';
import { getASAccountModel } from '@/models/accounts/asAccounts.model';
import { getTradeEnrichmentModel } from '@/models/main/tradeEnrichment.model';
import mongoose from 'mongoose';

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
export async function uploadImageHandler(formData: any, userId: string, token: string) {
    try {
        const id = formData.get('id') as string;
        const imgType = formData.get('imgType') as string;
        const accountType = formData.get('accountType') as string;
        const accountId = formData.get('accountId') as string;
        const file = formData.get('image') as File;

        console.log(`[UploadImage] Started for ID: ${id}, Type: ${imgType}, Account: ${accountId}, Collection: ${accountType}`);

        if (!file) {
            console.error("[UploadImage] No file uploaded.");
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            console.error("[UploadImage] User not found for token.");
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Validate imgType
        const validImgTypes = ['beforeURL', 'afterURL'];
        if (!validImgTypes.includes(imgType)) {
            console.error(`[UploadImage] Invalid image type: ${imgType}`);
            return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
        }

        // 1. Generate name and upload to S3
        const fileName = generateFileName();
        const fileBuffer = await file.arrayBuffer();

        console.log(`[UploadImage] Uploading to S3. Bucket: ${process.env.PHOTO_BUCKET_NAME}, Key: ${fileName}`);

        const awsRes = await s3Client.send(new PutObjectCommand({
            Bucket: process.env.PHOTO_BUCKET_NAME!,
            Key: fileName,
            Body: Buffer.from(fileBuffer),
            ContentType: file.type,
        }));

        console.log(`[UploadImage] S3 Response Status: ${awsRes.$metadata.httpStatusCode}`);

        const imageUrl = `https://${process.env.PHOTO_BUCKET_NAME}.s3.${process.env.PHOTO_BUCKET_REGION}.amazonaws.com/${fileName}`;
        const ticketId = parseInt(id, 10);
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const objId = isObjectId ? new mongoose.Types.ObjectId(id) : null;

        console.log(`[UploadImage] ID: ${id}, TokenUID: ${rootUser.uniqueId}, HeaderUID: ${userId}, AccountID: ${accountId}`);

        const UploadEnrichmentModel = await getTradeEnrichmentModel();

        const mainCollections = [
            {
                name: accountType || 'Primary', getModel: () => {
                    if (!accountType || accountType === "undefined") return null;
                    try { return getTradeModel(accountType); } catch (e) { return null; }
                }
            },
            { name: 'fileUpload', getModel: getFileUploadModel },
            { name: 'manual', getModel: getManualModel },
            { name: 'autoSync', getModel: getAutoSyncModel },
            { name: 'openTrades', getModel: getOpenTradeModel }
        ];

        let tradeDoc = null;
        let foundCollection = "";
        let resolvedTradeId = id; // Default to incoming ID

        // Strategy A: Try searching main collections with all possible user IDs
        const possibleUserIds = [...new Set([rootUser.uniqueId, userId])].filter(Boolean);

        outerSearch: for (const currentUID of possibleUserIds) {
            console.log(`[UploadImage] Probing main collections for UserID: ${currentUID}...`);

            for (const col of mainCollections) {
                try {
                    const Model = await col.getModel();
                    if (!Model) continue;

                    const subQueries = [
                        { uniqueId: currentUID, accountId: accountId && accountId !== "undefined" ? accountId : undefined },
                        { uniqueId: currentUID }
                    ].filter(q => q.accountId !== undefined || Object.keys(q).length === 1);

                    for (const baseQuery of subQueries) {
                        const orConditions: any[] = [
                            { "tradeData.id": id },
                            { "tradeId": id },
                            { "id": id }
                        ];
                        if (!isNaN(ticketId) && /^\d+$/.test(id)) orConditions.push({ "tradeData.Ticket": ticketId });
                        if (objId) {
                            orConditions.push({ "_id": objId }, { "tradeData._id": objId });
                        }

                        const fullQuery = { ...baseQuery, $or: orConditions };
                        tradeDoc = await Model.findOne(fullQuery);

                        if (tradeDoc) {
                            foundCollection = col.name;
                            console.log(`[UploadImage] Success! Found in [${foundCollection}] with UID: ${currentUID}`);
                            break outerSearch;
                        }
                    }
                } catch (err: any) {
                    console.error(`[UploadImage] Error in [${col.name}]:`, err.message);
                }
            }
        }

        // Strategy B: If NOT found in main, check TradeEnrichment to find the real IDs
        if (!tradeDoc) {
            console.log(`[UploadImage] Not found in main collections. Checking TradeEnrichment fallback...`);
            for (const currentUID of possibleUserIds) {
                try {
                    const enrichmentQuery = {
                        uniqueId: currentUID,
                        $or: [
                            { tradeId: id },
                            { _id: objId || id }
                        ].filter(c => c._id !== undefined || (typeof c.tradeId === 'string' && c.tradeId !== ""))
                    };
                    const enrichmentMatch = await UploadEnrichmentModel.findOne(enrichmentQuery);

                    if (enrichmentMatch) {
                        console.log(`[UploadImage] Enrichment match found! Real TradeID: ${enrichmentMatch.tradeId}, AccountID: ${enrichmentMatch.accountId}`);

                        // Try to find the actual doc using these valid IDs
                        for (const col of mainCollections) {
                            const Model = await col.getModel();
                            if (!Model) continue;
                            tradeDoc = await Model.findOne({
                                uniqueId: currentUID,
                                accountId: enrichmentMatch.accountId,
                                $or: [
                                    { "tradeId": enrichmentMatch.tradeId },
                                    { "tradeData.id": enrichmentMatch.tradeId },
                                    { "tradeData.Ticket": parseInt(enrichmentMatch.tradeId, 10) }
                                ].filter(c => !isNaN((c as any).tradeData?.Ticket || 0) || (c as any).tradeId || (c as any).tradeData?.id)
                            });
                            if (tradeDoc) {
                                foundCollection = col.name;
                                resolvedTradeId = enrichmentMatch.tradeId; // Update to the real ID
                                console.log(`[UploadImage] Resolved from enrichment into [${foundCollection}] with Real ID: ${resolvedTradeId}`);
                                break;
                            }
                        }
                    }
                    if (tradeDoc) break;
                } catch (e) { }
            }
        }

        // Strategy C: Global check for logs only
        if (!tradeDoc) {
            console.log(`[UploadImage] No luck. Performing final Global Check (Log-only)...`);
            for (const col of mainCollections) {
                try {
                    const Model = await col.getModel();
                    if (!Model) continue;
                    const globalRes = await Model.findOne({ $or: [{ "tradeData.id": id }, { "tradeId": id }, { "_id": objId || id }] });
                    if (globalRes) console.error(`[UploadImage] CRITICAL: Trade found but owned by ${globalRes.uniqueId}`);
                } catch (e) { }
            }
        }

        if (!tradeDoc) {
            console.error("[UploadImage] Trade record not found across all collections even after fallback.");
            return NextResponse.json({ error: "Trade record not found." }, { status: 404 });
        }

        const finalImageUrl = `https://${process.env.PHOTO_BUCKET_NAME}.s3.${process.env.PHOTO_BUCKET_REGION}.amazonaws.com/${fileName}`;
        console.log(`[UploadImage] Generated URL: ${finalImageUrl}`);

        // 3. Update the tradeData array
        const resolvedTicketId = parseInt(resolvedTradeId, 10);
        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) =>
            td.id === id ||
            td.id === resolvedTradeId ||
            (!isNaN(ticketId) && td.Ticket === ticketId) ||
            (!isNaN(resolvedTicketId) && td.Ticket === resolvedTicketId) ||
            (td._id && td._id.toString() === id) ||
            (td._id && td._id.toString() === resolvedTradeId) ||
            ((tradeDoc as any)._id?.toString() === id)
        );

        if (tradeIndex === -1) {
            console.error(`[UploadImage] Trade ID ${id} not found in tradeData array.`);
            return NextResponse.json({ error: "Trade index not found." }, { status: 404 });
        }

        console.log(`[UploadImage] Updating index ${tradeIndex} in ${foundCollection}`);
        tradeDoc.tradeData[tradeIndex][imgType] = finalImageUrl;
        tradeDoc.markModified('tradeData');
        await tradeDoc.save();
        console.log("[UploadImage] Trade document saved.");

        // 4. Persistence Fix: Save to Enrichment collection
        console.log("[UploadImage] Updating Enrichment collection...");
        const tradeDataToEnrich = tradeDoc.tradeData[tradeIndex];
        const tradeIdForEnrichment = tradeDataToEnrich.id || tradeDataToEnrich.Ticket?.toString() || (tradeDataToEnrich._id ? tradeDataToEnrich._id.toString() : id);

        const enrichmentRes = await UploadEnrichmentModel.findOneAndUpdate(
            { uniqueId: rootUser.uniqueId, accountId: tradeDoc.accountId, tradeId: tradeIdForEnrichment },
            { $set: { [imgType]: finalImageUrl } },
            { upsert: true, new: true }
        );
        console.log("[UploadImage] Enrichment updated:", enrichmentRes ? "Success" : "Failed");

        return NextResponse.json({
            message: "Image uploaded successfully.",
            imageUrl: finalImageUrl,
            collection: foundCollection
        });

    } catch (error) {
        console.error("[UploadImage] Fatal Error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}

// DELETE IMAGE
export async function deleteImageHandler(req: any, userId: string, token: string) {
    try {
        const { url } = req;
        console.log(`[DeleteImage] Started for URL: ${url}`);

        if (!url) {
            console.error("[DeleteImage] No URL provided.");
            return NextResponse.json({ error: "Enter all details" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            console.error("[DeleteImage] User not found for token.");
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // 1. Delete from S3 first
        let s3ErrorOccurred = null;
        let urlObjForDeletion: URL | null = null;
        try {
            // Extract the file key from the URL
            urlObjForDeletion = new URL(url);
            let key = urlObjForDeletion.pathname.startsWith('/') ? urlObjForDeletion.pathname.substring(1) : urlObjForDeletion.pathname;

            // Decode URI component just in case it's encoded
            key = decodeURIComponent(key).trim();

            console.log(`[DeleteImage] Attempting S3 deletion. Bucket: ${process.env.PHOTO_BUCKET_NAME}, Key: ${key}`);

            const awsRes = await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: process.env.PHOTO_BUCKET_NAME!,
                    Key: key,
                })
            );
            console.log(`[DeleteImage] S3 Response Status: ${awsRes.$metadata.httpStatusCode}`);
        } catch (s3Error: any) {
            console.error("[DeleteImage] S3 deletion error:", s3Error);
            s3ErrorOccurred = s3Error.message || String(s3Error);
            // We continue with DB cleanup, but we'll report this error
        }

        // 2. Clear from all potential trade collections
        const collections = [
            { name: 'fileUpload', getModel: getFileUploadModel },
            { name: 'manual', getModel: getManualModel },
            { name: 'autoSync', getModel: getAutoSyncModel },
            { name: 'openTrades', getModel: getOpenTradeModel }
        ];

        let totalModified = 0;
        console.log("[DeleteImage] Clearing database references...");

        for (const col of collections) {
            try {
                const Model = await col.getModel();

                // Clear beforeURL
                const resBefore = await Model.updateMany(
                    { uniqueId: rootUser.uniqueId, "tradeData.beforeURL": url },
                    { $set: { "tradeData.$[elem].beforeURL": "" } },
                    { arrayFilters: [{ "elem.beforeURL": url }] }
                );

                // Clear afterURL
                const resAfter = await Model.updateMany(
                    { uniqueId: rootUser.uniqueId, "tradeData.afterURL": url },
                    { $set: { "tradeData.$[elem].afterURL": "" } },
                    { arrayFilters: [{ "elem.afterURL": url }] }
                );

                const modifiedThisCol = (resBefore.modifiedCount || 0) + (resAfter.modifiedCount || 0);
                totalModified += modifiedThisCol;
                console.log(`[DeleteImage] ${col.name}: Modified ${modifiedThisCol} records.`);
            } catch (err) {
                console.error(`[DeleteImage] Error updating ${col.name}:`, err);
            }
        }

        // 3. Clear from TradeEnrichment
        try {
            const DeletionEnrichmentModel = await getTradeEnrichmentModel();
            const resEnrichmentBefore = await DeletionEnrichmentModel.updateMany(
                { uniqueId: rootUser.uniqueId, beforeURL: url },
                { $set: { beforeURL: "" } }
            );
            const resEnrichmentAfter = await DeletionEnrichmentModel.updateMany(
                { uniqueId: rootUser.uniqueId, afterURL: url },
                { $set: { afterURL: "" } }
            );

            const modifiedEnrichment = (resEnrichmentBefore.modifiedCount || 0) + (resEnrichmentAfter.modifiedCount || 0);
            totalModified += modifiedEnrichment;
            console.log(`[DeleteImage] TradeEnrichment: Modified ${modifiedEnrichment} records.`);
        } catch (err) {
            console.error("[DeleteImage] Error updating TradeEnrichment:", err);
        }

        console.log(`[DeleteImage] Finished. Total modified records: ${totalModified}`);

        return NextResponse.json({
            message: s3ErrorOccurred
                ? `Database cleared, but S3 deletion failed: ${s3ErrorOccurred}`
                : "Image deleted and reference cleared from all records.",
            totalModified,
            imageUrl: url,
            s3Error: s3ErrorOccurred,
            attemptedBucket: process.env.PHOTO_BUCKET_NAME,
            attemptedKey: urlObjForDeletion ? (urlObjForDeletion.pathname.startsWith('/') ? urlObjForDeletion.pathname.substring(1) : urlObjForDeletion.pathname) : undefined
        }, { status: s3ErrorOccurred ? 207 : 200 }); // 207 Multi-Status for partial success

    } catch (error) {
        console.error("[DeleteImage] Fatal Error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

// CHANGE SELECT QUALITY
export async function changeSelectQualityHandler(req: any, userId: string, token: string) {
    try {
        const { id, option, accountType } = req;

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

        // Find the trade document - Support id, Ticket, and _id
        const accountId = req.accountId;
        const ticketId = parseInt(id, 10);
        const isObjectId = mongoose.Types.ObjectId.isValid(id);

        const query: any = { uniqueId: rootUser.uniqueId };
        if (accountId) query.accountId = accountId;

        const orConditions: any[] = [
            { "tradeData.id": id }
        ];

        if (!isNaN(ticketId)) {
            orConditions.push({ "tradeData.Ticket": ticketId });
        }
        if (isObjectId) {
            orConditions.push({ "_id": id });
            orConditions.push({ "tradeData._id": id });
        }

        query["$or"] = orConditions;

        const tradeDoc = await TradeModel.findOne(query);

        if (!tradeDoc) {
            return NextResponse.json({ error: "Trade not found in the specified collection" }, { status: 404 });
        }

        // Find index checking id, Ticket, and _id
        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) =>
            td.id === id ||
            (!isNaN(ticketId) && td.Ticket === ticketId) ||
            (td._id && td._id.toString() === id) ||
            ((tradeDoc as any)._id?.toString() === id)
        );

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

        // PERSISTENCE FIX: Save to Enrichment collection
        const QualityEnrichmentModel = await getTradeEnrichmentModel();
        const tradeIdForEnrichment = trade.id || trade.Ticket?.toString() || id;

        await QualityEnrichmentModel.findOneAndUpdate(
            { uniqueId: rootUser.uniqueId, accountId: accountId || tradeDoc.accountId, tradeId: tradeIdForEnrichment },
            { $set: { Quality: trade.Quality } },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: "Trade quality updated successfully",
            collection: accountType,
            tradeId: id,
            Quality: option
        });

    } catch (error: any) {
        console.error("Trade update error:", error);
        return NextResponse.json({ error: "Failed to update trade quality" }, { status: 500 });
    }
}

// UPLOAD JOURNAL DATA
export async function uploadJournalDataHandler(req: any, userId: string, token: string) {
    try {
        const { id, jrData, accountType } = req;

        if (!id || !jrData || !accountType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        const accountId = req.accountId;
        const ticketId = parseInt(id, 10);
        const isObjectId = mongoose.Types.ObjectId.isValid(id);

        const query: any = { uniqueId: user.uniqueId };
        if (accountId) query.accountId = accountId;

        const orConditions: any[] = [
            { "tradeData.id": id }
        ];

        if (!isNaN(ticketId)) {
            orConditions.push({ "tradeData.Ticket": ticketId });
        }
        if (isObjectId) {
            orConditions.push({ "_id": id });
            orConditions.push({ "tradeData._id": id });
        }

        query["$or"] = orConditions;

        const tradeDoc = await TradeModel.findOne(query);

        if (!tradeDoc) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        // Update the journal data
        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) =>
            td.id === id ||
            (!isNaN(ticketId) && td.Ticket === ticketId) ||
            (td._id && td._id.toString() === id) ||
            ((tradeDoc as any)._id && (tradeDoc as any)._id.toString() === id)
        );

        if (tradeIndex === -1) {
            return NextResponse.json({ error: "Trade ID not found in the document" }, { status: 404 });
        }

        // Update the journal data
        tradeDoc.tradeData[tradeIndex].jrData = jrData;
        tradeDoc.markModified('tradeData');
        await tradeDoc.save();

        // PERSISTENCE FIX: Save to Enrichment collection
        const JournalEnrichmentModel = await getTradeEnrichmentModel();
        const tradeIdForEnrichment = tradeDoc.tradeData[tradeIndex].id || tradeDoc.tradeData[tradeIndex].Ticket?.toString() || id;

        await JournalEnrichmentModel.findOneAndUpdate(
            { uniqueId: user.uniqueId, accountId: accountId || tradeDoc.accountId, tradeId: tradeIdForEnrichment },
            { $set: { jrData: jrData } },
            { upsert: true, new: true }
        );

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
export async function addOtherDataHandler(req: any, userId: string, token: string) {
    try {
        const { type, value } = req;

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

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json({
            error: "Server error updating all trades",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE OTHER DATA
export async function deleteOtherDataHandler(req: any, userId: string, token: string) {
    try {
        const { type, value } = req;

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

    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json({
            error: "Server error deleting value",
            details: error.message
        }, { status: 500 });
    }
}

// EDIT DROPDOWNS
export async function editDropdownsHandler(req: any, userId: string, token: string) {
    try {
        console.log("EditDropdownsHandler called with:", req);
        const { id, type, value, accountType } = req;

        const urlTypes = ['beforeURL', 'afterURL'];
        const isUrlType = urlTypes.includes(type);

        if (!id || !type || !accountType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!isUrlType && value === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const allowedTypes = ['strategy', 'rfe', 'btm', 'dtm', 'atm', 'beforeURL', 'afterURL'];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the correct model
        const TradeModel = await getTradeModel(accountType);

        const accountId = req.accountId;
        const ticketId = parseInt(id, 10);
        const isObjectId = mongoose.Types.ObjectId.isValid(id);

        const query: any = { uniqueId: user.uniqueId };
        if (accountId) query.accountId = accountId;

        const orConditions: any[] = [
            { "tradeData.id": id }
        ];

        if (!isNaN(ticketId)) {
            orConditions.push({ "tradeData.Ticket": ticketId });
        }
        if (isObjectId) {
            orConditions.push({ "_id": id });
            orConditions.push({ "tradeData._id": id });
        }

        query["$or"] = orConditions;

        const tradeDoc = await TradeModel.findOne(query);

        if (!tradeDoc) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        // Find index checking id, Ticket, and _id
        const tradeIndex = tradeDoc.tradeData.findIndex((td: any) =>
            td.id === id ||
            (!isNaN(ticketId) && td.Ticket === ticketId) ||
            (td._id && td._id.toString() === id) ||
            ((tradeDoc as any)._id && (tradeDoc as any)._id.toString() === id)
        );

        if (tradeIndex === -1) {
            return NextResponse.json({ error: "Trade ID not found in the document" }, { status: 404 });
        }

        // Update the field
        tradeDoc.tradeData[tradeIndex][type] = value;
        tradeDoc.markModified('tradeData');
        await tradeDoc.save();

        // PERSISTENCE FIX: Save to Enrichment collection
        const FinalUpdateEnrichmentModel = await getTradeEnrichmentModel();
        const tradeDataToUpdate = tradeDoc.tradeData[tradeIndex];
        const tradeIdForEnrichment = tradeDataToUpdate.id || tradeDataToUpdate.Ticket?.toString() || (tradeDataToUpdate._id ? tradeDataToUpdate._id.toString() : id);

        await FinalUpdateEnrichmentModel.findOneAndUpdate(
            { uniqueId: user.uniqueId, accountId: accountId || tradeDoc.accountId, tradeId: tradeIdForEnrichment },
            { $set: { [type]: value } },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: `${type} updated to "${value}" for trade ${id}`,
            updatedValue: value,
            field: type,
            tradeId: id,
            collection: accountType
        });

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json({
            error: "Server error during update"
        }, { status: 500 });
    }
}