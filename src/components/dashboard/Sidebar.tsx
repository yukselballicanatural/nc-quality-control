'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle2,
  CalendarClock,
  GraduationCap,
  Award,
  FileClock,
} from 'lucide-react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import { canSeeAdminLogs, isRestrictedQualityUser } from '@/lib/access-control'
import type { Profile } from '@/types'
import type { UserRole } from '@/types/supabase'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  allowedRoles: UserRole[]
}

interface DashboardShellProps {
  profile: Profile
  children: React.ReactNode
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [recheckUrgentCount, setRecheckUrgentCount] = useState(0)
  const { lang, setLang, t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function fetchRecheckCount() {
      const today = new Date().toISOString().split('T')[0]
      const supabase = createBrowserClient()
      let query = supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .not('dev_recheck_date', 'is', null)
        .lte('dev_recheck_date', today)
        .eq('recheck_done', false)

      if (isRestrictedQualityUser(profile)) {
        query = query.eq('evaluator_id', profile.id)
      } else if (profile.role === 'team_leader' && profile.team_id) {
        query = query.eq('team_id', profile.team_id)
      }

      query.then(({ count }) => setRecheckUrgentCount(count ?? 0))
    }

    fetchRecheckCount()
    window.addEventListener('recheck-updated', fetchRecheckCount)
    return () => window.removeEventListener('recheck-updated', fetchRecheckCount)
  }, [profile])

  useEffect(() => {
    if (localStorage.getItem('nc_welcome') === '1') {
      localStorage.removeItem('nc_welcome')
      setShowWelcome(true)
    }
  }, [])

  useEffect(() => {
    if (!showWelcome) return
    const timer = setTimeout(() => setShowWelcome(false), 7000)
    return () => clearTimeout(timer)
  }, [showWelcome])

  const allNavItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t.nav.dashboard,
      allowedRoles: ['quality_team', 'team_leader', 'manager', 'consultant'] as UserRole[],
    },
    {
      href: '/evaluations/new',
      icon: FilePlus,
      label: t.nav.newEvaluation,
      allowedRoles: ['quality_team', 'team_leader', 'manager'] as UserRole[],
    },
    {
      href: '/evaluations',
      icon: ClipboardList,
      label: profile.role === 'consultant' ? t.nav.myEvaluations : t.nav.evaluations,
      allowedRoles: ['quality_team', 'team_leader', 'manager', 'consultant'] as UserRole[],
    },
    {
      href: '/recheck',
      icon: CalendarClock,
      label: t.nav.recheck,
      allowedRoles: ['quality_team', 'team_leader', 'manager'] as UserRole[],
    },
    {
      href: '/training-exam',
      icon: GraduationCap,
      label: t.nav.trainingExam,
      allowedRoles: ['quality_team', 'team_leader', 'manager'] as UserRole[],
    },
    {
      href: '/training-exam-results',
      icon: Award,
      label: t.nav.trainingExamResults,
      allowedRoles: ['quality_team', 'team_leader', 'manager'] as UserRole[],
    },
    {
      href: '/reports',
      icon: BarChart3,
      label: t.nav.reports,
      allowedRoles: ['quality_team', 'team_leader', 'manager'] as UserRole[],
    },
    {
      href: '/settings',
      icon: Settings,
      label: t.nav.settings,
      allowedRoles: ['quality_team', 'team_leader', 'manager', 'consultant'] as UserRole[],
    },
    {
      href: '/logs',
      icon: FileClock,
      label: lang === 'tr' ? 'Loglar' : 'Logs',
      allowedRoles: ['manager'] as UserRole[],
    },
  ]

  const navItems = allNavItems.filter(item => {
    if (item.href === '/logs') return canSeeAdminLogs(profile)
    return item.allowedRoles.includes(profile.role)
  })
  const navPrefetchKey = navItems.map(item => item.href).join('|')

  useEffect(() => {
    navItems.forEach(item => router.prefetch(item.href))
  }, [navPrefetchKey, router])

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/evaluations') {
      return (
        pathname === '/evaluations' ||
        (pathname.startsWith('/evaluations/') && !pathname.startsWith('/evaluations/new'))
      )
    }
    if (href === '/training-exam') return pathname === '/training-exam'
    if (href === '/training-exam-results') return pathname.startsWith('/training-exam-results')
    return pathname.startsWith(href)
  }

  function getPageTitle() {
    if (pathname === '/dashboard') return t.dashboard.pageTitle
    if (pathname.startsWith('/evaluations/new')) return t.form.newEvaluation
    if (pathname.startsWith('/evaluations')) return t.evaluations.pageTitle
    if (pathname.startsWith('/recheck')) return t.recheck.pageTitle
    if (pathname.startsWith('/training-exam-results')) return t.trainingExamResults.pageTitle
    if (pathname.startsWith('/training-exam')) return t.trainingExam.pageTitle
    if (pathname.startsWith('/reports')) return t.reports.pageTitle
    if (pathname.startsWith('/settings')) return t.settings.pageTitle
    if (pathname.startsWith('/logs')) return lang === 'tr' ? 'Loglar' : 'Logs'
    return 'Natural Clinic QC'
  }

  async function handleLogout() {
    try {
      const supabase = createClient()
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', entityType: 'auth' }),
      }).catch(() => null)
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1B4332] flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile close */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-white/60 hover:text-white transition-colors md:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <Image
            src="/nc-logo-white.png"
            alt="Natural Clinic"
            width={110}
            height={34}
            className="object-contain object-left opacity-90"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#52B788]' : ''}`} />
                <span className="flex-1">{item.label}</span>
                {item.href === '/recheck' && recheckUrgentCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {recheckUrgentCount > 99 ? '99+' : recheckUrgentCount}
                  </span>
                )}
                {active && item.href !== '/recheck' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                )}
                {active && item.href === '/recheck' && recheckUrgentCount === 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-1">
          <div className="px-3 py-2.5 rounded-xl bg-white/5">
            <p className="text-white text-sm font-medium truncate leading-snug">
              {profile.full_name || profile.email}
            </p>
            <p className="text-white/45 text-xs truncate mt-0.5">
              {t.roles[profile.role]}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {t.auth.logout}
          </button>
        </div>
      </aside>

      {/* Welcome toast */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="toast-timer-border fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 text-white shadow-2xl shadow-[#1B4332]/30"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">
                {lang === 'tr' ? 'Giriş Başarılı' : 'Login Successful'}
              </p>
              <p className="text-[11px] text-white/55 mt-0.5">
                {lang === 'tr' ? 'Hoş geldiniz 👋' : 'Welcome back 👋'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">
            {getPageTitle()}
          </h1>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLang('tr')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'tr'
                    ? 'bg-white text-[#1B4332] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'en'
                    ? 'bg-white text-[#1B4332] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                EN
              </button>
            </div>

            {/* Bell (placeholder) */}
            <button
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main key={pathname} className="flex-1 p-4 md:p-6 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
