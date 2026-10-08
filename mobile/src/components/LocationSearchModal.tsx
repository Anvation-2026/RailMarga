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
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'source' ? "Search starting point (e.g. Platform 1, Main Entrance)" : "Search destination (e.g. Platform 8, Lift 1, WC)"}
            placeholderTextColor={Colors.textTertiary}
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
                {cat === 'ALL' ? 'All' : (cat === 'PLATFORMS' ? 'Platforms' : (cat === 'FACILITIES' ? 'Lifts & WC' : 'Gates'))}
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
    backgroundColor: Colors.bgPrimary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  closeBtn: {
    padding: Spacing.xs
  },
  closeBtnText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: 14
  },
  clearBtn: {
    padding: 6
  },
  clearBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '700'
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm
  },
  categoryTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  categoryTabSelected: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  categoryTabTextSelected: {
    color: Colors.goldDark,
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  itemIcon: {
    fontSize: 18
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  itemBadge: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  selectArrow: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center'
  }
});
