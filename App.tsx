
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Droplet, LayoutDashboard, Bell, LogOut, PlusSquare, Database, Users, 
  CalendarDays, Stethoscope, Trophy, Radar, Globe, Zap, ClipboardCheck,
  Droplets, Activity, MonitorPlay, Sparkles, Maximize2, RefreshCw, Shield,
  WifiOff, CloudOff, AlertTriangle
} from 'lucide-react';
import EmergencyFeed from './components/EmergencyFeed';
import BloodDriveList from './components/BloodDriveList';
import NearbyScanner from './components/NearbyScanner';
import AIAssistant from './components/AIAssistant';
import LoginPage from './components/LoginPage';
import HospitalRequestForm from './components/HospitalRequestForm';
import StockManagement from './components/StockManagement';
import DonorDatabase from './components/DonorDatabase';
import BloodAllocation from './components/BloodAllocation';
import BloodCollection from './components/BloodCollection';
import ChatBot from './components/ChatBot';
import DonationSchedule from './components/DonationSchedule';
import EligibilityChecker from './components/EligibilityChecker';
import Leaderboard from './components/Leaderboard';
import HospitalStatusDashboard from './components/HospitalStatusDashboard';
import CampaignGenerator from './components/CampaignGenerator';
import { EmergencyRequest, AuthenticatedUser } from './services/types';
import { getCurrentPosition, GeoCoords, startLocationWatch } from './services/locationService';
import { subscribeToNetwork, NetworkEvent } from './services/networkService';
import { backendService } from './services/backendService';

interface Notification {
  id: string;
  text: string;
  time: string;
  type: 'info' | 'success' | 'alert';
}

