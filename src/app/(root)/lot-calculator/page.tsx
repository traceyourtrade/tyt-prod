import LotCalculatorMain from "@/components/lot-calculator/LotCalculatorMain"

export const metadata = {
  title: 'Lot Size Calculator',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <LotCalculatorMain />
    </main>
  )
}
