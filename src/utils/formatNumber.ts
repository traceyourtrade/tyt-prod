export function formatCompactNumber(value: number, decimals: number = 2): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(decimals) + 'B';
  }
  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + 'M';
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + 'K';
  }
  
  return value.toFixed(decimals);
}

export function formatCurrency(value: number, decimals: number = 2): string {
  const formatted = formatCompactNumber(value, decimals);
  const prefix = value >= 0 ? '+$' : '-$';
  return prefix + formatted.replace('-', '');
}

export function formatPnL(value: number, decimals: number = 2): string {
  const formatted = formatCompactNumber(value, decimals);
  if (value >= 0) {
    return '+' + formatted;
  }
  return formatted;
}
