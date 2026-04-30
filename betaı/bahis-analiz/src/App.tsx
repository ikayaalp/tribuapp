import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Activity, 
  TrendingUp, 
  ChevronRight, 
  Search,
  Bell,
  Menu,
  Clock,
  LayoutGrid,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFixtures } from './hooks/useFixtures';
import type { Fixture } from './types/sportmonks';
import { LEAGUES } from './config/api';

const App = () => {
  const [activeDate, setActiveDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null); // NULL meaning ALL leagues
  const { fixtures, loading, error } = useFixtures(activeDate);
  
  // Filter and sort fixtures
  const filteredFixtures = fixtures.filter(f => 
    selectedLeague === null || f.league?.name.toLowerCase().includes(
      LEAGUES.find(l => l.id === selectedLeague)?.name.toLowerCase() || ''
    )
  );

  const sortedFixtures = [...filteredFixtures].sort((a, b) => 
    a.starting_at.localeCompare(b.starting_at)
  );

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-surface border-r border-slate-800 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-background" />
          </div>
          {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight italic">BET ANALİZ</h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <NavItem 
            icon={<LayoutGrid size={20} />} 
            label="Tüm Maçlar" 
            active={selectedLeague === null} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(null)}
          />
          <NavItem icon={<Activity size={20} />} label="Canlı Skor" isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} />} label="Fikstür" isOpen={isSidebarOpen} />
          <div className="pt-4 pb-2 px-2 text-[10px] font-bold text-muted uppercase tracking-widest">
            {isSidebarOpen ? 'Favori Ligler' : '...'}
          </div>
          <NavItem 
            icon={<Trophy size={18} />} 
            label="Süper Lig" 
            active={selectedLeague === 600} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(600)}
          />
          <NavItem 
            icon={<Trophy size={18} />} 
            label="Premier League" 
            active={selectedLeague === 8} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(8)}
          />
          <NavItem 
            icon={<Trophy size={18} />} 
            label="La Liga" 
            active={selectedLeague === 564} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(564)}
          />
          <NavItem 
            icon={<Trophy size={18} />} 
            label="Bundesliga" 
            active={selectedLeague === 82} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(82)}
          />
          <NavItem 
            icon={<Trophy size={18} />} 
            label="Serie A" 
            active={selectedLeague === 384} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(384)}
          />
          <NavItem 
            icon={<Trophy size={18} />} 
            label="Ligue 1" 
            active={selectedLeague === 301} 
            isOpen={isSidebarOpen} 
            onClick={() => setSelectedLeague(301)}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 text-muted text-[10px]">
          {isSidebarOpen ? "© 2026 BET ANALİZ v1.0" : "v1.0"}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-6">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
               <Menu size={20} />
             </button>
             <div className="flex flex-col">
               <h2 className="font-bold text-lg leading-tight uppercase tracking-tight">
                 {format(activeDate, 'd MMMM yyyy', { locale: tr })}
               </h2>
               <span className="text-[10px] text-primary font-bold">{fixtures.length} MAÇ BULUNDU</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 mr-4">
               <button 
                onClick={() => {
                  const d = new Date(activeDate);
                  d.setDate(d.getDate() - 1);
                  setActiveDate(d);
                }} 
                className="p-1.5 hover:bg-slate-800 rounded text-xs font-bold"
               >
                 Dün
               </button>
               <button 
                onClick={() => setActiveDate(new Date())} 
                className={`p-1.5 rounded text-xs font-bold border ${format(activeDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-slate-900 border-slate-700' : 'hover:bg-slate-800 border-transparent'}`}
               >
                 Bugün
               </button>
               <button 
                onClick={() => {
                  const d = new Date(activeDate);
                  d.setDate(d.getDate() + 1);
                  setActiveDate(d);
                }} 
                className="p-1.5 hover:bg-slate-800 rounded text-xs font-bold"
               >
                 Yarın
               </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Maç ara..." 
                className="bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 w-48 focus:outline-none focus:border-primary transition-all text-sm"
              />
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950/20">
           <div className="max-w-4xl mx-auto space-y-8">
              {/* Featured Stat Bar */}
              {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="BUGÜNÜN MAÇI" value={fixtures.length.toString()} color="primary" />
                  <StatCard label="CANLI" value={fixtures.filter(f => f.result_info?.includes('Live') || f.result_info?.includes('Match Starting')).length.toString()} color="secondary" />
                  <StatCard label="TAMAMLANAN" value={fixtures.filter(f => f.result_info?.includes('FT') || f.result_info?.includes('AET')).length.toString()} color="accent" />
                  <StatCard label="LİG SAYISI" value="6" color="muted" />
                </div>
              )}

              {/* Match List */}
              <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="font-black text-xl tracking-tighter italic">GÜNCEL BÜLTEN</h3>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button className="px-3 py-1 bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider">Tümü</button>
                    <button className="px-3 py-1 text-muted text-xs font-bold uppercase tracking-wider hover:text-white transition-colors">Analiz</button>
                  </div>
                </div>

                {loading ? (
                   <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold tracking-[0.2em] text-[10px] uppercase">VERİLER ALINIYOR...</span>
                   </div>
                ) : error ? (
                   <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                     <p className="text-red-500 font-bold mb-2">VERİ BAĞLANTISI HATASI</p>
                     <p className="text-xs opacity-60 uppercase tracking-widest">{error}</p>
                   </div>
                ) : sortedFixtures.length === 0 ? (
                  <div className="py-20 text-center text-muted italic bg-surface/30 rounded-3xl border border-slate-800">
                    Bu tarih için seçili liglerde maç bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedFixtures.map((fixture) => (
                      <MatchCard key={fixture.id} fixture={fixture} onAnalyze={() => setSelectedFixture(fixture)} />
                    ))}
                  </div>
                )}
              </div>
           </div>
        </div>
      </main>

      {/* Analysis Modal */}
      {selectedFixture && (
        <AnalysisModal 
          fixture={selectedFixture} 
          onClose={() => setSelectedFixture(null)} 
        />
      )}
    </div>
  );
};

