import { useState, useEffect } from 'react'
import { useTranslation } from '../store/TranslationContext.jsx'
import heroImage from '../assets/portal_hero.jpg'
import emblemImg from '../assets/emblem.jpg'
import swachhImg from '../assets/swachh.jpg'
import g20Img from '../assets/g20.jpg'
import nrImage from '../assets/nr_train.jpg'
import wrImage from '../assets/wr_train.jpg'
import erImage from '../assets/er_train.jpg'
import srImage from '../assets/sr_train.jpg'
import { ShieldAlert, SplitSquareHorizontal, LineChart, ChevronRight, X } from 'lucide-react'

export default function Landing({ onNavigateLogin }) {
  const { t, lang, toggleLanguage } = useTranslation()
  const [textSize, setTextSize] = useState('16px')
  const [selectedDiv, setSelectedDiv] = useState(null)

  const divisionDetails = {
    NR: {
      id: 'NR',
      name: t('landing.div_northern') || 'Northern Railway',
      image: nrImage,
      description: 'The Northern Railway is one of the oldest and largest zones, covering the majestic mountainous regions, the capital city of New Delhi, and serving millions of passengers daily. It is critical for the nation’s strategic mobility and tourism.',
      stats: { hq: 'Baroda House, New Delhi', routeKm: '6,968 km', states: 'Punjab, Haryana, HP, UP, UK, Delhi, J&K' }
    },
    WR: {
      id: 'WR',
      name: t('landing.div_western') || 'Western Railway',
      image: wrImage,
      description: 'Operating out of the bustling financial capital of Mumbai, the Western Railway boasts incredibly busy suburban networks, gorgeous heritage stations, and highly modernized rapid transit infrastructure along the coast.',
      stats: { hq: 'Churchgate, Mumbai', routeKm: '6,182 km', states: 'Maharashtra, Gujarat, MP, Rajasthan' }
    },
    ER: {
      id: 'ER',
      name: t('landing.div_eastern') || 'Eastern Railway',
      image: erImage,
      description: 'Rooted in history, Eastern Railway is the lifeline of the eastern corridor. Traversing massive rivers and historic bridges, it fuels the heavily industrialized mining and steel sectors of eastern India.',
      stats: { hq: 'Fairlie Place, Kolkata', routeKm: '2,823 km', states: 'West Bengal, Bihar, Jharkhand' }
    },
    SR: {
      id: 'SR',
      name: t('landing.div_southern') || 'Southern Railway',
      image: srImage,
      description: 'Snaking through lush tropical landscapes and palm-fringed coastlines, the Southern Railway provides vital connectivity across the culturally rich and industrially thriving states of southern India.',
      stats: { hq: 'Chennai Central', routeKm: '5,081 km', states: 'Tamil Nadu, Kerala, AP, Karnataka' }
    }
  }

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
            
            {['NR', 'WR', 'ER', 'SR'].map(divId => {
              const div = divisionDetails[divId]
              return (
                <div 
                  key={divId}
                  onClick={() => setSelectedDiv(div)}
                  className="group relative h-64 bg-slate-900 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <img src={div.image} alt={div.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="h-12 w-12 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center mb-3 text-lg font-black shadow-lg transform group-hover:scale-110 transition-transform">{divId}</div>
                    <h4 className="font-bold text-white text-lg leading-tight">{div.name}</h4>
                  </div>
                </div>
              )
            })}
            
          </div>
        </div>
      </section>

      {/* Division Modal Popup */}
      {selectedDiv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedDiv(null)}></div>
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedDiv(null)} className="absolute top-4 right-4 z-10 bg-black/40 text-white hover:bg-black/60 p-2 rounded-full backdrop-blur-md transition-colors">
              <X size={24} />
            </button>
            <div className="h-64 sm:h-80 relative">
              <img src={selectedDiv.image} alt={selectedDiv.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                <div className="inline-block bg-amber-500 text-slate-900 font-black px-4 py-1 rounded-full text-sm mb-3 shadow-md">{selectedDiv.id}</div>
                <h3 className="text-3xl sm:text-4xl font-black text-white">{selectedDiv.name}</h3>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-lg text-slate-700 font-medium leading-relaxed mb-6">{selectedDiv.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Headquarters</div>
                  <div className="font-bold text-slate-900">{selectedDiv.stats.hq}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Route Length</div>
                  <div className="font-bold text-slate-900">{selectedDiv.stats.routeKm}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">States Covered</div>
                  <div className="font-bold text-slate-900">{selectedDiv.stats.states}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
