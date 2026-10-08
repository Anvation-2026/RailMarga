import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

export type TabKey = 'home' | 'facilities' | 'assistant' | 'qrScan';

interface BottomNavBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
  badge?: string;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Explore', icon: '🧭' },
  { key: 'facilities', label: 'Directory', icon: '🏢' },
  { key: 'assistant', label: 'Assistant', icon: '💬', badge: 'AI' },
  { key: 'qrScan', label: 'Scan QR', icon: '📷' }
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab }) => {
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
            >
              <View style={styles.iconWrapper}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                {tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgPrimary,
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
    paddingHorizontal: Spacing.sm
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    minWidth: 70
  },
  tabButtonActive: {
    backgroundColor: Colors.goldTintSolid
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.goldPrimary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.1
  },
  tabLabelActive: {
    color: Colors.goldDark,
    fontWeight: '700'
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.goldPrimary,
    marginTop: 2
  }
});
