import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useBlockageStore } from '../store/blockageStore';
import { useNavigationStore } from '../store/navigationStore';
import { localRouter } from '../services/localRouter';

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

  // Quick Hackathon Demo Scenario Launchers
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
        // Scenario 5: Blockage Simulation
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>DEMO SIMULATION</Text>
              <Text style={styles.title}>Judge Sandbox</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 5 Scenario Presets */}
            <Text style={styles.sectionTitle}>1-Tap Demo Scenarios</Text>
            <View style={styles.scenarioGrid}>
              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>🧭</Text>
                <Text style={styles.scenarioTitle}>1. First-Time</Text>
                <Text style={styles.scenarioSub}>PF 8 with landmarks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scenarioBtn, styles.wheelchairBtn]}
                onPress={() => runScenario(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>♿</Text>
                <Text style={styles.scenarioTitle}>2. Wheelchair</Text>
                <Text style={styles.scenarioSub}>PF 8 step-free route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(3)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>🚶‍♂️</Text>
                <Text style={styles.scenarioTitle}>3. Elderly</Text>
                <Text style={styles.scenarioSub}>PF 5 avoids stairs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scenarioBtn}
                onPress={() => runScenario(4)}
                activeOpacity={0.8}
              >
                <Text style={styles.scenarioIcon}>🦯</Text>
                <Text style={styles.scenarioTitle}>4. Visually Impaired</Text>
                <Text style={styles.scenarioSub}>Audio & tactile guidance</Text>
              </TouchableOpacity>
            </View>

            {/* Critical Scenario 5: Dynamic Rerouting */}
            <TouchableOpacity
              style={styles.rerouteHeroBtn}
              onPress={() => runScenario(5)}
              activeOpacity={0.8}
            >
              <Text style={styles.rerouteHeroIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rerouteHeroTitle}>5. Live Blockage Simulation</Text>
                <Text style={styles.rerouteHeroSub}>
                  Starts navigation to PF 8 → Blocks Lift 1 → Watches instant dynamic rerouting!
                </Text>
              </View>
            </TouchableOpacity>

            {/* Individual Blockage Toggles */}
            <Text style={styles.sectionTitle}>Individual Facility Toggles</Text>
            {facilities.map((fac) => {
              const blocked = isBlocked(fac.id);
              return (
                <View key={fac.id} style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleName}>{fac.name}</Text>
                    <Text style={styles.toggleDesc}>{fac.desc}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      blocked ? styles.toggleBtnBlocked : styles.toggleBtnOpen
                    ]}
                    onPress={() => toggleBlockage(fac.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.toggleBtnText}>
                      {blocked ? '🔴 BLOCKED' : '🟢 OPEN'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Reset All Button */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetAll}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>Reset All Blockages to Open</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#334155'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  badge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: 'bold'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginVertical: 10
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  scenarioBtn: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  wheelchairBtn: {
    borderColor: '#0284C7',
    backgroundColor: '#0B2545'
  },
  scenarioIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  scenarioTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold'
  },
  scenarioSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  rerouteHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 16,
    gap: 12
  },
  rerouteHeroIcon: {
    fontSize: 28
  },
  rerouteHeroTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  rerouteHeroSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  toggleName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600'
  },
  toggleDesc: {
    color: '#94A3B8',
    fontSize: 11
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  toggleBtnOpen: {
    backgroundColor: '#064E3B'
  },
  toggleBtnBlocked: {
    backgroundColor: '#7F1D1D'
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  resetBtn: {
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20
  },
  resetBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold'
  }
});
