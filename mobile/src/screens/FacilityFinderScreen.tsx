import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { localRouter } from '../services/localRouter';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  ArrowRightIcon,
  CheckIcon,
  AlertIcon,
  WheelchairIcon
} from '../components/Icons';

interface FacilityFinderScreenProps {
  onBack: () => void;
  onNavigateToFacility: () => void;
}

export const FacilityFinderScreen: React.FC<FacilityFinderScreenProps> = ({
  onBack,
  onNavigateToFacility
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [wheelchairOnly, setWheelchairOnly] = useState<boolean>(false);
  const [facilities, setFacilities] = useState<any[]>([]);

  const { setDestinationNode, calculateRoute } = useNavigationStore();

  useEffect(() => {
    loadFacilities();
  }, [selectedCategory, wheelchairOnly]);

  const loadFacilities = async () => {
    const cat = selectedCategory === 'ALL' ? undefined : selectedCategory;
    const list = await apiService.getFacilities(cat, wheelchairOnly);
    setFacilities(list);
  };

  const handleNavigate = async (facility: any) => {
    const destNode = localRouter.nodeDict.get(`node_${facility.id}`) || localRouter.nodeDict.get('node_t1_toilet')!;
    setDestinationNode(destNode);
    await calculateRoute();
    onNavigateToFacility();
  };

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'TOILET', label: 'Restrooms' },
    { id: 'LIFT', label: 'Lifts' },
    { id: 'RAMP', label: 'Ramps' },
    { id: 'TICKET_COUNTER', label: 'Tickets' },
    { id: 'METRO', label: 'Metro' }
  ];

  const renderFacility = ({ item }: { item: any }) => {
    const isBlocked = item.status === 'BLOCKED';
    const isWheelchair = item.accessibility?.wheelchairAccessible;

    return (
      <View style={styles.facilityCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityTitle}>{item.name}</Text>
            <Text style={styles.facilityType}>{item.type.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.statusBadge, isBlocked ? styles.statusBadgeBlocked : styles.statusBadgeOpen]}>
            <View style={[styles.statusDot, { backgroundColor: isBlocked ? '#DC2626' : '#16A34A' }]} />
            <Text style={[styles.statusText, isBlocked ? styles.statusTextBlocked : styles.statusTextOpen]}>
              {isBlocked ? 'Blocked' : 'Open'}
            </Text>
          </View>
        </View>

        <Text style={styles.descText}>{item.description}</Text>

        <View style={styles.footerRow}>
          <View style={styles.accessBadgeRow}>
            {isWheelchair && (
              <View style={styles.accessPill}>
                <WheelchairIcon size={12} color="#1A1A1A" strokeWidth={2} />
                <Text style={styles.accessPillText}>Step-free</Text>
              </View>
            )}
            <Text style={styles.floorText}>
              Floor: {item.level === -1 ? 'Subway' : item.level === 1 ? 'FOB' : 'Level 0'}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.auxBtn}
              onPress={() => {
                const node = localRouter.nodeDict.get(`node_${item.id}`) || localRouter.nodeDict.get('node_t1_toilet');
                if (node) {
                  useNavigationStore.getState().setStartNode(node, 'FACILITY');
                  onBack();
                }
              }}
              activeOpacity={0.8}
              accessibilityLabel={`Set ${item.name} as starting point`}
            >
              <Text style={styles.auxBtnText}>Set start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => handleNavigate(item)}
              activeOpacity={0.85}
              accessibilityLabel={`Navigate to ${item.name}`}
            >
              <Text style={styles.navBtnText}>Navigate</Text>
              <ArrowRightIcon size={14} color="#1A1A1A" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Station directory</Text>
        <TouchableOpacity
          style={[styles.wheelchairToggle, wheelchairOnly && styles.wheelchairToggleActive]}
          onPress={() => setWheelchairOnly(!wheelchairOnly)}
          activeOpacity={0.8}
        >
          <WheelchairIcon size={14} color={wheelchairOnly ? '#1A1A1A' : '#666660'} strokeWidth={2} />
          <Text style={[styles.wheelchairToggleText, wheelchairOnly && styles.wheelchairToggleTextActive]}>
            Step-free
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Category Chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Amenities List */}
      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={renderFacility}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  wheelchairToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  wheelchairToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  wheelchairToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  wheelchairToggleTextActive: {
    color: '#1A1A1A',
    fontWeight: '700'
  },
  filterRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8
  },
  categoryChip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  categoryChipTextActive: {
    color: '#1A1A1A',
    fontWeight: '800'
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  facilityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  facilityType: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1
  },
  statusBadgeOpen: {
    backgroundColor: Colors.successLight,
    borderColor: '#BBF7D0'
  },
  statusBadgeBlocked: {
    backgroundColor: Colors.errorLight,
    borderColor: '#FECACA'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  statusTextOpen: {
    color: Colors.success
  },
  statusTextBlocked: {
    color: Colors.error
  },
  descText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginVertical: 8,
    lineHeight: 18
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F2'
  },
  accessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border
  },
  accessPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  floorText: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  auxBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border
  },
  auxBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary // Hero Golden Yellow
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A'
  }
});
