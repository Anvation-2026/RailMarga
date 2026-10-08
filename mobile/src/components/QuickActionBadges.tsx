import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface QuickActionBadgesProps {
  onSelectAction: (category: string) => void;
}

export const QuickActionBadges: React.FC<QuickActionBadgesProps> = ({ onSelectAction }) => {
  const actions = [
    { id: 'LIFT', label: 'Lift', icon: '🛗', color: '#0284C7' },
    { id: 'TOILET', label: 'Restroom', icon: '🚻', color: '#10B981' },
    { id: 'ACCESSIBLE_TOILET', label: 'Accessible WC', icon: '♿', color: '#6366F1' },
    { id: 'TICKET_COUNTER', label: 'Ticket', icon: '🎫', color: '#F59E0B' },
    { id: 'METRO', label: 'Metro', icon: '🚇', color: '#8B5CF6' },
    { id: 'ENTRANCE', label: 'Exit / Gate', icon: '🚪', color: '#64748B' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Facilities</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.badge}
            onPress={() => onSelectAction(act.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: act.color }]}>
              <Text style={styles.iconText}>{act.icon}</Text>
            </View>
            <Text style={styles.badgeLabel}>{act.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12
  },
  title: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  scrollList: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12
  },
  badge: {
    alignItems: 'center',
    width: 72
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4
  },
  iconText: {
    fontSize: 22
  },
  badgeLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  }
});
