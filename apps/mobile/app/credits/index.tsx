// ===========================================
// Credits Purchase Screen
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/auth';
import { api } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  bonus_credits: number;
  is_popular: boolean;
}

export default function CreditsScreen() {
  const { user, refreshUser } = useAuthStore();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    const res = await api.get<CreditPackage[]>('/payments/packages');
    if (res.success && res.data) {
      setPackages(res.data);
    }
    setLoading(false);
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(pkg.id);

    try {
      const res = await api.post<{ redirectUrl: string }>('/payments/purchase', {
        packageId: pkg.id,
      });

      if (res.success && res.data?.redirectUrl) {
        // Open payment page in browser
        const result = await WebBrowser.openBrowserAsync(res.data.redirectUrl);

        if (result.type === 'cancel') {
          Alert.alert('Payment Cancelled', 'The payment was cancelled.');
        } else {
          // Refresh user data to get updated credits
          await refreshUser();
          Alert.alert(
            'Payment Processing',
            'Your payment is being processed. Credits will be added shortly.'
          );
        }
      } else {
        Alert.alert('Error', typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to initiate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Credits</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Balance Card */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{user?.credits || 0}</Text>
          <Text style={styles.balanceUnit}>credits</Text>
        </LinearGradient>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            1 credit = 1 PLN. Use credits to book booths at any location.
          </Text>
        </View>

        {/* Packages */}
        <Text style={styles.sectionTitle}>Choose a Package</Text>

        <View style={styles.packagesGrid}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, pkg.is_popular && styles.popularPackage]}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing !== null}
            >
              {pkg.is_popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <Text style={styles.packageName}>{pkg.name}</Text>

              <View style={styles.creditsRow}>
                <Text style={styles.creditsAmount}>{pkg.credits}</Text>
                {pkg.bonus_credits > 0 && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>+{pkg.bonus_credits}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.creditsLabel}>credits</Text>

              <View style={styles.priceDivider} />

              <Text style={styles.packagePrice}>
                {pkg.price} {pkg.currency}
              </Text>

              {purchasing === pkg.id ? (
                <ActivityIndicator size="small" color="#4F46E5" style={styles.purchaseLoader} />
              ) : (
                <View style={[styles.buyButton, pkg.is_popular && styles.popularBuyButton]}>
                  <Text style={[styles.buyButtonText, pkg.is_popular && styles.popularBuyText]}>
                    Buy Now
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentMethodsTitle}>Accepted Payment Methods</Text>
          <View style={styles.paymentIcons}>
            <View style={styles.paymentIcon}>
              <Text style={styles.paymentIconText}>P24</Text>
            </View>
            <View style={styles.paymentIcon}>
              <Text style={styles.paymentIconText}>BLIK</Text>
            </View>
            <View style={styles.paymentIcon}>
              <Ionicons name="card-outline" size={20} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By purchasing credits, you agree to our Terms of Service and Refund Policy.
          Credits are non-refundable and expire after 12 months of inactivity.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  balanceUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularPackage: {
    borderColor: '#4F46E5',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 12,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  bonusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  priceDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  purchaseLoader: {
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  popularBuyButton: {
    backgroundColor: '#4F46E5',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  popularBuyText: {
    color: '#fff',
  },
  paymentMethods: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentIcon: {
    width: 48,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
