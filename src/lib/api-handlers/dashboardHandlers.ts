import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getUserModel } from '@/models/main/user.model';
import { getAutoSyncModel } from '@/models/accounts/autoSync.model';
import { getFileUploadModel } from '@/models/accounts/fileUploadSchema.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getASAccountModel } from '@/models/accounts/asAccounts.model';
import { getOpenTradeModel } from '@/models/accounts/openTrades.model';

// Import your models (adjust paths as needed)
const User = await getUserModel();
const ASacc = await getASAccountModel();
const fileUpload = await getFileUploadModel();
const Manual = await getManualModel();
const asyncUpload = await getAutoSyncModel();
const OpenAsTrades = await getOpenTradeModel()

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
export async function createAccountHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName, accountBalance, accountType, broker, description } = await req.json();

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

export async function createAutoSyncAccountHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName, accountType, broker, investorId, password, serverName, description } = await req.json();

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

export async function pollAutoSyncAccountHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName, uniqueId } = await req.json();

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
            accounts: enhancedAccounts
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

export async function checkAllHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { value } = await req.json();

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
}

export async function postFileUploadHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { brokerName, fileFormat, accountId, accountName, timeZone, tradeData } = await req.json();

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

        // Add your file upload logic here
        return NextResponse.json({ message: "File upload functionality to be implemented" });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function postManualUploadHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName, accountId, accountType, tradeData } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName || !accountId || !accountType || !tradeData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Add your manual upload logic here
        return NextResponse.json({ message: "Manual upload functionality to be implemented" });

    } catch (error) {
        console.error("Manual upload error:", error);
        return NextResponse.json({ error: "Server error processing manual trades" }, { status: 500 });
    }
}

// PUT Handlers
export async function updateAsyncCredentialsHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountId, accountName, accountType, broker, investorId, investorPw, server, description } = await req.json();

        if (!accountId || !accountName || !accountType || !broker || !investorId || !investorPw || !server) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Add your update async credentials logic here
        return NextResponse.json({ message: "Update async credentials functionality to be implemented" });

    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Server error updating account" }, { status: 500 });
    }
}

export async function updateFileManualCredentialsHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountId, accountName, accountType, broker, description } = await req.json();

        if (!accountId || !accountName || !accountType || !broker) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        // Add your update file manual credentials logic here
        return NextResponse.json({ message: "Update file manual credentials functionality to be implemented" });

    } catch (error) {
        console.error("Error updating file upload account:", error);
        return NextResponse.json({ error: "Server error updating account" }, { status: 500 });
    }
}

export async function editManualUploadHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountId, tradeId, updatedTradeData } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountId || !tradeId || !updatedTradeData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Add your edit manual upload logic here
        return NextResponse.json({ message: "Edit manual upload functionality to be implemented" });

    } catch (error) {
        console.error("Manual upload edit error:", error);
        return NextResponse.json({ error: "Server error updating trade" }, { status: 500 });
    }
}

// DELETE Handlers
export async function deleteAsyncAccHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Add your delete async account logic here
        return NextResponse.json({ message: "Delete async account functionality to be implemented" });

    } catch (error) {
        console.error("Auto Sync Account delete error:", error);
        return NextResponse.json({ error: "Server error deleting account" }, { status: 500 });
    }
}

export async function deleteFileManualHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { accountName } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!accountName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Add your delete file manual logic here
        return NextResponse.json({ message: "Delete file manual functionality to be implemented" });

    } catch (error) {
        console.error("Auto Sync Account delete error:", error);
        return NextResponse.json({ error: "Server error deleting account" }, { status: 500 });
    }
}

export async function deleteManualUploadHandler(req: NextRequest, userId: string, token: string) {
    try {
        const { tradeId } = await req.json();

        const rootUser = await getUserFromToken(token);
        if (!rootUser) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        if (!tradeId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Add your delete manual upload logic here
        return NextResponse.json({ message: "Delete manual upload functionality to be implemented" });

    } catch (error) {
        console.error("Manual upload delete error:", error);
        return NextResponse.json({ error: "Server error deleting trade" }, { status: 500 });
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