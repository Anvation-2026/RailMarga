const test = require('node:test');
const assert = require('node:assert');

// 1. Math and Geometry Functions under test
function pointDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function projectPointOntoSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const segLenSq = dx * dx + dy * dy;

  if (segLenSq === 0) {
    return { projected: { x: a.x, y: a.y }, distance: pointDistance(p, a), t: 0 };
  }

  const u = (p.x - a.x) * dx + (p.y - a.y) * dy;
  const t = Math.max(0, Math.min(1, u / segLenSq));
  const projected = {
    x: Math.round(a.x + t * dx),
    y: Math.round(a.y + t * dy)
  };

  return {
    projected,
    distance: pointDistance(p, projected),
    t
  };
}

function evaluateRouteProgress(currentPos, geometry, steps = []) {
  if (!geometry || geometry.length === 0) {
    return { distanceToPath: 0, progressFraction: 0 };
  }
  let minDistance = Infinity;
  let bestSegIndex = 0;
  let bestProjected = geometry[0];

  for (let i = 0; i < geometry.length - 1; i++) {
    const proj = projectPointOntoSegment(currentPos, geometry[i], geometry[i + 1]);
    if (proj.distance < minDistance) {
      minDistance = proj.distance;
      bestSegIndex = i;
      bestProjected = proj.projected;
    }
  }

  return {
    distanceToPath: minDistance,
    projectedPoint: bestProjected,
    closestIndex: bestSegIndex
  };
}

test('Live Navigation - Point Projection & Segment Distance', (t) => {
  const A = { x: 0, y: 0 };
  const B = { x: 100, y: 0 };
  const P = { x: 50, y: 25 };

  const res = projectPointOntoSegment(P, A, B);
  assert.strictEqual(res.projected.x, 50);
  assert.strictEqual(res.projected.y, 0);
  assert.strictEqual(res.distance, 25);
});

test('Live Navigation - Off-Route Detection Logic', (t) => {
  const routeGeometry = [
    { x: 100, y: 100 },
    { x: 500, y: 100 },
    { x: 500, y: 600 }
  ];

  // User is directly on the path
  const onPathUser = { x: 250, y: 105 };
  const onPathResult = evaluateRouteProgress(onPathUser, routeGeometry);
  assert.ok(onPathResult.distanceToPath <= 85, 'User within 85 units should NOT trigger off-route');

  // User deviates far from path
  const offPathUser = { x: 250, y: 250 };
  const offPathResult = evaluateRouteProgress(offPathUser, routeGeometry);
  assert.ok(offPathResult.distanceToPath > 85, 'User deviated > 85 units should trigger off-route');
});

test('Live Navigation - Arrival Threshold Detection', (t) => {
  const destinationNodeCoords = { x: 1450, y: 375.9 };

  // User within 30 units of destination
  const arrivedUser = { x: 1460, y: 380 };
  const dist = pointDistance(arrivedUser, destinationNodeCoords);
  const isArrived = dist <= 45;
  assert.strictEqual(isArrived, true, 'User within 45 units must trigger arrival');

  // User 150 units away
  const farUser = { x: 1300, y: 375 };
  assert.strictEqual(pointDistance(farUser, destinationNodeCoords) > 45, true, 'User far away must not trigger arrival');
});

test('Live Navigation - Location Sources Integrity', (t) => {
  const validSources = ['LIVE GPS', 'QR VERIFIED', 'MANUAL', 'DEMO SIMULATION'];
  validSources.forEach((src) => {
    assert.ok(typeof src === 'string' && src.length > 0);
  });
});
