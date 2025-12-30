type IndianFnO = {
  symbol: string;
  market: string;
  curr: string;
  name: string;
  lotSize: number;
}

const indianFnO: IndianFnO[] = [
  { symbol: "NIFTY", market: "INDIAN F&O", curr: "INR", name: "Nifty 50 Index", lotSize: 25 },
  { symbol: "BANKNIFTY", market: "INDIAN F&O", curr: "INR", name: "Bank Nifty Index", lotSize: 15 },
  { symbol: "SENSEX", market: "INDIAN F&O", curr: "INR", name: "BSE Sensex Index", lotSize: 10 },
  { symbol: "FINNIFTY", market: "INDIAN F&O", curr: "INR", name: "Nifty Financial Services", lotSize: 25 },
  { symbol: "MIDCPNIFTY", market: "INDIAN F&O", curr: "INR", name: "Nifty Midcap Select", lotSize: 50 },
  { symbol: "NIFTYIT", market: "INDIAN F&O", curr: "INR", name: "Nifty IT Index", lotSize: 15 },
  { symbol: "RELIANCE", market: "INDIAN F&O", curr: "INR", name: "Reliance Industries F&O", lotSize: 250 },
  { symbol: "TCS", market: "INDIAN F&O", curr: "INR", name: "TCS F&O", lotSize: 150 },
  { symbol: "HDFCBANK", market: "INDIAN F&O", curr: "INR", name: "HDFC Bank F&O", lotSize: 550 },
  { symbol: "INFY", market: "INDIAN F&O", curr: "INR", name: "Infosys F&O", lotSize: 300 },
  { symbol: "ICICIBANK", market: "INDIAN F&O", curr: "INR", name: "ICICI Bank F&O", lotSize: 700 },
  { symbol: "SBIN", market: "INDIAN F&O", curr: "INR", name: "SBI F&O", lotSize: 750 },
  { symbol: "TATAMOTORS", market: "INDIAN F&O", curr: "INR", name: "Tata Motors F&O", lotSize: 550 },
  { symbol: "TATASTEEL", market: "INDIAN F&O", curr: "INR", name: "Tata Steel F&O", lotSize: 550 },
  { symbol: "LT", market: "INDIAN F&O", curr: "INR", name: "L&T F&O", lotSize: 150 },
];

export default indianFnO;
