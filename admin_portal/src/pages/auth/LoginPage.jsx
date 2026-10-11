import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { loginAuthority, requestAuthorityOtp, verifyAuthorityOtp } from '../../services/authService'
import LanguageToggle from '../../components/LanguageToggle'
import { useLanguage } from '../../context/LanguageContext'
import roads from '../../assets/roads.jpg'
import water from '../../assets/water.jpg'
import drainage from '../../assets/drainage.jpg'
import waste from '../../assets/waste.jpg'
import streetlight from '../../assets/streetlight.jpg'

const images = [roads, water, drainage, waste, streetlight]

const copy = {
  en: {
    back: 'Back to MtaaFix', portal: 'Operations Portal', title: 'Sign in',
    subtitle: 'Use your registered operations account to continue.',
    email: 'Email address', emailPlaceholder: 'name@example.go.tz',
    password: 'Password', passwordPlaceholder: 'Enter your password', forgot: 'Forgot password?',
    submit: 'Sign in', loading: 'Signing in...', required: 'Enter your email address and password.',
    failed: 'Unable to sign in.', footer: 'For the Super Admin and registered department officers.',
    slides: [
      ['Roads', 'Damaged roads and potholes can be reported before they become a bigger safety risk.'],
      ['Water', 'Leaks and burst pipes can be located, routed and followed through to action.'],
      ['Drainage', 'Blocked drains and flood-prone points become visible before the problem grows.'],
      ['Waste', 'Waste hotspots can be reported with evidence, location and a visible response trail.'],
      ['Street lighting', 'Unsafe or non-working lights can be assigned to the responsible service team.'],
    ],
  },
  sw: {
    back: 'Rudi MtaaFix', portal: 'Portal ya Watendaji', title: 'Ingia',
    subtitle: 'Tumia akaunti yako ya watendaji kuendelea.',
    email: 'Barua pepe', emailPlaceholder: 'jina@example.go.tz',
    password: 'Nenosiri', passwordPlaceholder: 'Weka nenosiri lako', forgot: 'Umesahau nenosiri?',
    submit: 'Ingia', loading: 'Inaingia...', required: 'Weka barua pepe na nenosiri.',
    failed: 'Imeshindikana kuingia.', footer: 'Kwa Msimamizi Mkuu na maafisa wa idara waliosajiliwa.',
    slides: [
      ['Barabara', 'Mashimo na uharibifu wa barabara unaweza kuripotiwa kabla haujawa hatari kubwa zaidi.'],
      ['Maji', 'Uvujaji na mabomba yaliyopasuka yanaweza kuwekwa kwenye ramani na kufuatiliwa hadi hatua ichukuliwe.'],
      ['Mifereji', 'Mifereji iliyoziba na maeneo hatarishi kwa mafuriko yanaonekana mapema.'],
      ['Taka', 'Maeneo yenye taka yanaweza kuripotiwa pamoja na ushahidi, eneo na historia ya hatua.'],
      ['Taa za barabarani', 'Taa zisizofanya kazi zinaweza kupelekwa kwa timu inayohusika na kufuatiliwa.'],
    ],
  },
}

function LoginPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = copy[language]
  const slides = useMemo(
    () => t.slides.map(([name, caption], index) => ({ name, caption, image: images[index] })),
    [t],
  )

  const [activeSlide, setActiveSlide] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useOtp, setUseOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [developmentOtp, setDevelopmentOtp] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 3000)
    return () => window.clearInterval(id)
  }, [slides.length])

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setError(t.required)
      return
    }
    setLoading(true)
    setError('')
    try {
      await loginAuthority(cleanEmail, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed)
    } finally {
      setLoading(false)
    }
  }


  async function handleRequestOtp() {
    const phone = email.trim()
    if (!phone) {
      setError(language === 'sw' ? 'Weka namba ya simu.' : 'Enter your phone number.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const response = await requestAuthorityOtp(phone)
      setOtpSent(true)
      setDevelopmentOtp(response.developmentOtp || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!email.trim() || otpCode.trim().length !== 6) {
      setError(language === 'sw' ? 'Weka namba ya simu na OTP ya tarakimu 6.' : 'Enter phone number and 6-digit OTP.')
      return
    }
    try {
      setLoading(true)
      setError('')
      await verifyAuthorityOtp(email.trim(), otpCode.trim())
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify code.')
    } finally {
      setLoading(false)
    }
  }

  const current = slides[activeSlide]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#152720]">
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.img
            key={`${language}-${activeSlide}`}
            src={current.image}
            alt={current.name}
            initial={{ opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1.075 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: .7 }, scale: { duration: 2.5, ease: 'easeOut' } }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,44,35,.74),rgba(10,38,35,.48)_45%,rgba(13,24,21,.68))]" />
        <div className="absolute inset-0 backdrop-blur-[1.6px]" />
      </div>

      <div className="pointer-events-none absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 justify-center gap-1.5">
        {slides.map((slide, index) => (
          <button
            key={slide.name}
            type="button"
            aria-label={`Show ${slide.name}`}
            onClick={() => setActiveSlide(index)}
            className={`pointer-events-auto h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/45'}`}
          />
        ))}
      </div>

      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-24 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 16, scale: .985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .42, ease: 'easeOut' }}
          className="w-full max-w-[410px]"
        >
          <div className="rounded-[25px] border border-white/55 bg-white/96 p-6 shadow-[0_28px_80px_rgba(0,0,0,.34)] backdrop-blur-xl sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#718078] transition hover:text-[#167663]">
                <ArrowLeft size={14} /> {t.back}
              </button>
              <LanguageToggle compact />
            </div>

            <div className="text-center">
              <img src="/mtaafix-mark.svg" alt="MtaaFix" className="mx-auto h-14 w-14 rounded-[17px] shadow-[0_8px_24px_rgba(22,118,99,.16)]" />
              <h1 className="m-0 mt-3 text-[25px] font-semibold tracking-[-.035em] text-[#26372f]">MtaaFix</h1>
              <p className="m-0 mt-0.5 text-[12px] font-normal text-[#809087]">{t.portal}</p>
              <h2 className="m-0 mt-6 text-[22px] font-medium tracking-[-.025em] text-[#2d3d35]">{t.title}</h2>
              <p className="m-0 mx-auto mt-2 max-w-[300px] text-[12px] font-normal leading-5 text-[#7a8780]">{t.subtitle}</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex gap-3 rounded-[14px] border border-[#efcec6] bg-[#fff4f1] p-3.5">
                <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#bd5947]" />
                <p className="m-0 text-[12px] font-normal leading-5 text-[#9f4e3d]">{error}</p>
              </motion.div>
            )}

            <form className="mt-6" onSubmit={handleSubmit}>
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-[14px] border border-[#dfe5e1] bg-[#f7f9f7] p-1">
                <button
                  type="button"
                  onClick={() => { setUseOtp(false); setOtpSent(false); setError('') }}
                  className={`rounded-[11px] px-3 py-2 text-[11px] font-semibold transition ${!useOtp ? 'bg-white text-[#1F7A63] shadow-sm' : 'text-[#7a8780]'}`}
                >
                  {language === 'sw' ? 'Nenosiri' : 'Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setUseOtp(true); setError('') }}
                  className={`rounded-[11px] px-3 py-2 text-[11px] font-semibold transition ${useOtp ? 'bg-white text-[#1F7A63] shadow-sm' : 'text-[#7a8780]'}`}
                >
                  Phone OTP
                </button>
              </div>

              <label className="mb-2 block text-[12px] font-medium text-[#435249]">
                {useOtp ? (language === 'sw' ? 'Namba ya simu' : 'Phone number') : (language === 'sw' ? 'Barua pepe au simu' : 'Email or phone')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]" />
                <input
                  type="text"
                  value={email}
                  disabled={loading}
                  onChange={(event) => { setEmail(event.target.value); if (error) setError('') }}
                  placeholder={useOtp ? '0712345678' : t.emailPlaceholder}
                  className="h-12 w-full rounded-[12px] border border-[#d8ddd9] bg-white pl-10 pr-4 text-[13px] font-normal text-[#2c3c34] outline-none transition placeholder:text-[#a2aca7] focus:border-[#3b9b80] focus:ring-4 focus:ring-[#19846a]/8 disabled:opacity-60"
                />
              </div>

              {!useOtp ? (
                <>
                  <div className="mb-2 mt-4 flex items-center justify-between gap-3">
                    <label className="block text-[12px] font-medium text-[#435249]">{t.password}</label>
                    <button type="button" className="text-[11px] font-medium text-[#178165] transition hover:text-[#115f4e]">{t.forgot}</button>
                  </div>

                  <div className="relative">
                    <LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} disabled={loading}
                      onChange={(event) => { setPassword(event.target.value); if (error) setError('') }}
                      placeholder={t.passwordPlaceholder} autoComplete="current-password"
                      className="h-12 w-full rounded-[12px] border border-[#d8ddd9] bg-white pl-10 pr-11 text-[13px] font-normal text-[#2c3c34] outline-none transition placeholder:text-[#a2aca7] focus:border-[#3b9b80] focus:ring-4 focus:ring-[#19846a]/8 disabled:opacity-60"
                    />
                    <button type="button" disabled={loading} onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#829089] transition hover:text-[#2f4037]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#21a06f] via-[#168d72] to-[#0c746c] text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(16,124,96,.24)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
                    {loading ? <><LoaderCircle size={16} className="animate-spin" />{t.loading}</> : <>{t.submit}<ArrowRight size={16} /></>}
                  </button>
                </>
              ) : otpSent ? (
                <>
                  <label className="mb-2 mt-4 block text-[12px] font-medium text-[#435249]">{language === 'sw' ? 'Namba ya uthibitisho' : 'Verification code'}</label>
                  <input value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="123456" className="h-12 w-full rounded-[12px] border border-[#d8ddd9] bg-white px-4 text-center text-[16px] tracking-[.35em] text-[#2c3c34] outline-none focus:border-[#3b9b80]" />
                  {developmentOtp && <p className="m-0 mt-2 text-center text-[10px] text-[#89958f]">DEV OTP: {developmentOtp}</p>}
                  <button type="button" onClick={handleVerifyOtp} disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#21a06f] to-[#0c746c] text-[13px] font-semibold text-white">{language === 'sw' ? 'Thibitisha na uingie' : 'Verify and sign in'}</button>
                  <button type="button" onClick={handleRequestOtp} disabled={loading} className="mt-2 w-full text-center text-[11px] font-semibold text-[#178165]">{language === 'sw' ? 'Tuma tena OTP' : 'Resend OTP'}</button>
                </>
              ) : (
                <>
                  <p className="m-0 mt-3 text-[11px] leading-5 text-[#7a8780]">{language === 'sw' ? 'OTP ya tarakimu 6 itatumwa kwenye namba iliyosajiliwa.' : 'A 6-digit OTP will be sent to the registered mobile number.'}</p>
                  <button type="button" onClick={handleRequestOtp} disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#21a06f] to-[#0c746c] text-[13px] font-semibold text-white">{language === 'sw' ? 'Tuma OTP' : 'Send OTP'}</button>
                </>
              )}
            </form>
            <p className="m-0 mt-5 text-center text-[10.5px] font-normal leading-5 text-[#89958f]">{t.footer}</p>
          </div>
        </motion.section>
      </div>
    </main>
  )
}

export default LoginPage
