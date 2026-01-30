// ===========================================
// Profile Screen
// ===========================================

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { Button } from '../../src/components/ui/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      onPress: () => {},
    },
    {
      icon: 'wallet-outline',
      label: 'Buy Credits',
      onPress: () => router.push('/credits'),
      badge: `${user?.credits || 0} credits`,
    },
    {
      icon: 'receipt-outline',
      label: 'Transaction History',
      onPress: () => router.push('/transactions'),
    },
    {
      icon: 'calendar-outline',
      label: 'Calendar Integration',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => router.push('/notifications'),
    },
    {
      icon: 'language-outline',
      label: 'Language',
      value: 'English',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Privacy',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Credits Card */}
        <TouchableOpacity style={styles.creditsCard} onPress={() => router.push('/transactions')}>
          <View style={styles.creditsInfo}>
            <Text style={styles.creditsLabel}>Available Credits</Text>
            <Text style={styles.creditsAmount}>{user?.credits || 0}</Text>
          </View>
          <Button
            title="Top Up"
            onPress={() => router.push('/credits')}
            size="small"
            variant="secondary"
            style={styles.topUpButton}
          />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color="#4B5563"
                  />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                {item.value && (
                  <Text style={styles.menuValue}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Silentbox v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F46E5',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  creditsInfo: {},
  creditsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  topUpButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  menuValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
});
