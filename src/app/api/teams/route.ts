import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/access-control'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  }
}

function hasAdminConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single()
  if (!profile || !canManageUsers(profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { name } = await request.json()
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Takım adı gerekli' }, { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/teams`, {
    method: 'POST',
    headers: { ...adminHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ name: name.trim() }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: 500 })
  }

  const createdTeams = await res.json().catch(() => []) as Array<{ id?: string; name?: string }>
  await writeAuditLog({
    actor: profile,
    action: 'team_created',
    entityType: 'team',
    entityId: createdTeams[0]?.id ?? null,
    metadata: { name: name.trim() },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single()
  if (!profile || !canManageUsers(profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { id } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Geçersiz takım' }, { status: 400 })
  }

  // Üyesi olan takımı silme
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Bu takımda ${count} üye var. Önce üyeleri başka takıma taşıyın.` },
      { status: 409 }
    )
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Takım silinemedi' }, { status: 500 })
  }

  await writeAuditLog({
    actor: profile,
    action: 'team_deleted',
    entityType: 'team',
    entityId: id,
    metadata: {},
  })

  return NextResponse.json({ success: true })
}
