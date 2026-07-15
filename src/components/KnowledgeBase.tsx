import React, { useState } from 'react';
import { 
  Search, BookOpen, Key, Printer, HardDrive, ShieldCheck, Mail, 
  CheckCircle, ChevronRight, HelpCircle, AlertCircle, Copy, Check 
} from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  category: 'Credentials' | 'Hardware' | 'Software' | 'Network' | 'Email';
  icon: React.ComponentType<any>;
  summary: string;
  causes: string[];
  steps: string[];
  tips: string[];
}

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeArticleId, setActiveArticleId] = useState<string>('KB-101');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const articles: KBArticle[] = [
    {
      id: 'KB-101',
      title: 'Active Directory Account Lockout & Password Reset',
      category: 'Credentials',
      icon: Key,
      summary: 'Guidance on identifying, unlocking, and resetting locked active directory credentials for locomotive crews and station staff after multiple incorrect terminal entries.',
      causes: [
        'Locomotive crews inputting stale passwords on cabin telemetry terminals.',
        'Stale credentials cached in regional station POS hardware.',
        'Active sync failures on URC mobile dispatcher tablets.'
      ],
      steps: [
        'Request the user\'s official URC Employee ID Number and verify their department (e.g. Traffic, Maintenance, Operations).',
        'Verify the user\'s identity by confirming their registered Siding Location and supervisor name.',
        'Open the Active Directory Administrative Center (ADAC) or query the domain controller from the terminal.',
        'Locate the user account using the format: "urc\\username" and check the "Account is locked out" state.',
        'Select "Unlock Account". If a password reset is requested, generate a temporary password adhering to corporate rules: minimum 12 characters, including capital letters, digits, and railway-approved symbols (e.g., #, $, @).',
        'Instruct the user to logon using the temporary credentials and immediately complete the mandatory self-service credential update.'
      ],
      tips: [
        'Remind crew members that terminal security locks trigger automatically after 5 consecutive failed login attempts.',
        'Temporary passwords expire strictly within 24 hours if not updated.'
      ]
    },
    {
      id: 'KB-102',
      title: 'Network QR Ticket & POS Slip Printer Connection Setup',
      category: 'Hardware',
      icon: Printer,
      summary: 'Step-by-step mapping of thermal ticket printers at passenger ticket terminals (Kampala, Jinja, Tororo) to guarantee continuous QR barcode receipt printing.',
      causes: [
        'Power fluctuations causing printers to drop local IP leases.',
        'Print spooler service crashes on the local Windows/Linux terminal unit.',
        'USB-to-Serial converter cable loose in terminal COM port.'
      ],
      steps: [
        'Confirm the physical connection: verify the Epson/Zebra thermal printer is powered ON, paper feed is green, and no red error indicators are active.',
        'Identify the static IP address assigned to the ticket printer (consult the URC IP Asset Matrix, typically in the range of 10.12.x.150 - 10.12.x.199).',
        'On the POS workstation, open the Control Panel, go to "Printers and Scanners", and select "Add a printer".',
        'Select "The printer that I want isn\'t listed", choose "Add a printer using an IP address or hostname", and input the printer\'s designated IP.',
        'Select the appropriate manufacturer driver (Zebra ZPL or Epson ESC/POS) from the local storage driver cache.',
        'Open the Windows Command Prompt as Administrator and execute "net stop spooler" followed by "net start spooler" to recycle the local queue.',
        'Execute a test ticketing transaction from the POS console and verify that the QR barcode is crisp, clear, and scannable by track inspectors.'
      ],
      tips: [
        'Never clean the thermal printing heads with water. Always use 99% isopropyl alcohol wipes during routine weekly maintenance.',
        'If barcode printing appears faint, adjust print density settings to "High" in the driver properties panel.'
      ]
    },
    {
      id: 'KB-103',
      title: 'Locomotive Tracking Client (LTC) Installation & Config',
      category: 'Software',
      icon: HardDrive,
      summary: 'Deployment guide for loading the central URC Locomotive Tracking Client (LTC) software on field operations laptops and binding GPS receiver COM ports.',
      causes: [
        'Laptops replaced or re-imaged during field maintenance cycles.',
        'Missing serial driver libraries for USB GPS external dongles.',
        'SSL certificate mismatches blocking secure telemetry synchronization.'
      ],
      steps: [
        'Download the certified "URC-LTC-v4.2.1-Stable" package from the internal deployment share (\\\\10.12.1.45\\deploy\\LTC).',
        'Run the installer executable as Administrator and accept the default installation paths to "C:\\Program Files\\URC\\LTC".',
        'Connect the external USB GPS receiver dongle to a USB 3.0 port on the field ruggedized laptop.',
        'Open the Device Manager, locate "Ports (COM & LPT)", and identify the assigned virtual COM Port number (e.g. COM3 or COM4).',
        'Launch the LTC software, click "System Options", navigate to the "GPS Telemetry" tab, and select the matching COM Port with a baud rate of 9600.',
        'Import the cryptographic URC Client Certificate ("urcltc_client.pfx") to authorize data relay to the central freight logistics warehouse.',
        'Click "Test Telemetry Link" and verify that latitude, longitude, and speed telemetry feeds match actual track coordinates on the diagnostic monitor.'
      ],
      tips: [
        'Ensure the GPS receiver dongle is placed on the locomotive cabin dashboard with an unobstructed view of the sky.',
        'The tracking client caches telemetry locally if the cellular/VHF link drops, and automatically synchronizes when a network is re-established.'
      ]
    },
    {
      id: 'KB-104',
      title: 'IP-VPN Connectivity Setup for Remote Station Sidings',
      category: 'Network',
      icon: ShieldCheck,
      summary: 'Procedure to establish and troubleshoot secure IP-VPN connections from remote sidings (Malaba, Gulu, Port Bell) to the Kampala central HQ server room.',
      causes: [
        'Local router losing primary fiber link and failing to negotiate backup WAN links.',
        'MFA token out-of-sync on mobile authenticator apps.',
        'Firewall policies blocking IPsec VPN tunneling ports (UDP 500, UDP 4500).'
      ],
      steps: [
        'Check the local siding router WAN interface status lights. Verify that the primary WAN link or cellular transceiver signal strength is at least -85 dBm (3 bars).',
        'Launch the Cisco AnyConnect or OpenVPN client on the siding dispatcher terminal.',
        'Select the target gateway address matching the closest regional concentrator (e.g., "vpn.kla.urc.go.ug" for South/Central, or "vpn.glu.urc.go.ug" for North).',
        'Enter user credentials in the format: employee_id@urc.go.ug and the secure domain password.',
        'When prompted for the Multi-Factor Authentication (MFA) challenge, enter the 6-digit dynamic token generated on the employee\'s corporate device.',
        'Verify connection establishment. Open the terminal prompt and execute "ping 10.12.1.45 -t" to ensure sub-100ms ICMP loopback responses to the central database.',
        'Verify routing tables: ensure that all corporate traffic (10.12.0.0/16) is being encapsulated through the secure encrypted VPN tunnel.'
      ],
      tips: [
        'If VPN connection hangs on "Negotiating Security Keys", reboot the local router to clear stale IPsec security associations (SAs).',
        'Always connect to the backup satellite terminal or Radio-Link B if local cellular towers are heavily congested.'
      ]
    },
    {
      id: 'KB-105',
      title: 'Corporate Webmail Profile Sync (Outlook/IMAP/SMTP)',
      category: 'Email',
      icon: Mail,
      summary: 'Configuration parameters and steps for manual synchronization of corporate ucr.go.ug email mailboxes on Microsoft Outlook, Roundcube, and Android field devices.',
      causes: [
        'Transitioning to Microsoft 365 services with old cache conflicts.',
        'Manual configurations with wrong IMAP or secure SMTP port credentials.',
        'Security policies restricting insecure mail relays.'
      ],
      steps: [
        'Ensure the active technician laptop is connected to either the internal URC LAN or the secure corporate VPN.',
        'Launch Microsoft Outlook or the native Android Mail app, select "Add Account", and choose "Manual setup or additional server types".',
        'Select "POP or IMAP" as the account type and click "Next".',
        'Input user details: Name: [User Full Name], Email Address: [username]@urc.go.ug.',
        'Configure Server Information: Account Type: IMAP, Incoming mail server: "mail.urc.go.ug", Outgoing mail server (SMTP): "smtp.urc.go.ug".',
        'Input Logon Information: Username: [full email address], Password: [active domain password].',
        'Click "More Settings" and select the "Outgoing Server" tab. Check "My outgoing server (SMTP) requires authentication" and choose "Use same settings as incoming mail server".',
        'Navigate to the "Advanced" tab and input security port parameters: Incoming server (IMAP): 993, Encryption method: SSL/TLS; Outgoing server (SMTP): 465, Encryption method: SSL/TLS.',
        'Click "Test Account Settings" to verify successful incoming IMAP handshake and outgoing SMTP relay. Once verified, click "Finish".'
      ],
      tips: [
        'Do not use insecure IMAP port 143 or SMTP port 25 as they are strictly blocked by corporate security firewalls.',
        'For mobile phones, Outlook Mobile is highly recommended over default mail clients as it enforces security sandboxes.'
      ]
    }
  ];

  const categories = ['All', 'Credentials', 'Hardware', 'Software', 'Network', 'Email'];

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.steps.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeArticle = articles.find(art => art.id === activeArticleId) || articles[0];

  const handleCopyStep = (stepText: string, index: number) => {
    navigator.clipboard.writeText(stepText);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative" id="urc-kb-knowledge-base">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            URC IT Helpdesk Knowledge Base
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal repository of common IT issues, configuration guides, and step-by-step restoration procedures for URC terminals.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mr-2">Category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 border border-slate-250 hover:border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Article Index Sidebar */}
        <div className="lg:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 px-2">Knowledge Base Directory</div>
          
          {filteredArticles.length === 0 ? (
            <p className="text-xs text-slate-400 px-2">No help guides match search criteria.</p>
          ) : (
            filteredArticles.map((art) => {
              const isActive = activeArticle?.id === art.id;
              const IconComponent = art.icon;
              return (
                <button
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className={`w-full text-left px-3.5 py-3.5 rounded-xl border text-xs transition-all cursor-pointer flex gap-3 items-start ${
                    isActive
                      ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[9px]">
                      <span className={isActive ? 'text-blue-600 font-bold' : 'text-slate-400'}>{art.id}</span>
                      <span className="opacity-80 px-1 bg-slate-200/50 rounded font-bold">{art.category}</span>
                    </div>
                    <div className={`font-semibold line-clamp-2 leading-snug ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{art.title}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Article Reader Panel */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          {activeArticle ? (
            <div className="space-y-5">
              
              {/* Header Info */}
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-blue-600 font-bold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    Knowledge Guide: {activeArticle.id}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-0.5">{activeArticle.title}</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md shrink-0 font-bold h-fit self-start sm:self-center">
                  Category: {activeArticle.category}
                </span>
              </div>

              {/* Summary Statement */}
              <div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
                  {activeArticle.summary}
                </p>
              </div>

              {/* Common Root Causes */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Known Trigger Conditions & Causes</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeArticle.causes.map((cause, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/40 text-xs text-slate-600">
                      <span className="text-amber-500 font-extrabold mt-0.5 shrink-0">•</span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restoration Steps */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2.5">Procedural Resolution Sequence</div>
                <div className="space-y-2">
                  {activeArticle.steps.map((step, idx) => (
                    <div key={idx} className="group flex items-start gap-3 bg-white border border-slate-150 rounded-lg p-3 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="bg-blue-50 border border-blue-100 h-5 w-5 rounded flex items-center justify-center font-mono text-[10px] text-blue-600 shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-xs text-slate-600 leading-relaxed font-sans">{step}</div>
                      
                      {/* Interactive Copy Button */}
                      <button 
                        onClick={() => handleCopyStep(step, idx)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 self-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Copy step instructions"
                      >
                        {copiedStep === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-blue-700 font-bold mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  Preventative Maintenance Advisory
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
                  {activeArticle.tips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select an article from the directory list to read the procedural instructions.
            </div>
          )}

          {/* Panel Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 font-mono">
              Corporate Standard: URC IT Helpdesk Service-Level Agreement (SLA) Reference
            </span>
            <span className="text-xs text-blue-600 flex items-center gap-1 font-medium font-mono">
              S siding reference manuals synced.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
