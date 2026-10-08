import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';

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
            <Text style={styles.label}>FROM (STARTING POINT)</Text>
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
                <Text style={styles.placeholderText}>Where are you starting?</Text>
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
            <Text style={styles.label}>TO (DESTINATION)</Text>
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
                <Text style={styles.placeholderText}>Where do you want to go?</Text>
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
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
    paddingTop: 4
  },
  circleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  startIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981'
  },
  destIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444'
  },
  circleText: {
    fontSize: 13
  },
  verticalDottedLine: {
    width: 2,
    height: 28,
    backgroundColor: '#475569',
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
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.9
  },
  methodBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#38BDF8'
  },
  selectedLocationBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155'
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  locationSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  emptyPromptBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed'
  },
  placeholderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  quickSourceActions: {
    flexDirection: 'row',
    gap: 6
  },
  actionChip: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8'
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 42
  },
  swapDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155'
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 8
  },
  swapIcon: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2
  }
});
