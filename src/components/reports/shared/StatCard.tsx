type Props = {
  label: string
  value: string | number
  delta?: string | number
}

export default function StatCard({ label, value, delta }: Props) {
  return (
    <div className="rounded-2xl shadow-md p-4 bg-white dark:bg-slate-800">
      <div className="text-sm text-slate-500 dark:text-slate-300">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {delta !== undefined && <div className="text-sm text-slate-400">{delta}</div>}
    </div>
  )
}
