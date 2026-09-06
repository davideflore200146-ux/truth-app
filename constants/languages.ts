export type SupportedLanguage = 'it' | 'en' | 'es' | 'pt' | 'fr' | 'de' | 'sc';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'it', label: 'Italiano', flag: 'IT' },
  { code: 'en', label: 'English', flag: 'GB' },
  { code: 'es', label: 'Espanol', flag: 'ES' },
  { code: 'pt', label: 'Portugues', flag: 'PT' },
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'sc', label: 'Sardu', flag: 'SC' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'it';
