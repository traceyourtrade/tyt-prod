import PlaybookMain from "@/components/playbook/PlaybookMain"

export const metadata = {
  title: 'Playbook',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PlaybookMain />
    </main>
  )
}
