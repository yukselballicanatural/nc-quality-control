import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/Sidebar'
import { NavigationProgress } from '@/components/ui/NavigationProgress'
import { getCurrentProfile } from '@/lib/current-profile'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, supabase } = await getCurrentProfile()

  if (!user) {
    redirect('/login')
  }

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <>
      <NavigationProgress />
      <DashboardShell profile={profile}>{children}</DashboardShell>
    </>
  )
}
