import { useState } from 'react'
import logoMark from '../assets/logo-mark.png'
import bgImage from '../assets/railway_background.jpg'
import { useTranslation } from '../store/TranslationContext.jsx'

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
  
  const division = 'Delhi (DLI)'
  const corridor = 'NDLS-GZB'

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setStep('verification')
  }

  const handleVerifySubmit = (e) => {
    e.preventDefault()
    onLoginSuccess({ role, department: role === 'DRM' ? 'ALL' : department, division, corridor, name })
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

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Top Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-white p-2 border-4 border-amber-500 rounded-2xl shadow-[0_0_15px_rgba(255,204,0,0.5)]">
            <img src={logoMark} alt="Logo" width="64" height="64" loading="lazy" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-widest text-white drop-shadow-md">Niyantran</h1>
          <p className="mt-1 text-sm font-bold uppercase tracking-widest text-amber-500 drop-shadow">{t('landing.subtitle')}</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.2)] rounded-3xl overflow-hidden transition-colors border border-slate-100 dark:border-slate-800">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 text-center">
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
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`w-1/2 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${authMode === 'login' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white'}`}
                >
                  {t('auth.tab_login')}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`w-1/2 py-3 text-sm font-bold uppercase tracking-wider ${authMode === 'register' ? 'bg-white dark:bg-slate-900 border-t-2 border-indigo-600 text-indigo-600 dark:text-amber-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  {t('auth.tab_register')}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="px-8 pb-8 pt-6">
                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label htmlFor="regName" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('auth.full_name')}</label>
                      <input
                        id="regName"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 rounded-2xl transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="authEmail" className="mb-1.5 block text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('auth.email')}</label>
                    <input
                      id="authEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 rounded-2xl transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="authPassword" className="mb-1.5 block text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('auth.password')}</label>
                    <input
                      id="authPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 rounded-2xl transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <label htmlFor="authRole" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('auth.role')}</label>
                    <select 
                      id="authRole"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                    >
                      <option>Section Engineer</option>
                      <option>Controller</option>
                      <option>DRM</option>
                    </select>
                  </div>

                  {role !== 'DRM' && (
                    <div className="pt-2">
                      <label htmlFor="authDept" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Department</label>
                      <select 
                        id="authDept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                      >
                        <option value="ENG">Engineering (ENG)</option>
                        <option value="SNT">Signal & Telecom (SNT)</option>
                        <option value="TRD">Traction (TRD)</option>
                      </select>
                    </div>
                  )}

                  {authMode === 'login' && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" className="h-4 w-4 border-2 border-slate-300 text-indigo-600 rounded-2xl bg-white dark:bg-slate-800" />
                        <label htmlFor="remember" className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{t('auth.remember')}</label>
                      </div>
                      <button type="button" onClick={() => setStep('forgot_password')} className="text-xs font-bold uppercase text-indigo-600 dark:text-amber-500 hover:underline">
                        {t('auth.forgot')}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="focus-ring mt-6 w-full bg-indigo-600 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-indigo-500 border-2 border-indigo-600 hover:border-amber-500 rounded-2xl"
                  >
                    {authMode === 'login' ? t('auth.proceed_verification') : t('auth.register_btn')}
                  </button>
                </div>
                
                {authMode === 'login' && (
                  <div className="mt-6 text-center border-t-2 border-slate-200 dark:border-slate-700 pt-4">
                    <button type="button" className="inline-block border-2 border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                      {t('auth.hrms_login')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {step === 'verification' && (
            <form onSubmit={handleVerifySubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {t('auth.otp_sent')} <br/><span className="font-bold text-indigo-600 dark:text-amber-500">{email || 'your email'}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('auth.enter_4_digit')}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="verifyOtp" className="mb-1 block text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('auth.4_digit_otp')}</label>
                  <input
                    id="verifyOtp"
                    type="text"
                    placeholder="• • • •"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-3 text-center text-3xl font-mono tracking-[1em] text-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                  />
                </div>
                <button
                  type="submit"
                  className="focus-ring mt-6 w-full bg-indigo-600 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-indigo-500 border-2 border-indigo-600 hover:border-amber-500 rounded-2xl"
                >
                  {authMode === 'login' ? t('auth.verify_login') : t('auth.verify_register')}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => { setStep('form'); setOtp(''); }} className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                    {t('auth.cancel_return')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'forgot_password' && (
            <form onSubmit={handleForgotSubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Enter your official email address to receive a password reset link.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('auth.email')}</label>
                  <input
                    id="forgotEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                  />
                </div>
                <button
                  type="submit"
                  className="focus-ring mt-6 w-full bg-indigo-600 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-indigo-500 border-2 border-indigo-600 hover:border-amber-500 rounded-2xl"
                >
                  Send Reset Link
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setStep('form')} className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                    {t('auth.cancel_return')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'reset_password' && (
            <form onSubmit={handleResetSubmit} className="px-8 pb-8 pt-6">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Verification successful. Please enter your new password.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="resetPass1" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    id="resetPass1"
                    type="password"
                    required
                    className="w-full border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                  />
                </div>
                <div>
                  <label htmlFor="resetPass2" className="mb-1 block text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <input
                    id="resetPass2"
                    type="password"
                    required
                    className="w-full border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-amber-500 focus:outline-none rounded-2xl"
                  />
                </div>
                <button
                  type="submit"
                  className="focus-ring mt-6 w-full bg-indigo-600 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-indigo-500 border-2 border-indigo-600 hover:border-amber-500 rounded-2xl"
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
