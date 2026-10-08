import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import checkpointsData from '../data/simulation/checkpoints.json';
import { localRouter } from '../services/localRouter';
import { voiceService } from '../services/voiceService';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  QrIcon,
  CheckIcon,
  MapPinIcon
} from '../components/Icons';

interface QrScanScreenProps {
  onBack: () => void;
  onLocationUpdated: () => void;
}

export const QrScanScreen: React.FC<QrScanScreenProps> = ({
  onBack,
  onLocationUpdated
}) => {
  const { setStartNode, calculateRoute, isNavigating, voiceEnabled } = useNavigationStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectCheckpoint = async (cp: any) => {
    setSelectedId(cp.id);
    const node = localRouter.nodeDict.get(cp.nodeId);
    if (node) {
      setStartNode(node, 'QR');
      if (voiceEnabled) {
        voiceService.speak(`Indoor location updated to ${cp.name}.`);
      }
      if (isNavigating) {
        await calculateRoute();
      }
      Alert.alert(
        "Checkpoint Verified",
        `Your location is anchored to:\n${cp.name}\nFloor: ${cp.level === -1 ? 'Subway · Level -1' : (cp.level === 1 ? 'FOB · Level 1' : 'Concourse · Level 0')}`,
        [{ text: "Continue navigation", onPress: onLocationUpdated }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan checkpoint</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Info Notice Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Indoor pillar positioning</Text>
        <Text style={styles.bannerSub}>
          GPS signals fluctuate under station roofs. Scan a RailMarga QR code or tap any pillar checkpoint below to anchor your location.
        </Text>
      </View>

      {/* Checkpoints List */}
      <FlatList
        data={checkpointsData}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => {
          const isSelected = selectedId === item.id;
          return (
            <TouchableOpacity
              style={[styles.checkpointCard, isSelected && styles.checkpointCardActive]}
              onPress={() => handleSelectCheckpoint(item)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Anchor to ${item.name}`}
            >
              <View style={styles.qrIconBox}>
                <QrIcon size={22} color="#1A1A1A" strokeWidth={1.75} />
                <Text style={styles.qrCodeText}>{item.id}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cpName}>{item.name}</Text>
                <Text style={styles.cpDesc}>{item.description}</Text>
                <Text style={styles.cpLevel}>
                  Floor: {item.level === -1 ? 'Subway (Level -1)' : item.level === 1 ? 'FOB (Level 1)' : 'Level 0'}
                </Text>
              </View>

              <View style={[styles.verifyBtn, isSelected && styles.verifyBtnActive]}>
                <Text style={[styles.verifyBtnText, isSelected && styles.verifyBtnTextActive]}>
                  {isSelected ? 'Anchored' : 'Select'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
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
  banner: {
    backgroundColor: '#FAFAF7',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Spacing.md
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4
  },
  bannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm
  },
  checkpointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkpointCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryTintSolid
  },
  qrIconBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2
  },
  qrCodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2
  },
  cpName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  cpDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  cpLevel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 3
  },
  verifyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  verifyBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  verifyBtnTextActive: {
    color: '#1A1A1A',
    fontWeight: '800'
  }
});
