import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Ticket, SOP, ITAsset, StationSystemStatus, TicketLog } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Seed Data
let tickets: Ticket[] = [
  {
    id: 'URC-TKT-1001',
    title: 'Inter-Station Signaling Failure between Tororo and Malaba',
    station: 'Malaba Border Post',
    category: 'Signaling & Track Control',
    priority: 'Critical',
    status: 'Open',
    description: 'Automatic block signaling circuit dropped. Section 4A track relay is not reporting telemetry. Visual check shows flashing red on signal block TR-41. Main dispatch radio communication is functional but signal interlocks are completely unresponsive. Freight train #402 is currently halted at Tororo siding awaiting clearance.',
    reporter: 'Sande Mulondo (Section Officer)',
    assignedTo: 'Nalule Patricia (Lead Signaling Eng.)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hrs ago
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    logs: [
      {
        id: 'L1',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        user: 'Sande Mulondo',
        action: 'Created Ticket',
        message: 'Incident reported following a voltage drop on signaling circuit #12. Train dispatch halted.',
      },
      {
        id: 'L2',
        timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
        user: 'System Dispatcher',
        action: 'Assigned Technician',
        message: 'Ticket assigned to Nalule Patricia as standard first responder.',
      }
    ]
  },
  {
    id: 'URC-TKT-1002',
    title: 'POS Ticketing Software Crash on Terminal 2',
    station: 'Kampala Headquarters',
    category: 'Ticketing & Passenger POS',
    priority: 'High',
    status: 'In Progress',
    description: 'Passenger ticket sales terminal 2 crashed during peak morning booking. Error display: "FATAL: connection to database failed." The local PostgreSQL service appears locked or the terminal client cannot reach the Kampala Central DB cluster. Cashier cannot issue printed QR tickets. High passenger queues forming at Kampala lobby.',
    reporter: 'Okot Emmanuel (Ticketing Supervisor)',
    assignedTo: 'Katushabe Davis (Systems Eng.)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    logs: [
      {
        id: 'L3',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        user: 'Okot Emmanuel',
        action: 'Created Ticket',
        message: 'Terminal 2 unresponsive. Diverted passengers to Terminal 1 but queue is expanding.',
      },
      {
        id: 'L4',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        user: 'Katushabe Davis',
        action: 'Status Updated',
        message: 'Investigation started. Tested network cabling; hardware link is active. Accessing terminal system logs.',
      }
    ]
  },
  {
    id: 'URC-TKT-1003',
    title: 'VHF Trunked Dispatch Radio Noise and Range Drop',
    station: 'Gulu Depot',
    category: 'VHF Radio & Telecommunications',
    priority: 'Medium',
    status: 'Open',
    description: 'Dispatch VHF station is reporting massive static on Channel 3 (Operations-North). Intermittent communications with incoming locomotive crews from Pakwach. Standing Wave Ratio (SWR) alert triggered on mast tower A telemetry panel. Radio range appears degraded to under 5km.',
    reporter: 'Akena Isaac (Radio Controller)',
    assignedTo: 'Unassigned',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hrs ago
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    logs: [
      {
        id: 'L5',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        user: 'Akena Isaac',
        action: 'Created Ticket',
        message: 'Heavy rain in Gulu might have affected antenna coax cabling. SWR alert active.',
      }
    ]
  },
  {
    id: 'URC-TKT-1004',
    title: 'Fiber Backbone Cut Near Jinja Bridge Siding',
    station: 'Jinja Terminal',
    category: 'Fiber Backbone & LAN',
    priority: 'Critical',
    status: 'SOP Applied',
    description: 'Fiber-optic monitoring dashboard indicates zero light transmission between Jinja and Tororo. OTDR test estimates distance to fault at approx 2.4 km east of Jinja bridge. This has severed the direct corporate network and ticketing link for Tororo and Malaba stations, triggering automatic cellular backup routing. Cellular backup is extremely congested.',
    reporter: 'Nsubuga John (Network Administrator)',
    assignedTo: 'Kigozi Ronald (Senior Fiber Tech)',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hrs ago
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    appliedSopId: 'URC-SOP-04',
    completedSteps: ['Step 1: Execute OTDR (Optical Time Domain Reflectometer) test', 'Step 2: Identify distance to fault (DTF)'],
    logs: [
      {
        id: 'L6',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        user: 'Nsubuga John',
        action: 'Created Ticket',
        message: 'Full signal drop on Eastern Fiber loop. Routing switched to fallback radio-link B.',
      },
      {
        id: 'L7',
        timestamp: new Date(Date.now() - 3600000 * 5.5).toISOString(),
        user: 'Kigozi Ronald',
        action: 'SOP Applied',
        message: 'Applied Standard Response SOP-04 (Fiber Backbone Interruption). Handled steps 1 & 2.',
      }
    ]
  }
];

