/**
 * DrawingPersistenceManager - Centralized manager for TradingView chart drawings
 * 
 * IMPORTANT: TradingView's shape API operates in UNIX SECONDS, not milliseconds.
 * - getPoints() returns timestamps in seconds
 * - createMultipointShape() expects timestamps in seconds
 * - Our bar data uses milliseconds internally, but this is handled by the datafeed
 * 
 * This manager ensures all drawing operations use consistent timestamp formats.
 */

export interface DrawingPoint {
  time: number;  // UNIX timestamp in SECONDS
  price: number;
}

export interface SavedDrawing {
  id?: string;
  name: string;
  toolname?: string;  // Internal tool identifier (e.g., "trend_line")
  points: DrawingPoint[];
  overrides: Record<string, any>;
  lock: boolean;
}

export interface DrawingPayload {
  drawings: SavedDrawing[];
  studies: any[];
  interval?: string;
  timestamp?: number;
  favoriteDrawingTools?: string[];
  chartProperties?: any;
  schemaVersion: number;
}

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Maps TradingView display names to internal tool identifiers
 * Display names are localized and vary, internal names are consistent
 */
const SHAPE_NAME_TO_TOOL: Record<string, string> = {
  // Lines
  "Trend Line": "trend_line",
  "trend_line": "trend_line",
  "Horizontal Line": "horizontal_line",
  "horizontal_line": "horizontal_line",
  "Vertical Line": "vertical_line",
  "vertical_line": "vertical_line",
  "Ray": "ray",
  "ray": "ray",
  "Arrow": "arrow",
  "arrow": "arrow",
  "Extended Line": "extended",
  "extended": "extended",
  "Info Line": "info_line",
  "info_line": "info_line",
  "Trend Angle": "trend_angle",
  "trend_angle": "trend_angle",
  "Horizontal Ray": "horizontal_ray",
  "horizontal_ray": "horizontal_ray",
  "Cross Line": "cross_line",
  "cross_line": "cross_line",
  
  // Channels
  "Parallel Channel": "parallel_channel",
  "parallel_channel": "parallel_channel",
  "Disjoint Angle": "disjoint_angle",
  "disjoint_angle": "disjoint_angle",
  "Flat Bottom": "flat_bottom",
  "flat_bottom": "flat_bottom",
  
  // Fibonacci
  "Fib Retracement": "fib_retracement",
  "fib_retracement": "fib_retracement",
  "Fib Extension": "fib_trend_ext",
  "fib_trend_ext": "fib_trend_ext",
  "Fib Channel": "fib_channel",
  "fib_channel": "fib_channel",
  "Fib Circles": "fib_circles",
  "fib_circles": "fib_circles",
  "Fib Speed/Resistance Fan": "fib_speed_resist_fan",
  "fib_speed_resist_fan": "fib_speed_resist_fan",
  "Fib Timezone": "fib_timezone",
  "fib_timezone": "fib_timezone",
  "Fib Trend Time": "fib_trend_time",
  "fib_trend_time": "fib_trend_time",
  "Fib Spiral": "fib_spiral",
  "fib_spiral": "fib_spiral",
  "Fib Speed Resistance Arcs": "fib_speed_resist_arcs",
  "fib_speed_resist_arcs": "fib_speed_resist_arcs",
  
  // Patterns
  "XABCD Pattern": "xabcd_pattern",
  "xabcd_pattern": "xabcd_pattern",
  "Cypher Pattern": "cypher_pattern",
  "cypher_pattern": "cypher_pattern",
  "ABCD Pattern": "abcd_pattern",
  "abcd_pattern": "abcd_pattern",
  
  // Pitchfork
  "Pitchfork": "pitchfork",
  "pitchfork": "pitchfork",
  "Schiff Pitchfork": "schiff_pitchfork",
  "schiff_pitchfork": "schiff_pitchfork",
  "Modified Schiff Pitchfork": "schiff_pitchfork_modified",
  "schiff_pitchfork_modified": "schiff_pitchfork_modified",
  "Inside Pitchfork": "inside_pitchfork",
  "inside_pitchfork": "inside_pitchfork",
  "Pitchfan": "pitchfan",
  "pitchfan": "pitchfan",
  
  // Gann
  "Gann Box": "gannbox",
  "gannbox": "gannbox",
  "Gann Square": "gannbox_square",
  "gannbox_square": "gannbox_square",
  "Gann Fixed": "gannbox_fixed",
  "gannbox_fixed": "gannbox_fixed",
  "Gann Fan": "gannbox_fan",
  "gannbox_fan": "gannbox_fan",
  
  // Shapes
  "Rectangle": "rectangle",
  "rectangle": "rectangle",
  "Circle": "circle",
  "circle": "circle",
  "Ellipse": "ellipse",
  "ellipse": "ellipse",
  "Triangle": "triangle",
  "triangle": "triangle",
  "Polyline": "polyline",
  "polyline": "polyline",
  "Curve": "curve",
  "curve": "curve",
  "Double Curve": "double_curve",
  "double_curve": "double_curve",
  "Arc": "arc",
  "arc": "arc",
  "Path": "path",
  "path": "path",
  
  // Text and Notes
  "Text": "text",
  "text": "text",
  "Anchored Text": "anchored_text",
  "anchored_text": "anchored_text",
  "Note": "note",
  "note": "note",
  "Anchored Note": "anchored_note",
  "anchored_note": "anchored_note",
  "Callout": "callout",
  "callout": "callout",
  "Balloon": "balloon",
  "balloon": "balloon",
  "Comment": "comment",
  "comment": "comment",
  "Price Label": "price_label",
  "price_label": "price_label",
  "Price Note": "price_note",
  "price_note": "price_note",
  "Signpost": "signpost",
  "signpost": "signpost",
  "Flag": "flag",
  "flag": "flag",
  "Text Note": "text_note",
  "text_note": "text_note",
  
  // Arrows and Markers
  "Arrow Up": "arrow_up",
  "arrow_up": "arrow_up",
  "Arrow Down": "arrow_down",
  "arrow_down": "arrow_down",
  "Arrow Left": "arrow_left",
  "arrow_left": "arrow_left",
  "Arrow Right": "arrow_right",
  "arrow_right": "arrow_right",
  "Arrow Marker": "arrow_marker",
  "arrow_marker": "arrow_marker",
  
  // Icons
  "Icon": "icon",
  "icon": "icon",
  "Emoji": "emoji",
  "emoji": "emoji",
  "Sticker": "sticker",
  "sticker": "sticker",
  
  // Other
  "Anchored VWAP": "anchored_vwap",
  "anchored_vwap": "anchored_vwap",
  "Table": "table",
  "table": "table",
};

