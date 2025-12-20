
import en from '../locales/en';
import fr from '../locales/fr';

type LocaleData = { [key: string]: string | LocaleData };
const translations: Record<string, LocaleData> = { en: en as LocaleData, fr: fr as LocaleData };

// Provide a default if the requested language isn't supported
const getTranslation = (lang: string): LocaleData => translations[lang] || translations['en'];

export function useI18n(currentLang: { value: string }) {
    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let result: string | LocaleData | undefined = getTranslation(currentLang.value);

        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return path; // Fallback to path name if not found
            }
        }

        if (typeof result === 'string') {
            let strResult = result;
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    strResult = strResult.replace(`{${key}}`, String(value));
                });
            }
            return strResult;
        }

        return path;
    };

    return { t };
}