// --- Sub-components ---

const NavItem = ({ icon, label, active = false, isOpen, onClick }: { icon: React.ReactNode, label: string, active?: boolean, isOpen: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
    active 
      ? 'bg-primary text-background font-bold shadow-lg shadow-primary/20' 
      : 'text-muted hover:bg-slate-800/50 hover:text-slate-100'
  }`}>
    <span className={`${active ? 'text-background' : 'group-hover:text-primary transition-colors'}`}>{icon}</span>
    {isOpen && <span className="text-sm truncate uppercase tracking-tight">{label}</span>}
  </button>
);

const StatCard = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colorMap: { [key: string]: string } = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    secondary: "border-secondary/20 bg-secondary/5 text-secondary",
    accent: "border-accent/20 bg-accent/5 text-accent",
    muted: "border-slate-800 bg-slate-900 text-slate-400",
  };
  
  return (
    <div className={`p-4 border rounded-2xl flex flex-col justify-center items-center h-24 ${colorMap[color]}`}>
      <span className="text-[9px] font-black tracking-[0.2em] opacity-60 mb-2 uppercase">{label}</span>
      <div className="text-3xl font-black italic tabular-nums">{value}</div>
    </div>
  );
};

const MatchCard = ({ fixture, onAnalyze }: { fixture: Fixture, onAnalyze: () => void }) => {
  const homeParticipant = fixture.participants.find(p => p.meta.location === 'home');
  const awayParticipant = fixture.participants.find(p => p.meta.location === 'away');
  
  const getScore = (pId: number) => {
    return fixture.scores.find(s => s.description === 'CURRENT' && s.score.participant_id === pId)?.score.goals ?? 0;
  };

  const getXG = (pId: number) => {
    const xgStat = fixture.xgfixture?.find(s => s.type_id === 5304 && s.participant_id === pId);
    if (xgStat) return parseFloat(xgStat.data.value.toString()).toFixed(2);
    const stdStats = fixture.statistics?.find(s => s.type_id === 5304 && s.participant_id === pId);
    if (stdStats) return parseFloat(stdStats.data.value.toString()).toFixed(2);
    return "0.00";
  };

  const homeXG = parseFloat(getXG(homeParticipant?.id || 0));
  const awayXG = parseFloat(getXG(awayParticipant?.id || 0));
  const totalXG = homeXG + awayXG || 1;
  const homeXGWidth = (homeXG / totalXG) * 100;

  const isLive = fixture.result_info?.includes('Live') || fixture.result_info?.includes('1H') || fixture.result_info?.includes('2H');

  return (
    <div 
      className="card hover:border-primary/40 transition-all cursor-pointer group hover:bg-slate-900/40"
      onClick={onAnalyze}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Time / Status */}
        <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-800 pr-4">
          {isLive ? (
            <span className="badge-live">Canlı</span>
          ) : (
            <div className="flex flex-col items-center">
               <span className="text-[11px] font-bold text-slate-100">{format(parseISO(fixture.starting_at), 'HH:mm')}</span>
               <span className="text-[9px] text-muted-foreground uppercase opacity-50 mt-1">{fixture.league?.name.substring(0, 10)}</span>
            </div>
          )}
        </div>

        {/* Teams & Score */}
        <div className="flex-1 flex items-center justify-between px-4">
          {/* Home */}
          <div className="flex items-center gap-3 lg:gap-4 flex-1 justify-end">
            <span className="font-bold text-xs lg:text-sm text-right hidden sm:inline truncate max-w-[120px]">{homeParticipant?.name}</span>
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-primary/20 overflow-hidden p-1 shadow-sm shrink-0">
               {homeParticipant?.image_path ? <img src={homeParticipant.image_path} alt="" className="w-full h-full object-contain" /> : <Clock size={14} className="opacity-20" />}
            </div>
          </div>

          {/* Score Box */}
          <div className="flex flex-col items-center gap-1 mx-4 lg:mx-8">
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-1.5 lg:px-6 lg:py-2.5 rounded-2xl border border-slate-800 group-hover:border-primary/30 transition-all shadow-inner relative">
               <span className={`text-xl lg:text-2xl font-black tabular-nums tracking-tighter ${isLive ? 'text-primary' : ''}`}>
                 {homeParticipant ? getScore(homeParticipant.id) : 0}
               </span>
               <span className="text-muted font-bold opacity-10">:</span>
               <span className={`text-xl lg:text-2xl font-black tabular-nums tracking-tighter ${isLive ? 'text-primary' : ''}`}>
                 {awayParticipant ? getScore(awayParticipant.id) : 0}
               </span>
            </div>
          </div>

          {/* Away */}
          <div className="flex items-center gap-3 lg:gap-4 flex-1">
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-primary/20 overflow-hidden p-1 shadow-sm shrink-0">
               {awayParticipant?.image_path ? <img src={awayParticipant.image_path} alt="" className="w-full h-full object-contain" /> : <Clock size={14} className="opacity-20" />}
            </div>
            <span className="font-bold text-xs lg:text-sm hidden sm:inline truncate max-w-[120px]">{awayParticipant?.name}</span>
          </div>
        </div>

        {/* xG Preview Bar */}
        <div className="hidden md:flex flex-col items-end min-w-[140px] border-l border-slate-800 pl-6 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-30 tracking-widest">Expected</span>
            <span className="text-xs font-bold tabular-nums text-primary">{homeXG}</span>
            <span className="text-[10px] text-muted opacity-20">/</span>
            <span className="text-xs font-bold tabular-nums text-secondary">{awayXG}</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden flex">
            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${homeXGWidth}%` }}></div>
            <div className="bg-secondary h-full transition-all duration-1000 flex-1"></div>
          </div>
        </div>
        
        <div className="flex items-center px-2">
          <ChevronRight size={18} className="text-muted transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