/**
 * Maps TradingView internal class names (e.g., LineToolTrendLine) to short tool names (e.g., trend_line)
 * These are the names returned by shape._source.toolname
 */
const INTERNAL_CLASS_TO_TOOL: Record<string, string> = {
  // Lines
  "LineToolTrendLine": "trend_line",
  "LineToolHorzLine": "horizontal_line",
  "LineToolVertLine": "vertical_line",
  "LineToolRay": "ray",
  "LineToolArrow": "arrow",
  "LineToolExtended": "extended",
  "LineToolInfoLine": "info_line",
  "LineToolTrendAngle": "trend_angle",
  "LineToolHorzRay": "horizontal_ray",
  "LineToolCrossLine": "cross_line",
  
  // Channels
  "LineToolParallelChannel": "parallel_channel",
  "LineToolDisjointAngle": "disjoint_angle",
  "LineToolFlatBottom": "flat_bottom",
  
  // Fibonacci
  "LineToolFibRetracement": "fib_retracement",
  "LineToolFibTrendExt": "fib_trend_ext",
  "LineToolFibChannel": "fib_channel",
  "LineToolFibCircles": "fib_circles",
  "LineToolFibSpeedResistFan": "fib_speed_resist_fan",
  "LineToolFibTimezone": "fib_timezone",
  "LineToolFibTrendTime": "fib_trend_time",
  "LineToolFibSpiral": "fib_spiral",
  "LineToolFibSpeedResistArcs": "fib_speed_resist_arcs",
  
  // Patterns
  "LineToolXABCDPattern": "xabcd_pattern",
  "LineToolCypherPattern": "cypher_pattern",
  "LineToolABCDPattern": "abcd_pattern",
  
  // Pitchfork
  "LineToolPitchfork": "pitchfork",
  "LineToolSchiffPitchfork": "schiff_pitchfork",
  "LineToolSchiffPitchforkModified": "schiff_pitchfork_modified",
  "LineToolInsidePitchfork": "inside_pitchfork",
  "LineToolPitchfan": "pitchfan",
  
  // Gann
  "LineToolGannBox": "gannbox",
  "LineToolGannSquare": "gannbox_square",
  "LineToolGannFixed": "gannbox_fixed",
  "LineToolGannFan": "gannbox_fan",
  
  // Shapes
  "LineToolRectangle": "rectangle",
  "LineToolCircle": "circle",
  "LineToolEllipse": "ellipse",
  "LineToolTriangle": "triangle",
  "LineToolPolyline": "polyline",
  "LineToolCurve": "curve",
  "LineToolDoubleCurve": "double_curve",
  "LineToolArc": "arc",
  "LineToolPath": "path",
  "LineToolBrush": "brush",
  "LineToolHighlighter": "highlighter",
  
  // Text and Notes
  "LineToolText": "text",
  "LineToolAnchoredText": "anchored_text",
  "LineToolNote": "note",
  "LineToolAnchoredNote": "anchored_note",
  "LineToolCallout": "callout",
  "LineToolBalloon": "balloon",
  "LineToolComment": "comment",
  "LineToolPriceLabel": "price_label",
  "LineToolPriceNote": "price_note",
  "LineToolSignpost": "signpost",
  "LineToolFlagMark": "flag",
  "LineToolTextNote": "text_note",
  
  // Arrows and Markers
  "LineToolArrowUp": "arrow_up",
  "LineToolArrowDown": "arrow_down",
  "LineToolArrowLeft": "arrow_left",
  "LineToolArrowRight": "arrow_right",
  "LineToolArrowMarker": "arrow_marker",
  
  // Icons
  "LineToolIcon": "icon",
  "LineToolEmoji": "emoji",
  "LineToolSticker": "sticker",
  
  // Other
  "LineToolAnchoredVWAP": "anchored_vwap",
  "LineToolTable": "table",
  "LineToolRiskRewardLong": "long_position",
  "LineToolRiskRewardShort": "short_position",
};

