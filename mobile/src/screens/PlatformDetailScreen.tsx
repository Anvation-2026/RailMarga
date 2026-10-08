import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  ElevatorIcon,
  RampIcon,
  RestroomIcon,
  WheelchairIcon,
  ArrowRightIcon,
  CheckIcon
} from '../components/Icons';

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
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
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
          <Text style={styles.sectionHeader}>Accessibility</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wheelchair access:</Text>
            <View style={styles.statusPill}>
              <CheckIcon size={12} color="#16A34A" strokeWidth={2.5} />
              <Text style={styles.infoVal}>Step-free verified</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tactile paving:</Text>
            <Text style={styles.infoValPlain}>Installed along platform edge</Text>
          </View>
          {platform.accessibility?.notes && (
            <Text style={styles.accessNotes}>{platform.accessibility.notes}</Text>
          )}
        </View>

        {/* Nearby Facilities Matrix */}
        <Text style={styles.groupTitle}>Nearby connected amenities</Text>

        <View style={styles.facilityItem}>
          <View style={styles.facilityIconBox}>
            <ElevatorIcon size={18} color="#1A1A1A" strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest lift</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestLifts?.join(', ') || 'Connected via FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <View style={styles.facilityIconBox}>
            <RampIcon size={18} color="#1A1A1A" strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest ramp</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestRamps?.join(', ') || '1:12 Ramp to FOB 2'}
            </Text>
          </View>
        </View>

        <View style={styles.facilityItem}>
          <View style={styles.facilityIconBox}>
            <RestroomIcon size={18} color="#1A1A1A" strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>Nearest restroom</Text>
            <Text style={styles.facilityDetail}>
              {platform.nearestToilets?.join(', ') || 'On-platform concourse'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.navigateBtn}
          onPress={handleNavigate}
          activeOpacity={0.85}
        >
          <Text style={styles.navigateBtnText}>Navigate to Platform {platform.number}</Text>
          <ArrowRightIcon size={18} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.assistantBtn}
          onPress={onAskAssistant}
          activeOpacity={0.8}
        >
          <Text style={styles.assistantBtnText}>Ask assistant about Platform {platform.number}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: Spacing.md,
    gap: Spacing.sm
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  platformSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success
  },
  infoValPlain: {
    fontSize: 12,
    color: Colors.textPrimary
  },
  accessNotes: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 16
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8
  },
  facilityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  facilityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  facilityDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1
  },
  navigateBtn: {
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderRadius: Radii.pill,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm
  },
  navigateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  assistantBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  assistantBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  }
});
