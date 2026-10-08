import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

interface QuickActionBadgesProps {
  onSelectAction: (category: string) => void;
}

interface ActionCategory {
  id: string;
  label: string;
  sub: string;
  icon: string;
  tintBg: string;
  tintBorder: string;
}

const CATEGORIES: ActionCategory[] = [
  { id: 'LIFT', label: 'Lifts', sub: 'Step-Free', icon: '🛗', tintBg: '#FEF9C3', tintBorder: '#FDE047' },
  { id: 'TOILET', label: 'Restrooms', sub: 'All Levels', icon: '🚻', tintBg: '#E6F4EA', tintBorder: '#BBF7D0' },
  { id: 'ACCESSIBLE_TOILET', label: 'Divyangjan WC', sub: 'Accessible', icon: '♿', tintBg: '#FEF3C7', tintBorder: '#FDE68A' },
  { id: 'METRO', label: 'Metro FOB', sub: 'Terminal 3', icon: '🚇', tintBg: '#EEF2FF', tintBorder: '#C7D2FE' },
  { id: 'TICKET_COUNTER', label: 'Tickets', sub: 'UTS / PRS', icon: '🎫', tintBg: '#E0F2FE', tintBorder: '#BAE6FD' },
  { id: 'ENTRANCE', label: 'Main Gates', sub: 'T1 / T2 / T3', icon: '🚪', tintBg: '#F3F4F6', tintBorder: '#E5E7EB' }
];

export const QuickActionBadges: React.FC<QuickActionBadgesProps> = ({ onSelectAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>ESSENTIAL FACILITIES</Text>
        <Text style={styles.subtitle}>Instant navigation</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => onSelectAction(cat.id)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.tintBg, borderColor: cat.tintBorder }]}>
              <Text style={styles.icon}>{cat.icon}</Text>
            </View>
            <Text style={styles.label}>{cat.label}</Text>
            <Text style={styles.subText}>{cat.sub}</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 4
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500'
  },
  scrollList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: Spacing.sm,
    paddingVertical: 2
  },
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 84,
    ...Shadows.sm
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1
  },
  icon: {
    fontSize: 18
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  subText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center'
  }
});
