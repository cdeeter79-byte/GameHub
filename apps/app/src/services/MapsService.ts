import { Linking, Platform, Alert } from 'react-native';
import type { Location } from '@gamehub/domain';

function encodeAddress(location: Location): string {
  return encodeURIComponent(`${location.address}, ${location.city}, ${location.state}`);
}

function googleMapsUrl(location: Location): string {
  const query = location.lat && location.lng
    ? `${location.lat},${location.lng}`
    : encodeAddress(location);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function appleMapsUrl(location: Location): string {
  const query = location.lat && location.lng
    ? `${location.lat},${location.lng}`
    : encodeAddress(location);
  return `maps://?daddr=${query}`;
}

async function tryOpen(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) { await Linking.openURL(url); return true; }
    return false;
  } catch { return false; }
}

export async function openDirections(location: Location): Promise<void> {
  if (Platform.OS === 'web') {
    await tryOpen(googleMapsUrl(location));
    return;
  }

  if (Platform.OS === 'ios') {
    Alert.alert('Get Directions', 'Choose your maps app', [
      {
        text: 'Apple Maps',
        onPress: async () => {
          const ok = await tryOpen(appleMapsUrl(location));
          if (!ok) await tryOpen(googleMapsUrl(location));
        },
      },
      {
        text: 'Google Maps',
        onPress: async () => {
          const gmapsApp = `comgooglemaps://?daddr=${encodeAddress(location)}`;
          const ok = await tryOpen(gmapsApp);
          if (!ok) await tryOpen(googleMapsUrl(location));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  // Android: try geo URI, fall back to Google Maps web
  const ok = await tryOpen(`geo:0,0?q=${encodeAddress(location)}`);
  if (!ok) await tryOpen(googleMapsUrl(location));
}
