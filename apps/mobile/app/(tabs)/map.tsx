// ===========================================
// Map Screen
// ===========================================

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locationsApi, boothsApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';

const { width, height } = Dimensions.get('window');

interface LocationData {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images?: string[];
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    loadLocations();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    }
  };

  const loadLocations = async () => {
    const res = await locationsApi.getAll();
    if (res.success && res.data) {
      setLocations(res.data);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const initialRegion = userLocation
    ? {
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 52.2297, // Warsaw default
        longitude: 21.0122,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedLocation(null)}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            onPress={() => setSelectedLocation(location)}
          >
            <View
              style={[
                styles.marker,
                selectedLocation?.id === location.id && styles.markerSelected,
              ]}
            >
              <Ionicons
                name="location"
                size={24}
                color={selectedLocation?.id === location.id ? '#fff' : '#4F46E5'}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search Bar Overlay */}
      <SafeAreaView style={styles.searchOverlay} edges={['top']}>
        <TouchableOpacity style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search locations...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#4F46E5" />
      </TouchableOpacity>

      {/* Selected Location Card */}
      {selectedLocation && (
        <View style={styles.locationCard}>
          <TouchableOpacity
            style={styles.locationCardContent}
            onPress={() => router.push(`/booth/${selectedLocation.id}`)}
          >
            <Image
              source={{
                uri: selectedLocation.images?.[0] || 'https://placehold.co/200x200',
              }}
              style={styles.locationImage}
              contentFit="cover"
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{selectedLocation.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedLocation.address}, {selectedLocation.city}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <Button
            title="View Booths"
            onPress={() => router.push(`/booth/${selectedLocation.id}`)}
            fullWidth
            style={styles.viewButton}
          />
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollFilterChip label="Available Now" active />
        <ScrollFilterChip label="Nearby" />
        <ScrollFilterChip label="Top Rated" />
      </View>
    </View>
  );
}

function ScrollFilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  markerSelected: {
    backgroundColor: '#4F46E5',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    top: 140,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  locationCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  viewButton: {
    marginTop: 4,
  },
});
