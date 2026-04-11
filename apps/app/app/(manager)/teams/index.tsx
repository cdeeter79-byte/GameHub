import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { Button, EmptyState, PremiumGate } from '@gamehub/ui';
import { useEntitlements } from '../../../src/hooks/useEntitlements';

export default function ManagerTeamsScreen() {
  const { isManager } = useEntitlements();

  return (
    <View style={styles.container}>
      <PremiumGate
        isLocked={!isManager}
        feature="Team Manager mode"
        onUpgrade={() => router.push('/(manager)/billing')}
      >
        <FlatList
          data={[]}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={() => null}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title="No teams yet"
              description="Create your first team to start managing schedules, rosters, and messaging."
              action={{ label: 'Create a Team', onPress: () => router.push('/(manager)/teams/new') }}
            />
          }
        />
        <View style={styles.fab}>
          <Button label="+ New Team" onPress={() => router.push('/(manager)/teams/new')} variant="primary" />
        </View>
      </PremiumGate>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  list: { padding: spacing[4] },
  fab: { position: 'absolute', bottom: spacing[6], right: spacing[4] },
});
