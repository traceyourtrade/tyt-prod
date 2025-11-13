type Props = {
  title?: string
  subtitle?: string
  children?: React.ReactNode
}

export default function OVChartCard({ title, subtitle, children }: Props) {
  return (
    <div className="bg-[#1e1e1e] rounded-xxl shadow-md p-6 flex-1 min-w-[300px] border border-[#333]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white m-0">{title}</h3>
        {subtitle && <p className="text-sm uppercase text-gray-400 m-0">{subtitle}</p>}
        <span className="ml-auto text-gray-400 text-sm">ⓘ</span>
      </div>
      <div className="h-[300px] w-full bg-[1e1e1e]  overflow-hidden">
        {children}
      </div>
    </div>
  )
}
