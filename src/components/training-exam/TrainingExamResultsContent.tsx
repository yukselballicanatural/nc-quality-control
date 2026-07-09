'use client'

import { useEffect, useState, useTransition } from 'react'
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
  XCircle,
  GraduationCap,
  Eye,
  Pencil,
  Trash2,
  Save,
  User,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { DatePicker } from '@/components/ui/DatePicker'
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
  filterStartDate: string
  filterEndDate: string
  sortBy: string
  sortDir: string
  role: UserRole
  consultants: ProfileSummary[]
  evaluatorOptions: ProfileSummary[]
}

const selectClass =
  'text-sm border border-gray-200 rounded-xl bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] cursor-pointer'

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

const SCORE_STYLES: Record<number, string> = {
  1: 'border-red-400 bg-red-50 text-red-700',
  2: 'border-orange-400 bg-orange-50 text-orange-700',
  3: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  4: 'border-blue-400 bg-blue-50 text-blue-700',
  5: 'border-green-400 bg-green-50 text-green-700',
}

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

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR')
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 inline ml-1" />
  return dir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#1B4332] inline ml-1" />
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
  filterStartDate,
  filterEndDate,
  sortBy: serverSortBy,
  sortDir: serverSortDir,
  role,
  consultants,
  evaluatorOptions,
}: Props) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [viewResult, setViewResult] = useState<TrainingExamResultItem | null>(null)
  const [editResult, setEditResult] = useState<TrainingExamResultItem | null>(null)
  const [editConsultantName, setEditConsultantName] = useState('')
  const [editLevel, setEditLevel] = useState<'junior' | 'senior'>('junior')
  const [editScores, setEditScores] = useState<number[]>(Array(8).fill(0))
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set())
  const isTr = lang === 'tr'
  const criteria = isTr ? CRITERIA_TR : CRITERIA_EN
  const canCreate = role === 'quality_team' || role === 'team_leader' || role === 'manager'
  const canEdit = role === 'quality_team' || role === 'team_leader' || role === 'manager'
  const canDelete = role === 'quality_team' || role === 'manager'

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

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
    return new Date(value).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', {
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
      setDeleteSuccess(isTr ? 'Sınav sonucu silindi.' : 'Exam result deleted.')
      setTimeout(() => setDeleteSuccess(''), 2500)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Training exam delete error:', error)
      setDeleteError(
        isTr
          ? 'Sınav sonucu silinemedi. Yetki veya bağlantı problemi olabilir.'
          : 'Exam result could not be deleted. There may be a permission or connection issue.'
      )
    } finally {
      setDeleteLoading(false)
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
      setEditError(isTr ? 'Danışman adı girilmesi zorunludur.' : 'Consultant name is required.')
      return
    }
    if (editScores.some(score => score < 1 || score > 5)) {
      setEditError(isTr ? 'Tüm kriterler 1-5 arası puanlanmalıdır.' : 'All criteria must be scored from 1 to 5.')
      return
    }

    const totalScore = editScores.reduce((sum, score) => sum + score, 0)
    const passed = totalScore >= PASS_THRESHOLDS[editLevel]

    setEditLoading(true)
    try {
      const supabase = createClient()
      const updatePayload = {
        consultant_id: matchedConsultant?.id ?? editResult.consultant_id ?? null,
        consultant_name: trimmedConsultantName,
        level: editLevel,
        criteria_scores: editScores.map((score, index) => ({
          criteriaNumber: index + 1,
          score,
        })),
        total_score: totalScore,
        passed,
      }

      let { error } = await supabase
        .from('training_exams')
        .update(updatePayload)
        .eq('id', editResult.id)

      if (isMissingTeamLeaderColumn(error)) {
        const payloadWithoutTeamLeader = {
          consultant_id: updatePayload.consultant_id,
          consultant_name: updatePayload.consultant_name,
          level: updatePayload.level,
          criteria_scores: updatePayload.criteria_scores,
          total_score: updatePayload.total_score,
          passed: updatePayload.passed,
        }
        const retry = await supabase
          .from('training_exams')
          .update(payloadWithoutTeamLeader)
          .eq('id', editResult.id)
        error = retry.error
      }

      if (isMissingConsultantNameColumn(error)) {
        const payloadWithoutConsultantName = {
          consultant_id: matchedConsultant?.id ?? editResult.consultant_id ?? null,
          level: updatePayload.level,
          criteria_scores: updatePayload.criteria_scores,
          total_score: updatePayload.total_score,
          passed: updatePayload.passed,
        }
        const retry = await supabase
          .from('training_exams')
          .update(payloadWithoutConsultantName)
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
      setEditError(isTr ? 'Güncelleme sırasında hata oluştu.' : 'Error updating result.')
    } finally {
      setEditLoading(false)
    }
  }

  const hasFilters =
    localSearch || filterLevel || filterResult || filterEvaluator || filterStartDate || filterEndDate
  const totalPages = Math.ceil(totalCount / pageSize)
  const visibleResults = results.filter(result => !deletedIds.has(result.id))
  const deleteResult = deletingId
    ? results.find(result => result.id === deletingId) ?? null
    : null

  return (
    <div className="space-y-4">
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 rounded-2xl bg-[#1B4332] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-[#1B4332]/30">
          <CheckCircle2 className="h-5 w-5 text-[#52B788]" />
          {deleteSuccess}
        </div>
      )}

      {deleteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-950">
                    {isTr ? 'Sınav sonucu silinsin mi?' : 'Delete exam result?'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {isTr
                      ? 'Bu işlem geri alınamaz. Seçili sınav sonucu sistemden kalıcı olarak silinecek.'
                      : 'This cannot be undone. The selected exam result will be permanently removed.'}
                  </p>
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {getConsultantName(deleteResult)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {deleteResult.level} · {deleteResult.total_score}/40 · {formatDate(deleteResult.created_at)}
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
                {isTr ? 'Vazgeç' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteResult.id)}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? (isTr ? 'Siliniyor...' : 'Deleting...') : (isTr ? 'Evet, sil' : 'Yes, delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isTr ? 'Sınav Sonucu' : 'Exam Result'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {getConsultantName(viewResult)} · {formatDate(viewResult.created_at)}
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
                    {isTr ? 'Seviye' : 'Level'}
                  </p>
                  <p className="text-lg font-black text-gray-900 capitalize mt-1">{viewResult.level}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {isTr ? 'Toplam Puan' : 'Total Score'}
                  </p>
                  <p className="text-lg font-black text-gray-900 mt-1">{viewResult.total_score}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {isTr ? 'Eşik' : 'Target'}
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
                    {viewResult.passed ? (isTr ? 'GEÇTİ' : 'PASSED') : (isTr ? 'KALDI' : 'FAILED')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    {isTr ? 'Kriter Detayları' : 'Criteria Breakdown'}
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
      )}

      {editResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isTr ? 'Sınav Sonucunu Düzenle' : 'Edit Exam Result'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {isTr ? 'Danışman, seviye ve kriter puanlarını güncelleyin.' : 'Update consultant, level and criteria scores.'}
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
                      placeholder={isTr ? 'Danışman adını girin' : 'Enter consultant name'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {isTr ? 'Seviye' : 'Level'}
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
                          {isTr ? `Eşik: ${PASS_THRESHOLDS[level]}` : `Target: ${PASS_THRESHOLDS[level]}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    {isTr ? 'Kriter Puanları' : 'Criteria Scores'}
                  </p>
                  <p className="text-sm font-black text-[#1B4332]">
                    {editScores.reduce((sum, score) => sum + score, 0)} {isTr ? 'puan' : 'points'}
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
                {editLoading ? (isTr ? 'Kaydediliyor...' : 'Saving...') : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t.trainingExamResults.pageTitle}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount} {isTr ? 'kayıt' : 'records'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/training-exam"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#163728] active:bg-[#122e20] rounded-xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{isTr ? 'Yeni Sınav' : 'New Exam'}</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={localSearch}
              onChange={event => setLocalSearch(event.target.value)}
              placeholder={isTr ? 'Danışman adına göre ara...' : 'Search by consultant name...'}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.clear}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterLevel}
            onChange={event => updateFilter('level', event.target.value)}
            className={selectClass}
          >
            <option value="">{isTr ? 'Tümü' : 'All'}</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
          </select>

          <select
            value={filterResult}
            onChange={event => updateFilter('result', event.target.value)}
            className={selectClass}
          >
            <option value="">{isTr ? 'Sonuca göre filtrele' : 'Filter by result'}</option>
            <option value="passed">{isTr ? 'Geçti' : 'Passed'}</option>
            <option value="failed">{isTr ? 'Kaldı' : 'Failed'}</option>
          </select>

          {role === 'manager' && (
            <select
              value={filterEvaluator}
              onChange={event => updateFilter('evaluator', event.target.value)}
              className={selectClass}
            >
              <option value="">{isTr ? 'De?erlendirene g?re filtrele' : 'Filter by evaluator'}</option>
              {evaluatorOptions.map(evaluator => (
                <option key={evaluator.id} value={evaluator.id}>
                  {evaluator.full_name || evaluator.email || 'Natural Clinic'}
                </option>
              ))}
            </select>
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
            <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {isTr ? 'Henüz sınav sonucu bulunmuyor.' : 'No exam results found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortClick('date')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {isTr ? 'Sınav Tarihi' : 'Exam Date'}
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
                      {isTr ? 'Seviye' : 'Level'}
                      <SortIcon active={isServerActive('level')} dir={serverDir('level')} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSortClick('score')}
                      className="flex items-center font-medium text-gray-500 hover:text-gray-800 transition-colors ml-auto"
                    >
                      {isTr ? 'Toplam Puan' : 'Total Score'}
                      <SortIcon active={isServerActive('score')} dir={serverDir('score')} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    {t.evaluations.result}
                  </th>
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
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatDate(result.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {getConsultantName(result)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold bg-[#1B4332]/8 text-[#1B4332] capitalize">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {result.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-base font-bold text-gray-900">
                          {result.total_score}
                        </span>
                        <span className="text-gray-300 text-xs ml-1">
                          {isTr ? `eşik ${threshold}` : `target ${threshold}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold ${
                            result.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.passed
                            ? <CheckCircle2 className="w-3.5 h-3.5" />
                            : <XCircle className="w-3.5 h-3.5" />
                          }
                          {result.passed
                            ? (isTr ? 'GEÇTİ' : 'PASSED')
                            : (isTr ? 'KALDI' : 'FAILED')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-600">
                        {result.evaluator?.full_name || result.evaluator?.email || 'Natural Clinic'}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewResult(result)}
                            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#1B4332] bg-[#1B4332]/8 hover:bg-[#1B4332]/15 rounded-lg transition-colors"
                            title={isTr ? 'Görüntüle' : 'View'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{t.common.view}</span>
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(result)}
                              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title={isTr ? 'Düzenle' : 'Edit'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">{isTr ? 'Düzenle' : 'Edit'}</span>
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
                              title={isTr ? 'Sil' : 'Delete'}
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
            {isTr
              ? `${totalCount} kayıt · Sayfa ${currentPage} / ${totalPages}`
              : `${totalCount} records · Page ${currentPage} of ${totalPages}`}
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
