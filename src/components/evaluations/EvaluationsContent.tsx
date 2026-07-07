'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, X, Plus, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  MessageSquare, Phone, ChevronsUpDown, ChevronUp, ChevronDown,
  CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import type { UserRole, ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'
import type { EvaluationListItem, EvaluationWithRelations } from '@/types'
import { EvaluationViewModal } from './EvaluationViewModal'

// ─── Types ────────────────────────────────────────────────────────

type SortKey = 'date' | 'consultant' | 'customer' | 'score'
type SortDir = 'asc' | 'desc'

type ProfileOption = {
  id: string
  full_name: string | null
  email?: string | null
}

interface Props {
  evaluations: EvaluationListItem[]
  totalCount: number
  currentPage: number
  pageSize: number
  role: UserRole
  canCreate: boolean
  filterChannel: string
  filterStatus: string
  filterResult: string
  filterEvaluator: string
  filterStartDate: string
  filterEndDate: string
  searchQuery: string
  evaluatorOptions: ProfileOption[]
  sortBy: string
  sortDir: string
}

const DELETE_SUCCESS_STORAGE_KEY = 'evaluations-delete-success'

// ─── Tailwind-safe badge maps ─────────────────────────────────────

const STATUS_STYLES: Record<EvaluationStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  approved:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-700',
}

const RESULT_STYLES: Record<ConversationResult, string> = {
  won:       'bg-green-100 text-green-700',
  open:      'bg-blue-100 text-blue-700',
  follow_up: 'bg-amber-100 text-amber-700',
  lost:      'bg-red-100 text-red-700',
  no_answer: 'bg-gray-100 text-gray-600',
}

const selectClass =
  'text-sm border border-gray-200 rounded-xl bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] cursor-pointer'

// ─── Sort icon helper ─────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 inline ml-1" />
  return dir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
}

function getChannels(ev: EvaluationListItem): ChannelType[] {
  const channels = new Set<ChannelType>()
  channels.add(ev.channel)
  ;(ev.channel_checks ?? []).forEach(check => channels.add(check.channel))
  return Array.from(channels)
}

