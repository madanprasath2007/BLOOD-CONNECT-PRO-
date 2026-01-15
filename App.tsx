import React, { useState, useEffect, useCallback } from 'react';
import { 
  Droplet, LayoutDashboard, Bell, LogOut, PlusSquare, Database, Users, 
  CalendarDays, Stethoscope, Trophy, Radar, Globe, Palette, Zap
} from 'lucide-react';
import EmergencyFeed from './components/EmergencyFeed';
import BloodDriveList from './components/BloodDriveList';
import NearbyScanner from './components/NearbyScanner';
import AIAssistant from './components/AIAssistant';
import LoginPage from './components/LoginPage';
import HospitalRequestForm from './components/HospitalRequestForm';
import StockManagement from './components/StockManagement';
import DonorDatabase from './components/DonorDatabase';
import ChatBot from './components/ChatBot';
import { EmergencyRequest, AuthenticatedUser, BloodType } from './services/types';
import { getCurrentPosition, GeoCoords } from './services/locationService';
import { subscribeToNetwork, NetworkEvent } from './services/networkService';
import { backendService } from './services/backendService';

interface Notification {
  id: string;
  text: string;
  time: string;
  type: 'info' | 'success' | 'alert';
}

type TabType = 'feed' | 'scanner' | 'drives' | 'new-request' | 'register-donor' | 'my-stock' | 'donor-db' | 'schedule' | 'eligibility' | 'leaderboard' | 'campaign-studio';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [allRequests, setAllRequests] = useState<EmergencyRequest[]>([]);
  const [userLocation, setUserLocation] = useState<GeoCoords | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifPulse, setNewNotifPulse] = useState(false);

  const refreshData = useCallback(() => {
    const latestRequests = backendService.getEmergencyRequests();
    setAllRequests(latestRequests);
  }, []);

  const addNotification = useCallback((text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    };
    setNotifications((prev: Notification[]) => [newNotif, ...prev]);
    setNewNotifPulse(true);
    setTimeout(() => setNewNotifPulse(false), 3000);
  }, []);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToNetwork((event: NetworkEvent) => {
      if (event.type === 'GLOBAL_SOS') {
        addNotification(`🚨 URGENT SOS: ${event.payload.hospitalName} needs ${event.payload.request.bloodType}!`, 'alert');
        refreshData();
      } else if (event.type === 'DATA_CHANGE') {
        refreshData();
      }
    });
    return () => unsubscribe();
  }, [addNotification, refreshData]);

  useEffect(() => {
    getCurrentPosition().then(setUserLocation).catch(() => setUserLocation({ latitude: 28.6139, longitude: 77.2090 }));
    const saved = localStorage.getItem('redconnect_user');
    if (saved) { 
      try { 
        setUser(JSON.parse(saved)); 
      } catch (e) { 
        localStorage.removeItem('redconnect_user'); 
      } 
    }
  }, []);

  const handleLogin = (u: AuthenticatedUser) => {
    setUser(u);
    localStorage.setItem('redconnect_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('redconnect_user');
  };

  const handleCreateRequest = (requestData: Partial<EmergencyRequest>) => {
    const newReq: EmergencyRequest = {
      id: `req-${Date.now()}`,
      patientName: requestData.patientName!,
      bloodType: requestData.bloodType!,
      unitsNeeded: requestData.unitsNeeded!,
      hospital: user?.name || 'Hospital',
      location: 'Emergency Wing',
      urgency: requestData.urgency || 'Normal',
      isPlateletRequest: requestData.isPlateletRequest || false,
      contact: 'Emergency Desk',
      timestamp: 'Just now',
      coordinates: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined
    };
    backendService.saveEmergencyRequest(newReq);
    setActiveTab('feed');
    addNotification(`Request broadcasted to network.`, 'success');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const NavButton = ({ tab, icon: Icon, label, color = 'bg-red-600' }: { tab: TabType, icon: any, label: string, color?: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
        activeTab === tab ? `${color} text-white shadow-xl` : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-slate-50/50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">RED CONNECT<span className="text-red-600">PRO</span></h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Medical Command Cloud</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <button className={`p-2.5 bg-white rounded-xl text-slate-500 hover:bg-slate-50 transition-all border border-slate-200 ${newNotifPulse ? 'ring-2 ring-red-500 animate-bounce' : ''}`}>
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:grid md:grid-cols-12 md:gap-8">
        <nav className="hidden md:flex md:col-span-3 flex-col h-[calc(100vh-140px)] sticky top-28 space-y-2">
          {user.role === 'Hospital' && (
            <div className="space-y-2 mb-4">
              <button onClick={() => handleCreateRequest({ bloodType: 'O-', unitsNeeded: 2, urgency: 'Critical' })} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-red-600 rounded-2xl font-black text-white shadow-xl hover:bg-red-700 transition-all active:scale-95">
                <Zap className="w-5 h-5" /><span className="uppercase text-xs tracking-widest">SOS BROADCAST</span>
              </button>
              <NavButton tab="new-request" icon={PlusSquare} label="Post Case" color="bg-slate-900" />
            </div>
          )}
          
          {user.role === 'BloodBank' && (
            <div className="space-y-2 mb-4">
              <NavButton tab="my-stock" icon={Database} label="Stock Inventory" color="bg-slate-900" />
              <NavButton tab="campaign-studio" icon={Palette} label="Campaign Studio" color="bg-indigo-600" />
              <NavButton tab="donor-db" icon={Users} label="Donor Registry" color="bg-slate-900" />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4">Global Network</h3>
            <NavButton tab="feed" icon={LayoutDashboard} label="Operations Feed" color="bg-red-600" />
            <NavButton tab="scanner" icon={Radar} label="Nearby Scanner" color="bg-slate-900" />
            <NavButton tab="drives" icon={Globe} label="Community Drives" color="bg-slate-900" />
          </div>
          
          <div className="flex-grow"></div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-400 hover:text-red-600 transition-all"><LogOut className="w-5 h-5" />Logout</button>
        </nav>

        <section className="md:col-span-9">
          {activeTab === 'new-request' && <HospitalRequestForm hospitalName={user.name} onSubmit={handleCreateRequest} />}
          {activeTab === 'my-stock' && (
            <StockManagement 
              bankName={user.name} 
              initialInventory={{
                'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
              }} 
              initialPlatelets={0} 
            />
          )}
          {activeTab === 'donor-db' && <DonorDatabase userLocation={userLocation} />}
          {activeTab === 'feed' && <EmergencyFeed requests={allRequests} onMatch={setSelectedRequest} dengueMode={false} userLocation={userLocation} />}
          {activeTab === 'scanner' && <NearbyScanner initialLocation={userLocation} />}
          {activeTab === 'drives' && <BloodDriveList onNotify={addNotification} user={user} initialLocation={userLocation} />}
        </section>
      </main>

      <AIAssistant request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      <ChatBot />
    </div>
  );
};

export default App;
