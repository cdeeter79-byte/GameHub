import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { Avatar, Button, EmptyState } from '@gamehub/ui';
import { useChildren } from '../../../src/hooks/useChildren';
import type { ChildProfile } from '@gamehub/domain';

export default function ChildrenScreen() {
  const { children, isLoading } = useChildren();

  function renderChild({ item }: { item: ChildProfile }) {
    return (
      <TouchableOpacity
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${item.firstName} ${item.lastName}, ${item.sport ?? 'no sport set'}`}
        onPress={() => router.push({ pathname: '/(parent)/children/[id]', params: { id: item.id } })}
      >
        <Avatar name={`${item.firstName} ${item.lastName}`} size="md" sport={item.sport} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.detail}>
            {item.sport ?? 'No sport set'} · {item.ageBand === 'UNDER_13' ? 'Under 13' : item.ageBand === 'TEEN_13_17' ? '13–17' : '18+'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderChild}
        contentContainerStyle={children.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="👶"
            title="No children added yet"
            description="Add your kids to start tracking their sports schedules."
            action={{ label: 'Add a Child', onPress: () => router.push('/(parent)/children/new') }}
          />
        }
      />
      {children.length > 0 ? (
        <View style={styles.addButton}>
          <Button
            label="Add a Child"
            onPress={() => router.push('/(parent)/children/new')}
            variant="primary"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  list: { padding: spacing[4], gap: spacing[3] },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  info: { flex: 1 },
  name: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  detail: { color: colors.neutral[400], fontSize: typography.fontSize.sm, marginTop: 2 },
  chevron: { color: colors.neutral[500], fontSize: 22 },
  addButton: { padding: spacing[4] },
});
