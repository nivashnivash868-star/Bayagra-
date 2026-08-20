'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Search, Folder, Phone, Globe, Link as LinkIcon, 
  MapPin, AlertTriangle, FileText, Activity, Layers, 
  Database, User, Settings, Terminal, Send, Upload, 
  Download, Eye, Plus, CheckCircle, RefreshCw, X, LogOut,
  FileCode, Play, Menu, ChevronDown
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

// Fallback Mock Data in case backend is unreachable
const LOCAL_MOCK_CASE = {
  id: 'INC-2026-0087',
  title: 'Suspicious Phishing Communication',
  description: 'Phishing SMS reporting account suspension pointing to secure-bank-login.net routed via Tor exit nodes.',
  severity: 'HIGH',
  status: 'INVESTIGATING',
  assigned_analyst: 'analyst',
  created_date: '2026-08-20T10:29:26Z',
  notes: 'Analyzed source numbers and domains. URL resolves to a credential harvesting site.',
  tags: ['phishing', 'sms', 'tor', 'financial'],
  indicators: [
    {
      id: 1,
      value: '+15553492048',
      type: 'PHONE',
      risk_score: 68,
      confidence: 88,
      severity: 'MEDIUM',
      details: {
        carrier: 'Twilio VoIP',
        country: 'United States',
        spam_reports: 14,
        reasons: ['VoIP number used in spam campaigns']
      }
    },
    {
      id: 2,
      value: 'https://secure-bank-login.net/verify',
      type: 'URL',
      risk_score: 92,
      confidence: 95,
      severity: 'CRITICAL',
      details: {
        phishing: true,
        brand_impersonated: 'Secure Bank Inc.'
      }
    },
    {
      id: 3,
      value: 'secure-bank-login.net',
      type: 'DOMAIN',
      risk_score: 90,
      confidence: 90,
      severity: 'HIGH',
      details: {
        registrar: 'Namecheap Inc.',
        age_days: 1
      }
    },
    {
      id: 4,
      value: '185.220.101.4',
      type: 'IP',
      risk_score: 85,
      confidence: 92,
      severity: 'HIGH',
      details: {
        isp: 'Zwiebelfreunde e.V.',
        tor: true,
        country: 'Germany'
      }
    }
  ],
  evidence: [
    {
      id: 'e83a2164a2ab16fcf85a9c97a9f73f2a588b39a8c9b20894ac0b73c242a9b34a',
      filename: 'sms_payload_log.txt',
      uploaded_by: 'analyst',
      timestamp: '2026-08-20T10:30:00Z',
      file_type: 'txt',
      size_bytes: 248,
      notes: 'SMS capture raw headers and body.'
    }
  ],
  alerts: [
    {
      id: 101,
      severity: 'HIGH',
      indicator: 'secure-bank-login.net',
      reason: 'High risk domain secure-bank-login.net observed on newly created registration.',
      read: false
    },
    {
      id: 102,
      severity: 'HIGH',
      indicator: '185.220.101.4',
      reason: 'Tor exit node IP address initiating HTTP requests.',
      read: false
    }
  ]
};