const AnalysisModal = ({ fixture, onClose }: { fixture: Fixture, onClose: () => void }) => {
  const home = fixture.participants.find(p => p.meta.location === 'home');
  const away = fixture.participants.find(p => p.meta.location === 'away');

  const getStat = (typeId: number, pId: number) => {
    const stat = fixture.statistics?.find(s => s.type_id === typeId && s.participant_id === pId);
    return stat?.data.value || "0";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="bg-surface border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-full">
         {/* Modal Header */}
         <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
            <div className="flex items-center gap-2">
               <TrendingUp className="text-primary" size={20} />
               <span className="font-black text-sm uppercase tracking-widest italic">MAÇ ANALİZİ</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
               <X size={20} />
            </button>
         </div>

         {/* Modal Content */}
         <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Scoreboard */}
            <div className="flex items-center justify-between px-4">
               <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 overflow-hidden p-2">
                     <img src={home?.image_path} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-center leading-tight">{home?.name}</span>
               </div>

               <div className="flex flex-col items-center gap-2 px-8">
                  <div className="text-4xl lg:text-5xl font-black tracking-tighter tabular-nums text-primary italic">
                    {fixture.scores.find(s => s.description === 'CURRENT' && s.score.participant_id === home?.id)?.score.goals || 0}
                    <span className="text-muted mx-2 opacity-20">:</span>
                    {fixture.scores.find(s => s.description === 'CURRENT' && s.score.participant_id === away?.id)?.score.goals || 0}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">{fixture.result_info || 'BAŞLAMADI'}</span>
               </div>

               <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 overflow-hidden p-2">
                     <img src={away?.image_path} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-center leading-tight">{away?.name}</span>
               </div>
            </div>

            {/* Statistics Bar Charts */}
            <div className="space-y-6">
               <h4 className="text-xs font-black uppercase tracking-widest text-primary border-l-2 border-primary pl-3">Maç İstatistikleri</h4>
               
               <div className="space-y-5 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
                  <StatRow label="Topla Oynama" home={getStat(45, home?.id || 0)} away={getStat(45, away?.id || 0)} percent />
                  <StatRow label="Şutlar" home={getStat(86, home?.id || 0)} away={getStat(86, away?.id || 0)} />
                  <StatRow label="İsabetli Şut" home={getStat(154, home?.id || 0)} away={getStat(154, away?.id || 0)} />
                  <StatRow label="Korner" home={getStat(34, home?.id || 0)} away={getStat(34, away?.id || 0)} />
                  <StatRow label="Beklenen Gol (xG)" home={getStat(5304, home?.id || 0)} away={getStat(5304, away?.id || 0)} accent />
               </div>
            </div>

            {/* AI Insights / Betting Tips */}
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl space-y-3 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity size={80} />
               </div>
               <div className="flex items-center gap-2 text-primary">
                  <TrendingUp size={18} />
                  <span className="font-black text-sm uppercase tracking-tight">Bahis Analiz Yaklaşımı</span>
               </div>
               <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {parseFloat(getStat(5304, home?.id || 0).toString()) + parseFloat(getStat(5304, away?.id || 0).toString()) > 2.5 
                    ? `Bu maçta xG beklentisi oldukça yüksek (${(parseFloat(getStat(5304, home?.id || 0).toString()) + parseFloat(getStat(5304, away?.id || 0).toString())).toFixed(2)}). Ofansif bir mücadele bekliyoruz.`
                    : `${home?.name} savunma disipliniyle ön planda. xG üretimi düşük seviyede seyrediyor.`
                  }
                  <span className="text-primary font-bold block mt-2">
                    Öneri: {parseFloat(getStat(5304, home?.id || 0).toString()) + parseFloat(getStat(5304, away?.id || 0).toString()) > 2.5 ? '2.5 Üst / KG Var' : '2.5 Alt / Taraf Bahsi'}
                  </span>
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, home, away, percent = false, accent = false }: { label: string, home: string | number, away: string | number, percent?: boolean, accent?: boolean }) => {
  const hVal = parseFloat(home.toString());
  const aVal = parseFloat(away.toString());
  const total = hVal + aVal || 1;
  const hWidth = (hVal / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
        <span className={accent ? 'text-primary' : 'text-slate-400'}>{home}{percent ? '%' : ''}</span>
        <span className="text-slate-500 font-medium opacity-50">{label}</span>
        <span className={accent ? 'text-secondary' : 'text-slate-400'}>{away}{percent ? '%' : ''}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-950 rounded-full flex overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${accent ? 'bg-primary' : 'bg-slate-700'}`} style={{ width: `${hWidth}%` }}></div>
        <div className={`h-full transition-all duration-1000 flex-1 ${accent ? 'bg-secondary' : 'bg-slate-800'}`}></div>
      </div>
    </div>
  );
};

export default App;
