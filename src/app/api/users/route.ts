import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
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
    .select('id, role')
    .eq('id', user.id)
    .single()
  return profile
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['quality_team', 'manager'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { full_name, email, password, role, team_id } = await request.json()

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

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['quality_team', 'manager'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, password, ...updates } = await request.json()

  // Şifre sıfırlama
  if (password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const body = await res.json()
      return NextResponse.json({ error: body.message ?? 'Şifre güncellenemedi' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  // Profil güncelleme
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: body }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const caller = await getCallerProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['quality_team', 'manager'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()

  // Auth kullanıcıyı sil (profile cascade'de silinir)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
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
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })

  return NextResponse.json({ success: true })
}
