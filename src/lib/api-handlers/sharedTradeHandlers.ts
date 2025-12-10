import { NextRequest, NextResponse } from 'next/server';
import { getSharedTradeModel, ISharedTrade } from '@/models/main/sharedTrade.model';
import { getManualModel } from '@/models/accounts/manual.model';
import { getUserModel } from '@/models/main/user.model';
import { v4 as uuidv4 } from 'uuid';

export async function createShareLinkHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const body = await req.json();
    const { tradeId, accountId, isPublic, allowedEmails, hideAccountSize, hideDollarAmounts, expiresInDays } = body;

    if (!tradeId || !accountId) {
      return NextResponse.json({ error: "Trade ID and Account ID are required" }, { status: 400 });
    }

    const SharedTrade = await getSharedTradeModel();

    const existingShare = await SharedTrade.findOne({ uniqueId: userId, tradeId });
    if (existingShare) {
      return NextResponse.json({ 
        shareToken: existingShare.shareToken,
        shareUrl: `/shared/${existingShare.shareToken}`,
        message: "Existing share link found"
      });
    }

    const shareToken = uuidv4();
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const newShare = new SharedTrade({
      uniqueId: userId,
      tradeId,
      accountId,
      shareToken,
      isPublic: isPublic !== false,
      allowedEmails: allowedEmails || [],
      hideAccountSize: hideAccountSize || false,
      hideDollarAmounts: hideDollarAmounts || false,
      expiresAt,
      viewCount: 0,
      comments: []
    });

    await newShare.save();

    return NextResponse.json({
      shareToken,
      shareUrl: `/shared/${shareToken}`,
      message: "Share link created successfully"
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function getSharedTradeHandler(
  req: NextRequest,
  viewerEmail?: string
) {
  try {
    const url = new URL(req.url);
    const shareToken = url.searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const SharedTrade = await getSharedTradeModel();
    const sharedTrade = await SharedTrade.findOne({ shareToken });

    if (!sharedTrade) {
      return NextResponse.json({ error: "Shared trade not found" }, { status: 404 });
    }

    if (sharedTrade.expiresAt && new Date() > sharedTrade.expiresAt) {
      return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
    }

    if (!sharedTrade.isPublic && sharedTrade.allowedEmails.length > 0) {
      if (!viewerEmail || !sharedTrade.allowedEmails.includes(viewerEmail.toLowerCase())) {
        return NextResponse.json({ 
          error: "This trade is private. You don't have permission to view it.",
          isPrivate: true 
        }, { status: 403 });
      }
    }

    await SharedTrade.updateOne({ shareToken }, { $inc: { viewCount: 1 } });

    const Manual = await getManualModel();
    const tradeDoc = await Manual.findOne({ tradeId: sharedTrade.tradeId });

    if (!tradeDoc) {
      return NextResponse.json({ error: "Trade data not found" }, { status: 404 });
    }

    const User = await getUserModel();
    const user = await User.findOne({ uniqueId: sharedTrade.uniqueId });

    const tradeData = tradeDoc.tradeData[0] || {};
    
    const sanitizedTrade = {
      ...tradeData,
      pnl: sharedTrade.hideDollarAmounts ? null : tradeData.pnl,
      accountBalance: sharedTrade.hideAccountSize ? null : tradeData.accountBalance,
    };

    return NextResponse.json({
      trade: sanitizedTrade,
      owner: {
        displayName: user?.fullName || "Anonymous Trader",
        profilePicture: user?.profilePicture || null
      },
      comments: sharedTrade.comments,
      viewCount: sharedTrade.viewCount + 1,
      hideAccountSize: sharedTrade.hideAccountSize,
      hideDollarAmounts: sharedTrade.hideDollarAmounts,
      isPublic: sharedTrade.isPublic
    });
  } catch (error) {
    console.error("Error fetching shared trade:", error);
    return NextResponse.json({ error: "Failed to fetch shared trade" }, { status: 500 });
  }
}

export async function getUserSharedTradesHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const SharedTrade = await getSharedTradeModel();
    const sharedTrades = await SharedTrade.find({ uniqueId: userId }).sort({ createdAt: -1 });

    return NextResponse.json({ sharedTrades });
  } catch (error) {
    console.error("Error fetching user shared trades:", error);
    return NextResponse.json({ error: "Failed to fetch shared trades" }, { status: 500 });
  }
}

export async function deleteShareLinkHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const body = await req.json();
    const { shareToken } = body;

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const SharedTrade = await getSharedTradeModel();
    const result = await SharedTrade.deleteOne({ shareToken, uniqueId: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Share link not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Share link deleted successfully" });
  } catch (error) {
    console.error("Error deleting share link:", error);
    return NextResponse.json({ error: "Failed to delete share link" }, { status: 500 });
  }
}

export async function addCommentHandler(
  req: NextRequest
) {
  try {
    const body = await req.json();
    const { shareToken, authorName, authorEmail, content } = body;

    if (!shareToken || !authorName || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (authorName.trim().length < 2 || authorName.trim().length > 50) {
      return NextResponse.json({ error: "Name must be between 2-50 characters" }, { status: 400 });
    }

    if (content.trim().length < 1 || content.trim().length > 1000) {
      return NextResponse.json({ error: "Comment must be between 1-1000 characters" }, { status: 400 });
    }

    const SharedTrade = await getSharedTradeModel();
    const sharedTrade = await SharedTrade.findOne({ shareToken });

    if (!sharedTrade) {
      return NextResponse.json({ error: "Shared trade not found" }, { status: 404 });
    }

    if (sharedTrade.expiresAt && new Date() > sharedTrade.expiresAt) {
      return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
    }

    const newComment = {
      commentId: uuidv4(),
      authorName: authorName.trim(),
      authorEmail: authorEmail?.trim() || "",
      content: content.trim(),
      createdAt: new Date()
    };

    await SharedTrade.updateOne(
      { shareToken },
      { $push: { comments: newComment } }
    );

    return NextResponse.json({ comment: newComment, message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

export async function updateShareSettingsHandler(
  req: NextRequest,
  userId: string,
  token: string
) {
  try {
    const body = await req.json();
    const { shareToken, isPublic, allowedEmails, hideAccountSize, hideDollarAmounts } = body;

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const SharedTrade = await getSharedTradeModel();
    const updateFields: any = {};
    
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (allowedEmails !== undefined) updateFields.allowedEmails = allowedEmails;
    if (hideAccountSize !== undefined) updateFields.hideAccountSize = hideAccountSize;
    if (hideDollarAmounts !== undefined) updateFields.hideDollarAmounts = hideDollarAmounts;

    const result = await SharedTrade.updateOne(
      { shareToken, uniqueId: userId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Share link not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Share settings updated successfully" });
  } catch (error) {
    console.error("Error updating share settings:", error);
    return NextResponse.json({ error: "Failed to update share settings" }, { status: 500 });
  }
}
