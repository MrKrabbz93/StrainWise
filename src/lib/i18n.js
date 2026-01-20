import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import th from '../locales/th.json';
import nl from '../locales/nl.json';
import pt from '../locales/pt.json';
import it from '../locales/it.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            es: { translation: es },
            fr: { translation: fr },
            de: { translation: de },
            th: { translation: th },
            nl: { translation: nl },
            pt: { translation: pt },
            it: { translation: it }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes values
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage']
        }
    });

export default i18n;
