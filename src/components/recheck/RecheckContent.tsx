'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Phone, ArrowUpRight, CalendarClock, Clock,
  CheckCircle2, AlertTriangle, Inbox, X, Users, Check,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { DatePicker } from '@/components/ui/DatePicker'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/supabase'
import type { RecheckItem } from '@/app/(dashboard)/recheck/page'

interface Props {
  items: RecheckItem[]
  currentUserId: string
  role: UserRole
}

// ─── Helpers ──────────────────────────────────────────────────────

function dayDiff(dateStr: string) {
  const a = new Date(); a.setHours(0,0,0,0)
  const b = new Date(dateStr); b.setHours(0,0,0,0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700','bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700','bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700','bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700','bg-fuchsia-100 text-fuchsia-700',
]
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function stageLabel(id: string | null) {
  if (!id) return null
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function scoreStyle(s: number) {
  if (s >= 90) return { ring:'ring-emerald-200', text:'text-emerald-700', bg:'bg-emerald-50', bar:'bg-emerald-400' }
  if (s >= 80) return { ring:'ring-blue-200',    text:'text-blue-700',   bg:'bg-blue-50',   bar:'bg-blue-400' }
  if (s >= 70) return { ring:'ring-amber-200',   text:'text-amber-700', bg:'bg-amber-50',  bar:'bg-amber-400' }
  return              { ring:'ring-red-200',     text:'text-red-700',   bg:'bg-red-50',    bar:'bg-red-400' }
}

type Filter = 'overdue' | 'today' | 'tomorrow' | 'week' | 'all' | 'done'

function matchesFilter(item: RecheckItem, f: Filter, customDate: string): boolean {
  if (f === 'done') return item.recheck_done === true
  if (item.recheck_done) return false // done items only shown in 'done' tab
  const d = dayDiff(item.dev_recheck_date)
  if (customDate) return item.dev_recheck_date === customDate
  if (f === 'overdue')  return d < 0
  if (f === 'today')    return d === 0
  if (f === 'tomorrow') return d === 1
  if (f === 'week')     return d >= 0 && d <= 7
  return true // 'all' shows pending only
}

// ─── Score circle ─────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const s = scoreStyle(score)
  const r = 20, circ = 2 * Math.PI * r
  return (
    <div className={`relative w-14 h-14 flex-shrink-0 rounded-2xl ring-2 ${s.ring} ${s.bg} flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3" className={s.text}
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className={`relative z-10 text-sm font-black tabular-nums ${s.text}`}>{score}</span>
    </div>
  )
}

// ─── Day badge ────────────────────────────────────────────────────

function DayBadge({ diff, lang }: { diff: number; lang: string }) {
  const tr = lang === 'tr'
  if (diff < 0)   return <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-500 text-white whitespace-nowrap">{Math.abs(diff)} {tr ? 'gün geçti' : 'days ago'}</span>
  if (diff === 0) return <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-orange-500 text-white whitespace-nowrap animate-pulse">{tr ? 'Bugün' : 'Today'}</span>
  if (diff === 1) return <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-white whitespace-nowrap">{tr ? 'Yarın' : 'Tomorrow'}</span>
  if (diff <= 7)  return <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#52B788] text-white whitespace-nowrap">{tr ? `${diff} gün sonra` : `in ${diff} days`}</span>
  return <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">{tr ? `${diff} gün sonra` : `in ${diff} days`}</span>
}

// ─── Recheck card ─────────────────────────────────────────────────

function Card({
  item, idx, currentUserId, lang, onToggleDone,
}: {
  item: RecheckItem; idx: number; currentUserId: string; lang: string; onToggleDone: (id: string, done: boolean) => Promise<void>
}) {
  const [pending, setPending] = useState(false)
  const diff = dayDiff(item.dev_recheck_date)
  const tr = lang === 'tr'
  const isDone = item.recheck_done

  const accentCls = isDone ? 'from-emerald-400' :
    diff < 0 ? 'from-red-500' : diff === 0 ? 'from-orange-500' :
    diff === 1 ? 'from-amber-400' : diff <= 7 ? 'from-[#52B788]' : 'from-gray-200'

  const stage = stageLabel(item.lead_id)

  async function handleToggle() {
    setPending(true)
    try {
      await onToggleDone(item.id, !isDone)
    } finally {
      setPending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -4 }}
      transition={{ delay: idx * 0.04, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:shadow-black/[0.06] transition-all duration-300 overflow-hidden ${
        isDone ? 'border-emerald-200 opacity-80' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${accentCls} to-transparent`} />

      <div className="flex items-center gap-4 px-6 pt-5 pb-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm transition-all ${
          isDone ? 'bg-emerald-100 text-emerald-700' : avatarColor(item.consultant.full_name)
        }`}>
          {isDone ? <Check className="w-5 h-5" /> : initials(item.consultant.full_name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[15px] font-bold leading-tight truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {item.consultant.full_name}
            </span>
            {stage && (
              <span className="text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/8 px-2 py-0.5 rounded-full">{stage}</span>
            )}
            {isDone && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {tr ? '✓ Tamamlandı' : '✓ Done'}
              </span>
            )}
          </div>

          {/* Done bilgisi */}
          {isDone && item.doneBy && item.recheck_done_at ? (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              {item.doneBy.full_name} — {fmtDateTime(item.recheck_done_at)}
            </p>
          ) : (
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
              {item.customer_name && (
                <span className="flex items-center gap-1.5 font-semibold text-gray-600">
                  <Phone className="w-3 h-3 text-gray-400" />{item.customer_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-3 h-3 text-[#52B788]" />
                <span className="font-bold text-gray-500">{fmt(item.dev_recheck_date)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />{fmt(item.conversation_date)}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isDone && <DayBadge diff={diff} lang={lang} />}
          <ScoreCircle score={item.final_score} />

          {/* Tamamlandı butonu */}
          <button
            onClick={handleToggle}
            disabled={pending}
            title={isDone ? (tr ? 'Tamamlamayı geri al' : 'Undo completion') : (tr ? 'Kontrol edildi olarak işaretle' : 'Mark as done')}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer ${
              isDone
                ? 'bg-emerald-50 border-emerald-200 hover:bg-red-50 hover:border-red-200'
                : 'bg-gray-50 border-gray-100 hover:bg-emerald-500 hover:border-emerald-500'
            } ${pending ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isDone
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-red-400 transition-colors" />
              : <Check className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
            }
          </button>

          <Link
            href={`/evaluations/${item.id}`}
            className="w-9 h-9 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center transition-all duration-200 group-hover:bg-[#1B4332] group-hover:border-[#1B4332] flex-shrink-0"
          >
            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Right sidebar ────────────────────────────────────────────────

function Sidebar({ items, lang }: { items: RecheckItem[]; lang: string }) {
  const tr = lang === 'tr'
  const pending  = items.filter(i => !i.recheck_done)
  const done     = items.filter(i => i.recheck_done)
  const overdue  = pending.filter(i => dayDiff(i.dev_recheck_date) < 0).length
  const today    = pending.filter(i => dayDiff(i.dev_recheck_date) === 0).length
  const tomorrow = pending.filter(i => dayDiff(i.dev_recheck_date) === 1).length
  const week     = pending.filter(i => { const d = dayDiff(i.dev_recheck_date); return d >= 2 && d <= 7 }).length
  const later    = pending.filter(i => dayDiff(i.dev_recheck_date) > 7).length
  const urgent   = overdue + today
  const total    = pending.length || 1

  const avgScore = pending.length
    ? Math.round(pending.reduce((s, i) => s + i.final_score, 0) / pending.length)
    : 0
  const passing  = pending.filter(i => i.final_score >= 70).length
  const failing  = pending.filter(i => i.final_score < 70).length

  const DIST = [
    { label: tr ? 'Gecikmiş' : 'Overdue',  count: overdue,  color: 'bg-red-400',    tx: 'text-red-600' },
    { label: tr ? 'Bugün'    : 'Today',     count: today,    color: 'bg-orange-400', tx: 'text-orange-600' },
    { label: tr ? 'Yarın'    : 'Tomorrow',  count: tomorrow, color: 'bg-amber-400',  tx: 'text-amber-600' },
    { label: tr ? 'Bu Hafta' : 'This Week', count: week,     color: 'bg-[#52B788]',  tx: 'text-emerald-600' },
    { label: tr ? 'Sonrası'  : 'Later',     count: later,    color: 'bg-gray-300',   tx: 'text-gray-500' },
  ]
  const scoreS = scoreStyle(avgScore)

  return (
    <div className="w-72 flex-shrink-0 space-y-3">

      {/* Acil durum */}
      <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1, duration:0.35, ease:[0.16,1,0.3,1] }}
        className={`rounded-2xl p-5 border overflow-hidden relative ${urgent > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${urgent > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${urgent > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
          {tr ? 'Acil Durum' : 'Urgent'}
        </p>
        <div className="flex items-end gap-2">
          <p className={`text-5xl font-black tabular-nums leading-none ${urgent > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{urgent}</p>
          <p className={`text-sm font-bold mb-1 ${urgent > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {urgent > 0 ? (tr ? 'kişi bekliyor' : 'pending') : (tr ? 'Temiz!' : 'All clear!')}
          </p>
        </div>
        {urgent > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-[11px] text-red-500 font-semibold">{overdue} {tr ? 'gecikmiş' : 'overdue'} · {today} {tr ? 'bugün' : 'today'}</p>
          </div>
        )}
        {urgent === 0 && <p className="text-[11px] text-emerald-600 font-semibold mt-2">{tr ? 'Bugün acil yok 🎉' : 'Nothing urgent today 🎉'}</p>}
      </motion.div>

      {/* Tamamlananlar özeti */}
      <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15, duration:0.35, ease:[0.16,1,0.3,1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{tr ? 'Tamamlama Durumu' : 'Completion Status'}</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: items.length > 0 ? `${(done.length / items.length) * 100}%` : '0%' }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-sm font-black text-gray-700 tabular-nums">
            {items.length > 0 ? Math.round((done.length / items.length) * 100) : 0}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{done.length}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{tr ? 'Tamamlandı' : 'Done'}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-gray-700">{pending.length}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{tr ? 'Bekliyor' : 'Pending'}</p>
          </div>
        </div>
      </motion.div>

      {/* Dağılım */}
      <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2, duration:0.35, ease:[0.16,1,0.3,1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{tr ? 'Zaman Dağılımı' : 'Time Distribution'}</p>
        <div className="space-y-3">
          {DIST.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">{row.label}</span>
                <span className={`text-xs font-black ${row.tx}`}>{row.count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${row.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.count / total) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skor özeti */}
      <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.26, duration:0.35, ease:[0.16,1,0.3,1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{tr ? 'Skor Özeti' : 'Score Summary'}</p>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl ring-2 ${scoreS.ring} ${scoreS.bg} flex flex-col items-center justify-center flex-shrink-0`}>
            <span className={`text-2xl font-black tabular-nums leading-none ${scoreS.text}`}>{avgScore}</span>
            <span className={`text-[9px] font-bold opacity-50 ${scoreS.text}`}>{tr ? 'ort.' : 'avg.'}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-0.5">{tr ? 'Bekleyenlerin' : 'Pending avg.'}</p>
            <p className="text-sm font-bold text-gray-800">{tr ? 'Ortalama Skoru' : 'Average Score'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{passing}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{tr ? '≥70 Geçiyor' : '≥70 Passing'}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-red-700">{failing}</p>
            <p className="text-[10px] text-red-600 font-bold mt-0.5">{tr ? '<70 Başarısız' : '<70 Failing'}</p>
          </div>
        </div>
      </motion.div>

      {/* Toplam */}
      <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.32, duration:0.35, ease:[0.16,1,0.3,1] }}
        className="bg-[#1B4332] rounded-2xl p-5 text-white overflow-hidden relative">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#52B788]" />
          </div>
          <p className="text-xs font-black text-white/60 uppercase tracking-widest">{tr ? 'Toplam' : 'Total'}</p>
        </div>
        <p className="text-5xl font-black text-white tabular-nums leading-none">{items.length}</p>
        <p className="text-sm text-white/60 font-semibold mt-1">{tr ? 'danışman kayıtlı' : 'consultants listed'}</p>
      </motion.div>
    </div>
  )
}

// ─── Tab ──────────────────────────────────────────────────────────

function Tab({ active, onClick, label, count, urgentCls = '' }: {
  active: boolean; onClick: () => void; label: string; count: number; urgentCls?: string
}) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
      active ? 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
    }`}>
      {label}
      {count > 0 && (
        <span className={`text-[11px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${
          active ? 'bg-white/20 text-white' : urgentCls || 'bg-gray-200 text-gray-600'
        }`}>{count}</span>
      )}
    </button>
  )
}

// ─── Ana bileşen ──────────────────────────────────────────────────

export function RecheckContent({ items: initialItems, currentUserId, role }: Props) {
  const { lang } = useLanguage()
  const tr = lang === 'tr'
  const [activeFilter, setActiveFilter] = useState<Filter>('today')
  const [customDate, setCustomDate] = useState('')
  const [items, setItems] = useState<RecheckItem[]>(initialItems)
  const [toggleError, setToggleError] = useState('')

  const counts = useMemo(() => {
    const pending = items.filter(i => !i.recheck_done)
    return {
      overdue:  pending.filter(i => dayDiff(i.dev_recheck_date) < 0).length,
      today:    pending.filter(i => dayDiff(i.dev_recheck_date) === 0).length,
      tomorrow: pending.filter(i => dayDiff(i.dev_recheck_date) === 1).length,
      week:     pending.filter(i => { const d = dayDiff(i.dev_recheck_date); return d >= 0 && d <= 7 }).length,
      all:      pending.length,
      done:     items.filter(i => i.recheck_done).length,
    }
  }, [items])

  const filtered = useMemo(() => {
    return [...items.filter(i => matchesFilter(i, activeFilter, customDate))]
      .sort((a, b) => {
        if (activeFilter === 'done') return (b.recheck_done_at ?? '').localeCompare(a.recheck_done_at ?? '')
        return dayDiff(a.dev_recheck_date) - dayDiff(b.dev_recheck_date)
      })
  }, [items, activeFilter, customDate])

  const urgentTotal = counts.overdue + counts.today

  async function handleToggleDone(id: string, done: boolean) {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('evaluations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        recheck_done: done,
        recheck_done_at: done ? now : null,
        recheck_done_by: done ? currentUserId : null,
      } as any)
      .eq('id', id)

    if (error) {
      console.error(error)
      setToggleError(
        tr
          ? 'İşaretlenemedi. Supabase üzerinde scripts/add-recheck-done-columns.sql çalıştırıldığından emin olun.'
          : 'Could not mark as done. Make sure scripts/add-recheck-done-columns.sql has been run on Supabase.'
      )
      return
    }

    setToggleError('')
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      return {
        ...item,
        recheck_done: done,
        recheck_done_at: done ? now : null,
        recheck_done_by: done ? currentUserId : null,
      }
    }))
    window.dispatchEvent(new Event('recheck-updated'))
  }

  function handleTabClick(id: Filter) {
    setActiveFilter(id)
    setCustomDate('')
  }

  const tabs: { id: Filter; label: string; urgentCls?: string }[] = [
    { id: 'overdue',  label: tr ? 'Gecikmiş' : 'Overdue',   urgentCls: 'bg-red-500 text-white' },
    { id: 'today',    label: tr ? 'Bugün'    : 'Today',      urgentCls: 'bg-orange-500 text-white' },
    { id: 'tomorrow', label: tr ? 'Yarın'    : 'Tomorrow' },
    { id: 'week',     label: tr ? 'Bu Hafta' : 'This Week' },
    { id: 'all',      label: tr ? 'Tümü'     : 'All' },
    { id: 'done',     label: tr ? '✓ Tamamlananlar' : '✓ Completed', urgentCls: 'bg-emerald-500 text-white' },
  ]

  return (
    <div className="space-y-5">

      {/* Toggle error banner */}
      <AnimatePresence>
        {toggleError && (
          <motion.div initial={{ opacity:0, y:-10, height:0 }} animate={{ opacity:1, y:0, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-700">{toggleError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Urgent banner */}
      <AnimatePresence>
        {urgentTotal > 0 && activeFilter !== 'done' && (
          <motion.div initial={{ opacity:0, y:-10, height:0 }} animate={{ opacity:1, y:0, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-700">
                {tr
                  ? `${urgentTotal} danışman bugün veya öncesinde kontrol edilmeli — gecikmiş: ${counts.overdue}, bugün: ${counts.today}`
                  : `${urgentTotal} consultants need a check today or are overdue`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-5 items-start">
        {/* Left: filter + list */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Filter bar */}
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="h-[3px] bg-gradient-to-r from-[#52B788] via-[#1B4332] to-[#52B788] rounded-t-2xl" />
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {tabs.map(tab => (
                <Tab key={tab.id} active={activeFilter === tab.id && !customDate}
                  onClick={() => handleTabClick(tab.id)} label={tab.label}
                  count={counts[tab.id]} urgentCls={tab.urgentCls} />
              ))}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <div className="flex items-center gap-2">
                <div className="w-44">
                  <DatePicker value={customDate}
                    onChange={v => { setCustomDate(v); if (v) setActiveFilter('all') }}
                    placeholder={tr ? 'Tarih seç...' : 'Pick a date...'} />
                </div>
                {customDate && (
                  <button onClick={() => { setCustomDate(''); setActiveFilter('today') }}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card list */}
          <AnimatePresence mode="wait">
            <motion.div key={activeFilter + customDate}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
              className="space-y-2.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                    {activeFilter === 'done'
                      ? <CheckCircle2 className="w-7 h-7 text-gray-300" />
                      : <Inbox className="w-7 h-7 text-gray-300" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">
                      {activeFilter === 'done'
                        ? (tr ? 'Henüz tamamlanan yok' : 'Nothing completed yet')
                        : (tr ? 'Bu filtre için kayıt yok' : 'No records for this filter')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeFilter === 'done'
                        ? (tr ? 'Kontroller tamamlandıkça burada görünür' : 'Completed checks will appear here')
                        : (tr ? 'Farklı bir filtre deneyin' : 'Try a different filter')}
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((item, i) => (
                    <Card key={item.id} item={item} idx={i}
                      currentUserId={currentUserId} lang={lang}
                      onToggleDone={handleToggleDone} />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        {items.length > 0 && <Sidebar items={items} lang={lang} />}
      </div>
    </div>
  )
}
