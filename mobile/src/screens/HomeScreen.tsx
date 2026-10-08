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
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';

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
    // Scroll down to map
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

  // Handle Map Platform Tap (Section 14)
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

  // Handle Map Facility Tap (Section 14)
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

  // Quick action badges handler (Section 29)
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

  // Render Fullscreen Map Mode
  if (isFullscreenMap) {
    return (
      <SafeAreaView style={styles.fullscreenSafe}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
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
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.titlePrefix}>RAIL</Text>
            <Text style={styles.titleSuffix}>MARGA</Text>
          </View>
          <Text style={styles.tagline}>Smart & Accessible Navigation • KSR Bengaluru</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Online/Offline indicator */}
          <View style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.statusPillText}>{isOnline ? 'Online' : 'Offline Mode'}</Text>
          </View>

          {/* Demo Sandbox Button */}
          <TouchableOpacity
            style={styles.demoPill}
            onPress={() => setDemoModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.demoPillText}>⚡ Demo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Navigation Input Section (FROM / TO / SWAP) - Sections 8, 9, 32 */}
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

        {/* Accessibility Profile Selector - Sections 27 & 28 */}
        <ProfilePicker
          selectedProfileId={selectedProfile}
          onSelectProfile={setProfile}
        />

        {/* Quick Action Badges - Section 29 */}
        <QuickActionBadges onSelectAction={handleQuickAction} />

        {/* Route Preview Card (Appears when both FROM & TO are selected) - Sections 17 & 18 */}
        {activeRoute && !isNavigating && (
          <RoutePreviewCard
            route={activeRoute}
            selectedProfileId={selectedProfile}
            onStartNavigation={startNavigation}
            onFitRoute={() => {}}
          />
        )}

        {/* Original KSR CAD Vector Map Component - Hero Surface - Sections 2, 3, 5, 6, 7 */}
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

        {/* Bottom AI Assistant & Facilities Quick Launch */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenAssistant}
            activeOpacity={0.85}
          >
            <Text style={styles.actionCardIcon}>🤖</Text>
            <View>
              <Text style={styles.actionCardTitle}>Ask RailMarga AI</Text>
              <Text style={styles.actionCardSub}>Station assistant</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.facilitiesCard]}
            onPress={onOpenFacilities}
            activeOpacity={0.85}
          >
            <Text style={styles.actionCardIcon}>🏢</Text>
            <View>
              <Text style={styles.actionCardTitle}>Station Directory</Text>
              <Text style={styles.actionCardSub}>Facilities & Lifts</Text>
            </View>
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

      {/* Judge Demo Sandbox Modal */}
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
    backgroundColor: '#0B1120'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  titlePrefix: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 1.5
  },
  titleSuffix: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.5
  },
  tagline: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  statusOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
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
    color: '#CBD5E1'
  },
  demoPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A855F7'
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC'
  },
  scrollContent: {
    paddingBottom: 20
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    marginTop: 10
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  facilitiesCard: {
    borderColor: '#1E3A8A',
    backgroundColor: 'rgba(30, 58, 138, 0.18)'
  },
  actionCardIcon: {
    fontSize: 22
  },
  actionCardTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700'
  },
  actionCardSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  fullscreenSafe: {
    flex: 1,
    backgroundColor: '#0B1120'
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    padding: 4
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700'
  },
  fullscreenTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  floatingRouteCard: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0
  }
});
