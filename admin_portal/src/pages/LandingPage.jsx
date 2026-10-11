import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Droplets,
  Lightbulb,
  MapPin,
  Menu,
  Recycle,
  Search,
  ShieldCheck,
  TrafficCone,
  Waves,
  X,
} from 'lucide-react'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../context/LanguageContext'
import roads from '../assets/roads.jpg'
import water from '../assets/water.jpg'
import drainage from '../assets/drainage.jpg'
import waste from '../assets/waste.jpg'
import streetlight from '../assets/streetlight.jpg'

const visuals = [roads, water, drainage, waste, streetlight]

const copy = {
  en: {
    how: 'How it works', report: 'What to report', impact: 'Why MtaaFix', signIn: 'Staff sign in',
    eyebrow: 'Community infrastructure reporting and action',
    titleA: 'From local problems', titleB: 'to visible action.',
    body: 'MtaaFix helps citizens report physical infrastructure issues, attach evidence, choose the exact location and follow the issue as it moves to the responsible department.',
    cta: 'Staff sign in', secondary: 'See how it works',
    whoTitle: 'What MtaaFix is',
    whoBody: 'A location-aware incident coordination platform focused on roads, water, drainage, waste and street lighting. It turns citizen observations into structured incidents that can be routed, worked on and verified.',
    whyTitle: 'What makes it different',
    reasons: [
      ['Location that works your way', 'Use current GPS, search a place, or choose a point directly on the map.'],
      ['Smart duplicate awareness', 'Nearby reports can be linked to the same physical incident instead of creating noise.'],
      ['Visible responsibility', 'Citizens can see the responsible provider and follow progress to resolution.'],
    ],
    slides: [
      ['Roads', 'Potholes and damaged roads'], ['Water', 'Leaks and burst pipes'], ['Drainage', 'Blocked drains and flooding'], ['Waste', 'Waste hotspots'], ['Street lighting', 'Unsafe or non-working lights'],
    ],
  },
  sw: {
    how: 'Jinsi inavyofanya kazi', report: 'Unachoweza kuripoti', impact: 'Kwa nini MtaaFix', signIn: 'Ingia kwa watumishi',
    eyebrow: 'Kuripoti miundombinu ya jamii na kufuatilia hatua',
    titleA: 'Kutoka tatizo la mtaani', titleB: 'hadi hatua inayoonekana.',
    body: 'MtaaFix inasaidia wananchi kuripoti changamoto za miundombinu, kuweka ushahidi, kuchagua eneo sahihi na kufuatilia tatizo hadi kwa mtoa huduma anayehusika.',
    cta: 'Ingia kwa watumishi', secondary: 'Angalia jinsi inavyofanya kazi',
    whoTitle: 'MtaaFix ni nini',
    whoBody: 'Ni mfumo wa kuratibu matukio ya miundombinu kwa kutumia eneo, unaolenga barabara, maji, mifereji, taka na taa za barabarani. Taarifa za wananchi hubadilishwa kuwa matukio yanayoweza kupelekwa, kufanyiwa kazi na kuthibitishwa.',
    whyTitle: 'Kinachoitofautisha',
    reasons: [
      ['Eneo kwa njia unayotaka', 'Tumia GPS ya sasa, tafuta sehemu, au chagua sehemu moja kwa moja kwenye ramani.'],
      ['Utambuzi wa taarifa zinazofanana', 'Taarifa za karibu zinaweza kuunganishwa kwenye tukio moja badala ya kurudia tatizo lilelile.'],
      ['Uwajibikaji unaoonekana', 'Mwananchi anaona mtoa huduma anayehusika na kufuatilia hatua hadi utatuzi.'],
    ],
    slides: [
      ['Barabara', 'Mashimo na uharibifu wa barabara'], ['Maji', 'Uvujaji na mabomba yaliyopasuka'], ['Mifereji', 'Mifereji iliyoziba na mafuriko'], ['Taka', 'Maeneo yenye taka'], ['Taa za barabarani', 'Taa hatarishi au zisizofanya kazi'],
    ],
  },
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/mtaafix-mark.svg" alt="MtaaFix" className="h-11 w-11 rounded-[14px]" />
      <div className="text-left">
        <p className="m-0 text-[19px] font-semibold tracking-[-.025em] text-[#20342d]">MtaaFix</p>
        <p className="m-0 mt-0.5 text-[11px] font-normal text-[#76837c]">Mtaa yetu, jukumu letu.</p>
      </div>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = copy[language]
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState(0)
  const slides = useMemo(() => t.slides.map(([name, caption], i) => ({ name, caption, image: visuals[i] })), [t])

  useEffect(() => {
    const id = window.setInterval(() => setActive((v) => (v + 1) % slides.length), 3000)
    return () => window.clearInterval(id)
  }, [slides.length])

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#25372f]">
      <header className="sticky top-0 z-40 border-b border-[#e5e5df] bg-[#fbfaf6]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center px-5 sm:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Brand /></button>
          <nav className="ml-auto hidden items-center gap-7 md:flex">
            <a href="#how" className="text-[13px] font-medium text-[#58675f] hover:text-[#167663]">{t.how}</a>
            <a href="#report" className="text-[13px] font-medium text-[#58675f] hover:text-[#167663]">{t.report}</a>
            <a href="#why" className="text-[13px] font-medium text-[#58675f] hover:text-[#167663]">{t.impact}</a>
            <LanguageToggle compact />
            <button type="button" onClick={() => navigate('/login')} className="rounded-full bg-gradient-to-r from-[#178165] via-[#168b79] to-[#0f716d] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_9px_24px_rgba(20,126,105,.18)]">{t.signIn}</button>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <LanguageToggle compact />
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dcded9] bg-white">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[76px] z-30 border-b border-[#e5e5df] bg-[#fbfaf6] px-5 py-4 md:hidden">
          <div className="grid gap-1">
            <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[14px] font-medium">{t.how}</a>
            <a href="#report" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[14px] font-medium">{t.report}</a>
            <a href="#why" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[14px] font-medium">{t.impact}</a>
            <button type="button" onClick={() => navigate('/login')} className="mt-2 rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-4 py-3 text-left text-[14px] font-semibold text-white">{t.signIn}</button>
          </div>
        </div>
      )}

      <main>
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dbe7e0] bg-[#f1f7f3] px-4 py-2 text-[11px] font-medium text-[#167663]">
                <span className="h-2 w-2 rounded-full bg-[#ef9b45]" /> {t.eyebrow}
              </div>
              <h1 className="m-0 max-w-[650px] text-[44px] font-semibold leading-[1.06] tracking-[-.045em] text-[#20342d] sm:text-[58px]">
                {t.titleA}<span className="mt-1 block bg-gradient-to-r from-[#158565] via-[#168b79] to-[#d7853d] bg-clip-text text-transparent">{t.titleB}</span>
              </h1>
              <p className="mt-6 max-w-[610px] text-[16px] font-normal leading-7 text-[#68756e]">{t.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button type="button" onClick={() => navigate('/login')} className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#178165] via-[#168b79] to-[#0f716d] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(20,126,105,.2)]">{t.cta}<ArrowRight size={16} /></button>
                <a href="#how" className="text-[13px] font-medium text-[#4e6258] underline decoration-[#ef9b45] decoration-2 underline-offset-4">{t.secondary}</a>
              </div>
              <div className="mt-9 grid max-w-[620px] gap-3 sm:grid-cols-3">
                {[[ShieldCheck,'Guest friendly'],[Camera,'Evidence first'],[MapPin,'Flexible location']].map(([Icon,label]) => (
                  <div key={label} className="flex items-center gap-2.5 text-[12px] font-normal text-[#5f6e66]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf6f1] text-[#167663]"><Icon size={15} /></div><span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[#173e34] shadow-[0_24px_65px_rgba(46,70,57,.18)]">
              <div className="relative h-[520px] sm:h-[580px]">
                <AnimatePresence mode="sync">
                  <motion.img
                    key={`${language}-${active}`}
                    src={slides[active].image}
                    alt={slides[active].name}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1.07 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: .65 }, scale: { duration: 2.5 } }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#112c24]/90 via-[#173e34]/14 to-transparent" />
                <AnimatePresence mode="wait">
                  <motion.div key={`copy-${active}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                    <p className="m-0 text-[12px] font-medium uppercase tracking-[.18em] text-white/70">{slides[active].name}</p>
                    <p className="m-0 mt-2 text-[20px] font-medium leading-7">{slides[active].caption}</p>
                    <div className="mt-5 flex gap-1.5">
                      {slides.map((slide, i) => <button key={slide.name} type="button" onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i===active?'w-8 bg-white':'w-1.5 bg-white/45'}`} />)}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-[#e5e5df] bg-white">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.82fr_1.18fr]">
            <div><p className="m-0 text-[12px] font-medium uppercase tracking-[.18em] text-[#16816a]">MtaaFix</p><h2 className="m-0 mt-3 text-[34px] font-semibold tracking-[-.035em]">{t.whoTitle}</h2><p className="m-0 mt-4 text-[15px] font-normal leading-7 text-[#6b766f]">{t.whoBody}</p></div>
            <div><h3 className="m-0 text-[24px] font-medium">{t.whyTitle}</h3><div className="mt-6 grid gap-4">{t.reasons.map(([title,body],i)=><motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .38, delay: i * .08 }} whileHover={{ y: -5, scale: 1.01 }} className="rounded-[22px] border border-[#e5e8e4] bg-[#fbfcfa] p-5 shadow-[0_12px_30px_rgba(31,122,99,.05)]"><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf5ef] text-[#16816a]"><CheckCircle2 size={17}/></div><div><p className="m-0 text-[15px] font-medium">{title}</p><p className="m-0 mt-1 text-[13px] font-normal leading-6 text-[#6f7a73]">{body}</p></div></div></motion.div>)}</div></div>
          </div>
        </section>

        <section id="report" className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="m-0 text-[12px] font-medium uppercase tracking-[.18em] text-[#16816a]">Infrastructure</p><h2 className="m-0 mt-2 text-[32px] font-semibold tracking-[-.03em]">{language==='sw'?'Unachoweza kuripoti':'What you can report'}</h2></div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[[TrafficCone,slides[0]],[Droplets,slides[1]],[Waves,slides[2]],[Recycle,slides[3]],[Lightbulb,slides[4]]].map(([Icon,slide],i)=><motion.div key={slide.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .35, delay: i * .07 }} whileHover={{ y: -6 }} className="rounded-[22px] border border-[#e3e7e2] bg-white p-5 shadow-[0_12px_28px_rgba(34,69,54,.05)]"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eef6f2] text-[#16816a]"><Icon size={20}/></div><p className="m-0 mt-4 text-[15px] font-medium">{slide.name}</p><p className="m-0 mt-2 text-[12px] font-normal leading-5 text-[#748078]">{slide.caption}</p></motion.div>)}</div>
        </section>

        <section id="how" className="bg-[linear-gradient(135deg,#123d32_0%,#167965_48%,#d98742_130%)] text-white">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8">
            <p className="m-0 text-[12px] font-medium uppercase tracking-[.18em] text-[#92d2bd]">{t.how}</p>
            <div className="mt-7 grid gap-5 md:grid-cols-4">{[
              [Camera, language==='sw'?'Tuma taarifa':'Report'],
              [MapPin, language==='sw'?'Chagua eneo':'Choose location'],
              [Search, language==='sw'?'Mfumo unaelekeza':'Route intelligently'],
              [CheckCircle2, language==='sw'?'Fuatilia hatua':'Track progress'],
            ].map(([Icon,label],i)=><motion.div key={label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .38, delay: i * .08 }} whileHover={{ y: -6, backgroundColor: 'rgba(255,255,255,.12)' }} className="rounded-[22px] border border-white/15 bg-white/8 p-5 backdrop-blur-sm"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/12"><Icon size={20}/></div><p className="m-0 mt-5 text-[13px] text-white/60">0{i+1}</p><p className="m-0 mt-2 text-[16px] font-medium">{label}</p></motion.div>)}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
