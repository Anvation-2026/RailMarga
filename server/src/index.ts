import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { StationService } from './services/stationService';
import { AssistantService } from './tools/assistantService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize core services
const stationService = new StationService();
const assistantService = new AssistantService(stationService);

// 1. GET /api/station
app.get('/api/station', (req: Request, res: Response) => {
  res.json(stationService.getStationOverview());
});

// 2. GET /api/platforms
app.get('/api/platforms', (req: Request, res: Response) => {
  res.json(stationService.getPlatforms());
});

// 3. GET /api/facilities
app.get('/api/facilities', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const wheelchairOnly = req.query.wheelchair === 'true';
  res.json(stationService.getFacilities(category, wheelchairOnly));
});

// 4. GET /api/nodes
app.get('/api/nodes', (req: Request, res: Response) => {
  res.json(stationService.getNodes());
});

// 5. GET & POST /api/status
app.get('/api/status', (req: Request, res: Response) => {
  res.json(stationService.getStatus());
});

app.post('/api/status', (req: Request, res: Response) => {
  const { facilityId, status } = req.body;
  if (!facilityId || !status) {
    return res.status(400).json({ error: 'facilityId and status are required' });
  }
  const updated = stationService.setStatus(facilityId, status);
  res.json({ success: true, status: updated });
});

// 6. POST /api/route
app.post('/api/route', (req: Request, res: Response) => {
  const { startNodeId, destinationNodeId, profileId, blockedIds } = req.body;
  if (!startNodeId || !destinationNodeId) {
    return res.status(400).json({ error: 'startNodeId and destinationNodeId are required' });
  }
  const route = stationService.router.findRoute(
    startNodeId,
    destinationNodeId,
    profileId || 'first_time',
    blockedIds || []
  );
  if (!route) {
    return res.status(404).json({
      error: 'No accessible route found',
      message: 'No route available satisfying the specified constraints.'
    });
  }
  res.json(route);
});

// 7. POST /api/reroute
app.post('/api/reroute', (req: Request, res: Response) => {
  const { startNodeId, destinationNodeId, profileId, blockedLocationId } = req.body;
  if (!startNodeId || !destinationNodeId || !blockedLocationId) {
    return res.status(400).json({ error: 'startNodeId, destinationNodeId, and blockedLocationId are required' });
  }
  // Block both the element and its reverse
  const blocked = [blockedLocationId, `${blockedLocationId}_rev`];
  const route = stationService.router.findRoute(
    startNodeId,
    destinationNodeId,
    profileId || 'first_time',
    blocked
  );
  if (!route) {
    return res.status(404).json({
      error: 'No alternative route found',
      message: 'No accessible alternative route exists around the blocked location.'
    });
  }
  res.json({
    rerouted: true,
    blockedLocation: blockedLocationId,
    route
  });
});

// 8. POST /api/assistant
app.post('/api/assistant', async (req: Request, res: Response) => {
  const { message, currentNodeId, profileId, activeRoute } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const response = await assistantService.processUserMessage(message, {
      currentNodeId,
      profileId,
      activeRoute
    });
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'Assistant processing error', details: err.message });
  }
});

// 9. POST /api/checkpoint
app.post('/api/checkpoint', (req: Request, res: Response) => {
  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ error: 'qrCode is required' });
  }
  const resolved = stationService.resolveCheckpoint(qrCode);
  if (!resolved) {
    return res.status(404).json({ error: 'Invalid QR Checkpoint', message: 'Checkpoint code not recognized.' });
  }
  res.json(resolved);
});

// 10. GET /api/location/:id
app.get('/api/location/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const platform = stationService.getPlatformById(id);
  if (platform) return res.json({ type: 'PLATFORM', data: platform });

  const facility = stationService.getFacilityById(id);
  if (facility) return res.json({ type: 'FACILITY', data: facility });

  const node = stationService.router.nodeDict.get(id);
  if (node) return res.json({ type: 'NODE', data: node });

  res.status(404).json({ error: 'Location not found' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RailMarga API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚆 RailMarga Backend Server running on port ${PORT}`);
  console.log(`====================================================`);
});
