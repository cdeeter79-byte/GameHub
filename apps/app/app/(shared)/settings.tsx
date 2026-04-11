import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@gamehub/config';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.placeholder}>Settings screen — notification preferences, theme, data management.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { padding: spacing[5] },
  title: { color: colors.white, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] },
  placeholder: { color: colors.neutral[400], fontSize: typography.fontSize.sm },
});
