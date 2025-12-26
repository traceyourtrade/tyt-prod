import StrategyMain from "@/components/strategy/StrategyMain"
import SubscriptionGate from "@/components/subscription/SubscriptionGate"

export const metadata = {
  title: 'Strategies',
}

export default function Page() {
  return (
    <SubscriptionGate 
      featureName="Strategies" 
      featureDescription="Get detailed strategy analytics, compare performance across strategies, and optimize your trading approach."
    >
      <main className="min-h-screen bg-background text-foreground">
        <StrategyMain />
      </main>
    </SubscriptionGate>
  )
}