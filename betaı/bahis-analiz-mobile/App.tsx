import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  TextInput
} from 'react-native';
import { 
  Trophy, 
  Calendar, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  MessageCircle,
  User,
  Settings,
  TrendingUp,
  X,
  Star,
  ThumbsUp,
  Share2,
  CheckCircle2,
  Lock
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- THEME ---
const THEME = {
  bg: '#000000', // Pure black
  surface: '#0a0a0a', // Slightly lighter black
  card: '#111111', // Card background
  border: '#1f2937', 
  primary: '#16a34a', // Dark/Vibrant Green
  primaryLight: '#22c55e', // Hover/Active Green
  text: '#ffffff',
  textMuted: '#9ca3af',
  accent: '#10b981', // Emerald
};

// --- MOCK DATA ---
const MOCK_FIXTURES = [
  { id: 1, home: 'Galatasaray', away: 'Fenerbahçe', time: '20:00', date: 'Bugün', score: '0:0', isLive: false, prob: 88, prediction: "MS 1 & 2.5 ÜST", desc: "Ev sahibi ekip son 5 maçında inanılmaz bir form yakaladı. Beklenen gol (xG) oranları ligin en üst seviyesinde. Deplasman ekibinin defansif zaafları bu maçta bol gollü bir galibiyete kapı aralıyor." },
  { id: 2, home: 'Beşiktaş', away: 'Trabzonspor', time: '19:00', date: 'Yarın', score: '-:-', isLive: false, prob: 75, prediction: "KG VAR", desc: "İki takımın da gol yollarındaki etkinliği aşikar. Özellikle xG verilerinde iki taraf da maç başına 1.8 gol beklentisi üretiyor. Taraf bahsi yerine karşılıklı gol mantıklı." },
  { id: 3, home: 'Arsenal', away: 'Chelsea', time: '75\'', date: 'Bugün', score: '2:1', isLive: true, prob: 92, prediction: "Sıradaki Gol: Ev Sahibi", desc: "Canlı analiz: Arsenal topa %68 oranında sahip ve son 10 dakikada 4 isabetli şut çekti. Raskip kalede baskı inanılmaz seviyede." },
  { id: 4, home: 'Real Madrid', away: 'Barcelona', time: '22:00', date: 'Bugün', score: '-:-', isLive: false, prob: 65, prediction: "IY/MS 1/0", desc: "Tipik bir El Clasico. İlk yarıda Real Madrid'in saha avantajıyla hızlı bir gol bulması, ikinci yarıda tempo düşüşü tablosu öngörüyoruz." },
];

const MOCK_POSTS = [
  { id: 1, user: 'KuponKrali', avatar: 'https://i.pravatar.cc/100?img=11', content: 'Günün bankosu Galatasaray maçında 2.5 üst! İstatistikler yalan söylemez, form grafiklerine bakın.', likes: 245, time: '2 saat önce', isPro: true },
  { id: 2, user: 'AnalizUzmani', avatar: 'https://i.pravatar.cc/100?img=33', content: 'Bugün İngiltere ligi çok riskli. Tüm bahis miktarlarınızı tek maça bağlamayın. Canlıdan beklemek en mantıklısı.', likes: 89, time: '5 saat önce', isPro: false },
  { id: 3, user: 'WinnerClub', avatar: 'https://i.pravatar.cc/100?img=55', content: 'Dünkü vurgundan sonra kasamızı katladık. VIP analizler için takipte kalın! 💸🔥', likes: 1024, time: '1 gün önce', isPro: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'analysis' | 'social' | 'profile'>('home');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Define tab content
  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen onMatchPress={setSelectedMatch} />;
      case 'analysis': return <AnalysisScreen onMatchPress={setSelectedMatch} />;
      case 'social': return <SocialScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen onMatchPress={setSelectedMatch} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* Top Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b" style={{ borderColor: THEME.border }}>
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: THEME.primary }}>
            <TrendingUp size={18} color="#000" />
          </View>
          <Text className="text-white font-black text-xl tracking-tighter uppercase italic">
            X-ANALİZ
          </Text>
        </View>
        <TouchableOpacity className="p-2 rounded-full" style={{ backgroundColor: THEME.card }}>
           <User color={THEME.primaryLight} size={20} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        {renderTab()}
      </View>

      {/* Bottom Navigation */}
      <View className="h-20 flex-row items-center justify-around px-2 border-t" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <TabButton icon={<Calendar />} label="Maçlar" isActive={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <TabButton icon={<BarChart3 />} label="Analiz" isActive={activeTab === 'analysis'} onPress={() => setActiveTab('analysis')} />
        <TabButton icon={<MessageCircle />} label="Sosyal" isActive={activeTab === 'social'} onPress={() => setActiveTab('social')} />
        <TabButton icon={<User />} label="Profil" isActive={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>

      {/* Match Detail Modal Overlay */}
      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </SafeAreaView>
  );
}

// --- SCREENS ---

function HomeScreen({ onMatchPress }: { onMatchPress: (m: any) => void }) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
       <View className="px-5 py-4">
          <Text className="text-white text-lg font-black mb-4 uppercase tracking-widest" style={{ color: THEME.primaryLight }}>Günün Fikstürü</Text>
          {MOCK_FIXTURES.map((match) => (
             <MatchCard key={match.id} match={match} onPress={() => onMatchPress(match)} />
          ))}
       </View>
    </ScrollView>
  );
}

