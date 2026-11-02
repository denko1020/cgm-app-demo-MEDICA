import { useAppStore } from '../store/appStore';
import type { Language } from '../types';
import { en, type Strings } from './en';
import { es } from './es';
import { ko } from './ko';

const dictionaries: Record<Language, Strings> = { en, ko, es };

/** BCP 47 tags for the Intl formatters (weekday and month names). */
const localeTags: Record<Language, string> = { en: 'en-US', ko: 'ko-KR', es: 'es-ES' };

export function getStrings(language: Language): Strings {
  return dictionaries[language];
}

/** The locale tag for the language chosen in Settings, for date formatting. */
export function useLocaleTag(): string {
  const language = useAppStore((s) => s.language);
  return localeTags[language];
}

/** Returns the dictionary for the language chosen in Settings. */
export function useStrings(): Strings {
  const language = useAppStore((s) => s.language);
  return dictionaries[language];
}
