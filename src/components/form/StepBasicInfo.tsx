'use client'

import { MessageSquare, Phone, User, Users, Building2, ClipboardList, Calendar, FileText } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import type { UserRole, ChannelType, SalesStage } from '@/types/supabase'

export interface StepBasicInfoProps {
  role: UserRole
  evaluatorId: string
  evaluatorName: string
  consultants: { id: string; full_name: string }[]
  teamLeaders: { id: string; full_name: string }[]
  teams: { id: string; name: string }[]
}

const TODAY = new Date().toISOString().slice(0, 10)

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all hover:border-gray-300'
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'
const sectionCls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 pb-3 border-b border-gray-50">
      <div className="w-7 h-7 rounded-lg bg-[#1B4332]/8 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#1B4332]" />
      </div>
      <span className="text-sm font-bold text-gray-700">{title}</span>
    </div>
  )
}

const STAGES: SalesStage[] = [
  'fresh_lead',
  'new_sales_opportunities',
  'warm_lead',
  'offer_created',
  'offer_shared',
  'deal',
  'platform_agents',
  'second_visit',
]

export function StepBasicInfo({ evaluatorId, evaluatorName, consultants, teamLeaders, teams }: StepBasicInfoProps) {
  const { lang, t } = useLanguage()
  const { step1, updateStep1 } = useFormStore()

  const displayEvaluatorName =
    evaluatorName ||
    consultants.find(c => c.id === evaluatorId)?.full_name ||
    teamLeaders.find(tl => tl.id === evaluatorId)?.full_name ||
    t.auth.title

  function toggleChannel(ch: ChannelType) {
    const already = step1.channels.includes(ch)
    updateStep1({
      channels: already
        ? step1.channels.filter(c => c !== ch)
        : [...step1.channels, ch],
    })
  }

  return (
    <div className="space-y-3">

      {/* ── Kişiler ─────────────────────────────────────── */}
      <div className={sectionCls}>
        <SectionHeader icon={Users} title={lang === 'tr' ? 'Kişiler' : 'People'} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              {t.form.step1.consultant} <span className="text-red-400 normal-case tracking-normal">*</span>
            </label>
            <SearchableSelect
              value={step1.consultantId}
              onChange={v => updateStep1({ consultantId: v })}
              options={consultants.map(c => ({ value: c.id, label: c.full_name }))}
              placeholder={t.form.step1.consultantPlaceholder}
              icon={User}
              required
            />
          </div>

          <div>
            <label className={labelCls}>{t.form.step1.teamLeader}</label>
            <SearchableSelect
              value={step1.teamLeaderId}
              onChange={v => updateStep1({ teamLeaderId: v })}
              options={teamLeaders.map(tl => ({ value: tl.id, label: tl.full_name }))}
              placeholder={t.form.step1.teamLeaderPlaceholder}
              icon={User}
            />
          </div>

          <div>
            <label className={labelCls}>{t.form.step1.team}</label>
            <SearchableSelect
              value={step1.teamId}
              onChange={v => updateStep1({ teamId: v })}
              options={teams.map(tm => ({ value: tm.id, label: tm.name }))}
              placeholder={t.form.step1.teamPlaceholder}
              icon={Building2}
            />
          </div>

          <div>
            <label className={labelCls}>{t.form.step1.evaluator}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <div className={`${inputCls} pl-10 bg-gray-50 text-gray-400 cursor-default`}>
                {displayEvaluatorName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Müşteri Bilgileri ────────────────────────────── */}
      <div className={sectionCls}>
        <SectionHeader icon={ClipboardList} title={lang === 'tr' ? 'Müşteri Bilgileri' : 'Customer Info'} />

        <div>
          <label className={labelCls}>
            {t.form.step1.customerPhone} <span className="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              type="tel"
              inputMode="numeric"
              value={step1.customerPhone}
              onChange={e => updateStep1({ customerPhone: e.target.value.replace(/[^\d+]/g, '') })}
              placeholder={t.form.step1.customerPhonePlaceholder}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        {/* Kanal — çoklu seçim */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls + ' mb-0'}>
              {t.form.step1.channel} <span className="text-red-400 normal-case tracking-normal">*</span>
            </label>
            <span className="text-[10px] text-gray-400 font-medium">{t.form.step1.channelHint}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['whatsapp', 'call'] as ChannelType[]).map(ch => {
              const Icon = ch === 'whatsapp' ? MessageSquare : Phone
              const isSelected = step1.channels.includes(ch)
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`flex items-center gap-3 py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {ch === 'whatsapp' ? t.form.step1.whatsapp : t.form.step1.call}
                  {isSelected && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tarih ───────────────────────────────────── */}
      <div className={sectionCls}>
        <SectionHeader icon={Calendar} title={lang === 'tr' ? 'Tarih Bilgileri' : 'Date Information'} />

        {/* İncelenen dönem aralığı */}
        <div>
          <label className={labelCls}>
            {t.form.step1.reviewPeriod} <span className="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                {t.form.step1.reviewPeriodStart}
              </p>
              <DatePicker
                value={step1.reviewStartDate}
                onChange={v => {
                  updateStep1({ reviewStartDate: v })
                  // bitiş seçili ve yeni başlangıçtan önceyse sıfırla
                  if (step1.reviewEndDate && v && v > step1.reviewEndDate) {
                    updateStep1({ reviewEndDate: '' })
                  }
                }}
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">
                {t.form.step1.reviewPeriodEnd}
              </p>
              <DatePicker
                value={step1.reviewEndDate}
                onChange={v => {
                  if (step1.reviewStartDate && v && v < step1.reviewStartDate) return
                  updateStep1({ reviewEndDate: v })
                }}
                minDate={step1.reviewStartDate || undefined}
              />
              {step1.reviewStartDate && step1.reviewEndDate && step1.reviewEndDate < step1.reviewStartDate && (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                  {lang === 'tr' ? 'Bitiş tarihi başlangıç tarihinden önce olamaz.' : 'End date cannot be before start date.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Kontrol tarihi */}
        <div>
          <label className={labelCls}>
            {t.form.step1.controlDate} <span className="text-red-400 normal-case tracking-normal">*</span>
          </label>
          <p className="text-[10px] text-gray-400 mb-1.5">{t.form.step1.controlDateHint}</p>
          <DatePicker
            value={step1.controlDate}
            onChange={v => updateStep1({ controlDate: v })}
            maxDate={TODAY}
          />
        </div>
      </div>

      {/* ── Satış Süreci (Stage) ─────────────────────── */}
      <div className={sectionCls}>
        <SectionHeader icon={ClipboardList} title={t.form.step1.salesStage} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STAGES.map(s => {
            const isSelected = step1.stage === s
            const label = t.form.step1.stages[s]
            const sub = t.form.step1.stagesSub[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => updateStep1({ stage: isSelected ? '' : s })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-[#1B4332] bg-[#1B4332]/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-[#1B4332]' : 'bg-gray-300'
                }`} />
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-[#1B4332]' : 'text-gray-700'}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Genel Not ───────────────────────────────────── */}
      <div className={sectionCls}>
        <SectionHeader icon={FileText} title={lang === 'tr' ? 'Genel Not' : 'General Note'} />
        <textarea
          value={step1.generalNote}
          onChange={e => updateStep1({ generalNote: e.target.value })}
          placeholder={t.form.step1.generalNotePlaceholder}
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  )
}
