import { useState, useEffect } from 'react'
import { useTranslation } from '../store/TranslationContext.jsx'
import heroImage from '../assets/portal_hero.jpg'
import emblemImg from '../assets/emblem.jpg'
import swachhImg from '../assets/swachh.jpg'
import g20Img from '../assets/g20.jpg'
import { ShieldAlert, SplitSquareHorizontal, LineChart, ChevronRight } from 'lucide-react'

export default function Landing({ onNavigateLogin }) {
  const { t, lang, toggleLanguage } = useTranslation()
  const [textSize, setTextSize] = useState('16px')

  useEffect(() => {
    document.documentElement.style.fontSize = textSize
  }, [textSize])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const navHeight = 60 // Approximate height of the nav bar
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="bg-slate-50 flex flex-col font-sans">
      {/* Top utility bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 md:px-8 py-1.5 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-4">
          <span>भारत सरकार | GOVERNMENT OF INDIA</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a href="#main-content" className="hover:text-slate-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">{t('landing.skip')}</a>
          <div className="flex items-center gap-1 border-l border-r border-slate-300 px-3">
            <button onClick={() => setTextSize('14px')} className="px-1 hover:text-slate-900" aria-label="Decrease Text Size" title="Decrease Text Size">A-</button>
            <button onClick={() => setTextSize('16px')} className="px-1 hover:text-slate-900" aria-label="Normal Text Size" title="Normal Text Size">A</button>
            <button onClick={() => setTextSize('18px')} className="px-1 hover:text-slate-900" aria-label="Increase Text Size" title="Increase Text Size">A+</button>
          </div>
          <button onClick={toggleLanguage} aria-label="Toggle Language" className="font-bold text-slate-900 hover:underline">
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>

      {/* Main Branding Header */}
      <div className="bg-white px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-6 shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <img 
            src={emblemImg}
            alt="Emblem of India" 
            width="64"
            height="64"
            loading="lazy"
            className="h-16 w-auto mix-blend-multiply"
          />
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">{t('landing.title')}</h1>
            <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest">{t('landing.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto bg-white rounded p-1">
          <img src={swachhImg} alt="Swachh Bharat" width="100" height="48" loading="lazy" className="h-12 w-auto mix-blend-multiply" />
          <img src={g20Img} alt="G20 India" width="100" height="48" loading="lazy" className="h-12 w-auto mix-blend-multiply" />
        </div>
      </div>

      {/* Sticky Navigation Bar */}
      <nav aria-label="Main Navigation" className="bg-slate-900 px-4 md:px-8 text-white sticky top-0 z-50 shadow-md">
        <ul className="flex flex-wrap items-center gap-6 text-sm font-semibold">
          <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="py-4 block hover:text-amber-400 transition">{t('landing.home')}</a></li>
          <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} className="py-4 block hover:text-amber-400 transition">{t('landing.about')}</a></li>
          <li><a href="#divisions" onClick={(e) => { e.preventDefault(); scrollToSection('divisions'); }} className="py-4 block hover:text-amber-400 transition">{t('landing.divisions')}</a></li>
          <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }} className="py-4 block hover:text-amber-400 transition">{t('landing.services')}</a></li>
          <li><a href="#notifications" onClick={(e) => { e.preventDefault(); scrollToSection('notifications'); }} className="py-4 block hover:text-amber-400 transition">{t('landing.notifications')}</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <div id="main-content" className="relative h-[80vh] min-h-[600px] bg-slate-900 overflow-hidden focus:outline-none" tabIndex="-1">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/50 to-transparent" />
        
        <div className="relative z-10 p-8 md:p-16 max-w-3xl h-full flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
            Next-Generation <span className="text-amber-400">Block Management</span>
          </h2>
          <p className="mt-4 text-lg text-slate-100 drop-shadow font-medium max-w-xl">
            Optimizing maintenance schedules across Indian Railways with AI-driven priority queuing and automatic conflict resolution.
          </p>
          <div className="mt-8">
            <button 
              onClick={onNavigateLogin}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-8 rounded shadow-lg text-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {t('landing.login')} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 px-8 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-6 border-b-4 border-amber-400 inline-block pb-2">{t('landing.about_title')}</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            {t('landing.about_text')}
          </p>
        </div>
      </section>

      {/* Divisions Section */}
      <section id="divisions" className="py-20 px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-10 border-b-4 border-amber-400 inline-block pb-2">{t('landing.div_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 border-2 border-slate-200 shadow-sm hover:border-navy hover:shadow-md transition-all text-center">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">NR</div>
              <h4 className="font-bold text-slate-800">{t('landing.div_northern')}</h4>
            </div>
            <div className="bg-white p-6 border-2 border-slate-200 shadow-sm hover:border-navy hover:shadow-md transition-all text-center">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">WR</div>
              <h4 className="font-bold text-slate-800">{t('landing.div_western')}</h4>
            </div>
            <div className="bg-white p-6 border-2 border-slate-200 shadow-sm hover:border-navy hover:shadow-md transition-all text-center">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">ER</div>
              <h4 className="font-bold text-slate-800">{t('landing.div_eastern')}</h4>
            </div>
            <div className="bg-white p-6 border-2 border-slate-200 shadow-sm hover:border-navy hover:shadow-md transition-all text-center">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">SR</div>
              <h4 className="font-bold text-slate-800">{t('landing.div_southern')}</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-10 border-b-4 border-amber-400 inline-block pb-2">{t('landing.serv_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 border border-slate-200 flex flex-col items-start">
              <ShieldAlert size={48} className="text-slate-900 mb-4" />
              <h4 className="text-xl font-bold text-slate-800 mb-2 uppercase">{t('landing.serv_ai')}</h4>
              <p className="text-slate-600 font-medium">{t('landing.serv_ai_desc')}</p>
            </div>
            <div className="p-8 bg-slate-50 border border-slate-200 flex flex-col items-start">
              <SplitSquareHorizontal size={48} className="text-slate-900 mb-4" />
              <h4 className="text-xl font-bold text-slate-800 mb-2 uppercase">{t('landing.serv_conflict')}</h4>
              <p className="text-slate-600 font-medium">{t('landing.serv_conflict_desc')}</p>
            </div>
            <div className="p-8 bg-slate-50 border border-slate-200 flex flex-col items-start">
              <LineChart size={48} className="text-slate-900 mb-4" />
              <h4 className="text-xl font-bold text-slate-800 mb-2 uppercase">{t('landing.serv_sim')}</h4>
              <p className="text-slate-600 font-medium">{t('landing.serv_sim_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section id="notifications" className="py-20 px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-10 border-b-4 border-amber-400 inline-block pb-2">{t('landing.notif_title')}</h3>
          <ul className="space-y-4">
            <li className="bg-white p-6 border-l-4 border-indigo-600 shadow-sm flex items-center justify-between">
              <span className="font-bold text-slate-800">{t('landing.notif_1')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">New</span>
            </li>
            <li className="bg-white p-6 border-l-4 border-amber-400 shadow-sm flex items-center justify-between">
              <span className="font-bold text-slate-800">{t('landing.notif_2')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Warning</span>
            </li>
            <li className="bg-white p-6 border-l-4 border-slate-300 shadow-sm flex items-center justify-between">
              <span className="font-bold text-slate-600">{t('landing.notif_3')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Info</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white text-center py-6 text-sm font-semibold border-t-4 border-amber-500">
        {t('landing.footer_text')}
      </footer>
    </div>
  )
}
