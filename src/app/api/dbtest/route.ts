import { NextResponse } from "next/server";
import { connectMainDB } from "@/lib/db/connect";
import { connectAccountsDB } from "@/lib/db/connect";

export async function GET() {

    try {
        const conn = await connectMainDB();
        const readyState = conn.readyState; // 1 = connected, 2 = connecting, 0 = disconnected

        const conn2 = await connectAccountsDB();
        const readyState2 = conn2.readyState;

        return NextResponse.json([{
            message: "DB1 connection check",
            readyState,
            status:
                readyState === 1
                    ? "✅ Connected"
                    : readyState === 2
                        ? "🟡 Connecting"
                        : "❌ Disconnected",
        },
        {
            message: "DB2 connection check",
            readyState2,
            status:
                readyState2 === 1
                    ? "✅ Connected"
                    : readyState2 === 2
                        ? "🟡 Connecting"
                        : "❌ Disconnected",
        },
        ]);
    } catch (err) {
        console.error("DB check failed:", err);
        return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
    }

}