export default function Home() {
  // Navigation & Authentication
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>('Viewer');
  const [username, setUsername] = useState<string>('analyst');
  
  // Login fields
  const [loginUser, setLoginUser] = useState('analyst');
  const [loginPass, setLoginPass] = useState('analyst123');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Signup fields
  const [isSignup, setIsSignup] = useState(false);
  const [signupUser, setSignupUser] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupRole, setSignupRole] = useState('Security Analyst');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Investigation & Core State
  const [selectedCaseId, setSelectedCaseId] = useState('INC-2026-0087');
  const [cases, setCases] = useState<any[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(LOCAL_MOCK_CASE);
  const [correlatedCases, setCorrelatedCases] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>(LOCAL_MOCK_CASE.alerts);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  // Map Geolocation & Attack Vectors configuration
  const [mapIndicators, setMapIndicators] = useState([
    { name: '185.220.101.4', type: 'Malware Callback C2', lat: 51.0504, lon: 13.7373, location: 'Dresden, Germany', detail: 'High-risk Tor Exit Node sending beacon callbacks.' },
    { name: 'secure-bank-login.net', type: 'Phishing Landing Domain', lat: 37.7749, lon: -122.4194, location: 'San Francisco, USA', detail: 'Active phishing landing hosting bank credentials harvester.' },
    { name: '198.51.100.42', type: 'DDoS Botnet Agent', lat: 35.6762, lon: 139.6503, location: 'Tokyo, Japan', detail: 'UDP Flood initiator attacking boundary routers.' },
    { name: '91.198.174.192', type: 'Phishing Redirector Server', lat: 48.8566, lon: 2.3522, location: 'Paris, France', detail: 'Hosting malicious htaccess path redirect logs.' }
  ]);
  const [mapMode, setMapMode] = useState<'svg' | 'gis'>('gis');
  const [selectedMapItem, setSelectedMapItem] = useState(mapIndicators[0]);
  const [trackerInput, setTrackerInput] = useState('');

  const handleTrackPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerInput) return;
    const cleanNumber = "+" + trackerInput.replace(/\D/g, "");
    
    // Check if it's already in our mapIndicators list
    const existing = mapIndicators.find(ind => ind.name.replace(/\D/g, "") === cleanNumber.replace(/\D/g, ""));
    if (existing) {
      setSelectedMapItem(existing);
      setMapMode('gis');
      setTrackerInput('');
      return;
    }

    // Default configuration for mock phone tracker
    let newIndicator = {
      name: trackerInput,
      type: 'Scanned Mobile Target',
      lat: 20.5937,
      lon: 78.9629,
      location: 'India (Generic)',
      detail: 'Registered Subscriber: Unknown. Rep Score: 100/100 (Clean).'
    };

    if (cleanNumber.includes("918608857507") || trackerInput.includes("8608857507")) {
      newIndicator = {
        name: '+91 86088 57507',
        type: 'Truecaller Checked Line',
        lat: 13.0827,
        lon: 80.2707,
        location: 'Chennai, Tamil Nadu, India',
        detail: 'SIM Subscriber: Sanjvee. Verified active Jio Mobile Node.'
      };
    } else if (cleanNumber.includes("15553492048") || trackerInput.includes("5553492048")) {
      newIndicator = {
        name: '+1 555-349-2048',
        type: 'VoIP Spoofed Fraud',
        lat: 36.7783,
        lon: -119.4179,
        location: 'California, USA',
        detail: 'VoIP gateway spoofing phishing messages targeting bank users.'
      };
    } else if (cleanNumber.startsWith("+1") || cleanNumber.startsWith("1")) {
      newIndicator = {
        name: trackerInput,
        type: 'Scanned US Mobile',
        lat: 37.0902,
        lon: -95.7129,
        location: 'United States',
        detail: 'Scanned international mobile routing. Rep Score: 100/100.'
      };
    }

    setMapIndicators([...mapIndicators, newIndicator]);
    setSelectedMapItem(newIndicator);
    setMapMode('gis');
    setTrackerInput('');
  };


  // Lookup tools
  const [lookupInput, setLookupInput] = useState('');
  const [lookupType, setLookupType] = useState('IP');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Message Extractor tool
  const [extractorText, setExtractorText] = useState('');
  const [extractedIOCs, setExtractedIOCs] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Evidence uploader
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceSize, setEvidenceSize] = useState(1024);
  const [evidenceType, setEvidenceType] = useState('txt');
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // AI Security Copilot
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    { role: 'assistant', content: 'Welcome to Bayagra AI Security Copilot. I have gathered intelligence for incident INC-2026-0087. Ask me about threat correlations, risk scoring, or mitigation steps.' }
  ]);
  const [isCopilotQuerying, setIsCopilotQuerying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create Case fields
  const [newCaseId, setNewCaseId] = useState('INC-2026-0088');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCaseSeverity, setNewCaseSeverity] = useState('MEDIUM');
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  // Global Indicator Addition
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddType, setQuickAddType] = useState('IP');

  // Watchlist addition
  const [watchAddValue, setWatchAddValue] = useState('');
  const [watchAddType, setWatchAddType] = useState('IP');
  const [watchAddReason, setWatchAddReason] = useState('');
  const [watchAddRisk, setWatchAddRisk] = useState('MEDIUM');

  // Backend state check
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Load auth state and check backend online status
  useEffect(() => {
    const savedToken = localStorage.getItem('bayagra_token');
    const savedRole = localStorage.getItem('bayagra_role');
    const savedUser = localStorage.getItem('bayagra_username');
    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole || 'Viewer');
      setUsername(savedUser || 'analyst');
    }
    
    // Check if backend is alive
    fetch(`${API_BASE}/investigations`)
      .then(() => setIsBackendOnline(true))
      .catch(() => setIsBackendOnline(false));
  }, []);

  // Fetch data periodically
  useEffect(() => {
    if (token || !isBackendOnline) {
      refreshData();
    }
  }, [token, selectedCaseId, isBackendOnline]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  const refreshData = async () => {
    if (!isBackendOnline) {
      // Offline fallback
      setCases([
        { id: 'INC-2026-0087', title: 'Suspicious Phishing Communication', severity: 'HIGH', status: 'INVESTIGATING', assigned_analyst: 'analyst' },
        { id: 'INC-2026-0012', title: 'Boundary Port Scanning Campaign', severity: 'MEDIUM', status: 'RESOLVED', assigned_analyst: 'viewer' }
      ]);
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // 1. Cases list
      const resCases = await fetch(`${API_BASE}/investigations`, { headers });
      if (resCases.ok) {
        const data = await resCases.json();
        setCases(data);
      }

      // 2. Selected case detail
      const resDetail = await fetch(`${API_BASE}/investigations/${selectedCaseId}`, { headers });
      if (resDetail.ok) {
        const data = await resDetail.json();
        setCaseDetails(data);
        setAlerts(data.alerts || []);
      }

      // 3. Correlations
      const resCorr = await fetch(`${API_BASE}/investigations/${selectedCaseId}/correlations`, { headers });
      if (resCorr.ok) {
        const data = await resCorr.json();
        setCorrelatedCases(data);
      }

      // 4. Watchlist
      const resWatch = await fetch(`${API_BASE}/watchlist`, { headers });
      if (resWatch.ok) {
        const data = await resWatch.json();
        setWatchlist(data);
      }

      // 5. Audits
      const resAudits = await fetch(`${API_BASE}/audits`, { headers });
      if (resAudits.ok) {
        const data = await resAudits.json();
        setAudits(data);
      }
    } catch (err) {
      console.error("Failed to fetch fresh backend data", err);
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    
    if (!isBackendOnline) {
      // Mock login offline
      setToken('mock-token-offline');
      setRole(loginUser === 'admin' ? 'Admin' : loginUser === 'viewer' ? 'Viewer' : 'Security Analyst');
      setUsername(loginUser);
      localStorage.setItem('bayagra_token', 'mock-token-offline');
      localStorage.setItem('bayagra_role', loginUser === 'admin' ? 'Admin' : loginUser === 'viewer' ? 'Viewer' : 'Security Analyst');
      localStorage.setItem('bayagra_username', loginUser);
      setIsLoggingIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await response.json();
      setToken(data.access_token);
      setRole(data.role);
      setUsername(data.username);
      localStorage.setItem('bayagra_token', data.access_token);
      localStorage.setItem('bayagra_role', data.role);
      localStorage.setItem('bayagra_username', data.username);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSignupSuccess('');
    setIsLoggingIn(true);

    if (!isBackendOnline) {
      // Mock signup offline
      setSignupSuccess('Analyst account created successfully (Mock mode)! You can now sign in.');
      setIsSignup(false);
      setLoginUser(signupUser);
      setLoginPass(signupPass);
      setIsLoggingIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signupUser, password: signupPass, role: signupRole })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Signup failed');
      }
      setSignupSuccess('Analyst account registered successfully! You can now log in.');
      setIsSignup(false);
      setLoginUser(signupUser);
      setLoginPass(signupPass);
      setSignupUser('');
      setSignupPass('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole('Viewer');
    setUsername('analyst');
    localStorage.removeItem('bayagra_token');
    localStorage.removeItem('bayagra_role');
    localStorage.removeItem('bayagra_username');
  };

  // Create Case
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCase(true);
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    if (!isBackendOnline) {
      const fakeCase = {
        id: newCaseId,
        title: newCaseTitle,
        description: newCaseDesc,
        severity: newCaseSeverity,
        status: 'OPEN',
        assigned_analyst: username,
        created_date: new Date().toISOString(),
        indicators: [],
        evidence: [],
        alerts: []
      };
      setCases([...cases, fakeCase]);
      setSelectedCaseId(newCaseId);
      setCaseDetails(fakeCase);
      setIsCreatingCase(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/investigations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: newCaseId,
          title: newCaseTitle,
          description: newCaseDesc,
          severity: newCaseSeverity,
          status: 'OPEN',
          assigned_analyst: username
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCases([...cases, data]);
        setSelectedCaseId(data.id);
        setNewCaseTitle('');
        setNewCaseDesc('');
        refreshData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCase(false);
    }
  };

  // Add Indicator
  const handleAddIndicator = async (val: string, type: string) => {
    if (!val) return;
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    if (!isBackendOnline) {
      const mockInd = {
        id: Date.now(),
        value: val,
        type: type,
        risk_score: 50,
        confidence: 70,
        severity: 'MEDIUM',
        details: { mode: 'LOCAL OFFLINE' },
        watchlisted: false
      };
      const updatedDetails = {
        ...caseDetails,
        indicators: [...caseDetails.indicators, mockInd]
      };
      setCaseDetails(updatedDetails);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/indicators`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          value: val,
          type: type,
          investigation_id: selectedCaseId
        })
      });
      if (res.ok) {
        refreshData();
      } else {
        const err = await res.json();
        alert(`Access Blocked: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput) return;
    setIsLookingUp(true);
    setLookupResult(null);

    if (!isBackendOnline) {
      setTimeout(() => {
        setLookupResult({
          value: lookupInput,
          type: lookupType,
          risk: { total_score: 45, classification: 'MEDIUM', breakdown: [{ factor: 'Simulated Local Rating', increment: 45 }] },
          confidence: 75,
          details: { ip: lookupInput, tor: false, country: 'Germany', mode: 'LOCAL MOCK' }
        });
        setIsLookingUp(false);
      }, 600);
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE}/indicators/lookup?value=${encodeURIComponent(lookupInput)}&type=${lookupType}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLookupResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Extract IOCs from log
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractorText) return;
    setIsExtracting(true);

    if (!isBackendOnline) {
      setTimeout(() => {
        setExtractedIOCs({
          PHONE: ['+15553492048'],
          IP: ['185.220.101.4'],
          DOMAIN: ['secure-bank-login.net'],
          URL: ['https://secure-bank-login.net/verify'],
          EMAIL: [],
          HASH: []
        });
        setIsExtracting(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/extractor`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: extractorText })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedIOCs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Upload Evidence
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceName) return;
    setIsUploadingEvidence(true);

    if (!isBackendOnline) {
      setTimeout(() => {
        const newEv = {
          id: 'fake-hash-' + Math.random().toString(36).substring(7),
          filename: evidenceName,
          uploaded_by: username,
          timestamp: new Date().toISOString(),
          file_type: evidenceType,
          size_bytes: evidenceSize,
          notes: evidenceNotes
        };
        setCaseDetails({
          ...caseDetails,
          evidence: [...caseDetails.evidence, newEv]
        });
        setEvidenceName('');
        setEvidenceNotes('');
        setIsUploadingEvidence(false);
      }, 800);
      return;
    }

    const formData = new FormData();
    formData.append('filename', evidenceName);
    formData.append('file_type', evidenceType);
    formData.append('size_bytes', String(evidenceSize));
    formData.append('investigation_id', selectedCaseId);
    if (evidenceNotes) formData.append('notes', evidenceNotes);

    try {
      const res = await fetch(`${API_BASE}/evidence`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setEvidenceName('');
        setEvidenceNotes('');
        refreshData();
      } else {
        const err = await res.json();
        alert(`Access Blocked: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  // Add Watchlist Entry
  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchAddValue) return;

    if (!isBackendOnline) {
      setWatchlist([...watchlist, {
        id: Date.now(),
        indicator: watchAddValue,
        type: watchAddType,
        reason: watchAddReason,
        risk: watchAddRisk,
        created: new Date().toISOString(),
        last_observed: new Date().toISOString(),
        status: 'ACTIVE'
      }]);
      setWatchAddValue('');
      setWatchAddReason('');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          indicator: watchAddValue,
          type: watchAddType,
          reason: watchAddReason,
          risk: watchAddRisk
        })
      });
      if (res.ok) {
        setWatchAddValue('');
        setWatchAddReason('');
        refreshData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Copilot Chat Query
  const handleCopilotQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput) return;
    const userMsg = { role: 'user', content: copilotInput };
    setCopilotMessages([...copilotMessages, userMsg]);
    setCopilotInput('');
    setIsCopilotQuerying(true);

    if (!isBackendOnline) {
      setTimeout(() => {
        setCopilotMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Local Offline Copilot Response: To investigate further, verify if the DNS resolution redirects are active. Block domain on boundary routers.'
        }]);
        setIsCopilotQuerying(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          investigation_id: selectedCaseId,
          messages: [...copilotMessages, userMsg]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages(prev => [...prev, data]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCopilotQuerying(false);
    }
  };

  // Mark Alert Read
  const handleMarkAlertRead = async (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    if (!isBackendOnline) return;

    try {
      await fetch(`${API_BASE}/alerts/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Render Login Panel if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070a13] bg-cyber-grid p-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs">
          <div className={`w-2.5 h-2.5 rounded-full ${isBackendOnline ? 'bg-emerald-500 led-blink-green' : 'bg-rose-500 led-blink-red'}`} />
          <span className="text-slate-400">Backend: {isBackendOnline ? 'Online' : 'Mock/Offline Mode'}</span>
        </div>

        <div className="w-full max-w-md glass-panel rounded-lg border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="scanner-line" />
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Shield className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-100 tracking-wide font-mono">BAYAGRA</h2>
          <p className="text-slate-400 text-xs text-center mt-1 mb-6 uppercase tracking-widest font-mono">Incident Investigation Portal</p>

          <div className="flex gap-2 p-1 bg-[#0b0f19] border border-slate-800 rounded mb-6">
            <button 
              onClick={() => { setIsSignup(false); setAuthError(''); }}
              className={`flex-1 py-1 text-center text-xs font-mono rounded ${!isSignup ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignup(true); setAuthError(''); }}
              className={`flex-1 py-1 text-center text-xs font-mono rounded ${isSignup ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Register Account
            </button>
          </div>

          {signupSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{signupSuccess}</span>
            </div>
          )}

          {!isSignup ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1.5 tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1.5 tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-slate-900 font-bold py-2 rounded text-sm uppercase tracking-wider font-mono flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Authenticate Analyst</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1.5 tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={signupUser}
                  onChange={(e) => setSignupUser(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1.5 tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase font-mono mb-1.5 tracking-wider">Assigned Role</label>
                <select 
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 rounded px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Security Analyst">Security Analyst (Standard Analyst)</option>
                  <option value="Investigator">Investigator (Audit Viewer / Writer)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-slate-900 font-bold py-2 rounded text-sm uppercase tracking-wider font-mono flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Register Analyst Account</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <span className="text-[10px] font-mono text-slate-500">AUTHORIZED ACCESS ONLY • LOGGED AND MONITORED</span>
            <div className="mt-2 flex justify-center gap-3 text-[10px] font-mono text-emerald-500/60">
              <span>admin123</span>
              <span>•</span>
              <span>analyst123</span>
              <span>•</span>
              <span>viewer123</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active UI Main Shell
  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col relative">
      {/* Top Header */}
      <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 bg-[#0b0f19] border border-slate-800 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded hidden xs:block">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-wide font-mono text-sm">BAYAGRA</h1>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">Investigator Session active</span>
          </div>
        </div>

        {/* Global Case Selector */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-400 text-xs font-mono">Active Investigation:</span>
          <select 
            value={selectedCaseId} 
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
            ))}
          </select>
        </div>

        {/* User profile & status */}
        <div className="flex items-center gap-4">
          <div className="text-right shrink-0">
            <span className="block text-xs font-mono text-slate-300 font-bold">{username}</span>
            <span className="block text-[9px] font-mono text-emerald-500 uppercase">{role}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors border border-slate-800 hover:border-rose-500/20 bg-[#0b0f19] rounded"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Backdrop Overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden" 
            onClick={() => setShowMobileMenu(false)} 
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:relative top-0 bottom-0 left-0 z-40 w-60 bg-[#070a13] md:bg-transparent border-r border-slate-800 py-6 px-4 flex flex-col justify-between shrink-0 transition-transform duration-300 md:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-y-auto`}>
          <div className="space-y-6">
            <div>
              <span className="block px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2.5">Investigation views</span>
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Folder },
                  { id: 'graph', label: 'Investigation Graph', icon: Layers },
                  { id: 'threatmap', label: 'Threat Mapping', icon: Globe },
                  { id: 'evidence', label: 'Evidence Vault', icon: Database },
                  { id: 'copilot', label: 'AI Copilot', icon: Terminal },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors font-mono ${activeTab === item.id ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-[#0b0f19] hover:text-slate-100 border border-transparent'}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <span className="block px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2.5">Threat Intel Services</span>
              <nav className="space-y-1">
                {[
                  { id: 'phone', label: 'Phone Intel', icon: Phone },
                  { id: 'ip', label: 'IP Reputation', icon: MapPin },
                  { id: 'domain', label: 'Domain & DNS Intel', icon: Globe },
                  { id: 'message', label: 'Log Extractor', icon: FileText },
                  { id: 'watchlist', label: 'Threat Watchlist', icon: Activity },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors font-mono ${activeTab === item.id ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-[#0b0f19] hover:text-slate-100 border border-transparent'}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800/80">
            {/* Status light */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Live API Link</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 led-blink-green' : 'bg-amber-500 led-blink-amber'}`} />
                <span className={isBackendOnline ? 'text-emerald-400' : 'text-amber-400'}>{isBackendOnline ? 'Online' : 'Mock Mode'}</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-slate-600 leading-normal bg-[#070a13] p-2 border border-slate-900 rounded">
              SYSTEM LEVEL: AUTHORIZED ACCESS REQUIRED. DISCOVERY OF PUBLIC EVIDENCE ONLY.
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative min-w-0">
          <div className="absolute top-0 right-0 left-0 h-48 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-100">INCIDENT OVERVIEW</h2>
                  <p className="text-slate-400 text-xs mt-1">Review investigation case context, telemetry metrics, and connected alert events.</p>
                </div>
                <button 
                  onClick={refreshData}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#0e1322] border border-slate-800 rounded hover:border-emerald-500/20 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Database</span>
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'CASE SEVERITY', value: caseDetails.severity || 'MEDIUM', color: 'text-amber-400 border-amber-500/10 bg-amber-500/[0.02]' },
                  { label: 'INVESTIGATION STATUS', value: caseDetails.status || 'OPEN', color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/[0.02]' },
                  { label: 'RECORDED INDICATORS', value: String(caseDetails.indicators?.length || 0), color: 'text-slate-300 border-slate-800 bg-slate-800/[0.05]' },
                  { label: 'EVIDENCE FILES', value: String(caseDetails.evidence?.length || 0), color: 'text-slate-300 border-slate-800 bg-slate-800/[0.05]' },
                ].map((stat, i) => (
                  <div key={i} className={`glass-panel border rounded p-5 relative overflow-hidden flex flex-col justify-between h-28`}>
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">{stat.label}</span>
                    <span className={`text-2xl font-bold tracking-tight mt-2 font-mono ${stat.color.split(' ')[0]}`}>{stat.value}</span>
                    <div className="w-full h-1 bg-slate-800/60 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[60%]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Core Case Information Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Card */}
                <div className="glass-panel rounded border border-slate-800 p-6 lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      <span>Incident Case File: {caseDetails.id}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(caseDetails.created_date).toLocaleString()}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-slate-200 text-sm font-bold">Title</h3>
                      <p className="text-slate-300 text-sm mt-1">{caseDetails.title}</p>
                    </div>
                    <div>
                      <h3 className="text-slate-200 text-sm font-bold">Summary Description</h3>
                      <p className="text-slate-400 text-xs leading-relaxed mt-1">{caseDetails.description}</p>
                    </div>
                    <div>
                      <h3 className="text-slate-200 text-sm font-bold">Investigator Analyst Notes</h3>
                      <div className="bg-[#0b0f19]/80 border border-slate-900 rounded p-3 text-xs text-slate-400 leading-normal font-mono">
                        {caseDetails.notes || 'No notes currently recorded.'}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-slate-200 text-sm font-bold">Tags / Keywords</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {caseDetails.tags?.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions & exports */}
                <div className="space-y-6">
                  <div className="glass-panel rounded border border-slate-800 p-6 space-y-4">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3">Actions & Exporters</h3>
                    <div className="space-y-2">
                      <a 
                        href={`${API_BASE}/reports/${selectedCaseId}/json`} 
                        download
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#0e1322] border border-slate-800 rounded hover:border-emerald-500/30 text-xs font-mono text-slate-300 transition-colors"
                      >
                        <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-400" /> Export JSON Report</span>
                        <span className="text-[10px] text-slate-500">JSON</span>
                      </a>
                      <a 
                        href={`${API_BASE}/reports/${selectedCaseId}/csv`} 
                        download
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#0e1322] border border-slate-800 rounded hover:border-emerald-500/30 text-xs font-mono text-slate-300 transition-colors"
                      >
                        <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV IOCs</span>
                        <span className="text-[10px] text-slate-500">CSV</span>
                      </a>
                    </div>
                  </div>

                  <div className="glass-panel rounded border border-slate-800 p-6">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3 mb-4">Quick Add Indicator</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Value</label>
                        <input 
                          type="text" 
                          value={quickAddValue}
                          onChange={(e) => setQuickAddValue(e.target.value)}
                          placeholder="e.g. 185.220.101.4"
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Type</label>
                        <select 
                          value={quickAddType}
                          onChange={(e) => setQuickAddType(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="IP">IP Address</option>
                          <option value="PHONE">Phone Number</option>
                          <option value="DOMAIN">Domain</option>
                          <option value="URL">URL Link</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          handleAddIndicator(quickAddValue, quickAddType);
                          setQuickAddValue('');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Inject Indicator</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Creation Card for Admins/Analysts */}
              {role !== 'Viewer' && (
                <div className="glass-panel rounded border border-slate-800 p-6 max-w-xl">
                  <h3 className="text-slate-200 text-sm font-bold border-b border-slate-800/80 pb-3 mb-4 uppercase tracking-wider font-mono">Create New Incident Case File</h3>
                  <form onSubmit={handleCreateCase} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Case ID</label>
                        <input 
                          type="text" 
                          value={newCaseId}
                          onChange={(e) => setNewCaseId(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Severity</label>
                        <select 
                          value={newCaseSeverity}
                          onChange={(e) => setNewCaseSeverity(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Title</label>
                      <input 
                        type="text" 
                        value={newCaseTitle}
                        onChange={(e) => setNewCaseTitle(e.target.value)}
                        placeholder="Impersonation Scan Campaign"
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Description</label>
                      <textarea 
                        value={newCaseDesc}
                        onChange={(e) => setNewCaseDesc(e.target.value)}
                        placeholder="Inbound SMS and IP traces resolve to VPS hosting."
                        rows={2}
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors"
                    >
                      Initialize Case
                    </button>
                  </form>
                </div>
              )}

              {/* Indicators Lists */}
              <div className="glass-panel rounded border border-slate-800 p-6">
                <h3 className="text-slate-200 text-sm font-bold border-b border-slate-800/80 pb-3 mb-4 uppercase tracking-wider font-mono">Parsed Threat Indicators</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 uppercase font-mono text-[10px]">
                        <th className="py-2.5 px-3">Indicator</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Risk Rating</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Location/Carrier Info</th>
                        <th className="py-2.5 px-3">Watchlist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {caseDetails.indicators?.map((ind: any) => (
                        <tr key={ind.id} className="hover:bg-slate-800/10">
                          <td className="py-3 px-3 font-mono font-bold text-slate-300">{ind.value}</td>
                          <td className="py-3 px-3 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-bold">{ind.type}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ind.severity === 'CRITICAL' || ind.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : ind.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{ind.severity}</span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{ind.risk_score}/100</span>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${ind.risk_score > 70 ? 'bg-rose-500' : ind.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${ind.risk_score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">{ind.confidence}%</td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {ind.details?.carrier || ind.details?.isp || ind.details?.domain || 'Generic Intelligence'} {ind.details?.country ? `(${ind.details.country})` : ''}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${ind.watchlisted ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800/80 text-slate-500'}`}>
                              {ind.watchlisted ? 'WATCHLIST' : 'NONE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alerts List */}
              <div className="glass-panel rounded border border-slate-800 p-6">
                <h3 className="text-slate-200 text-sm font-bold border-b border-slate-800/80 pb-3 mb-4 uppercase tracking-wider font-mono">Recent Analyst Alerts</h3>
                <div className="space-y-3">
                  {alerts.map((alert: any) => (
                    <div key={alert.id} className={`p-4 border rounded flex items-start justify-between ${alert.read ? 'bg-[#0b0f19]/30 border-slate-800/80' : 'bg-rose-500/[0.02] border-rose-500/15'}`}>
                      <div className="flex gap-3">
                        <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-300 text-xs">{alert.indicator}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${alert.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{alert.severity} ALERT</span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">{alert.reason}</p>
                        </div>
                      </div>
                      {!alert.read && (
                        <button 
                          onClick={() => handleMarkAlertRead(alert.id)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[10px] font-mono transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))}
                  {alerts.length === 0 && <p className="text-slate-500 text-xs font-mono text-center">No active alerts recorded.</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHONE INTEL */}
          {activeTab === 'phone' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">PHONE REPUTATION SERVICE</h2>
                <p className="text-slate-400 text-xs mt-1">Submit phone numbers for structural parsing and authorized spam telemetry analysis.</p>
              </div>

              {/* Warning Disclaimer banner */}
              <div className="p-4 bg-amber-500/[0.02] border border-amber-500/15 rounded flex gap-3 text-amber-400 text-xs leading-normal">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold block uppercase tracking-wider mb-0.5">Authorized Verification Notice</span>
                  This system only displays publicly available database attributes, country location routing parameters, and observed carrier indicators. Private identity subscriber files, live physical locations, and telecom transaction records are restricted and unavailable.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Submit panel */}
                <div className="glass-panel rounded border border-slate-800 p-6 space-y-4">
                  <form onSubmit={(e) => { setLookupType('PHONE'); handleLookup(e); }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Phone Number (E.164 Format)</label>
                        <input 
                          type="text" 
                          value={lookupInput}
                          onChange={(e) => setLookupInput(e.target.value)}
                          placeholder="+15553492048"
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isLookingUp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        {isLookingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Scan Reputation</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2 space-y-6">
                  {lookupResult && lookupResult.type === 'PHONE' ? (
                    <div className="glass-panel rounded border border-slate-800 p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                        <span className="font-mono font-bold text-slate-200 text-sm">{lookupResult.value}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">{lookupResult.details.mode || 'LIVE TELEMETRY'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Carrier / Routing Range</span>
                          <span className="text-slate-300 font-bold">{lookupResult.details.carrier || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Numbering Classification</span>
                          <span className="text-slate-300">{lookupResult.details.number_type || 'VoIP / Disposable'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Origin Country</span>
                          <span className="text-slate-300">{lookupResult.details.country || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Validation Status</span>
                          <span className="text-emerald-400 font-bold">{lookupResult.details.validation_status || 'Valid'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Caller ID Name (Public Intel)</span>
                          <span className="text-slate-300 font-bold">{lookupResult.details.caller_name || 'Unavailable'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Correlated Victim (Evidence)</span>
                          <span className="text-amber-400 font-bold">{lookupResult.details.associated_victim || 'None'}</span>
                        </div>
                      </div>

                      {/* Rep / Risk indicators */}
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Transparent Risk Score</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className={`font-bold text-lg ${lookupResult.risk.total_score > 70 ? 'text-rose-400' : lookupResult.risk.total_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {lookupResult.risk.total_score}/100
                            </span>
                            <span className="text-[10px] text-slate-500">({lookupResult.risk.classification})</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Intelligence Confidence</span>
                          <span className="text-slate-300 font-bold font-mono text-lg">{lookupResult.confidence}%</span>
                        </div>
                      </div>

                      {/* Factors list */}
                      <div className="bg-[#0b0f19]/80 border border-slate-900 rounded p-4 font-mono text-xs space-y-2">
                        <span className="text-slate-500 block uppercase text-[10px] font-bold border-b border-slate-900/80 pb-1.5 mb-2">Confidence Factors Breakdown</span>
                        {lookupResult.details.reasons ? (
                          lookupResult.details.reasons.map((r: string, i: number) => (
                            <p key={i} className="text-slate-400 flex items-start gap-2">
                              <span className="text-emerald-400">•</span>
                              <span>{r}</span>
                            </p>
                          ))
                        ) : (
                          <p className="text-slate-500">No telemetry matches available.</p>
                        )}
                      </div>

                      {/* Inject to Active Case */}
                      {role !== 'Viewer' && (
                        <button 
                          onClick={() => handleAddIndicator(lookupResult.value, 'PHONE')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold rounded text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Link to Incident: {selectedCaseId}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="glass-panel rounded border border-slate-800 p-8 text-center text-slate-500 font-mono text-xs">
                      Enter and submit a phone number query to populate telemetry report details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IP REPUTATION */}
          {activeTab === 'ip' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">IP INTEL & REPUTATION</h2>
                <p className="text-slate-400 text-xs mt-1">Perform authorized reputation sweeps on IPv4/IPv6 indicators against known proxy lists and Tor registries.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Submit panel */}
                <div className="glass-panel rounded border border-slate-800 p-6 space-y-4">
                  <form onSubmit={(e) => { setLookupType('IP'); handleLookup(e); }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">IP Address (v4 / v6)</label>
                        <input 
                          type="text" 
                          value={lookupInput}
                          onChange={(e) => setLookupInput(e.target.value)}
                          placeholder="e.g. 185.220.101.4"
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isLookingUp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        {isLookingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Scan IP</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2 space-y-6">
                  {lookupResult && lookupResult.type === 'IP' ? (
                    <div className="glass-panel rounded border border-slate-800 p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                        <span className="font-mono font-bold text-slate-200 text-sm">{lookupResult.value}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">{lookupResult.details.mode || 'LIVE TELEMETRY'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">ISP / ASN Owner</span>
                          <span className="text-slate-300 font-bold">{lookupResult.details.isp || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Reverse DNS (PTR)</span>
                          <span className="text-slate-300">{lookupResult.details.reverse_dns || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Geolocation</span>
                          <span className="text-slate-300">{lookupResult.details.city || 'Unknown'}, {lookupResult.details.country || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Connection Type</span>
                          <span className="text-slate-300">{lookupResult.details.network_type || 'Data Center / VPS'}</span>
                        </div>
                      </div>

                      {/* Flags details grid */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider">
                        <div className={`p-2.5 rounded border ${lookupResult.details.tor ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>Tor Exit</div>
                        <div className={`p-2.5 rounded border ${lookupResult.details.vpn ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>VPN Proxy</div>
                        <div className={`p-2.5 rounded border ${lookupResult.details.datacenter ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>Datacenter</div>
                        <div className={`p-2.5 rounded border ${lookupResult.details.hosting_provider ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>Hosting</div>
                      </div>

                      {/* Rep / Risk indicators */}
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Transparent Risk Score</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className={`font-bold text-lg ${lookupResult.risk.total_score > 70 ? 'text-rose-400' : lookupResult.risk.total_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {lookupResult.risk.total_score}/100
                            </span>
                            <span className="text-[10px] text-slate-500">({lookupResult.risk.classification})</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Intelligence Confidence</span>
                          <span className="text-slate-300 font-bold font-mono text-lg">{lookupResult.confidence}%</span>
                        </div>
                      </div>

                      {/* Coordinates disclaimer */}
                      {lookupResult.details.coordinates && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Approximate Coordinates: {lookupResult.details.coordinates.join(', ')}</span>
                          <span className="text-[10px] text-slate-500">Confidence Bounds: High Accuracy</span>
                        </div>
                      )}

                      {/* Inject to Active Case */}
                      {role !== 'Viewer' && (
                        <button 
                          onClick={() => handleAddIndicator(lookupResult.value, 'IP')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold rounded text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Link to Incident: {selectedCaseId}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="glass-panel rounded border border-slate-800 p-8 text-center text-slate-500 font-mono text-xs">
                      Enter and submit an IP query to populate proxy sweeps report details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOMAIN & URL INTEL */}
          {activeTab === 'domain' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">DOMAIN & URL SCANNER</h2>
                <p className="text-slate-400 text-xs mt-1">Audit domains for registrar profiles, active DNS records (MX, A), and typosquatting redirect loops.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Submit panel */}
                <div className="glass-panel rounded border border-slate-800 p-6 space-y-4">
                  <div className="flex gap-2 p-1 bg-[#0b0f19] border border-slate-800 rounded">
                    <button 
                      onClick={() => setLookupType('DOMAIN')}
                      className={`flex-1 py-1 text-center text-[10px] font-mono rounded ${lookupType === 'DOMAIN' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500'}`}
                    >
                      Domain
                    </button>
                    <button 
                      onClick={() => setLookupType('URL')}
                      className={`flex-1 py-1 text-center text-[10px] font-mono rounded ${lookupType === 'URL' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500'}`}
                    >
                      URL Link
                    </button>
                  </div>

                  <form onSubmit={handleLookup}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Target Address</label>
                        <input 
                          type="text" 
                          value={lookupInput}
                          onChange={(e) => setLookupInput(e.target.value)}
                          placeholder={lookupType === 'DOMAIN' ? 'secure-bank-login.net' : 'https://secure-bank-login.net/verify'}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isLookingUp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        {isLookingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Audit Host</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2 space-y-6">
                  {lookupResult && (lookupResult.type === 'DOMAIN' || lookupResult.type === 'URL') ? (
                    <div className="glass-panel rounded border border-slate-800 p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                        <span className="font-mono font-bold text-slate-200 text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-md block">{lookupResult.value}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">{lookupResult.details.mode || 'LIVE SCAN'}</span>
                      </div>

                      {/* DOMAIN SPECIFIC LAYOUT */}
                      {lookupResult.type === 'DOMAIN' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Registrar Profile</span>
                              <span className="text-slate-300 font-bold">{lookupResult.details.registrar || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Creation Date</span>
                              <span className="text-slate-300">{lookupResult.details.creation_date || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Domain Age (Days)</span>
                              <span className={`font-bold ${lookupResult.details.age_days < 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>{lookupResult.details.age_days || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">SSL Issuer Certificate</span>
                              <span className="text-slate-300">{lookupResult.details.ssl_certificate?.issuer || 'None'}</span>
                            </div>
                          </div>

                          {/* SSL Cert status */}
                          {lookupResult.details.ssl_certificate && (
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded text-xs font-mono flex items-center justify-between">
                              <span className="text-slate-400">SSL Validity Status</span>
                              <span className="text-emerald-400 font-bold font-mono">{lookupResult.details.ssl_certificate.status}</span>
                            </div>
                          )}

                          {/* DNS Records Tab */}
                          <div className="border border-slate-800 rounded bg-[#0b0f19]/40 p-4 font-mono text-xs">
                            <span className="text-slate-500 block uppercase text-[10px] font-bold border-b border-slate-900 pb-2 mb-3">DNS RESOLUTION TABLES</span>
                            <div className="space-y-2">
                              {['A', 'MX', 'TXT'].map(dns => (
                                <div key={dns} className="flex items-start gap-4">
                                  <span className="w-12 text-slate-500 font-bold uppercase">{dns}:</span>
                                  <div className="flex-1 space-y-1">
                                    {lookupResult.details.dns_records?.[dns]?.map((rec: string, idx: number) => (
                                      <p key={idx} className="text-slate-300">{rec}</p>
                                    )) || <p className="text-slate-600">No records found</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* URL SPECIFIC LAYOUT */}
                      {lookupResult.type === 'URL' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Resolved Domain</span>
                              <span className="text-slate-300 font-bold">{lookupResult.details.domain || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Redirect Chain Count</span>
                              <span className="text-slate-300">{lookupResult.details.redirect_chain?.length || 1} hops</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Active SSL Link</span>
                              <span className={`font-bold ${lookupResult.details.ssl_active ? 'text-emerald-400' : 'text-rose-400'}`}>{lookupResult.details.ssl_active ? 'SSL ACTIVE' : 'UNSECURED HTTP'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase text-[10px]">Reputation Classification</span>
                              <span className="text-slate-300">{lookupResult.details.reputation || 'UNKNOWN'}</span>
                            </div>
                          </div>

                          {/* Redirect trace */}
                          <div className="border border-slate-800 rounded bg-[#0b0f19]/40 p-4 font-mono text-xs space-y-2">
                            <span className="text-slate-500 block uppercase text-[10px] font-bold border-b border-slate-900 pb-2 mb-2">Redirect Trace path</span>
                            {lookupResult.details.redirect_chain?.map((redir: string, idx: number) => (
                              <p key={idx} className="text-slate-400 text-[11px] overflow-x-auto whitespace-nowrap">{idx + 1}. {redir}</p>
                            ))}
                          </div>

                          {/* Phishing triggers */}
                          <div className="bg-[#0b0f19]/80 border border-slate-900 rounded p-4 font-mono text-xs space-y-2">
                            <span className="text-slate-500 block uppercase text-[10px] font-bold border-b border-slate-900/80 pb-1.5 mb-2">Heuristic Phishing Triggers</span>
                            {lookupResult.details.phishing_indicators && lookupResult.details.phishing_indicators.length > 0 ? (
                              lookupResult.details.phishing_indicators.map((trig: string, idx: number) => (
                                <p key={idx} className="text-rose-400 flex items-start gap-2">
                                  <span className="text-rose-500 shrink-0">!</span>
                                  <span>{trig}</span>
                                </p>
                              ))
                            ) : (
                              <p className="text-slate-500">No immediate brand spoofing metrics triggered.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rep / Risk indicators */}
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Transparent Risk Score</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className={`font-bold text-lg ${lookupResult.risk.total_score > 70 ? 'text-rose-400' : lookupResult.risk.total_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {lookupResult.risk.total_score}/100
                            </span>
                            <span className="text-[10px] text-slate-500">({lookupResult.risk.classification})</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-mono text-[10px] mb-1">Intelligence Confidence</span>
                          <span className="text-slate-300 font-bold font-mono text-lg">{lookupResult.confidence}%</span>
                        </div>
                      </div>

                      {/* Inject to Active Case */}
                      {role !== 'Viewer' && (
                        <button 
                          onClick={() => handleAddIndicator(lookupResult.value, lookupResult.type)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold rounded text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Link to Incident: {selectedCaseId}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="glass-panel rounded border border-slate-800 p-8 text-center text-slate-500 font-mono text-xs">
                      Enter and audit a domain name or URL to populate registrar analytics.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOG EXTRACTOR */}
          {activeTab === 'message' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">LOG EXTRACTOR & IOC REGEX SCANNER</h2>
                <p className="text-slate-400 text-xs mt-1">Paste raw syslog details, message headers, or email lures to run regex-based IOC extraction.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input block */}
                <div className="glass-panel rounded border border-slate-800 p-6 space-y-4 flex flex-col justify-between h-[500px]">
                  <div className="space-y-3 flex-1 flex flex-col">
                    <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-wider">Raw syslog / Inbound text payload</label>
                    <textarea 
                      value={extractorText}
                      onChange={(e) => setExtractorText(e.target.value)}
                      placeholder="Paste incident log streams containing IPs, links, phone numbers, or hashes here..."
                      className="w-full flex-1 bg-[#0b0f19] border border-slate-800 rounded p-4 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                    />
                  </div>
                  <button 
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-2 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors shrink-0"
                  >
                    {isExtracting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Parse log Indicators</span>
                  </button>
                </div>

                {/* Results block */}
                <div className="glass-panel rounded border border-slate-800 p-6 flex flex-col h-[500px] overflow-hidden">
                  <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3 shrink-0 mb-4">Extracted IOC Lists</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {extractedIOCs ? (
                      Object.keys(extractedIOCs).map((type) => {
                        const items = extractedIOCs[type] || [];
                        if (items.length === 0) return null;
                        return (
                          <div key={type} className="border border-slate-800/80 rounded bg-[#0b0f19]/30 p-3 font-mono text-xs">
                            <span className="text-slate-500 font-bold uppercase text-[10px] block mb-2">{type} ({items.length})</span>
                            <div className="space-y-1.5">
                              {items.map((val: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-4 border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                                  <span className="text-slate-300 font-bold select-all break-all">{val}</span>
                                  {role !== 'Viewer' && (
                                    <button 
                                      onClick={() => handleAddIndicator(val, type)}
                                      className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] uppercase transition-colors shrink-0 border border-emerald-500/15"
                                    >
                                      Inject
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-slate-500 font-mono text-xs">
                        Run the indicator log scanner to output parsed elements here.
                      </div>
                    )}
                    {extractedIOCs && Object.values(extractedIOCs).every((arr: any) => arr.length === 0) && (
                      <div className="h-full flex items-center justify-center text-center text-slate-500 font-mono text-xs">
                        No matches resolved (No IPs, URLs, phone numbers, or hashes detected).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: THREAT MAP */}
          {activeTab === 'threatmap' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">THREAT GEOLOCATION WORKSPACE</h2>
                <p className="text-slate-400 text-xs mt-1">GIS Satellite routing mapping and attack telemetry feeds plotting active cyber vectors.</p>
              </div>

              {/* Attack Vector Indicator Metrics Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel border border-slate-800 rounded p-4 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">DDoS Vector Status</span>
                    <span className="text-lg font-bold text-slate-200 block font-mono">ACTIVE FLOOD</span>
                    <span className="text-[9px] font-mono text-rose-400">Peak: 120 Gbps UDP • 1 Target</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 led-blink-red" />
                </div>
                <div className="glass-panel border border-slate-800 rounded p-4 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Phishing Host campaigns</span>
                    <span className="text-lg font-bold text-slate-200 block font-mono">1 DOMAIN • 4 URLS</span>
                    <span className="text-[9px] font-mono text-amber-400">Harvester: Active Credentials Harvester</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 led-blink-orange" />
                </div>
                <div className="glass-panel border border-slate-800 rounded p-4 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Malware beacons C2</span>
                    <span className="text-lg font-bold text-slate-200 block font-mono">3 CALLBACK NODES</span>
                    <span className="text-[9px] font-mono text-cyan-400">Consensus: Tor exit relays flagged</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 led-blink-green" />
                </div>
              </div>

              {/* Main Map Split Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map Pane (75%) */}
                <div className="lg:col-span-3 glass-panel rounded border border-slate-800 p-5 flex flex-col relative overflow-hidden min-h-[500px]">
                  <div className="scanner-line" />
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/80">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider">
                      GIS GEO-INTELLIGENCE GRAPH ({selectedMapItem.name})
                    </h3>
                    <div className="flex gap-2 p-0.5 bg-[#0b0f19] border border-slate-800 rounded">
                      <button
                        onClick={() => setMapMode('gis')}
                        className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${mapMode === 'gis' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        GIS satellite
                      </button>
                      <button
                        onClick={() => setMapMode('svg')}
                        className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${mapMode === 'svg' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Schematic global
                      </button>
                    </div>
                  </div>

                  {mapMode === 'gis' ? (
                    <div className="w-full h-[400px] rounded border border-slate-900 overflow-hidden relative bg-slate-950">
                      <iframe
                        width="100%"
                        height="400"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${selectedMapItem.lat},${selectedMapItem.lon}&t=k&z=12&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                        className="opacity-90"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[400px] relative bg-[#070a13]/80 border border-slate-900 rounded overflow-hidden flex items-center justify-center">
                      <svg className="w-full h-full opacity-40 text-slate-800" viewBox="0 0 1000 500" fill="currentColor">
                        <path d="M150 150h50v50h-50zM250 120h80v60h-80zM650 180h120v100h-120zM450 300h40v40h-40zM300 280h100v80h-100zM700 320h80v80h-80z" opacity="0.3"/>
                        <rect x="0" y="0" width="1000" height="500" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5"/>
                        <circle cx="500" cy="250" r="230" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="10,20" className="animate-spin" style={{ animationDuration: '40s' }}/>
                      </svg>

                      {/* Germany Node */}
                      <div className="absolute left-[52%] top-[32%] -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 led-blink-red border-2 border-slate-900" />
                      </div>

                      {/* US Target Node */}
                      <div className="absolute left-[25%] top-[36%] -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 led-blink-green border-2 border-slate-900" />
                      </div>

                      {/* SVG Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 500">
                        <path d="M 250 180 Q 385 100 520 160" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" className="animate-[dash_2s_linear_infinite]"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Threat Registry Panel (25%) */}
                <div className="glass-panel rounded border border-slate-800 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800 pb-2">Threat Vector registry</h3>
                    
                    {/* Phone Number Tracker Lookup Form */}
                    <form onSubmit={handleTrackPhone} className="bg-[#070a13]/80 p-2 rounded border border-slate-850">
                      <label className="block text-slate-500 uppercase text-[9px] font-mono tracking-wider mb-1.5">Locate Target Phone Number</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={trackerInput}
                          onChange={(e) => setTrackerInput(e.target.value)}
                          placeholder="e.g. +91 86088 57507"
                          className="flex-1 bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-slate-900 font-bold px-2.5 py-1 rounded text-[10px] uppercase font-mono shrink-0"
                        >
                          Track
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {mapIndicators.map((indicator, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMapItem(indicator);
                            setMapMode('gis');
                          }}
                          className={`w-full text-left p-2.5 rounded border transition-all text-xs font-mono block ${selectedMapItem.name === indicator.name ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#0b0f19] border-slate-850 text-slate-400 hover:border-slate-800'}`}
                        >
                          <div className="font-bold truncate">{indicator.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                            <span>{indicator.type}</span>
                            <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded">{indicator.location.split(',')[0]}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Node details card */}
                  <div className="mt-4 p-3 bg-[#070a13]/90 border border-slate-850 rounded text-xs font-mono space-y-2">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider">Indicator profile Details</div>
                    <div>
                      <span className="text-slate-400 block font-bold truncate">{selectedMapItem.name}</span>
                      <span className="text-slate-500 text-[10px]">{selectedMapItem.type}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500 text-[9px] uppercase">Exact Coordinates</span>
                      Lat: {selectedMapItem.lat.toFixed(4)} • Lon: {selectedMapItem.lon.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500 text-[9px] uppercase">GIS Location</span>
                      {selectedMapItem.location}
                    </div>
                    <div className="text-[10px] text-slate-400/90 border-t border-slate-800/80 pt-1">
                      {selectedMapItem.detail}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: INVESTIGATION GRAPH */}
          {activeTab === 'graph' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">INVESTIGATION GRAPH SCHEMA</h2>
                <p className="text-slate-400 text-xs mt-1">Visual graph mapping out connections between phone numbers, resolved IPs, malicious domains, and case incident links.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Visual canvas */}
                <div className="glass-panel rounded border border-slate-800 p-6 lg:col-span-3 h-[500px] relative overflow-hidden flex items-center justify-center">
                  <div className="scanner-line" />
                  
                  {/* Custom SVG node graph mock */}
                  <svg className="w-full h-full z-10" viewBox="0 0 600 400">
                    {/* Background grid markings */}
                    <rect x="0" y="0" width="600" height="400" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="10,10" opacity="0.3"/>
                    
                    {/* Connections */}
                    {/* Case -> IP */}
                    <line x1="300" y1="200" x2="180" y2="100" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,3" />
                    {/* Case -> Phone */}
                    <line x1="300" y1="200" x2="420" y2="100" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,3" />
                    {/* Case -> URL */}
                    <line x1="300" y1="200" x2="300" y2="320" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,3" />
                    {/* URL -> Domain */}
                    <line x1="300" y1="320" x2="450" y2="300" stroke="#10b981" strokeWidth="1.2" />
                    {/* Domain -> IP */}
                    <line x1="450" y1="300" x2="180" y2="100" stroke="#10b981" strokeWidth="1.2" />
                    {/* IP -> Correlated Case INC-2026-0012 */}
                    <line x1="180" y1="100" x2="80" y2="180" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />

                    {/* Node 1: Target Case Node (INC-2026-0087) */}
                    <g transform="translate(300, 200)" className="cursor-pointer">
                      <circle r="22" fill="#0b0f19" stroke="#10b981" strokeWidth="2.5" />
                      <circle r="14" fill="#10b981" opacity="0.15" />
                      <text dy="4" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">CASE</text>
                      <text y="35" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="bold" fontFamily="monospace">INC-2026-0087</text>
                    </g>

                    {/* Node 2: IP address */}
                    <g transform="translate(180, 100)" className="cursor-pointer">
                      <circle r="18" fill="#0b0f19" stroke="#f43f5e" strokeWidth="2" />
                      <text dy="3" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">IP</text>
                      <text y="30" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">185.220.101.4</text>
                    </g>

                    {/* Node 3: Phone number */}
                    <g transform="translate(420, 100)" className="cursor-pointer">
                      <circle r="18" fill="#0b0f19" stroke="#eab308" strokeWidth="2" />
                      <text dy="3" textAnchor="middle" fill="#eab308" fontSize="9" fontWeight="bold" fontFamily="monospace">PHN</text>
                      <text y="30" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">+15553492048</text>
                    </g>

                    {/* Node 4: URL phishing link */}
                    <g transform="translate(300, 320)" className="cursor-pointer">
                      <circle r="18" fill="#0b0f19" stroke="#f43f5e" strokeWidth="2" />
                      <text dy="3" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">URL</text>
                      <text y="30" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">/verify (path)</text>
                    </g>

                    {/* Node 5: Domain secure-bank-login.net */}
                    <g transform="translate(450, 300)" className="cursor-pointer">
                      <circle r="18" fill="#0b0f19" stroke="#f43f5e" strokeWidth="2" />
                      <text dy="3" textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">DOM</text>
                      <text y="30" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">secure-bank-login.net</text>
                    </g>

                    {/* Node 6: Correlated Incident Case */}
                    <g transform="translate(80, 180)" className="cursor-pointer">
                      <circle r="18" fill="#0b0f19" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                      <text dy="3" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">CORR</text>
                      <text y="30" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">INC-2026-0012</text>
                    </g>
                  </svg>
                </div>

                {/* Graph sidebar details */}
                <div className="glass-panel rounded border border-slate-800 p-6 space-y-4 text-xs font-mono">
                  <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 pb-3">Node Details Panel</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Active Links</span>
                      <p className="text-slate-300 font-bold mt-1">6 Nodes registered</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Overlapping Indicators</span>
                      <p className="text-rose-400 mt-1">IP 185.220.101.4 observed in 1 other case (INC-2026-0012)</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Confidence engine consensus</span>
                      <p className="text-emerald-400 mt-1">High (Risk Score &gt; 80, Confidence rating: 92%)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: EVIDENCE VAULT */}
          {activeTab === 'evidence' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">EVIDENCE VAULT</h2>
                <p className="text-slate-400 text-xs mt-1">Upload syslog files or evidence records. Files are cryptographically verified by SHA-256 signatures.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Uploader panel */}
                {role !== 'Viewer' ? (
                  <div className="glass-panel rounded border border-slate-800 p-6 space-y-4">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3">Secure File Uploader</h3>
                    <form onSubmit={handleUploadEvidence} className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">File Name</label>
                        <input 
                          type="text" 
                          value={evidenceName}
                          onChange={(e) => setEvidenceName(e.target.value)}
                          placeholder="e.g. sms_payload_log.txt"
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Size (Bytes)</label>
                        <input 
                          type="number" 
                          value={evidenceSize}
                          onChange={(e) => setEvidenceSize(Number(e.target.value))}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Format Type</label>
                        <select 
                          value={evidenceType}
                          onChange={(e) => setEvidenceType(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="txt">Text Log (.txt)</option>
                          <option value="csv">CSV Table (.csv)</option>
                          <option value="json">JSON File (.json)</option>
                          <option value="png">Screenshot (.png)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Upload Notes / Remarks</label>
                        <textarea 
                          value={evidenceNotes}
                          onChange={(e) => setEvidenceNotes(e.target.value)}
                          placeholder="Log payload extracted from carrier interface."
                          rows={2}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isUploadingEvidence}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        {isUploadingEvidence ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Encrypt & Record File</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-panel rounded border border-slate-800 p-6 text-center text-slate-500 font-mono text-xs">
                    Upload access restricted. Elevated analyst role credentials required.
                  </div>
                )}

                {/* Vault List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-panel rounded border border-slate-800 p-6">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3 mb-4">Evidence Vault Files</h3>
                    <div className="space-y-4">
                      {caseDetails.evidence?.map((file: any) => (
                        <div key={file.id} className="p-4 bg-[#0b0f19]/80 border border-slate-900 rounded font-mono text-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <FileCode className="w-4 h-4 text-emerald-400" />
                              <span>{file.filename}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">{file.size_bytes} Bytes</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <p>Uploader: <span className="text-slate-300">{file.uploaded_by}</span></p>
                            <p>Logged: <span className="text-slate-300">{new Date(file.timestamp).toLocaleString()}</span></p>
                          </div>

                          <div className="p-2 bg-[#070a13] border border-slate-900 rounded select-all font-mono text-[9px] text-slate-500 break-all">
                            SHA-256: <span className="text-emerald-500 font-bold">{file.id}</span>
                          </div>

                          {file.notes && (
                            <p className="text-[11px] text-slate-400 leading-normal bg-slate-900/40 p-2 border border-slate-900/50 rounded">
                              Remarks: {file.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      {caseDetails.evidence?.length === 0 && (
                        <p className="text-slate-500 text-xs text-center font-mono py-8">No files currently logged in vault.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AI SECURITY COPILOT */}
          {activeTab === 'copilot' && (
            <div className="space-y-8 max-w-4xl mx-auto h-[600px] flex flex-col">
              <div className="shrink-0">
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">AI SECURITY COPILOT</h2>
                <p className="text-slate-400 text-xs mt-1">Converse with the local AI Copilot engine to synthesize case reports or evaluate threat vectors.</p>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 glass-panel rounded border border-slate-800 p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
                  {copilotMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`p-2 rounded border shrink-0 h-8 w-8 flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                      </div>
                      
                      <div className={`p-3.5 rounded text-xs font-mono leading-relaxed border ${msg.role === 'user' ? 'bg-emerald-600/5 border-emerald-500/15 text-emerald-300' : 'bg-[#0b0f19]/80 border-slate-900 text-slate-300'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isCopilotQuerying && (
                    <div className="flex gap-3 max-w-xl">
                      <div className="p-2 rounded border bg-slate-800 border-slate-700 text-slate-300 shrink-0 h-8 w-8 flex items-center justify-center">
                        <Terminal className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="p-3 bg-[#0b0f19]/80 border border-slate-900 rounded text-xs font-mono text-slate-500 animate-pulse">
                        Evaluating incident context database, querying threat reputation logs...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleCopilotQuery} className="mt-4 border-t border-slate-800/80 pt-4 flex gap-3 shrink-0">
                  <input 
                    type="text" 
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    placeholder="Ask Copilot about incident INC-2026-0087 (e.g. why is secure-bank-login.net suspicious?)"
                    className="flex-1 bg-[#0b0f19] border border-slate-800 rounded px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    disabled={isCopilotQuerying}
                  />
                  <button 
                    type="submit"
                    disabled={isCopilotQuerying || !copilotInput}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors text-slate-900 font-bold rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Query</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 10: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">GLOBAL WATCHLIST</h2>
                <p className="text-slate-400 text-xs mt-1">Manage global blocklists and high-alert indicator feeds synchronized with security gateways.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Watchlist add form */}
                {role !== 'Viewer' ? (
                  <div className="glass-panel rounded border border-slate-800 p-6 space-y-4 h-fit">
                    <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3">Watchlist Injector</h3>
                    <form onSubmit={handleAddWatchlist} className="space-y-4">
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Indicator Value</label>
                        <input 
                          type="text" 
                          value={watchAddValue}
                          onChange={(e) => setWatchAddValue(e.target.value)}
                          placeholder="e.g. 185.220.101.4"
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Indicator Type</label>
                        <select 
                          value={watchAddType}
                          onChange={(e) => setWatchAddType(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="IP">IP Address</option>
                          <option value="PHONE">Phone Number</option>
                          <option value="DOMAIN">Domain</option>
                          <option value="URL">URL Link</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Watch Reason</label>
                        <textarea 
                          value={watchAddReason}
                          onChange={(e) => setWatchAddReason(e.target.value)}
                          placeholder="Credential harvesting phishing relay"
                          rows={2}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Risk Severity</label>
                        <select 
                          value={watchAddRisk}
                          onChange={(e) => setWatchAddRisk(e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-1.5 rounded text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lock to Watchlist</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-panel rounded border border-slate-800 p-6 text-center text-slate-500 font-mono text-xs">
                    Watchlist addition restricted. Elevated roles credentials required.
                  </div>
                )}

                {/* Watchlist table */}
                <div className="md:col-span-2 glass-panel rounded border border-slate-800 p-6">
                  <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3 mb-4">Active System Blocklists</h3>
                  <div className="space-y-4">
                    {watchlist.map((wl) => (
                      <div key={wl.id} className="p-4 bg-[#0b0f19]/80 border border-slate-900 rounded font-mono text-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{wl.indicator}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">{wl.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">{wl.reason || 'No watchlist reason provided.'}</p>
                          <p className="text-[9px] text-slate-600">Updated: {new Date(wl.last_observed || wl.created).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${wl.risk === 'CRITICAL' || wl.risk === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{wl.risk}</span>
                      </div>
                    ))}
                    {watchlist.length === 0 && (
                      <p className="text-slate-500 text-xs text-center font-mono py-8">No blocklist entries registered.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: AUDITS */}
          {activeTab === 'audits' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-100">SYSTEM AUDIT LOGS</h2>
                <p className="text-slate-400 text-xs mt-1">Historical ledger tracking every indicator lookup, evidence record injection, and analyst session event.</p>
              </div>

              {/* Logs lists */}
              <div className="glass-panel rounded border border-slate-800 p-6">
                <h3 className="text-slate-200 text-xs font-mono uppercase tracking-wider border-b border-slate-800/80 pb-3 mb-4">Historical Audit Trails</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Operator</th>
                        <th className="py-2.5 px-3">Action Recorded</th>
                        <th className="py-2.5 px-3">Target Resource</th>
                        <th className="py-2.5 px-3">Case Association</th>
                        <th className="py-2.5 px-3">Source Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {audits.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/5 text-slate-400 text-[11px]">
                          <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-300">{log.user}</td>
                          <td className="py-2.5 px-3 text-slate-300">{log.action}</td>
                          <td className="py-2.5 px-3 text-slate-400">{log.target_resource || 'System'}</td>
                          <td className="py-2.5 px-3 text-emerald-500 font-bold">{log.investigation_id || 'Global'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{log.ip_address}</td>
                        </tr>
                      ))}
                      {audits.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">No logs stored in local audits tables.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
