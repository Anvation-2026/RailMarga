import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { SourceMethod, DestinationMethod } from '../store/navigationStore';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  SearchIcon,
  QrIcon,
  SwapIcon,
  CloseIcon,
  MapPinIcon,
  CheckIcon
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
  // 1. Initial State: Single Large Search Bar (Quick-Commerce "Where to?" first)
  if (!destinationNode) {
    return (
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          style={styles.bigSearchBar}
          onPress={onOpenDestinationSearch}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Search destination at KSR Bengaluru"
        >
          <SearchIcon size={20} color="#1A1A1A" strokeWidth={2} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Where to? Platform 8, Lift 2, Waiting Room…
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.qrScanBtn}
          onPress={onOpenQrScan}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Scan QR Checkpoint"
        >
          <QrIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Destination Picked: Show Destination + Starting Gate (Auto-filled)
  return (
    <View style={styles.expandedCard}>
      {/* Destination Selected Banner */}
      <View style={styles.fieldRow}>
        <View style={styles.dotIndicatorDestination} />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>Destination</Text>
          <TouchableOpacity
            onPress={onOpenDestinationSearch}
            activeOpacity={0.8}
            style={styles.locationTitleTouchable}
          >
            <Text style={styles.destinationTitle} numberOfLines={1}>
              {destinationNode.name}
            </Text>
            <Text style={styles.locationSub}>
              {destinationNode.level === -1
                ? 'Subway · Level -1'
                : destinationNode.level === 1
                ? 'FOB · Level 1'
                : 'Concourse · Level 0'}
            </Text>
          </TouchableOpacity>
        </View>

        {onClearDestination && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClearDestination}
            activeOpacity={0.7}
            accessibilityLabel="Clear destination"
          >
            <CloseIcon size={16} color="#666660" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={onSwap}
          activeOpacity={0.8}
          accessibilityLabel="Swap start and destination"
        >
          <SwapIcon size={16} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Starting Location (From) */}
      <View style={styles.fieldRow}>
        <View style={styles.dotIndicatorStart} />
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>From (Starting Point)</Text>
          <TouchableOpacity
            onPress={onOpenSourceSearch}
            activeOpacity={0.8}
            style={styles.locationTitleTouchable}
          >
            <Text style={styles.locationTitle} numberOfLines={1}>
              {startNode ? startNode.name : 'Terminal 1 Main East Entrance (Default)'}
            </Text>
            <Text style={styles.locationSub}>
              {startNode?.wheelchairAccessible ? 'Step-Free Verified' : 'Nearest station entrance gate'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onOpenQrScan}
          activeOpacity={0.7}
          accessibilityLabel="Anchor position via QR"
        >
          <QrIcon size={16} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginVertical: 4
  },
  bigSearchBar: {
    flex: 1,
    height: 48,
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.input, // 8px
    borderWidth: 1,
    borderColor: Colors.borderInput,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
    flex: 1
  },
  qrScanBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.input, // 8px
    borderWidth: 1,
    borderColor: Colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center'
  },
  expandedCard: {
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
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2
  },
  locationTitleTouchable: {
    paddingVertical: 2
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  locationSub: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  dotIndicatorDestination: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary // Hero Golden Yellow
  },
  dotIndicatorStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A1A1A'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
