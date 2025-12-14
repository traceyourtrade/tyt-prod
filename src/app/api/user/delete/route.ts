import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserModel } from "@/models/main/user.model";
import { getStrategyModel } from "@/models/main/strategy.model";
import { getNoteModel } from "@/models/main/notes.model";
import { getPlaybookModel } from "@/models/main/playbook.model";
import JournalTemplate from "@/models/main/journalTemplate.model";
import { getSharedTradeModel } from "@/models/main/sharedTrade.model";
import { getLeaderboardEntryModel, getLeaderboardSettingsModel } from "@/models/main/leaderboard.model";
import { getManualModel } from "@/models/accounts/manual.model";
import { getAutoSyncModel } from "@/models/accounts/autoSync.model";
import { getOpenTradeModel } from "@/models/accounts/openTrades.model";
import { getASAccountModel } from "@/models/accounts/asAccounts.model";
import { getFileUploadModel } from "@/models/accounts/fileUploadSchema.model";

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const uniqueId = user.uniqueId;
    const userMongoId = user._id;

    const [
      User,
      Strategy,
      Notes,
      Playbook,
      SharedTrade,
      LeaderboardEntry,
      LeaderboardSettings,
      ManualAccount,
      AutoSyncAccount,
      OpenTrades,
      AsAccounts,
      FileUpload,
    ] = await Promise.all([
      getUserModel(),
      getStrategyModel(),
      getNoteModel(),
      getPlaybookModel(),
      getSharedTradeModel(),
      getLeaderboardEntryModel(),
      getLeaderboardSettingsModel(),
      getManualModel(),
      getAutoSyncModel(),
      getOpenTradeModel(),
      getASAccountModel(),
      getFileUploadModel(),
    ]);

    await Promise.all([
      User.findByIdAndDelete(userMongoId),
      Strategy.deleteMany({ uniqueId }),
      Notes.deleteMany({ uniqueId }),
      Playbook.deleteMany({ uniqueId }),
      JournalTemplate.deleteMany({ uniqueId }),
      SharedTrade.deleteMany({ uniqueId }),
      LeaderboardEntry.deleteMany({ uniqueId }),
      LeaderboardSettings.deleteMany({ uniqueId }),
    ]);

    await Promise.all([
      ManualAccount.deleteMany({ uniqueId }),
      AutoSyncAccount.deleteMany({ uniqueId }),
      OpenTrades.deleteMany({ uniqueId }),
      AsAccounts.deleteMany({ uniqueId }),
      FileUpload.deleteMany({ uniqueId }),
    ]);

    const response = NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );

    response.cookies.delete("authToken");
    response.cookies.delete("userId");

    return response;
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
