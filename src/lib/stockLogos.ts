const SYMBOL_COMPANY_MAP: Record<string, string> = {
  'AAPL': 'apple',
  'MSFT': 'microsoft',
  'GOOGL': 'google',
  'GOOG': 'google',
  'AMZN': 'amazon',
  'META': 'meta',
  'FB': 'meta',
  'TSLA': 'tesla',
  'NVDA': 'nvidia',
  'NFLX': 'netflix',
  'AMD': 'amd',
  'INTC': 'intel',
  'IBM': 'ibm',
  'ORCL': 'oracle',
  'CRM': 'salesforce',
  'ADBE': 'adobe',
  'PYPL': 'paypal',
  'V': 'visa',
  'MA': 'mastercard',
  'JPM': 'jpmorgan',
  'BAC': 'bankofamerica',
  'WFC': 'wellsfargo',
  'GS': 'goldmansachs',
  'MS': 'morganstanley',
  'C': 'citi',
  'UBER': 'uber',
  'LYFT': 'lyft',
  'ABNB': 'airbnb',
  'COIN': 'coinbase',
  'SQ': 'block',
  'SHOP': 'shopify',
  'SNAP': 'snap',
  'PINS': 'pinterest',
  'TWTR': 'twitter',
  'X': 'twitter',
  'DIS': 'disney',
  'WMT': 'walmart',
  'TGT': 'target',
  'COST': 'costco',
  'NKE': 'nike',
  'SBUX': 'starbucks',
  'MCD': 'mcdonalds',
  'KO': 'cocacola',
  'PEP': 'pepsi',
  'JNJ': 'johnsonandjohnson',
  'PFE': 'pfizer',
  'MRNA': 'moderna',
  'CVS': 'cvs',
  'UNH': 'unitedhealthgroup',
  'BA': 'boeing',
  'LMT': 'lockheedmartin',
  'CAT': 'caterpillar',
  'DE': 'johndeere',
  'XOM': 'exxonmobil',
  'CVX': 'chevron',
  'COP': 'conocophillips',
  'GM': 'generalmotors',
  'F': 'ford',
  'TM': 'toyota',
  'RIVN': 'rivian',
  'LCID': 'lucidmotors',
  'NIO': 'nio',
  'PLTR': 'palantir',
  'SNOW': 'snowflake',
  'DDOG': 'datadog',
  'NET': 'cloudflare',
  'ZM': 'zoom',
  'DOCU': 'docusign',
  'TEAM': 'atlassian',
  'WDAY': 'workday',
  'NOW': 'servicenow',
  'PANW': 'paloaltonetworks',
  'CRWD': 'crowdstrike',
  'ZS': 'zscaler',
  'OKTA': 'okta',
  'TWLO': 'twilio',
  'MDB': 'mongodb',
  'DKNG': 'draftkings',
  'RBLX': 'roblox',
  'U': 'unity',
  'TTWO': 'take-two',
  'EA': 'ea',
  'ATVI': 'activisionblizzard',
  'QQQ': 'invesco',
  'SPY': 'spdr',
  'IWM': 'ishares',
  'DIA': 'spdr',
  'VTI': 'vanguard',
  'VOO': 'vanguard',
  'ARKK': 'ark-invest',
  'GLD': 'spdr',
  'SLV': 'ishares',
  'USO': 'uscf',
  'VIX': 'cboe',
  'MARA': 'marathondigital',
  'RIOT': 'riotblockchain',
  'HOOD': 'robinhood',
  'SOFI': 'sofi',
  'AFRM': 'affirm',
  'UPST': 'upstart',
  'PATH': 'uipath',
  'AI': 'c3ai',
  'ARM': 'arm',
  'SMCI': 'supermicro',
  'AVGO': 'broadcom',
  'QCOM': 'qualcomm',
  'TXN': 'texasinstruments',
  'MU': 'micron',
  'LRCX': 'lamresearch',
  'AMAT': 'appliedmaterials',
  'KLAC': 'klacorporation',
  'ASML': 'asml',
  'TSM': 'tsmc',
};

const CRYPTO_SYMBOLS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'polygon',
  'AVAX': 'avalanche',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ALGO': 'algorand',
  'XLM': 'stellar',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'NEAR': 'near-protocol',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'SUI': 'sui',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'APE': 'apecoin',
  'SAND': 'sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'CRO': 'cronos',
  'AAVE': 'aave',
  'MKR': 'maker',
  'SNX': 'synthetix',
  'COMP': 'compound',
  'SUSHI': 'sushiswap',
  'YFI': 'yearn-finance',
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
};

const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'EURNZD',
  'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD', 'AUDCAD', 'AUDCHF', 'AUDNZD',
  'CADJPY', 'CHFJPY', 'NZDJPY', 'CADCHF', 'NZDCAD', 'NZDCHF',
  'XAUUSD', 'XAGUSD', 'XAUEUR', 'XAGEUR',
  'US30', 'US100', 'US500', 'GER40', 'UK100', 'FRA40', 'JPN225',
];

function isForexPair(symbol: string): boolean {
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return FOREX_PAIRS.includes(cleanSymbol) || 
         /^[A-Z]{6}$/.test(cleanSymbol) ||
         cleanSymbol.includes('USD') && cleanSymbol.length === 6;
}

function getCryptoLogoUrl(symbol: string): string | null {
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  const cryptoId = CRYPTO_SYMBOLS[cleanSymbol];
  
  if (cryptoId) {
    return `https://assets.coingecko.com/coins/images/1/small/${cryptoId}.png`;
  }
  return null;
}

export function getStockLogoUrl(symbol: string): string | null {
  if (!symbol) return null;
  
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (isForexPair(cleanSymbol)) {
    return null;
  }
  
  const cryptoUrl = getCryptoLogoUrl(cleanSymbol);
  if (cryptoUrl) {
    return cryptoUrl;
  }
  
  const companyName = SYMBOL_COMPANY_MAP[cleanSymbol];
  
  if (companyName) {
    return `https://logo.clearbit.com/${companyName}.com`;
  }
  
  return `https://logo.clearbit.com/${cleanSymbol.toLowerCase()}.com`;
}

export function getSymbolFallback(symbol: string): string {
  if (!symbol) return '?';
  return symbol.slice(0, 4).toUpperCase();
}

export function getSymbolType(symbol: string): 'stock' | 'crypto' | 'forex' | 'unknown' {
  if (!symbol) return 'unknown';
  
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (isForexPair(cleanSymbol)) return 'forex';
  if (CRYPTO_SYMBOLS[cleanSymbol]) return 'crypto';
  if (SYMBOL_COMPANY_MAP[cleanSymbol]) return 'stock';
  
  return 'unknown';
}