function AnalysisScreen({ onMatchPress }: { onMatchPress: (m: any) => void }) {
  // Sort mock fixtures by probability
  const topMatches = [...MOCK_FIXTURES].sort((a, b) => b.prob - a.prob);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
       <View className="px-5 py-4">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-lg font-black uppercase tracking-widest">Premium Analizler</Text>
            <View className="px-2 py-1 rounded bg-[#16a34a]/20">
              <Text style={{ color: THEME.primaryLight }} className="text-[10px] font-bold uppercase">Yapay Zeka Destekli</Text>
            </View>
          </View>

          {topMatches.map((match, i) => (
            <TouchableOpacity 
              key={match.id} 
              onPress={() => onMatchPress(match)}
              className="mb-5 rounded-3xl p-5 border overflow-hidden"
              style={{ backgroundColor: THEME.card, borderColor: i === 0 ? THEME.primary : THEME.border }}
            >
              {/* Highlight Gradient Effect for top match */}
              {i === 0 && (
                <View className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full" style={{ backgroundColor: THEME.primary, transform: [{ scale: 2 }, { translateX: 20 }, { translateY: -20 }] }} />
              )}
              
              <View className="flex-row justify-between items-center mb-4">
                 <View className="flex-row items-center gap-2">
                    <Zap size={16} color={THEME.primaryLight} />
                    <Text className="text-white/60 text-xs font-bold">{match.home} vs {match.away}</Text>
                 </View>
                 <Text className="text-xs font-black" style={{ color: THEME.primaryLight }}>
                   % {match.prob} GÜVEN
                 </Text>
              </View>

              <Text className="text-white font-black text-2xl uppercase italic mb-1">{match.prediction}</Text>
              <Text className="text-white/40 text-xs font-medium line-clamp-2" numberOfLines={2}>
                {match.desc}
              </Text>
            </TouchableOpacity>
          ))}
       </View>
    </ScrollView>
  );
}

