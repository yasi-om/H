export type StationName =
  | 'Kampala Headquarters'
  | 'Malaba Border Post'
  | 'Tororo Station'
  | 'Jinja Terminal'
  | 'Gulu Depot'
  | 'Port Bell Pier';

export type TicketCategory =
  | 'Signaling & Track Control'
  | 'VHF Radio & Telecommunications'
  | 'Ticketing & Passenger POS'
  | 'Fiber Backbone & LAN'
  | 'Freight Database & Logistics'
  | 'General Office IT';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'End User' | 'IT Staff' | 'Administrator';

export type TicketStatus = 'Open' | 'In Progress' | 'SOP Applied' | 'Resolved';

export interface TicketLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  message: string;
}

export interface Ticket {
  id: string;
  title: string;
  station: StationName;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  reporter: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  logs: TicketLog[];
  appliedSopId?: string;
  completedSteps?: string[]; // tracks progress of applied SOP steps
  resolutionNotes?: string;
}

export interface SOP {
  id: string;
  code: string;
  title: string;
  category: TicketCategory;
  description: string;
  steps: string[];
  precautions: string[];
  estimatedMinutes: number;
}

export interface ITAsset {
  id: string;
  name: string;
  station: StationName;
  ipAddress: string;
  type: 'Router' | 'Server' | 'Signaling Panel' | 'Radio Repeater' | 'POS Terminal';
  status: 'Online' | 'Offline' | 'Degraded';
  lastPing: string;
}

export interface StationSystemStatus {
  name: StationName;
  code: string;
  coordinates: { x: number; y: number }; // percentages for visual network map representation
  status: 'Healthy' | 'Warning' | 'Disrupted';
  activeTicketsCount: number;
}