const sops: SOP[] = [
  {
    id: 'URC-SOP-01',
    code: 'URC-SOP-01',
    title: 'Train Control Signaling System Recovery',
    category: 'Signaling & Track Control',
    description: 'Standard emergency procedure for restoring automatic block signaling circuits and interlocking track relays following telemetry loss or physical line interruptions.',
    steps: [
      'Step 1: Verify main electrical breaker panel in station tech cabin is ON and uninterruptible power supply (UPS) is status normal.',
      'Step 2: Perform diagnostic query on signaling controller via Serial-over-IP console interface.',
      'Step 3: Inspect power rails (A and B) on interlocking relays in terminal rack for nominal 24V DC current.',
      'Step 4: Reboot signaling fiber transceiver module at the nearest trackside signaling booth.',
      'Step 5: Coordinate with Central Dispatch Room in Kampala for system handshake and safety loop verification.'
    ],
    precautions: [
      'DO NOT override signaling track interlocks manually unless explicitly authorized in writing by the Chief Railway Operations Officer.',
      'Ensure a minimum of direct UHF Channel 2 radio communication is established with active train operators in the sector before starting diagnostics.'
    ],
    estimatedMinutes: 45
  },
  {
    id: 'URC-SOP-02',
    code: 'URC-SOP-02',
    title: 'POS Ticketing Terminal Recovery Procedure',
    category: 'Ticketing & Passenger POS',
    description: 'Standard procedure for troubleshooting and restoring unresponsive passenger ticketing terminals, localized database connection locks, and printer queue overflows.',
    steps: [
      'Step 1: Verify the local passenger hall network switch is online and displaying flashing link lights.',
      'Step 2: Restart the local POS terminal client engine and clear stale PostgreSQL backend connection locks.',
      'Step 3: Run diagnostic ICMP ping to Kampala Central Ticket Server (IP 10.12.1.45) to ensure routing is operational.',
      'Step 4: Execute a test ticketing transaction utilizing the URC test ledger account #9901.',
      'Step 5: Re-authenticate client SSL security certificate on the terminal software administrative console.'
    ],
    precautions: [
      'Under no circumstances should the local client database cache be cleared or purged before synchronizing offline transaction data, as this will lead to immediate ticket revenue data loss.'
    ],
    estimatedMinutes: 20
  },
  {
    id: 'URC-SOP-03',
    code: 'URC-SOP-03',
    title: 'VHF Trunked Dispatch Radio Outage Remediation',
    category: 'VHF Radio & Telecommunications',
    description: 'Procedure to diagnose high static noise, antenna matching mismatch, and range degradation on URC locomotive operations trunked radio towers.',
    steps: [
      'Step 1: Query battery backup bank status via telemetry console (confirm power levels are above 22.5V DC).',
      'Step 2: Initiate remote warm software restart of the Motorola UHF/VHF base station controller transceiver.',
      'Step 3: Execute a Standing Wave Ratio (SWR) calibration test on the antenna coaxial feed line.',
      'Step 4: If SWR exceeds 2.0, switch active RF feedline to the secondary backup antenna array on the tower.',
      'Step 5: Conduct audio quality loopback check with dispatcher station in Kampala or Gulu Depot.'
    ],
    precautions: [
      'Never operate base station transmitters at full 100W power while SWR levels exceed 2.5 to prevent permanent RF power amplifier transistor burnout.'
    ],
    estimatedMinutes: 30
  },
  {
    id: 'URC-SOP-04',
    code: 'URC-SOP-04',
    title: 'Fiber Backbone Inter-Station Interruption Restore',
    category: 'Fiber Backbone & LAN',
    description: 'Critical action procedure to diagnose fiber-optic physical cable breaks along the railway siding network and activate backup communication routes.',
    steps: [
      'Step 1: Execute OTDR (Optical Time Domain Reflectometer) test from Kampala terminal or closest node.',
      'Step 2: Identify distance to fault (DTF) against railroad kilometer markers to pinpoint break coordinates.',
      'Step 3: Transition non-essential corporate traffic and central dispatch systems to failover Microwave Radio-Link B.',
      'Step 4: Dispatch the trackside maintenance fiber splicing crew to target coordinates with specialized railway vehicle.',
      'Step 5: Splicing crew performs physical fusion splice, seals dome enclosure, and core network routing is restored.'
    ],
    precautions: [
      'Fiber optoelectronic lasers emit highly concentrated invisible light that can cause instant, permanent blindness. Ensure all technicians wear certified laser safety glasses before handling fiber cores.'
    ],
    estimatedMinutes: 120
  },
  {
    id: 'URC-SOP-05',
    code: 'URC-SOP-05',
    title: 'Freight Management System DB Re-Connection Action',
    category: 'Freight Database & Logistics',
    description: 'Procedure for recovering connection links to the central URC Freight Tracking Oracle Database warehouse from regional siding freight terminals.',
    steps: [
      'Step 1: Verify local client DNS configuration and flush local resolver cache (cmd: ipconfig /flushdns).',
      'Step 2: Query active connection pool on regional server gate proxy to isolate port lock issues.',
      'Step 3: Execute remote latency trace route to the Central Freight Warehouse database cluster (IP 10.12.5.10).',
      'Step 4: If proxy gateway is locked, request server administrator to gracefully recycle the database connection pool service.',
      'Step 5: Launch URC Freight client, query customs clearing status API, and verify database write permissions.'
    ],
    precautions: [
      'Do not execute force-restart on the local freight dispatcher workstation while customs transit lock operations are writing to prevent state mismatch.'
    ],
    estimatedMinutes: 25
  }
];