function SocialScreen() {
  return (
    <View className="flex-1">
      <View className="px-5 py-4 border-b border-white/5 bg-[#0a0a0a]">
        <View className="flex-row items-center gap-3">
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=3' }} className="w-10 h-10 rounded-full" />
          <View className="flex-1 h-10 rounded-full px-4 justify-center" style={{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: 1 }}>
             <Text className="text-white/40 text-sm">Günün tahminlerini paylaş...</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
         {MOCK_POSTS.map(post => (
           <View key={post.id} className="mb-6 pb-6 border-b border-white/5">
             <View className="flex-row items-center mb-3">
               <Image source={{ uri: post.avatar }} className="w-10 h-10 rounded-full mr-3" />
               <View className="flex-1">
                 <View className="flex-row items-center gap-2">
                   <Text className="text-white font-bold">{post.user}</Text>
                   {post.isPro && <CheckCircle2 size={14} color={THEME.primaryLight} />}
                 </View>
                 <Text className="text-white/40 text-xs">{post.time}</Text>
               </View>
             </View>
             <Text className="text-white/80 text-sm leading-relaxed mb-4">{post.content}</Text>
             <View className="flex-row items-center gap-6">
               <TouchableOpacity className="flex-row items-center gap-2">
                 <ThumbsUp size={16} color={THEME.textMuted} />
                 <Text className="text-white/50 text-xs font-bold">{post.likes}</Text>
               </TouchableOpacity>
               <TouchableOpacity className="flex-row items-center gap-2">
                 <MessageCircle size={16} color={THEME.textMuted} />
                 <Text className="text-white/50 text-xs font-bold">Yorum Yap</Text>
               </TouchableOpacity>
             </View>
           </View>
         ))}
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center py-8 border-b" style={{ borderColor: THEME.border }}>
        <View className="relative mb-4">
           <Image source={{ uri: 'https://i.pravatar.cc/100?img=3' }} className="w-24 h-24 rounded-full border-2" style={{ borderColor: THEME.primary }} />
           <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: THEME.primary }}>
              <CheckCircle2 size={12} color="#000" />
           </View>
        </View>
        <Text className="text-white text-xl font-black mb-1">Misafir Kullanıcı</Text>
        <Text className="text-white/40 text-xs">Aramıza Hoşgeldin!</Text>
        
        <TouchableOpacity className="mt-6 px-8 py-3 rounded-full flex-row items-center gap-2" style={{ backgroundColor: THEME.primary }}>
           <Settings size={16} color="#000" />
           <Text className="text-[#000] font-black uppercase text-xs">Premium'a Yükselt</Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 py-6 space-y-2">
        <Text className="text-white/40 font-bold uppercase text-[10px] tracking-widest pl-4 mb-2">Hesap Ayarları</Text>
        
        <SettingsRow icon={<User size={18} color={THEME.textMuted} />} title="Profil Bilgileri" />
        <SettingsRow icon={<Bell size={18} color={THEME.textMuted} />} title="Bildirim Ayarları" />
        <SettingsRow icon={<Star size={18} color={THEME.textMuted} />} title="Favori Takımlarım" />
        <SettingsRow icon={<Lock size={18} color={THEME.textMuted} />} title="Gizlilik & Güvenlik" />
        
        <TouchableOpacity className="mt-4 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex-row items-center justify-between">
           <Text className="text-red-500 font-bold text-sm">Çıkış Yap</Text>
           <ChevronRight size={16} color="rgb(239 68 68)" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// --- COMPONENTS ---

const TabButton = ({ icon, label, isActive, onPress }: any) => {
  const iconWithColor = React.cloneElement(icon, { 
    color: isActive ? THEME.primaryLight : THEME.textMuted,
    size: 24
  });

  return (
    <TouchableOpacity onPress={onPress} className="items-center justify-center w-16 h-14">
      {iconWithColor}
      <Text style={{ color: isActive ? THEME.primaryLight : THEME.textMuted }} className={`text-[10px] mt-1 ${isActive ? 'font-black' : 'font-medium'}`}>
        {label}
      </Text>
      {isActive && (
        <View className="absolute -top-3 w-1 h-1 rounded-full" style={{ backgroundColor: THEME.primaryLight }} />
      )}
    </TouchableOpacity>
  );
};

const MatchCard = ({ match, onPress }: any) => {
  return (
    <TouchableOpacity 
       onPress={onPress}
       className="w-full mb-3 rounded-2xl overflow-hidden border p-4 shadow-xl" 
       style={{ backgroundColor: THEME.card, borderColor: THEME.border }}
    >
      <View className="flex-row items-center mb-3">
         <View className="flex-1 items-center">
            <Text className="text-white font-bold text-sm text-center">{match.home}</Text>
         </View>
         <View className="px-4 items-center">
            <Text className={`text-xl font-black tabular-nums ${match.isLive ? 'text-red-500' : 'text-white'}`}>
              {match.score}
            </Text>
            {match.isLive ? (
              <Text className="text-[9px] font-black text-red-500 animate-pulse uppercase tracking-widest">{match.time}</Text>
            ) : (
              <Text className="text-[10px] font-medium text-white/40">{match.time}</Text>
            )}
         </View>
         <View className="flex-1 items-center">
            <Text className="text-white font-bold text-sm text-center">{match.away}</Text>
         </View>
      </View>
      
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: THEME.border }}>
         <Text className="text-[10px] font-medium text-white/50">{match.date}</Text>
         <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME.primary }} />
            <Text className="text-xs font-bold" style={{ color: THEME.primaryLight }}>Yapay Zeka Analizi Hazır</Text>
         </View>
      </View>
    </TouchableOpacity>
  );
};

