import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Link as LinkIcon,
  Camera,
  TrendingDown,
  TrendingUp,
  Star,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { TranslationMap } from '@/constants/translations';
import { Logo } from '@/components/Logo';
import { PriceResult } from '@/types/database';
import { searchProduct } from '@/lib/api';

type SearchMode = 'text' | 'url' | 'image';

interface SearchState {
  bestPrice: number;
  averagePrice: number;
  currency: string;
  results: PriceResult[];
}

export default function HomeScreen() {
  const { t } = useI18n() as { t: (key: keyof TranslationMap) => string };
  const { theme } = useTheme();

  const [mode, setMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchState | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchesLeft] = useState(10);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const data = await searchProduct(query.trim(), mode);

      if (!data.results.length) {
        setResult(null);
      } else {
        setResult({
          bestPrice: data.bestPrice,
          averagePrice: data.averagePrice,
          currency: data.currency,
          results: data.results,
        });
      }
    } catch (err: any) {
      console.error('Errore ricerca prodotto:', err);
      setErrorMessage(
        err?.message ||
          t('common_analysis_failed' as keyof TranslationMap) ||
          'Analisi fallita'
      );
    } finally {
      setLoading(false);
    }
  }, [query, mode, t]);

  const handleOpenStore = useCallback(async (url: string) => {
    if (!url || typeof url !== 'string') {
      Alert.alert(
        'Link non disponibile',
        'Questo negozio non ha un link diretto.'
      );
      return;
    }

    let storeUrl = url.trim();

    if (!storeUrl) {
      Alert.alert(
        'Link non disponibile',
        'Questo negozio non ha un link diretto.'
      );
      return;
    }

    if (!/^https?:\/\//i.test(storeUrl)) {
      storeUrl = `https://${storeUrl}`;
    }

    try {
      await Linking.openURL(storeUrl);
    } catch (error) {
      console.error('[TRUTH] Errore apertura negozio:', error);

      Alert.alert(
        'Impossibile aprire il negozio',
        'Non è stato possibile aprire il link del negozio.'
      );
    }
  }, []);

  const modes: {
    key: SearchMode;
    label: string;
    icon: typeof Search;
  }[] = [
    { key: 'text', label: t('search_by_text'), icon: Search },
    { key: 'url', label: t('search_by_url'), icon: LinkIcon },
    { key: 'image', label: t('search_by_image'), icon: Camera },
  ];

  const merchantColors: Record<string, string> = {
    Amazon: '#FF9900',
    eBay: '#E53238',
    AliExpress: '#FF4747',
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Logo size={48} />

          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>
              TRUTH
            </Text>

            <Text
              style={[
                styles.appTagline,
                { color: theme.textSecondary },
              ]}
            >
              {t('home_subtitle')}
            </Text>
          </View>
        </View>

        <View style={styles.modeSelectorWrapper}>
          <View
            style={[
              styles.modeSelectorContainer,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            {modes.map((m, idx) => {
              const Icon = m.icon;
              const active = mode === m.key;

              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.modeTab,
                    active && {
                      backgroundColor: theme.surface,
                    },
                    idx === 0 && styles.modeTabFirst,
                  ]}
                  onPress={() => {
                    setMode(m.key);
                    setQuery('');
                    setResult(null);
                    setHasSearched(false);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={18}
                    color={
                      active
                        ? theme.colors.primary[500]
                        : theme.textTertiary
                    }
                    strokeWidth={2.2}
                  />

                  <Text
                    style={[
                      styles.modeLabel,
                      {
                        color: active
                          ? theme.colors.primary[500]
                          : theme.textTertiary,
                      },
                      active && {
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {mode === 'image' ? (
            <TouchableOpacity
              style={[
                styles.imageUploadArea,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderRadius: Radius.lg,
                },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.imageUploadIconCircle,
                  {
                    backgroundColor: theme.colors.primary[50],
                  },
                ]}
              >
                <Camera
                  size={32}
                  color={theme.colors.primary[500]}
                  strokeWidth={1.8}
                />
              </View>

              <Text
                style={[
                  styles.imageUploadText,
                  { color: theme.textSecondary },
                ]}
              >
                {t('image_search_hint')}
              </Text>

              <LinearGradient
                colors={
                  theme.mode === 'dark'
                    ? ['#3b6bff', '#ff5ab0']
                    : ['#2b50f0', '#7c3aed']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  {t('search_button')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <View
                style={[
                  styles.searchInputRow,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                {mode === 'url' ? (
                  <LinkIcon
                    size={20}
                    color={theme.textTertiary}
                    strokeWidth={2}
                  />
                ) : (
                  <Search
                    size={20}
                    color={theme.textTertiary}
                    strokeWidth={2}
                  />
                )}

                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.textPrimary },
                  ]}
                  placeholder={
                    mode === 'url'
                      ? t('paste_url_placeholder')
                      : t('search_placeholder')
                  }
                  placeholderTextColor={theme.textTertiary}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={theme.colors.primary[400]}
                  onSubmitEditing={handleSearch}
                />
              </View>

              <LinearGradient
                colors={
                  query.trim() && !loading
                    ? theme.mode === 'dark'
                      ? ['#3b6bff', '#9b5cff']
                      : ['#2b50f0', '#7c3aed']
                    : [
                        theme.colors.neutral[300],
                        theme.colors.neutral[300],
                      ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.searchButtonGradient,
                  query.trim() &&
                    !loading && {
                      shadowColor:
                        theme.mode === 'dark'
                          ? '#3b6bff'
                          : '#2b50f0',
                      shadowOffset: {
                        width: 0,
                        height: 4,
                      },
                      shadowOpacity:
                        theme.mode === 'dark' ? 0.5 : 0.35,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                ]}
              >
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={!query.trim() || loading}
                  activeOpacity={0.85}
                  style={styles.searchButtonInner}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                    />
                  ) : (
                    <>
                      <Search
                        size={18}
                        color="#fff"
                        strokeWidth={2.5}
                        style={{ marginRight: 8 }}
                      />

                      <Text style={styles.searchButtonText}>
                        {t('search_button')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </>
          )}
        </View>

        <View
          style={[
            styles.quotaBar,
            { backgroundColor: theme.surfaceAlt },
          ]}
        >
          <Lock
            size={14}
            color={theme.textSecondary}
            strokeWidth={2}
          />

          <Text
            style={[
              styles.quotaText,
              { color: theme.textSecondary },
            ]}
          >
            {searchesLeft} {t('searches_left')}
          </Text>

          <TouchableOpacity
            style={[
              styles.quotaUpgrade,
              {
                backgroundColor: theme.colors.accent[50],
              },
            ]}
          >
            <Sparkles
              size={13}
              color={theme.colors.accent[600]}
              strokeWidth={2}
            />

            <Text
              style={[
                styles.quotaUpgradeText,
                { color: theme.colors.accent[600] },
              ]}
            >
              {t('upgrade_now')}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={theme.colors.primary[500]}
            />

            <Text
              style={[
                styles.loadingText,
                { color: theme.textSecondary },
              ]}
            >
              {t('loading')}
            </Text>
          </View>
        )}

        {errorMessage && !loading && (
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: theme.surface,
                borderColor:
                  theme.colors.error?.[400] ?? '#ef4444',
              },
            ]}
          >
            <Text
              style={[
                styles.loadingText,
                {
                  color: theme.textPrimary,
                  textAlign: 'center',
                },
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {result && !loading && !errorMessage && (
          <View style={styles.resultsSection}>
            <View
              style={[
                styles.priceSummaryCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultQuery,
                  { color: theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                {query}
              </Text>

              <View style={styles.priceSummaryRow}>
                <View
                  style={[
                    styles.priceBox,
                    {
                      backgroundColor:
                        theme.colors.success[50],
                      borderColor:
                        theme.colors.success[400],
                    },
                  ]}
                >
                  <View style={styles.priceBoxHeader}>
                    <TrendingDown
                      size={16}
                      color={theme.colors.success[500]}
                      strokeWidth={2.5}
                    />

                    <Text
                      style={[
                        styles.priceBoxLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {t('best_price')}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.bestPriceValue,
                      { color: theme.colors.success[500] },
                    ]}
                  >
                    {result.bestPrice.toFixed(2)}{' '}
                    <Text style={styles.currencySymbol}>
                      €
                    </Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.priceBox,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.priceBoxHeader}>
                    <TrendingUp
                      size={16}
                      color={theme.textTertiary}
                      strokeWidth={2.5}
                    />

                    <Text
                      style={[
                        styles.priceBoxLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {t('average_price')}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.avgPriceValue,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {result.averagePrice.toFixed(2)}{' '}
                    <Text style={styles.currencySymbol}>
                      €
                    </Text>
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.merchantList}>
              <Text
                style={[
                  styles.merchantListTitle,
                  { color: theme.textPrimary },
                ]}
              >
                Offerte
              </Text>

              {result.results.map((r, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.merchantCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenStore(r.url)}
                >
                  <View style={styles.merchantCardLeft}>
                    <View
                      style={[
                        styles.merchantBadge,
                        {
                          backgroundColor:
                            (merchantColors[
                              r.merchant_name
                            ] ??
                              theme.colors.primary[500]) +
                            '22',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.merchantBadgeText,
                          {
                            color:
                              merchantColors[
                                r.merchant_name
                              ] ??
                              theme.colors.primary[500],
                          },
                        ]}
                      >
                        {r.merchant_name.charAt(0)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.merchantName,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {r.merchant_name}
                      </Text>

                      <Text
                        style={[
                          styles.merchantShipping,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {(r.shipping_cost ?? 0) === 0
                          ? 'Spedizione gratuita'
                          : `Spedizione €${r.shipping_cost!.toFixed(
                              2
                            )}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.merchantCardRight}>
                    <Text
                      style={[
                        styles.merchantPrice,
                        { color: theme.textPrimary },
                      ]}
                    >
                      €{r.price.toFixed(2)}
                    </Text>

                    {idx === 0 && (
                      <View style={styles.bestDealTag}>
                        <Text
                          style={styles.bestDealTagText}
                        >
                          MIGLIORE
                        </Text>
                      </View>
                    )}

                    <ChevronRight
                      size={18}
                      color={theme.textTertiary}
                      strokeWidth={2}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.favButton,
                {
                  backgroundColor:
                    theme.colors.accent[50],
                  borderColor:
                    theme.colors.accent[200],
                },
              ]}
              activeOpacity={0.8}
            >
              <Star
                size={18}
                color={theme.colors.accent[500]}
                strokeWidth={2}
              />

              <Text
                style={[
                  styles.favButtonText,
                  { color: theme.colors.accent[600] },
                ]}
              >
                {t('add_to_favorites')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!result &&
          !loading &&
          !errorMessage &&
          hasSearched && (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.surfaceAlt },
                ]}
              >
                <Search
                  size={36}
                  color={theme.textTertiary}
                  strokeWidth={1.5}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.textPrimary },
                ]}
              >
                {t('no_results')}
              </Text>
            </View>
          )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  appTagline: {
    fontSize: 14,
    marginTop: 2,
  },

  modeSelectorWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  modeSelectorContainer: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 4,
  },

  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },

  modeTabFirst: {},

  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  searchCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },

  searchButtonGradient: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
  },

  searchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: Radius.md,
  },

  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  gradientButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },

  gradientButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  imageUploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },

  imageUploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  imageUploadText: {
    fontSize: 14,
    textAlign: 'center',
  },

  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },

  quotaText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  quotaUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },

  quotaUpgradeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  loadingCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },

  loadingText: {
    fontSize: 14,
    marginTop: Spacing.md,
  },

  resultsSection: {
    marginTop: Spacing.lg,
  },

  priceSummaryCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  resultQuery: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },

  priceSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  priceBox: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
  },

  priceBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },

  priceBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bestPriceValue: {
    fontSize: 30,
    fontWeight: '800',
  },

  avgPriceValue: {
    fontSize: 30,
    fontWeight: '800',
  },

  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
  },

  merchantList: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },

  merchantListTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },

  merchantCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },

  merchantBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  merchantBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },

  merchantName: {
    fontSize: 16,
    fontWeight: '600',
  },

  merchantShipping: {
    fontSize: 13,
    marginTop: 2,
  },

  merchantCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  merchantPrice: {
    fontSize: 19,
    fontWeight: '800',
  },

  bestDealTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#10b981',
    borderRadius: Radius.xs,
  },

  bestDealTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  favButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },

  favButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
