export function formatCompactNumber(value: number, decimals: number = 2): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  const thresholds: [number, string][] = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ];
  
  for (const [threshold, suffix] of thresholds) {
    if (absValue >= threshold) {
      const scaled = absValue / threshold;
      const rounded = parseFloat(scaled.toFixed(decimals));
      
      if (rounded >= 1000) {
        const nextThreshold = threshold * 1000;
        const nextSuffix = suffix === 'K' ? 'M' : suffix === 'M' ? 'B' : 'T';
        const nextScaled = absValue / nextThreshold;
        let formatted = nextScaled.toFixed(decimals);
        formatted = formatted.replace(/\.?0+$/, '');
        return sign + formatted + nextSuffix;
      }
      
      let formatted = rounded.toFixed(decimals);
      formatted = formatted.replace(/\.?0+$/, '');
      return sign + formatted + suffix;
    }
  }
  
  let result = absValue.toFixed(decimals);
  result = result.replace(/\.?0+$/, '');
  return sign + result;
}

export function formatCurrency(value: number, decimals: number = 2): string {
  const formatted = formatCompactNumber(Math.abs(value), decimals);
  const prefix = value >= 0 ? '+$' : '-$';
  return prefix + formatted;
}

export function formatPnL(value: number, decimals: number = 2): string {
  const absFormatted = formatCompactNumber(Math.abs(value), decimals);
  if (value >= 0) {
    return '+' + absFormatted;
  }
  return '-' + absFormatted;
}
