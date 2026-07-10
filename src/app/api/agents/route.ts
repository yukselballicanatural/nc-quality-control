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

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return {
    first_name: parts[0] ?? fullName.trim(),
    last_name: parts.slice(1).join(' ') || null,
  }
}

function buildRole(kind: 'leader' | 'member', fullName: string, teamLeaderName: string) {
  return kind === 'leader' ? `Team Leader - ${fullName.trim()}` : `${teamLeaderName.trim()} Team`
}

async function getAuthorizedProfile() {
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
  if (!profile || !canManageUsers(profile)) return null
  return profile
}

export async function POST(request: Request) {
  const profile = await getAuthorizedProfile()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { fullName, kind, teamLeaderName, region } = await request.json()
  if (typeof fullName !== 'string' || !fullName.trim()) {
    return NextResponse.json({ error: 'Ad soyad gerekli' }, { status: 400 })
  }
  if (kind !== 'leader' && kind !== 'member') {
    return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })
  }
  if (kind === 'member' && (typeof teamLeaderName !== 'string' || !teamLeaderName.trim())) {
    return NextResponse.json({ error: 'Takım lideri gerekli' }, { status: 400 })
  }
  if (typeof region !== 'string' || !region.trim()) {
    return NextResponse.json({ error: 'Region gerekli' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const role = buildRole(kind, fullName, teamLeaderName ?? '')

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agents`, {
    method: 'POST',
    headers: { ...adminHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      id,
      ...splitName(fullName),
      role,
      region: region.trim(),
      synced_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: 500 })
  }

  await writeAuditLog({
    actor: profile,
    action: 'agent_created',
    entityType: 'agent',
    entityId: id,
    metadata: { full_name: fullName.trim(), role, region: region.trim() },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const profile = await getAuthorizedProfile()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { id, fullName, kind, teamLeaderName, region } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Geçersiz kayıt' }, { status: 400 })
  }
  if (typeof fullName !== 'string' || !fullName.trim()) {
    return NextResponse.json({ error: 'Ad soyad gerekli' }, { status: 400 })
  }
  if (kind !== 'leader' && kind !== 'member') {
    return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 })
  }
  if (kind === 'member' && (typeof teamLeaderName !== 'string' || !teamLeaderName.trim())) {
    return NextResponse.json({ error: 'Takım lideri gerekli' }, { status: 400 })
  }
  if (typeof region !== 'string' || !region.trim()) {
    return NextResponse.json({ error: 'Region gerekli' }, { status: 400 })
  }

  const role = buildRole(kind, fullName, teamLeaderName ?? '')

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agents?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      ...splitName(fullName),
      role,
      region: region.trim(),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: 500 })
  }

  await writeAuditLog({
    actor: profile,
    action: 'agent_updated',
    entityType: 'agent',
    entityId: id,
    metadata: { full_name: fullName.trim(), role, region: region.trim() },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const profile = await getAuthorizedProfile()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { id } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Geçersiz kayıt' }, { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agents?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }

  await writeAuditLog({
    actor: profile,
    action: 'agent_deleted',
    entityType: 'agent',
    entityId: id,
    metadata: {},
  })

  return NextResponse.json({ success: true })
}
