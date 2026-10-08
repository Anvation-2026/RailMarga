import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

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
      case 'SEARCH': return '🔎 Search';
      case 'PLATFORM': return '🚉 Platform';
      case 'FACILITY': return '🏢 Facility';
      case 'GPS': return '📡 GPS';
      default: return null;
    }
  };

  return (
    <View style={styles.card}>
      {/* Visual Timeline and Inputs Container */}
      <View style={styles.inputsRow}>
        {/* Left Timeline Indicator (Uber/Ola Style) */}
        <View style={styles.timelineCol}>
          <View style={styles.startDotOuter}>
            <View style={styles.startDotInner} />
          </View>
          <View style={styles.dottedConnector} />
          <View style={styles.destDotOuter}>
            <View style={styles.destDotInner} />
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.fieldsCol}>
          {/* FROM / START FIELD */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>START / PICKUP</Text>
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
                    {startNode.level === -1 ? 'Subway • Level -1' : (startNode.level === 1 ? 'FOB • Level 1' : 'Concourse • Level 0')}
                    {startNode.wheelchairAccessible ? ' • ♿ Step-Free' : ''}
                  </Text>
                </View>
                {onClearSource && (
                  <TouchableOpacity
                    onPress={onClearSource}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
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
                  <Text style={styles.placeholderText}>Choose starting point or gate</Text>
                </TouchableOpacity>
                <View style={styles.quickSourceActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={onSelectSourceOnMap} activeOpacity={0.75}>
                    <Text style={styles.actionChipText}>📍 Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionChip} onPress={onOpenQrScan} activeOpacity={0.75}>
                    <Text style={styles.actionChipText}>📷 QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Divider with Floating Circular Swap Button */}
          <View style={styles.dividerRow}>
            <View style={styles.hairlineDivider} />
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={onSwap}
              activeOpacity={0.75}
              disabled={!startNode && !destinationNode}
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* TO / DESTINATION FIELD */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>DESTINATION</Text>
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
                    {destinationNode.level === -1 ? 'Subway • Level -1' : (destinationNode.level === 1 ? 'FOB • Level 1' : 'Platform Level • Level 0')}
                    {destinationNode.wheelchairAccessible ? ' • ♿ Step-Free' : ''}
                  </Text>
                </View>
                {onClearDestination && (
                  <TouchableOpacity
                    onPress={onClearDestination}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
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
                  <Text style={styles.placeholderText}>Where to? (e.g. Platform 8, Restroom)</Text>
                </TouchableOpacity>
                <View style={styles.quickSourceActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={onSelectDestinationOnMap} activeOpacity={0.75}>
                    <Text style={styles.actionChipText}>🎯 Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.lg,
    padding: Spacing.sm + 2,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    ...Shadows.card
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: Spacing.xs
  },
  startDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.success
  },
  startDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success
  },
  dottedConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    borderRadius: 1
  },
  destDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.goldTintSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.goldPrimary
  },
  destDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.goldDark
  },
  fieldsCol: {
    flex: 1
  },
  fieldWrapper: {
    paddingVertical: 2
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6
  },
  methodBadge: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.goldDark
  },
  selectedLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  locationSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500'
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  emptyPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: Radii.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  emptyPromptBtn: {
    flex: 1,
    paddingVertical: 4
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500'
  },
  quickSourceActions: {
    flexDirection: 'row',
    gap: 4
  },
  actionChip: {
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
    height: 20
  },
  hairlineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9'
  },
  swapBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    ...Shadows.sm
  },
  swapIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.goldDark
  }
});