const SettingsRow = ({ icon, title }: any) => (
  <TouchableOpacity className="flex-row items-center p-4 rounded-2xl mb-2" style={{ backgroundColor: THEME.card }}>
     {icon}
     <Text className="flex-1 text-white font-medium ml-3">{title}</Text>
     <ChevronRight size={16} color={THEME.textMuted} />
  </TouchableOpacity>
);

const MatchDetailModal = ({ match, onClose }: any) => {
  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/80">
        <View className="h-[88%] w-full rounded-t-[40px] border-t overflow-hidden" style={{ backgroundColor: THEME.bg, borderColor: THEME.border }}>
          
          {/* Header */}
          <View className="p-6 flex-row items-center justify-between border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
             <View className="flex-row items-center gap-2">
                <BarChart3 size={20} color={THEME.primaryLight} />
                <Text className="text-white font-black text-sm uppercase italic tracking-widest">Maç Analiz Merkezi</Text>
             </View>
             <TouchableOpacity onPress={onClose} className="p-2 rounded-full" style={{ backgroundColor: THEME.card }}>
                <X size={20} color="white" />
             </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
             
             {/* Score / Teams display */}
             <View className="flex-row items-center justify-between mb-8 p-6 rounded-3xl" style={{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: 1 }}>
                <View className="flex-1 items-center">
                   <Text className="text-white font-bold text-center text-sm">{match.home}</Text>
                </View>
                <View className="items-center px-6">
                   <Text className="text-3xl font-black tabular-nums" style={{ color: THEME.primaryLight }}>
                     {match.score}
                   </Text>
                   <Text className="text-[10px] uppercase font-black tracking-widest" style={{ color: match.isLive ? '#ef4444' : '#64748b' }}>
                     {match.isLive ? match.time : 'MS / FT'}
                   </Text>
                </View>
                <View className="flex-1 items-center">
                   <Text className="text-white font-bold text-center text-sm">{match.away}</Text>
                </View>
             </View>

             {/* Prediction Box */}
             <View className="mb-6 p-6 rounded-3xl relative overflow-hidden" style={{ backgroundColor: '#166534' }}>
                <View className="absolute top-0 left-0 w-full h-full opacity-20 bg-black" />
                <View className="flex-row items-center gap-2 mb-2">
                   <Trophy size={18} color="#ffffff" />
                   <Text className="text-white/80 font-bold uppercase tracking-widest text-[10px]">Uzman Tahmini</Text>
                </View>
                <Text className="text-white font-black text-3xl uppercase italic mb-1">{match.prediction}</Text>
                <View className="flex-row items-center justify-between mt-2">
                   <Text className="text-white/60 text-xs font-bold">Güven Skoru:</Text>
                   <Text className="text-white font-black text-base">% {match.prob}</Text>
                </View>
             </View>

             {/* Analysis Description */}
             <View className="mb-10">
                <Text className="text-white font-bold uppercase tracking-widest mb-3 pl-2 text-xs" style={{ color: THEME.primaryLight }}>
                  Detaylı Açıklama
                </Text>
                <View className="p-6 rounded-3xl" style={{ backgroundColor: THEME.surface }}>
                  <Text className="text-white/80 text-sm leading-relaxed">
                    {match.desc}
                  </Text>
                </View>
             </View>
             
             <View className="h-10" />
          </ScrollView>

          {/* Action Footer */}
          <View className="p-4 border-t flex-row" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
             <TouchableOpacity className="flex-1 p-4 rounded-2xl items-center justify-center" style={{ backgroundColor: THEME.primary }}>
                <Text className="text-black font-black uppercase text-sm">Kupona Ekle</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Icons strictly use lucide-react-native to prevent XML parser errors.
