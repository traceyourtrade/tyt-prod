import { NextRequest, NextResponse } from 'next/server';

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  currency: string;
  event: string;
  impact: number;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  unit: string;
}

const majorForexEvents = [
  { event: "Non-Farm Payrolls", currency: "USD", country: "US", impact: 3, unit: "K" },
  { event: "Fed Interest Rate Decision", currency: "USD", country: "US", impact: 3, unit: "%" },
  { event: "FOMC Statement", currency: "USD", country: "US", impact: 3, unit: "" },
  { event: "CPI m/m", currency: "USD", country: "US", impact: 3, unit: "%" },
  { event: "Core CPI m/m", currency: "USD", country: "US", impact: 3, unit: "%" },
  { event: "GDP q/q", currency: "USD", country: "US", impact: 3, unit: "%" },
  { event: "Unemployment Rate", currency: "USD", country: "US", impact: 3, unit: "%" },
  { event: "Retail Sales m/m", currency: "USD", country: "US", impact: 2, unit: "%" },
  { event: "ISM Manufacturing PMI", currency: "USD", country: "US", impact: 2, unit: "" },
  { event: "ISM Services PMI", currency: "USD", country: "US", impact: 2, unit: "" },
  { event: "ADP Non-Farm Employment Change", currency: "USD", country: "US", impact: 2, unit: "K" },
  { event: "Initial Jobless Claims", currency: "USD", country: "US", impact: 2, unit: "K" },
  { event: "Durable Goods Orders m/m", currency: "USD", country: "US", impact: 2, unit: "%" },
  { event: "Consumer Confidence", currency: "USD", country: "US", impact: 2, unit: "" },
  { event: "New Home Sales", currency: "USD", country: "US", impact: 1, unit: "K" },
  { event: "Existing Home Sales", currency: "USD", country: "US", impact: 1, unit: "M" },
  { event: "Building Permits", currency: "USD", country: "US", impact: 1, unit: "M" },
  
  { event: "ECB Interest Rate Decision", currency: "EUR", country: "EU", impact: 3, unit: "%" },
  { event: "CPI y/y", currency: "EUR", country: "EU", impact: 3, unit: "%" },
  { event: "Core CPI y/y", currency: "EUR", country: "EU", impact: 2, unit: "%" },
  { event: "GDP q/q", currency: "EUR", country: "EU", impact: 3, unit: "%" },
  { event: "German Manufacturing PMI", currency: "EUR", country: "DE", impact: 2, unit: "" },
  { event: "German ZEW Economic Sentiment", currency: "EUR", country: "DE", impact: 2, unit: "" },
  { event: "German Ifo Business Climate", currency: "EUR", country: "DE", impact: 2, unit: "" },
  { event: "French Manufacturing PMI", currency: "EUR", country: "FR", impact: 1, unit: "" },
  
  { event: "BOE Interest Rate Decision", currency: "GBP", country: "GB", impact: 3, unit: "%" },
  { event: "CPI y/y", currency: "GBP", country: "GB", impact: 3, unit: "%" },
  { event: "GDP m/m", currency: "GBP", country: "GB", impact: 2, unit: "%" },
  { event: "Retail Sales m/m", currency: "GBP", country: "GB", impact: 2, unit: "%" },
  { event: "Claimant Count Change", currency: "GBP", country: "GB", impact: 2, unit: "K" },
  { event: "Manufacturing PMI", currency: "GBP", country: "GB", impact: 1, unit: "" },
  
  { event: "BOJ Interest Rate Decision", currency: "JPY", country: "JP", impact: 3, unit: "%" },
  { event: "CPI y/y", currency: "JPY", country: "JP", impact: 2, unit: "%" },
  { event: "GDP q/q", currency: "JPY", country: "JP", impact: 2, unit: "%" },
  { event: "Tankan Manufacturing Index", currency: "JPY", country: "JP", impact: 2, unit: "" },
  { event: "Trade Balance", currency: "JPY", country: "JP", impact: 1, unit: "T" },
  
  { event: "RBA Interest Rate Decision", currency: "AUD", country: "AU", impact: 3, unit: "%" },
  { event: "Employment Change", currency: "AUD", country: "AU", impact: 3, unit: "K" },
  { event: "Unemployment Rate", currency: "AUD", country: "AU", impact: 2, unit: "%" },
  { event: "CPI q/q", currency: "AUD", country: "AU", impact: 2, unit: "%" },
  { event: "Retail Sales m/m", currency: "AUD", country: "AU", impact: 1, unit: "%" },
  
  { event: "BOC Interest Rate Decision", currency: "CAD", country: "CA", impact: 3, unit: "%" },
  { event: "Employment Change", currency: "CAD", country: "CA", impact: 3, unit: "K" },
  { event: "Unemployment Rate", currency: "CAD", country: "CA", impact: 2, unit: "%" },
  { event: "CPI m/m", currency: "CAD", country: "CA", impact: 2, unit: "%" },
  { event: "GDP m/m", currency: "CAD", country: "CA", impact: 2, unit: "%" },
  { event: "Retail Sales m/m", currency: "CAD", country: "CA", impact: 1, unit: "%" },
  
  { event: "SNB Interest Rate Decision", currency: "CHF", country: "CH", impact: 3, unit: "%" },
  { event: "CPI m/m", currency: "CHF", country: "CH", impact: 2, unit: "%" },
  { event: "GDP q/q", currency: "CHF", country: "CH", impact: 2, unit: "%" },
  { event: "Trade Balance", currency: "CHF", country: "CH", impact: 1, unit: "B" },
  
  { event: "RBNZ Interest Rate Decision", currency: "NZD", country: "NZ", impact: 3, unit: "%" },
  { event: "GDP q/q", currency: "NZD", country: "NZ", impact: 2, unit: "%" },
  { event: "CPI q/q", currency: "NZD", country: "NZ", impact: 2, unit: "%" },
  { event: "Employment Change q/q", currency: "NZD", country: "NZ", impact: 2, unit: "%" },
  { event: "Trade Balance", currency: "NZD", country: "NZ", impact: 1, unit: "M" },
];

