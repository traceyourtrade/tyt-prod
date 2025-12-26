import PlaybookMain from "@/components/playbook/PlaybookMain"
import SubscriptionGate from "@/components/subscription/SubscriptionGate"

export const metadata = {
  title: 'Playbook',
}

export default function Page() {
  return (
    <SubscriptionGate 
      featureName="Playbook" 
      featureDescription="Build your winning strategy playbook with AI-powered pattern detection and trade setup analysis."
    >
      <main className="min-h-screen bg-background text-foreground">
        <PlaybookMain />
      </main>
    </SubscriptionGate>
  )
}