/**
 * Converts an internal class name (e.g., LineToolTrendLine) to short tool name (e.g., trend_line)
 */
function convertInternalClassToTool(internalName: string): string | null {
  // Direct mapping
  if (INTERNAL_CLASS_TO_TOOL[internalName]) {
    return INTERNAL_CLASS_TO_TOOL[internalName];
  }
  
  // Try to convert programmatically: remove "LineTool" prefix and convert to snake_case
  if (internalName.startsWith('LineTool')) {
    const withoutPrefix = internalName.slice(8); // Remove "LineTool"
    // Convert CamelCase to snake_case
    const snakeCase = withoutPrefix
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, ''); // Remove leading underscore
    console.log('[DrawingManager] Converted internal class to tool:', internalName, '->', snakeCase);
    return snakeCase;
  }
  
  return null;
}

/**
 * Converts a display name to internal tool identifier
 */
function getToolIdentifier(displayName: string): string | null {
  // Check direct mapping
  if (SHAPE_NAME_TO_TOOL[displayName]) {
    return SHAPE_NAME_TO_TOOL[displayName];
  }
  
  // Try lowercase version
  const lowerName = displayName.toLowerCase().replace(/\s+/g, '_');
  if (SHAPE_NAME_TO_TOOL[lowerName]) {
    return SHAPE_NAME_TO_TOOL[lowerName];
  }
  
  // Try converting display name format to snake_case
  const snakeCase = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (SHAPE_NAME_TO_TOOL[snakeCase]) {
    return SHAPE_NAME_TO_TOOL[snakeCase];
  }
  
  // Last resort: return the snake_case version and hope TradingView accepts it
  console.warn('[DrawingManager] Unknown shape name, using snake_case:', displayName, '->', snakeCase);
  return snakeCase;
}

