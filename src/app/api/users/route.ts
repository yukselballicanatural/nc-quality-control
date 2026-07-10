import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/access-control'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const VALID_ROLES = new Set(['quality_team', 'team_leader', 'manager', 'consultant'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function validateCreateUser(input: {
  full_name?: unknown
  email?: unknown
  password?: unknown
  role?: unknown
}) {
  const fullName = typeof input.full_name === 'string' ? input.full_name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const role = typeof input.role === 'string' ? input.role : ''

  if (!fullName) return 'Ad soyad gerekli'
  if (!EMAIL_RE.test(email)) return 'Geçerli bir e-posta girin'
  if (!password || password.length < 6) return 'Şifre en az 6 karakter olmalı'
  if (!VALID_ROLES.has(role)) return 'Geçersiz rol'
  return null
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

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(caller)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { full_name, email, password, role, team_id } = await request.json()
  const validationError = validateCreateUser({ full_name, email, password, role })
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  // 1. Auth kullanıcı oluştur
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    }),
  })

  const authBody = await authRes.json()
  if (!authRes.ok) {
    return NextResponse.json(
      { error: authBody.message ?? 'Kullanıcı oluşturulamadı' },
      { status: 400 }
    )
  }

  const userId = authBody.id

  // 2. Profile upsert — service key ile RLS bypass
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...adminHeaders(), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: userId,
      full_name,
      email,
      role,
      team_id: team_id || null,
      is_active: true,
    }),
  })

  if (!profRes.ok) {
    const profBody = await profRes.text()
    return NextResponse.json({ error: profBody }, { status: 500 })
  }

  await writeAuditLog({
    actor: caller,
    action: 'user_created',
    entityType: 'user',
    entityId: userId,
    metadata: { full_name, email, role, team_id: team_id || null },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(caller)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { id, password, ...updates } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 400 })
  }

  // Şifre sıfırlama
  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const body = await res.json()
      return NextResponse.json({ error: body.message ?? 'Şifre güncellenemedi' }, { status: 500 })
    }
    await writeAuditLog({
      actor: caller,
      action: 'user_password_reset',
      entityType: 'user',
      entityId: id,
      metadata: {},
    })
    return NextResponse.json({ success: true })
  }

  // Profil güncelleme
  const allowedUpdates: Record<string, unknown> = {}
  if (typeof updates.full_name === 'string') allowedUpdates.full_name = updates.full_name.trim()
  if (typeof updates.email === 'string' && EMAIL_RE.test(updates.email.trim())) allowedUpdates.email = updates.email.trim().toLowerCase()
  if (typeof updates.role === 'string' && VALID_ROLES.has(updates.role)) allowedUpdates.role = updates.role
  if (typeof updates.team_id === 'string' || updates.team_id === null) allowedUpdates.team_id = updates.team_id || null
  if (typeof updates.is_active === 'boolean') allowedUpdates.is_active = updates.is_active
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(allowedUpdates),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: 500 })
  }

  await writeAuditLog({
    actor: caller,
    action: 'user_updated',
    entityType: 'user',
    entityId: id,
    metadata: allowedUpdates,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(caller)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!hasAdminConfig()) {
    return NextResponse.json({ error: 'Supabase admin configuration is missing' }, { status: 500 })
  }

  const { id } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 400 })
  }

  // Auth kullanıcıyı sil (profile cascade'de silinir)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })

  if (!res.ok) {
    const body = await res.text()
    // Foreign key hatası — değerlendirme kaydı var
    if (body.includes('foreign key') || body.includes('violates')) {
      return NextResponse.json(
        { error: 'Bu kullanıcının değerlendirme kayıtları var, silinemez. Pasife alabilirsiniz.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Kullanıcı silinemedi' }, { status: 500 })
  }

  // Profile tablosundan da sil (cascade yoksa)
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })

  await writeAuditLog({
    actor: caller,
    action: 'user_deleted',
    entityType: 'user',
    entityId: id,
    metadata: {},
  })

  return NextResponse.json({ success: true })
}