let assets: ITAsset[] = [
  { id: 'URC-AST-201', name: 'Kampala Core Router (Cisco 4331)', station: 'Kampala Headquarters', ipAddress: '10.12.1.1', type: 'Router', status: 'Online', lastPing: '0.8ms' },
  { id: 'URC-AST-202', name: 'Central Ticketing DB Server (ProLiant)', station: 'Kampala Headquarters', ipAddress: '10.12.1.45', type: 'Server', status: 'Online', lastPing: '1.2ms' },
  { id: 'URC-AST-203', name: 'Jinja Fiber Switch (Catalyst 3850)', station: 'Jinja Terminal', ipAddress: '10.12.2.10', type: 'Router', status: 'Online', lastPing: '8.4ms' },
  { id: 'URC-AST-204', name: 'Tororo Signal Interlock Controller', station: 'Tororo Station', ipAddress: '10.12.3.15', type: 'Signaling Panel', status: 'Online', lastPing: '12.1ms' },
  { id: 'URC-AST-205', name: 'Malaba Signaling Interlock A', station: 'Malaba Border Post', ipAddress: '10.12.4.22', type: 'Signaling Panel', status: 'Offline', lastPing: 'Request Timeout' },
  { id: 'URC-AST-206', name: 'Malaba VHF Base Radio (Motorola)', station: 'Malaba Border Post', ipAddress: '10.12.4.5', type: 'Radio Repeater', status: 'Online', lastPing: '15.2ms' },
  { id: 'URC-AST-207', name: 'Gulu Base UHF Dispatcher', station: 'Gulu Depot', ipAddress: '10.12.6.2', type: 'Radio Repeater', status: 'Degraded', lastPing: '98.5ms (High Packet Loss)' },
  { id: 'URC-AST-208', name: 'Port Bell Harbor Gateway Switch', station: 'Port Bell Pier', ipAddress: '10.12.5.1', type: 'Router', status: 'Online', lastPing: '4.5ms' },
  { id: 'URC-AST-209', name: 'Kampala POS Terminal 2 Unit', station: 'Kampala Headquarters', ipAddress: '10.12.1.112', type: 'POS Terminal', status: 'Degraded', lastPing: 'Host Unreachable' },
];

