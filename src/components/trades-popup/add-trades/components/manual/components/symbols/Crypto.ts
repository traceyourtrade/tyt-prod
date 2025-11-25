type CryptoSymbol={
    symbol:string;
    market:string;
    curr:string;
    name:string;
}
const crypto:CryptoSymbol[] = [

    { symbol: "BTCUSDT", market: "CRYPTO", curr: "Dollar", name: "Bitcoin vs Tether USD" },
    { symbol: "ETHUSDT", market: "CRYPTO", curr: "Dollar", name: "Ethereum vs Tether USD" },
    { symbol: "BNBUSDT", market: "CRYPTO", curr: "Dollar", name: "Binance Coin vs Tether USD" },
    { symbol: "SOLUSDT", market: "CRYPTO", curr: "Dollar", name: "Solana vs Tether USD" },
    { symbol: "ADAUSDT", market: "CRYPTO", curr: "Dollar", name: "Cardano vs Tether USD" },
    { symbol: "DOGEUSDT", market: "CRYPTO", curr: "Dollar", name: "Dogecoin vs Tether USD" },
    { symbol: "XRPUSDT", market: "CRYPTO", curr: "Dollar", name: "Ripple vs Tether USD" },
    { symbol: "AVAXUSDT", market: "CRYPTO", curr: "Dollar", name: "Avalanche vs Tether USD" },
    { symbol: "ETHBTC", market: "CRYPTO", curr: "Bitcoin", name: "Ethereum vs Bitcoin" },
    { symbol: "BNBBTC", market: "CRYPTO", curr: "Bitcoin", name: "Binance Coin vs Bitcoin" },
    { symbol: "LTCBTC", market: "CRYPTO", curr: "Bitcoin", name: "Litecoin vs Bitcoin" },
    { symbol: "DOTUSDT", market: "CRYPTO", curr: "Dollar", name: "Polkadot vs Tether USD" },
    { symbol: "MATICUSDT", market: "CRYPTO", curr: "Dollar", name: "Polygon vs Tether USD" },
    { symbol: "SHIBUSDT", market: "CRYPTO", curr: "Dollar", name: "Shiba Inu vs Tether USD" },

];

export default crypto;