import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-toggle" data-i18n-skip role="group" aria-label="Language / 语言">
      <button
        type="button"
        className={language === 'zh' ? 'is-active' : ''}
        onClick={() => setLanguage('zh')}
        aria-pressed={language === 'zh'}
      >
        中文
      </button>
      <button
        type="button"
        className={language === 'en' ? 'is-active' : ''}
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
    </div>
  );
}