const stations: StationSystemStatus[] = [
  { name: 'Kampala Headquarters', code: 'KLA', coordinates: { x: 25, y: 70 }, status: 'Warning', activeTicketsCount: 1 },
  { name: 'Port Bell Pier', code: 'PBL', coordinates: { x: 22, y: 82 }, status: 'Healthy', activeTicketsCount: 0 },
  { name: 'Jinja Terminal', code: 'JJA', coordinates: { x: 45, y: 65 }, status: 'Warning', activeTicketsCount: 1 },
  { name: 'Tororo Station', code: 'TTO', coordinates: { x: 72, y: 60 }, status: 'Healthy', activeTicketsCount: 0 },
  { name: 'Malaba Border Post', code: 'MBA', coordinates: { x: 88, y: 55 }, status: 'Disrupted', activeTicketsCount: 1 },
  { name: 'Gulu Depot', code: 'GLU', coordinates: { x: 40, y: 20 }, status: 'Warning', activeTicketsCount: 1 },
];

// Deep copies of seeds for administrative database resets
const initialTicketsSeed = JSON.parse(JSON.stringify(tickets));
const initialAssetsSeed = JSON.parse(JSON.stringify(assets));

// 1. GET ALL TICKETS
app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

// 2. CREATE TICKET
app.post('/api/tickets', (req, res) => {
  const { title, station, category, priority, description, reporter } = req.body;
  if (!title || !station || !category || !priority || !description || !reporter) {
    return res.status(400).json({ error: 'Missing required ticket fields' });
  }

  const newTicketId = `URC-TKT-${1000 + tickets.length + 1}`;
  const newTicket: Ticket = {
    id: newTicketId,
    title,
    station,
    category,
    priority,
    status: 'Open',
    description,
    reporter,
    assignedTo: 'Unassigned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [
      {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: reporter,
        action: 'Created Ticket',
        message: 'New incident logged in database.',
      }
    ]
  };

  tickets.unshift(newTicket);
  res.status(201).json(newTicket);
});

// 3. GET SINGLE TICKET
app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

// 4. UPDATE TICKET
app.put('/api/tickets/:id', (req, res) => {
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const existingTicket = tickets[ticketIndex];
  const { status, assignedTo, appliedSopId, completedSteps, resolutionNotes, logMessage, user } = req.body;

  const updatedTicket: Ticket = {
    ...existingTicket,
    updatedAt: new Date().toISOString(),
  };

  const logs: TicketLog[] = [...existingTicket.logs];

  if (status && status !== existingTicket.status) {
    updatedTicket.status = status;
    logs.push({
      id: `LOG-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      user: user || 'Operator',
      action: 'Status Updated',
      message: `Ticket status transition from "${existingTicket.status}" to "${status}".`,
    });
  }

  if (assignedTo && assignedTo !== existingTicket.assignedTo) {
    updatedTicket.assignedTo = assignedTo;
    logs.push({
      id: `LOG-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      user: user || 'Operator',
      action: 'Assigned Operator',
      message: `Assigned technical dispatcher updated to: ${assignedTo}.`,
    });
  }

  if (appliedSopId !== undefined) {
    updatedTicket.appliedSopId = appliedSopId;
    if (appliedSopId) {
      const sop = sops.find(s => s.id === appliedSopId);
      logs.push({
        id: `LOG-${Date.now()}-3`,
        timestamp: new Date().toISOString(),
        user: user || 'Operator',
        action: 'SOP Applied',
        message: `Standard Operating Procedure "${sop ? sop.title : appliedSopId}" has been linked to this incident.`,
      });
    } else {
      logs.push({
        id: `LOG-${Date.now()}-4`,
        timestamp: new Date().toISOString(),
        user: user || 'Operator',
        action: 'SOP Removed',
        message: `Standard Operating Procedure unlinked.`,
      });
    }
  }

  if (completedSteps !== undefined) {
    updatedTicket.completedSteps = completedSteps;
  }

  if (resolutionNotes !== undefined) {
    updatedTicket.resolutionNotes = resolutionNotes;
  }

  if (logMessage) {
    logs.push({
      id: `LOG-${Date.now()}-5`,
      timestamp: new Date().toISOString(),
      user: user || 'Operator',
      action: 'Note Added',
      message: logMessage,
    });
  }

  updatedTicket.logs = logs;
  tickets[ticketIndex] = updatedTicket;

  res.json(updatedTicket);
});

