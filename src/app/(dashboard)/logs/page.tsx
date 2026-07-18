export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight, FileClock, Info } from 'lucide-react'
import { canSeeAdminLogs } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'
import type { Language } from '@/types'

type AuditLogRow = {
  id: string
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PAGE_SIZE = 100

function formatDate(value: string, lang: Language) {
  return new Date(value).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ACTION_LABELS: Record<Language, Record<string, string>> = {
  tr: {
    login: 'Giriş',
    logout: 'Çıkış',
    user_created: 'Kullanıcı eklendi',
    user_updated: 'Kullanıcı güncellendi',
    user_deleted: 'Kullanıcı silindi',
    user_password_reset: 'Şifre sıfırlandı',
    team_created: 'Region eklendi',
    team_deleted: 'Region silindi',
    agent_created: 'Danışman/takım lideri eklendi',
    agent_updated: 'Danışman/takım lideri güncellendi',
    agent_deleted: 'Danışman/takım lideri silindi',
    evaluation_created: 'Değerlendirme eklendi',
    evaluation_updated: 'Değerlendirme güncellendi',
    evaluation_deleted: 'Değerlendirme silindi',
    training_exam_created: 'Sınav sonucu eklendi',
    training_exam_updated: 'Sınav sonucu güncellendi',
    training_exam_deleted: 'Sınav sonucu silindi',
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    user_created: 'User created',
    user_updated: 'User updated',
    user_deleted: 'User deleted',
    user_password_reset: 'Password reset',
    team_created: 'Region created',
    team_deleted: 'Region deleted',
    agent_created: 'Consultant/team leader created',
    agent_updated: 'Consultant/team leader updated',
    agent_deleted: 'Consultant/team leader deleted',
    evaluation_created: 'Evaluation created',
    evaluation_updated: 'Evaluation updated',
    evaluation_deleted: 'Evaluation deleted',
    training_exam_created: 'Exam result created',
    training_exam_updated: 'Exam result updated',
    training_exam_deleted: 'Exam result deleted',
  },
}

function actionLabel(action: string, lang: Language) {
  return ACTION_LABELS[lang][action] ?? action
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) return '-'
  const values = [
    metadata.full_name,
    metadata.email,
    metadata.role,
    metadata.name,
    metadata.status,
    metadata.score,
  ].filter(Boolean)

  return values.length > 0 ? values.join(' · ') : '-'
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw ?? '1')
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

function parseTotal(contentRange: string | null) {
  if (!contentRange) return 0
  const total = contentRange.split('/')[1]
  if (!total || total === '*') return 0
  const parsed = Number(total)
  return Number.isFinite(parsed) ? parsed : 0
}

async function getLogs(page: number) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { logs: [] as AuditLogRow[], totalCount: 0, setupRequired: true }
  }

  const offset = (page - 1) * PAGE_SIZE
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    return { logs: [] as AuditLogRow[], totalCount: 0, setupRequired: true }
  }

  return {
    logs: await res.json() as AuditLogRow[],
    totalCount: parseTotal(res.headers.get('content-range')),
    setupRequired: false,
  }
}

function pageHref(page: number) {
  return `/logs?page=${page}`
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams?: { page?: string | string[] }
}) {
  const { user, profile } = await getCurrentProfile()

  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  if (!canSeeAdminLogs(profile)) redirect('/dashboard')

  const cookieStore = await cookies()
  const lang: Language = cookieStore.get('lang')?.value === 'en' ? 'en' : 'tr'
  const L = (tr: string, en: string) => (lang === 'en' ? en : tr)

  const currentPage = parsePage(searchParams?.page)
  const { logs, totalCount, setupRequired } = await getLogs(currentPage)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(safePage * PAGE_SIZE, totalCount)

  if (currentPage !== safePage) redirect(pageHref(safePage))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">{L('Sistem Logları', 'System Logs')}</h1>
        <p className="text-sm text-gray-400">
          {L(
            'Giriş, çıkış, ekleme, güncelleme ve silme işlemlerinin tüm kayıtları. Her sayfada 100 kayıt gösterilir.',
            'A record of all login, logout, create, update and delete actions. 100 records shown per page.'
          )}
        </p>
      </div>

      {setupRequired && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">{L('Log tablosu henüz kurulmamış görünüyor.', 'The log table does not appear to be set up yet.')}</p>
              <p className="mt-1">
                {L('Supabase SQL Editor içinde', 'Run the SQL in')} <span className="font-mono">scripts/create-audit-logs.sql</span> {L("dosyasındaki SQL'i çalıştırınca loglar burada görünür.", 'in the Supabase SQL Editor and the logs will appear here.')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
              <FileClock className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-500">{L('Henüz log kaydı yok.', 'No log records yet.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-3 text-left font-semibold text-gray-500">{L('Tarih', 'Date')}</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500">{L('İşlem', 'Action')}</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500">{L('Kullanıcı', 'User')}</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500">{L('Kayıt', 'Record')}</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500">{L('Detay', 'Details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">{formatDate(log.created_at, lang)}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="inline-flex rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-xs font-bold text-[#1B4332]">
                        {actionLabel(log.action, lang)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-700">{log.actor_email ?? '-'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                      {log.entity_type}
                      {log.entity_id ? <span className="text-gray-300"> · {log.entity_id.slice(0, 8)}</span> : null}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{metadataSummary(log.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!setupRequired && totalCount > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row">
          <p className="text-gray-400">
            {lang === 'en'
              ? `${totalCount} records · showing ${startIndex}-${endIndex}`
              : `${totalCount} kayıt · ${startIndex}-${endIndex} arası gösteriliyor`}
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={pageHref(Math.max(1, safePage - 1))}
              aria-disabled={safePage <= 1}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 font-semibold transition-colors ${
                safePage <= 1
                  ? 'pointer-events-none text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              {L('Önceki', 'Previous')}
            </Link>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
              const start = Math.max(1, Math.min(safePage - 3, totalPages - 6))
              const page = start + index
              if (page > totalPages) return null

              return (
                <Link
                  key={page}
                  href={pageHref(page)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors ${
                    page === safePage
                      ? 'bg-[#1B4332] text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page}
                </Link>
              )
            })}

            <Link
              href={pageHref(Math.min(totalPages, safePage + 1))}
              aria-disabled={safePage >= totalPages}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 font-semibold transition-colors ${
                safePage >= totalPages
                  ? 'pointer-events-none text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {L('Sonraki', 'Next')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
