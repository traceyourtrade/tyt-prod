import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBacktestSessionsModel } from "@/models/backtest/backtestSessions.model";
import { getUserModel } from "@/models/main/user.model";

async function getUserFromToken(token: string) {
  const User = await getUserModel();
  return await User.findOne({ "tokens.token": token });
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const layoutId = searchParams.get('layoutId');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel() as any;
    const session = await BacktestSession.findOne({
      uniqueId: userId,
      sessionId: parseInt(sessionId)
    }).lean();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const typedSession = session as any;

    // Check for lineTools request (TradingView's loadLineToolsAndGroups)
    const lineToolsLayoutId = searchParams.get('lineToolsLayoutId');
    const lineToolsChartId = searchParams.get('lineToolsChartId');
    
    if (lineToolsLayoutId && lineToolsChartId) {
      const key = `${lineToolsLayoutId}_${lineToolsChartId}`;
      const stateJson = typedSession.lineToolsState?.[key];
      
      if (!stateJson) {
        return NextResponse.json({ success: true, data: null });
      }
      
      try {
        const state = JSON.parse(stateJson);
        return NextResponse.json({ success: true, data: state });
      } catch (e) {
        console.error('Failed to parse lineTools state:', e);
        return NextResponse.json({ success: true, data: null });
      }
    }

    if (layoutId) {
      const layout = typedSession.chartLayouts?.find((l: any) => l.id === layoutId);
      if (!layout) {
        return NextResponse.json({ error: "Layout not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: layout });
    }

    return NextResponse.json({
      success: true,
      data: {
        chartLayouts: typedSession.chartLayouts || [],
        studyTemplates: typedSession.studyTemplates || {},
        drawingTemplates: typedSession.drawingTemplates || {},
        lineToolsState: typedSession.lineToolsState || {}
      }
    });

  } catch (error) {
    console.error("Get chart layout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, type, ...data } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel() as any;

    if (type === 'chart') {
      const { id, name, symbol, resolution, content } = data;
      
      if (!id || !name || !content) {
        return NextResponse.json({ error: "Chart ID, name, and content are required" }, { status: 400 });
      }

      const newLayout = {
        id,
        name,
        symbol: symbol || '',
        resolution: resolution || '',
        content,
        timestamp: Date.now()
      };

      const existingSession = await BacktestSession.findOne({
        uniqueId: userId,
        sessionId: parseInt(sessionId),
        'chartLayouts.id': id
      }).lean();

      if (existingSession) {
        await BacktestSession.updateOne(
          { uniqueId: userId, sessionId: parseInt(sessionId), 'chartLayouts.id': id },
          { $set: { 'chartLayouts.$': newLayout } }
        );
      } else {
        await BacktestSession.updateOne(
          { uniqueId: userId, sessionId: parseInt(sessionId) },
          { $push: { chartLayouts: newLayout } }
        );
      }

      return NextResponse.json({ success: true, data: { id } });

    } else if (type === 'studyTemplate') {
      const { name, content } = data;
      
      if (!name || !content) {
        return NextResponse.json({ error: "Template name and content are required" }, { status: 400 });
      }

      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $set: { [`studyTemplates.${name}`]: content } }
      );

      return NextResponse.json({ success: true });

    } else if (type === 'drawingTemplate') {
      const { name, content } = data;
      
      if (!name || !content) {
        return NextResponse.json({ error: "Template name and content are required" }, { status: 400 });
      }

      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $set: { [`drawingTemplates.${name}`]: content } }
      );

      return NextResponse.json({ success: true });

    } else if (type === 'lineTools') {
      // TradingView's save_load_adapter saveLineToolsAndGroups
      // Stores native TradingView drawing state per layoutId/chartId
      const { layoutId, chartId, state } = data;
      
      if (!layoutId || !chartId) {
        return NextResponse.json({ error: "Layout ID and Chart ID are required" }, { status: 400 });
      }

      const key = `${layoutId}_${chartId}`;
      
      // state.sources is a Map in TradingView, but we receive it as an array of [key, value] pairs
      // We store the serialized state directly
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $set: { [`lineToolsState.${key}`]: JSON.stringify(state) } }
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Save chart layout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Reset/clear chart layouts (for fixing corrupted data)
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel() as any;

    if (action === 'resetChartLayouts') {
      // Clear all chart layouts for this session
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $set: { chartLayouts: [], studyTemplates: {}, drawingTemplates: {} } }
      );
      console.log(`Reset chart layouts for session ${sessionId} (user ${userId})`);
      return NextResponse.json({ success: true, message: "Chart layouts reset successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Reset chart layout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!token || !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const layoutId = searchParams.get('layoutId');
    const type = searchParams.get('type');
    const name = searchParams.get('name');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const BacktestSession = await getBacktestSessionsModel() as any;

    if (type === 'chart' && layoutId) {
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $pull: { chartLayouts: { id: layoutId } } }
      );
      return NextResponse.json({ success: true });

    } else if (type === 'studyTemplate' && name) {
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $unset: { [`studyTemplates.${name}`]: "" } }
      );
      return NextResponse.json({ success: true });

    } else if (type === 'drawingTemplate' && name) {
      await BacktestSession.updateOne(
        { uniqueId: userId, sessionId: parseInt(sessionId) },
        { $unset: { [`drawingTemplates.${name}`]: "" } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid delete parameters" }, { status: 400 });

  } catch (error) {
    console.error("Delete chart layout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