/**
 * Validates that a timestamp is in seconds (not milliseconds)
 * Valid range: Year 2000 to Year 2100 in seconds
 */
function isValidSecondsTimestamp(time: number): boolean {
  const YEAR_2000_SECONDS = 946684800;
  const YEAR_2100_SECONDS = 4102444800;
  return time >= YEAR_2000_SECONDS && time <= YEAR_2100_SECONDS;
}

/**
 * Validates that a price is a finite number
 */
function isValidPrice(price: number): boolean {
  return typeof price === 'number' && isFinite(price) && !isNaN(price);
}

/**
 * Validates a single drawing point
 */
function isValidPoint(point: DrawingPoint): boolean {
  if (!point || typeof point !== 'object') return false;
  if (!isValidSecondsTimestamp(point.time)) {
    console.warn('[DrawingManager] Invalid timestamp (not in seconds range):', point.time);
    return false;
  }
  if (!isValidPrice(point.price)) {
    console.warn('[DrawingManager] Invalid price:', point.price);
    return false;
  }
  return true;
}

/**
 * Validates a complete drawing
 */
function isValidDrawing(drawing: SavedDrawing): boolean {
  if (!drawing || typeof drawing !== 'object') return false;
  if (!drawing.name || typeof drawing.name !== 'string') return false;
  if (!Array.isArray(drawing.points) || drawing.points.length === 0) return false;
  
  // All points must be valid
  for (const point of drawing.points) {
    if (!isValidPoint(point)) {
      console.warn('[DrawingManager] Drawing has invalid point:', drawing.name, point);
      return false;
    }
  }
  
  return true;
}

/**
 * Captures all drawings from a TradingView chart
 */
export function captureDrawings(chart: any): SavedDrawing[] {
  const drawings: SavedDrawing[] = [];
  
  try {
    const allShapes = chart.getAllShapes();
    
    for (const shape of allShapes) {
      try {
        const shapeObj = chart.getShapeById(shape.id);
        if (!shapeObj) continue;
        
        const rawPoints = shapeObj.getPoints();
        const properties = shapeObj.getProperties();
        
        // Log RAW points to debug timestamp format
        console.log('[DrawingManager] RAW getPoints() for', shape.name, ':', 
          JSON.stringify(rawPoints.map((p: any) => ({ time: p.time, price: p.price })))
        );
        
        // Check if points are in milliseconds (>10 billion) and convert to seconds
        const points = rawPoints.map((pt: any) => {
          let time = pt.time;
          // If timestamp > year 2200 in seconds, it's likely milliseconds
          if (time > 7258118400) {  // Year 2200 in seconds
            console.log('[DrawingManager] Converting milliseconds to seconds:', time, '->', Math.floor(time / 1000));
            time = Math.floor(time / 1000);
          }
          return { ...pt, time, price: pt.price };
        });
        
        // Validate that points are in seconds format
        const validPoints = points.filter((pt: DrawingPoint) => isValidPoint(pt));
        
        if (validPoints.length === 0) {
          console.warn('[DrawingManager] Skipping drawing with no valid points:', shape.name);
          continue;
        }
        
        if (validPoints.length !== points.length) {
          console.warn('[DrawingManager] Some points were invalid for drawing:', shape.name, 
            'valid:', validPoints.length, 'total:', points.length);
        }
        
        // Try to get the internal tool name from the shape source
        // This is more reliable than display names which may be localized
        let toolname: string | undefined;
        try {
          const source = (shapeObj as any)._source || (shapeObj as any).source;
          toolname = source?.toolname || source?.name;
          if (!toolname) {
            // Fallback: try to get from properties
            toolname = properties?.tool || properties?.shape;
          }
        } catch (e) {
          // Ignore - will use display name mapping as fallback
        }
        
        // Log full properties for debugging extend issues
        console.log('[DrawingManager] Captured shape:', shape.name, 'toolname:', toolname, 
          'extendLeft:', properties?.extendLeft, 'extendRight:', properties?.extendRight);
        
        // Ensure extend properties are explicitly captured (defaults to false if not set)
        const cleanedOverrides: Record<string, any> = properties ? { ...properties } : {};
        if (shape.name === 'trend_line' || toolname === 'LineToolTrendLine' || toolname === 'trend_line') {
          // Explicitly preserve extend settings for trend lines
          cleanedOverrides.extendLeft = properties?.extendLeft ?? false;
          cleanedOverrides.extendRight = properties?.extendRight ?? false;
        }
        
        const drawing: SavedDrawing = {
          id: shape.id,
          name: shape.name,
          toolname: toolname,
          points: validPoints,
          overrides: cleanedOverrides,
          lock: false
        };
        
        if (isValidDrawing(drawing)) {
          drawings.push(drawing);
        }
      } catch (e) {
        console.warn('[DrawingManager] Could not capture shape:', shape.name, e);
      }
    }
  } catch (e) {
    console.warn('[DrawingManager] Could not get shapes from chart:', e);
  }
  
  console.log('[DrawingManager] Captured', drawings.length, 'valid drawings');
  return drawings;
}

