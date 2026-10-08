import { StationService } from './services/stationService';
import { AssistantService } from './tools/assistantService';

async function runTests() {
  console.log('=== RUNNING BACKEND UNIT & INTEGRATION TESTS ===');
  const stationService = new StationService();
  const assistantService = new AssistantService(stationService);

  // 1. Station Overview
  const overview = stationService.getStationOverview();
  console.log(`[PASS] Station: ${overview.stationName} (${overview.totalPlatforms} platforms, ${overview.totalNodes} nodes)`);
  if (overview.totalPlatforms !== 10) throw new Error('Expected 10 platforms');

  // 2. Platform 8 Lookup
  const p8 = stationService.getPlatformById('platform_8');
  console.log(`[PASS] Platform 8: ${p8.name} at center (${p8.center.x}, ${p8.center.y})`);
  if (!p8) throw new Error('Platform 8 lookup failed');

  // 3. Wheelchair Route to Platform 8
  const wcRoute = stationService.router.findRoute('node_entry_t1_main_east', 'node_pf8_center', 'mobility_disabled');
  if (!wcRoute || !wcRoute.accessibility.wheelchairAccessible) throw new Error('Wheelchair route failed');
  console.log(`[PASS] Wheelchair route to PF8: ${wcRoute.totalDistanceMeters}m, step-free: ${wcRoute.accessibility.stepFree}`);

  // 4. Dynamic Rerouting on Lift Blockage
  const reroute = stationService.router.findRoute(
    'node_entry_t1_main_east',
    'node_pf8_center',
    'mobility_disabled',
    ['vc_edge_metro_to_pf7_8', 'vc_edge_metro_to_pf7_8_rev', 'vc_edge_lift1', 'vc_edge_lift1_rev']
  );
  if (!reroute || !reroute.accessibility.wheelchairAccessible) throw new Error('Dynamic rerouting failed');
  console.log(`[PASS] Dynamic reroute (Lift 1 blocked) via Ramp: ${reroute.totalDistanceMeters}m`);

  // 5. Nearest Facility: Toilet
  const nearestToilet = stationService.findNearestFacility('node_entry_t1_main_east', 'TOILET', 'first_time');
  if (!nearestToilet) throw new Error('Nearest toilet search failed');
  console.log(`[PASS] Nearest toilet: ${nearestToilet.facility.name} (${nearestToilet.distance}m)`);

  // 6. QR Checkpoint Resolution
  const cp = stationService.resolveCheckpoint('QR-KSR-T1-MAIN');
  if (!cp || !cp.matchedNode) throw new Error('QR Checkpoint resolution failed');
  console.log(`[PASS] QR Checkpoint resolved: ${cp.checkpoint.name} -> Node: ${cp.matchedNode.id}`);

  // 7. Grounded Assistant Intent Processing
  const chatReply = await assistantService.processUserMessage("I'm in a wheelchair. How do I get to Platform 8?");
  console.log(`[PASS] Assistant reply: "${chatReply.reply.substring(0, 80)}..."`);
  if (!chatReply.route || !chatReply.route.accessibility.wheelchairAccessible) throw new Error('Assistant route generation failed');

  console.log('\n====================================================');
  console.log('✅ ALL BACKEND AND ROUTING TESTS PASSED (7/7)!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
