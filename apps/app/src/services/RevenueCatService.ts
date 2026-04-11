/**
 * RevenueCat integration scaffold.
 *
 * Install: npx expo install react-native-purchases
 *
 * This service wraps RevenueCat's React Native SDK. In development,
 * EXPO_PUBLIC_REVENUECAT_IOS_KEY must be set.
 *
 * Full SDK docs: https://www.revenuecat.com/docs/getting-started/installation/expo
 */

import { Platform } from 'react-native';

// Dynamic import to avoid crashing if SDK not installed during initial scaffold
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // SDK not installed yet — service will return mock data
}

const IOS_KEY = process.env['EXPO_PUBLIC_REVENUECAT_IOS_KEY'] ?? '';
const ANDROID_KEY = process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'] ?? '';

export const ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

export const OFFERINGS = {
  DEFAULT: 'default',
} as const;

export async function initRevenueCat(userId: string): Promise<void> {
  if (!Purchases) return;
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) return;

  await Purchases.configure({ apiKey });
  await Purchases.logIn(userId);
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENTS.PREMIUM];
  } catch {
    return false;
  }
}

export async function getOfferings() {
  if (!Purchases) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePremium(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current?.monthly) return false;
    const { customerInfo } = await Purchases.purchasePackage(current.monthly);
    return !!customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active[ENTITLEMENTS.PREMIUM];
  } catch {
    return false;
  }
}
