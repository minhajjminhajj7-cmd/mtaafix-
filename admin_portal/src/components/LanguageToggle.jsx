import { Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function LanguageToggle({ compact = false, dark = false }) {
  const { language, toggleLanguage } = useLanguage()
  const next = language === 'en' ? 'SW' : 'EN'
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Change language"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition ${
        dark
          ? 'border-white/25 bg-white/10 text-white hover:bg-white/16'
          : 'border-[#d8ded9] bg-white text-[#4a5a52] hover:border-[#aebdb5] hover:bg-[#f7faf8]'
      }`}
    >
      <Languages size={15} />
      {!compact && <span>{language === 'en' ? 'English' : 'Kiswahili'}</span>}
      <span className="rounded-full bg-[#eef5f1] px-2 py-0.5 text-[10px] font-semibold text-[#167663]">{next}</span>
    </button>
  )
}

export default LanguageToggle
