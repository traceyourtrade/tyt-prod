import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Trade {
  time: string;
  Profit: number;
  Item: string;
}

interface GradientAreaChartProps {
  data: Trade[];
}

const GradientAreaChart = ({ data }: GradientAreaChartProps) => {
  const dataa = [
    { time: '', value: 0, Item: '' }
  ];

  let cumulativeValue = 0;

  data.forEach(trade => {
    const [hours, minutes] = trade.time.split(':');
    const shortTime = `${hours}:${minutes}`;

    cumulativeValue += trade.Profit;

    dataa.push({
      time: shortTime,
      value: parseFloat(cumulativeValue.toFixed(2)),
      Item: trade.Item
    });
  });

  const checkValueStatus = (data: { value: number }[]) => {
    const hasPositive = data.some(d => d.value > 0);
    const hasNegative = data.some(d => d.value < 0);

    if (hasPositive && hasNegative) return "both";
    if (hasPositive) return true;
    if (hasNegative) return false;

    return "both";
  };

  const status = checkValueStatus(dataa);

  const calculateOffset = (data: { value: number }[]) => {
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue >= 0) return "0%";
    if (maxValue <= 0) return "100%";

    return `${(maxValue / (maxValue - minValue)) * 100}%`;
  };

  const zeroOffset = calculateOffset(dataa);

  return (
    <div className="w-full h-[200px]">
      {status === "both" ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dataa} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="strictGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                <stop offset={zeroOffset} stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
                <stop offset={zeroOffset} stopColor="rgba(179, 22, 22, 0.08)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgb(239, 92, 92)" stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255, 255, 255, 0.51)" 
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.51)"
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
              tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
              interval={0}
              minTickGap={2}
              tickCount={7}
            />

            <Tooltip contentStyle={{ backgroundColor: "#222", color: "white", border: "1px solid white" }} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="white"
              fill="url(#strictGradient)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : status === true ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dataa} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255, 255, 255, 0.51)" 
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.51)"
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
              tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
              interval={0}
              minTickGap={2}
              tickCount={10}
            />

            <Tooltip contentStyle={{ backgroundColor: "#222", color: "white", border: "1px solid white" }} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="white"
              fill="url(#positiveGradient)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : status === false ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dataa} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 92, 92, 0.35)" stopOpacity={1} />
                <stop offset="100%" stopColor="rgba(179, 22, 22, 0.7)" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255, 255, 255, 0.51)" 
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.51)"
              tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
              tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
              interval={0}
              minTickGap={2}
              tickCount={10}
            />

            <Tooltip contentStyle={{ backgroundColor: "#222", color: "white", border: "1px solid white" }} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="white"
              fill="url(#negativeGradient)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

export default GradientAreaChart;