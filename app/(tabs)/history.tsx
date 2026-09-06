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
  History,
  Search,
  Link as LinkIcon,
  Camera,
  Trash2,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { TranslationMap } from '@/constants/translations';
import { supabase } from '@/lib/supabase';
import { SearchRecord, SearchType } from '@/types/database';

function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'ora';
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g fa`;
  const months = Math.floor(days / 30);
  return `${months}m fa`;
}

function getSearchIcon(type: SearchType) {
  if (type === 'url') return LinkIcon;
  if (type === 'image') return Camera;
  return Search;
}

export default function HistoryScreen() {
  const { t } = useI18n() as { t: (key: keyof TranslationMap) => string };
  const { theme } = useTheme();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('searches')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) setRecords(data as SearchRecord[]);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleRefresh = useCallback(() => { setRefreshing(true); loadHistory(); }, [loadHistory]);

  const handleClearAll = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('searches').delete().eq('user_id', session.user.id);
      setRecords([]);
    } catch {}
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await supabase.from('searches').delete().eq('id', id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch {}
  }, []);

  const renderItem = ({ item }: { item: SearchRecord }) => {
    const Icon = getSearchIcon(item.search_type);
    return (
      <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.typeIcon, { backgroundColor: theme.colors.primary[50] }]}>
            <Icon size={18} color={theme.colors.primary[500]} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardQuery, { color: theme.textPrimary }]} numberOfLines={2}>{item.query}</Text>
          <View style={styles.cardMetaRow}>
            <Clock size={11} color={theme.textTertiary} strokeWidth={2} />
            <Text style={[styles.cardDate, { color: theme.textTertiary }]}>{formatRelativeDate(item.created_at)}</Text>
            {item.best_price !== null && (
              <View style={styles.cardPriceRow}>
                <TrendingDown size={11} color={theme.colors.success[500]} strokeWidth={2.5} />
                <Text style={[styles.cardBestPrice, { color: theme.colors.success[500] }]}>€{formatPrice(item.best_price)}</Text>
                {item.average_price !== null && (
                  <>
                    <View style={[styles.priceDivider, { backgroundColor: theme.border }]} />
                    <TrendingUp size={11} color={theme.textTertiary} strokeWidth={2} />
                    <Text style={[styles.cardAvgPrice, { color: theme.textSecondary }]}>€{formatPrice(item.average_price)}</Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} activeOpacity={0.6}>
          <Trash2 size={16} color={theme.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t('history_title')}</Text>
          {records.length > 0 && (
            <Text style={[styles.pageCount, { color: theme.textSecondary }]}>{records.length} ricerche</Text>
          )}
        </View>
        {records.length > 0 && (
          <TouchableOpacity style={[styles.clearBtn, { backgroundColor: theme.colors.error[50] }]} onPress={handleClearAll} activeOpacity={0.7}>
            <Trash2 size={16} color={theme.colors.error[500]} strokeWidth={2} />
            <Text style={[styles.clearBtnText, { color: theme.colors.error[500] }]}>{t('clear_history')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
            <History size={36} color={theme.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('history_empty')}</Text>
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>{t('history_empty_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
  pageCount: { fontSize: 13, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  clearBtnText: { fontSize: 12, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cardLeft: { marginRight: Spacing.md },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardQuery: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 11 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: Spacing.sm },
  cardBestPrice: { fontSize: 12, fontWeight: '700' },
  priceDivider: { width: 1, height: 10, marginHorizontal: 4 },
  cardAvgPrice: { fontSize: 12 },
  deleteBtn: { padding: Spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptyHint: { fontSize: 15, textAlign: 'center' },
});
