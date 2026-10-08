import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { StationNode, localRouter } from '../services/localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';

interface LocationSearchModalProps {
  visible: boolean;
  mode: 'source' | 'destination';
  onClose: () => void;
  onSelectNode: (node: StationNode) => void;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  visible,
  mode,
  onClose,
  onSelectNode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PLATFORMS' | 'FACILITIES' | 'ENTRANCES'>('ALL');

  // Search items list
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // Collect all candidates
    let candidates: { node: StationNode; category: 'PLATFORMS' | 'FACILITIES' | 'ENTRANCES'; badgeText: string; icon: string }[] = [];

    // 1. Platforms
    for (const p of platformsData) {
      const node = localRouter.nodeDict.get(`node_pf${p.number}_center`) || localRouter.nodeDict.get(`node_pf${p.number}_west`);
      if (node) {
        candidates.push({
          node: { ...node, name: `Platform ${p.number}` },
          category: 'PLATFORMS',
          badgeText: `PF ${p.number} • Level 0`,
          icon: '🚉'
        });
      }
    }

    // 2. Facilities
    for (const f of facilitiesData) {
      const node = localRouter.nodeDict.get(`node_${f.id}`) ||
        (f.type === 'LIFT' ? localRouter.nodeDict.get('node_pf8_lift1') :
        (f.type === 'TOILET' ? localRouter.nodeDict.get('node_t1_toilet') : null));
      if (node) {
        let icon = '🏢';
        if (f.type === 'LIFT') icon = '🛗';
        else if (f.type === 'RAMP') icon = '↗️';
        else if (f.type === 'TOILET') icon = '🚻';
        else if (f.type === 'ACCESSIBLE_TOILET') icon = '♿';
        else if (f.type === 'METRO_LINK') icon = '🚇';
        else if (f.type === 'TICKET_COUNTER') icon = '🎫';

        candidates.push({
          node: { ...node, name: f.name },
          category: 'FACILITIES',
          badgeText: `${f.level === -1 ? 'Subway' : (f.level === 1 ? 'FOB Level' : 'Concourse')} • ${f.accessibility?.wheelchairAccessible ? '♿ Accessible' : 'Standard'}`,
          icon
        });
      }
    }

    // 3. Entrances & Terminals
    const entranceNodes = [
      { id: 'node_entry_t1_main_east', name: 'Main Entrance (Terminal 1 - Gubbi Thotadappa Rd)', icon: '🚪' },
      { id: 'node_entry_t2_north', name: 'Terminal 2 Entrance (Okkalpuram Side)', icon: '🚪' },
      { id: 'node_entry_t3_metro', name: 'Terminal 3 / Metro Link Concourse', icon: '🚇' },
      { id: 'node_subway_entry_east', name: 'Majestic Passenger Subway Entrance', icon: '🚇' },
      { id: 'node_t1_fob1_stair', name: 'FOB 1 (Mysuru End) Footbridge Access', icon: '🌉' },
      { id: 'node_fob2_mid', name: 'FOB 2 (Okkalpuram End) Accessible Bridge', icon: '🌉' }
    ];

    for (const ent of entranceNodes) {
      const node = localRouter.nodeDict.get(ent.id);
      if (node) {
        candidates.push({
          node: { ...node, name: ent.name },
          category: 'ENTRANCES',
          badgeText: `${node.level === -1 ? 'Subway Level' : (node.level === 1 ? 'FOB Level' : 'Ground Level')}`,
          icon: ent.icon
        });
      }
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      candidates = candidates.filter((c) => c.category === selectedCategory);
    }

    // Filter by query
    if (q) {
      const pfNumMatch = q.match(/(?:platform|plat|pf)\s*(\d{1,2})/i) || q.match(/^(\d{1,2})$/);
      if (pfNumMatch) {
        const num = parseInt(pfNumMatch[1], 10);
        return candidates.filter((c) => c.node.name.toLowerCase().includes(`platform ${num}`));
      }

      return candidates.filter((c) =>
        c.node.name.toLowerCase().includes(q) ||
        c.badgeText.toLowerCase().includes(q) ||
        (c.node.visualLandmark || '').toLowerCase().includes(q)
      );
    }

    return candidates;
  }, [searchQuery, selectedCategory]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'source' ? 'SELECT STARTING LOCATION' : 'SELECT DESTINATION'}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'source' ? "Search starting point (e.g. Platform 1, Main Entrance)" : "Search destination (e.g. Platform 8, Lift 1, WC)"}
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Bar */}
        <View style={styles.categoriesRow}>
          {(['ALL', 'PLATFORMS', 'FACILITIES', 'ENTRANCES'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && styles.categoryTabSelected
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === cat && styles.categoryTabTextSelected
              ]}>
                {cat === 'ALL' ? 'All' : (cat === 'PLATFORMS' ? 'Platforms 1-10' : (cat === 'FACILITIES' ? 'Lifts & WC' : 'Gates'))}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List of Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.node.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => {
                onSelectNode(item.node);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.node.name}</Text>
                <Text style={styles.itemBadge}>{item.badgeText}</Text>
              </View>
              <Text style={styles.selectArrow}>→</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyText}>No verified station location matches "{searchQuery}"</Text>
              <Text style={styles.emptySub}>Try searching: Platform 8, Lift 1, Ramp, Restroom, or Main Entrance</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold'
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14
  },
  clearBtn: {
    padding: 6
  },
  clearBtnText: {
    color: '#64748B',
    fontSize: 14
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8
  },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155'
  },
  categoryTabSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8'
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  categoryTabTextSelected: {
    color: '#FFFFFF'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131D31',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemIcon: {
    fontSize: 18
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  itemBadge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  selectArrow: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12
  },
  emptyText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center'
  }
});
