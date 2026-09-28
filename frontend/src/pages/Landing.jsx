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
import railwayBg from '../assets/railway_background.jpg'
import vandeBharat from '../assets/vande_bharat_train.jpg'
import { ShieldAlert, SplitSquareHorizontal, LineChart, ChevronRight, X, Bell, AlertCircle, Info, Lock, ArrowRight, TrendingUp, TrendingDown, Activity, FileText, Search, BarChart3, Download, MapPin, CheckCircle2, Wrench, Zap, Eye, Calendar, ClipboardList } from 'lucide-react'

export default function Landing({ onNavigateLogin }) {
  const { t, lang, toggleLanguage } = useTranslation()
  const [textSize, setTextSize] = useState('16px')
  const [selectedDiv, setSelectedDiv] = useState(null)

  const divisionDetails = {
    NR: {
      id: 'NR',
      name: t('landing.div_northern') || 'Northern Railway',
      image: nrImage,
      description: 'The Northern Railway is one of the oldest and largest zones, covering the majestic mountainous regions, the capital city of New Delhi, and serving millions of passengers daily. It is critical for the nation\u2019s strategic mobility and tourism.',
      stats: { hq: 'Baroda House, New Delhi', routeKm: '6,968 km', states: 'Punjab, Haryana, HP, UP, UK, Delhi, J&K', activeBlocks: 32, maintenance: 7, conflicts: 3 }
    },
    WR: {
      id: 'WR',
      name: t('landing.div_western') || 'Western Railway',
      image: wrImage,
      description: 'Operating out of the bustling financial capital of Mumbai, the Western Railway boasts incredibly busy suburban networks, gorgeous heritage stations, and highly modernized rapid transit infrastructure along the coast.',
      stats: { hq: 'Churchgate, Mumbai', routeKm: '6,182 km', states: 'Maharashtra, Gujarat, MP, Rajasthan', activeBlocks: 28, maintenance: 5, conflicts: 2 }
    },
    ER: {
      id: 'ER',
      name: t('landing.div_eastern') || 'Eastern Railway',
      image: erImage,
      description: 'Rooted in history, Eastern Railway is the lifeline of the eastern corridor. Traversing massive rivers and historic bridges, it fuels the heavily industrialized mining and steel sectors of eastern India.',
      stats: { hq: 'Fairlie Place, Kolkata', routeKm: '2,823 km', states: 'West Bengal, Bihar, Jharkhand', activeBlocks: 24, maintenance: 4, conflicts: 1 }
    },
    SR: {
      id: 'SR',
      name: t('landing.div_southern') || 'Southern Railway',
      image: srImage,
      description: 'Snaking through lush tropical landscapes and palm-fringed coastlines, the Southern Railway provides vital connectivity across the culturally rich and industrially thriving states of southern India.',
      stats: { hq: 'Chennai Central', routeKm: '5,081 km', states: 'Tamil Nadu, Kerala, AP, Karnataka', activeBlocks: 26, maintenance: 6, conflicts: 2 }
    }
  }

  useEffect(() => {
    document.documentElement.style.fontSize = textSize
  }, [textSize])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const navHeight = 60
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth'
      })
    }
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-[#f5f5f0] flex flex-col font-sans min-h-screen">

      {/* ═══════════ TOP UTILITY BAR ═══════════ */}
      <div className="bg-[#1a2332] text-slate-300 px-4 md:px-8 py-1.5 flex flex-wrap items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">भारत सरकार</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Government of India</span>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <a href="#main-content" className="hover:text-amber-400 transition">{t('landing.skip')}</a>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setTextSize('14px')} className="px-1 hover:text-white text-xs" aria-label="Decrease Text Size">A</button>
            <button onClick={() => setTextSize('16px')} className="px-1 hover:text-white text-sm" aria-label="Normal Text Size">A</button>
            <button onClick={() => setTextSize('18px')} className="px-1 hover:text-white text-base" aria-label="Increase Text Size">A+</button>
          </div>
          <span className="text-slate-600">|</span>
          <button onClick={toggleLanguage} aria-label="Toggle Language" className="font-semibold text-amber-400 hover:text-amber-300 transition">
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN BRANDING HEADER ═══════════ */}
      <div className="bg-white px-4 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 border-b border-slate-200 relative z-20">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <img
            src={emblemImg}
            alt="Emblem of India"
            width="64"
            height="64"
            loading="lazy"
            className="h-14 sm:h-16 w-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a2332] tracking-tight leading-tight">{t('landing.title')}</h1>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('landing.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex flex-col items-center border-l border-slate-200 pl-4">
            <span className="text-[#1a2332] font-bold text-base">Niyantran</span>
            <span className="text-[9px] text-slate-500 leading-tight text-center">Integrated Railway Block<br />Management System</span>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <img src={g20Img} alt="G20 India" width="80" height="40" loading="lazy" className="h-8 sm:h-10 w-auto" />
            <img src={swachhImg} alt="Swachh Bharat" width="80" height="40" loading="lazy" className="h-8 sm:h-10 w-auto" />
          </div>
        </div>
      </div>

      {/* ═══════════ NAVIGATION BAR ═══════════ */}
      <nav aria-label="Main Navigation" className="bg-[#1a2332] px-4 md:px-8 text-white sticky top-0 z-50 shadow-lg border-b border-[#2a3a4e]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="overflow-x-auto no-scrollbar">
            <ul className="flex items-center gap-0 text-sm font-semibold min-w-max">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="py-3 px-4 block bg-amber-500 text-[#1a2332] font-bold text-xs uppercase tracking-wide">{t('landing.home')}</a>
              </li>
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                  className="py-3 px-4 block text-slate-300 hover:text-white hover:bg-white/10 transition text-xs uppercase tracking-wide">{t('landing.about')}</a>
              </li>
              <li>
                <a href="#divisions" onClick={(e) => { e.preventDefault(); scrollToSection('divisions'); }}
                  className="py-3 px-4 block text-slate-300 hover:text-white hover:bg-white/10 transition text-xs uppercase tracking-wide">{t('landing.divisions')}</a>
              </li>
              <li>
                <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}
                  className="py-3 px-4 block text-slate-300 hover:text-white hover:bg-white/10 transition text-xs uppercase tracking-wide">{t('landing.services')}</a>
              </li>
              <li>
                <a href="#notifications" onClick={(e) => { e.preventDefault(); scrollToSection('notifications'); }}
                  className="py-3 px-4 block text-slate-300 hover:text-white hover:bg-white/10 transition text-xs uppercase tracking-wide">{t('landing.notifications')}</a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('footer'); }}
                  className="py-3 px-4 block text-slate-300 hover:text-white hover:bg-white/10 transition text-xs uppercase tracking-wide">Contact</a>
              </li>
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Lock size={14} className="text-slate-400" />
            <button
              onClick={onNavigateLogin}
              className="bg-amber-500 hover:bg-amber-400 text-[#1a2332] font-bold py-2 px-5 text-xs uppercase tracking-wide flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {t('landing.login')} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <div id="main-content" className="relative min-h-[420px] md:min-h-[480px] bg-[#1a2332] overflow-hidden focus:outline-none" tabIndex="-1">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/95 via-[#1a2332]/70 to-[#1a2332]/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Left content */}
          <div className="flex-1 max-w-xl">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">INTEGRATED RAILWAY BLOCK MANAGEMENT SYSTEM</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-3 font-serif">
              Niyantran
            </h2>
            <p className="text-xl md:text-2xl text-amber-100 font-medium leading-snug mb-3 italic">
              Smarter Planning for Safer and More Efficient Railways
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
              AI-driven maintenance scheduling, conflict resolution and network capacity management across Indian Railways.
            </p>
            <button
              onClick={onNavigateLogin}
              className="bg-amber-500 hover:bg-amber-400 text-[#1a2332] font-bold py-2.5 px-6 text-sm flex items-center gap-2 transition-colors shadow-lg"
            >
              <Lock size={14} /> {t('landing.login')} <ArrowRight size={16} />
            </button>
          </div>

          {/* Right features list */}
          <div className="hidden md:flex flex-col gap-4 bg-[#1a2332]/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 min-w-[280px]">
            {[
              { icon: <Calendar size={18} />, title: 'Optimized Maintenance Scheduling' },
              { icon: <Zap size={18} />, title: 'Conflict-free Operations' },
              { icon: <TrendingUp size={18} />, title: 'Higher Network Capacity' },
              { icon: <BarChart3 size={18} />, title: 'Data-driven Decision Making' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-amber-400 shrink-0">{f.icon}</div>
                <span className="text-white text-sm font-medium">{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagonal caption bar */}
        <div className="absolute bottom-0 right-0 bg-amber-500/90 backdrop-blur-sm px-6 py-2 text-[#1a2332] text-xs font-bold italic">
          Indian Railways — Connecting the Nation
        </div>
      </div>

      {/* ═══════════ STATS ROW ═══════════ */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { value: '128', label: 'Active Blocks', sub: 'Across all divisions', trend: '+3%', up: true, icon: <Activity size={20} /> },
            { value: '17', label: 'Maintenance Blocks', sub: 'Scheduled this week', trend: '+12%', up: true, icon: <Wrench size={20} /> },
            { value: '06', label: 'Conflict Alerts', sub: 'Requiring resolution', trend: '-45%', up: false, icon: <AlertCircle size={20} /> },
            { value: '42', label: 'Requests Today', sub: 'From divisions', trend: '+8%', up: true, icon: <ClipboardList size={20} /> },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 md:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="bg-[#1a2332] text-amber-400 p-2.5 rounded-lg shrink-0">{s.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-[#1a2332]">{s.value}</span>
                  <span className={`text-[10px] font-bold ${s.up ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-0.5`}>
                    {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {s.trend}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1a2332] uppercase tracking-wide">{s.label}</div>
                <div className="text-[10px] text-slate-500">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ ABOUT SECTION ═══════════ */}
      <section id="about" className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <h3 className="text-2xl font-black text-[#1a2332] mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
            {t('landing.about_title')}
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <p className="text-slate-700 leading-relaxed mb-5">
                {t('landing.about_text')}
              </p>
              <p className="text-slate-600 leading-relaxed text-sm mb-6">
                It helps railway officers plan and prioritize maintenance blocks, predict network capacity, and automatically resolve multi-department conflicts to ensure safe and efficient operations across the national railway network.
              </p>
              <button onClick={() => scrollToSection('services')} className="text-sm font-bold text-[#1a2332] border-2 border-[#1a2332] px-5 py-2 hover:bg-[#1a2332] hover:text-white transition-colors flex items-center gap-2">
                Know More <ArrowRight size={14} />
              </button>
            </div>
            <div className="w-full md:w-[400px] shrink-0 rounded-lg overflow-hidden shadow-lg border border-slate-200 relative">
              <img src={vandeBharat} alt="Indian Railways" className="w-full h-56 md:h-64 object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a2332] to-transparent px-4 py-3">
                <p className="text-white text-xs font-semibold italic">Indian Railways — Connecting the Nation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MAJOR DIVISIONS ═══════════ */}
      <section id="divisions" className="bg-[#f5f5f0] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-[#1a2332] flex items-center gap-3">
              <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
              {t('landing.div_title')}
            </h3>
            <button onClick={() => scrollToSection('divisions')} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition">
              View All Divisions <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {['NR', 'WR', 'ER', 'SR'].map(divId => {
              const div = divisionDetails[divId]
              return (
                <div
                  key={divId}
                  onClick={() => setSelectedDiv(div)}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={div.image} alt={div.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/80 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-amber-500 text-[#1a2332] font-black text-xs px-2.5 py-1 rounded-full">{divId}</div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-bold text-white text-sm">{div.name}</h4>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <ChevronRight size={16} className="text-white/70 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 text-center divide-x divide-slate-100 border-t border-slate-100">
                    <div className="py-2.5 px-1">
                      <div className="text-base font-black text-[#1a2332]">{div.stats.activeBlocks}</div>
                      <div className="text-[9px] text-slate-500 font-medium uppercase">Active Blocks</div>
                    </div>
                    <div className="py-2.5 px-1">
                      <div className="text-base font-black text-amber-600">{div.stats.maintenance}</div>
                      <div className="text-[9px] text-slate-500 font-medium uppercase">Maintenance</div>
                    </div>
                    <div className="py-2.5 px-1">
                      <div className="text-base font-black text-red-500">{div.stats.conflicts}</div>
                      <div className="text-[9px] text-slate-500 font-medium uppercase">Conflicts</div>
                    </div>
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
          <div className="relative w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-2xl">
            <button onClick={() => setSelectedDiv(null)} className="absolute top-4 right-4 z-10 bg-black/40 text-white hover:bg-black/60 p-2 rounded-full backdrop-blur-md transition-colors">
              <X size={24} />
            </button>
            <div className="h-56 sm:h-72 relative">
              <img src={selectedDiv.image} alt={selectedDiv.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332] via-[#1a2332]/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                <div className="inline-block bg-amber-500 text-[#1a2332] font-black px-3 py-0.5 rounded text-xs mb-2">{selectedDiv.id}</div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">{selectedDiv.name}</h3>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-slate-700 font-medium leading-relaxed mb-6">{selectedDiv.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Headquarters</div>
                  <div className="font-bold text-[#1a2332]">{selectedDiv.stats.hq}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Route Length</div>
                  <div className="font-bold text-[#1a2332]">{selectedDiv.stats.routeKm}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">States Covered</div>
                  <div className="font-bold text-[#1a2332]">{selectedDiv.stats.states}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CORE SERVICES ═══════════ */}
      <section id="services" className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <h3 className="text-2xl font-black text-[#1a2332] mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
            {t('landing.serv_title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldAlert size={28} className="text-amber-500" />, title: t('landing.serv_ai'), desc: t('landing.serv_ai_desc'), extended: 'Smart prioritization of track maintenance tasks based on urgency, network impact and resource availability.' },
              { icon: <SplitSquareHorizontal size={28} className="text-amber-500" />, title: t('landing.serv_conflict'), desc: t('landing.serv_conflict_desc'), extended: 'Automated deconfliction of multi-department block requests to prevent scheduling clashes.' },
              { icon: <LineChart size={28} className="text-amber-500" />, title: t('landing.serv_sim'), desc: t('landing.serv_sim_desc'), extended: 'Forecast network capacity and analyse the impact of future block requests using AI-driven simulations.' },
            ].map((s, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-6 hover:border-amber-300 hover:shadow-md transition-all group bg-slate-50/50">
                <div className="mb-4">{s.icon}</div>
                <h4 className="text-base font-bold text-[#1a2332] mb-2">{s.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{s.extended}</p>
                <button className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn More <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NETWORK OVERVIEW ═══════════ */}
      <section className="bg-[#f5f5f0] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <h3 className="text-2xl font-black text-[#1a2332] mb-8 flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
            Network Overview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map placeholder */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative h-64 md:h-80">
                <img src={railwayBg} alt="Railway Network Map" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#1a2332]/40"></div>
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <select className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-xs font-semibold text-[#1a2332] px-3 py-1.5">
                    <option>All Divisions</option>
                    <option>Northern Railway</option>
                    <option>Western Railway</option>
                    <option>Eastern Railway</option>
                    <option>Southern Railway</option>
                  </select>
                </div>
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  {[
                    { color: 'bg-emerald-500', label: 'Operational' },
                    { color: 'bg-amber-500', label: 'Maintenance Block' },
                    { color: 'bg-red-500', label: 'Conflict' },
                    { color: 'bg-slate-400', label: 'Low Capacity' },
                  ].map((l, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded px-2 py-0.5">
                      <div className={`w-2 h-2 rounded-full ${l.color}`}></div>
                      <span className="text-[9px] font-semibold text-slate-700">{l.label}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 right-3 text-[8px] text-white/70 italic">
                  Source: Indian Railway GIS (Illustrative)
                </div>
              </div>
            </div>

            {/* Network status + quick actions */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#1a2332] text-sm">Network Status</h4>
                  <span className="text-[10px] text-slate-400 font-medium">As on {dateStr}, {timeStr}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: '128', label: 'Operational Blocks', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
                    { value: '17', label: 'Maintenance Blocks', icon: <Wrench size={16} className="text-amber-500" /> },
                    { value: '06', label: 'Conflicts', icon: <AlertCircle size={16} className="text-red-500" /> },
                    { value: '82%', label: 'Network Capacity', icon: <BarChart3 size={16} className="text-indigo-500" /> },
                  ].map((ns, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex justify-center mb-1.5">{ns.icon}</div>
                      <div className="text-lg font-black text-[#1a2332]">{ns.value}</div>
                      <div className="text-[8px] text-slate-500 font-semibold uppercase leading-tight">{ns.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-[#1a2332] text-sm mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Eye size={18} />, label: 'View Block Requests' },
                    { icon: <Search size={18} />, label: 'Run Simulation' },
                    { icon: <BarChart3 size={18} />, label: 'Generate Report' },
                    { icon: <FileText size={18} />, label: 'View Circulars' },
                  ].map((qa, i) => (
                    <button
                      key={i}
                      onClick={onNavigateLogin}
                      className="flex flex-col items-center gap-1.5 p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all text-center group"
                    >
                      <div className="text-[#1a2332] group-hover:text-amber-600 transition-colors">{qa.icon}</div>
                      <span className="text-[9px] font-bold text-slate-600 uppercase leading-tight">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CIRCULARS & NOTICES ═══════════ */}
      <section id="notifications" className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-[#1a2332] flex items-center gap-3">
              <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
              Recent Circulars & Notices
            </h3>
            <button className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition">
              View All Circulars <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { id: 'Circular No. 2026/ENG/112', desc: t('landing.notif_1'), tag: 'NEW', tagColor: 'bg-red-500 text-white', date: '26 Sep 2026' },
              { id: 'Circular No. 2026/OPS/089', desc: t('landing.notif_2'), tag: 'INFO', tagColor: 'bg-sky-500 text-white', date: '24 Sep 2026' },
              { id: 'Circular No. 2026/SAF/075', desc: t('landing.notif_3'), tag: 'IMPORTANT', tagColor: 'bg-amber-500 text-[#1a2332]', date: '20 Sep 2026' },
            ].map((c, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all bg-slate-50/30">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-amber-100 text-amber-600 p-2 rounded-lg shrink-0 mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-[#1a2332]">{c.id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${c.tagColor}`}>{c.tag}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{c.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-slate-500 font-medium">{c.date}</span>
                  <button className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition">
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="footer" className="bg-[#1a2332] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="bg-white p-1.5 rounded-full">
                <img src={emblemImg} alt="Emblem" className="h-10 w-auto" />
              </div>
              <div>
                <h4 className="font-bold text-base">{t('landing.title')}</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('landing.subtitle')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); }} className="hover:text-amber-400 transition">{t('landing.home')}</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} className="hover:text-amber-400 transition">{t('landing.about')}</a>
              <a href="#divisions" onClick={(e) => { e.preventDefault(); scrollToSection('divisions'); }} className="hover:text-amber-400 transition">{t('landing.divisions')}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }} className="hover:text-amber-400 transition">{t('landing.services')}</a>
              <a href="#notifications" onClick={(e) => { e.preventDefault(); scrollToSection('notifications'); }} className="hover:text-amber-400 transition">Circulars & Notices</a>
              <a href="#" className="hover:text-amber-400 transition">Contact</a>
            </div>

            <div className="text-right">
              <span className="font-bold text-amber-400 text-base">Niyantran</span>
              <p className="text-[9px] text-slate-500 leading-tight">Integrated Railway Block Management System<br />Authorised Officer Access Only</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
            <span>{t('landing.footer_text')}</span>
            <div className="flex items-center gap-3 text-slate-500">
              <a href="#" className="hover:text-slate-300 transition">Terms of Use</a>
              <span>|</span>
              <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-slate-300 transition">Help</a>
            </div>
          </div>
        </div>

        {/* Bottom tricolor strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"></div>
      </footer>
    </div>
  )
}
