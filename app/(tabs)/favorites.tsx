import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  Search,
  Link as LinkIcon,
  Camera,
  Trash2,
  TrendingDown,
  Bell,
  Target,
} from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { TranslationMap } from '@/constants/translations';
import { supabase } from '@/lib/supabase';
import { Favorite, SearchType } from '@/types/database';

function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

function getSearchIcon(type: SearchType) {
  if (type === 'url') return LinkIcon;
  if (type === 'image') return Camera;
  return Search;
}

export default function FavoritesScreen() {
  const { t } = useI18n() as { t: (key: keyof TranslationMap) => string };
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setFavorites(data as Favorite[]);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const handleRefresh = useCallback(() => { setRefreshing(true); loadFavorites(); }, [loadFavorites]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await supabase.from('favorites').delete().eq('id', id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch {}
  }, []);

  const renderCard = ({ item }: { item: Favorite }) => {
    const Icon = getSearchIcon(item.search_type);
    const hasTarget = item.target_price !== null;
    const targetMet = hasTarget && item.last_best_price !== null && item.last_best_price <= item.target_price!;

    return (
      <View style={[styles.favCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          <View style={styles.cardIconRow}>
            <View style={[styles.typeIcon, { backgroundColor: theme.colors.primary[50] }]}>
              <Icon size={14} color={theme.colors.primary[500]} strokeWidth={2} />
            </View>
            <Text style={[styles.cardQuery, { color: theme.textPrimary }]} numberOfLines={2}>{item.query}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={15} color={theme.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardPriceSection}>
          <View style={styles.priceBlock}>
            <View style={styles.priceLabelRow}>
              <TrendingDown size={13} color={theme.colors.success[500]} strokeWidth={2.5} />
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>{t('best_price')}</Text>
            </View>
            <Text style={[styles.priceValue, { color: theme.colors.success[500] }]}>
              €{formatPrice(item.last_best_price)}
            </Text>
          </View>

          {hasTarget && (
            <View style={[styles.targetBlock, { backgroundColor: targetMet ? theme.colors.success[50] : theme.colors.accent[50] }]}>
              <View style={styles.priceLabelRow}>
                <Target size={13} color={targetMet ? theme.colors.success[500] : theme.colors.accent[500]} strokeWidth={2.5} />
                <Text style={[styles.priceLabel, { color: targetMet ? theme.colors.success[500] : theme.colors.accent[500] }]}>{t('target_price')}</Text>
              </View>
              <Text style={[styles.targetValue, { color: targetMet ? theme.colors.success[500] : theme.colors.accent[500] }]}>
                €{formatPrice(item.target_price)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.alertBadge}>
            <Bell size={11} color={targetMet ? theme.colors.success[500] : theme.textTertiary} strokeWidth={2} />
            <Text style={[styles.alertText, { color: targetMet ? theme.colors.success[500] : theme.textTertiary }, targetMet && { fontWeight: '700' }]}>
              {targetMet ? 'Prezzo raggiunto!' : t('last_checked')}
            </Text>
          </View>
          {item.last_checked_at && (
            <Text style={[styles.lastCheckedText, { color: theme.textTertiary }]}>
              {new Date(item.last_checked_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t('favorites_title')}</Text>
        {favorites.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: theme.colors.accent[50] }]}>
            <Heart size={13} color={theme.colors.accent[500]} strokeWidth={2} fill={theme.colors.accent[500]} />
            <Text style={[styles.countText, { color: theme.colors.accent[600] }]}>{favorites.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
            <Heart size={36} color={theme.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('favorites_empty')}</Text>
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>{t('favorites_empty_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary[500]} colors={[theme.colors.primary[500]]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  pageTitle: { fontSize: 24, fontWeight: '700' },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  countText: { fontSize: 13, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  row: { gap: Spacing.md, marginBottom: Spacing.md },
  favCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    marginRight: Spacing.sm,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardQuery: { fontSize: 13, fontWeight: '600', flex: 1 },
  cardPriceSection: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  priceBlock: { flex: 1 },
  priceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  priceLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  priceValue: { fontSize: 18, fontWeight: '800' },
  targetBlock: { flex: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  targetValue: { fontSize: 18, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertText: { fontSize: 11, fontWeight: '500' },
  lastCheckedText: { fontSize: 10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptyHint: { fontSize: 15, textAlign: 'center' },
});
