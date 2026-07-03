'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Building2,
  Plus,
  X,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldCheck,
  Pencil,
  KeyRound,
  Trash2,
  UserCircle,
  AlertTriangle,
} from 'lucide-react'
import type { UserRole } from '@/types/supabase'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  team_id: string | null
  is_active: boolean
  created_at: string
}

interface Team {
  id: string
  name: string
}

interface Props {
  currentProfile: UserRow
  users: UserRow[]
  teams: Team[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  quality_team: 'Kalite Ekibi',
  team_leader: 'Takım Lideri',
  manager: 'Yönetici',
  consultant: 'Danışman',
}

const ROLE_COLORS: Record<UserRole, string> = {
  quality_team: 'bg-emerald-100 text-emerald-800',
  team_leader: 'bg-blue-100 text-blue-800',
  manager: 'bg-purple-100 text-purple-800',
  consultant: 'bg-orange-100 text-orange-800',
}

const CREATABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'consultant', label: 'Danışman' },
  { value: 'team_leader', label: 'Takım Lideri' },
]

type Tab = 'users' | 'teams' | 'account'

function initAddForm() {
  return { full_name: '', email: '', password: '', role: 'consultant' as UserRole, team_id: '' }
}

export default function SettingsContent({ currentProfile, users, teams }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  // ── Add User ────────────────────────────────────────────────────────
  const [showAddUser, setShowAddUser] = useState(false)
  const [addForm, setAddForm] = useState(initAddForm)
  const [showAddPw, setShowAddPw] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  // ── Edit User ───────────────────────────────────────────────────────
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: 'consultant' as UserRole, team_id: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // ── Reset Password ──────────────────────────────────────────────────
  const [pwUser, setPwUser] = useState<UserRow | null>(null)
  const [newPw, setNewPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  // ── Delete User ─────────────────────────────────────────────────────
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Add Team ────────────────────────────────────────────────────────
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState<string | null>(null)

  // ── Delete Team ─────────────────────────────────────────────────────
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null)
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false)
  const [deleteTeamError, setDeleteTeamError] = useState<string | null>(null)

  // ── My Account ──────────────────────────────────────────────────────
  const [selfPw, setSelfPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showSelfPw, setShowSelfPw] = useState(false)
  const [selfPwLoading, setSelfPwLoading] = useState(false)
  const [selfPwMsg, setSelfPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const canManage = ['quality_team', 'manager'].includes(currentProfile.role)
  const teamMap = new Map(teams.map(t => [t.id, t.name]))

  function refresh() {
    startTransition(() => router.refresh())
  }

  // ── Handlers ────────────────────────────────────────────────────────

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Bir hata oluştu'); return }
      setShowAddUser(false)
      setAddForm(initAddForm)
      refresh()
    } catch { setAddError('Bağlantı hatası') }
    finally { setAddLoading(false) }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditError(null)
    setEditLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, full_name: editForm.full_name, role: editForm.role, team_id: editForm.team_id || null }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Bir hata oluştu'); return }
      setEditUser(null)
      refresh()
    } catch { setEditError('Bağlantı hatası') }
    finally { setEditLoading(false) }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwUser) return
    setPwError(null)
    setPwLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pwUser.id, password: newPw }),
      })
      const data = await res.json()
      if (!res.ok) { setPwError(data.error ?? 'Bir hata oluştu'); return }
      setPwUser(null)
      setNewPw('')
    } catch { setPwError('Bağlantı hatası') }
    finally { setPwLoading(false) }
  }

  async function handleDeleteUser() {
    if (!deleteUser) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteUser.id }),
      })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error ?? 'Silinemedi'); return }
      setDeleteUser(null)
      refresh()
    } catch { setDeleteError('Bağlantı hatası') }
    finally { setDeleteLoading(false) }
  }

  async function toggleActive(u: UserRow) {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
    })
    if (res.ok) refresh()
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault()
    setTeamError(null)
    setTeamLoading(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      })
      const data = await res.json()
      if (!res.ok) { setTeamError(data.error ?? 'Bir hata oluştu'); return }
      setShowAddTeam(false)
      setTeamName('')
      refresh()
    } catch { setTeamError('Bağlantı hatası') }
    finally { setTeamLoading(false) }
  }

  async function handleDeleteTeam() {
    if (!deleteTeam) return
    setDeleteTeamLoading(true)
    setDeleteTeamError(null)
    try {
      const res = await fetch('/api/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTeam.id }),
      })
      const data = await res.json()
      if (!res.ok) { setDeleteTeamError(data.error ?? 'Silinemedi'); return }
      setDeleteTeam(null)
      refresh()
    } catch { setDeleteTeamError('Bağlantı hatası') }
    finally { setDeleteTeamLoading(false) }
  }

  async function handleSelfPassword(e: React.FormEvent) {
    e.preventDefault()
    setSelfPwMsg(null)
    if (selfPw.newPw !== selfPw.confirm) {
      setSelfPwMsg({ type: 'err', text: 'Şifreler eşleşmiyor' })
      return
    }
    if (selfPw.newPw.length < 6) {
      setSelfPwMsg({ type: 'err', text: 'Şifre en az 6 karakter olmalı' })
      return
    }
    setSelfPwLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: selfPw.newPw })
      if (error) {
        setSelfPwMsg({ type: 'err', text: error.message })
      } else {
        setSelfPwMsg({ type: 'ok', text: 'Şifreniz başarıyla güncellendi.' })
        setSelfPw({ current: '', newPw: '', confirm: '' })
      }
    } catch {
      setSelfPwMsg({ type: 'err', text: 'Bir hata oluştu' })
    } finally {
      setSelfPwLoading(false)
    }
  }

  // ── Tabs config ─────────────────────────────────────────────────────
  const tabs = canManage
    ? [
        { key: 'users' as Tab, label: 'Kullanıcılar', Icon: Users },
        { key: 'teams' as Tab, label: 'Takımlar', Icon: Building2 },
        { key: 'account' as Tab, label: 'Hesabım', Icon: UserCircle },
      ]
    : [{ key: 'account' as Tab, label: 'Hesabım', Icon: UserCircle }]

  return (
    <div className={`transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-1">Kullanıcı, takım ve hesap yönetimi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto mb-5">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-[#1B4332] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════ USERS TAB ════════════════ */}
      {activeTab === 'users' && canManage && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Kullanıcılar</h2>
              <p className="text-sm text-gray-500">{users.length} kullanıcı</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#163728] transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Kullanıcı Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Kullanıcı', 'Rol', 'Takım', 'Durum', 'İşlemler'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#1B4332]">
                            {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">{u.full_name}</span>
                            {u.id === currentProfile.id && (
                              <span className="text-[10px] text-gray-400 font-normal flex-shrink-0">(Sen)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {u.team_id ? teamMap.get(u.team_id) ?? '—' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={u.id === currentProfile.id}
                        title={u.is_active ? 'Pasife al' : 'Aktif et'}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.is_active ? 'bg-[#1B4332]' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          u.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser(u)
                            setEditForm({ full_name: u.full_name, role: u.role, team_id: u.team_id ?? '' })
                            setEditError(null)
                          }}
                          title="Düzenle"
                          className="p-1.5 text-gray-400 hover:text-[#1B4332] hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setPwUser(u); setNewPw(''); setPwError(null) }}
                          title="Şifre sıfırla"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentProfile.id && (
                          <button
                            onClick={() => { setDeleteUser(u); setDeleteError(null) }}
                            title="Sil"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TEAMS TAB ════════════════ */}
      {activeTab === 'teams' && canManage && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Takımlar</h2>
              <p className="text-sm text-gray-500">{teams.length} takım</p>
            </div>
            <button
              onClick={() => setShowAddTeam(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#163728] transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Takım Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Henüz takım oluşturulmamış</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[360px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Takım Adı', 'Üye Sayısı', ''].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider first:pl-5 last:pr-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teams.map(team => {
                    const memberCount = users.filter(u => u.team_id === team.id).length
                    return (
                      <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{memberCount} kişi</td>
                        <td className="px-5 py-3.5 pr-6 text-right">
                          <button
                            onClick={() => { setDeleteTeam(team); setDeleteTeamError(null) }}
                            title="Takımı sil"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ ACCOUNT TAB ════════════════ */}
      {activeTab === 'account' && (
        <div className="max-w-lg space-y-6">
          {/* Profil kartı */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Profil Bilgileri</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-[#1B4332]">
                  {currentProfile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">{currentProfile.full_name}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${ROLE_COLORS[currentProfile.role]}`}>
                  {ROLE_LABELS[currentProfile.role]}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm divide-y divide-gray-50">
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">E-posta</span>
                <span className="text-gray-900 font-medium">{currentProfile.email}</span>
              </div>
              {currentProfile.team_id && (
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-500">Takım</span>
                  <span className="text-gray-900 font-medium">{teamMap.get(currentProfile.team_id) ?? '—'}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500">Durum</span>
                <span className={`font-medium ${currentProfile.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                  {currentProfile.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </div>

          {/* Şifre değiştir */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Şifre Değiştir</h2>
            <form onSubmit={handleSelfPassword} className="space-y-4">
              {[
                { label: 'Yeni Şifre', key: 'newPw' as const, placeholder: 'En az 6 karakter' },
                { label: 'Yeni Şifre (Tekrar)', key: 'confirm' as const, placeholder: 'Şifreyi tekrar girin' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showSelfPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={selfPw[key]}
                      onChange={e => setSelfPw(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors"
                    />
                    {key === 'newPw' && (
                      <button
                        type="button"
                        onClick={() => setShowSelfPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSelfPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {selfPwMsg && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
                  selfPwMsg.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${selfPwMsg.type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {selfPwMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={selfPwLoading}
                className="w-full py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#163728] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {selfPwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {selfPwLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ MODALS ════════════ */}

      {/* Add User */}
      {showAddUser && (
        <Modal title="Kullanıcı Ekle" icon={<ShieldCheck className="w-5 h-5 text-[#1B4332]" />} onClose={() => { setShowAddUser(false); setAddError(null); setAddForm(initAddForm) }}>
          <form onSubmit={handleAddUser} className="space-y-4">
            <Field label="Ad Soyad">
              <input type="text" required autoFocus value={addForm.full_name}
                onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Örn: Ahmet Yılmaz" className={inputCls} />
            </Field>
            <Field label="E-posta">
              <input type="email" required value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ahmet@naturalclinic.com" className={inputCls} />
            </Field>
            <Field label="Şifre">
              <div className="relative">
                <input type={showAddPw ? 'text' : 'password'} required minLength={6}
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="En az 6 karakter" className={`${inputCls} pr-11`} />
                <PwToggle show={showAddPw} onToggle={() => setShowAddPw(v => !v)} />
              </div>
            </Field>
            <Field label="Rol">
              <div className="grid grid-cols-2 gap-2">
                {CREATABLE_ROLES.map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => setAddForm(f => ({ ...f, role: value }))}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      addForm.role === value ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {addForm.role === value && <Check className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            {teams.length > 0 && (
              <Field label={<>Takım <span className="text-gray-400 font-normal">(opsiyonel)</span></>}>
                <select value={addForm.team_id} onChange={e => setAddForm(f => ({ ...f, team_id: e.target.value }))} className={selectCls}>
                  <option value="">Takım seçin</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            )}
            {addError && <ErrorMsg>{addError}</ErrorMsg>}
            <ModalActions loading={addLoading} loadingLabel="Ekleniyor..." label="Ekle"
              onCancel={() => { setShowAddUser(false); setAddError(null); setAddForm(initAddForm) }} />
          </form>
        </Modal>
      )}

      {/* Edit User */}
      {editUser && (
        <Modal title="Kullanıcıyı Düzenle" icon={<Pencil className="w-5 h-5 text-[#1B4332]" />} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEditUser} className="space-y-4">
            <Field label="Ad Soyad">
              <input type="text" required value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Rol">
              <div className="grid grid-cols-2 gap-2">
                {CREATABLE_ROLES.map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => setEditForm(f => ({ ...f, role: value }))}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      editForm.role === value ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {editForm.role === value && <Check className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            {teams.length > 0 && (
              <Field label={<>Takım <span className="text-gray-400 font-normal">(opsiyonel)</span></>}>
                <select value={editForm.team_id} onChange={e => setEditForm(f => ({ ...f, team_id: e.target.value }))} className={selectCls}>
                  <option value="">Takım seçin</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            )}
            {editError && <ErrorMsg>{editError}</ErrorMsg>}
            <ModalActions loading={editLoading} loadingLabel="Kaydediliyor..." label="Kaydet" onCancel={() => setEditUser(null)} />
          </form>
        </Modal>
      )}

      {/* Reset Password */}
      {pwUser && (
        <Modal title={`Şifre Sıfırla — ${pwUser.full_name}`} icon={<KeyRound className="w-5 h-5 text-blue-600" />} onClose={() => setPwUser(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Field label="Yeni Şifre">
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} required minLength={6}
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="En az 6 karakter" autoFocus className={`${inputCls} pr-11`} />
                <PwToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
              </div>
            </Field>
            {pwError && <ErrorMsg>{pwError}</ErrorMsg>}
            <ModalActions loading={pwLoading} loadingLabel="Sıfırlanıyor..." label="Şifreyi Sıfırla" onCancel={() => setPwUser(null)} />
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation */}
      {deleteUser && (
        <Modal title="Kullanıcıyı Sil" icon={<AlertTriangle className="w-5 h-5 text-red-500" />} onClose={() => setDeleteUser(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{deleteUser.full_name}</span> adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?
            </p>
            <p className="text-xs text-gray-400">Değerlendirme kaydı varsa kullanıcı silinemez; bunun yerine pasife alabilirsiniz.</p>
            {deleteError && <ErrorMsg>{deleteError}</ErrorMsg>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={handleDeleteUser} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Team */}
      {showAddTeam && (
        <Modal title="Takım Ekle" icon={<Building2 className="w-5 h-5 text-[#1B4332]" />} onClose={() => { setShowAddTeam(false); setTeamError(null) }}>
          <form onSubmit={handleAddTeam} className="space-y-4">
            <Field label="Takım Adı">
              <input type="text" required autoFocus value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Örn: Satış Takımı B" className={inputCls} />
            </Field>
            {teamError && <ErrorMsg>{teamError}</ErrorMsg>}
            <ModalActions loading={teamLoading} loadingLabel="Oluşturuluyor..." label="Oluştur"
              onCancel={() => { setShowAddTeam(false); setTeamError(null) }} />
          </form>
        </Modal>
      )}

      {/* Delete Team Confirmation */}
      {deleteTeam && (
        <Modal title="Takımı Sil" icon={<AlertTriangle className="w-5 h-5 text-red-500" />} onClose={() => setDeleteTeam(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{deleteTeam.name}</span> takımını silmek istediğinizden emin misiniz?
            </p>
            <p className="text-xs text-gray-400">Bu takımda üye varsa silme işlemi gerçekleşmez.</p>
            {deleteTeamError && <ErrorMsg>{deleteTeamError}</ErrorMsg>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTeam(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={handleDeleteTeam} disabled={deleteTeamLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteTeamLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteTeamLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Shared mini-components ────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors'

const selectCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-colors'

function Modal({ title, icon, onClose, children }: {
  title: string; icon?: React.ReactNode; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function PwToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
      <p className="text-sm text-red-600">{children}</p>
    </div>
  )
}

function ModalActions({ loading, loadingLabel, label, onCancel }: {
  loading: boolean; loadingLabel: string; label: string; onCancel: () => void
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
        İptal
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#163728] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? loadingLabel : label}
      </button>
    </div>
  )
}
