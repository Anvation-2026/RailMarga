import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import {
  SearchIcon,
  QrIcon,
  SwapIcon,
  CloseIcon,
  MapPinIcon
} from './Icons';

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
  return (
    <View style={styles.cardContainer}>
      {/* 1. SOURCE SECTION: FROM (STARTING POINT) */}
      <View style={styles.fieldRow}>
        <View style={styles.dotIndicatorStart} />

        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>FROM (STARTING POINT / SOURCE)</Text>
          <TouchableOpacity
            onPress={onOpenSourceSearch}
            activeOpacity={0.8}
            style={styles.locationTitleTouchable}
            accessibilityRole="button"
            accessibilityLabel="Select starting point or origin"
          >
            <Text
              style={[
                styles.locationTitle,
                !startNode && styles.locationTitleDefault
              ]}
              numberOfLines={1}
            >
              {startNode ? startNode.name : 'Terminal 1 Main Entrance (East) · Default'}
            </Text>
            <Text style={styles.locationSub} numberOfLines={1}>
              {startNode
                ? (startNode.wheelchairAccessible ? 'Step-Free Verified' : 'Station Checkpoint')
                : 'Tap to change starting gate, platform, or search concourse'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={onSelectSourceOnMap}
            activeOpacity={0.75}
            accessibilityLabel="Pick start on map"
          >
            <MapPinIcon size={16} color="#1A1A1A" strokeWidth={1.75} />
          </TouchableOpacity>

          {startNode && onClearSource && (
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={onClearSource}
              activeOpacity={0.7}
              accessibilityLabel="Reset to default entrance"
            >
              <CloseIcon size={14} color="#666660" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. TRANSIT DIVIDER WITH SWAP BUTTON */}
      <View style={styles.dividerRow}>
        <View style={styles.connectorLine} />
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={onSwap}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Swap start and destination"
        >
          <SwapIcon size={15} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.dividerRight} />
      </View>

      {/* 3. DESTINATION SECTION: TO (DESTINATION) */}
      <View style={styles.fieldRow}>
        <View style={styles.dotIndicatorDestination} />

        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>TO (DESTINATION)</Text>
          <TouchableOpacity
            onPress={onOpenDestinationSearch}
            activeOpacity={0.8}
            style={styles.locationTitleTouchable}
            accessibilityRole="button"
            accessibilityLabel="Search destination"
          >
            <Text
              style={[
                styles.destinationTitle,
                !destinationNode && styles.destinationPlaceholder
              ]}
              numberOfLines={1}
            >
              {destinationNode ? destinationNode.name : 'Where to? Platform, Lift, Restroom…'}
            </Text>
            <Text style={styles.locationSub} numberOfLines={1}>
              {destinationNode
                ? (destinationNode.level === -1
                    ? 'Subway · Level -1'
                    : destinationNode.level === 1
                    ? 'FOB Bridge · Level 1'
                    : 'Concourse · Level 0')
                : 'Tap to search or select a platform chip (PF 1–10) below'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={onOpenQrScan}
            activeOpacity={0.75}
            accessibilityLabel="Scan QR Checkpoint"
          >
            <QrIcon size={16} color="#1A1A1A" strokeWidth={1.75} />
          </TouchableOpacity>

          {destinationNode && onClearDestination && (
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={onClearDestination}
              activeOpacity={0.7}
              accessibilityLabel="Clear destination"
            >
              <CloseIcon size={14} color="#666660" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginVertical: 4
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  fieldContent: {
    flex: 1
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#73736C',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  locationTitleTouchable: {
    paddingVertical: 2
  },
  locationTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  locationTitleDefault: {
    color: '#1A1A1A'
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  destinationPlaceholder: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary
  },
  locationSub: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1
  },
  dotIndicatorStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A', // Emerald green for start / source
    borderWidth: 2,
    borderColor: '#D1FAE5'
  },
  dotIndicatorDestination: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5B800', // Gold for hero destination
    borderWidth: 2,
    borderColor: '#FEF3C7'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 4
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    borderRadius: 1
  },
  dividerRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 8
  },
  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    ...Shadows.card
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
