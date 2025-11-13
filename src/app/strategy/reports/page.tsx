import StrategyMain from "@/components/strategy/StrategyMain"

export const metadata = {
  title: 'Strategy - Report',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="w-full">
        <StrategyMain />
      </div>
    </main>
  )
}