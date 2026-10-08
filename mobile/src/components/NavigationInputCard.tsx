import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface NavigationInputCardProps {
  startNode: StationNode | null;
  destinationNode: StationNode | null;
  sourceMethod: SourceMethod;
  destinationMethod: DestinationMethod;
  onOpenSourceSearch: () => void;
  onOpenDestinationSearch: () => void;
  onSelectSourceOnMap: () => void;
  onSelectDestinationOnMap: () => void;
  onOpenQrScan: () => void;
  onSwap: () => void;
  onClearSource?: () => void;
  onClearDestination?: () => void;
}

export const NavigationInputCard: React.FC<NavigationInputCardProps> = ({
  startNode,
  destinationNode,
  sourceMethod,
  destinationMethod,
  onOpenSourceSearch,
  onOpenDestinationSearch,
  onSelectSourceOnMap,
  onSelectDestinationOnMap,
  onOpenQrScan,
  onSwap,
  onClearSource,
  onClearDestination
}) => {
  const getMethodBadge = (method: SourceMethod | DestinationMethod) => {
    switch (method) {
      case 'MAP': return '🗺️ Map Tap';
      case 'QR': return '📷 QR Verified';
      case 'SEARCH': return '🔎 Searched';
      case 'PLATFORM': return '🚉 Platform';
      case 'FACILITY': return '🏢 Facility';
      case 'GPS': return '📡 GPS Approx';
      default: return null;
    }
  };

  return (
    <View style={styles.card}>
      {/* FROM (SOURCE) ROW */}
      <View style={styles.row}>
        <View style={styles.iconCol}>
          <View style={[styles.circleIcon, styles.startIcon]}>
            <Text style={styles.circleText}>📍</Text>
          </View>
          <View style={styles.verticalDottedLine} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>FROM</Text>
            {startNode && sourceMethod && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{getMethodBadge(sourceMethod)}</Text>
              </View>
            )}
          </View>

          {startNode ? (
            <TouchableOpacity
              style={styles.selectedLocationBox}
              onPress={onOpenSourceSearch}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle} numberOfLines={1}>{startNode.name}</Text>
                <Text style={styles.locationSub}>
                  {startNode.level === -1 ? 'Subway Level • -1' : (startNode.level === 1 ? 'Footover Bridge • Level 1' : 'Platform Level • Level 0')}
                  {startNode.wheelchairAccessible ? ' • ♿ Accessible' : ''}
                </Text>
              </View>
              {onClearSource && (
                <TouchableOpacity onPress={onClearSource} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyPromptRow}>
              <TouchableOpacity
                style={styles.emptyPromptBtn}
                onPress={onOpenSourceSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.placeholderText}>Select starting point</Text>
              </TouchableOpacity>
              <View style={styles.quickSourceActions}>
                <TouchableOpacity style={styles.actionChip} onPress={onSelectSourceOnMap}>
                  <Text style={styles.actionChipText}>📍 Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionChip} onPress={onOpenQrScan}>
                  <Text style={styles.actionChipText}>📷 QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* SWAP BUTTON DIVIDER */}
      <View style={styles.swapRow}>
        <View style={styles.swapDividerLine} />
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={onSwap}
          activeOpacity={0.75}
          disabled={!startNode && !destinationNode}
        >
          <Text style={styles.swapIcon}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* TO (DESTINATION) ROW */}
      <View style={styles.row}>
        <View style={styles.iconCol}>
          <View style={[styles.circleIcon, styles.destIcon]}>
            <Text style={styles.circleText}>🎯</Text>
          </View>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>TO</Text>
            {destinationNode && destinationMethod && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{getMethodBadge(destinationMethod)}</Text>
              </View>
            )}
          </View>

          {destinationNode ? (
            <TouchableOpacity
              style={styles.selectedLocationBox}
              onPress={onOpenDestinationSearch}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle} numberOfLines={1}>{destinationNode.name}</Text>
                <Text style={styles.locationSub}>
                  {destinationNode.level === -1 ? 'Subway Level • -1' : (destinationNode.level === 1 ? 'Footover Bridge • Level 1' : 'Platform Level • Level 0')}
                  {destinationNode.wheelchairAccessible ? ' • ♿ Accessible' : ''}
                </Text>
              </View>
              {onClearDestination && (
                <TouchableOpacity onPress={onClearDestination} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyPromptRow}>
              <TouchableOpacity
                style={styles.emptyPromptBtn}
                onPress={onOpenDestinationSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.placeholderText}>Select destination</Text>
              </TouchableOpacity>
              <View style={styles.quickSourceActions}>
                <TouchableOpacity style={styles.actionChip} onPress={onSelectDestinationOnMap}>
                  <Text style={styles.actionChipText}>🎯 Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.xs + 2,
    paddingTop: 3
  },
  circleIcon: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  startIcon: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.borderStrong
  },
  destIcon: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary
  },
  circleText: {
    fontSize: 13
  },
  verticalDottedLine: {
    width: 2,
    height: 30,
    backgroundColor: Colors.borderLight,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1
  },
  contentCol: {
    flex: 1
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8
  },
  methodBadge: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  selectedLocationBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  locationSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  clearBtn: {
    padding: 6,
    marginLeft: Spacing.xs
  },
  clearBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '700'
  },
  emptyPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  emptyPromptBtn: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400'
  },
  quickSourceActions: {
    flexDirection: 'row',
    gap: 6
  },
  actionChip: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 40
  },
  swapDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
    ...Shadows.sm
  },
  swapIcon: {
    color: Colors.goldDark,
    fontSize: 15,
    fontWeight: '700',
    marginTop: -1
  }
});
