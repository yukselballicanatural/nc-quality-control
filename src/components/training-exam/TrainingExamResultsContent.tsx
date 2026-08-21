'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Save,
  User,
  SlidersHorizontal,
  Layers,
  Target,
  UserCog,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { DatePicker } from '@/components/ui/DatePicker'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { TrainingExam, UserRole } from '@/types/supabase'

type SortKey = 'date' | 'score' | 'level'
type SortDir = 'asc' | 'desc'

type ProfileSummary = {
  id: string
  full_name: string | null
  email?: string | null
  team_leader_id?: string | null
}

type TrainingExamResultItem = TrainingExam & {
  consultant: ProfileSummary | null
  evaluator: ProfileSummary | null
}

interface Props {
  results: TrainingExamResultItem[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchQuery: string
  filterLevel: string
  filterResult: string
  filterEvaluator: string
  filterConsultant: string
  filterStartDate: string
  filterEndDate: string
  sortBy: string
  sortDir: string
  role: UserRole
  consultants: ProfileSummary[]
  evaluatorOptions: ProfileSummary[]
}

const PASS_THRESHOLDS = { junior: 32, senior: 35 } as const
const CRITERIA_EN = [
  'Professional Greeting / Clear Introduction',
  'Objection Handling',
  'Builds Rapport',
  'Authority Tone & Pace and Language',
  'Identifies Main Problem + Goals',
  'Collects Photos / X-ray & Medical Info',
  'Medical Information Accuracy',
  'Sets Expectations (Timeline / Visit Plan)',
]

const CRITERIA_TR = [
  'Profesyonel Karşılama / Net Tanıtım',
  'İtiraz Karşılama',
  'Bağ Kurma',
  'Otorite Tonu, Konuşma Hızı ve Dil Kullanımı',
  'Ana Problemi ve Hedefleri Belirleme',
  'Fotoğraf / Röntgen ve Medikal Bilgi Toplama',
  'Medikal Bilgi Doğruluğu',
  'Beklentileri Belirleme (Zaman Planı / Ziyaret Planı)',
]

const CRITERIA_IT = [
  'Saluto professionale / Presentazione chiara',
  'Gestione delle obiezioni',
  'Creazione del rapporto',
  'Tono autorevole, ritmo e uso della lingua',
  'Identificazione del problema principale e degli obiettivi',
  'Raccolta foto / radiografie e informazioni mediche',
  'Accuratezza delle informazioni mediche',
  'Definizione delle aspettative (tempistiche / piano visita)',
]

const SCORE_STYLES: Record<number, string> = {
  1: 'border-red-400 bg-red-50 text-red-700',
  2: 'border-orange-400 bg-orange-50 text-orange-700',
  3: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  4: 'border-blue-400 bg-blue-50 text-blue-700',
  5: 'border-green-400 bg-green-50 text-green-700',
}
const MAX_NOTE_LENGTH = 150

function isMissingTeamLeaderColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('team_leader_id') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function isMissingConsultantNameColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('consultant_name') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function isMissingTrainingTypeColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('training_type') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function isMissingNoteColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('note') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR')
}

function getStoredExamNote(result: TrainingExamResultItem) {
  if (result.note?.trim()) return result.note
  const criteriaScores = Array.isArray(result.criteria_scores) ? result.criteria_scores : []
  const noteRow = criteriaScores.find(
    item =>
      item.criteriaNumber === 0 &&
      'note' in item &&
      typeof (item as { note?: unknown }).note === 'string'
  ) as { note?: string } | undefined
  return noteRow?.note?.trim() ? noteRow.note : ''
}

function buildCriteriaScoresPayload(scores: number[], note: string) {
  const rows = scores.map((score, index) => ({
    criteriaNumber: index + 1,
    score,
  }))
  return note ? [...rows, { criteriaNumber: 0, score: 0, note }] : rows
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 inline ml-1" />
  return dir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
}

