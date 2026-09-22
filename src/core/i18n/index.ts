import { useAppStore } from '../store/appStore';
import type { Language } from '../types';
import { en, type Strings } from './en';
import { es } from './es';
import { ko } from './ko';

const dictionaries: Record<Language, Strings> = { en, ko, es };

export function getStrings(language: Language): Strings {
  return dictionaries[language];
}

/** Returns the dictionary for the language chosen in Settings. */
export function useStrings(): Strings {
  const language = useAppStore((s) => s.language);
  return dictionaries[language];
}
