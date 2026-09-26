import { useState } from 'react'
import logoMark from '../assets/logo-mark.png'
import bgImage from '../assets/railway_background.jpg'
import { useTranslation } from '../store/TranslationContext.jsx'
import { api } from '../api.js'

export default function Login({ onLoginSuccess, onBackToLanding }) {
  const { t } = useTranslation()
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [step, setStep] = useState('form') // 'form' | 'verification' | 'forgot_password' | 'reset_password'
  
  const [name, setName] = useState('')
  const [role, setRole] = useState('Section Engineer')
  const [department, setDepartment] = useState('ENG')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)
  
  const division = 'Delhi (DLI)'
  const corridor = 'NDLS-GZB'

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    try {
      if (authMode === 'login') {
        const res = await api.login({ email, password })
        setInfoMessage(res.message || 'OTP dispatched to your official email.')
        setStep('verification')
      } else {
        const res = await api.register({
          name: name || 'Railway Officer',
          email,
          password,
          role,
          department: role === 'DRM' ? 'ALL' : department,
          division,
        })
        setInfoMessage(res.message || 'Registration successful. OTP sent to your email.')
        setStep('verification')
      }
    } catch (err) {
      setError(err.detail || err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.verifyOtp({ email, otp })
      if (res.access_token) {
        localStorage.setItem('token', res.access_token)
      }
      onLoginSuccess(res.user || {
        role,
        department: role === 'DRM' ? 'ALL' : department,
        division,
        corridor,
        name: name || email,
        email,
      })
    } catch (err) {
      setError(err.detail || err.message || 'Invalid or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = (e) => {
    e.preventDefault()
    setStep('reset_password')
  }

  const handleResetSubmit = (e) => {
    e.preventDefault()
    setStep('form')
    setAuthMode('login')
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-4 sm:px-0 py-8">
        {/* Top Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-white p-2 border-4 border-amber-500 rounded-2xl shadow-[0_0_15px_rgba(255,204,0,0.5)]">
            <img src={logoMark} alt="Logo" width="64" height="64" loading="lazy" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-widest text-white drop-shadow-md">Niyantran</h1>
          <p className="mt-1 text-sm font-bold uppercase tracking-widest text-amber-500 drop-shadow">{t('landing.subtitle')}</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-black/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden transition-colors border border-white/20">
          <div className="bg-white/10 border-b border-white/10 px-6 py-5 text-center">
            <h2 className="text-xl font-serif font-black uppercase tracking-widest text-white drop-shadow-sm">
              {step === 'form' && authMode === 'login' && t('auth.login_title')}
              {step === 'form' && authMode === 'register' && t('auth.register_title')}
              {step === 'verification' && t('auth.security_verification')}
              {step === 'forgot_password' && t('auth.recover_account')}
              {step === 'reset_password' && t('auth.new_password')}
            </h2>
          </div>

          {step === 'form' && (
            <div>
              <div className="flex border-b border-white/10 bg-black/20">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  className={`w-1/2 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${authMode === 'login' ? 'bg-white/10 text-amber-400 shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  {t('auth.tab_login')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  className={`w-1/2 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${authMode === 'register' ? 'bg-white/10 border-t-2 border-amber-400 text-amber-400' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  {t('auth.tab_register')}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="px-8 pb-8 pt-6">
                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/50 bg-red-950/70 p-3 text-xs font-semibold text-red-200 shadow-sm">
                    {error}
                  </div>
                )}
                {infoMessage && (
                  <div className="mb-4 rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-3 text-xs font-semibold text-emerald-200 shadow-sm">
                    {infoMessage}
                  </div>
                )}

                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label htmlFor="regName" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.full_name')}</label>
                      <input
                        id="regName"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="authEmail" className="mb-1.5 block text-left text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.email')}</label>
                    <input
                      id="authEmail"
                      type="email"
                      placeholder="officer@indianrailways.gov.in"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="authPassword" className="mb-1.5 block text-left text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.password')}</label>
                    <input
                      id="authPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <label htmlFor="authRole" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.role')}</label>
                    <select 
                      id="authRole"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full border border-white/20 bg-black/40 px-3 py-2 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none rounded-2xl appearance-none"
                    >
                      <option className="bg-slate-900">Section Engineer</option>
                      <option className="bg-slate-900">Controller</option>
                      <option className="bg-slate-900">DRM</option>
                    </select>
                  </div>

                  {role !== 'DRM' && (
                    <div className="pt-2">
                      <label htmlFor="authDept" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">Department</label>
                      <select 
                        id="authDept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full border border-white/20 bg-black/40 px-3 py-2 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none rounded-2xl appearance-none"
                      >
                        <option value="ENG" className="bg-slate-900">Engineering (ENG)</option>
                        <option value="SNT" className="bg-slate-900">Signal & Telecom (SNT)</option>
                        <option value="TRD" className="bg-slate-900">Traction (TRD)</option>
                      </select>
                    </div>
                  )}

                  {authMode === 'login' && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" className="h-4 w-4 border-2 border-white/30 text-amber-500 rounded bg-black/20 focus:ring-amber-500/50 focus:ring-offset-0" />
                        <label htmlFor="remember" className="text-xs font-bold uppercase text-white/70">{t('auth.remember')}</label>
                      </div>
                      <button type="button" onClick={() => setStep('forgot_password')} className="text-xs font-bold uppercase text-amber-400 hover:text-amber-300 hover:underline">
                        {t('auth.forgot')}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="focus-ring mt-6 w-full bg-amber-500 py-3 text-sm font-black uppercase tracking-widest text-slate-900 transition hover:bg-amber-400 border-2 border-amber-400 hover:border-white rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : (authMode === 'login' ? t('auth.proceed_verification') : t('auth.register_btn'))}
                  </button>
                </div>
                


              </form>
            </div>
          )}

          {step === 'verification' && (
            <form onSubmit={handleVerifySubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-white/90">
                  {t('auth.otp_sent')} <br/><span className="font-bold text-amber-400">{email || 'your email'}</span>
                </p>
                <p className="text-xs text-white/50 mt-2">{t('auth.enter_4_digit')}</p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/50 bg-red-950/70 p-3 text-xs font-semibold text-red-200 shadow-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="verifyOtp" className="mb-1 block text-center text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.4_digit_otp')}</label>
                  <input
                    id="verifyOtp"
                    type="text"
                    placeholder="• • • •"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border border-white/20 bg-black/40 px-3 py-3 text-center text-3xl font-mono tracking-[1em] text-white focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all placeholder-white/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="focus-ring mt-6 w-full bg-amber-500 py-3 text-sm font-black uppercase tracking-widest text-slate-900 transition hover:bg-amber-400 border-2 border-amber-400 hover:border-white rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : (authMode === 'login' ? t('auth.verify_login') : t('auth.verify_register'))}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => { setStep('form'); setOtp(''); setError(null); }} className="text-xs font-bold uppercase text-white/50 hover:text-white transition-colors">
                    {t('auth.cancel_return')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'forgot_password' && (
            <form onSubmit={handleForgotSubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-white/90">
                  Enter your official email address to receive a password reset link.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">{t('auth.email')}</label>
                  <input
                    id="forgotEmail"
                    type="email"
                    placeholder="officer@indianrailways.gov.in"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="focus-ring mt-6 w-full bg-amber-500 py-3 text-sm font-black uppercase tracking-widest text-slate-900 transition hover:bg-amber-400 border-2 border-amber-400 hover:border-white rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                >
                  Send Reset Link
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setStep('form')} className="text-xs font-bold uppercase text-white/50 hover:text-white transition-colors">
                    {t('auth.cancel_return')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'reset_password' && (
            <form onSubmit={handleResetSubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-white/90">
                  Verification successful. Please enter your new password.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="resetPass1" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">New Password</label>
                  <input
                    id="resetPass1"
                    type="password"
                    required
                    className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="resetPass2" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-white/90">Confirm Password</label>
                  <input
                    id="resetPass2"
                    type="password"
                    required
                    className="w-full border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400/20 rounded-2xl transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="focus-ring mt-6 w-full bg-amber-500 py-3 text-sm font-black uppercase tracking-widest text-slate-900 transition hover:bg-amber-400 border-2 border-amber-400 hover:border-white rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                >
                  Save New Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