/**
 * Restores drawings to a TradingView chart
 * Returns the number of successfully restored drawings
 * 
 * NOTE: TradingView's createMultipointShape accepts timestamps in SECONDS (same as getPoints())
 * We store in seconds, so we pass directly without conversion.
 */
export function restoreDrawings(chart: any, drawings: SavedDrawing[]): number {
  let restoredCount = 0;
  
  for (const drawing of drawings) {
    try {
      if (!isValidDrawing(drawing)) {
        console.warn('[DrawingManager] Skipping invalid drawing:', drawing.name);
        continue;
      }
      
      // Determine the short tool name for createMultipointShape
      let toolName: string | null | undefined = null;
      
      // If we have a captured internal class name (e.g., LineToolTrendLine), convert it
      if (drawing.toolname) {
        // Check if it's already a short name (doesn't start with LineTool)
        if (!drawing.toolname.startsWith('LineTool')) {
          toolName = drawing.toolname;
        } else {
          // Convert internal class name to short tool name
          toolName = convertInternalClassToTool(drawing.toolname);
        }
      }
      
      // Fall back to display name mapping
      if (!toolName) {
        toolName = getToolIdentifier(drawing.name);
      }
      
      if (!toolName) {
        console.warn('[DrawingManager] Could not determine tool name for:', drawing.name, 'toolname:', drawing.toolname);
        continue;
      }
      
      // TradingView's createMultipointShape expects timestamps in SECONDS
      // Same format as getPoints() returns - no conversion needed
      
      // Build overrides, ensuring extend properties are explicitly set for trend lines
      const overrides = { ...(drawing.overrides || {}) };
      if (toolName === 'trend_line') {
        // Ensure extend properties are explicitly set (default to false to prevent extension)
        overrides.extendLeft = overrides.extendLeft ?? false;
        overrides.extendRight = overrides.extendRight ?? false;
      }
      
      const shapeOptions = {
        shape: toolName,
        overrides,
        lock: drawing.lock || false,
        disableSelection: false,
        disableSave: false,
        disableUndo: false,
      };
      
      console.log('[DrawingManager] Restoring:', drawing.name, '-> tool:', toolName,
        'points (seconds):', drawing.points.map(p => ({ time: p.time, price: typeof p.price === 'number' ? p.price.toFixed(5) : p.price })),
        'extendLeft:', overrides.extendLeft, 'extendRight:', overrides.extendRight
      );
      
      // Pass points directly in seconds - TradingView handles the conversion internally
      const shapeId = chart.createMultipointShape(drawing.points, shapeOptions);
      
      // For trend lines, explicitly set properties after creation if needed
      if (shapeId && toolName === 'trend_line') {
        try {
          const createdShape = chart.getShapeById(shapeId);
          if (createdShape && typeof createdShape.setProperties === 'function') {
            createdShape.setProperties({
              extendLeft: overrides.extendLeft,
              extendRight: overrides.extendRight
            });
            console.log('[DrawingManager] Applied extend properties to restored trend line');
          }
        } catch (propError) {
          // setProperties may not be available on all shape types
          console.log('[DrawingManager] Could not set properties post-creation:', propError);
        }
      }
      
      restoredCount++;
    } catch (e) {
      console.warn('[DrawingManager] Could not restore drawing:', drawing.name, e);
    }
  }
  
  console.log('[DrawingManager] Restored', restoredCount, 'of', drawings.length, 'drawings');
  return restoredCount;
}

