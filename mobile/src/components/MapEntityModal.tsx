import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode, localRouter } from '../services/localRouter';
import { useBlockageStore } from '../store/blockageStore';

export interface TappedEntity {
  type: 'PLATFORM' | 'FACILITY' | 'NODE';
  id: string;
  name: string;
  details?: string;
  status?: string;
  level?: number;
  wheelchairAccessible?: boolean;
  node: StationNode;
}

interface MapEntityModalProps {
  entity: TappedEntity | null;
  onClose: () => void;
  onSetAsStart: (node: StationNode) => void;
  onSetAsDestination: (node: StationNode) => void;
  onNavigateHere: (node: StationNode) => void;
}

export const MapEntityModal: React.FC<MapEntityModalProps> = ({
  entity,
  onClose,
  onSetAsStart,
  onSetAsDestination,
  onNavigateHere
}) => {
  const statuses = useBlockageStore((state) => state.statuses);

  if (!entity) return null;

  const currentStatus = (entity.id && statuses[entity.id]) || entity.status || 'OPEN';
  const isBlocked = currentStatus === 'BLOCKED';
  const isCaution = currentStatus === 'LIMITED';

  const statusColor = isBlocked ? '#EF4444' : (isCaution ? '#F59E0B' : '#10B981');
  const statusLabel = isBlocked ? '🔴 BLOCKED / OUT OF ORDER' : (isCaution ? '🟠 LIMITED ACCESS' : '🟢 OPERATIONAL');

  return (
    <Modal visible={!!entity} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.entityTypeLabel}>
                {entity.type === 'PLATFORM' ? 'STATION PLATFORM' : (entity.type === 'FACILITY' ? 'STATION FACILITY' : 'NAVIGATION ANCHOR')}
              </Text>
              <Text style={styles.entityName}>{entity.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Status & Accessibility Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.statusPill, { borderColor: statusColor, backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {entity.level === -1 ? 'Level -1 (Subway)' : (entity.level === 1 ? 'Level 1 (FOB)' : 'Level 0 (Platform)')}
              </Text>
            </View>

            {entity.wheelchairAccessible && (
              <View style={styles.accessiblePill}>
                <Text style={styles.accessiblePillText}>♿ Accessible</Text>
              </View>
            )}
          </View>

          {entity.details && (
            <Text style={styles.detailsText}>{entity.details}</Text>
          )}

          {isBlocked && (
            <View style={styles.blockedAlertBox}>
              <Text style={styles.blockedAlertTitle}>⚠️ Incident Alert Active</Text>
              <Text style={styles.blockedAlertDesc}>This location is currently blocked for maintenance. Routing will automatically seek alternate paths.</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.setStartBtn}
              onPress={() => {
                onSetAsStart(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.setStartBtnText}>📍 Set as Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setDestBtn}
              onPress={() => {
                onSetAsDestination(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.setDestBtnText}>🎯 Set as Destination</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navigateNowBtn}
            onPress={() => {
              onNavigateHere(entity.node);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.navigateNowText}>🧭 Navigate Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 }
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  titleGroup: {
    flex: 1
  },
  entityTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1
  },
  entityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold'
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700'
  },
  levelPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  levelPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  accessiblePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  accessiblePillText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700'
  },
  detailsText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 10
  },
  blockedAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 14
  },
  blockedAlertTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold'
  },
  blockedAlertDesc: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 2
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  setStartBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981'
  },
  setStartBtnText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700'
  },
  setDestBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8'
  },
  setDestBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700'
  },
  navigateNowBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  navigateNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
