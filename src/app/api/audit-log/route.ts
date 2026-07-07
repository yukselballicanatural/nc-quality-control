import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const ALLOWED_ACTIONS = new Set([
  'login',
  'logout',
  'evaluation_created',
  'evaluation_updated',
  'training_exam_created',
  'training_exam_updated',
])

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ success: true })

  const body = await request.json().catch(() => ({}))
  const action = typeof body.action === 'string' ? body.action : ''

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  await writeAuditLog({
    actor: { id: user.id, email: profile?.email ?? user.email ?? null },
    action,
    entityType: typeof body.entityType === 'string' ? body.entityType : 'system',
    entityId: typeof body.entityId === 'string' ? body.entityId : null,
    metadata: {
      ...(typeof body.metadata === 'object' && body.metadata ? body.metadata : {}),
      actor_name: profile?.full_name ?? null,
      actor_role: profile?.role ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