// 5. GET SOPS
app.get('/api/sops', (req, res) => {
  res.json(sops);
});

// 6. GET ASSETS
app.get('/api/assets', (req, res) => {
  res.json(assets);
});

// 7. PING/DIAGNOSE ASSET
app.post('/api/assets/:id/ping', (req, res) => {
  const assetIndex = assets.findIndex(a => a.id === req.params.id);
  if (assetIndex === -1) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const asset = assets[assetIndex];
  
  // Simulate network latency and response
  let status: 'Online' | 'Offline' | 'Degraded' = 'Online';
  let latency = '8.5ms';
  let logs: string[] = [];

  if (asset.id === 'URC-AST-205') { // Malaba signaling Panel (Offline)
    // Random 10% chance to recover if they pinged, but let's keep it simulated
    status = 'Offline';
    latency = 'Request Timeout';
    logs = [
      'PING 10.12.4.22 with 32 bytes of data:',
      'Request timed out.',
      'Request timed out.',
      'Request timed out.',
      'Request timed out.',
      'Ping statistics for 10.12.4.22: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)',
      'DIAGNOSIS: Main circuit breaker telemetry indicates a power supply drop. Fiber transceiver link state is DOWN.'
    ];
  } else if (asset.id === 'URC-AST-209') { // Kampala POS Terminal 2 (Degraded)
    status = 'Degraded';
    latency = 'Host Unreachable';
    logs = [
      'PING 10.12.1.112 with 32 bytes of data:',
      'Reply from 10.12.1.1: Destination host unreachable.',
      'Reply from 10.12.1.1: Destination host unreachable.',
      'Reply from 10.12.1.1: Destination host unreachable.',
      'Reply from 10.12.1.1: Destination host unreachable.',
      'Ping statistics for 10.12.1.112: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)',
      'DIAGNOSIS: Terminal is powered on but blocked by active lock-table mutex on central Postgres cluster.'
    ];
  } else if (asset.id === 'URC-AST-207') { // Gulu Repeater
    status = 'Degraded';
    latency = '182ms (High Jitter)';
    logs = [
      'PING 10.12.6.2 with 32 bytes of data:',
      'Reply from 10.12.6.2: bytes=32 time=95ms TTL=64',
      'Reply from 10.12.6.2: bytes=32 time=310ms TTL=64',
      'Request timed out.',
      'Reply from 10.12.6.2: bytes=32 time=142ms TTL=64',
      'Ping statistics for 10.12.6.2: Packets: Sent = 4, Received = 3, Lost = 1 (25% loss)',
      'DIAGNOSIS: Voltage telemetry on antenna preamp shows SWR mismatch (value = 2.4). Highly degraded RF line.'
    ];
  } else {
    latency = `${(Math.random() * 5 + 0.5).toFixed(1)}ms`;
    status = 'Online';
    logs = [
      `PING ${asset.ipAddress} with 32 bytes of data:`,
      `Reply from ${asset.ipAddress}: bytes=32 time=${latency} TTL=64`,
      `Reply from ${asset.ipAddress}: bytes=32 time=${latency} TTL=64`,
      `Reply from ${asset.ipAddress}: bytes=32 time=${latency} TTL=64`,
      `Reply from ${asset.ipAddress}: bytes=32 time=${latency} TTL=64`,
      `Ping statistics: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`,
      `DIAGNOSIS: Asset is fully responsive. Routing tables and interfaces normal.`
    ];
  }

  // Update in-memory state
  assets[assetIndex].status = status;
  assets[assetIndex].lastPing = latency;

  res.json({
    asset: assets[assetIndex],
    pingOutput: logs,
  });
});

