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

  const { startNode, selectedProfile, setDestinationNode, calculateRoute } = useNavigationStore();

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
    return (
      <View style={styles.facilityCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityTitle}>{item.name}</Text>
            <Text style={styles.facilityType}>{item.type}</Text>
          </View>
          <View style={[styles.statusBadge, isBlocked ? styles.statusBlocked : styles.statusOpen]}>
            <Text style={styles.statusText}>{isBlocked ? 'BLOCKED' : 'OPEN'}</Text>
          </View>
        </View>

        <Text style={styles.descText}>{item.description}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.accessText}>
            {item.accessibility?.wheelchairAccessible ? '♿ Accessible' : 'Standard'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#10B981' }]}
              onPress={() => {
                const node = localRouter.nodeDict.get(`node_${item.id}`) || localRouter.nodeDict.get('node_t1_toilet');
                if (node) {
                  useNavigationStore.getState().setStartNode(node, 'FACILITY');
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: '#10B981' }]}>📍 Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#38BDF8' }]}
              onPress={() => {
                const node = localRouter.nodeDict.get(`node_${item.id}`) || localRouter.nodeDict.get('node_t1_toilet');
                if (node) {
                  useNavigationStore.getState().setDestinationNode(node, 'FACILITY');
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: '#38BDF8' }]}>🎯 Dest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => handleNavigate(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnText}>🧭 Go →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Facility</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedCategory === item.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedCategory === item.id && styles.filterTabTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Wheelchair Accessible Filter Checkbox */}
      <TouchableOpacity
        style={styles.wheelchairToggle}
        onPress={() => setWheelchairOnly(!wheelchairOnly)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, wheelchairOnly && styles.checkboxActive]}>
          {wheelchairOnly && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.wheelchairToggleText}>Show Wheelchair-Accessible Only (♿)</Text>
      </TouchableOpacity>

      {/* Facilities List */}
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
    backgroundColor: '#0B1120'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8
  },
  backBtnText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 14
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold'
  },
  filterRow: {
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155'
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8'
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  wheelchairToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#0B1120'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8'
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  wheelchairToggleText: {
    color: '#CBD5E1',
    fontSize: 13
  },
  listContent: {
    padding: 14,
    gap: 10
  },
  facilityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  facilityTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold'
  },
  facilityType: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  statusOpen: {
    backgroundColor: '#064E3B'
  },
  statusBlocked: {
    backgroundColor: '#7F1D1D'
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  descText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8
  },
  accessText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600'
  },
  navBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
