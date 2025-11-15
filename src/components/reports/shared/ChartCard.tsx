type Props = {
  title?: string
  children?: React.ReactNode
  className?: string
  subtitle?: string
}

export default function ChartCard({ title, children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl shadow-md p-4 bg-white dark:bg-slate-800 ${className}`}>
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <div>{children}</div>
    </div>
  )
}
