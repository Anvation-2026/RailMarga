import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { KsrMap } from '../components/KsrMap';
import { NavigationInputCard } from '../components/NavigationInputCard';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { MapEntityModal, TappedEntity } from '../components/MapEntityModal';
import { RoutePreviewCard } from '../components/RoutePreviewCard';
import { ProfilePicker } from '../components/ProfilePicker';
import { QuickActionBadges } from '../components/QuickActionBadges';
import { NavigationBanner } from '../components/NavigationBanner';
import { BlockageModal } from '../components/BlockageModal';
import { useNavigationStore } from '../store/navigationStore';
import { StationNode, localRouter, Coordinates } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface HomeScreenProps {
  onOpenAssistant: () => void;
  onOpenFacilities: () => void;
  onOpenPlatformDetail: (platform: any) => void;
  onOpenQrScan: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAssistant,
  onOpenFacilities,
  onOpenPlatformDetail,
  onOpenQrScan
}) => {
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<'source' | 'destination'>('destination');
  const [demoModalVisible, setDemoModalVisible] = useState(false);
  const [tappedEntity, setTappedEntity] = useState<TappedEntity | null>(null);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const {
    startNode,
    destinationNode,
    sourceMethod,
    destinationMethod,
    selectedProfile,
    activeRoute,
    currentStepIndex,
    isNavigating,
    isOnline,
    voiceEnabled,
    blockageAlert,
    mapSelectionMode,
    setStartNode,
    setDestinationNode,
    swapSourceAndDestination,
    setMapSelectionMode,
    setProfile,
    calculateRoute,
    startNavigation,
    stopNavigation,
    advanceStep,
    previousStep,
    toggleVoice,
    checkNetwork
  } = useNavigationStore();

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  // Open Search Modal
  const handleOpenSearch = (mode: 'source' | 'destination') => {
    setSearchMode(mode);
    setSearchModalVisible(true);
  };

  // Handle Location Selection from Search
  const handleSelectLocation = (node: StationNode) => {
    if (searchMode === 'source') {
      setStartNode(node, 'SEARCH');
    } else {
      setDestinationNode(node, 'SEARCH');
    }
  };

  // Start Map Selection Mode
  const handleStartMapSelection = (mode: 'source' | 'destination') => {
    setMapSelectionMode(mode);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  // Handle Map Tap Coordinate
  const handleMapCoordinateSelected = (coords: Coordinates) => {
    const nearest = localRouter.findNearestNode(coords);
    if (!nearest) return;

    if (mapSelectionMode === 'source') {
      setStartNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
      Alert.alert(
        "Starting Point Selected",
        `Start anchored near: ${nearest.node.name}\nLevel: ${nearest.node.level === -1 ? 'Subway' : (nearest.node.level === 1 ? 'Footover Bridge' : 'Platform Level')}`
      );
    } else if (mapSelectionMode === 'destination') {
      setDestinationNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
      Alert.alert(
        "Destination Selected",
        `Destination set to: ${nearest.node.name}\nLevel: ${nearest.node.level === -1 ? 'Subway' : (nearest.node.level === 1 ? 'Footover Bridge' : 'Platform Level')}`
      );
    }
  };

  // Handle Map Platform Tap
  const handlePlatformTapped = (platform: any) => {
    const node = localRouter.nodeDict.get(`node_pf${platform.number}_center`) || localRouter.nodes[0];
    setTappedEntity({
      type: 'PLATFORM',
      id: platform.id,
      name: `Platform ${platform.number}`,
      level: 0,
      wheelchairAccessible: true,
      details: `Track bed and walking surface for Platform ${platform.number}. Serves passenger train arrivals/departures.`,
      node
    });
  };

  // Handle Map Facility Tap
  const handleFacilityTapped = (facility: any) => {
    const node = localRouter.nodeDict.get(`node_${facility.id}`) || localRouter.nodes[0];
    setTappedEntity({
      type: 'FACILITY',
      id: facility.id,
      name: facility.name,
      level: facility.level,
      wheelchairAccessible: facility.wheelchairAccessible,
      details: facility.description || `${facility.name} located at KSR Bengaluru Station.`,
      status: facility.status,
      node
    });
  };

  // Quick action badges handler
  const handleQuickAction = (category: string) => {
    let targetNode: StationNode | undefined;
    if (category === 'LIFT') {
      targetNode = localRouter.nodeDict.get('node_pf8_lift1') || localRouter.nodeDict.get('node_lift1');
    } else if (category === 'TOILET' || category === 'ACCESSIBLE_TOILET') {
      targetNode = localRouter.nodeDict.get('node_t1_toilet');
    } else if (category === 'METRO') {
      targetNode = localRouter.nodeDict.get('node_entry_t3_metro');
    } else if (category === 'TICKET_COUNTER') {
      targetNode = localRouter.nodeDict.get('node_t1_ticket');
    } else {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    }

    if (targetNode) {
      setDestinationNode(targetNode, 'FACILITY');
      if (!startNode) {
        Alert.alert(
          "Destination Chosen",
          `Destination set to: ${targetNode.name}.\n\nPlease choose your starting point to begin navigation!`,
          [
            { text: "Choose Starting Point", onPress: () => handleOpenSearch('source') },
            { text: "OK" }
          ]
        );
      }
    }
  };

  // Handle primary "FIND ROUTE" action
  const handleFindRoute = async () => {
    if (!startNode && !destinationNode) {
      handleOpenSearch('destination');
      return;
    }
    if (!destinationNode) {
      handleOpenSearch('destination');
      return;
    }
    if (!startNode) {
      handleOpenSearch('source');
      return;
    }
    await calculateRoute();
  };

  // Render Fullscreen Map Mode
  if (isFullscreenMap) {
    return (
      <SafeAreaView style={styles.fullscreenSafe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={() => setIsFullscreenMap(false)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>KSR Interactive Map</Text>
          <TouchableOpacity onPress={() => setDemoModalVisible(true)} style={styles.demoPill}>
            <Text style={styles.demoPillText}>⚡ Demo</Text>
          </TouchableOpacity>
        </View>

        <KsrMap
          routeCoordinates={activeRoute?.pathGeometry}
          currentLocation={startNode?.coordinates}
          destinationLocation={destinationNode?.coordinates}
          onSelectPlatform={handlePlatformTapped}
          onSelectFacility={handleFacilityTapped}
          onSelectMapCoordinate={handleMapCoordinateSelected}
          selectionMode={mapSelectionMode}
          onCancelSelection={() => setMapSelectionMode('none')}
          isFullscreen={true}
          onToggleFullscreen={() => setIsFullscreenMap(false)}
        />

        {activeRoute && (
          <View style={styles.floatingRouteCard}>
            <RoutePreviewCard
              route={activeRoute}
              selectedProfileId={selectedProfile}
              onStartNavigation={() => {
                setIsFullscreenMap(false);
                startNavigation();
              }}
              onFitRoute={() => {}}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />

      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>RAILMARGA</Text>
          <Text style={styles.brandSub}>KSR Bengaluru</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Online/Offline indicator pill */}
          <View style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.success : Colors.warning }]} />
            <Text style={styles.statusPillText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>

          {/* Sandbox Demo Launcher */}
          <TouchableOpacity
            style={styles.demoPill}
            onPress={() => setDemoModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.demoPillText}>⚡ Conditions</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. GREETING & MAIN SEARCH BAR */}
        <View style={styles.searchSection}>
          <Text style={styles.greetingText}>Where do you want to go?</Text>
          <TouchableOpacity
            style={styles.searchField}
            onPress={() => handleOpenSearch('destination')}
            activeOpacity={0.8}
          >
            <Text style={styles.searchFieldIcon}>🔎</Text>
            <Text style={styles.searchFieldPlaceholder}>Search platform, facility or location</Text>
          </TouchableOpacity>
        </View>

        {/* 3. YOUR JOURNEY (SOURCE + DESTINATION CARD) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>YOUR JOURNEY</Text>
        </View>

        <NavigationInputCard
          startNode={startNode}
          destinationNode={destinationNode}
          sourceMethod={sourceMethod}
          destinationMethod={destinationMethod}
          onOpenSourceSearch={() => handleOpenSearch('source')}
          onOpenDestinationSearch={() => handleOpenSearch('destination')}
          onSelectSourceOnMap={() => handleStartMapSelection('source')}
          onSelectDestinationOnMap={() => handleStartMapSelection('destination')}
          onOpenQrScan={onOpenQrScan}
          onSwap={swapSourceAndDestination}
          onClearSource={() => setStartNode(null)}
          onClearDestination={() => setDestinationNode(null)}
        />

        {/* Primary Action Button: FIND ROUTE */}
        <View style={styles.findRouteWrapper}>
          <TouchableOpacity
            style={styles.findRouteBtn}
            onPress={handleFindRoute}
            activeOpacity={0.85}
          >
            <Text style={styles.findRouteBtnText}>FIND ROUTE</Text>
          </TouchableOpacity>
        </View>

        {/* 4. ACCESSIBILITY PROFILES */}
        <ProfilePicker
          selectedProfileId={selectedProfile}
          onSelectProfile={setProfile}
        />

        {/* 5. ROUTE PREVIEW CARD (When route is ready) */}
        {activeRoute && !isNavigating && (
          <RoutePreviewCard
            route={activeRoute}
            selectedProfileId={selectedProfile}
            onStartNavigation={startNavigation}
            onFitRoute={() => {}}
          />
        )}

        {/* 6. HERO MAP CONTAINER */}
        <View style={styles.mapSectionWrapper}>
          <KsrMap
            routeCoordinates={activeRoute?.pathGeometry}
            currentLocation={startNode?.coordinates}
            destinationLocation={destinationNode?.coordinates}
            onSelectPlatform={handlePlatformTapped}
            onSelectFacility={handleFacilityTapped}
            onSelectMapCoordinate={handleMapCoordinateSelected}
            selectionMode={mapSelectionMode}
            onCancelSelection={() => setMapSelectionMode('none')}
            isFullscreen={false}
            onToggleFullscreen={() => setIsFullscreenMap(true)}
          />
        </View>

        {/* 7. QUICK FACILITIES */}
        <QuickActionBadges onSelectAction={handleQuickAction} />

        {/* 8. AI ASSISTANT & DIRECTORY TILES */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenAssistant}
            activeOpacity={0.85}
          >
            <View style={styles.actionCardIconBox}>
              <Text style={styles.actionCardIcon}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Ask RailMarga</Text>
              <Text style={styles.actionCardSub}>Station AI Assistant</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenFacilities}
            activeOpacity={0.85}
          >
            <View style={styles.actionCardIconBox}>
              <Text style={styles.actionCardIcon}>🏢</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Directory</Text>
              <Text style={styles.actionCardSub}>Facilities & Lifts</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: isNavigating ? 260 : 40 }} />
      </ScrollView>

      {/* Turn-by-Turn Navigation Overlay Banner */}
      {isNavigating && activeRoute && (
        <View style={styles.bannerContainer}>
          <NavigationBanner
            route={activeRoute}
            currentStepIndex={currentStepIndex}
            voiceEnabled={voiceEnabled}
            blockageAlert={blockageAlert}
            onAdvanceStep={advanceStep}
            onPreviousStep={previousStep}
            onToggleVoice={toggleVoice}
            onStopNavigation={stopNavigation}
          />
        </View>
      )}

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={searchModalVisible}
        mode={searchMode}
        onClose={() => setSearchModalVisible(false)}
        onSelectNode={handleSelectLocation}
      />

      {/* Interactive Entity Details Bottom Sheet */}
      <MapEntityModal
        entity={tappedEntity}
        onClose={() => setTappedEntity(null)}
        onSetAsStart={(node) => setStartNode(node, 'PLATFORM')}
        onSetAsDestination={(node) => setDestinationNode(node, 'PLATFORM')}
        onNavigateHere={(node) => {
          setDestinationNode(node, 'PLATFORM');
          if (!startNode) {
            handleOpenSearch('source');
          }
        }}
      />

      {/* Station Conditions & Demo Sandbox Modal */}
      <BlockageModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.2
  },
  brandSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1
  },
  statusOnline: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success
  },
  statusOffline: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  demoPill: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  scrollContent: {
    paddingBottom: 24
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  searchFieldIcon: {
    fontSize: 16,
    marginRight: Spacing.xs
  },
  searchFieldPlaceholder: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '400'
  },
  sectionHeaderRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 2
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8
  },
  findRouteWrapper: {
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs
  },
  findRouteBtn: {
    backgroundColor: Colors.goldPrimary,
    borderRadius: Radii.button,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  findRouteBtnText: {
    color: Colors.charcoalPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  mapSectionWrapper: {
    marginVertical: Spacing.xs
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  actionCardIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionCardIcon: {
    fontSize: 16
  },
  actionCardTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  actionCardSub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1
  },
  actionCardArrow: {
    color: Colors.textTertiary,
    fontSize: 14
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  fullscreenSafe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    padding: 4
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  fullscreenTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  floatingRouteCard: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0
  }
});
