import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function adminHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  }
}

async function getCallerProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single()

  return profile
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!SERVICE_KEY || !SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  if (!['quality_team', 'manager', 'team_leader'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const examRes = await fetch(
    `${SUPABASE_URL}/rest/v1/training_exams?id=eq.${encodeURIComponent(params.id)}&select=id,evaluator_id,consultant_name,total_score,level,passed`,
    { headers: adminHeaders(), cache: 'no-store' }
  )

  if (!examRes.ok) {
    const body = await examRes.text()
    return NextResponse.json({ error: body || 'Exam result could not be checked' }, { status: 500 })
  }

  const exams = await examRes.json() as Array<{ id: string; evaluator_id: string; consultant_name?: string | null; total_score?: number; level?: string; passed?: boolean }>
  const exam = exams[0]
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (caller.role !== 'manager' && exam.evaluator_id !== caller.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/training_exams?id=eq.${encodeURIComponent(params.id)}`,
    {
      method: 'DELETE',
      headers: {
        ...adminHeaders(),
        Prefer: 'return=representation',
      },
    }
  )

  if (!deleteRes.ok) {
    const body = await deleteRes.text()
    return NextResponse.json({ error: body || 'Exam result could not be deleted' }, { status: 500 })
  }

  await writeAuditLog({
    actor: caller,
    action: 'training_exam_deleted',
    entityType: 'training_exam',
    entityId: params.id,
    metadata: {
      full_name: exam.consultant_name ?? null,
      score: exam.total_score ?? null,
      level: exam.level ?? null,
      passed: exam.passed ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