type TabType = 'feed' | 'scanner' | 'drives' | 'new-request' | 'register-donor' | 'my-stock' | 'donor-db' | 'allocation' | 'schedule' | 'eligibility' | 'leaderboard' | 'collection' | 'hospital-status' | 'campaign-studio';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [allRequests, setAllRequests] = useState<EmergencyRequest[]>([]);
  const [userLocation, setUserLocation] = useState<GeoCoords | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifPulse, setNewNotifPulse] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [systemStatus, setSystemStatus] = useState({ gps: 'waiting', cloud: 'online' });

  const refreshData = useCallback(() => {
    const latestRequests = backendService.getEmergencyRequests();
    setAllRequests(latestRequests);
  }, []);

  const chatContextSummary = useMemo(() => {
    if (activeTab === 'feed') {
      const pending = allRequests.filter(r => r.status === 'Pending').length;
      return `There are currently ${allRequests.length} active cases in the feed, with ${pending} awaiting units.`;
    }
    if (activeTab === 'donor-db') {
      const donors = backendService.getDonors();
      const available = donors.filter(d => d.isAvailable).length;
      return `The donor registry contains ${donors.length} records, with ${available} currently available for immediate donation.`;
    }
    if (activeTab === 'my-stock') {
      const bags = backendService.getBloodBags();
      return `The institutional inventory has ${bags.length} blood bags registered in the local ledger.`;
    }
    return "User is browsing general command center modules.";
  }, [activeTab, allRequests]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        addNotification("Full-screen restricted by platform policy", "alert");
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const hardResetSystem = () => {
    addNotification("Initiating System Re-Sync...", "info");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const addNotification = useCallback((text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif: Notification = { id: Date.now().toString(), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type };
    setNotifications(prev => [newNotif, ...prev]);
    setNewNotifPulse(true);
    setTimeout(() => setNewNotifPulse(false), 3000);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addNotification("Network Restored. Live cloud sync active.", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      addNotification("Network Lost. Operating in Offline/Cached Mode.", "alert");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    refreshData();
    const handleApiReload = () => refreshData();
    window.addEventListener('RED_CONNECT_API_RELOAD', handleApiReload);
    
    const unsubscribe = subscribeToNetwork((event: NetworkEvent) => {
      if (event.type === 'GLOBAL_SOS') {
        addNotification(`🚨 EMERGENCY: ${event.payload.hospitalName} requires ${event.payload.request.bloodType}!`, 'alert');
        refreshData();
      } else if (event.type === 'DATA_CHANGE') {
        refreshData();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('RED_CONNECT_API_RELOAD', handleApiReload);
      unsubscribe();
    };
  }, [addNotification, refreshData]);

  useEffect(() => {
    getCurrentPosition()
      .then((coords) => {
        setUserLocation(coords);
        setSystemStatus(prev => ({ ...prev, gps: 'active' }));
      })
      .catch((err) => {
        console.warn("Bootstrap Signal Lock Pending:", err.message);
        setUserLocation({ latitude: 13.0827, longitude: 80.2707, accuracy: 'fixed' });
        setSystemStatus(prev => ({ ...prev, gps: 'manual' }));
      });

    const watchId = startLocationWatch(
      (coords) => setUserLocation(coords), 
      (err) => {}
    );

    const saved = localStorage.getItem('redconnect_user');
    if (saved) { 
      try { 
        setUser(JSON.parse(saved)); 
      } catch (e) { 
        localStorage.removeItem('redconnect_user'); 
      } 
    }
    return () => { if (watchId !== -1) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const handleLogin = (u: AuthenticatedUser) => {
    setUser(u);
    localStorage.setItem('redconnect_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    backendService.purgeSessionData();
    setUser(null);
    localStorage.removeItem('redconnect_user');
  };

  const handleCreateRequest = (requestData: Partial<EmergencyRequest>) => {
    const newReq: EmergencyRequest = {
      id: `REQ-${Date.now()}`,
      patientName: requestData.patientName || 'Emergency Case',
      bloodType: requestData.bloodType!,
      unitsNeeded: requestData.unitsNeeded!,
      hospital: user?.name || 'Medical Facility',
      location: 'Emergency Wing',
      urgency: requestData.urgency || 'Normal',
      isPlateletRequest: requestData.isPlateletRequest || false,
      contact: user?.email || 'Medical Desk',
      timestamp: 'Just now',
      coordinates: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined,
      status: 'Pending'
    };
    backendService.saveEmergencyRequest(newReq);
    setActiveTab('hospital-status'); 
    addNotification(`SOS Broadcast successful. Tracking live relay.`, 'success');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const NavButton = ({ tab, icon: Icon, label, color = 'bg-red-600' }: { tab: TabType, icon: any, label: string, color?: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeTab === tab ? `${color} text-white shadow-xl` : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-slate-50/50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3 md:px-8 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg"><Droplet className="w-6 h-6 text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">RED COMMAND<span className="text-red-600">PRO</span></h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Medical Command Cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {isOffline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200 shadow-sm animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-widest hidden lg:inline">Offline / Cached</span>
              </div>
            )}
            
            <button 
              onClick={toggleFullScreen}
              title="Maximize Command View"
              className={`p-2 rounded-xl transition-all ${isFullScreen ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={hardResetSystem}
              title="Re-Sync State (Internal Refresh)"
              className="p-2 rounded-xl text-slate-500 hover:bg-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
               <div className={`w-2 h-2 rounded-full ${systemStatus.gps === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 hidden md:inline">
                 {systemStatus.gps === 'active' ? 'Satellite Lock' : 'Semantic Sector'}
               </span>
               <Shield className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className={`p-2.5 bg-white rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-slate-200 relative ${newNotifPulse ? 'ring-2 ring-red-500' : ''}`} aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {newNotifPulse && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>}
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm"><img src={user.avatar} className="w-full h-full object-cover" alt="Profile" /></div>
          </div>
        </div>
      </header>

      {isOffline && (
        <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center flex items-center justify-center gap-2">
          <CloudOff className="w-4 h-4" /> 
          Critical Connectivity Lost • Running on Local Medical Registry Cache
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 md:grid md:grid-cols-12 md:gap-8">
        <nav className="hidden md:flex md:col-span-3 flex-col h-[calc(100vh-140px)] sticky top-28 space-y-2 overflow-y-auto scrollbar-hide">
          {user.role === 'Hospital' && (
            <div className="space-y-2 mb-2">
              <button onClick={() => handleCreateRequest({ bloodType: 'O-', unitsNeeded: 1, urgency: 'Critical' })} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-red-600 rounded-2xl font-black text-white shadow-xl hover:bg-red-700 transition-all active:scale-95 mb-2 group">
                <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" /><span className="uppercase text-xs tracking-widest">SOS BROADCAST</span>
              </button>
              <NavButton tab="new-request" icon={PlusSquare} label="Post Case" color="bg-slate-900" />
              <NavButton tab="hospital-status" icon={MonitorPlay} label="SOS Tracking" color="bg-red-600" />
            </div>
          )}
          {user.role === 'BloodBank' && (
            <div className="space-y-2 mb-4">
              <NavButton tab="collection" icon={Droplets} label="Blood Collection" color="bg-red-600" />
              <NavButton tab="allocation" icon={ClipboardCheck} label="Dispatch Command" color="bg-slate-900" />
              <NavButton tab="my-stock" icon={Database} label="Stock Inventory" color="bg-slate-900" />
              <NavButton tab="donor-db" icon={Users} label="Donor Registry" color="bg-slate-900" />
              <NavButton tab="campaign-studio" icon={Sparkles} label="Campaign Studio" color="bg-indigo-600" />
            </div>
          )}
          {user.role === 'Donor' && (
            <div className="space-y-2 mb-4">
              <NavButton tab="schedule" icon={CalendarDays} label="Donation Timeline" color="bg-red-600" />
              <NavButton tab="eligibility" icon={Stethoscope} label="Health Scanner" color="bg-indigo-600" />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4 text-nowrap">Global Network</h3>
            <NavButton tab="feed" icon={LayoutDashboard} label="Operations Feed" color="bg-red-600" />
            <NavButton tab="scanner" icon={Radar} label="Nearby Scanner" color="bg-slate-900" />
            <NavButton tab="drives" icon={Globe} label="Community Drives" color="bg-slate-900" />
            <NavButton tab="leaderboard" icon={Trophy} label="Leaderboard" color="bg-amber-500" />
          </div>
          <div className="flex-grow"></div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-400 hover:text-red-600 transition-all"><LogOut className="w-5 h-5" />Logout</button>
        </nav>
        
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-100 flex items-center justify-around py-3 px-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
           <button onClick={() => setActiveTab('feed')} className={`p-3 rounded-2xl transition-all ${activeTab === 'feed' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-6 h-6" />
           </button>
           <button onClick={() => setActiveTab('scanner')} className={`p-3 rounded-2xl transition-all ${activeTab === 'scanner' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
              <Radar className="w-6 h-6" />
           </button>
           <button onClick={() => setActiveTab('drives')} className={`p-3 rounded-2xl transition-all ${activeTab === 'drives' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
              <Globe className="w-6 h-6" />
           </button>
           {user.role === 'Hospital' && (
             <button onClick={() => setActiveTab('new-request')} className="p-3 bg-red-600 text-white rounded-2xl shadow-xl -translate-y-4 border-4 border-white">
                <PlusSquare className="w-7 h-7" />
             </button>
           )}
           <button onClick={() => setActiveTab('leaderboard')} className={`p-3 rounded-2xl transition-all ${activeTab === 'leaderboard' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}>
              <Trophy className="w-6 h-6" />
           </button>
        </nav>

        <section className="md:col-span-9">
          {activeTab === 'feed' && <EmergencyFeed requests={allRequests} onMatch={setSelectedRequest} dengueMode={false} userLocation={userLocation} user={user} />}
          {activeTab === 'scanner' && <NearbyScanner initialLocation={userLocation} />}
          {activeTab === 'drives' && <BloodDriveList onNotify={addNotification} user={user} initialLocation={userLocation} />}
          {activeTab === 'new-request' && <HospitalRequestForm hospitalName={user.name} onSubmit={handleCreateRequest} />}
          {activeTab === 'hospital-status' && <HospitalStatusDashboard hospitalName={user.name} requests={allRequests} />}
          {activeTab === 'my-stock' && <StockManagement bankId={user.id} bankName={user.name} />}
          {activeTab === 'donor-db' && <DonorDatabase bankId={user.id} userLocation={userLocation} />}
          {activeTab === 'allocation' && <BloodAllocation bankId={user.id} bankName={user.name} />}
          {activeTab === 'collection' && <BloodCollection bankId={user.id} bankName={user.name} userLocation={userLocation} />}
          {activeTab === 'schedule' && <DonationSchedule lastDonationDate="2025-12-12" bloodType="O+" onNavigateToDrives={() => setActiveTab('drives')} />}
          {activeTab === 'eligibility' && <EligibilityChecker onVerified={(advice) => addNotification(`Health Assessment: ${advice}`, 'info')} />}
          {activeTab === 'leaderboard' && <Leaderboard userLocation={userLocation} />}
          {activeTab === 'campaign-studio' && <CampaignGenerator />}
        </section>
      </main>
      <AIAssistant request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      {!isOffline && <ChatBot currentTab={activeTab} contextSummary={chatContextSummary} />}
    </div>
  );
};

export default App;