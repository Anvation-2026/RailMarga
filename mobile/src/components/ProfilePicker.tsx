import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

export interface ProfileMeta {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge: string;
}

export const PROFILES: ProfileMeta[] = [
  {
    id: 'first_time',
    name: 'Standard Walk',
    icon: '🧭',
    description: 'Direct concourse corridors with landmarks',
    badge: 'Standard'
  },
  {
    id: 'mobility_disabled',
    name: 'Step-Free / ♿',
    icon: '♿',
    description: '100% elevators, lifts & gentle ramps only',
    badge: 'Step-Free'
  },
  {
    id: 'elderly',
    name: 'Senior Citizen',
    icon: '👴',
    description: 'Gentle slopes, avoids stairs & long detours',
    badge: 'Low Fatigue'
  },
  {
    id: 'child',
    name: 'Family / Child',
    icon: '👦',
    description: 'Wide walking lanes & safety rail corridors',
    badge: 'Safe Way'
  },
  {
    id: 'visually_impaired',
    name: 'Audio / Tactile',
    icon: '👁️',
    description: 'Tactile paving corridors & voice alerts',
    badge: 'Tactile'
  }
];

interface ProfilePickerProps {
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
  selectedProfileId,
  onSelectProfile
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>TRAVEL & ACCESSIBILITY MODE</Text>
        <Text style={styles.subtext}>Tailored routing</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROFILES.map((p) => {
          const isSelected = p.id === selectedProfileId;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected
              ]}
              onPress={() => onSelectProfile(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Text style={styles.icon}>{p.icon}</Text>
                </View>
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {isSelected ? '✓ ACTIVE' : p.badge}
                  </Text>
                </View>
              </View>

              <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {p.description}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  subtext: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500'
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: Spacing.sm,
    paddingVertical: 2
  },
  card: {
    width: 160,
    borderRadius: Radii.md,
    padding: 12,
    ...Shadows.sm
  },
  cardUnselected: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  cardSelected: {
    backgroundColor: Colors.goldTintSolid,
    borderWidth: 2,
    borderColor: Colors.goldPrimary
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  iconBoxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.goldPrimary
  },
  icon: {
    fontSize: 16
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  badgeSelected: {
    backgroundColor: Colors.goldPrimary,
    borderColor: Colors.goldPrimary
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  badgeTextSelected: {
    color: '#FFFFFF'
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4
  },
  nameSelected: {
    color: Colors.goldDark
  },
  description: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14
  }
});
