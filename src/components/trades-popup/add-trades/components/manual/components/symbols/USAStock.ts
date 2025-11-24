type USStockType={
    symbol:string;
    name:string;
    curr:string;
    market:string;
}

const usStocks:USStockType[] = [

    // Stocks
    { symbol: "AAPL", market: "US STOCK", curr: "USD", name: "Apple Inc." },
    { symbol: "GOOGL", market: "US STOCK", curr: "USD", name: "Alphabet Inc. (Google)" },
    { symbol: "AMZN", market: "US STOCK", curr: "USD", name: "Amazon.com Inc." },
    { symbol: "MSFT", market: "US STOCK", curr: "USD", name: "Microsoft Corporation" },
    { symbol: "TSLA", market: "US STOCK", curr: "USD", name: "Tesla, Inc." },
    { symbol: "META", market: "US STOCK", curr: "USD", name: "Meta Platforms, Inc. (Facebook)" },
    { symbol: "NVDA", market: "US STOCK", curr: "USD", name: "NVIDIA Corporation" },
    { symbol: "NFLX", market: "US STOCK", curr: "USD", name: "Netflix, Inc." },
    { symbol: "JPM", market: "US STOCK", curr: "USD", name: "JPMorgan Chase & Co." },
    { symbol: "BRK.B", market: "US STOCK", curr: "USD", name: "Berkshire Hathaway Inc." },
    { symbol: "V", market: "US STOCK", curr: "USD", name: "Visa Inc." },
    { symbol: "UNH", market: "US STOCK", curr: "USD", name: "UnitedHealth Group Incorporated" }

];

export default usStocks;