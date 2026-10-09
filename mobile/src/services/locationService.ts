import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface GeoLocationReading {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private webWatchId: number | null = null;
  private isWatching: boolean = false;

  /**
   * Request real device location permission cross-platform (Expo Native + Web).
   */
  public async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        if (!navigator || !navigator.geolocation) {
          return 'unavailable';
        }
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            (err) => {
              if (err.code === err.PERMISSION_DENIED) resolve('denied');
              else resolve('unavailable');
            },
            { timeout: 8000 }
          );
        });
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      return 'denied';
    } catch (err) {
      console.warn('[LocationService] Permission request failed:', err);
      return 'unavailable';
    }
  }

  /**
   * Get current one-time position reading.
   */
  public async getCurrentPosition(): Promise<GeoLocationReading | null> {
    try {
      if (Platform.OS === 'web') {
        if (!navigator || !navigator.geolocation) return null;
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy ?? null,
                heading: pos.coords.heading ?? null,
                speed: pos.coords.speed ?? null,
                timestamp: pos.timestamp
              });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
        });
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? null,
        heading: loc.coords.heading ?? null,
        speed: loc.coords.speed ?? null,
        timestamp: loc.timestamp
      };
    } catch (err) {
      console.warn('[LocationService] getCurrentPosition error:', err);
      return null;
    }
  }

  /**
   * Start watching live location updates.
   * Uses reasonable update intervals (3s / 5m) to balance responsiveness and battery.
   */
  public async startWatching(
    onLocation: (reading: GeoLocationReading) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    if (this.isWatching) {
      return true;
    }

    try {
      if (Platform.OS === 'web') {
        if (!navigator || !navigator.geolocation) {
          onError?.(new Error('Geolocation not available in browser'));
          return false;
        }

        this.webWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            onLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
              timestamp: pos.timestamp
            });
          },
          (err) => onError?.(err),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
        this.isWatching = true;
        return true;
      }

      const hasPerm = await Location.getForegroundPermissionsAsync();
      if (hasPerm.status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') {
          onError?.(new Error('Location permission denied'));
          return false;
        }
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2500, // 2.5 seconds
          distanceInterval: 3 // 3 meters
        },
        (loc) => {
          onLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? null,
            heading: loc.coords.heading ?? null,
            speed: loc.coords.speed ?? null,
            timestamp: loc.timestamp
          });
        }
      );

      this.isWatching = true;
      return true;
    } catch (err) {
      console.warn('[LocationService] startWatching error:', err);
      onError?.(err);
      return false;
    }
  }

  /**
   * Stop watching live location to conserve battery and resources.
   */
  public stopWatching(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    if (this.webWatchId !== null && Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.webWatchId);
      this.webWatchId = null;
    }
    this.isWatching = false;
  }
}

export const locationService = new LocationService();
