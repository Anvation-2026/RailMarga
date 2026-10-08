import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
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
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

interface HomeScreenProps {
  onOpenAssistant: () => void;
  onOpenFacilities: () => void;
  onOpenPlatformDetail: (platform: any) => void;
  onOpenQrScan: () => void;
}

const PLATFORMS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
  const handleSelectLocation = async (node: StationNode) => {
    if (searchMode === 'source') {
      setStartNode(node, 'SEARCH');
    } else {
      setDestinationNode(node, 'SEARCH');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
    }
  };

  // Quick 1-tap Platform Selector (like train/terminal selector in travel apps)
  const handleQuickPlatformSelect = async (pfNumber: number) => {
    const pfNode = localRouter.nodeDict.get(`node_pf${pfNumber}_center`) || localRouter.nodeDict.get(`node_pf${pfNumber}_west`);
    if (pfNode) {
      setDestinationNode(pfNode, 'PLATFORM');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
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
      details: `Track bed and passenger boarding surface for Platform ${platform.number}. Serves departures and arrivals.`,
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
  const handleQuickAction = async (category: string) => {
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
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
    }
  };

  // Handle primary "FIND ROUTE" action
  const handleFindRoute = async () => {
    if (!destinationNode) {
      handleOpenSearch('destination');
      return;
    }
    if (!startNode) {
      const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      } else {
        handleOpenSearch('source');
        return;
      }
    }
    await calculateRoute();
  };

  // Render Fullscreen Map Mode
  if (isFullscreenMap) {
    return (
      <SafeAreaView style={styles.fullscreenSafe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={() => setIsFullscreenMap(false)} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>Interactive Station Map</Text>
          <TouchableOpacity onPress={() => setDemoModalVisible(true)} style={styles.demoPill} activeOpacity={0.8}>
            <Text style={styles.demoPillText}>⚡ Alerts</Text>
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

      {/* TOP APP BAR (Zomato/Swiggy/Uber Caliber Header) */}
      {isNavigating && activeRoute ? (
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.navHeaderBackBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderBackText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.navHeaderInfo}>
            <Text style={styles.navHeaderDest} numberOfLines={1}>
              {activeRoute.destination.name}
            </Text>
            <Text style={styles.navHeaderStats}>
              {activeRoute.estimatedTimeMinutes} min • {activeRoute.totalDistanceMeters}m • Step {currentStepIndex + 1}/{activeRoute.steps.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navHeaderExitBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderExitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          {/* Logo & Location Dropdown */}
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/railmarga-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View style={styles.locationDropdown}>
              <Text style={styles.locationText} numberOfLines={1}>
                📍 KSR Bengaluru • Main Concourse ▾
              </Text>
            </View>
          </View>

          {/* Right Header Status & Alerts */}
          <View style={styles.headerRight}>
            <View style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : Colors.warning }]} />
              <Text style={styles.statusPillText}>{isOnline ? 'Live' : 'Offline'}</Text>
            </View>

            <TouchableOpacity
              style={styles.alertsPill}
              onPress={() => setDemoModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertsPillText}>⚡ Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* FLOATING "WHERE TO?" SEARCH PILL (Uber / Blinkit Style) */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.floatingSearchBar}
            onPress={() => handleOpenSearch('destination')}
            activeOpacity={0.85}
          >
            <View style={styles.searchIconBox}>
              <Text style={styles.searchIconText}>🔎</Text>
            </View>
            <View style={styles.searchTextBox}>
              <Text style={styles.searchMainTitle}>Where are you heading?</Text>
              <Text style={styles.searchSubtitle}>Platform 1-10, Restroom, Lift, Metro FOB...</Text>
            </View>
            <TouchableOpacity
              style={styles.qrShortcutBtn}
              onPress={onOpenQrScan}
              activeOpacity={0.8}
            >
              <Text style={styles.qrShortcutIcon}>📷</Text>
              <Text style={styles.qrShortcutText}>Scan</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* QUICK PLATFORM STRIP (1 to 10 Instant Selector) */}
        <View style={styles.platformStripSection}>
          <View style={styles.platformStripHeader}>
            <Text style={styles.sectionTitle}>QUICK PLATFORM SELECTION</Text>
            <Text style={styles.sectionSubtitle}>1-Tap Routing</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.platformStripScroll}
          >
            {PLATFORMS_LIST.map((pfNum) => {
              const isSelected = destinationNode?.name.includes(`Platform ${pfNum}`);
              return (
                <TouchableOpacity
                  key={pfNum}
                  style={[styles.platformChip, isSelected && styles.platformChipActive]}
                  onPress={() => handleQuickPlatformSelect(pfNum)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.platformChipNumber, isSelected && styles.platformChipNumberActive]}>
                    PF {pfNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* JOURNEY PLANNER CARD (Uber / Ola Ride Booking Card) */}
        <View style={styles.journeySection}>
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
              <Text style={styles.findRouteBtnText}>
                {destinationNode ? 'GET ROUTE DIRECTIONS →' : 'FIND ROUTE →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCESSIBILITY & TRAVEL MODES (Uber Ride Class Selector) */}
        <ProfilePicker
          selectedProfileId={selectedProfile}
          onSelectProfile={setProfile}
        />

        {/* ROUTE PREVIEW CARD (Uber Ride Confirmation View) */}
        {activeRoute && !isNavigating && (
          <View style={styles.routePreviewWrapper}>
            <TouchableOpacity
              style={styles.clearRouteBtn}
              onPress={() => {
                setStartNode(null);
                setDestinationNode(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearRouteBtnText}>← Clear Route / Back</Text>
            </TouchableOpacity>
            <RoutePreviewCard
              route={activeRoute}
              selectedProfileId={selectedProfile}
              onStartNavigation={() => startNavigation()}
              onFitRoute={() => {}}
              onClosePreview={() => {
                setStartNode(null);
                setDestinationNode(null);
              }}
            />
          </View>
        )}

        {/* INTERACTIVE CAD MAP (Hero Viewport) */}
        <View style={styles.mapSectionWrapper}>
          <View style={styles.mapCard}>
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
        </View>

        {/* ESSENTIAL FACILITIES (Swiggy/Blinkit Category Carousel) */}
        <QuickActionBadges onSelectAction={handleQuickAction} />

        {/* CURATED PROMOTIONAL BANNERS (Blinkit / Swiggy Feature Cards) */}
        <View style={styles.featureBannersRow}>
          <TouchableOpacity
            style={styles.featureBanner}
            onPress={onOpenAssistant}
            activeOpacity={0.85}
          >
            <View style={styles.bannerIconBox}>
              <Text style={styles.bannerIcon}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bannerTagRow}>
                <Text style={styles.bannerTag}>AI ASSISTANT</Text>
              </View>
              <Text style={styles.bannerTitle}>Ask RailMarga</Text>
              <Text style={styles.bannerSubtitle}>Train status, lifts & gates</Text>
            </View>
            <Text style={styles.bannerArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureBanner}
            onPress={onOpenFacilities}
            activeOpacity={0.85}
          >
            <View style={[styles.bannerIconBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
              <Text style={styles.bannerIcon}>🏢</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bannerTagRow}>
                <Text style={[styles.bannerTag, { color: '#4F46E5', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  42 AMENITIES
                </Text>
              </View>
              <Text style={styles.bannerTitle}>Directory</Text>
              <Text style={styles.bannerSubtitle}>Restrooms, FOBs & lifts</Text>
            </View>
            <Text style={styles.bannerArrow}>→</Text>
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
        onNavigateHere={async (node) => {
          setDestinationNode(node, 'PLATFORM');
          if (!startNode) {
            const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
            if (defaultStart) {
              setStartNode(defaultStart, 'SEARCH');
            }
          }
          await calculateRoute();
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
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  brandContainer: {
    justifyContent: 'center'
  },
  brandLogo: {
    width: 112,
    height: 34
  },
  locationDropdown: {
    marginTop: 2
  },
  locationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600'
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
    borderRadius: Radii.pill,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  statusOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  statusOffline: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46'
  },
  alertsPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm
  },
  alertsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.goldDark
  },
  scrollContent: {
    paddingBottom: 24
  },
  searchSection: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: 4
  },
  floatingSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    ...Shadows.floating
  },
  searchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.goldTintSolid,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FDE047'
  },
  searchIconText: {
    fontSize: 18
  },
  searchTextBox: {
    flex: 1
  },
  searchMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  searchSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2
  },
  qrShortcutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  qrShortcutIcon: {
    fontSize: 14
  },
  qrShortcutText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 1
  },
  platformStripSection: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm
  },
  platformStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary
  },
  platformStripScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: Spacing.sm,
    paddingVertical: 2
  },
  platformChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm
  },
  platformChipActive: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary,
    borderWidth: 2
  },
  platformChipNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  platformChipNumberActive: {
    color: Colors.goldDark
  },
  journeySection: {
    marginVertical: 2
  },
  findRouteWrapper: {
    paddingHorizontal: Spacing.sm,
    marginTop: 4,
    marginBottom: Spacing.xs
  },
  findRouteBtn: {
    backgroundColor: Colors.goldPrimary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card
  },
  findRouteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  routePreviewWrapper: {
    marginVertical: 4
  },
  clearRouteBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start'
  },
  clearRouteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.goldDark
  },
  mapSectionWrapper: {
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs
  },
  mapCard: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.card
  },
  featureBannersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs
  },
  featureBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    ...Shadows.sm
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.goldTintSolid,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FDE047'
  },
  bannerIcon: {
    fontSize: 18
  },
  bannerTagRow: {
    marginBottom: 2
  },
  bannerTag: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.goldDark,
    backgroundColor: Colors.goldTintSolid,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE047'
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  bannerSubtitle: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '500'
  },
  bannerArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textTertiary,
    marginLeft: 4
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  navHeaderBackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#334155'
  },
  navHeaderBackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  navHeaderInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  navHeaderDest: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  navHeaderStats: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  navHeaderExitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#DC2626'
  },
  navHeaderExitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  fullscreenTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '700',
    color: Colors.textSecondary
  },
  floatingRouteCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10
  }
});
