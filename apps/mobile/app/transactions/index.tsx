// ===========================================
// Transaction History Screen
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { paymentsApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

interface Transaction {
  id: string;
  type: 'purchase' | 'booking' | 'refund' | 'bonus';
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  created_at: string;
  metadata?: {
    package_name?: string;
    booth_name?: string;
    booking_id?: string;
  };
}

const STATUS_CONFIG = {
  pending: {
    color: colors.warning.main,
    bgColor: colors.warning.light,
    icon: 'time-outline' as const,
    label: 'Pending',
  },
  completed: {
    color: colors.success.main,
    bgColor: colors.success.light,
    icon: 'checkmark-circle-outline' as const,
    label: 'Completed',
  },
  failed: {
    color: colors.error.main,
    bgColor: colors.error.light,
    icon: 'close-circle-outline' as const,
    label: 'Failed',
  },
  refunded: {
    color: colors.info.main,
    bgColor: colors.info.light,
    icon: 'arrow-undo-outline' as const,
    label: 'Refunded',
  },
};

const TYPE_CONFIG = {
  purchase: {
    color: colors.success.main,
    icon: 'add-circle-outline' as const,
    prefix: '+',
    label: 'Credit Purchase',
  },
  booking: {
    color: colors.error.main,
    icon: 'remove-circle-outline' as const,
    prefix: '-',
    label: 'Booking Payment',
  },
  refund: {
    color: colors.info.main,
    icon: 'arrow-undo-outline' as const,
    prefix: '+',
    label: 'Refund',
  },
  bonus: {
    color: colors.accent[400],
    icon: 'gift-outline' as const,
    prefix: '+',
    label: 'Bonus Credits',
  },
};

export default function TransactionsScreen() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadTransactions = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (pageNum === 1) {
      refresh ? setRefreshing(true) : setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await paymentsApi.getTransactions(pageNum);
      if (res.success && res.data) {
        if (pageNum === 1) {
          setTransactions(res.data);
        } else {
          setTransactions(prev => [...prev, ...res.data!]);
        }
        setHasMore(res.data.length >= 20);
        setPage(pageNum);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = () => {
    loadTransactions(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadTransactions(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCredits = (type: Transaction['type'], credits: number) => {
    const config = TYPE_CONFIG[type];
    return `${config.prefix}${credits}`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const typeConfig = TYPE_CONFIG[item.type];
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        activeOpacity={0.7}
        onPress={() => {
          if (item.metadata?.booking_id) {
            router.push(`/booking/${item.metadata.booking_id}`);
          }
        }}
      >
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <View style={styles.cardContent}>
            {/* Left - Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${typeConfig.color}20` }]}>
              <Ionicons name={typeConfig.icon} size={24} color={typeConfig.color} />
            </View>

            {/* Middle - Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.transactionType}>{typeConfig.label}</Text>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description || item.metadata?.package_name || item.metadata?.booth_name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right - Amount */}
            <View style={styles.amountContainer}>
              <Text style={[styles.creditsAmount, { color: typeConfig.color }]}>
                {formatCredits(item.type, item.credits)}
              </Text>
              <Text style={styles.creditsLabel}>credits</Text>
              {item.amount > 0 && (
                <Text style={styles.fiatAmount}>
                  {item.amount.toFixed(2)} PLN
                </Text>
              )}
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Balance Card */}
      <LinearGradient
        colors={colors.gradients.neonPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{user?.credits || 0}</Text>
        <Text style={styles.balanceUnit}>credits</Text>

        <TouchableOpacity
          style={styles.buyMoreButton}
          onPress={() => router.push('/credits')}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.buyMoreGradient}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.buyMoreText}>Buy More</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Text style={styles.sectionSubtitle}>{transactions.length} transactions</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={48} color={colors.gray[400]} />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptySubtitle}>
        Your credit purchases and booking payments will appear here
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/credits')}
      >
        <LinearGradient
          colors={colors.gradients.neonPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Buy Credits</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={colors.gradients.aurora} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.aurora} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.title}>Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.white,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 44,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  balanceCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
  balanceUnit: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  buyMoreButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  buyMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buyMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  transactionCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  cardBlur: {
    backgroundColor: colors.glass.dark,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  transactionType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  transactionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  creditsAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  creditsLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  fiatAmount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
