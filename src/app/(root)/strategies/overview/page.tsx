import StrategyMain from "@/components/strategy/StrategyMain"

export const metadata = {
  title: 'Strategy - Overview',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full">
        <StrategyMain />
      </div>
    </main>
  )
}
