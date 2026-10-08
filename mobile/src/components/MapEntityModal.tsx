import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { StationNode } from '../services/localRouter';
import { useBlockageStore } from '../store/blockageStore';
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  CloseIcon,
  WheelchairIcon,
  AlertIcon,
  ArrowRightIcon
} from './Icons';

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

  return (
    <Modal visible={!!entity} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.entityTypeLabel}>
                {entity.type === 'PLATFORM' ? 'Platform' : (entity.type === 'FACILITY' ? 'Station amenity' : 'Location anchor')}
              </Text>
              <Text style={styles.entityName}>{entity.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <CloseIcon size={16} color="#666660" />
            </TouchableOpacity>
          </View>

          {/* Status & Accessibility Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.statusPill, isBlocked ? styles.statusPillBlocked : styles.statusPillOpen]}>
              <View style={[styles.statusDot, { backgroundColor: isBlocked ? '#DC2626' : '#16A34A' }]} />
              <Text style={[styles.statusPillText, isBlocked ? styles.statusTextRed : styles.statusTextGreen]}>
                {isBlocked ? 'Blocked' : 'Open'}
              </Text>
            </View>

            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {entity.level === -1 ? 'Floor: Subway' : (entity.level === 1 ? 'Floor: FOB' : 'Floor: Level 0')}
              </Text>
            </View>

            {entity.wheelchairAccessible && (
              <View style={styles.accessiblePill}>
                <WheelchairIcon size={12} color="#1A1A1A" strokeWidth={2} />
                <Text style={styles.accessiblePillText}>Step-free</Text>
              </View>
            )}
          </View>

          {entity.details && (
            <Text style={styles.detailsText}>{entity.details}</Text>
          )}

          {isBlocked && (
            <View style={styles.blockedAlertBox}>
              <AlertIcon size={16} color="#DC2626" strokeWidth={2} />
              <Text style={styles.blockedAlertDesc}>
                This facility is temporarily unavailable. Pathfinding will seek alternative routes.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.auxBtn}
              onPress={() => {
                onSetAsStart(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>Set as start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.auxBtn}
              onPress={() => {
                onSetAsDestination(entity.node);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.auxBtnText}>Set destination</Text>
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
            <Text style={styles.navigateNowText}>Navigate here</Text>
            <ArrowRightIcon size={16} color="#1A1A1A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.lg,
    paddingTop: 10,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm
  },
  titleGroup: {
    flex: 1
  },
  entityTypeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2
  },
  entityName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1
  },
  statusPillOpen: {
    backgroundColor: Colors.successLight,
    borderColor: '#BBF7D0'
  },
  statusPillBlocked: {
    backgroundColor: Colors.errorLight,
    borderColor: '#FECACA'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600'
  },
  statusTextGreen: {
    color: Colors.success
  },
  statusTextRed: {
    color: Colors.error
  },
  levelPill: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill
  },
  levelPillText: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  accessiblePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill
  },
  accessiblePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  detailsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginVertical: 8,
    lineHeight: 18
  },
  blockedAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6
  },
  blockedAlertDesc: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm
  },
  auxBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  auxBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  navigateNowBtn: {
    height: 48,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    marginBottom: 6
  },
  navigateNowText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A'
  }
});
