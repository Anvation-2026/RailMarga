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
      setStartNode(node);
      if (voiceEnabled) {
        voiceService.speak(`Indoor location updated to ${cp.name}.`);
      }
      if (isNavigating) {
        await calculateRoute();
      }
      Alert.alert(
        "Indoor Checkpoint Verified",
        `Your position is anchored to:\n${cp.name}\nLevel: ${cp.level === -1 ? 'Subway' : (cp.level === 1 ? 'Footover Bridge' : 'Platform Level')}`,
        [{ text: "OK", onPress: onLocationUpdated }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Checkpoint Localization</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>INDOOR POSITIONING VIA QR</Text>
        <Text style={styles.bannerSub}>
          GPS is unreliable inside dense railway platforms. Tap any station pillar checkpoint below to anchor your live indoor position.
        </Text>
      </View>

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
            >
              <View style={styles.qrIconBox}>
                <Text style={styles.qrIcon}>📷</Text>
                <Text style={styles.qrCodeText}>{item.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cpName}>{item.name}</Text>
                <Text style={styles.cpDesc}>{item.description}</Text>
                <Text style={styles.cpLevel}>
                  Floor: {item.level === -1 ? 'Level -1 (Subway)' : (item.level === 1 ? 'Level +1 (FOB)' : 'Level 0 (Platform)')}
                </Text>
              </View>
              <View style={styles.scanBtn}>
                <Text style={styles.scanBtnText}>Scan</Text>
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
    fontSize: 16,
    fontWeight: 'bold'
  },
  banner: {
    backgroundColor: '#1E293B',
    padding: 14,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7'
  },
  bannerTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8
  },
  bannerSub: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  list: {
    padding: 14,
    gap: 10
  },
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12
  },
  checkpointCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2744'
  },
  qrIconBox: {
    alignItems: 'center',
    width: 60
  },
  qrIcon: {
    fontSize: 26
  },
  qrCodeText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2
  },
  cpName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold'
  },
  cpDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  cpLevel: {
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600'
  },
  scanBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
