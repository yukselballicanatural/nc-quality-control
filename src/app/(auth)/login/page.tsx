'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage()
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(t.auth.invalidCredentials); return }
      if (!data.user)  { setError(t.auth.unknownError); return }
      await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      localStorage.setItem('nc_welcome', '1')
      setSuccess(true)
      router.push('/dashboard')
    } catch {
      setError(t.auth.unknownError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F4F4F2]">

      {/* ─── SOL: Fotoğraf ─────────────────────────────────────── */}
      <div className="hidden lg:block w-[52%] relative overflow-hidden flex-shrink-0">
        <Image
          src="/nc-building.png"
          alt="Natural Clinic"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Sinematik overlay */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />

        {/* Sol üst — küçük logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-8 left-8"
        >
          <Image
            src="/nc-logo-white.png"
            alt="Natural Clinic"
            width={150}
            height={48}
            className="object-contain object-left drop-shadow-lg opacity-90"
            priority
          />
        </motion.div>

        {/* Alt telif */}
        <p className="absolute bottom-7 left-8 text-white/25 text-[11px] tracking-widest uppercase font-medium select-none">
          © {new Date().getFullYear()} Natural Clinic
        </p>
      </div>

      {/* ─── SAĞ: Form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F4F4F2]">

        {/* Üst bar */}
        <div className="flex items-center justify-between px-10 sm:px-14 pt-8">
          {/* Mobil logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B4332] flex items-center justify-center">
              <span className="text-[11px] font-black text-white">NC</span>
            </div>
            <span className="text-sm font-bold text-gray-900">Natural Clinic</span>
          </div>
          <div className="hidden lg:block" />

          {/* Dil toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-white/70 backdrop-blur rounded-xl shadow-sm">
            {(['tr', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                  lang === l
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Form merkezi */}
        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 py-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px]"
          >

            {/* Başlık — kart dışında */}
            <div className="mb-8 px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#52B788] mb-2.5">
                Quality Control
              </p>
              <h1 className="text-[2.1rem] font-black text-gray-900 tracking-tight leading-none">
                {lang === 'tr' ? 'Giriş Yap' : 'Sign In'}
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                {lang === 'tr'
                  ? 'Hesabınıza erişmek için bilgilerinizi girin.'
                  : 'Enter your credentials to access your account.'}
              </p>
            </div>

            {/* ── FORM KARTI ─────────────────────────────── */}
            <form onSubmit={handleLogin}>
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-300/40 border border-white/80 p-7 sm:p-8 space-y-5">

                {/* E-posta */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">
                    {t.auth.email}
                  </label>
                  <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
                    focused === 'email'
                      ? 'border-[#1B4332] shadow-lg shadow-[#1B4332]/8'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      placeholder={t.auth.emailPlaceholder}
                      className="w-full px-4 py-3.5 bg-transparent text-sm text-gray-900 placeholder-gray-300 outline-none rounded-2xl"
                    />
                  </div>
                </div>

                {/* Şifre */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2.5">
                    {t.auth.password}
                  </label>
                  <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
                    focused === 'password'
                      ? 'border-[#1B4332] shadow-lg shadow-[#1B4332]/8'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder={t.auth.passwordPlaceholder}
                      className="w-full px-4 py-3.5 pr-12 bg-transparent text-sm text-gray-900 placeholder-gray-300 outline-none rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                      aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Hata */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-500">
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Ayırıcı */}
                <div className="h-px bg-gray-100" />

                {/* Giriş butonu */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full py-4 rounded-2xl text-white text-sm font-bold overflow-hidden transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed ${
                    success
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-200/60'
                      : 'bg-[#1B4332] hover:bg-[#163728] hover:shadow-xl hover:shadow-[#1B4332]/25 disabled:opacity-60'
                  }`}
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {success ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {lang === 'tr' ? 'Giriş Başarılı!' : 'Login Successful!'}
                      </>
                    ) : loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t.auth.loggingIn}
                      </>
                    ) : t.auth.loginButton}
                  </span>
                </button>

              </div>
            </form>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
