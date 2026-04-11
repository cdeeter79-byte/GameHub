import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { colors, spacing, radii, typography } from '@gamehub/config';
import type { Sport } from '@gamehub/domain';

const SPORT_LABELS: Record<Sport, string> = {
  SOCCER: '⚽ Soccer',
  BASKETBALL: '🏀 Basketball',
  BASEBALL: '⚾ Baseball',
  SOFTBALL: '🥎 Softball',
  LACROSSE: '🥍 Lacrosse',
  HOCKEY: '🏒 Hockey',
  FOOTBALL: '🏈 Football',
  VOLLEYBALL: '🏐 Volleyball',
  TENNIS: '🎾 Tennis',
  SWIMMING: '🏊 Swimming',
  OTHER: '🏅 Other',
};

interface SportFilterBarProps {
  sports: Sport[];
  selectedSports: Sport[];
  onToggle: (sport: Sport | 'all') => void;
}

export function SportFilterBar({ sports, selectedSports, onToggle }: SportFilterBarProps) {
  const allSelected = selectedSports.length === 0 || selectedSports.length === sports.length;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="toolbar"
      accessibilityLabel="Filter by sport"
    >
      {/* All chip */}
      <TouchableOpacity
        style={[styles.chip, allSelected && styles.chipSelected]}
        onPress={() => onToggle('all')}
        accessibilityRole="button"
        accessibilityLabel="All sports"
        accessibilityState={{ selected: allSelected }}
      >
        <Text style={[styles.chipText, allSelected && styles.chipTextSelected]}>
          🏅 All
        </Text>
      </TouchableOpacity>

      {sports.map((sport) => {
        const isSelected = selectedSports.includes(sport);
        return (
          <TouchableOpacity
            key={sport}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(sport)}
            accessibilityRole="button"
            accessibilityLabel={SPORT_LABELS[sport]}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {SPORT_LABELS[sport]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    backgroundColor: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[500],
  },
  chipText: {
    color: colors.neutral[300],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});