function ChannelBadges({ channels, labels }: { channels: ChannelType[]; labels: { whatsapp: string; call: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {channels.map(channel => {
        const isWhatsapp = channel === 'whatsapp'
        const Icon = isWhatsapp ? MessageSquare : Phone
        return (
          <span
            key={channel}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
              isWhatsapp
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {isWhatsapp ? labels.whatsapp : labels.call}
          </span>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────

export function EvaluationsContent({
  evaluations,
  totalCount,
  currentPage,
  pageSize,
  role,
  canCreate,
  filterChannel,
  filterStatus,
  filterResult,
  filterEvaluator,
  filterStartDate,
  filterEndDate,
  searchQuery,
  evaluatorOptions,
  sortBy: serverSortBy,
  sortDir: serverSortDir,
}: Props) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // ── Sort state ─────────────────────────────────────────────────
  // date / customer / score → server-side via URL params
  // consultant → client-side within current page (joined field)
  const [clientSortKey, setClientSortKey] = useState<SortKey | null>(null)
  const [clientSortDir, setClientSortDir] = useState<SortDir>('asc')

  // ── View / delete state ────────────────────────────────────────
  const [viewId, setViewId] = useState<string | null>(null)
  const [viewData, setViewData] = useState<EvaluationWithRelations | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set())

  const canEdit   = role === 'quality_team' || role === 'team_leader' || role === 'manager'
  const canDelete = role === 'quality_team' || role === 'manager'
  const showConsultant = role !== 'consultant'
  const showEvaluator = role !== 'consultant'

  // Keep local search in sync when URL changes
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedMessage = window.sessionStorage.getItem(DELETE_SUCCESS_STORAGE_KEY)
    if (!storedMessage) return

    setDeleteSuccess(storedMessage)
    window.sessionStorage.removeItem(DELETE_SUCCESS_STORAGE_KEY)

    const timer = window.setTimeout(() => setDeleteSuccess(''), 2500)
    return () => window.clearTimeout(timer)
  }, [])

  // Debounce search → update URL after 400 ms
  useEffect(() => {
    if (localSearch === searchQuery) return
    const timer = setTimeout(() => {
      pushParams({ q: localSearch, page: '' })
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // ── URL helpers ────────────────────────────────────────────────

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const current: Record<string, string> = {
      q: localSearch,
      channel: filterChannel,
      status: filterStatus,
      result: filterResult,
      evaluator: filterEvaluator,
      startDate: filterStartDate,
      endDate: filterEndDate,
      sortBy: serverSortBy,
      sortDir: serverSortDir,
    }
    const merged = { ...current, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    startTransition(() => {
      router.replace(`/evaluations?${params.toString()}`)
    })
  }

  function updateFilter(key: string, value: string) {
    pushParams({ [key]: value, page: '' })
  }

  function clearFilters() {
    setLocalSearch('')
    startTransition(() => {
      router.replace('/evaluations')
    })
  }

  function goToPage(p: number) {
    pushParams({ page: String(p) })
  }

  // ── Sort column click ──────────────────────────────────────────

  function handleSortClick(key: SortKey) {
    if (key === 'consultant') {
      if (clientSortKey === 'consultant') {
        setClientSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setClientSortKey('consultant')
        setClientSortDir('asc')
      }
      return
    }
    // Server-side sort
    setClientSortKey(null)
    const col =
      key === 'date' ? 'conversation_date'
      : key === 'customer' ? 'customer_name'
      : 'final_score'
    const newDir = serverSortBy === col && serverSortDir === 'asc' ? 'desc' : 'asc'
    // Default desc for date/score, asc for customer
    const defaultDir = key === 'customer' ? 'asc' : 'desc'
    pushParams({ sortBy: col, sortDir: serverSortBy === col ? newDir : defaultDir, page: '' })
  }

  function isServerActive(key: SortKey) {
    const col =
      key === 'date' ? 'conversation_date'
      : key === 'customer' ? 'customer_name'
      : 'final_score'
    return serverSortBy === col
  }

  function serverDir(key: SortKey): SortDir {
    return isServerActive(key) ? (serverSortDir as SortDir) : 'asc'
  }

  // ── Client-side sorted list ────────────────────────────────────

  const sortedEvaluations = useMemo(() => {
    const visibleEvaluations = evaluations.filter(evaluation => !deletedIds.has(evaluation.id))
    if (clientSortKey !== 'consultant') return visibleEvaluations
    return [...visibleEvaluations].sort((a, b) => {
      const na = (a.consultant?.full_name ?? '').toLowerCase()
      const nb = (b.consultant?.full_name ?? '').toLowerCase()
      const cmp = na.localeCompare(nb, 'tr')
      return clientSortDir === 'asc' ? cmp : -cmp
    })
  }, [evaluations, deletedIds, clientSortKey, clientSortDir])

  // ── View modal ─────────────────────────────────────────────────

  const openView = useCallback(async (id: string) => {
    setViewId(id)
    setViewData(null)
    setViewLoading(true)
    try {
      const res = await fetch(`/api/evaluations/${id}`)
      if (res.ok) setViewData(await res.json())
    } finally {
      setViewLoading(false)
    }
  }, [])

  const closeView = useCallback(() => {
    setViewId(null)
    setViewData(null)
  }, [])

  // ── Delete ─────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || 'Delete failed')
      }
      setDeletingId(null)
      setDeletedIds(prev => new Set(prev).add(id))
      const successMessage = lang === 'tr' ? 'Değerlendirme silindi.' : 'Evaluation deleted.'
      setDeleteSuccess(successMessage)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(DELETE_SUCCESS_STORAGE_KEY, successMessage)
      }
      setTimeout(() => setDeleteSuccess(''), 2500)
      startTransition(() => { router.refresh() })
    } catch (error) {
      console.error('Evaluation delete error:', error)
      setDeleteError(
        lang === 'tr'
          ? 'Değerlendirme silinemedi. Yetki veya bağlantı problemi olabilir.'
          : 'Evaluation could not be deleted. There may be a permission or connection issue.'
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────

  const hasFilters =
    localSearch || filterChannel || filterStatus || filterResult || filterEvaluator || filterStartDate || filterEndDate
  const totalPages = Math.ceil(totalCount / pageSize)
  const deleteEvaluation = deletingId
    ? evaluations.find(evaluation => evaluation.id === deletingId) ?? null
    : null

  return (
    <div className="space-y-4">
      {deleteEvaluation && typeof document !== 'undefined' && createPortal(
        (
        <div className="fixed inset-0 z-[100] bg-black/40">
          <div className="fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-950">
                    {lang === 'tr' ? 'Değerlendirme silinsin mi?' : 'Delete evaluation?'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {lang === 'tr'
                      ? 'Bu işlem geri alınamaz. Seçili değerlendirme sistemden kalıcı olarak silinecek.'
                      : 'This cannot be undone. The selected evaluation will be permanently removed.'}
                  </p>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {deleteEvaluation.consultant?.full_name ?? deleteEvaluation.customer_name}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {deleteEvaluation.customer_name} · {deleteEvaluation.final_score}/100 · {deleteEvaluation.conversation_date}
                    </div>
                  </div>
                  {deleteError && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {deleteError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setDeletingId(null)
                  setDeleteError('')
                }}
                disabled={deleteLoading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteEvaluation.id)}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? (lang === 'tr' ? 'Siliniyor...' : 'Deleting...') : (lang === 'tr' ? 'Evet, sil' : 'Yes, delete')}
              </button>
            </div>
          </div>
        </div>
        ),
        document.body
      )}

      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 rounded-2xl bg-[#1B4332] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-[#1B4332]/30">
          <CheckCircle2 className="h-5 w-5 text-[#52B788]" />
          {deleteSuccess}
        </div>
      )}

      {deleteError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {deleteError}
        </div>
      )}

      {/* View modal */}
      <EvaluationViewModal
        evalId={viewId}
        evaluation={viewData}
        loading={viewLoading}
        canEdit={canEdit}
        onClose={closeView}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.evaluations.pageTitle}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount} {lang === 'tr' ? 'kayıt' : 'records'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/evaluations/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#163728] active:bg-[#122e20] rounded-xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.evaluations.newEvaluation}</span>
          </Link>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder={t.evaluations.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.clear}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterChannel}
            onChange={e => updateFilter('channel', e.target.value)}
            className={selectClass}
          >
            <option value="">{t.evaluations.filterByChannel}</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">{t.channel.call}</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => updateFilter('status', e.target.value)}
            className={selectClass}
          >
            <option value="">{t.evaluations.filterByStatus}</option>
            {(['draft', 'submitted', 'approved', 'rejected'] as EvaluationStatus[]).map(s => (
              <option key={s} value={s}>{t.status[s]}</option>
            ))}
          </select>

          <select
            value={filterResult}
            onChange={e => updateFilter('result', e.target.value)}
            className={selectClass}
          >
            <option value="">{t.evaluations.filterByResult}</option>
            {(['won', 'open', 'follow_up', 'lost', 'no_answer'] as ConversationResult[]).map(r => (
              <option key={r} value={r}>{t.conversationResult[r]}</option>
            ))}
          </select>

          {showEvaluator && (
            <select
              value={filterEvaluator}
              onChange={e => updateFilter('evaluator', e.target.value)}
              className={selectClass}
            >
              <option value="">{lang === 'tr' ? 'Değerlendirene göre filtrele' : 'Filter by evaluator'}</option>
                  {evaluatorOptions.map(evaluator => (
                <option key={evaluator.id} value={evaluator.id}>
                  {evaluator.full_name || evaluator.email || 'Natural Clinic'}
                </option>
              ))}
            </select>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={filterStartDate}
              onChange={e => updateFilter('startDate', e.target.value)}
              className={`${selectClass} w-[130px] sm:w-36`}
              title={t.evaluations.startDate}
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => updateFilter('endDate', e.target.value)}
              className={`${selectClass} w-[130px] sm:w-36`}
              title={t.evaluations.endDate}
            />
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity duration-150 ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {sortedEvaluations.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-400">{t.evaluations.noEvaluations}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {/* Date */}
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSortClick('date')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {t.evaluations.conversationDate}
                      <SortIcon active={isServerActive('date')} dir={serverDir('date')} />
                    </button>
                  </th>

                  {/* Consultant */}
                  {showConsultant && (
                    <th className="text-left px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleSortClick('consultant')}
                        className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        {t.evaluations.consultant}
                        <SortIcon active={clientSortKey === 'consultant'} dir={clientSortDir} />
                      </button>
                    </th>
                  )}

                  {/* Customer */}
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSortClick('customer')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {t.evaluations.customer}
                      <SortIcon active={isServerActive('customer')} dir={serverDir('customer')} />
                    </button>
                  </th>

                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">
                    {t.evaluations.channel}
                  </th>

                  {/* Score */}
                  <th className="text-right px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSortClick('score')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors ml-auto"
                    >
                      {t.evaluations.finalScore}
                      <SortIcon active={isServerActive('score')} dir={serverDir('score')} />
                    </button>
                  </th>

                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">
                    {t.evaluations.result}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">
                    {t.evaluations.status}
                  </th>
                  {showEvaluator && (
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                      {t.evaluations.evaluator}
                    </th>
                  )}
                  <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    {t.evaluations.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEvaluations.map(ev => {
                  const displayScore = ev.is_auto_failed ? 0 : ev.final_score
                  const level = getScoreLevel(displayScore)
                  const isDeleting = deletingId === ev.id

                  return (
                    <tr
                      key={ev.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {ev.conversation_date}
                      </td>

                      {showConsultant && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-900">
                            {ev.consultant?.full_name ?? '—'}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                        {ev.customer_name}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        <ChannelBadges channels={getChannels(ev)} labels={t.channel} />
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`text-base font-bold ${
                            ev.is_auto_failed ? 'text-red-500' : level.textColor
                          }`}
                        >
                          {displayScore}
                        </span>
                        <span className="text-gray-300 text-xs ml-0.5">/100</span>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            RESULT_STYLES[ev.conversation_result]
                          }`}
                        >
                          {t.conversationResult[ev.conversation_result]}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_STYLES[ev.status]
                          }`}
                        >
                          {t.status[ev.status]}
                        </span>
                      </td>

                      {showEvaluator && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-700">
                            {ev.evaluator?.full_name || ev.evaluator?.email || 'Natural Clinic'}
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {false ? (
                          <div className="inline-flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] text-gray-500">
                              {lang === 'tr' ? 'Silinsin mi?' : 'Delete?'}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(ev.id)}
                                disabled={deleteLoading}
                                className="px-2 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {lang === 'tr' ? 'Evet' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                disabled={deleteLoading}
                                className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {lang === 'tr' ? 'İptal' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {/* View */}
                            <button
                              onClick={() => openView(ev.id)}
                              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#1B4332] bg-[#1B4332]/8 hover:bg-[#1B4332]/15 rounded-lg transition-colors"
                              title={lang === 'tr' ? 'Görüntüle' : 'View'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">{t.common.view}</span>
                            </button>

                            {/* Edit */}
                            {canEdit && (
                              <Link
                                href={`/evaluations/${ev.id}`}
                                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                title={lang === 'tr' ? 'Düzenle' : 'Edit'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">{lang === 'tr' ? 'Düzenle' : 'Edit'}</span>
                              </Link>
                            )}

                            {/* Delete */}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeletingId(ev.id)
                                  setDeleteError('')
                                }}
                                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                title={lang === 'tr' ? 'Sil' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-gray-400 text-xs sm:text-sm">
            {lang === 'tr'
              ? `${totalCount} kayıt · Sayfa ${currentPage} / ${totalPages}`
              : `${totalCount} records · Page ${currentPage} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="flex items-center gap-1 px-2.5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.back}</span>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    disabled={isPending}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-[#1B4332] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="flex items-center gap-1 px-2.5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">{t.common.next}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
