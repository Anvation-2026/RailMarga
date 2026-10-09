import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { FacilityFinderScreen } from './src/screens/FacilityFinderScreen';
import { PlatformDetailScreen } from './src/screens/PlatformDetailScreen';
import { QrScanScreen } from './src/screens/QrScanScreen';
import { BottomNavBar, TabKey } from './src/components/BottomNavBar';
import { useNavigationStore } from './src/store/navigationStore';
import { RouteResult } from './src/services/localRouter';

type ScreenName = 'home' | 'assistant' | 'facilities' | 'platformDetail' | 'qrScan';

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);

  const { startNavigation, setDestinationNode, isNavigating } = useNavigationStore();

  const handleStartRouteFromAssistant = (route: RouteResult) => {
    setDestinationNode(route.destination);
    startNavigation(route);
    setCurrentScreen('home');
  };

  const activeTab: TabKey =
    currentScreen === 'home'
      ? 'home'
      : currentScreen === 'facilities'
      ? 'facilities'
      : currentScreen === 'assistant'
      ? 'assistant'
      : currentScreen === 'qrScan'
      ? 'qrScan'
      : 'home';

  const handleSelectTab = (tab: TabKey) => {
    setCurrentScreen(tab);
  };

  const showBottomBar = !isDesktop && !isNavigating && currentScreen !== 'platformDetail';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={styles.screenContent}>
        {/* Keep HomeScreen continuously mounted so heavy station CAD vectors are parsed once */}
        <View style={[styles.screenWrapper, currentScreen !== 'home' && styles.hiddenScreen]}>
          <HomeScreen
            onOpenAssistant={() => setCurrentScreen('assistant')}
            onOpenFacilities={() => setCurrentScreen('facilities')}
            onOpenPlatformDetail={(platform) => {
              setSelectedPlatform(platform);
              setCurrentScreen('platformDetail');
            }}
            onOpenQrScan={() => setCurrentScreen('qrScan')}
          />
        </View>

        {/* Secondary tab & modal screens */}
        {currentScreen === 'assistant' && (
          <View style={styles.screenWrapper}>
            <AssistantChatScreen
              onBack={() => setCurrentScreen('home')}
              onStartRoute={handleStartRouteFromAssistant}
            />
          </View>
        )}

        {currentScreen === 'facilities' && (
          <View style={styles.screenWrapper}>
            <FacilityFinderScreen
              onBack={() => setCurrentScreen('home')}
              onNavigateToFacility={() => setCurrentScreen('home')}
            />
          </View>
        )}

        {currentScreen === 'platformDetail' && (
          <View style={styles.screenWrapper}>
            <PlatformDetailScreen
              platform={selectedPlatform}
              onBack={() => setCurrentScreen('home')}
              onStartNavigate={() => setCurrentScreen('home')}
              onAskAssistant={() => setCurrentScreen('assistant')}
            />
          </View>
        )}

        {currentScreen === 'qrScan' && (
          <View style={styles.screenWrapper}>
            <QrScanScreen
              onBack={() => setCurrentScreen('home')}
              onLocationUpdated={() => setCurrentScreen('home')}
            />
          </View>
        )}
      </View>
      {showBottomBar && (
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  screenContent: {
    flex: 1,
    position: 'relative'
  },
  screenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  hiddenScreen: {
    display: 'none'
  }
});
