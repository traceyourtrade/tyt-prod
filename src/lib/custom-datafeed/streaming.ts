// 📡 Import helpers
import { parseFullSymbol } from './helpers.js';

// 🔌 WebSocket connection - lazy initialization to avoid HTTPS/WSS issues
let socket = null;
const channelToSubscription = new Map();

// Initialize WebSocket only when needed
function getSocket() {
        if (socket && socket.readyState === WebSocket.OPEN) {
                return socket;
        }
        
        // Skip WebSocket for backtesting (not needed for historical data replay)
        if (typeof window !== 'undefined') {
                console.log('🔌 [WebSocket] Skipping real-time connection for backtesting mode');
        }
        return null;
}

// 📬 Message handler function (used when socket is connected)
function handleMessage(event) {
        try {
                const data = JSON.parse(event.data);
                console.dir(data, { depth: null, colors: true });

                const {
                        TYPE: eventTypeStr,
                        M: exchange,
                        FSYM: fromSymbol,
                        TSYM: toSymbol,
                        TS: tradeTimeStr,
                        P: tradePriceStr,
                } = data;

                if (parseInt(eventTypeStr) !== 0) {
                        return;
                }

                const tradePrice = parseFloat(tradePriceStr);
                const tradeTime = parseInt(tradeTimeStr);
                const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;

                const subscriptionItem = channelToSubscription.get(channelString);
                if (!subscriptionItem) {
                        return;
                }

                const lastDailyBar = subscriptionItem.lastDailyBar;
                const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

                let bar;
                if (tradeTime >= nextDailyBarTime) {
                        bar = {
                                time: nextDailyBarTime,
                                open: tradePrice,
                                high: tradePrice,
                                low: tradePrice,
                                close: tradePrice,
                        };
                } else {
                        bar = {
                                ...lastDailyBar,
                                high: Math.max(lastDailyBar.high, tradePrice),
                                low: Math.min(lastDailyBar.low, tradePrice),
                                close: tradePrice,
                        };
                }

                subscriptionItem.lastDailyBar = bar;
                subscriptionItem.handlers.forEach((handler) => {
                        handler.callback(bar);
                });
        } catch (err) {
                console.error('💥 [Parse Error] Failed to parse message:', err.message);
        }
}

// 📅 Helper: Get next day timestamp
function getNextDailyBarTime(barTime) {
        const date = new Date(barTime * 1000);
        date.setDate(date.getDate() + 1);
        const nextTime = date.getTime() / 1000;
        // console.log(`📅 [Helper] Next daily bar time: ${new Date(nextTime * 1000).toISOString()}`);
        return nextTime;
}

// 📥 SUBSCRIBE FUNCTION
export function subscribeOnStream(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
        lastDailyBar
) {
        // Skip WebSocket subscription for backtesting (uses historical data instead)
        const currentSocket = getSocket();
        if (!currentSocket) {
                console.log('📥 [Subscribe] Skipping real-time subscription (backtesting mode)');
                return;
        }

        const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
        const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
        const handler = {
                id: subscriberUID,
                callback: onRealtimeCallback,
        };

        let subscriptionItem = channelToSubscription.get(channelString);

        if (subscriptionItem) {
                subscriptionItem.handlers.push(handler);
                return;
        }

        subscriptionItem = {
                subscriberUID,
                resolution,
                lastDailyBar,
                handlers: [handler],
        };

        channelToSubscription.set(channelString, subscriptionItem);

        const subRequest = {
                action: 'SubAdd',
                subs: [channelString],
        };

        currentSocket.send(JSON.stringify(subRequest));
}

// 🚫 UNSUBSCRIBE FUNCTION
export function unsubscribeFromStream(subscriberUID) {
        const currentSocket = getSocket();
        
        for (const channelString of channelToSubscription.keys()) {
                const subscriptionItem = channelToSubscription.get(channelString);
                const handlerIndex = subscriptionItem.handlers.findIndex(
                        (handler) => handler.id === subscriberUID
                );

                if (handlerIndex !== -1) {
                        subscriptionItem.handlers.splice(handlerIndex, 1);

                        if (subscriptionItem.handlers.length === 0) {
                                if (currentSocket) {
                                        const subRequest = {
                                                action: 'SubRemove',
                                                subs: [channelString],
                                        };
                                        currentSocket.send(JSON.stringify(subRequest));
                                }
                                channelToSubscription.delete(channelString);
                                break;
                        }
                }
        }
}