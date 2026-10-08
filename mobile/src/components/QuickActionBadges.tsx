import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface QuickActionBadgesProps {
  onSelectAction: (category: string) => void;
}

export const QuickActionBadges: React.FC<QuickActionBadgesProps> = ({ onSelectAction }) => {
  const actions = [
    { id: 'LIFT', label: 'Lift', icon: '🛗' },
    { id: 'TOILET', label: 'Restroom', icon: '🚻' },
    { id: 'ACCESSIBLE_TOILET', label: 'Accessible WC', icon: '♿' },
    { id: 'TICKET_COUNTER', label: 'Ticket', icon: '🎫' },
    { id: 'METRO', label: 'Metro', icon: '🚇' },
    { id: 'ENTRANCE', label: 'Exit / Gate', icon: '🚪' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QUICK FACILITIES</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.tile}
            onPress={() => onSelectAction(act.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>{act.icon}</Text>
            </View>
            <Text style={styles.tileLabel}>{act.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs
  },
  scrollList: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    paddingRight: Spacing.sm
  },
  tile: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
    ...Shadows.sm
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  iconText: {
    fontSize: 18
  },
  tileLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