/**
 * Clears all drawings from the chart
 */
export function clearAllDrawings(chart: any): void {
  try {
    const allShapes = chart.getAllShapes();
    for (const shape of allShapes) {
      try {
        chart.removeEntity(shape.id);
      } catch (e) {
        // Ignore removal errors
      }
    }
    console.log('[DrawingManager] Cleared', allShapes.length, 'drawings');
  } catch (e) {
    console.warn('[DrawingManager] Could not clear drawings:', e);
  }
}

/**
 * Creates a full drawing payload for saving to database
 */
export function createPayload(
  chart: any,
  interval: string,
  studies: any[] = [],
  favoriteTools: string[] = [],
  chartProperties: any = null
): DrawingPayload {
  const drawings = captureDrawings(chart);
  
  return {
    drawings,
    studies,
    interval,
    timestamp: Date.now(),
    favoriteDrawingTools: favoriteTools,
    chartProperties,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

/**
 * Validates a payload loaded from database
 * Filters out invalid drawings and normalizes the data
 */
export function validatePayload(payload: any): DrawingPayload {
  if (!payload || typeof payload !== 'object') {
    return {
      drawings: [],
      studies: [],
      schemaVersion: CURRENT_SCHEMA_VERSION
    };
  }
  
  // Filter to only valid drawings
  const drawings = Array.isArray(payload.drawings) 
    ? payload.drawings.filter((d: SavedDrawing) => isValidDrawing(d))
    : [];
  
  const invalidCount = (payload.drawings?.length || 0) - drawings.length;
  if (invalidCount > 0) {
    console.warn('[DrawingManager] Filtered out', invalidCount, 'invalid drawings from payload');
  }
  
  return {
    drawings,
    studies: payload.studies || [],
    interval: payload.interval,
    timestamp: payload.timestamp,
    favoriteDrawingTools: payload.favoriteDrawingTools || [],
    chartProperties: payload.chartProperties,
    schemaVersion: payload.schemaVersion || 1
  };
}

/**
 * Compares two payloads to check if drawings have changed
 * Used to avoid unnecessary saves
 */
export function hasPayloadChanged(oldPayload: DrawingPayload | null, newPayload: DrawingPayload): boolean {
  if (!oldPayload) return true;
  if (oldPayload.drawings.length !== newPayload.drawings.length) return true;
  
  // Simple hash comparison
  const oldHash = JSON.stringify(oldPayload.drawings.map(d => ({
    name: d.name,
    points: d.points
  })));
  const newHash = JSON.stringify(newPayload.drawings.map(d => ({
    name: d.name,
    points: d.points
  })));
  
  return oldHash !== newHash;
}

/**
 * Gets the count of current shapes on the chart
 */
export function getShapeCount(chart: any): number {
  try {
    return chart.getAllShapes().length;
  } catch {
    return 0;
  }
}
