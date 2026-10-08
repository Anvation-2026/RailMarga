import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../theme/tokens';
import {
  WalkIcon,
  WheelchairIcon,
  SeniorIcon,
  FamilyIcon
} from './Icons';

export interface ProfileMeta {
  id: string;
  name: string;
  shortLabel: string;
  iconType: 'walk' | 'wheelchair' | 'senior' | 'fatigue';
}

export const PROFILES: ProfileMeta[] = [
  { id: 'first_time', name: 'Standard Walk', shortLabel: 'Walk', iconType: 'walk' },
  { id: 'mobility_disabled', name: 'Step-Free / ♿', shortLabel: 'Step-free', iconType: 'wheelchair' },
  { id: 'elderly', name: 'Senior Citizen', shortLabel: 'Senior', iconType: 'senior' },
  { id: 'child', name: 'Low Fatigue / Luggage', shortLabel: 'Low fatigue', iconType: 'fatigue' }
];

interface ProfilePickerProps {
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
  selectedProfileId,
  onSelectProfile
}) => {
  const renderIcon = (type: string, isSelected: boolean) => {
    const iconColor = isSelected ? '#1A1A1A' : '#666660';
    switch (type) {
      case 'walk': return <WalkIcon size={16} color={iconColor} strokeWidth={2} />;
      case 'wheelchair': return <WheelchairIcon size={16} color={iconColor} strokeWidth={2} />;
      case 'senior': return <SeniorIcon size={16} color={iconColor} strokeWidth={2} />;
      case 'fatigue': return <FamilyIcon size={16} color={iconColor} strokeWidth={2} />;
      default: return <WalkIcon size={16} color={iconColor} strokeWidth={2} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Walking mode</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {PROFILES.map((p) => {
          const isSelected = p.id === selectedProfileId;
          const isWheelchair = p.id === 'mobility_disabled';

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
                isWheelchair && !isSelected && styles.pillWheelchairBorder
              ]}
              onPress={() => onSelectProfile(p.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Select ${p.name} mode`}
            >
              {renderIcon(p.iconType, isSelected)}
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected
                ]}
              >
                {p.shortLabel}
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
    marginVertical: Spacing.xs
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 2
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44, // Minimum 44px tap target for accessibility
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1
  },
  pillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border
  },
  pillSelected: {
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderColor: Colors.primary,
    transform: [{ scale: 1 }]
  },
  pillWheelchairBorder: {
    borderColor: '#D5D5CE'
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600'
  },
  pillTextUnselected: {
    color: Colors.textPrimary
  },
  pillTextSelected: {
    color: '#1A1A1A',
    fontWeight: '700'
  }
});
