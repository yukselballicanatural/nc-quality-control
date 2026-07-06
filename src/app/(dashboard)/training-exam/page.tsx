export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainingExamForm } from '@/components/training-exam/TrainingExamForm'

export default async function TrainingExamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'consultant' || profile.role === 'manager') {
    redirect('/dashboard')
  }

  const { data: consultants } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'consultant')
    .eq('is_active', true)
    .order('full_name')

  return (
    <TrainingExamForm
      consultants={consultants ?? []}
      evaluatorId={profile.id}
    />
  )
}
