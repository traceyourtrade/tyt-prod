import StrategyMain from "@/components/strategy/StrategyMain"

export const metadata = {
  title: 'Strategies',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <StrategyMain />
    </main>
  )
}