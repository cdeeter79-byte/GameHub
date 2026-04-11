import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '@gamehub/config';
import type { ChildProfile } from '@gamehub/domain';
import { Avatar } from '../Avatar';

export interface ChildSelectorProps {
  children: ChildProfile[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  allowAll?: boolean;
}

const ALL_ID = '__all__';

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  children,
  selectedIds,
  onToggle,
  allowAll = false,
}) => {
  const allSelected = allowAll && selectedIds.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="toolbar"
      accessibilityLabel="Child filter"
    >
      {allowAll && (
        <TouchableOpacity
          onPress={() => onToggle(ALL_ID)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="All children"
          accessibilityHint="Show events for all children"
          accessibilityState={{ selected: allSelected }}
          style={[styles.chip, allSelected && styles.chipSelected]}
        >
          <View
            style={[
              styles.allAvatar,
              allSelected && styles.allAvatarSelected,
            ]}
          >
            <Text style={styles.allAvatarText}>All</Text>
          </View>
          <Text
            style={[
              styles.chipLabel,
              allSelected && styles.chipLabelSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      )}

      {children.map((child) => {
        const isSelected = selectedIds.includes(child.id);
        const fullName = `${child.firstName} ${child.lastName}`;

        return (
          <TouchableOpacity
            key={child.id}
            onPress={() => onToggle(child.id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={fullName}
            accessibilityHint={isSelected ? 'Tap to deselect' : 'Tap to select'}
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Avatar
              uri={child.avatarUrl}
              name={fullName}
              size="xs"
              sport={child.sport}
            />
            <Text
              style={[
                styles.chipLabel,
                isSelected && styles.chipLabelSelected,
              ]}
              numberOfLines={1}
            >
              {child.firstName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.surface,
  },
  chipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[950],
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.dark.textSecondary,
    maxWidth: 72,
  },
  chipLabelSelected: {
    color: colors.primary[300],
    fontWeight: typography.fontWeight.semibold as '600',
  },
  allAvatar: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.navy[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  allAvatarSelected: {
    backgroundColor: colors.primary[700],
  },
  allAvatarText: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as '700',
  },
});

export default ChildSelector;
