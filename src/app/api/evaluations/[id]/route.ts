import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRestrictedQualityUser } from '@/lib/access-control'
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('evaluations')
    .select(
      `
      *,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name),
      team_leader:profiles!evaluations_team_leader_id_fkey(id, full_name),
      team:teams(id, name),
      evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name),
      criteria_scores(*),
      channel_checks(*),
      critical_errors(*)
      `
    )
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (profile.role === 'consultant' && data.consultant_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (isRestrictedQualityUser(profile) && data.evaluator_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (profile.role === 'team_leader' && profile.team_id && data.team_id !== profile.team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, team_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['quality_team', 'manager', 'team_leader'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!SERVICE_KEY || !SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const evalRes = await fetch(
    `${SUPABASE_URL}/rest/v1/evaluations?id=eq.${encodeURIComponent(params.id)}&select=id,evaluator_id,team_id,customer_name,final_score,status`,
    { headers: adminHeaders(), cache: 'no-store' }
  )

  if (!evalRes.ok) {
    const body = await evalRes.text()
    return NextResponse.json({ error: body || 'Evaluation could not be checked' }, { status: 500 })
  }

  const evaluations = await evalRes.json() as Array<{ id: string; evaluator_id: string; team_id: string | null; customer_name?: string; final_score?: number; status?: string }>
  const evaluation = evaluations[0]
  if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (isRestrictedQualityUser(profile)) {
    if (!evaluation || evaluation.evaluator_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (profile.role === 'team_leader') {
    if (!profile.team_id || evaluation.team_id !== profile.team_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/evaluations?id=eq.${encodeURIComponent(params.id)}`,
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
    return NextResponse.json({ error: body || 'Evaluation could not be deleted' }, { status: 500 })
  }

  await writeAuditLog({
    actor: profile,
    action: 'evaluation_deleted',
    entityType: 'evaluation',
    entityId: params.id,
    metadata: {
      customer: evaluation.customer_name ?? null,
      score: evaluation.final_score ?? null,
      status: evaluation.status ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
