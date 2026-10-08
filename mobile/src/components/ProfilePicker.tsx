import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

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
    description: 'Prominent landmarks & main corridors',
    badge: 'Standard'
  },
  {
    id: 'elderly',
    name: 'Elderly Person',
    icon: '👴',
    description: 'Gentle slopes & minimal walking',
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
    description: 'Tactile paving & spoken guidance',
    badge: 'Tactile Audio'
  },
  {
    id: 'mobility_disabled',
    name: 'Mobility Disabled',
    icon: '♿',
    description: 'Strictly step-free with lifts & ramps',
    badge: '100% Step-Free'
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
        <Text style={styles.subtext}>Affects route calculation & voice prompts</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROFILES.map((p) => {
          const isSelected = p.id === selectedProfileId;
          const isWheelchair = p.id === 'mobility_disabled';

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.profileCard,
                isSelected && (isWheelchair ? styles.wheelchairCardSelected : styles.profileCardSelected)
              ]}
              onPress={() => onSelectProfile(p.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.profileIcon}>{p.icon}</Text>
                <View style={[
                  styles.badgePill,
                  isSelected && (isWheelchair ? styles.badgePillWheelchair : styles.badgePillSelected)
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isSelected && (isWheelchair ? styles.badgeTextWheelchair : styles.badgeTextSelected)
                  ]}>
                    {p.badge}
                  </Text>
                </View>
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

              {isSelected && (
                <View style={styles.activeIndicator}>
                  <View style={[styles.activeDot, isWheelchair && { backgroundColor: '#38BDF8' }]} />
                  <Text style={[styles.activeLabel, isWheelchair && { color: '#38BDF8' }]}>Active Profile</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2
  },
  subtext: {
    fontSize: 10,
    color: '#64748B'
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 10
  },
  profileCard: {
    width: 175,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'space-between'
  },
  profileCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  wheelchairCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    shadowColor: '#0284C7',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  profileIcon: {
    fontSize: 24
  },
  badgePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgePillSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)'
  },
  badgePillWheelchair: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)'
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },
  badgeTextSelected: {
    color: '#38BDF8'
  },
  badgeTextWheelchair: {
    color: '#7DD3FC'
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4
  },
  profileNameSelected: {
    color: '#FFFFFF'
  },
  profileDesc: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
    minHeight: 28
  },
  profileDescSelected: {
    color: '#CBD5E1'
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8'
  }
});
