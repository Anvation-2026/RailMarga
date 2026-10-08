import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useBlockageStore } from '../store/blockageStore';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  WalkIcon,
  WheelchairIcon,
  SeniorIcon,
  AudioTactileIcon,
  AlertIcon,
  CheckIcon,
  CloseIcon
} from './Icons';

interface BlockageModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BlockageModal: React.FC<BlockageModalProps> = ({ visible, onClose }) => {
  const { statuses, toggleBlockage, resetAll, isBlocked } = useBlockageStore();
  const { setProfile, setDestinationNode, calculateRoute, startNavigation } = useNavigationStore();

  const facilities = [
    { id: 'lift_1', name: 'Lift 1 (Platform 7/8)', desc: 'Serves Platform 7/8 to FOB 2' },
    { id: 'lift_2', name: 'Lift 2 (Terminal 1 Concourse)', desc: 'Serves Concourse to Subway' },
    { id: 'lift_3', name: 'Lift 3 (Platform 1 East)', desc: 'Serves PF 1 to FOB 2' },
    { id: 'ramp_1', name: 'Ramp 1 (Platform 7/8)', desc: 'Accessible Ramp to FOB 2' },
    { id: 'ramp_2', name: 'Ramp 2 (Platform 4/5)', desc: 'Accessible Ramp to FOB 2' }
  ];

  // Quick Demo Scenario Launchers
  const runScenario = async (scenarioNumber: number) => {
    await resetAll();
    const p8Node = localRouter.nodeDict.get('node_pf8_center')!;
    const p5Node = localRouter.nodeDict.get('node_pf5_center')!;

    switch (scenarioNumber) {
      case 1:
        // Scenario 1: First-Time Traveller to Platform 8
        setProfile('first_time');
        setDestinationNode(p8Node);
        break;
      case 2:
        // Scenario 2: Wheelchair user to Platform 8
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        break;
      case 3:
        // Scenario 3: Elderly person to Platform 5
        setProfile('elderly');
        setDestinationNode(p5Node);
        break;
      case 4:
        // Scenario 4: Visually Impaired to Platform 8
        setProfile('visually_impaired');
        setDestinationNode(p8Node);
        break;
      case 5:
        // Scenario 5: Dynamic Blockage Simulation
        setProfile('mobility_disabled');
        setDestinationNode(p8Node);
        const route = await calculateRoute();
        if (route) {
          startNavigation(route);
          // Trigger blockage after 1.5s delay to demonstrate dynamic reroute
          setTimeout(() => {
            toggleBlockage('lift_1');
          }, 1500);
        }
        break;
    }

    if (scenarioNumber !== 5) {
      const r = await calculateRoute();
      if (r) startNavigation(r);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>Station conditions & alerts</Text>
              <Text style={styles.title}>Incident simulation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <CloseIcon size={16} color="#666660" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Test Scenarios */}
            <Text style={styles.sectionTitle}>1-tap test scenarios</Text>
            <View style={styles.scenarioGrid}>
              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(1)}
                activeOpacity={0.8}
              >
                <WalkIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
                <Text style={styles.scenarioTitle}>1. First-time</Text>
                <Text style={styles.scenarioSub}>PF 8 with landmarks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(2)}
                activeOpacity={0.8}
              >
                <WheelchairIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
                <Text style={styles.scenarioTitle}>2. Step-free</Text>
                <Text style={styles.scenarioSub}>PF 8 lifts only</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(3)}
                activeOpacity={0.8}
              >
                <SeniorIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
                <Text style={styles.scenarioTitle}>3. Senior citizen</Text>
                <Text style={styles.scenarioSub}>PF 5 avoids stairs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(4)}
                activeOpacity={0.8}
              >
                <AudioTactileIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
                <Text style={styles.scenarioTitle}>4. Tactile</Text>
                <Text style={styles.scenarioSub}>Voice & tactile paving</Text>
              </TouchableOpacity>
            </View>

            {/* Critical Scenario 5: Dynamic Rerouting */}
            <TouchableOpacity
              style={styles.rerouteHeroBtn}
              onPress={() => runScenario(5)}
              activeOpacity={0.8}
            >
              <View style={styles.rerouteIconBox}>
                <AlertIcon size={18} color="#1A1A1A" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rerouteHeroTitle}>5. Dynamic blockage & reroute</Text>
                <Text style={styles.rerouteHeroSub}>
                  Starts wheelchair navigation to PF 8, then triggers Lift 1 blockage after 1.5s to show automatic rerouting.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Interactive Facility Condition Toggles */}
            <Text style={styles.sectionTitle}>Station facility status</Text>
            <Text style={styles.sectionSub}>Tap any facility below to simulate real-time maintenance:</Text>

            {facilities.map((fac) => {
              const blocked = isBlocked(fac.id);
              return (
                <TouchableOpacity
                  key={fac.id}
                  style={[styles.facilityRow, blocked && styles.facilityRowBlocked]}
                  onPress={() => toggleBlockage(fac.id)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facilityName}>{fac.name}</Text>
                    <Text style={styles.facilityDesc}>{fac.desc}</Text>
                  </View>
                  <View style={[styles.statusBadge, blocked ? styles.statusBadgeBlocked : styles.statusBadgeOpen]}>
                    <View style={[styles.statusDot, { backgroundColor: blocked ? '#DC2626' : '#16A34A' }]} />
                    <Text style={[styles.statusBadgeText, blocked && styles.statusBadgeTextBlocked]}>
                      {blocked ? 'Blocked' : 'Open'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Reset All Button */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={async () => {
                await resetAll();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>Reset all to open</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.lg,
    paddingTop: 10,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: 10
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5D5CE'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md
  },
  badge: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  scenarioBtn: {
    width: '48%',
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6
  },
  scenarioSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  rerouteHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF9E6',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radii.card,
    padding: 12,
    marginVertical: 8
  },
  rerouteIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rerouteHeroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  rerouteHeroSub: {
    fontSize: 11,
    color: '#666660',
    marginTop: 2,
    lineHeight: 16
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginBottom: 6
  },
  facilityRowBlocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  facilityDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1
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
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success
  },
  statusBadgeTextBlocked: {
    color: Colors.error
  },
  resetBtn: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  }
});
