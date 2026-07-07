export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { canTakeTrainingExam } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'

const TrainingExamForm = nextDynamic(
  () => import('@/components/training-exam/TrainingExamForm').then(m => m.TrainingExamForm),
  { ssr: false }
)

export default async function TrainingExamPage() {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')

  if (!profile) redirect('/login')

  if (!canTakeTrainingExam(profile)) {
    redirect('/dashboard')
  }

  const consultantsResult = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'consultant')
    .eq('is_active', true)
    .order('full_name')

  return (
    <TrainingExamForm
      consultants={consultantsResult.data ?? []}
      evaluatorId={profile.id}
      evaluatorName={profile.full_name}
    />
  )
}
