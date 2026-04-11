import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, radii, typography } from '@gamehub/config';
import type { Location } from '@gamehub/domain';

interface MapDirectionsButtonProps {
  location: Location;
  label?: string;
  size?: 'sm' | 'md';
}

function buildGoogleMapsUrl(location: Location): string {
  const query = location.lat && location.lng
    ? `${location.lat},${location.lng}`
    : encodeURIComponent(`${location.address}, ${location.city}, ${location.state}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function buildAppleMapsUrl(location: Location): string {
  const query = location.lat && location.lng
    ? `${location.lat},${location.lng}`
    : encodeURIComponent(`${location.address}, ${location.city}, ${location.state}`);
  return `maps://?daddr=${query}`;
}

async function openUrl(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function MapDirectionsButton({ location, label, size = 'md' }: MapDirectionsButtonProps) {
  const addressLine = `${location.address}, ${location.city}, ${location.state}`;

  async function handlePress() {
    if (Platform.OS === 'web') {
      await openUrl(buildGoogleMapsUrl(location));
      return;
    }

    if (Platform.OS === 'ios') {
      Alert.alert(
        'Open in Maps',
        'Choose your preferred maps app',
        [
          {
            text: 'Apple Maps',
            onPress: async () => {
              const opened = await openUrl(buildAppleMapsUrl(location));
              if (!opened) await openUrl(buildGoogleMapsUrl(location));
            },
          },
          {
            text: 'Google Maps',
            onPress: async () => {
              const opened = await openUrl(`comgooglemaps://?daddr=${encodeURIComponent(addressLine)}`);
              if (!opened) await openUrl(buildGoogleMapsUrl(location));
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      const opened = await openUrl(`geo:0,0?q=${encodeURIComponent(addressLine)}`);
      if (!opened) await openUrl(buildGoogleMapsUrl(location));
    }
  }

  const isSmall = size === 'sm';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isSmall && styles.buttonSmall]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Get directions to ${location.name || addressLine}`}
        accessibilityHint="Opens your maps app with directions to this location"
      >
        <Text style={[styles.icon, isSmall && styles.iconSmall]}>📍</Text>
        <Text style={[styles.label, isSmall && styles.labelSmall]}>
          {label ?? 'Get Directions'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.address} numberOfLines={1}>{addressLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  buttonSmall: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  icon: {
    fontSize: 16,
  },
  iconSmall: {
    fontSize: 13,
  },
  label: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  labelSmall: {
    fontSize: typography.fontSize.xs,
  },
  address: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
});
