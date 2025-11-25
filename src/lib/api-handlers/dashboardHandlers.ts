import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getASAccountModel } from '@/models/accounts/asAccounts.model';
import { getOpenTradeModel } from '@/models/accounts/openTrades.model';
import { getStrategyModel } from '@/models/main/strategy.model';
// Import your models (adjust paths as needed)
const User = await getUserModel();
const ASacc = await getASAccountModel();
const fileUpload = await getFileUploadModel();
const Manual = await getManualModel();
const asyncUpload = await getAutoSyncModel();
const OpenAsTrades = await getOpenTradeModel()
const Strategy = await getStrategyModel();

// Mood arrays
const quality = {
    select: true,
    high: false,
    medium: false,
    low: false
};

const jrData = {
    rfe: "",
    widw: "",
    wni: "",
    lfnt: ""
};

// Helper function to get user from token
async function getUserFromToken(token: string) {
    return await User.findOne({ "tokens.token": token });
}

// POST Handlers
export async function createAccountHandler(req: any, userId: string, token: string) {
    try {
        const { accountName, accountBalance, accountType, broker, description } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const email = rootUser.email;
        if (!email || !accountName || !accountType || !broker) {
            return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
        }

        const isUser = await User.findOne({ email });
        if (!isUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isAccountAdded = isUser.accounts.filter((obj: any) => obj.accountName === accountName);
        if (isAccountAdded.length === 0) {
            const accountId = uuidv4();
            const addAcc = await isUser.addAccount(accountName, accountBalance, accountType, broker, description, accountId);
            return NextResponse.json({ message: "Account added !" });
        } else {
            return NextResponse.json({ error: "Account already exists" }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function createAutoSyncAccountHandler(req, userId: string, token: string) {
    try {
        const { accountName, accountType, broker, investorId, password, serverName, description } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const email = rootUser.email;
        if (!email || !accountName || !accountType || !broker || !investorId || !password || !serverName) {
            return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
        }

        const isUser = await User.findOne({ email });
        if (!isUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isAccountAdded = isUser.accounts.filter((obj: any) => obj.accountName === accountName);
        if (isAccountAdded.length === 0) {
            const accountId = uuidv4();
            let investorPw = password;

            const addAcc = await isUser.addAutoSyncAccount(accountName, accountType, broker, description, investorId, investorPw, serverName, accountId);
            
            const newAsAc = new ASacc({
                uniqueId: rootUser.uniqueId,
                email: email,
                accountId: accountId,
                accountName: accountName,
                investorId: investorId,
                investorPw: investorPw,
                server: serverName,
                vpsId: "ASDF01",
                isActive: true
            });

            await newAsAc.save();

            const sendReq = await fetch("http://auto-sync-backend-env.ap-south-1.elasticbeanstalk.com/tytusersasqwzxerdfcv/verify/syncAcc", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountName, accountId, accountType, uniqueId: rootUser.uniqueId, email, investorId, password, server: serverName })
            });

            return NextResponse.json({ message: "Account added successfully!" });
        } else {
            return NextResponse.json({ error: "Account already exists" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function pollAutoSyncAccountHandler(req: any, userId: string, token: string) {
    try {
        const { accountName, uniqueId } = req;
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        if (!accountName || !uniqueId) {
            return NextResponse.json({ error: "Enter all the details" }, { status: 400 });
        }

        const isUser = await ASacc.findOne({ uniqueId, accountName });
        if (!isUser) {
            return NextResponse.json({ error: "User with given UniqueId and AccId not found" }, { status: 404 });
        }

        if (isUser.status === "green") {
            return NextResponse.json({ status: "green" });
        } else if (isUser.status === "red") {
            return NextResponse.json({ status: "red" }, { status: 403 });
        } else if (isUser.status === "yellow") {
            return NextResponse.json({ status: "yellow" }, { status: 406 });
        }

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function getAccountDetailsHandler(req: NextRequest, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const userData = await User.findOne({ uniqueId: userId });
        if (!userData || userData.email !== rootUser.email) {
            return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });
        }
  const strategies = await Strategy.find({ uniqueId: userId }).sort({ createdDate: -1 });

        const accountIds = userData.accounts.map((acc: any) => acc.accountId);

        const [fileUploadTrades, manualTrades, autoSyncTrades, asOpenTrades] = await Promise.all([
            fileUpload.find({ uniqueId: userId, accountId: { $in: accountIds } }),
            Manual.find({ uniqueId: userId, accountId: { $in: accountIds } }),
            asyncUpload.find({ uniqueId: userId, accountId: { $in: accountIds } }),
            OpenAsTrades.find({ uniqueId: userId, accountId: { $in: accountIds } }),
        ]);

        const tradesByAccount: { [key: string]: any[] } = {};

        fileUploadTrades.forEach((tradeDoc: any) => {
            const accountId = tradeDoc.accountId;
            if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
            tradesByAccount[accountId].push(...tradeDoc.tradeData);
        });

        manualTrades.forEach((tradeDoc: any) => {
            const accountId = tradeDoc.accountId;
            if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
            tradesByAccount[accountId].push(...tradeDoc.tradeData);
        });

        autoSyncTrades.forEach((tradeDoc: any) => {
            const accountId = tradeDoc.accountId;
            if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
            tradesByAccount[accountId].push(...tradeDoc.tradeData);
        });

        asOpenTrades.forEach((tradeDoc: any) => {
            const accountId = tradeDoc.accountId;
            if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
            tradesByAccount[accountId].push(...tradeDoc.tradeData);
        });

        const enhancedAccounts = userData.accounts.map((account: any) => ({
            ...account.toObject(),
            tradeData: tradesByAccount[account.accountId] || []
        }));

        return NextResponse.json({
            data: userData,
            accounts: enhancedAccounts,
            strategies: strategies
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function editAccCheckHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        if (!accountName) {
            return NextResponse.json({ error: "Enter all details" }, { status: 400 });
        }

        const accountToUpdate = rootUser.accounts.find((acc: any) => acc.accountName === accountName);
        if (!accountToUpdate) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        accountToUpdate.checked = !accountToUpdate.checked;
        await rootUser.save();

        return NextResponse.json({ data: rootUser });

    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function checkAllHandler(req: any, userId: string, token: string) {
    try {
        const { value } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        if (typeof value !== 'boolean') {
            return NextResponse.json({ error: "Value must be true or false" }, { status: 400 });
        }

        rootUser.accounts.forEach((account: any) => {
            account.checked = value;
        });

        await rootUser.save();

        return NextResponse.json({
            message: `All accounts set to ${value}`,
            data: rootUser
        });

    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}// POST Handlers
export async function postFileUploadHandler(req: any, userId: string, token: string) {
    try {
        const { brokerName, fileFormat, accountId, accountName, timeZone, tradeData } = req;

        if (!brokerName || !fileFormat || !accountId || !accountName || !timeZone || !tradeData) {
            return NextResponse.json({ error: "All details are required" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const isUser = await User.findOne({ email: rootUser.email });
        if (!isUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get existing trades
        const existingTrades = await fileUpload.find({
            uniqueId: rootUser.uniqueId,
            accountId: accountId
        });

        // Generate unique trade ID function
        const generateUniqueTradeId = async () => {
            let isUnique = false;
            let tradeId;

            while (!isUnique) {
                tradeId = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

                const existingTrade = await fileUpload.findOne({ tradeId });
                if (!existingTrade) {
                    isUnique = true;
                }
            }
            return tradeId;
        };

        // Format MT4 data if needed
        let processedTradeData = tradeData;
        if (brokerName === "MetaTrader 4") {
            processedTradeData = tradeData.map((item: any) => {
                const [datePart, timePart] = item.OpenTime.split(" ");
                const dateFormatted = datePart.split(".").join("-");

                return {
                    date: dateFormatted,
                    time: timePart,
                    OpenTime: item.OpenTime,
                    Ticket: Number(item.Ticket),
                    Item: item.Item.toUpperCase(),
                    Type: item.Type,
                    Size: Number(item.Size),
                    OpenPrice: Number(item.OpenPrice),
                    StopLoss: Number(item.StopLoss),
                    TakeProfit: Number(item.TakeProfit),
                    CloseTime: item.CloseTime,
                    ClosePrice: Number(item.ClosePrice),
                    Commission: Number(item.Commission),
                    Swap: Number(item.Swap),
                    Profit: Number(item.Profit),
                    strategy: "Select",
                    RiskR: "",
                    Quality: quality,
                    beforeURL: "",
                    afterURL: "",
                    rfe: "Select",
                    btm: "Select",
                    dtm: "Select",
                    atm: "Select",
                    jrData: jrData,
                    accountType: "File Upload"
                };
            });
        }

        // Store trades function
        const storeTrades = async (trades: any[], accountId: string, accountName: string) => {
            try {
                // Flatten all existing trade data for comparison
                const allExistingTradeDetails = existingTrades.flatMap((doc: any) =>
                    doc.tradeData.map((trade: any) => ({
                        OpenTime: trade.OpenTime,
                        Ticket: trade.Ticket,
                        Item: trade.Item,
                        Type: trade.Type,
                        Size: trade.Size,
                        OpenPrice: trade.OpenPrice,
                        Profit: trade.Profit,
                        TakeProfit: trade.TakeProfit,
                        StopLoss: trade.StopLoss,
                        CloseTime: trade.CloseTime,
                        ClosePrice: trade.ClosePrice
                    }))
                );

                // Filter out duplicates from incoming trades
                const uniqueTrades = trades.filter((newTrade: any) => {
                    const isDuplicate = allExistingTradeDetails.some((existingTrade: any) =>
                        existingTrade.OpenTime === newTrade.OpenTime &&
                        existingTrade.Ticket === newTrade.Ticket &&
                        existingTrade.Item === newTrade.Item &&
                        existingTrade.Type === newTrade.Type &&
                        existingTrade.Size === newTrade.Size &&
                        existingTrade.OpenPrice === newTrade.OpenPrice &&
                        existingTrade.Profit === newTrade.Profit &&
                        existingTrade.TakeProfit === newTrade.TakeProfit &&
                        existingTrade.StopLoss === newTrade.StopLoss &&
                        existingTrade.CloseTime === newTrade.CloseTime &&
                        existingTrade.ClosePrice === newTrade.ClosePrice
                    );

                    return !isDuplicate;
                });

                if (uniqueTrades.length === 0) {
                    return {
                        success: true,
                        message: "No new trades to add - all trades already exist",
                        added: 0,
                        skipped: trades.length
                    };
                }

                // Save only unique trades
                const savePromises = uniqueTrades.map(async (trade: any) => {
                    const tradeId = await generateUniqueTradeId();

                    // For MT5, add the additional fields
                    const enhancedTrade = brokerName === "MetaTrader 5" ? {
                        ...trade,
                        id: tradeId,
                        Quality: quality,
                        rfe: "Select",
                        btm: "Select",
                        dtm: "Select",
                        atm: "Select",
                        jrData: jrData,
                        strategy: "Select",
                        RiskR: "",
                        beforeURL: "",
                        afterURL: "",
                        accountType: "File Upload"
                    } : {
                        ...trade,
                        id: tradeId
                    };

                    const newTradeDoc = new fileUpload({
                        uniqueId: rootUser.uniqueId,
                        email: rootUser.email,
                        accountName: accountName,
                        accountId: accountId,
                        tradeId: tradeId,
                        tradeData: [enhancedTrade]
                    });

                    return newTradeDoc.save();
                });

                await Promise.all(savePromises);

                return {
                    success: true,
                    message: "Trades stored successfully",
                    added: uniqueTrades.length,
                    skipped: trades.length - uniqueTrades.length
                };

            } catch (error) {
                console.error("Error storing trades:", error);
                throw error;
            }
        };

        // Process trades for both MT4 and MT5
        const result = await storeTrades(processedTradeData, accountId, accountName);

        return NextResponse.json({
            message: `${brokerName} trades added successfully`,
            result
        });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function postManualUploadHandler(req: any, userId: string, token: string) {
    try {
        const { accountName, accountId, accountType, tradeData } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName || !accountId || !accountType || !tradeData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get existing manual trades for this account
        const existingTrades = await Manual.find({
            uniqueId: rootUser.uniqueId,
            accountId: accountId
        });

        // Generate unique trade ID function
        const generateUniqueTradeId = async () => {
            let isUnique = false;
            let tradeId;

            while (!isUnique) {
                tradeId = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

                const existingTrade = await Manual.findOne({ tradeId });
                if (!existingTrade) {
                    isUnique = true;
                }
            }
            return tradeId;
        };

        // Add required fields to each trade
        const enhancedTradeData = tradeData.map((trade: any) => ({
            ...trade,
            strategy: "Select",
            RiskR: "",
            Quality: quality,
            beforeURL: "",
            afterURL: "",
            rfe: "Select",
            btm: "Select",
            dtm: "Select",
            atm: "Select",
            jrData: jrData,
            accountType: "Manual"
        }));

        // Flatten all existing trade data for comparison
        const allExistingTradeDetails = existingTrades.flatMap((doc: any) =>
            doc.tradeData.map((trade: any) => ({
                OpenTime: trade.OpenTime,
                Ticket: trade.Ticket,
                Item: trade.Item,
                Type: trade.Type,
                Size: trade.Size,
                OpenPrice: trade.OpenPrice,
                Profit: trade.Profit,
                TakeProfit: trade.TakeProfit,
                StopLoss: trade.StopLoss,
                CloseTime: trade.CloseTime,
                ClosePrice: trade.ClosePrice
            }))
        );

        // Filter out duplicates from incoming trades
        const uniqueTrades = enhancedTradeData.filter((newTrade: any) => {
            const isDuplicate = allExistingTradeDetails.some((existingTrade: any) =>
                existingTrade.OpenTime === newTrade.OpenTime &&
                existingTrade.Ticket === newTrade.Ticket &&
                existingTrade.Item === newTrade.Item &&
                existingTrade.Type === newTrade.Type &&
                existingTrade.Size === newTrade.Size &&
                existingTrade.OpenPrice === newTrade.OpenPrice &&
                existingTrade.Profit === newTrade.Profit &&
                existingTrade.TakeProfit === newTrade.TakeProfit &&
                existingTrade.StopLoss === newTrade.StopLoss &&
                existingTrade.CloseTime === newTrade.CloseTime &&
                existingTrade.ClosePrice === newTrade.ClosePrice
            );

            return !isDuplicate;
        });

        if (uniqueTrades.length === 0) {
            return NextResponse.json({
                message: "No new trades to add - all trades already exist",
                added: 0,
                skipped: tradeData.length
            });
        }

        // Save only unique trades
        const savePromises = uniqueTrades.map(async (trade: any) => {
            const tradeId = await generateUniqueTradeId();

            const enhancedTrade = {
                ...trade,
                id: tradeId
            };

            const newTradeDoc = new Manual({
                uniqueId: rootUser.uniqueId,
                email: rootUser.email,
                accountName: accountName,
                accountId: accountId,
                tradeId: tradeId,
                tradeData: [enhancedTrade]
            });

            return newTradeDoc.save();
        });

        await Promise.all(savePromises);

        return NextResponse.json({
            message: "Manual trades uploaded successfully",
            added: uniqueTrades.length,
            skipped: tradeData.length - uniqueTrades.length
        });

    } catch (error) {
        console.error("Manual upload error:", error);
        return NextResponse.json({ error: "Server error processing manual trades" }, { status: 500 });
    }
}

// PUT Handlers
export async function updateAsyncCredentialsHandler(req: any, userId: string, token: string) {
    try {
        const { accountId, accountName, accountType, broker, investorId, investorPw, server, description } = req;

        if (!accountId || !accountName || !accountType || !broker || !investorId || !investorPw || !server) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Find the account in the ASacc collection
        const existingAsAcc = await ASacc.findOne({ uniqueId: rootUser.uniqueId, accountId });

        if (!existingAsAcc) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        // Check if account name already exists for this user (excluding current account)
        const duplicateName = await ASacc.findOne({
            uniqueId: rootUser.uniqueId,
            accountName,
        });

        if (duplicateName && duplicateName.accountId !== accountId) {
            return NextResponse.json({ error: "Account name already taken" }, { status: 400 });
        }

        // Check if any of the sensitive account details changed
        const accountChanged = existingAsAcc.investorId !== investorId || existingAsAcc.investorPw !== investorPw || existingAsAcc.server !== server;

        // If no sensitive data changed, just update the User and ASacc schema with new name/description
        if (!accountChanged) {
            await ASacc.findOneAndUpdate(
                { uniqueId: rootUser.uniqueId, accountId },
                { $set: { accountName, description } },
                { new: true }
            );

            // Update the User schema as well
            await User.findOneAndUpdate(
                { uniqueId: rootUser.uniqueId, "accounts.accountId": accountId },
                { $set: { "accounts.$.accountName": accountName, "accounts.$.description": description } }
            );

            return NextResponse.json({ message: "Account updated successfully (no credential changes)" });
        } else {
            // If account details changed, we need to update both ASacc and AutoSync schemas, and reset trade data

            // Update the ASacc schema
            await ASacc.findOneAndUpdate(
                { uniqueId: rootUser.uniqueId, accountId },
                {
                    $set: {
                        accountName,
                        description,
                        investorId,
                        investorPw,
                        server: server,
                        status: 'yellow',  // Change status to yellow
                        tradeData: []  // Clear existing trade data
                    }
                },
                { new: true }
            );

            // Update the User schema
            await User.findOneAndUpdate(
                { uniqueId: rootUser.uniqueId, "accounts.accountId": accountId },
                {
                    $set: {
                        "accounts.$.accountName": accountName,
                        "accounts.$.description": description,
                        "accounts.$.investorId": investorId,
                        "accounts.$.investorPw": investorPw,
                        "accounts.$.serverName": server,
                        "accounts.$.status": 'yellow' // Update status to yellow
                    }
                });

            // Deleting trades of given accountId 
            await asyncUpload.deleteMany({
                uniqueId: rootUser.uniqueId,
                accountId: accountId
            });

            // If you need to make the external sync request, you can do it here as well
            const sendReq = await fetch("http://auto-sync-backend-env.ap-south-1.elasticbeanstalk.com/tytusersasqwzxerdfcv/verify/syncAcc", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountName, accountId, accountType, uniqueId: rootUser.uniqueId, email: rootUser.email, investorId, password: investorPw, server })
            });

            if (!sendReq.ok) {
                return NextResponse.json({ error: "Failed to sync with external service" }, { status: 500 });
            }

            const sendRes = await sendReq.json();
            console.log("External sync response:", sendRes);

            return NextResponse.json({ message: "Account updated successfully, credentials changed and synced" });
        }

    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Server error updating account" }, { status: 500 });
    }
}

export async function editManualUploadHandler(req:any, userId: string, token: string) {
    try {
        const { accountId, tradeId, updatedTradeData } =  req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountId || !tradeId || !updatedTradeData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find the manual trade document
        const manualTradeDoc = await Manual.findOne({
            uniqueId: rootUser.uniqueId,
            accountId: accountId,
            tradeId: tradeId
        });

        if (!manualTradeDoc) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        // Update the trade data (assuming each document contains exactly one trade)
        manualTradeDoc.tradeData = [{
            ...updatedTradeData,
            id: tradeId, // Ensure ID remains the same
            Quality: manualTradeDoc.tradeData[0]?.Quality || quality,
            rfe: manualTradeDoc.tradeData[0]?.rfe || "Select",
            btm: manualTradeDoc.tradeData[0]?.btm || "Select",
            dtm: manualTradeDoc.tradeData[0]?.dtm || "Select",
            atm: manualTradeDoc.tradeData[0]?.atm || "Select",
            jrData: manualTradeDoc.tradeData[0]?.jrData || jrData,
            strategy: manualTradeDoc.tradeData[0]?.strategy || "Select",
            RiskR: manualTradeDoc.tradeData[0]?.RiskR || "",
            beforeURL: manualTradeDoc.tradeData[0]?.beforeURL || "",
            afterURL: manualTradeDoc.tradeData[0]?.afterURL || ""
        }];

        // Save the updated document
        await manualTradeDoc.save();

        return NextResponse.json({
            message: "Trade data updated successfully",
            tradeId: tradeId,
            accountId: accountId
        });

    } catch (error) {
        console.error("Manual upload edit error:", error);
        return NextResponse.json({ error: "Server error updating trade" }, { status: 500 });
    }
}

// DELETE Handlers
export async function deleteAsyncAccHandler(req: any, userId: string, token: string) {
    try {
        const { accountName } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure request belongs to same user
        if (rootUser.uniqueId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete account from User.accounts[]
        const updatedUser = await User.findOneAndUpdate(
            { _id: rootUser._id },
            { $pull: { accounts: { accountName: accountName } } },
            { new: true }
        );

        // Delete from ASacc (asAccounts.js)
        const deletedASacc = await ASacc.deleteMany({
            uniqueId: userId,
            accountName: accountName
        });

        // Delete from AutoSync (autoSync.js)
        const deletedAutoSync = await asyncUpload.deleteMany({
            uniqueId: userId,
            accountName: accountName
        });

        return NextResponse.json({
            message: "Account deleted successfully from all collections",
            userAccounts: updatedUser.accounts,
            deletedASaccCount: deletedASacc.deletedCount,
            deletedAutoSyncCount: deletedAutoSync.deletedCount
        });

    } catch (error) {
        console.error("Auto Sync Account delete error:", error);
        return NextResponse.json({ error: "Server error deleting account" }, { status: 500 });
    }
}

export async function deleteFileManualHandler(req: any, userId: string, token: string) {
    try {
        const { accountName } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure request belongs to same user
        if (rootUser.uniqueId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete account from User.accounts[]
        const updatedUser = await User.findOneAndUpdate(
            { _id: rootUser._id },
            { $pull: { accounts: { accountName: accountName } } },
            { new: true }
        );

        return NextResponse.json({
            message: "Account deleted successfully from all collections",
            userAccounts: updatedUser.accounts,
        });

    } catch (error) {
        console.error("Auto Sync Account delete error:", error);
        return NextResponse.json({ error: "Server error deleting account" }, { status: 500 });
    }
}

export async function deleteManualUploadHandler(req:any, userId: string, token: string) {
    try {
        const { tradeId } = req;

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!tradeId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find and delete the manual trade document
        const result = await Manual.findOneAndDelete({
            uniqueId: rootUser.uniqueId,
            tradeId: tradeId
        });

        if (!result) {
            const result2 = await fileUpload.findOneAndDelete({
                uniqueId: rootUser.uniqueId,
                tradeId: tradeId
            });

            if (!result2) {
                return NextResponse.json({ error: "Trade not found" }, { status: 404 });
            } else {
                return NextResponse.json({
                    message: "Trade data deleted successfully",
                    tradeId: tradeId,
                });
            }
        } else {
            return NextResponse.json({
                message: "Trade data deleted successfully",
                tradeId: tradeId,
            });
        }

    } catch (error) {
        console.error("Manual upload delete error:", error);
        return NextResponse.json({ error: "Server error deleting trade" }, { status: 500 });
    }
}
export async function updateFileManualCredentialsHandler(req:any, userId: string, token: string) {
    try {
        const { accountId, accountName, accountType, broker, description } = req;

        if (!accountId || !accountName || !accountType || !broker) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        

        // Update User schema
        await User.findOneAndUpdate(
            { uniqueId: rootUser.uniqueId, "accounts.accountId": accountId },
            { $set: { "accounts.$.accountName": accountName, "accounts.$.description": description } }
        );

        return NextResponse.json({ message: "Update file manual credentials functionality to be implemented" });

    } catch (error) {
        console.error("Error updating file upload account:", error);
        return NextResponse.json({ error: "Server error updating account" }, { status: 500 });
    }
}


// GET Handlers
// export async function getAccountDetailsHandler(req: NextRequest, userId: string, token: string) {
//     try {
//         const rootUser = await getUserFromToken(token);
//         if (!rootUser) {
//             return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
//         }

//         const userData = await User.findOne({ uniqueId: userId });
//         if (!userData || userData.email !== rootUser.email) {
//             return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });
//         }

//         const accountIds = userData.accounts.map((acc: any) => acc.accountId);

//         const [fileUploadTrades, manualTrades, autoSyncTrades, asOpenTrades] = await Promise.all([
//             fileUpload.find({ uniqueId: userId, accountId: { $in: accountIds } }),
//             Manual.find({ uniqueId: userId, accountId: { $in: accountIds } }),
//             asyncUpload.find({ uniqueId: userId, accountId: { $in: accountIds } }),
//             OpenAsTrades.find({ uniqueId: userId, accountId: { $in: accountIds } }),
//         ]);

//         const tradesByAccount: { [key: string]: any[] } = {};

//         fileUploadTrades.forEach((tradeDoc: any) => {
//             const accountId = tradeDoc.accountId;
//             if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
//             tradesByAccount[accountId].push(...tradeDoc.tradeData);
//         });

//         manualTrades.forEach((tradeDoc: any) => {
//             const accountId = tradeDoc.accountId;
//             if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
//             tradesByAccount[accountId].push(...tradeDoc.tradeData);
//         });

//         autoSyncTrades.forEach((tradeDoc: any) => {
//             const accountId = tradeDoc.accountId;
//             if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
//             tradesByAccount[accountId].push(...tradeDoc.tradeData);
//         });

//         asOpenTrades.forEach((tradeDoc: any) => {
//             const accountId = tradeDoc.accountId;
//             if (!tradesByAccount[accountId]) tradesByAccount[accountId] = [];
//             tradesByAccount[accountId].push(...tradeDoc.tradeData);
//         });

//         const enhancedAccounts = userData.accounts.map((account: any) => ({
//             ...account.toObject(),
//             tradeData: tradesByAccount[account.accountId] || []
//         }));

//         return NextResponse.json({
//             data: userData,
//             accounts: enhancedAccounts
//         });

//     } catch (error) {
//         console.error("Error:", error);
//         return NextResponse.json({ error: "Server error" }, { status: 500 });
//     }
// }

export async function getUserProfileHandler(req: NextRequest, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const userData = await User.findOne({ uniqueId: userId });
        if (!userData || userData.email !== rootUser.email) {
            return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });
        }

        // Return user profile data (excluding sensitive information)
        const userProfile = {
            uniqueId: userData.uniqueId,
            email: userData.email,
            name: userData.name,
            accounts: userData.accounts,
            createdAt: userData.createdAt
        };

        return NextResponse.json({ data: userProfile });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function getTradeHistoryHandler(req: NextRequest, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const url = new URL(req.url);
        const accountId = url.searchParams.get('accountId');
        
        let query: any = { uniqueId: userId };
        if (accountId) {
            query.accountId = accountId;
        }

        const [fileUploadTrades, manualTrades, autoSyncTrades] = await Promise.all([
            fileUpload.find(query),
            Manual.find(query),
            asyncUpload.find(query)
        ]);

        const allTrades = [
            ...fileUploadTrades.flatMap((doc: any) => doc.tradeData),
            ...manualTrades.flatMap((doc: any) => doc.tradeData),
            ...autoSyncTrades.flatMap((doc: any) => doc.tradeData)
        ];

        return NextResponse.json({ trades: allTrades });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function getDashboardStatsHandler(req: NextRequest, userId: string, token: string) {
    try {
        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        // Get account stats
        const totalAccounts = rootUser.accounts.length;
        const activeAccounts = rootUser.accounts.filter((acc: any) => acc.checked).length;
        
        // Get trade stats (you can customize this based on your needs)
        const totalTrades = await getTotalTradesCount(userId);
        
        const stats = {
            totalAccounts,
            activeAccounts,
            totalTrades,
            syncStatus: 'active' // You can calculate this based on your logic
        };

        return NextResponse.json({ stats });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Helper function for trade count
async function getTotalTradesCount(userId: string) {
    const [fileCount, manualCount, autoCount] = await Promise.all([
        fileUpload.countDocuments({ uniqueId: userId }),
        Manual.countDocuments({ uniqueId: userId }),
        asyncUpload.countDocuments({ uniqueId: userId })
    ]);
    
    return fileCount + manualCount + autoCount;
}