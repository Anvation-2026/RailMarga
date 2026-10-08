import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import {
  CompassIcon,
  TrainIcon,
  SparkleIcon,
  QrIcon
} from './Icons';

export type TabKey = 'home' | 'facilities' | 'assistant' | 'qrScan';

interface BottomNavBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

interface TabItem {
  key: TabKey;
  label: string;
  iconType: 'home' | 'directory' | 'assistant' | 'qr';
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Home', iconType: 'home' },
  { key: 'facilities', label: 'Directory', iconType: 'directory' },
  { key: 'assistant', label: 'Assistant', iconType: 'assistant' },
  { key: 'qrScan', label: 'Scan QR', iconType: 'qr' }
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab }) => {
  const renderIcon = (type: string, isActive: boolean) => {
    const color = isActive ? '#1A1A1A' : '#73736C';
    const strokeWidth = isActive ? 2.2 : 1.75;
    switch (type) {
      case 'home': return <CompassIcon size={20} color={color} strokeWidth={strokeWidth} />;
      case 'directory': return <TrainIcon size={20} color={color} strokeWidth={strokeWidth} />;
      case 'assistant': return <SparkleIcon size={20} color={color} strokeWidth={strokeWidth} />;
      case 'qr': return <QrIcon size={20} color={color} strokeWidth={strokeWidth} />;
      default: return <CompassIcon size={20} color={color} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconWrapper}>
                {renderIcon(tab.iconType, isActive)}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    ...Shadows.floating
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.sm
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    minWidth: 72,
    minHeight: 44 // Min 44px tap target
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryTintSolid // Subtle warm yellow wash
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#73736C'
  },
  tabLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700'
  }
});
