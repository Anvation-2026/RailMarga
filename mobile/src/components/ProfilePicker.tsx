import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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
    name: 'First-Time Traveller',
    icon: '🧭',
    description: 'Simple and clear routes with landmarks',
    badge: 'Standard'
  },
  {
    id: 'elderly',
    name: 'Elderly Person',
    icon: '👴',
    description: 'Gentle slopes, avoids stairs & lifts',
    badge: 'Low Fatigue'
  },
  {
    id: 'child',
    name: 'Child / Kid',
    icon: '👦',
    description: 'Direct paths & safety rail corridors',
    badge: 'Safe Way'
  },
  {
    id: 'visually_impaired',
    name: 'Visually Impaired',
    icon: '👁️',
    description: 'Tactile paving & spoken audio guide',
    badge: 'Tactile Audio'
  },
  {
    id: 'mobility_disabled',
    name: 'Mobility Disabled',
    icon: '♿',
    description: '100% step-free accessible routes',
    badge: 'Step-Free'
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
        <Text style={styles.title}>ACCESSIBILITY PROFILE</Text>
        <Text style={styles.subtext}>Prioritizes matching paths</Text>
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
                styles.profileCard,
                isSelected ? styles.profileCardSelected : styles.profileCardUnselected
              ]}
              onPress={() => onSelectProfile(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.profileIcon}>{p.icon}</Text>
                {isSelected ? (
                  <View style={styles.selectedPill}>
                    <Text style={styles.selectedPillText}>✓ Selected</Text>
                  </View>
                ) : (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.profileName,
                  isSelected && styles.profileNameSelected
                ]}
              >
                {p.name}
              </Text>

              <Text
                style={[
                  styles.profileDesc,
                  isSelected && styles.profileDescSelected
                ]}
                numberOfLines={2}
              >
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
    marginVertical: Spacing.xs + 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8
  },
  subtext: {
    fontSize: 11,
    color: Colors.textTertiary
  },
  scrollContent: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs + 2
  },
  profileCard: {
    width: 168,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    justifyContent: 'space-between',
    minHeight: 120
  },
  profileCardUnselected: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  profileCardSelected: {
    backgroundColor: Colors.goldTintSolid,
    borderWidth: 1.5,
    borderColor: Colors.goldPrimary,
    ...Shadows.card
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs
  },
  profileIcon: {
    fontSize: 22
  },
  badgePill: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  selectedPill: {
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.goldPrimary
  },
  selectedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.goldDark
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3
  },
  profileNameSelected: {
    color: Colors.charcoalPrimary,
    fontWeight: '700'
  },
  profileDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15
  },
  profileDescSelected: {
    color: Colors.charcoalPrimary
  }
});
