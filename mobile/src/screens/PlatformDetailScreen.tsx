import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';

interface PlatformDetailScreenProps {
  platform: any;
  onBack: () => void;
  onStartNavigate: () => void;
  onAskAssistant: () => void;
}

export const PlatformDetailScreen: React.FC<PlatformDetailScreenProps> = ({
  platform,
  onBack,
  onStartNavigate,
  onAskAssistant
}) => {
  const { setDestinationNode, calculateRoute } = useNavigationStore();

  const handleNavigate = async () => {
    const destNode = localRouter.nodeDict.get(`node_pf${platform.number}_center`);
    if (destNode) {
      setDestinationNode(destNode);
      await calculateRoute();
      onStartNavigate();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform {platform.number}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Badge Card */}
        <View style={styles.heroCard}>
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeNumber}>{platform.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.platformTitle}>{platform.name}</Text>
            <Text style={styles.platformSub}>{platform.description}</Text>
          </View>
        </View>

        {/* Accessibility Status Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Accessibility Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wheelchair Accessible:</Text>
            <Text style={[styles.infoVal, { color: '#10B981' }]}>
              {platform.accessibility?.wheelchairAccessible ? '✓ Yes (Step-free)' : '✗ Limited'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tactile Paving:</Text>
            <Text style={styles.infoVal}>✓ Installed along platform edge</Text>
          </View>
          <Text style={styles.accessNotes}>{platform.accessibility?.notes}</Text>
        </View>

        {/* Nearby Facilities Matrix */}
        <Text style={styles.groupTitle}>Nearby Connected Facilities</Text>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🛗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Lift</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestLifts?.join(', ') || 'Connected via FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>♿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Ramp</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestRamps?.join(', ') || '1:12 Ramp to FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🚻</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest Restroom</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestToilets?.join(', ') || 'On-platform Restroom'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <Text style={styles.facilityIcon}>🌉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Footover Bridges</Text>
            <Text style={styles.facilityDetail}>
              FOB 1 (Mysuru End) & FOB 2 (Okkalpuram End - Lifts/Ramps)
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.navigateBtn, { flex: 1, backgroundColor: '#0F172A', borderWidth: 1.5, borderColor: '#10B981' }]}
              onPress={() => {
                const node = localRouter.nodeDict.get(`node_pf${platform.number}_center`);
                if (node) {
                  useNavigationStore.getState().setStartNode(node, 'PLATFORM');
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.navigateBtnText, { color: '#10B981' }]}>📍 Set as Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navigateBtn, { flex: 1, backgroundColor: '#0F172A', borderWidth: 1.5, borderColor: '#38BDF8' }]}
              onPress={() => {
                const node = localRouter.nodeDict.get(`node_pf${platform.number}_center`);
                if (node) {
                  useNavigationStore.getState().setDestinationNode(node, 'PLATFORM');
                  onBack();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.navigateBtnText, { color: '#38BDF8' }]}>🎯 Set as Destination</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleNavigate}
            activeOpacity={0.8}
          >
            <Text style={styles.navigateBtnText}>🧭 Navigate to Platform {platform.number}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.askBtn}
            onPress={onAskAssistant}
            activeOpacity={0.8}
          >
            <Text style={styles.askBtnText}>🤖 Ask RailMarga Assistant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 16
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
  badgeNumber: {
    color: '#000000',
    fontSize: 26,
    fontWeight: '900'
  },
  platformTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  platformSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sectionHeader: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13
  },
  infoVal: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600'
  },
  accessNotes: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  groupTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  facilityIcon: {
    fontSize: 22
  },
  facilityName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold'
  },
  facilityDetail: {
    color: '#94A3B8',
    fontSize: 11
  },
  btnRow: {
    marginTop: 16,
    gap: 10,
    marginBottom: 30
  },
  navigateBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  askBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569'
  },
  askBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600'
  }
});
