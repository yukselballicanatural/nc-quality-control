/**
 * Seed script — 4 test kullanıcısı oluşturur (her rol için 1 tane)
 * Çalıştır: node scripts/seed-users.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))
  if (!match) throw new Error(`.env.local içinde ${key} bulunamadı`)
  return match[1].trim()
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (SERVICE_ROLE_KEY === 'BURAYA_YENI_SECRET_KEY_GEL') {
  console.error('❌  Service role key güncellenmemiş!')
  process.exit(1)
}

const USERS = [
  { email: 'kalite@naturalclinic.com',        password: 'NaturalQC2025!', full_name: 'Kalite Ekibi',   role: 'quality_team' },
  { email: 'takim.lideri@naturalclinic.com',  password: 'NaturalQC2025!', full_name: 'Takım Lideri',   role: 'team_leader'  },
  { email: 'yonetici@naturalclinic.com',      password: 'NaturalQC2025!', full_name: 'Yönetici',       role: 'manager'      },
  { email: 'danisman@naturalclinic.com',      password: 'NaturalQC2025!', full_name: 'Test Danışman',  role: 'consultant'   },
]

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
}

console.log('🚀  Kullanıcılar oluşturuluyor...\n')

for (const user of USERS) {
  // 1. Auth kullanıcısı oluştur
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    }),
  })

  const authBody = await authRes.json()

  if (!authRes.ok) {
    const msg = authBody?.msg || authBody?.message || authBody?.error_description || JSON.stringify(authBody)
    if (msg?.includes('already been registered') || msg?.includes('already exists')) {
      console.log(`⚠️   ${user.email} zaten kayıtlı, atlandı.`)
      continue
    }
    console.error(`❌  ${user.email} auth hatası [${authRes.status}]:`, msg)
    continue
  }

  const userId = authBody.id
  if (!userId) {
    console.error(`❌  ${user.email} — user id alınamadı:`, JSON.stringify(authBody))
    continue
  }

  // 2. Profiles tablosuna ekle
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: true,
    }),
  })

  if (!profRes.ok) {
    const profBody = await profRes.text()
    console.error(`❌  ${user.email} profil hatası [${profRes.status}]:`, profBody)
    continue
  }

  console.log(`✅  ${user.role.padEnd(14)} →  ${user.email}`)
}

console.log('\n🎉  Tamamlandı!')
console.log('\n📋  Giriş bilgileri (şifre hepsi aynı: NaturalQC2025!)\n')
for (const u of USERS) {
  console.log(`   ${u.role.padEnd(14)} →  ${u.email}`)
}
