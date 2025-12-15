// app/api/testing/handlers/testingHandlers.ts
import { NextResponse } from 'next/server';
import { getBacktestSessionsModel } from '@/models/backtest/backtestSessions.model';
import { getUserModel } from '@/models/main/user.model';
import { connectAccountsDB } from '../db/connect';

// Helper function to get user from token
export async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

// GET Backtest Sessions
export async function getBacktestSessions(userId: string, sessionId?: number) {
  try {
    const BacktestSession = await getBacktestSessionsModel();
    
    if (sessionId) {
      const session = await BacktestSession.findOne({
        uniqueId: userId,
        sessionId
      });

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: session });
    } else {
      const sessions = await BacktestSession.find({ uniqueId: userId })
        .sort({ sessionId: 1 })
        .lean();

      return NextResponse.json({ success: true, data: sessions });
    }

  } catch (error) {
    console.error("Get backtest sessions error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// CREATE Backtest Session
// app/api/testing/handlers/testingHandlers.ts - Update createBacktestSession
export async function createBacktestSession(userId: string, body: any) {
  try {
    console.log("Creating backtest session for user:", userId);
    console.log("Session data:", body);
    
    const { sessionInfo } = body;

    if (!sessionInfo) {
      return NextResponse.json({ 
        error: "Session info is required", 
        success: false 
      }, { status: 400 });
    }

    // Ensure database is connected
    await connectAccountsDB();
    
    const BacktestSession = await getBacktestSessionsModel();
    
    console.log("Backtest model obtained:", BacktestSession?.modelName);
    
    // Check if session already exists
    const existingSession = await BacktestSession.findOne({
      uniqueId: userId,
      sessionId: sessionInfo.id
    });

    if (existingSession) {
      return NextResponse.json({ 
        error: "Session already exists", 
        success: false 
      }, { status: 400 });
    }

    // Create new session
    const newSession = new BacktestSession({
      uniqueId: userId,
      sessionId: sessionInfo.id,
      sessionInfo: {
        name: sessionInfo.name,
        symbol: sessionInfo.symbol,
        currentBalance: sessionInfo.currentBalance,
        startDate: sessionInfo.startDate,
        endDate: sessionInfo.endDate,
        daysRemaining: sessionInfo.daysRemaining,
        totalPnl: sessionInfo.totalPnl,
        winRate: sessionInfo.winRate,
        riskReward: sessionInfo.riskReward,
        monthGainLoss: sessionInfo.monthGainLoss,
        weekGainLoss: sessionInfo.weekGainLoss,
        dailyGainLoss: sessionInfo.dailyGainLoss
      }
    });

    console.log("Attempting to save session...");
    const savedSession = await newSession.save();
    console.log("Session saved successfully:", savedSession._id);

    return NextResponse.json({
      success: true,
      message: "Backtest session created successfully",
      data: savedSession
    });

  } catch (error: any) {
    console.error("Create backtest session error:", error);
    console.error("Error stack:", error.stack);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Session already exists", 
        success: false 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error.message || "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// UPDATE Backtest Session
export async function updateBacktestSession(userId: string, body: any) {
  try {
    const { sessionId, sessionInfo } = body;

    if (!sessionId || !sessionInfo) {
      return NextResponse.json({ 
        error: "Session ID and session info are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();
    console.log("BAcktest",BacktestSession)
const dbConnection = BacktestSession.db;
    console.log("Database connection state:", dbConnection.readyState);
    
    if (dbConnection.readyState !== 1) {
      return NextResponse.json({ 
        error: "Database connection not ready", 
        success: false 
      }, { status: 500 });
    }
    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $set: { sessionInfo } },
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Backtest session updated successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Update backtest session error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// UPDATE Filters
export async function updateFilters(userId: string, body: any) {
  try {
    const { sessionId, filters } = body;

    if (!sessionId || !filters) {
      return NextResponse.json({ 
        error: "Session ID and filters are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    // Ensure filters has the correct structure
    const updateData: any = {};
    if (filters.type !== undefined) updateData['filters.type'] = filters.type;
    if (filters.assets !== undefined) updateData['filters.assets'] = filters.assets;
    if (filters.side !== undefined) updateData['filters.side'] = filters.side;
    if (filters.tags !== undefined) updateData['filters.tags'] = filters.tags;
    if (filters.session !== undefined) updateData['filters.session'] = filters.session;
    if (filters.strategy !== undefined) updateData['filters.strategy'] = filters.strategy;
    if (filters.day !== undefined) updateData['filters.day'] = filters.day;
    if (filters.time !== undefined) updateData['filters.time'] = filters.time;
    if (filters.timezone !== undefined) updateData['filters.timezone'] = filters.timezone;
    if (filters.backtestingDate !== undefined) updateData['filters.backtestingDate'] = filters.backtestingDate;

    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Filters updated successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Update filters error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// UPDATE Applied Filters
export async function updateAppliedFilters(userId: string, body: any) {
  try {
    const { sessionId, appliedFilters } = body;

    if (!sessionId || !Array.isArray(appliedFilters)) {
      return NextResponse.json({ 
        error: "Session ID and applied filters array are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $set: { appliedFilters } },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Applied filters updated successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Update applied filters error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// ADD Trade
export async function addTrade(userId: string, body: any) {
  try {
    const { sessionId, trade } = body;

    if (!sessionId || !trade) {
      return NextResponse.json({ 
        error: "Session ID and trade data are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();
    const session = await BacktestSession.findOne({ 
      uniqueId: userId, 
      sessionId 
    });

    if (!session) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    const maxTradeId = session.trades.length > 0 
      ? Math.max(...session.trades.map((t: any) => t.id))
      : 0;

    const newTrade = {
      ...trade,
      id: maxTradeId + 1
    };

    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $push: { trades: newTrade } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Trade added successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Add trade error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// UPDATE Trade
export async function updateTrade(userId: string, body: any) {
  try {
    const { sessionId, tradeId, tradeUpdates } = body;

    if (!sessionId || !tradeId || !tradeUpdates) {
      return NextResponse.json({ 
        error: "Session ID, trade ID, and trade updates are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const updatedSession = await BacktestSession.findOneAndUpdate(
      {
        uniqueId: userId,
        sessionId,
        "trades.id": tradeId
      },
      {
        $set: {
          "trades.$.name": tradeUpdates.name,
          "trades.$.date": tradeUpdates.date,
          "trades.$.symbol": tradeUpdates.symbol,
          "trades.$.position": tradeUpdates.position,
          "trades.$.roi": tradeUpdates.roi,
          "trades.$.entryPrice": tradeUpdates.entryPrice,
          "trades.$.stopPrice": tradeUpdates.stopPrice,
          "trades.$.maxRR": tradeUpdates.maxRR,
          "trades.$.status": tradeUpdates.status
        }
      },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session or trade not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Trade updated successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Update trade error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// DELETE Trade
export async function deleteTrade(userId: string, body: any) {
  try {
    const { sessionId, tradeId } = body;

    if (!sessionId || !tradeId) {
      return NextResponse.json({ 
        error: "Session ID and trade ID are required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $pull: { trades: { id: tradeId } } },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Trade deleted successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Delete trade error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// UPDATE UI Settings
export async function updateUISettings(userId: string, body: any) {
  try {
    const { sessionId, activeTab, rowsPerPage, currentPage } = body;

    if (!sessionId) {
      return NextResponse.json({ 
        error: "Session ID is required", 
        success: false 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (activeTab !== undefined) updateData.activeTab = activeTab;
    if (rowsPerPage !== undefined) updateData.rowsPerPage = rowsPerPage;
    if (currentPage !== undefined) updateData.currentPage = currentPage;

    const BacktestSession = await getBacktestSessionsModel();

    const updatedSession = await BacktestSession.findOneAndUpdate(
      { uniqueId: userId, sessionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "UI settings updated successfully",
      data: updatedSession
    });

  } catch (error) {
    console.error("Update UI settings error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}

// DELETE Backtest Session
export async function deleteBacktestSession(userId: string, sessionId: number) {
  try {
    if (!sessionId) {
      return NextResponse.json({ 
        error: "Session ID is required", 
        success: false 
      }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel();

    const deletedSession = await BacktestSession.findOneAndDelete({
      uniqueId: userId,
      sessionId
    });

    if (!deletedSession) {
      return NextResponse.json({ 
        error: "Session not found", 
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Backtest session deleted successfully"
    });

  } catch (error) {
    console.error("Delete backtest session error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 });
  }
}