// 8. GEMINI AI DIAGNOSTICS & RESOLUTION SUGGESTION
app.post('/api/tickets/:id/ai-diagnose', async (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (!ai) {
    // If no API key is set up, fallback gracefully to static but detailed mock response
    return res.json({
      suggestion: `### URC IT Helpdesk AI Assistant (Offline Mode)

We noticed that the Gemini API Key is not configured in secrets. Here is the local standard troubleshooting guidance for **${ticket.category}**:

1. **Verify Siding Hardware**: Inspect station cabinet patch panels. Many rural stations experience moisture buildup on transceivers.
2. **Review Incident Description**: "${ticket.description.slice(0, 80)}..."
3. **Recommended Procedure**: Apply **SOP-0${ticket.category.includes('Signaling') ? '1' : ticket.category.includes('Ticketing') ? '2' : ticket.category.includes('Radio') ? '3' : '4'}** immediately.
4. **Local Telecom Advisory**: Ensure backup VHF communication links are fully activated before disabling current fiber modules.`,
      modelUsed: 'Static Rules Engine'
    });
  }

  try {
    const matchedSops = sops.filter(s => s.category === ticket.category);
    const sopsContextString = JSON.stringify(matchedSops, null, 2);

    const systemPrompt = `You are the lead AI Systems Architect for the Uganda Railway Corporation (URC) IT Department. 
Your objective is to provide elite technical troubleshooting procedures, diagnostics, and action steps for URC technicians operating on the Ugandan rail network.
You must analyze the incoming incident ticket and recommend a detailed resolution playbook.
Use professional, exact, railway-grade network engineering terminology.
Always base your troubleshooting steps on the following standard URC Operating Procedures (SOPs) if they match the ticket category, but augment them with custom diagnostic questions and safety protocols specific to the incident details:

${sopsContextString}

Refer to specific Ugandan rail siding stations, locations, or equipment where appropriate (e.g., Kampala central routing, Jinja fiber loop, Tororo border junctions, Gulu dry port lines, Malaba standard gauge integration).
Structure your response cleanly using Markdown:
- **Playbook Overview**: High-level analysis of the failure and root causes (such as signaling relays, fiber attenuations, database transaction locking, microwave backups).
- **Step-by-Step Remediation Plan**: Clear, actionable instructions for trackside or terminal technicians.
- **Safety & Railway Safety Warnings**: Mandatory safety notes (train control system integrity, optical lasers, RF radiation, high voltage block interlocks).
- **Suggested Communications Log Entry**: A short, professional progress note that the technician can copy-paste into the URC database system logs.`;

    const ticketDetailPrompt = `
TICKET DETAILS:
- Ticket ID: ${ticket.id}
- Title: ${ticket.title}
- Station: ${ticket.station}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Description: ${ticket.description}
- Active Logs: ${JSON.stringify(ticket.logs, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: ticketDetailPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    const suggestionText = response.text || "No diagnostics generated. Please verify parameters.";
    res.json({
      suggestion: suggestionText,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (error: any) {
    console.error('Gemini call failed:', error);
    res.status(500).json({ error: 'Failed to query AI Assistant: ' + error.message });
  }
});

// 9. ADMIN DATABASE RESET
app.post('/api/admin/reset', (req, res) => {
  tickets = JSON.parse(JSON.stringify(initialTicketsSeed));
  assets = JSON.parse(JSON.stringify(initialAssetsSeed));
  
  // Re-timestamp relative to current local time for fresh presentation
  tickets.forEach((t, i) => {
    t.createdAt = new Date(Date.now() - 3600000 * (i + 1.5)).toISOString();
    t.updatedAt = new Date(Date.now() - 3600000 * (i + 1.5)).toISOString();
    t.logs.forEach((log, logIdx) => {
      log.timestamp = new Date(Date.now() - 3600000 * (i + 1.5) - 600000 * (logIdx + 1)).toISOString();
    });
  });

  res.json({ success: true, tickets, assets });
});

// 10. ADMIN INCIDENT SIMULATOR
app.post('/api/admin/simulate', (req, res) => {
  const { type } = req.body;
  if (type === 'malaba-outage') {
    // 1. Force Malaba Signaling Panel Offline
    const assetIdx = assets.findIndex(a => a.id === 'URC-AST-205');
    if (assetIdx !== -1) {
      assets[assetIdx].status = 'Offline';
      assets[assetIdx].lastPing = 'Request Timeout';
    }

    // 2. Generate corresponding Critical ticket if not present
    const ticketExists = tickets.some(t => t.title.includes('MALABA-OUTAGE'));
    if (!ticketExists) {
      const newTktId = `URC-TKT-${1000 + tickets.length + 1}`;
      const newTkt: Ticket = {
        id: newTktId,
        title: 'MALABA-OUTAGE: Signaling power relay failure on Eastern Siding Block A',
        station: 'Malaba Border Post',
        category: 'Signaling & Track Control',
        priority: 'Critical',
        status: 'Open',
        description: 'System-wide telemetry drop reported on Malaba Border Post signaling network. Interlocking relay panel URC-AST-205 stopped responding to keepalive heartbeat pings. Main rail operations on the Eastern border siding are blocked. Urgent physical response required to inspect trackside power modules.',
        reporter: 'Automatic Telemetry Daemon',
        assignedTo: 'Unassigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: 'System Monitor',
            action: 'Automated Alert',
            message: 'CRITICAL ALERT: Malaba Siding Signaling relay unit lost connection. Block interlock state is LOCKED.'
          }
        ]
      };
      tickets.unshift(newTkt);
    }
  } else if (type === 'kampala-pos-crash') {
    // 1. Force Kampala POS Terminal 2 Offline
    const assetIdx = assets.findIndex(a => a.id === 'URC-AST-209');
    if (assetIdx !== -1) {
      assets[assetIdx].status = 'Offline';
      assets[assetIdx].lastPing = 'Host Unreachable';
    }

    // 2. Generate ticket if not present
    const ticketExists = tickets.some(t => t.title.includes('KAMPALA-CRASH'));
    if (!ticketExists) {
      const newTktId = `URC-TKT-${1000 + tickets.length + 1}`;
      const newTkt: Ticket = {
        id: newTktId,
        title: 'KAMPALA-CRASH: PostgreSQL transaction lock contention on central DB cluster',
        station: 'Kampala Headquarters',
        category: 'Ticketing & Passenger POS',
        priority: 'High',
        status: 'Open',
        description: 'Passenger Terminal POS-2 (URC-AST-209) is locked up and displaying database connection timeouts. Diagnostics indicate an active lock contention table lock on the ticketing PostgreSQL service. Booking queues are starting to stack in the main lobby.',
        reporter: 'Automatic Telemetry Daemon',
        assignedTo: 'Unassigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: 'System Monitor',
            action: 'Automated Alert',
            message: 'ALERT: Deadlock detected on POS transaction tables. Terminating idle sessions.'
          }
        ]
      };
      tickets.unshift(newTkt);
    }
  }

  res.json({ success: true, tickets, assets });
});

// Setup Vite Dev Server / Serve Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`URC IT Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
