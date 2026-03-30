import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'

export type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'es' | 'fr'>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es,
    fr,
  },
  globalInjection: true,
})

export default i18n