// Renders children into <body> so `position: fixed` overlays are positioned
// against the viewport, not the transformed (animate-fade-up) page container —
// which otherwise pushes modals off-center on long pages.
function useLiquidGlass() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    setEnabled(Boolean(document.querySelector('[data-liquid-glass="enabled"]')))
  }, [])
  return enabled
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export function TrainingExamResultsContent({
  results,
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
  filterLevel,
  filterResult,
  filterEvaluator,
  filterConsultant,
  filterStartDate,
  filterEndDate,
  sortBy: serverSortBy,
  sortDir: serverSortDir,
  role,
  consultants,
  evaluatorOptions,
}: Props) {
  const isLiquidGlassUser = useLiquidGlass()
  const liquidOwned = isLiquidGlassUser ? 'true' : undefined
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [viewResult, setViewResult] = useState<TrainingExamResultItem | null>(null)
  const [editResult, setEditResult] = useState<TrainingExamResultItem | null>(null)
  const [editConsultantName, setEditConsultantName] = useState('')
  const [editTrainingType, setEditTrainingType] = useState<'pre' | 'post' | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editLevel, setEditLevel] = useState<'junior' | 'senior'>('junior')
  const [editScores, setEditScores] = useState<number[]>(Array(8).fill(0))
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState('')
  const tx = (tr: string, en: string, it: string) => lang === 'tr' ? tr : lang === 'it' ? it : en
  const locale = lang === 'tr' ? 'tr-TR' : lang === 'it' ? 'it-IT' : 'en-US'
  const criteria = lang === 'tr' ? CRITERIA_TR : lang === 'it' ? CRITERIA_IT : CRITERIA_EN
  const canCreate = role === 'quality_team' || role === 'team_leader' || role === 'manager'
  const canEdit = role === 'quality_team' || role === 'team_leader' || role === 'manager'
  const canDelete = role === 'quality_team' || role === 'manager'
  const canSelectRows = isLiquidGlassUser

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [results])

  // Lock background scrolling while any modal (view / edit / delete) is open,
  // so scrolling inside the popup never moves the page behind it.
  const anyModalOpen = Boolean(viewResult || editResult || deletingId || bulkDeleteOpen || (isLiquidGlassUser && deleteSuccess))
  useEffect(() => {
    if (!anyModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [anyModalOpen])

  // Close the view popup with the Escape key.
  useEffect(() => {
    if (!viewResult) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewResult(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewResult])

  useEffect(() => {
    if (localSearch === searchQuery) return
    const timer = setTimeout(() => {
      pushParams({ q: localSearch, page: '' })
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const current: Record<string, string> = {
      q: localSearch,
      level: filterLevel,
      result: filterResult,
      evaluator: filterEvaluator,
      consultant: filterConsultant,
      startDate: filterStartDate,
      endDate: filterEndDate,
      sortBy: serverSortBy,
      sortDir: serverSortDir,
    }
    const merged = { ...current, ...overrides }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    startTransition(() => {
      router.replace(`/training-exam-results?${params.toString()}`)
    })
  }

  function updateFilter(key: string, value: string) {
    pushParams({ [key]: value, page: '' })
  }

  function clearFilters() {
    setLocalSearch('')
    startTransition(() => {
      router.replace('/training-exam-results')
    })
  }

  function goToPage(page: number) {
    pushParams({ page: String(page) })
  }

  function handleSortClick(key: SortKey) {
    const col =
      key === 'date' ? 'created_at'
      : key === 'score' ? 'total_score'
      : 'level'
    const newDir = serverSortBy === col && serverSortDir === 'asc' ? 'desc' : 'asc'
    const defaultDir = key === 'level' ? 'asc' : 'desc'
    pushParams({ sortBy: col, sortDir: serverSortBy === col ? newDir : defaultDir, page: '' })
  }

  function isServerActive(key: SortKey) {
    const col =
      key === 'date' ? 'created_at'
      : key === 'score' ? 'total_score'
      : 'level'
    return serverSortBy === col
  }

  function serverDir(key: SortKey): SortDir {
    return isServerActive(key) ? (serverSortDir as SortDir) : 'asc'
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getConsultantName(result: TrainingExamResultItem) {
    return result.consultant_name || result.consultant?.full_name || '-'
  }

  function openEdit(result: TrainingExamResultItem) {
    setEditResult(result)
    setEditConsultantName(getConsultantName(result))
    setEditTrainingType(result.training_type ?? null)
    setEditNote(getStoredExamNote(result))
    setEditLevel(result.level)
    setEditScores(
      Array.from({ length: 8 }, (_, index) => {
        const criteriaScores = Array.isArray(result.criteria_scores) ? result.criteria_scores : []
        const score = criteriaScores.find(item => item.criteriaNumber === index + 1)?.score
        return score ?? 0
      })
    )
    setEditError('')
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const response = await fetch(`/api/training-exams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || 'Delete failed')
      }

      setDeletingId(null)
      setDeletedIds(prev => new Set(prev).add(id))
      setDeleteSuccess(tx('Sınav sonucu silindi.', 'Exam result deleted.', 'Risultato esame eliminato.'))
      setTimeout(() => setDeleteSuccess(''), 2500)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Training exam delete error:', error)
      setDeleteError(
        tx(
          'Sınav sonucu silinemedi. Yetki veya bağlantı problemi olabilir.',
          'Exam result could not be deleted. There may be a permission or connection issue.',
          'Impossibile eliminare il risultato esame. Potrebbe esserci un problema di autorizzazione o connessione.'
        )
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev =>
      prev.size === visibleResults.length
        ? new Set()
        : new Set(visibleResults.map(result => result.id))
    )
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true)
    setBulkDeleteError('')
    const ids = Array.from(selectedIds)
    try {
      const results = await Promise.all(
        ids.map(async id => {
          const response = await fetch(`/api/training-exams/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          return { id, ok: response.ok }
        })
      )
      const succeeded = results.filter(result => result.ok).map(result => result.id)
      const failedCount = results.length - succeeded.length

      if (succeeded.length > 0) {
        setDeletedIds(prev => {
          const next = new Set(prev)
          succeeded.forEach(id => next.add(id))
          return next
        })
        setDeleteSuccess(
          failedCount > 0
            ? tx(`${succeeded.length} sınav sonucu silindi, ${failedCount} tanesi silinemedi.`, `${succeeded.length} exam results deleted, ${failedCount} failed.`, `${succeeded.length} risultati esame eliminati, ${failedCount} non riusciti.`)
            : tx(`${succeeded.length} sınav sonucu silindi.`, `${succeeded.length} exam results deleted.`, `${succeeded.length} risultati esame eliminati.`)
        )
        setTimeout(() => setDeleteSuccess(''), 2500)
      }

      if (failedCount > 0 && succeeded.length === 0) {
        setBulkDeleteError(
          tx(
            'Seçilen sınav sonuçları silinemedi. Yetki veya bağlantı problemi olabilir.',
            'Selected exam results could not be deleted. There may be a permission or connection issue.',
            'Impossibile eliminare i risultati esame selezionati. Potrebbe esserci un problema di autorizzazione o connessione.'
          )
        )
        return
      }

      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Training exam bulk delete error:', error)
      setBulkDeleteError(
        tx(
          'Seçilen sınav sonuçları silinemedi. Yetki veya bağlantı problemi olabilir.',
          'Selected exam results could not be deleted. There may be a permission or connection issue.',
          'Impossibile eliminare i risultati esame selezionati. Potrebbe esserci un problema di autorizzazione o connessione.'
        )
      )
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  async function handleEditSave() {
    if (!editResult) return
    const trimmedConsultantName = editConsultantName.trim()
    const consultantOptions = Array.isArray(consultants) ? consultants : []
    let matchedConsultant: ProfileSummary | null = null

    for (const consultant of consultantOptions) {
      if (normalizeName(consultant.full_name ?? '') === normalizeName(trimmedConsultantName)) {
        matchedConsultant = consultant
        break
      }
    }

    if (!trimmedConsultantName) {
      setEditError(tx('Danışman adı girilmesi zorunludur.', 'Consultant name is required.', 'Il nome del consulente è obbligatorio.'))
      return
    }
    if (editScores.some(score => score < 1 || score > 5)) {
      setEditError(tx('Tüm kriterler 1-5 arası puanlanmalıdır.', 'All criteria must be scored from 1 to 5.', 'Tutti i criteri devono essere valutati da 1 a 5.'))
      return
    }

    const totalScore = editScores.reduce((sum, score) => sum + score, 0)
    const passed = totalScore >= PASS_THRESHOLDS[editLevel]
    const trimmedNote = editNote.trim()

    setEditLoading(true)
    try {
      const supabase = createClient()
      let updatePayload: Record<string, unknown> = {
        consultant_id: matchedConsultant?.id ?? editResult.consultant_id ?? null,
        consultant_name: trimmedConsultantName,
        training_type: editTrainingType,
        note: trimmedNote || null,
        level: editLevel,
        criteria_scores: buildCriteriaScoresPayload(editScores, trimmedNote),
        total_score: totalScore,
        passed,
      }

      let { error } = await supabase
        .from('training_exams')
        .update(updatePayload as never)
        .eq('id', editResult.id)

      if (isMissingTeamLeaderColumn(error)) {
        const { team_leader_id: _unused, ...rest } = updatePayload
        updatePayload = rest
        const retry = await supabase
          .from('training_exams')
          .update(updatePayload as never)
          .eq('id', editResult.id)
        error = retry.error
      }

      if (isMissingConsultantNameColumn(error)) {
        const { consultant_name: _unused, ...rest } = updatePayload
        updatePayload = rest
        const retry = await supabase
          .from('training_exams')
          .update(updatePayload as never)
          .eq('id', editResult.id)
        error = retry.error
      }

      if (isMissingTrainingTypeColumn(error)) {
        const { training_type: _unused, ...rest } = updatePayload
        updatePayload = rest
        const retry = await supabase
          .from('training_exams')
          .update(updatePayload as never)
          .eq('id', editResult.id)
        error = retry.error
      }

      if (isMissingNoteColumn(error)) {
        const { note: _unused, ...rest } = updatePayload
        updatePayload = rest
        const retry = await supabase
          .from('training_exams')
          .update(updatePayload as never)
          .eq('id', editResult.id)
        error = retry.error
      }

      if (error) throw error
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'training_exam_updated',
          entityType: 'training_exam',
          entityId: editResult.id,
          metadata: {
            full_name: trimmedConsultantName,
            level: editLevel,
            score: totalScore,
            passed,
          },
        }),
      }).catch(() => null)
      setEditResult(null)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Training exam update error:', error)
      setEditError(tx('Güncelleme sırasında hata oluştu.', 'Error updating result.', 'Errore durante l’aggiornamento del risultato.'))
    } finally {
      setEditLoading(false)
    }
  }

  const hasFilters =
    localSearch || filterLevel || filterResult || filterEvaluator || (canSelectRows && filterConsultant) || filterStartDate || filterEndDate
  const totalPages = Math.ceil(totalCount / pageSize)
  const visibleResults = results.filter(result => !deletedIds.has(result.id))
  const deleteResult = deletingId
    ? results.find(result => result.id === deletingId) ?? null
    : null

  return (
    <div className="space-y-4">
      {deleteSuccess && isLiquidGlassUser && (
        <Portal>
        <div className="nc-modal-backdrop nc-delete-backdrop fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" data-liquid-owned={liquidOwned}>
          <div className="nc-modal-panel nc-delete-dialog nc-delete-dialog--success w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl" data-liquid-owned={liquidOwned} data-liquid-glass={liquidOwned ? 'enabled' : undefined}>
            <div className="nc-delete-body flex items-start gap-3.5 p-5 pb-2">
              <div className="nc-delete-icon nc-delete-icon--success flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="nc-delete-title text-base font-bold text-gray-950">
                  {tx('Sınav Sonucu Silindi', 'Exam Result Deleted', 'Risultato esame eliminato')}
                </h2>
                <p className="nc-delete-copy mt-1 text-sm leading-6 text-gray-500">
                  <strong className="nc-delete-name nc-delete-name--success">{deleteSuccess}</strong>
                </p>
              </div>
            </div>
            <div className="nc-delete-actions flex items-center justify-end gap-2 px-5 pb-5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSuccess('')}
                className="nc-delete-success rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                {tx('Kapat', 'Close', 'Chiudi')}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {deleteSuccess && !isLiquidGlassUser && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 rounded-2xl bg-[#1B4332] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-[#1B4332]/30">
          <CheckCircle2 className="h-5 w-5 text-[#52B788]" />
          {deleteSuccess}
        </div>
      )}

      {bulkDeleteOpen && (
        <Portal>
        <div className="nc-modal-backdrop nc-delete-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-liquid-owned={liquidOwned}>
          <div className="nc-modal-panel nc-delete-dialog w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl" data-liquid-owned={liquidOwned} data-liquid-glass={liquidOwned ? 'enabled' : undefined}>
            <div className="nc-delete-body p-5">
              <div className="flex items-start gap-4">
                <div className="nc-delete-icon nc-delete-icon--danger flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="nc-delete-title text-base font-bold text-gray-950">
                    {tx('Seçilen sınav sonuçları silinsin mi?', 'Delete selected exam results?', 'Eliminare i risultati esame selezionati?')}
                  </h2>
                  <p className="nc-delete-copy mt-1 text-sm leading-6 text-gray-500">
                    {tx(
                      `${selectedIds.size} kayıt sistemden kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
                      `${selectedIds.size} records will be permanently removed. This cannot be undone.`,
                      `${selectedIds.size} record saranno eliminati definitivamente. Questa azione non può essere annullata.`
                    )}
                  </p>
                  {bulkDeleteError && (
                    <div className="nc-delete-error mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {bulkDeleteError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="nc-delete-actions flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setBulkDeleteOpen(false)
                  setBulkDeleteError('')
                }}
                disabled={bulkDeleteLoading}
                className="nc-delete-cancel rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                {tx('Vazgeç', 'Cancel', 'Annulla')}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
                className="nc-delete-danger inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleteLoading ? tx('Siliniyor...', 'Deleting...', 'Eliminazione...') : tx('Evet, sil', 'Yes, delete', 'Sì, elimina')}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {deleteResult && (
        <Portal>
        <div className="nc-modal-backdrop nc-delete-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-liquid-owned={liquidOwned}>
          <div className="nc-modal-panel nc-delete-dialog w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl" data-liquid-owned={liquidOwned} data-liquid-glass={liquidOwned ? 'enabled' : undefined}>
            <div className="nc-delete-body p-5">
              <div className="flex items-start gap-4">
                <div className="nc-delete-icon nc-delete-icon--danger flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="nc-delete-title text-base font-bold text-gray-950">
                    {tx('Sınav sonucu silinsin mi?', 'Delete exam result?', 'Eliminare il risultato esame?')}
                  </h2>
                  <p className="nc-delete-copy mt-1 text-sm leading-6 text-gray-500">
                    {tx(
                      'Bu işlem geri alınamaz. Seçili sınav sonucu sistemden kalıcı olarak silinecek.',
                      'This cannot be undone. The selected exam result will be permanently removed.',
                      'Questa azione non può essere annullata. Il risultato selezionato sarà eliminato definitivamente.'
                    )}
                  </p>
                  <div className="nc-delete-meta-card mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {getConsultantName(deleteResult)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {deleteResult.level} · {deleteResult.total_score}/40 · {formatDate(deleteResult.created_at)}
                    </div>
                  </div>
                  {deleteError && (
                    <div className="nc-delete-error mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {deleteError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="nc-delete-actions flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setDeletingId(null)
                  setDeleteError('')
                }}
                disabled={deleteLoading}
                className="nc-delete-cancel rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                {tx('Vazgeç', 'Cancel', 'Annulla')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteResult.id)}
                disabled={deleteLoading}
                className="nc-delete-danger inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? tx('Siliniyor...', 'Deleting...', 'Eliminazione...') : tx('Evet, sil', 'Yes, delete', 'Sì, elimina')}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {viewResult && (
        <Portal>
        <div
          className="nc-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          data-liquid-owned={liquidOwned}
          onClick={() => setViewResult(null)}
        >
          <div
            className="nc-modal-panel w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
            data-liquid-owned={liquidOwned}
            data-liquid-glass={liquidOwned ? 'enabled' : undefined}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {tx('Sınav Sonucu', 'Exam Result', 'Risultato Esame')}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {getConsultantName(viewResult)} · {formatDate(viewResult.created_at)}
                  {viewResult.training_type && (
                    <> · {viewResult.training_type === 'pre' ? 'Pre-Training' : 'Post-Training'}</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewResult(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-76px)] space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {tx('Seviye', 'Level', 'Livello')}
                  </p>
                  <p className="text-lg font-black text-gray-900 capitalize mt-1">{viewResult.level}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {tx('Toplam Puan', 'Total Score', 'Punteggio Totale')}
                  </p>
                  <p className="text-lg font-black text-gray-900 mt-1">{viewResult.total_score}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {tx('Eşik', 'Target', 'Soglia')}
                  </p>
                  <p className="text-lg font-black text-gray-900 mt-1">{PASS_THRESHOLDS[viewResult.level]}</p>
                </div>
                <div className={`rounded-2xl border p-4 ${
                  viewResult.passed ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {t.evaluations.result}
                  </p>
                  <p className={`text-lg font-black mt-1 ${viewResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {viewResult.passed ? tx('GEÇTİ', 'PASSED', 'SUPERATO') : tx('KALDI', 'FAILED', 'NON SUPERATO')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {tx('Sınav Notu', 'Exam Note', 'Nota Esame')}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {getStoredExamNote(viewResult)
                    ? getStoredExamNote(viewResult)
                    : tx('Not eklenmemiş.', 'No note added.', 'Nessuna nota aggiunta.')}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    {tx('Kriter Detayları', 'Criteria Breakdown', 'Dettaglio Criteri')}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {criteria.map((criterion, index) => {
                    const criteriaScores = Array.isArray(viewResult.criteria_scores) ? viewResult.criteria_scores : []
                    const score = criteriaScores.find(item => item.criteriaNumber === index + 1)?.score ?? 0

                    return (
                      <div key={criterion} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-6 h-6 rounded-lg bg-[#1B4332]/8 text-[#1B4332] text-xs font-black flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-700 flex-1 leading-snug">{criterion}</p>
                        <span className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-black flex-shrink-0 ${SCORE_STYLES[score] ?? 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                          {score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {editResult && (
        <Portal>
        <div className="nc-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" data-liquid-owned={liquidOwned}>
          <div className="nc-modal-panel w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl" data-liquid-owned={liquidOwned} data-liquid-glass={liquidOwned ? 'enabled' : undefined}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {tx('Sınav Sonucunu Düzenle', 'Edit Exam Result', 'Modifica Risultato Esame')}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {tx('Danışman, seviye ve kriter puanlarını güncelleyin.', 'Update consultant, level and criteria scores.', 'Aggiorna consulente, livello e punteggi dei criteri.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditResult(null)}
                disabled={editLoading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-146px)] space-y-4">
              {editError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {editError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t.evaluations.consultant}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                    <input
                      value={editConsultantName}
                      onChange={event => {
                        setEditConsultantName(event.target.value)
                        setEditError('')
                      }}
                      placeholder={tx('Danışman adını girin', 'Enter consultant name', 'Inserisci il nome del consulente')}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {tx('Eğitim Türü', 'Training Type', 'Tipo di Formazione')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['pre', 'post'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditTrainingType(type)}
                        className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          editTrainingType === type
                            ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-sm font-bold">{type === 'pre' ? 'Pre-Training' : 'Post-Training'}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {tx('Seviye', 'Level', 'Livello')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['junior', 'senior'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditLevel(level)}
                        className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          editLevel === level
                            ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-sm font-bold capitalize">{level}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {tx(`Eşik: ${PASS_THRESHOLDS[level]}`, `Target: ${PASS_THRESHOLDS[level]}`, `Soglia: ${PASS_THRESHOLDS[level]}`)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    {tx('Kriter Puanları', 'Criteria Scores', 'Punteggi Criteri')}
                  </p>
                  <p className="text-sm font-black text-[#1B4332]">
                    {editScores.reduce((sum, score) => sum + score, 0)} {tx('puan', 'points', 'punti')}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {criteria.map((criterion, index) => (
                    <div key={criterion} className="px-4 py-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#1B4332]/10 text-[#1B4332] text-xs font-black mr-2">
                              {index + 1}
                            </span>
                            {criterion}
                          </p>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 md:w-[300px]">
                          {[1, 2, 3, 4, 5].map(score => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => {
                                const next = [...editScores]
                                next[index] = score
                                setEditScores(next)
                                setEditError('')
                              }}
                              className={`h-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all duration-150 active:scale-[0.96] ${
                                editScores[index] === score
                                  ? SCORE_STYLES[score]
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    {tx('Sınav Notu', 'Exam Note', 'Nota Esame')}
                  </p>
                  <p className="text-xs font-semibold text-gray-400">
                    {editNote.length}/{MAX_NOTE_LENGTH}
                  </p>
                </div>
                <div className="p-4">
                  <textarea
                    value={editNote}
                    onChange={event => {
                      setEditNote(event.target.value.slice(0, MAX_NOTE_LENGTH))
                      setEditError('')
                    }}
                    maxLength={MAX_NOTE_LENGTH}
                    rows={4}
                    placeholder={tx('Sınavla ilgili kısa not ekleyin...', 'Add a short note about the exam...', 'Aggiungi una breve nota sull’esame...')}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditResult(null)}
                disabled={editLoading}
                className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#163728] rounded-xl transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {editLoading ? tx('Kaydediliyor...', 'Saving...', 'Salvataggio...') : t.common.save}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          {/* The shell header already prints this title. Class hook only — the
              glass sheet hides this copy; other accounts are untouched. */}
          <h1 className="nc-page-title-dup text-xl font-bold text-gray-900">
            {t.trainingExamResults.pageTitle}
          </h1>
          <p className="nc-record-count text-sm text-gray-400 mt-0.5">
            <span className="nc-record-num">{totalCount}</span> {tx('kayıt', 'records', 'record')}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/training-exam"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#163728] active:bg-[#122e20] rounded-xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{tx('Yeni Sınav', 'New Exam', 'Nuovo Esame')}</span>
          </Link>
        )}
      </div>

      {canSelectRows && selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#1B4332]/5 border border-[#1B4332]/15 rounded-2xl">
          <span className="text-sm font-medium text-[#1B4332]">
            {tx(`${selectedIds.size} kayıt seçildi`, `${selectedIds.size} selected`, `${selectedIds.size} selezionati`)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {tx('Seçimi temizle', 'Clear selection', 'Pulisci selezione')}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setBulkDeleteError('')
                  setBulkDeleteOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {tx('Seçilenleri Sil', 'Delete Selected', 'Elimina Selezionati')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">
              {tx('Filtreler', 'Filters', 'Filtri')}
            </span>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={localSearch}
              onChange={event => setLocalSearch(event.target.value)}
              placeholder={tx('Danışman adına göre ara...', 'Search by consultant name...', 'Cerca per nome consulente...')}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.clear}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="nc-filter-w w-[168px] flex-shrink-0">
            <SearchableSelect
              value={filterLevel}
              onChange={v => updateFilter('level', v)}
              options={[
                { value: 'junior', label: 'Junior' },
                { value: 'senior', label: 'Senior' },
              ]}
              placeholder={tx('Seviye: Tümü', 'Level: All', 'Livello: Tutti')}
              icon={Layers}
            />
          </div>

          <div className="nc-filter-w w-[176px] flex-shrink-0">
            <SearchableSelect
              value={filterResult}
              onChange={v => updateFilter('result', v)}
              options={[
                { value: 'passed', label: tx('Geçti', 'Passed', 'Superato') },
                { value: 'failed', label: tx('Kaldı', 'Failed', 'Non superato') },
              ]}
              placeholder={tx('Sonuç: Tümü', 'Result: All', 'Risultato: Tutti')}
              icon={Target}
            />
          </div>

          {canSelectRows && consultants.length > 0 && (
            <div className="nc-filter-w w-[200px] flex-shrink-0">
              <SearchableSelect
                value={filterConsultant}
                onChange={v => updateFilter('consultant', v)}
                options={consultants.map(consultant => ({
                  value: consultant.id,
                  label: consultant.full_name || consultant.email || 'Natural Clinic',
                }))}
                placeholder={tx('Danışman: Tümü', 'Consultant: All', 'Consulente: Tutti')}
                icon={User}
              />
            </div>
          )}

          {role === 'manager' && (
            <div className="nc-filter-w w-[200px] flex-shrink-0">
              <SearchableSelect
                value={filterEvaluator}
                onChange={v => updateFilter('evaluator', v)}
                options={evaluatorOptions.map(evaluator => ({
                  value: evaluator.id, label: evaluator.full_name || evaluator.email || 'Natural Clinic',
                }))}
                placeholder={tx('Değerlendiren: Tümü', 'Evaluator: All', 'Valutatore: Tutti')}
                icon={UserCog}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="w-[160px] sm:w-44">
              <DatePicker
                value={filterStartDate}
                onChange={v => updateFilter('startDate', v)}
                placeholder={t.evaluations.startDate}
                maxDate={filterEndDate || undefined}
              />
            </div>
            <span className="text-gray-400 text-sm">-</span>
            <div className="w-[160px] sm:w-44">
              <DatePicker
                value={filterEndDate}
                onChange={v => updateFilter('endDate', v)}
                placeholder={t.evaluations.endDate}
                minDate={filterStartDate || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity duration-150 ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {visibleResults.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-400">{tx('Henüz sınav sonucu bulunmuyor.', 'No exam results found.', 'Nessun risultato esame trovato.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {canSelectRows && (
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={visibleResults.length > 0 && selectedIds.size === visibleResults.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]/30 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortClick('date')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {tx('Sınav Tarihi', 'Exam Date', 'Data Esame')}
                      <SortIcon active={isServerActive('date')} dir={serverDir('date')} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    {t.evaluations.consultant}
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortClick('level')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {tx('Seviye', 'Level', 'Livello')}
                      <SortIcon active={isServerActive('level')} dir={serverDir('level')} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortClick('score')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors ml-auto"
                    >
                      {tx('Toplam Puan', 'Total Score', 'Punteggio Totale')}
                      <SortIcon active={isServerActive('score')} dir={serverDir('score')} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    {t.evaluations.result}
                  </th>
                  {canSelectRows && (
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      {tx('Durum', 'Status', 'Stato')}
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">
                    {t.evaluations.evaluator}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    {t.evaluations.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map(result => {
                  const threshold = PASS_THRESHOLDS[result.level]

                  return (
                    <tr
                      key={result.id}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
                        selectedIds.has(result.id) ? 'bg-[#1B4332]/[0.03]' : ''
                      }`}
                    >
                      {canSelectRows && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(result.id)}
                            onChange={() => toggleSelected(result.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]/30 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatDate(result.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {getConsultantName(result)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-[#1B4332]/8 text-[#1B4332] capitalize">
                          {result.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-base font-bold text-gray-900">
                          {result.total_score}
                        </span>
                        <span className="text-gray-300 text-xs ml-0.5">/40</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          title={tx(`Eşik ${threshold}`, `Target ${threshold}`, `Soglia ${threshold}`)}
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            result.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.passed
                            ? tx('GEÇTİ', 'PASSED', 'SUPERATO')
                            : tx('KALDI', 'FAILED', 'NON SUPERATO')}
                        </span>
                      </td>
                      {canSelectRows && (
                        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                            {result.training_type
                              ? result.training_type === 'pre'
                                ? 'Pre'
                                : 'Post'
                              : tx('Sınav', 'Exam', 'Esame')}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-600">
                        {result.evaluator?.full_name || result.evaluator?.email || 'Natural Clinic'}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewResult(result)}
                            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#1B4332] bg-[#1B4332]/8 hover:bg-[#1B4332]/15 rounded-lg transition-colors"
                            title={tx('Görüntüle', 'View', 'Visualizza')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{t.common.view}</span>
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(result)}
                              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title={tx('Düzenle', 'Edit', 'Modifica')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">{tx('Düzenle', 'Edit', 'Modifica')}</span>
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingId(result.id)
                                setDeleteError('')
                              }}
                              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title={tx('Sil', 'Delete', 'Elimina')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-gray-400 text-xs sm:text-sm">
            {tx(
              `${totalCount} kayıt · Sayfa ${currentPage} / ${totalPages}`,
              `${totalCount} records · Page ${currentPage} of ${totalPages}`,
              `${totalCount} record · Pagina ${currentPage} di ${totalPages}`
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="flex items-center gap-1 px-2.5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.back}</span>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                if (page < 1 || page > totalPages) return null

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    disabled={isPending}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-[#1B4332] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
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