const eventTimes = [
  "00:30", "01:30", "02:00", "03:00", "04:30", "06:00", "07:00", "08:30", 
  "09:00", "09:30", "10:00", "12:30", "13:30", "14:00", "14:30", "15:00",
  "15:45", "16:00", "17:00", "18:00", "19:00", "20:00", "21:30", "23:00"
];

function seededRandom(seed: number): () => number {
  return function() {
    seed = Math.sin(seed) * 10000;
    return seed - Math.floor(seed);
  };
}

function generateEventValue(baseValue: number, unit: string, variance: number, random: () => number): string {
  const value = baseValue + (random() - 0.5) * variance;
  const formatted = unit === "%" ? value.toFixed(1) : 
                    unit === "K" ? Math.round(value).toString() :
                    unit === "M" ? value.toFixed(2) :
                    unit === "B" ? value.toFixed(1) :
                    unit === "T" ? value.toFixed(2) :
                    Math.round(value).toString();
  return unit ? `${formatted}${unit}` : formatted;
}

function generateEventsForDateRange(fromDate: Date, toDate: Date): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let date = new Date(fromDate); date <= toDate; date = new Date(date.getTime() + dayMs)) {
    const dateStr = date.toISOString().split('T')[0];
    const seed = date.getTime();
    const random = seededRandom(seed);
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (random() > 0.1) continue;
    }
    
    const numEvents = dayOfWeek === 0 || dayOfWeek === 6 
      ? Math.floor(random() * 3) 
      : Math.floor(random() * 8) + 3;
    
    const shuffledEvents = [...majorForexEvents]
      .sort(() => random() - 0.5)
      .slice(0, numEvents);
    
    shuffledEvents.forEach((eventTemplate, idx) => {
      const time = eventTimes[Math.floor(random() * eventTimes.length)];
      
      let baseValue = 0;
      let variance = 0;
      
      switch (eventTemplate.unit) {
        case "%":
          baseValue = eventTemplate.event.includes("Interest Rate") ? 4.5 + (random() - 0.5) * 2 :
                      eventTemplate.event.includes("CPI") ? 2.5 + (random() - 0.5) * 2 :
                      eventTemplate.event.includes("GDP") ? 2.0 + (random() - 0.5) * 3 :
                      eventTemplate.event.includes("Unemployment") ? 4.0 + (random() - 0.5) * 2 :
                      0.3 + (random() - 0.5) * 1;
          variance = 0.5;
          break;
        case "K":
          baseValue = eventTemplate.event.includes("Non-Farm") ? 180 + (random() - 0.5) * 100 :
                      eventTemplate.event.includes("Jobless") ? 220 + (random() - 0.5) * 50 :
                      eventTemplate.event.includes("Employment") ? 25 + (random() - 0.5) * 40 :
                      eventTemplate.event.includes("Home") ? 650 + (random() - 0.5) * 100 :
                      50 + (random() - 0.5) * 30;
          variance = 20;
          break;
        case "M":
          baseValue = 4.5 + (random() - 0.5) * 1;
          variance = 0.3;
          break;
        case "B":
          baseValue = 3.0 + (random() - 0.5) * 2;
          variance = 0.5;
          break;
        case "T":
          baseValue = 0.5 + (random() - 0.5) * 0.5;
          variance = 0.1;
          break;
        default:
          baseValue = 50 + (random() - 0.5) * 20;
          variance = 5;
      }
      
      const previousValue = generateEventValue(baseValue, eventTemplate.unit, variance, random);
      const forecastValue = generateEventValue(baseValue, eventTemplate.unit, variance * 0.5, random);
      const isPast = new Date(`${dateStr}T${time}:00`) < new Date();
      const actualValue = isPast ? generateEventValue(baseValue, eventTemplate.unit, variance * 0.8, random) : null;
      
      events.push({
        id: `${dateStr}-${time}-${eventTemplate.currency}-${idx}`,
        date: dateStr,
        time,
        country: eventTemplate.country,
        currency: eventTemplate.currency,
        event: eventTemplate.event,
        impact: eventTemplate.impact,
        actual: actualValue,
        forecast: forecastValue,
        previous: previousValue,
        unit: eventTemplate.unit,
      });
    });
  }
  
  events.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}:00`);
    const dateTimeB = new Date(`${b.date}T${b.time}:00`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
  
  return events;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to dates are required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const events = generateEventsForDateRange(fromDate, toDate);

    return NextResponse.json({
      success: true,
      data: events,
      meta: {
        from,
        to,
        count: events.length,
        source: 'simulated',
      },
    });
  } catch (error) {
    console.error('Economic calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
