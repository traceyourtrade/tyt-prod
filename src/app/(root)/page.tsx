import DashboardMain from "@/components/dashboard/DashboardMain"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Dashboard',
}
export default async function Page() {
    const cookiesStore= await cookies();
    const authToken=cookiesStore.get('authToken')?.value;
    if(!authToken){
        redirect('/login');
    }
    

  return (
    <main className="min-h-screen">
      <div className="w-full">
        <DashboardMain />
      </div>
    </main>
  )
}