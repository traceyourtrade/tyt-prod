import ReportsMain from '@/components/reports/ReportsMain'

export const metadata = {
  title: 'Reports - Day Time Report',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="w-full">
        <ReportsMain />
      </div>
    </main>
  )
}
