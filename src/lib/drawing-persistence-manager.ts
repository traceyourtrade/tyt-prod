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
        
        const points = shapeObj.getPoints();
        const properties = shapeObj.getProperties();
        
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
        
        const drawing: SavedDrawing = {
          id: shape.id,
          name: shape.name,
          points: validPoints,
          overrides: properties || {},
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
 */
export function restoreDrawings(chart: any, drawings: SavedDrawing[]): number {
  let restoredCount = 0;
  
  for (const drawing of drawings) {
    try {
      if (!isValidDrawing(drawing)) {
        console.warn('[DrawingManager] Skipping invalid drawing:', drawing.name);
        continue;
      }
      
      // Points are already in seconds - pass directly to TradingView
      const shapeOptions = {
        shape: drawing.name,
        overrides: drawing.overrides || {},
        lock: drawing.lock || false,
        disableSelection: false,
        disableSave: false,
        disableUndo: false,
      };
      
      console.log('[DrawingManager] Restoring:', drawing.name, 
        'points:', drawing.points.map(p => ({ 
          time: new Date(p.time * 1000).toISOString(), 
          price: p.price.toFixed(5) 
        }))
      );
      
      chart.createMultipointShape(drawing.points, shapeOptions);
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
