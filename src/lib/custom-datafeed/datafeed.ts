import {
    makeApiRequest,
    generateSymbol,
    parseFullSymbol,
} from './helpers.js';
import {
    subscribeOnStream,
    unsubscribeFromStream,
} from './streaming.js';

const lastBarsCache = new Map();
let allSymbolsPromise = null;

async function getAllSymbols() {
    if (allSymbolsPromise) return allSymbolsPromise;

    allSymbolsPromise = (async () => {
        try {
            const data = await makeApiRequest('data/v3/all/exchanges');
            let allSymbols = [];
            let exchanges = [];
            const symbolTypes = new Set();

            for (const exchangeName of Object.keys(data.Data)) {
                const exchange = data.Data[exchangeName];
                exchanges.push({
                    value: exchangeName,
                    name: exchangeName,
                    desc: exchangeName,
                });

                for (const leftPairPart of Object.keys(exchange.pairs)) {
                    const symbols = exchange.pairs[leftPairPart].map(rightPairPart => {
                        const symbol = generateSymbol(exchangeName, leftPairPart, rightPairPart);
                        const symbolType = 'forex';
                        symbolTypes.add(symbolType);
                        return {
                            symbol: symbol.full,
                            full_name: symbol.full,
                            description: symbol.short,
                            exchange: exchangeName,
                            type: symbolType,
                        };
                    });
                    allSymbols = [...allSymbols, ...symbols];
                }
            }

            configurationData.exchanges = exchanges;
            configurationData.symbols_types = Array.from(symbolTypes).map(type => ({ name: "Forex", value: type }));
            return allSymbols;
        } catch (error) {
            console.error('[getAllSymbols]: Failed to fetch symbols:', error);
            return [];
        }
    })();
    return allSymbolsPromise;
}

// DatafeedConfiguration implementation
const configurationData = {
    supported_resolutions: ['1D', '1W', '1M','1H'],
    exchanges: [],
    symbols_types: [],
};

export default {
    onReady: (callback) => {
        getAllSymbols().then(() => {
            setTimeout(() => callback(configurationData));
        });
    },

    searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
        try {
            const symbols = await getAllSymbols();
            const filtered = symbols.filter(symbol => {
                const isExchangeValid = exchange === '' || symbol.exchange === exchange;
                const isMatch = symbol.full_name.toLowerCase().includes(userInput.toLowerCase());
                const isTypeValid = symbolType === '' || symbol.type === symbolType;
                return isExchangeValid && isMatch && isTypeValid;
            });
            // Making the defualt symbol for the call now.
            // const defaultSymbol = [{
            //     "symbol": "FXCM:EUR/USD",
            //     "full_name": "FXCM:EUR/USD",
            //     "description": "EUR/USD",
            //     "exchange": "FXCM",
            //     "type": "forex"
            //     }];
            //     console.log("defaultSymbol",defaultSymbol)
            // onResultReadyCallback(defaultSymbol);
            onResultReadyCallback(filtered);
        } catch (error) {
            console.error('[searchSymbols]: Failed to search symbols:', error);
            onResultReadyCallback([]);
        }
    },

    resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
        try {
            const symbols = await getAllSymbols();
            const symbolItem = symbols.find(({ full_name }) => full_name === symbolName);

            if (!symbolItem) {
                onResolveErrorCallback('cannot resolve symbol');
                return;
            }

            const symbolInfo = {
                ticker: symbolItem.full_name,
                name: symbolItem.description,
                description: symbolItem.description,
                type: symbolItem.type,
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: symbolItem.exchange,
                minmov: 1,
                pricescale: 100,
                has_intraday: false,
                has_no_volume: true,
                has_weekly_and_monthly: true,
                supported_resolutions: configurationData.supported_resolutions,
                volume_precision: 2,
                data_status: 'streaming',
            };

            onSymbolResolvedCallback(symbolInfo);
        } catch (error) {
            onResolveErrorCallback(error.message || 'Failed to resolve symbol');
        }
    },

    getBars: async function(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        const { from, to, firstDataRequest } = periodParams;

        const parsedSymbol = parseFullSymbol(symbolInfo.full_name);

        const query = new URLSearchParams({
            e: parsedSymbol.exchange,
            fsym: parsedSymbol.fromSymbol,
            tsym: parsedSymbol.toSymbol,
            toTs: to,
            fromTs: from,
            timeframe: resolution,
        }).toString();

        try {
            const data = await makeApiRequest(`data/historic-data?${query}`);

            if (!data || !data.Data || data.Data.length === 0) {
                onHistoryCallback([], { noData: true });
                return;
            }

            const bars = data.Data
                .filter(bar => bar.time >= from && bar.time < to)
                .map(bar => ({
                    time: bar.time * 1000,
                    low: bar.low,
                    high: bar.high,
                    open: bar.open,
                    close: bar.close,
                    volume: bar.volume,
                }));

            if (firstDataRequest && bars.length > 0) {
                lastBarsCache.set(symbolInfo.full_name, { ...bars[bars.length - 1] });
            }

            onHistoryCallback(bars, { noData: false });

        } catch (error) {
            console.error('[getBars]: Failed to fetch data:', error);
            onErrorCallback(error);
        }
    },

    subscribeBars: (
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
    ) => {
        subscribeOnStream(
            symbolInfo,
            resolution,
            onRealtimeCallback,
            subscriberUID,
            onResetCacheNeededCallback,
            lastBarsCache.get(symbolInfo.full_name),
        );
    },

    unsubscribeBars: (subscriberUID) => {
        unsubscribeFromStream(subscriberUID);
    },
};