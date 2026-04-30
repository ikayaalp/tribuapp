import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, Modal,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { fetchPopularMatches, LEAGUE_HIERARCHY, SMFixture } from '../../services/api/sportmonks';
import { formatTurkeyTime, getTurkeyDateStr, getTurkeyNow, toTurkeyDateStr } from '../../services/timezone';

// ── Helpers ────────────────────────────────────────────────
const pad = (n: number) => n.toString().padStart(2, '0');
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

const isLiveState = (state?: any) => {
  if (!state) return false;
  const s1 = (state.short_name || '').toLowerCase();
  const s2 = (state.name || '').toLowerCase();
  const check = (str: string) => str.includes('1h') || str.includes('2h') || str.includes('half') || str.includes('1st') || str.includes('2nd') || str.includes('live') || str === 'ht' || str === 'et' || str === 'bt';
  return check(s1) || check(s2);
};

const toTurkeyStr = (d: Date): string => {
  const tr = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + TURKEY_OFFSET_MS);
  return `${tr.getFullYear()}-${pad(tr.getMonth() + 1)}-${pad(tr.getDate())}`;
};

const prettyDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
};

// ── Date Picker Modal ──────────────────────────────────────
function DatePickerModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean; current: string;
  onSelect: (d: string) => void; onClose: () => void;
}) {
  const days: { label: string; value: string }[] = [];
  const trNow = getTurkeyNow();
  for (let i = -15; i <= 14; i++) {
    const d = new Date(trNow);
    d.setDate(d.getDate() + i);
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const label = i === 0
      ? 'Bugün'
      : `${d.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()]} ${dayNames[d.getDay()]}`;
    days.push({ label, value: val });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={dps.overlay}>
        <View style={dps.sheet}>
          <View style={dps.header}>
            <Text style={dps.title}>Tarih Seç</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={true}>
            {days.map((day) => {
              const selected = day.value === current;
              return (
                <TouchableOpacity
                  key={day.value}
                  style={[dps.row, selected && dps.rowSelected]}
                  onPress={() => { onSelect(day.value); onClose(); }}
                >
                  <Text style={[dps.rowText, selected && dps.rowTextSelected]}>{day.label}</Text>
                  <Text style={[dps.rowDate, selected && dps.rowTextSelected]}>{day.value}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dps = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingBottom: 30,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#333',
  },
  title: { color: '#1DB954', fontSize: 18, fontWeight: 'bold' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2A2A2A',
  },
  rowSelected: { backgroundColor: '#1DB95420' },
  rowText: { color: '#ECEDEE', fontSize: 15 },
  rowDate: { color: '#888', fontSize: 13 },
  rowTextSelected: { color: '#1DB954', fontWeight: 'bold' },
});

// ── Main Screen ────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTurkeyDateStr());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sections, setSections] = useState<{ title: string; image: string; data: SMFixture[]; order: number; leagueId: number }[]>([]);
  const [allLeagues, setAllLeagues] = useState<{ id: number; name: string; image: string }[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLive, setHasLive] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dateScrollRef = useRef<ScrollView>(null);

  // Lokal sayacı başlat (15 sn'de bir dakikaları yeniler)
  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(ticker);
  }, []);

  const loadMatches = useCallback(async (date: string, silent = false) => {
    if (!silent) setLoading(true);
    const fixtures = await fetchPopularMatches(date);

    if (!fixtures) {
      // Network hatası olduysa, ekranı bozma, sessizce geç
      if (!silent) setLoading(false);
      return;
    }

    // Canlı maç var mı kontrol et
    const liveExists = fixtures.some(f => isLiveState(f.state));
    setHasLive(liveExists);

    // Collect all unique leagues for filtering
    const uniqueLeagues: Record<number, { id: number; name: string; image: string }> = {};
    fixtures.forEach(f => {
      if (f.league) {
        uniqueLeagues[f.league.id] = { id: f.league.id, name: f.league.name, image: f.league.image_path };
      }
    });
    setAllLeagues(Object.values(uniqueLeagues).sort((a, b) => (LEAGUE_HIERARCHY[a.id] || 999) - (LEAGUE_HIERARCHY[b.id] || 999)));

    // Group by league
    const grouped = fixtures.reduce((acc, match) => {
      const leagueId = match.league?.id;
      const leagueName = match.league?.name || 'Diğer';

      if (!acc[leagueName]) {
        acc[leagueName] = {
          title: leagueName,
          image: match.league?.image_path,
          data: [],
          order: LEAGUE_HIERARCHY[leagueId] || 999,
          leagueId: leagueId,
        };
      }
      acc[leagueName].data.push(match);
      return acc;
    }, {} as Record<string, { title: string; image: string; data: SMFixture[]; order: number; leagueId: number }>);

    const sectionArray = Object.values(grouped).sort((a, b) => a.order - b.order);
    setSections(sectionArray);
    if (!silent) setLoading(false);
  }, []);

  // İlk yükleme ve tarih değişikliğinde çek
  useEffect(() => { loadMatches(selectedDate); }, [selectedDate]);

  // Canlı maç varsa 30 saniyede bir sessiz güncelle
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (hasLive) {
      pollingRef.current = setInterval(() => {
        loadMatches(selectedDate, true);
      }, 30000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasLive, selectedDate]);

  // ── Helpers ──
  const getTeamName = (participants: any[], location: 'home' | 'away') => {
    if (!participants) return 'Bilinmiyor';
    const team = participants.find((p: any) => p.meta?.location === location);
    return team ? team.name : 'Bilinmiyor';
  };

  const getScore = (scores: any[], participant: 'home' | 'away') => {
    if (!scores || scores.length === 0) return '-';
    const currentScores = scores.filter((s: any) => s.description === 'CURRENT');
    if (currentScores.length === 0) {
      const fallback = scores.find((s: any) => s.score?.participant === participant);
      return fallback ? fallback.score.goals : '-';
    }
    const teamScore = currentScores.find((s: any) => s.score?.participant === participant);
    return teamScore ? teamScore.score.goals : '0';
  };

  const handleDateChange = (d: string) => {
    setSelectedDate(d);
  };

  const isToday = selectedDate === getTurkeyDateStr();

  // Create date ribbon data (-3 to +3 days)
  const dateRibbon: { label: string, dayNum: number, value: string }[] = [];
  const trNow = getTurkeyNow();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(trNow);
    d.setDate(d.getDate() + i);
    const val = toTurkeyDateStr(d); // FIXED: was getTurkeyDateStr(d)
    const dayName = i === 0 ? 'Bugün' : (i === -1 ? 'Dün' : (i === 1 ? 'Yarın' : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()]));
    const dayNum = d.getDate();
    dateRibbon.push({ label: dayName, dayNum, value: val });
  }

  // ── Render item ──
  const renderItem = ({ item }: { item: SMFixture }) => {
    let homeTeam = getTeamName(item.participants, 'home');
    let awayTeam = getTeamName(item.participants, 'away');

    // Çok kelimeli uzun takım isimlerinin ilk kelimesini 3 harfe kısalt
    const formatTeamName = (name: string) => {
      const words = name.trim().split(' ');
      if (words.length > 1 && words[0].length > 3) {
        return `${words[0].substring(0, 3)}. ${words.slice(1).join(' ')}`;
      }
      return name;
    };

    homeTeam = formatTeamName(homeTeam);
    awayTeam = formatTeamName(awayTeam);

    const homeScore = getScore(item.scores, 'home');
    const awayScore = getScore(item.scores, 'away');
    const startTime = formatTurkeyTime(item.starting_at);

    let statusText = startTime;
    let isLive = false;
    let isFinished = false;

    if (item.state) {
      const sn = item.state.short_name || '';
      if (isLiveState(item.state)) {
        isLive = true;
        if (sn === 'HT' || sn === 'Half Time' || sn.toLowerCase().includes('half time') || sn.toLowerCase() === 'ht') {
          statusText = 'İY';
        } else {
          let min: number | string | null | undefined = null;

          if (sn.includes('1H') || sn.includes('1st') || sn === '1H') {
            if (item.starting_at_timestamp) {
              const diffMs = currentTime - (item.starting_at_timestamp * 1000);
              const diffMins = Math.floor(diffMs / 60000);
              min = diffMins > 0 ? (diffMins > 45 ? '45+' : diffMins) : 1;
            }
          } else if (sn.includes('2H') || sn.includes('2nd') || sn === '2H') {
            const p2 = item.periods?.find((p: any) => p.description?.includes('2nd') || p.type_id === 2);
            if (p2 && p2.started) {
              const diffMs = currentTime - (p2.started * 1000);
              const diffMins = Math.floor(diffMs / 60000);
              const currentMinute = 45 + diffMins + 1;
              min = currentMinute > 90 ? '90+' : currentMinute;
            } else if (item.starting_at_timestamp) {
              const diffMs = currentTime - (item.starting_at_timestamp * 1000);
              const diffMins = Math.floor(diffMs / 60000);
              const hm = diffMins - 15;
              min = hm > 45 ? (hm > 90 ? '90+' : hm) : 46;
            }
          }

          if (!min) {
            const currentPeriod = item.periods?.find((p: any) => p.ticking) || (item.periods?.length ? item.periods[item.periods.length - 1] : null);
            min = currentPeriod?.minutes;
          }

          statusText = min ? `${min}'` : 'Canlı';
        }
      } else if (sn === 'FT' || sn === 'AET' || sn === 'PEN_FT') {
        isFinished = true;
        statusText = 'MS';
      } else if (['CANC', 'POSTP', 'SUSP', 'INT'].includes(sn)) {
        statusText = 'Ert.';
      }
    }

    const hasStarted = isLive || isFinished;
    const showAI = !isFinished; // AI Tahmin: sadece canlı & oynanacak maçlarda

    const scoreColor = isLive ? '#1DB954' : '#FFF';
    const teamColor = '#FFF'; // Bütün takımlar beyaz

    return (
      <TouchableOpacity
        style={[styles.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 0 }]}
        onPress={() => router.push(`/match/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* Sol Alan (Dakika / MS / Saat) - 50 Genişlik */}
        <View style={{ width: 50, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#333' }}>
          {showAI && (
            <Ionicons name="flash" size={10} color="#1DB954" style={{ marginBottom: 2 }} />
          )}
          <Text style={[styles.timeText, isLive && styles.liveTimeText, { fontSize: 13, textAlign: 'center' }]} numberOfLines={2}>
            {statusText}
          </Text>
        </View>

        {/* Orta Alan (Takımlar ve Skor) - Yan Yana */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>

          {/* Ev Sahibi */}
          <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 8 }}>
            <Text style={{ color: teamColor, fontSize: 13, textAlign: 'right', fontWeight: '500' }} numberOfLines={1}>{homeTeam}</Text>
          </View>

          {/* Skor (TAM ORTADA) */}
          <View style={{ width: 60, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLive ? '#1DB95415' : 'transparent', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: scoreColor, fontSize: 16, fontWeight: 'bold' }}>
                {hasStarted ? homeScore : '-'}
              </Text>
              <Text style={{ color: scoreColor, marginHorizontal: 3, fontWeight: 'bold' }}>:</Text>
              <Text style={{ color: scoreColor, fontSize: 16, fontWeight: 'bold' }}>
                {hasStarted ? awayScore : '-'}
              </Text>
            </View>
          </View>

          {/* Deplasman */}
          <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 8 }}>
            <Text style={{ color: teamColor, fontSize: 13, textAlign: 'left', fontWeight: '500' }} numberOfLines={1}>{awayTeam}</Text>
          </View>

        </View>

        {/* Sağ Dengeleyici Boşluk (Skorun merkeze oturması için sol alan kadar yer tutar) */}
        <View style={{ width: 50 }} />

      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      {section.image && (
        <Image source={{ uri: section.image }} style={styles.leagueImage} />
      )}
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const filteredSections = selectedLeagues.length > 0
    ? sections.filter(s => selectedLeagues.includes(s.leagueId))
    : sections;

  const renderHeader = () => (
    <View style={styles.dateRibbonContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRibbonScroll}>
        {dateRibbon.map((item) => {
          const active = item.value === selectedDate;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.dateChip, active && styles.dateChipActive]}
              onPress={() => setSelectedDate(item.value)}
            >
              <Text style={[styles.dateChipLabel, active && styles.dateChipTextActive]}>{item.label}</Text>
              <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>{item.dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BetAnaliz</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsFilterModalOpen(true)} style={styles.headerBtn}>
            <View style={[styles.filterIndicator, selectedLeagues.length > 0 && { backgroundColor: '#1DB954' }]}>
              <Ionicons name="filter" size={20} color={selectedLeagues.length > 0 ? "#000" : "#888"} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadMatches(selectedDate)} style={styles.headerBtn}>
            <Ionicons name="refresh" size={22} color="#1DB954" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCalendarOpen(true)} style={styles.headerBtn}>
            <Ionicons name="calendar-outline" size={22} color="#1DB954" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── League Filter Modal ── */}
      <Modal visible={isFilterModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Ligleri Filtrele</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterList}>
              <TouchableOpacity
                style={styles.filterRow}
                onPress={() => setSelectedLeagues([])}
              >
                <Text style={[styles.filterLeagueName, selectedLeagues.length === 0 && { color: '#1DB954' }]}>Tüm Ligler</Text>
                {selectedLeagues.length === 0 && <Ionicons name="checkmark" size={20} color="#1DB954" />}
              </TouchableOpacity>
              {allLeagues.map(league => (
                <TouchableOpacity
                  key={league.id}
                  style={styles.filterRow}
                  onPress={() => {
                    if (selectedLeagues.includes(league.id)) {
                      setSelectedLeagues(selectedLeagues.filter(id => id !== league.id));
                    } else {
                      setSelectedLeagues([...selectedLeagues, league.id]);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: league.image }} style={styles.filterLeagueImage} />
                    <Text style={[styles.filterLeagueName, selectedLeagues.includes(league.id) && { color: '#1DB954' }]}>{league.name}</Text>
                  </View>
                  {selectedLeagues.includes(league.id) && <Ionicons name="checkmark" size={20} color="#1DB954" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={() => setIsFilterModalOpen(false)}>
              <Text style={styles.filterApplyText}>Uygula ({selectedLeagues.length === 0 ? 'Tümü' : selectedLeagues.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Modal ── */}
      <DatePickerModal
        visible={calendarOpen}
        current={selectedDate}
        onSelect={handleDateChange}
        onClose={() => setCalendarOpen(false)}
      />

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Maçlar Yükleniyor...</Text>
        </View>
      ) : filteredSections.length > 0 ? (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
          extraData={currentTime}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="football-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>Bu tarihte popüler liglerde maç bulunmuyor.</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  filterIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRibbonContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  dateRibbonScroll: {
    paddingHorizontal: 15,
    gap: 12,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  dateChipActive: {
    backgroundColor: '#1DB95420',
    borderColor: '#1DB954',
  },
  dateChipLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateChipDay: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateChipTextActive: {
    color: '#1DB954',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  filterTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterList: {
    padding: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 8,
  },
  filterLeagueImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  filterLeagueName: {
    color: '#ECEDEE',
    fontSize: 15,
    fontWeight: '500',
  },
  filterApplyBtn: {
    backgroundColor: '#1DB954',
    margin: 20,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  filterApplyText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  leagueImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'center',
  },
  timeContainer: {
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#333',
    paddingRight: 10,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  liveTimeText: {
    color: '#1DB954',
  },
  teamsContainer: {
    flex: 1,
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamText: {
    flex: 1,
    color: '#ECEDEE',
    fontSize: 15,
    fontWeight: '600',
  },
  scoreText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'right',
  },
  liveScoreText: {
    color: '#1DB954',
  },
  predictionBadge: {
    flexDirection: 'row',
    backgroundColor: '#1DB954',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
  },
  predictionText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
