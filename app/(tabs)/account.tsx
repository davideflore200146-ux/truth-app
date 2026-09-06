import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Globe,
  Crown,
  Check,
  ChevronRight,
  Sparkles,
  Infinity as InfinityIcon,
  Bell,
  Ban,
  LogOut,
  Sun,
  Moon,
  Palette,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { TranslationMap } from '@/constants/translations';
import { LANGUAGES, SupportedLanguage, LanguageOption } from '@/constants/languages';
import { PREMIUM_PRICE_MONTHLY } from '@/constants/config';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { Logo } from '@/components/Logo';

export default function AccountScreen() {
  const { t, language, setLanguage } = useI18n() as {
    t: (key: keyof TranslationMap) => string;
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
  };
  const { theme, mode, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!error && data) setProfile(data as Profile);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLanguageSelect = useCallback(async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setLangModalVisible(false);
  }, [setLanguage]);

  const handleUpgrade = useCallback(() => {
    Alert.alert(
      t('account_upgrade'),
      `Premium: €${PREMIUM_PRICE_MONTHLY.toFixed(2)}/${t('account_monthly')}\n\nIl sistema di pagamento sarà attivato nella prossima fase.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            setUpgrading(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
              await supabase
                .from('profiles')
                .update({
                  is_premium: true,
                  premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', session.user.id);
              setProfile(prev => prev ? { ...prev, is_premium: true } : prev);
            } catch {
            } finally {
              setUpgrading(false);
            }
          },
        },
      ]
    );
  }, [t]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch {}
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Logo size={42} />
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>TRUTH</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.mode === 'dark' ? ['#3b6bff', '#ff5ab0'] : ['#2b50f0', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <User size={30} color="#fff" strokeWidth={2} />
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>
              {profile ? 'Utente TRUTH' : 'Ospite'}
            </Text>
            <View style={[styles.planBadge, profile?.is_premium ? { backgroundColor: theme.colors.accent[50] } : { backgroundColor: theme.surfaceAlt }]}>
              {profile?.is_premium ? (
                <Crown size={13} color={theme.colors.accent[500]} strokeWidth={2.5} />
              ) : (
                <User size={13} color={theme.textSecondary} strokeWidth={2.5} />
              )}
              <Text style={[styles.planBadgeText, profile?.is_premium ? { color: theme.colors.accent[600] } : { color: theme.textSecondary }]}>
                {profile?.is_premium ? t('account_premium_active') : t('account_free')}
              </Text>
            </View>
          </View>
        </View>

        {/* === PREMIUM CARD === */}
        <View style={styles.cardSection}>
          <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>Abbonamento</Text>

          {profile?.is_premium ? (
            <View style={[styles.premiumActiveCard, { backgroundColor: theme.surface, borderColor: theme.colors.accent[200] }]}>
              <View style={styles.premiumActiveHeader}>
                <View style={styles.crownBadge}>
                  <Crown size={22} color="#fff" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.premiumActiveTitle, { color: theme.textPrimary }]}>{t('account_premium_active')}</Text>
                  <Text style={[styles.premiumActiveSub, { color: theme.textSecondary }]}>
                    {t('account_monthly')} · €{PREMIUM_PRICE_MONTHLY.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={[styles.premiumActiveDivider, { backgroundColor: theme.border }]} />
              <View style={styles.benefitsList}>
                <View style={styles.benefitRow}>
                  <InfinityIcon size={18} color={theme.colors.success[500]} strokeWidth={2.5} />
                  <Text style={[styles.benefitText, { color: theme.textPrimary }]}>{t('account_unlimited_searches')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ban size={18} color={theme.colors.success[500]} strokeWidth={2.5} />
                  <Text style={[styles.benefitText, { color: theme.textPrimary }]}>{t('account_no_ads')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Bell size={18} color={theme.colors.success[500]} strokeWidth={2.5} />
                  <Text style={[styles.benefitText, { color: theme.textPrimary }]}>{t('account_price_alerts')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.upgradeCard}>
              <View style={styles.upgradeHeader}>
                <View style={styles.crownBadgeLarge}>
                  <Crown size={30} color="#fff" strokeWidth={2} />
                </View>
                <Text style={styles.upgradeTitle}>{t('account_upgrade')}</Text>
                <Text style={styles.upgradePrice}>
                  €{PREMIUM_PRICE_MONTHLY.toFixed(2)}
                  <Text style={styles.upgradePricePeriod}>/{t('account_monthly')}</Text>
                </Text>
              </View>
              <View style={styles.upgradeBenefits}>
                <View style={styles.benefitRowDark}>
                  <InfinityIcon size={17} color="#ff70c2" strokeWidth={2.5} />
                  <Text style={styles.benefitTextDark}>{t('account_unlimited_searches')}</Text>
                </View>
                <View style={styles.benefitRowDark}>
                  <Ban size={17} color="#ff70c2" strokeWidth={2.5} />
                  <Text style={styles.benefitTextDark}>{t('account_no_ads')}</Text>
                </View>
                <View style={styles.benefitRowDark}>
                  <Bell size={17} color="#ff70c2" strokeWidth={2.5} />
                  <Text style={styles.benefitTextDark}>{t('account_price_alerts')}</Text>
                </View>
              </View>
              <LinearGradient
                colors={['#ff5ab0', '#e83390']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButtonGradient}
              >
                <TouchableOpacity style={styles.upgradeButtonInner} onPress={handleUpgrade} disabled={upgrading} activeOpacity={0.85}>
                  {upgrading ? (
                    <ActivityIndicator size="small" color="#0a0e1a" />
                  ) : (
                    <>
                      <Sparkles size={19} color="#0a0e1a" strokeWidth={2} />
                      <Text style={styles.upgradeButtonText}>{t('upgrade_now')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* === APPEARANCE CARD === */}
        <View style={styles.cardSection}>
          <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>Aspetto</Text>
          <View style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.optionIconBox, { backgroundColor: mode === 'dark' ? theme.colors.primary[50] : theme.colors.warning[50] }]}>
              {mode === 'dark' ? (
                <Moon size={20} color={theme.colors.primary[500]} strokeWidth={2.2} />
              ) : (
                <Sun size={20} color={theme.colors.warning[500]} strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.optionTextGroup}>
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>Modalità Scura</Text>
              <Text style={[styles.optionSubLabel, { color: theme.textSecondary }]}>
                {mode === 'dark' ? 'Attiva · Tema scuro' : 'Disattivata · Tema chiaro'}
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[500] }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* === LANGUAGE CARD === */}
        <View style={styles.cardSection}>
          <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>{t('account_language')}</Text>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconBox, { backgroundColor: theme.colors.success[50] }]}>
              <Globe size={20} color={theme.colors.success[500]} strokeWidth={2.2} />
            </View>
            <View style={styles.optionTextGroup}>
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{t('account_language')}</Text>
              <Text style={[styles.optionSubLabel, { color: theme.textSecondary }]}>{currentLang?.label}</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={[styles.optionRightCode, { color: theme.textTertiary }]}>{currentLang?.code.toUpperCase()}</Text>
              <ChevronRight size={20} color={theme.textTertiary} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* === SIGN OUT CARD === */}
        {profile && (
          <View style={styles.cardSection}>
            <TouchableOpacity
              style={[styles.signOutCard, { backgroundColor: theme.surface, borderColor: theme.colors.error[100] }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBox, { backgroundColor: theme.colors.error[50] }]}>
                <LogOut size={20} color={theme.colors.error[500]} strokeWidth={2.2} />
              </View>
              <Text style={[styles.signOutText, { color: theme.colors.error[500] }]}>{t('account_sign_out')}</Text>
              <ChevronRight size={20} color={theme.colors.error[400]} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="slide" onRequestClose={() => setLangModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('account_language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }: { item: LanguageOption }) => {
                const active = item.code === language;
                return (
                  <TouchableOpacity
                    style={[styles.langOption, active && { backgroundColor: theme.colors.primary[50] }]}
                    onPress={() => handleLanguageSelect(item.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langFlag, { color: theme.colors.primary[500] }]}>{item.flag}</Text>
                    <Text style={[styles.langOptionLabel, { color: theme.textPrimary }, active && { color: theme.colors.primary[600], fontWeight: '700' }]}>
                      {item.label}
                    </Text>
                    {active && (
                      <View style={[styles.langCheck, { backgroundColor: theme.colors.primary[100] }]}>
                        <Check size={18} color={theme.colors.primary[600]} strokeWidth={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: 1.5 },
  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  planBadgeText: { fontSize: 13, fontWeight: '700' },
  // Card sections
  cardSection: {
    marginBottom: Spacing.lg,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  // Premium active
  premiumActiveCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  premiumActiveHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#e83390',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumActiveTitle: { fontSize: 18, fontWeight: '700' },
  premiumActiveSub: { fontSize: 14, marginTop: 2 },
  premiumActiveDivider: { height: 1, marginVertical: Spacing.md },
  benefitsList: { gap: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitText: { fontSize: 16, fontWeight: '500' },
  // Upgrade card
  upgradeCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: '#0a0e1a',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  upgradeHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  crownBadgeLarge: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: '#e83390',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  upgradeTitle: { fontSize: 19, fontWeight: '700', color: '#fff', marginBottom: 4 },
  upgradePrice: { fontSize: 30, fontWeight: '800', color: '#ff70c2' },
  upgradePricePeriod: { fontSize: 16, fontWeight: '500', color: '#5a6ba0' },
  upgradeBenefits: { gap: Spacing.md, marginBottom: Spacing.lg },
  benefitRowDark: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitTextDark: { fontSize: 16, fontWeight: '500', color: '#c8d0e8' },
  upgradeButtonGradient: {
    borderRadius: Radius.md,
  },
  upgradeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.md,
  },
  upgradeButtonText: { fontSize: 17, fontWeight: '800', color: '#0a0e1a' },
  // Option cards (appearance, language, sign out)
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionLabel: { fontSize: 17, fontWeight: '700' },
  optionSubLabel: { fontSize: 13, marginTop: 2 },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  optionRightCode: { fontSize: 13, fontWeight: '700' },
  // Sign out
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  signOutText: { flex: 1, fontSize: 17, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  langFlag: { fontSize: 22, fontWeight: '800', width: 36 },
  langOptionLabel: { flex: 1, fontSize: 17, fontWeight: '500' },
  langCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
