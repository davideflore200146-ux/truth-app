import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { translations, TranslationMap } from '@/constants/translations';
import { DEFAULT_LANGUAGE, SupportedLanguage } from '@/constants/languages';

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: keyof TranslationMap) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => {},
  t: (key) => key as string,
  loading: true,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile?.language) {
            setLanguageState(profile.language as SupportedLanguage);
          }
        }
      } catch {
        // Not logged in — use default language
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('profiles')
          .update({ language: lang, updated_at: new Date().toISOString() })
          .eq('id', session.user.id);
      }
    } catch {
      // Offline or not logged in — state already updated locally
    }
  }, []);

  const t = useCallback(
    (key: keyof TranslationMap) => {
      const map = translations[language] ?? translations[DEFAULT_LANGUAGE];
      return map[key] ?? translations[DEFAULT_LANGUAGE][key] ?? (key as string);
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
