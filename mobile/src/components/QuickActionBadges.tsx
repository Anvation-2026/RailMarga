import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  RestroomIcon,
  ElevatorIcon,
  WaitingRoomIcon,
  FoodIcon,
  AtmIcon,
  TicketIcon,
  CloakRoomIcon,
  HelpDeskIcon
} from './Icons';

interface QuickActionBadgesProps {
  onSelectAction: (category: string) => void;
}

interface AmenityTile {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
}

const AMENITY_TILES: AmenityTile[] = [
  {
    id: 'TOILET',
    label: 'Restroom',
    icon: (color) => <RestroomIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'LIFT',
    label: 'Lift',
    icon: (color) => <ElevatorIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'WAITING_HALL',
    label: 'Waiting room',
    icon: (color) => <WaitingRoomIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'FOOD',
    label: 'Food',
    icon: (color) => <FoodIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'ATM',
    label: 'ATM',
    icon: (color) => <AtmIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'TICKET_COUNTER',
    label: 'Ticket counter',
    icon: (color) => <TicketIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'CLOAK_ROOM',
    label: 'Cloak room',
    icon: (color) => <CloakRoomIcon size={22} color={color} strokeWidth={1.75} />
  },
  {
    id: 'HELP_DESK',
    label: 'Help desk',
    icon: (color) => <HelpDeskIcon size={22} color={color} strokeWidth={1.75} />
  }
];

export const QuickActionBadges: React.FC<QuickActionBadgesProps> = ({ onSelectAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Station amenities</Text>
        <Text style={styles.sectionSub}>1-tap directions</Text>
      </View>

      {/* 4-Column Category Grid (Blinkit style) */}
      <View style={styles.grid}>
        {AMENITY_TILES.map((tile) => (
          <TouchableOpacity
            key={tile.id}
            style={styles.tile}
            onPress={() => onSelectAction(tile.id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${tile.label}`}
          >
            <View style={styles.iconCircle}>
              {tile.icon('#1A1A1A')}
            </View>
            <Text style={styles.tileLabel} numberOfLines={1}>
              {tile.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  tile: {
    width: '23%', // 4 columns
    minWidth: 72,
    aspectRatio: 0.95,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center'
  }
});
