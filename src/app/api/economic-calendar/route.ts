import { NextRequest, NextResponse } from 'next/server';

interface FinnhubEconomicEvent {
  actual?: number | null;
  country: string;
  estimate?: number | null;
  event: string;
  impact: string;
  prev?: number | null;
  time: string;
  unit: string;
}

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

const countryToCurrency: Record<string, string> = {
  'US': 'USD',
  'EU': 'EUR',
  'GB': 'GBP',
  'JP': 'JPY',
  'AU': 'AUD',
  'CA': 'CAD',
  'CH': 'CHF',
  'NZ': 'NZD',
  'CN': 'CNY',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
};

const impactToLevel: Record<string, number> = {
  'high': 3,
  'medium': 2,
  'low': 1,
};

function formatValue(value: number | null | undefined, unit: string): string | null {
  if (value === null || value === undefined) return null;
  if (unit === '%') return `${value}%`;
  if (unit === 'B') return `${value}B`;
  if (unit === 'M') return `${value}M`;
  if (unit === 'K') return `${value}K`;
  return value.toString();
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

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Finnhub API key is not configured' },
        { status: 500 }
      );
    }

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Finnhub API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch economic calendar data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const events: FinnhubEconomicEvent[] = data.economicCalendar || [];

    const formattedEvents: EconomicEvent[] = events.map((event, index) => {
      const [date, time] = event.time ? event.time.split(' ') : ['', ''];
      const country = event.country || '';
      const currency = countryToCurrency[country] || country;
      
      return {
        id: `${event.time}-${event.event}-${index}`,
        date: date || '',
        time: time || '',
        country,
        currency,
        event: event.event || '',
        impact: impactToLevel[event.impact?.toLowerCase()] || 1,
        actual: formatValue(event.actual, event.unit),
        forecast: formatValue(event.estimate, event.unit),
        previous: formatValue(event.prev, event.unit),
        unit: event.unit || '',
      };
    });

    formattedEvents.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`);
      const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    return NextResponse.json({
      success: true,
      data: formattedEvents,
      meta: {
        from,
        to,
        count: formattedEvents.length,
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
