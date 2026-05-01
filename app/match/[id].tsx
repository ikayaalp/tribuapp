import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMatchDetails, fetchLeagueStandings, fetchSeasonStandings, fetchH2H } from '../../services/api/sportmonks';
import { formatTurkeyTime } from '../../services/timezone';
import { predictionApi, PredictionResult } from '../../services/api/prediction';

// Tahmin sonucu formatla
const formatPredictionText = (result: PredictionResult): string => {
  const p = result.probabilities;
  const maxProb = Math.max(p.home_win, p.draw, p.away_win);
  if (maxProb === p.home_win) return 'MS 1';
  if (maxProb === p.away_win) return 'MS 2';
  return 'MS 0';
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [matchData, setMatchData] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [h2hData, setH2hData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'olaylar' | 'tahmin' | 'stats' | 'lineups' | 'standings' | 'h2h'>('olaylar');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    const data = await fetchMatchDetails(id as string);
    if (data) {
      setMatchData(data);
      // Paralel olarak lig puan durumunu ve H2H'yi çek
      try {
        // Öncelik season_id, yoksa league_id
        let stPromise;
        if (data.season_id) {
          stPromise = fetchSeasonStandings(data.season_id);
        } else {
          stPromise = fetchLeagueStandings(data.league_id);
        }

        const [stData, h2hRes] = await Promise.all([
          stPromise,
          fetchH2H(data.participants[0]?.id, data.participants[1]?.id)
        ]);
        
        // Eğer season ile gelmediyse league ile dene (fallback)
        let finalStandings = stData;
        if ((!finalStandings || finalStandings.length === 0) && data.league_id && data.season_id) {
           finalStandings = await fetchLeagueStandings(data.league_id);
        }

        setStandings(finalStandings);
        setH2hData(h2hRes);
      } catch (err) {
        console.error("Ek veriler çekilemedi:", err);
      }
    }
    setLoading(false);
  };

  // Gerçek tahmin API'sini çağır
  useEffect(() => {
    if (!matchData) return;
    const hTeam = matchData.participants?.find((p: any) => p.meta?.location === 'home');
    const aTeam = matchData.participants?.find((p: any) => p.meta?.location === 'away');
    const hName = hTeam?.name;
    const aName = aTeam?.name;
    
    if (hName && aName) {
      setPredLoading(true);
      const matchDate = matchData.starting_at ? matchData.starting_at.split(' ')[0] : undefined;
      predictionApi.predict(hName, aName, matchDate).then(result => {
        setPrediction(result);
        setPredLoading(false);
      }).catch(() => setPredLoading(false));
    }
  }, [matchData]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={{ color: '#888', marginTop: 10 }}>Maç Detayları Yükleniyor...</Text>
      </View>
    );
  }

  if (!matchData) {
    return (
      <View style={styles.container}>
         <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 50 }}>Veri Bulunamadı.</Text>
      </View>
    );
  }

  const homeTeamInfo = matchData.participants?.find((p: any) => p.meta?.location === 'home') || {};
  const awayTeamInfo = matchData.participants?.find((p: any) => p.meta?.location === 'away') || {};
  
  const homeName = homeTeamInfo.name || 'Ev Sahibi';
  const awayName = awayTeamInfo.name || 'Deplasman';

  const getScore = (participant: 'home' | 'away') => {
    if (!matchData.scores || matchData.scores.length === 0) return '-';
    const currentScores = matchData.scores.filter((s: any) => s.description === 'CURRENT');
    if (currentScores.length === 0) {
      const fallback = matchData.scores.find((s: any) => s.score?.participant === participant);
      return fallback ? fallback.score.goals : '-';
    }
    const teamScore = currentScores.find((s: any) => s.score?.participant === participant);
    return teamScore ? teamScore.score.goals : '0';
  };

  let topTimeDisplay = `Maç Saati: ${matchData.starting_at ? formatTurkeyTime(matchData.starting_at) : '-'}`;
  let bottomStateDisplay = matchData.state?.name || 'Bekleniyor';
  let isLive = false;

  const isLiveStateMatch = (state?: any) => {
    if (!state) return false;
    const s1 = (state.short_name || '').toLowerCase();
    const s2 = (state.name || '').toLowerCase();
    const check = (str: string) => str.includes('1h') || str.includes('2h') || str.includes('half') || str.includes('1st') || str.includes('2nd') || str.includes('live') || str === 'ht' || str === 'et' || str === 'bt';
    return check(s1) || check(s2);
  };

  if (isLiveStateMatch(matchData.state)) {
    isLive = true;
    
    let min: number | string | null | undefined = null;
    const sn = matchData.state?.short_name || '';
    
    if (sn.includes('1H') || sn.includes('1st')) {
      if (matchData.starting_at_timestamp) {
         const diffMs = currentTime - (matchData.starting_at_timestamp * 1000);
         const diffMins = Math.floor(diffMs / 60000);
         min = diffMins > 0 ? (diffMins > 45 ? '45+' : diffMins) : 1;
      }
    } else if (sn.includes('2H') || sn.includes('2nd')) {
      const p2 = matchData.periods?.find((p: any) => p.description?.includes('2nd') || p.type_id === 2);
      if (p2 && p2.started) {
         const diffMs = currentTime - (p2.started * 1000);
         const diffMins = Math.floor(diffMs / 60000);
         const currentMinute = 45 + diffMins + 1;
         min = currentMinute > 90 ? '90+' : currentMinute;
      } else if (matchData.starting_at_timestamp) {
         const diffMs = currentTime - (matchData.starting_at_timestamp * 1000);
         const diffMins = Math.floor(diffMs / 60000);
         const hm = diffMins - 15;
         min = hm > 45 ? (hm > 90 ? '90+' : hm) : 46;
      }
    }
    
    if (!min) {
       const currentPeriod = matchData.periods?.find((p: any) => p.ticking) || (matchData.periods?.length ? matchData.periods[matchData.periods.length - 1] : null);
       min = currentPeriod?.minutes;
    }
    
    const snLower = (matchData.state?.short_name || '').toLowerCase();
    if (snLower === 'ht' || snLower.includes('half time') || snLower.includes('devre')) {
      topTimeDisplay = 'İY (Devre Arası)';
      bottomStateDisplay = 'Devre Arası';
    } else {
      topTimeDisplay = min ? `${min}. Dakika` : 'Canlı';
      bottomStateDisplay = 'Canlı';
    }
  } else if (['FT', 'AET', 'PEN_FT'].includes(matchData.state?.short_name)) {
    bottomStateDisplay = 'Maç Sonucu';
  }

  const renderTabsToggle = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.tabsScroll}
      contentContainerStyle={styles.tabsContent}
    >
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'olaylar' && styles.tabButtonActive]}
        onPress={() => setActiveTab('olaylar')}
      >
        <Text style={[styles.tabText, activeTab === 'olaylar' && styles.tabTextActive]}>Maç Detayı</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'tahmin' && styles.tabButtonActive]}
        onPress={() => setActiveTab('tahmin')}
      >
        <Text style={[styles.tabText, activeTab === 'tahmin' && styles.tabTextActive]}>Tahmin</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
        onPress={() => setActiveTab('stats')}
      >
        <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>İstatistik</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'lineups' && styles.tabButtonActive]}
        onPress={() => setActiveTab('lineups')}
      >
        <Text style={[styles.tabText, activeTab === 'lineups' && styles.tabTextActive]}>Kadro</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'standings' && styles.tabButtonActive]}
        onPress={() => setActiveTab('standings')}
      >
        <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>Puan Durumu</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'h2h' && styles.tabButtonActive]}
        onPress={() => setActiveTab('h2h')}
      >
        <Text style={[styles.tabText, activeTab === 'h2h' && styles.tabTextActive]}>H2H</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTahmin = () => {
    if (predLoading) {
      return (
        <View style={[styles.cardSection, { alignItems: 'center', paddingVertical: 40 }]}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={{ color: '#888', marginTop: 12 }}>Tahmin motoru analiz ediyor...</Text>
        </View>
      );
    }

    if (!prediction) {
      return (
        <View style={[styles.cardSection, { alignItems: 'center', paddingVertical: 30 }]}>
          <Ionicons name="cloud-offline-outline" size={40} color="#444" />
          <Text style={{ color: '#888', marginTop: 12, textAlign: 'center' }}>Tahmin motoru şu an erişilebilir değil.{"\n"}Lütfen API sunucusunun çalıştığından emin olun.</Text>
        </View>
      );
    }

    const predText = formatPredictionText(prediction);
    const p = prediction.probabilities;
    const eg = prediction.expected_goals;
    const confLabel = prediction.prediction.confidence === 'YUKSEK' ? 'YÜKSEK' : (prediction.prediction.confidence === 'ORTA' ? 'ORTA' : 'DÜŞÜK');
    const confColor = confLabel === 'YÜKSEK' ? '#1DB954' : (confLabel === 'ORTA' ? '#FFB800' : '#FF3B30');

    return (
      <View>
        {/* Ana Tahmin */}
        <View style={styles.cardSection}>
          <View style={styles.aiHeader}>
            <Ionicons name="flash" size={24} color="#1DB954" />
            <Text style={styles.aiTitle}>Elo + xG Tahmin Motoru</Text>
          </View>
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Önerilen Tahmin:</Text>
            <View style={styles.predictionBadge}>
              <Text style={styles.predictionValue}>{predText}</Text>
            </View>
          </View>
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Güven:</Text>
            <Text style={[styles.confidenceValue, { color: confColor }]}>%{prediction.prediction.confidence_pct} ({confLabel})</Text>
          </View>

          {/* Elo Puanları */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', borderRadius: 10, padding: 12, marginTop: 12 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ELO</Text>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{prediction.elo.home}</Text>
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#1DB954', fontWeight: 'bold', fontSize: 13 }}>{prediction.elo.diff > 0 ? '+' : ''}{prediction.elo.diff}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ELO</Text>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{prediction.elo.away}</Text>
            </View>
          </View>
        </View>

        {/* Olasılıklar */}
        <View style={styles.cardSection}>
          <Text style={styles.statsTitle}>Kazanma İhtimalleri</Text>
          <View style={styles.statBarContainer}>
            <Text style={styles.statLabel}>Ev</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${p.home_win}%` }]} />
            </View>
            <Text style={styles.statPercent}>%{p.home_win}</Text>
          </View>
          <View style={styles.statBarContainer}>
            <Text style={styles.statLabel}>Beraberlik</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${p.draw}%`, backgroundColor: '#888' }]} />
            </View>
            <Text style={styles.statPercent}>%{p.draw}</Text>
          </View>
          <View style={styles.statBarContainer}>
            <Text style={styles.statLabel}>Deplasman</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${p.away_win}%`, backgroundColor: '#FF3B30' }]} />
            </View>
            <Text style={styles.statPercent}>%{p.away_win}</Text>
          </View>
        </View>

        {/* Gol Beklentisi */}
        <View style={styles.cardSection}>
          <Text style={styles.statsTitle}>Gol Beklentisi (xG)</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{homeName}</Text>
              <Text style={{ color: '#1DB954', fontSize: 28, fontWeight: '900' }}>{eg.home}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{awayName}</Text>
              <Text style={{ color: '#FF3B30', fontSize: 28, fontWeight: '900' }}>{eg.away}</Text>
            </View>
          </View>

          {/* Alt/Üst */}
          <Text style={[styles.statsTitle, { marginTop: 8 }]}>Alt / Üst</Text>
          {Object.entries(prediction.over_under).map(([line, vals]) => (
            <View key={line} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#111', borderRadius: 8 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', width: 40 }}>{line}</Text>
              <Text style={{ color: vals.over > 55 ? '#1DB954' : '#888', flex: 1, textAlign: 'center' }}>Üst: %{vals.over}</Text>
              <Text style={{ color: vals.under > 55 ? '#1DB954' : '#888', flex: 1, textAlign: 'center' }}>Alt: %{vals.under}</Text>
            </View>
          ))}

          {/* KG Var */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, padding: 12, backgroundColor: '#111', borderRadius: 10 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>KG Var (BTTS)</Text>
            <Text style={{ color: '#1DB954', fontWeight: 'bold', fontSize: 16 }}>%{prediction.btts}</Text>
          </View>
        </View>

        {/* En Olası Skorlar */}
        <View style={styles.cardSection}>
          <Text style={styles.statsTitle}>En Olası 5 Skor</Text>
          {prediction.top_scores.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: '#222' }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{s.home_goals} - {s.away_goals}</Text>
              <Text style={{ color: '#1DB954', fontWeight: 'bold' }}>%{s.probability}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderEvents = () => {
    const events = matchData.events || [];
    if (events.length === 0) {
      return (
        <View style={styles.cardSection}>
           <Text style={styles.analysisText}>Bu maç için olay verisi bulunmuyor.</Text>
        </View>
      );
    }

    // Sort events by minute then extra_minute
    const sortedEvents = [...events].sort((a, b) => {
      const minDiff = (a.minute || 0) - (b.minute || 0);
      if (minDiff !== 0) return minDiff;
      return (a.extra_minute || 0) - (b.extra_minute || 0);
    });

    // Filter out VAR/technical events
    const filteredEvents = sortedEvents.filter((e: any) => {
      const code = (e.type?.code || '').toLowerCase();
      const name = (e.type?.name || '').toLowerCase();
      
      const isTechnical = 
        code.includes('disallowed') || 
        code.includes('cancelled') || 
        code.includes('var') || 
        code.includes('review') || 
        code.includes('check') ||
        code.includes('video') ||
        code.includes('decision') ||
        name.includes('var') || 
        name.includes('video');

      return !isTechnical;
    });

    return (
      <View style={styles.cardSection}>
        <Text style={[styles.aiTitle, { marginBottom: 20 }]}>Maç Olayları</Text>
        
        <View style={styles.timelineContainer}>
          <View style={styles.centerLine} />
          
          {filteredEvents.map((e: any, index: number) => {
            const isHome = e.participant_id === homeTeamInfo.id;
            const code = (e.type?.code || '').toLowerCase();
            
            // Minute display - include extra_minute for 45+, 90+, etc.
            let minuteDisplay = `${e.minute}'`;
            if (e.extra_minute && e.extra_minute > 0) {
              minuteDisplay = `${e.minute}+${e.extra_minute}'`;
            }

            let mainPlayer = '';
            let subPlayer = '';
            let goalScore = '';
            let iconName: any = 'football';
            let iconColor = '#FFF';
            let isSub = false;

            if (code.includes('sub') || code === 'substitution') {
              isSub = true;
              // Sportmonks API: player = giren, relatedplayer = çıkan (NOT related_player!)
              mainPlayer = e.player?.display_name || e.player?.name || e.player_name || 'Giren';
              // API key is "relatedplayer" (camelCase, no underscore)
              const relPlayer = e.relatedplayer || e.related_player;
              subPlayer = relPlayer?.display_name || relPlayer?.name || e.related_player_name || '';
              iconName = 'repeat';
              iconColor = '#FFA500';
            } else if (code.includes('goal') || code === 'penalty') {
              mainPlayer = e.player?.display_name || e.player?.name || 'Gol';
              const relPlayer = e.relatedplayer || e.related_player;
              subPlayer = relPlayer ? (relPlayer.display_name || relPlayer.name) : '';
              goalScore = e.result || '';
              iconName = 'football';
              iconColor = '#1DB954';
            } else if (code.includes('card')) {
              mainPlayer = e.player?.display_name || e.player?.name || 'Kart';
              iconName = 'square';
              iconColor = code.includes('yellow') ? '#FFD700' : '#FF3B30';
            } else {
              // Unknown event type - skip
              return null;
            }

            return (
              <View key={e.id || index} style={styles.eventRowRow}>
                {/* LEFT SIDE */}
                <View style={styles.eventSideContainer}>
                  {isHome && (
                    <View style={styles.eventContentLeft}>
                      <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 10 }}>
                        {goalScore !== '' && <Text style={styles.eventScoreText}>{goalScore}</Text>}
                        <Text style={[styles.eventPlayerName, isSub && { color: '#1DB954' }]}>
                          {isSub ? `↑ ${mainPlayer}` : mainPlayer}
                        </Text>
                        {subPlayer !== '' && (
                          <Text style={[styles.eventRelatedPlayer, isSub ? { color: '#FF3B30', marginTop: 1 } : {}]}>
                            {isSub ? `↓ ${subPlayer}` : subPlayer}
                          </Text>
                        )}
                      </View>
                      <Ionicons name={iconName} size={15} color={iconColor} />
                    </View>
                  )}
                </View>

                {/* CENTER MINUTE */}
                <View style={styles.eventMinuteCenter}>
                   <View style={styles.minuteCapsule}>
                      <Text style={styles.minuteCapsuleText}>{minuteDisplay}</Text>
                   </View>
                </View>

                {/* RIGHT SIDE */}
                <View style={styles.eventSideContainer}>
                  {!isHome && (
                    <View style={styles.eventContentRight}>
                      <Ionicons name={iconName} size={15} color={iconColor} />
                      <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 10 }}>
                        {goalScore !== '' && <Text style={styles.eventScoreText}>{goalScore}</Text>}
                        <Text style={[styles.eventPlayerName, isSub && { color: '#1DB954' }]}>
                          {isSub ? `↑ ${mainPlayer}` : mainPlayer}
                        </Text>
                        {subPlayer !== '' && (
                          <Text style={[styles.eventRelatedPlayer, isSub ? { color: '#FF3B30', marginTop: 1 } : {}]}>
                            {isSub ? `↓ ${subPlayer}` : subPlayer}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!matchData.statistics || matchData.statistics.length === 0) {
      return (
        <View style={styles.cardSection}>
           <Text style={styles.analysisText}>Bu maç için detaylı istatistik verisi henüz bulunmuyor.</Text>
        </View>
      );
    }

    const groupedStats: Record<string, { home: number; away: number }> = {};
    
    matchData.statistics.forEach((stat: any) => {
      const typeName = stat.type?.name;
      if (!typeName) return;
      
      const participantId = stat.participant_id;
      const value = stat.data?.value || 0;
      
      if (!groupedStats[typeName]) {
         groupedStats[typeName] = { home: 0, away: 0 };
      }
      
      if (participantId === homeTeamInfo.id) {
        groupedStats[typeName].home = value;
      } else if (participantId === awayTeamInfo.id) {
        groupedStats[typeName].away = value;
      }
    });

    const statTranslations: Record<string, string> = {
      'Ball Possession %': 'Topla Oynama (%)',
      'Expected Goals': 'Gol Beklentisi (xG)',
      'xG': 'Gol Beklentisi (xG)',
      'Shots Total': 'Toplam Şut',
      'Shots On Target': 'İsabetli Şut',
      'Shots Off Target': 'İsabetsiz Şut',
      'Shots Blocked': 'Engellenen Şut',
      'Corners': 'Korner',
      'Offsides': 'Ofsayt',
      'Fouls': 'Faul',
      'Yellowcards': 'Sarı Kart',
      'Redcards': 'Kırmızı Kart',
    };

    // İstenen sıralama (sadece bu listedekiler render edilecek)
    const allowedStatsOrder = [
      'Ball Possession %',
      'Expected Goals',
      'xG',
      'Shots Total',
      'Shots On Target',
      'Shots Off Target',
      'Shots Blocked',
      'Corners',
      'Offsides',
      'Fouls',
      'Yellowcards',
      'Redcards'
    ];

    return (
      <View style={styles.cardSection}>
        <Text style={[styles.aiTitle, { marginBottom: 20 }]}>Karşılaştırmalı İstatistikler</Text>
        
        {allowedStatsOrder.map((typeName, index) => {
          const stats = groupedStats[typeName];
          if (!stats) return null; // API'de bu istatistik yoksa atla
          
          const homeVal = stats.home;
          const awayVal = stats.away;
          if (homeVal === 0 && awayVal === 0) return null; // İkisi de sıfırsa gösterme

          let total = homeVal + awayVal;
          let homePercent = total > 0 ? (homeVal / total) * 100 : 50;
          let awayPercent = total > 0 ? (awayVal / total) * 100 : 50;

          if (typeName.includes('%')) {
             homePercent = homeVal;
             awayPercent = awayVal;
          }

          const displayName = statTranslations[typeName] || typeName;

          return (
            <View key={index} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', width: 40 }}>{homeVal}</Text>
                <Text style={{ color: '#888', fontSize: 13, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>{displayName}</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold', width: 40, textAlign: 'right' }}>{awayVal}</Text>
              </View>
              <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#333' }}>
                <View style={{ flex: homePercent, backgroundColor: '#1DB954' }} />
                <View style={{ flex: awayPercent, backgroundColor: '#FF3B30' }} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLineups = () => {
    const lineups = matchData.lineups || [];
    if (lineups.length === 0) {
      return (
        <View style={styles.cardSection}>
           <Text style={styles.analysisText}>Bu maç için henüz kadro bilgisi açıklanmadı veya bulunamadı.</Text>
        </View>
      );
    }

    const homeLineup = lineups.filter((l: any) => l.team_id === homeTeamInfo.id || l.participant_id === homeTeamInfo.id);
    const awayLineup = lineups.filter((l: any) => l.team_id === awayTeamInfo.id || l.participant_id === awayTeamInfo.id);

    const homeStarters = homeLineup.filter((p: any) => p.formation_field);
    const awayStarters = awayLineup.filter((p: any) => p.formation_field);
    const homeSubs = homeLineup.filter((p: any) => !p.formation_field);
    const awaySubs = awayLineup.filter((p: any) => !p.formation_field);

    const getRows = (starters: any[]) => {
      const rows: Record<number, any[]> = {};
      starters.forEach(p => {
         const [rowStr] = (p.formation_field || '0:0').split(':');
         const row = parseInt(rowStr, 10);
         if (!rows[row]) rows[row] = [];
         rows[row].push(p);
      });
      Object.values(rows).forEach(r => {
         r.sort((a, b) => {
           const colA = parseInt((a.formation_field || '0:0').split(':')[1] || '0', 10);
           const colB = parseInt((b.formation_field || '0:0').split(':')[1] || '0', 10);
           return colA - colB;
         });
      });
      return rows;
    };

    const homeRows = getRows(homeStarters);
    const awayRows = getRows(awayStarters);

    const awayRowKeys = Object.keys(awayRows).map(Number).sort((a,b) => a - b);
    const homeRowKeys = Object.keys(homeRows).map(Number).sort((a,b) => b - a);

    const renderPitchPlayer = (p: any, isHome: boolean) => {
      const dbName = p.player?.display_name || p.player?.common_name || p.player?.name || p.player_name || 'X';
      const shortName = dbName.split(' ').map((n: string, i: number, arr: any[]) => i === arr.length - 1 ? n : n[0]+'.').join(' ');

      return (
        <View key={p.id || Math.random()} style={{ alignItems: 'center', marginHorizontal: 2, flex: 1 }}>
          <View style={[styles.playerJersey, isHome ? styles.homeJersey : styles.awayJersey]}>
            <Text style={isHome ? styles.homeJerseyNumber : styles.awayJerseyNumber}>
              {p.jersey_number || ''}
            </Text>
          </View>
          <View style={styles.playerNameLabel}>
            <Text style={styles.playerNameText} numberOfLines={1}>{shortName}</Text>
          </View>
        </View>
      );
    };

    const homeFormationObj = matchData.formations?.find((f: any) => f.location === 'home' || f.participant_id === homeTeamInfo.id);
    const awayFormationObj = matchData.formations?.find((f: any) => f.location === 'away' || f.participant_id === awayTeamInfo.id);
    const homeFormationStr = homeFormationObj?.formation || '';
    const awayFormationStr = awayFormationObj?.formation || '';

    return (
      <View style={{ marginBottom: 20 }}>
        {homeStarters.length > 0 && awayStarters.length > 0 ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 5 }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{homeName}</Text>
                {homeFormationStr ? <Text style={{ color: '#1DB954', fontSize: 13, marginTop: 2, fontWeight: 'bold' }}>{homeFormationStr}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{awayName}</Text>
                {awayFormationStr ? <Text style={{ color: '#1DB954', fontSize: 13, marginTop: 2, fontWeight: 'bold' }}>{awayFormationStr}</Text> : null}
              </View>
            </View>

            <View style={styles.pitchContainer}>
              {/* Saha Çizgileri */}
              <View style={styles.pitchCenterLine} />
              <View style={styles.pitchCenterCircle} />
              <View style={[styles.pitchPenaltyBox, { top: -1 }]} />
              <View style={[styles.pitchPenaltyBox, { bottom: -1 }]} />
              <View style={[styles.pitchGoalBox, { top: -1 }]} />
              <View style={[styles.pitchGoalBox, { bottom: -1 }]} />

            {/* Deplasman Takımı (Üstte, rakip kaleye aşağıya saldırıyor) */}
            <View style={{ flex: 1, justifyContent: 'space-around', paddingVertical: 10 }}>
              {awayRowKeys.map(key => (
                <View key={`away-row-${key}`} style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
                  {awayRows[key].map(p => renderPitchPlayer(p, false))}
                </View>
              ))}
            </View>
            
            {/* Ev Sahibi Takım (Altta, rakip kaleye yukarı saldırıyor) */}
            <View style={{ flex: 1, justifyContent: 'space-around', paddingVertical: 10 }}>
              {homeRowKeys.map(key => (
                <View key={`home-row-${key}`} style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
                  {homeRows[key].map(p => renderPitchPlayer(p, true))}
                </View>
              ))}
            </View>
          </View>
          </View>
        ) : (
          <View style={styles.cardSection}>
             <Text style={styles.analysisText}>Diziliş verisi API'de bulunamadı. Sadece kadro listesi yayınlandı.</Text>
          </View>
        )}

        {/* Yedekler veya Diziliş Yokken Direkt Liste */}
        <View style={[styles.cardSection, { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.lineupTitle}>{homeName} (Yedekler)</Text>
            {homeSubs.map((p: any, i: number) => {
               const name = p.player?.display_name || p.player?.common_name || p.player?.name || p.player_name || 'Bilinmiyor';
               return (
                 <View key={i} style={styles.lineupPlayer}>
                    <Text style={{ color: '#888', marginRight: 8, fontSize: 12, width: 20 }}>{p.jersey_number||'-'}</Text>
                    <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
                 </View>
               );
            })}
          </View>
          <View style={{ width: 1, backgroundColor: '#333' }} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={[styles.lineupTitle, { textAlign: 'right' }]}>{awayName} (Yedekler)</Text>
            {awaySubs.map((p: any, i: number) => {
               const name = p.player?.display_name || p.player?.common_name || p.player?.name || p.player_name || 'Bilinmiyor';
               return (
                 <View key={i} style={[styles.lineupPlayer, { justifyContent: 'flex-end' }]}>
                    <Text style={[styles.playerName, { textAlign: 'right' }]} numberOfLines={1}>{name}</Text>
                    <Text style={{ color: '#888', marginLeft: 8, fontSize: 12, width: 20, textAlign: 'right' }}>{p.jersey_number||'-'}</Text>
                 </View>
               );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderStandings = () => {
    if (!standings || standings.length === 0) {
       return (
         <View style={styles.cardSection}>
            <Text style={styles.analysisText}>Puan durumu verisi şu an kullanılamıyor.</Text>
         </View>
       );
    }

    // Sportmonks V3'te standings yapısı farklılık gösterebilir.
    let table = [];
    if (standings[0]?.position !== undefined) {
      table = standings;
    } else {
      const stage = standings[0];
      table = stage?.entries || stage?.standings || stage?.details || [];
    }
    


    if (table.length === 0) {
      return (
        <View style={styles.cardSection}>
           <Text style={styles.analysisText}>Bu lig için puan durumu verisi bulunamadı.</Text>
        </View>
      );
    }

    const homeTeamId = matchData?.participants?.find((p: any) => p.meta?.location === 'home')?.id;
    const awayTeamId = matchData?.participants?.find((p: any) => p.meta?.location === 'away')?.id;

    return (
      <View style={styles.cardSection}>
        <View style={styles.standingHeader}>
          <Text style={[styles.stText, { width: 25 }]}>#</Text>
          <Text style={[styles.stText, { flex: 1, textAlign: 'left', paddingLeft: 10 }]}>Takım</Text>
          <Text style={[styles.stText, { width: 25 }]}>O</Text>
          <Text style={[styles.stText, { width: 20 }]}>G</Text>
          <Text style={[styles.stText, { width: 20 }]}>B</Text>
          <Text style={[styles.stText, { width: 20 }]}>M</Text>
          <Text style={[styles.stText, { width: 30 }]}>AV</Text>
          <Text style={[styles.stText, { width: 30, fontWeight: 'bold', color: '#1DB954' }]}>P</Text>
        </View>
        {table.map((entry: any, index: number) => {
          const isHome = entry.participant_id === homeTeamId;
          const isAway = entry.participant_id === awayTeamId;
          
          // Sportmonks V3 - details array'den istatistik çekme (EXACT match only)
          const getDetailValue = (codes: string[]) => {
            if (!entry.details || !Array.isArray(entry.details)) return undefined;
            for (const searchCode of codes) {
              const sc = searchCode.toLowerCase();
              const found = entry.details.find((detail: any) => {
                const dCode = (detail.type?.code || '').toLowerCase();
                const dDevName = (detail.type?.developer_name || '').toLowerCase();
                return dCode === sc || dDevName === sc;
              });
              if (found !== undefined) return found.value;
            }
            return undefined;
          };

          // Oyun sayısı
          const played = entry.overall?.matches_played 
            ?? entry.overall?.played 
            ?? getDetailValue(['overall-matches-played', 'overall_matches', 'matches-played'])
            ?? entry.played 
            ?? 0;
            
          const won = entry.overall?.won ?? entry.overall?.matches_won ?? getDetailValue(['overall-won', 'overall_wins']) ?? 0;
          const draw = entry.overall?.draw ?? entry.overall?.matches_draw ?? getDetailValue(['overall-draw', 'overall_draws']) ?? 0;
          const lost = entry.overall?.lost ?? entry.overall?.matches_lost ?? getDetailValue(['overall-lost', 'overall_lost', 'overall_losses']) ?? 0;
          
          // Averaj (gol farkı)
          let goalDiff = entry.overall?.goal_difference 
            ?? getDetailValue(['goal-difference', 'overall_goal_difference', 'overall-goal-difference']);
          
          if (goalDiff === undefined || goalDiff === null) {
            const gf = entry.overall?.goals_scored 
              ?? getDetailValue(['overall-goals-for', 'overall_scored', 'overall-scored']) 
              ?? 0;
            const ga = entry.overall?.goals_conceded 
              ?? getDetailValue(['overall-goals-against', 'overall_conceded', 'overall-conceded']) 
              ?? 0;
            goalDiff = gf - ga;
          }

          return (
            <View key={index} style={[styles.standingRow, (isHome || isAway) && { backgroundColor: '#1DB95420' }]}>
              <Text style={[styles.stValue, { width: 25, color: '#888' }]}>{entry.position}</Text>
              <Text style={[styles.stValue, { flex: 1, textAlign: 'left', paddingLeft: 10, color: (isHome||isAway) ? '#1DB954' : '#FFF' }]} numberOfLines={1}>
                {entry.participant?.name || 'Takım'}
              </Text>
              <Text style={[styles.stValue, { width: 25 }]}>{played}</Text>
              <Text style={[styles.stValue, { width: 20 }]}>{won}</Text>
              <Text style={[styles.stValue, { width: 20 }]}>{draw}</Text>
              <Text style={[styles.stValue, { width: 20 }]}>{lost}</Text>
              <Text style={[styles.stValue, { width: 30 }]}>{goalDiff}</Text>
              <Text style={[styles.stValue, { width: 30, fontWeight: 'bold', color: '#1DB954' }]}>{entry.points}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderH2H = () => {
    if (!h2hData || h2hData.length === 0) {
       return (
         <View style={styles.cardSection}>
            <Text style={styles.analysisText}>Geçmiş maç verisi bulunmuyor.</Text>
         </View>
       );
    }

    return (
      <View style={styles.cardSection}>
        <Text style={[styles.aiTitle, { marginBottom: 15 }]}>Aralarındaki Son Maçlar</Text>
        {h2hData.map((fixture: any, index: number) => {
          const home = fixture.participants?.find((p: any) => p.meta?.location === 'home')?.name;
          const away = fixture.participants?.find((p: any) => p.meta?.location === 'away')?.name;
          const hScore = fixture.scores?.[0]?.score?.goals || 0;
          const aScore = fixture.scores?.[1]?.score?.goals || 0;
          const dateStr = fixture.starting_at ? fixture.starting_at.split(' ')[0] : '';
          
          return (
            <View key={index} style={styles.h2hRow}>
              <Text style={styles.h2hDate}>{dateStr}</Text>
              <View style={styles.h2hMain}>
                <Text style={styles.h2hTeam} numberOfLines={1}>{home}</Text>
                <View style={styles.h2hScoreContainer}>
                  <Text style={styles.h2hScore}>{hScore} - {aScore}</Text>
                </View>
                <Text style={[styles.h2hTeam, { textAlign: 'right' }]} numberOfLines={1}>{away}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };
  const renderForm = (p: any) => {
    if (!p.form || p.form.length === 0) return null;
    return (
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {p.form.slice(-5).map((char: string, i: number) => {
          let bgColor = '#444';
          if (char === 'W') bgColor = '#1DB954';
          if (char === 'D') bgColor = '#FFB800';
          if (char === 'L') bgColor = '#FF3B30';
          return (
            <View key={i} style={[styles.formBubble, { backgroundColor: bgColor }]}>
              <Text style={styles.formText}>{char}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maç Detayı</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MATCH HEADER */}
        <View style={styles.matchHeaderCard}>
          <Text style={styles.leagueText}>{matchData.league?.name || 'Lig Bilinmiyor'}</Text>
          <Text style={[styles.dateText, isLive && { color: '#1DB954', fontWeight: 'bold' }]}>{topTimeDisplay}</Text>
          
          <View style={styles.teamsContainer}>
            <View style={styles.teamBadge}>
              {homeTeamInfo.image_path ? <Image source={{uri: homeTeamInfo.image_path}} style={styles.teamLogo} /> : null}
              <Text style={styles.teamText}>{homeName}</Text>
              {renderForm(homeTeamInfo)}
            </View>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.bigScore}>{getScore('home')} - {getScore('away')}</Text>
              <Text style={styles.stateText}>{bottomStateDisplay}</Text>
            </View>
            
            <View style={styles.teamBadge}>
              {awayTeamInfo.image_path ? <Image source={{uri: awayTeamInfo.image_path}} style={styles.teamLogo} /> : null}
              <Text style={styles.teamText}>{awayName}</Text>
              {renderForm(awayTeamInfo)}
            </View>
          </View>
          
          <Text style={styles.stadiumText}>
             <Ionicons name="location" size={14} color="#888" /> {matchData.venue?.name || 'Stadyum Bilinmiyor'}
          </Text>
        </View>

        {/* TABS */}
        {renderTabsToggle()}

        {/* DYNAMIC CONTENT */}
        {activeTab === 'olaylar' && renderEvents()}
        {activeTab === 'tahmin' && renderTahmin()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'lineups' && renderLineups()}
        {activeTab === 'standings' && renderStandings()}
        {activeTab === 'h2h' && renderH2H()}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backButton: { padding: 8, marginLeft: -8 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Header Card
  matchHeaderCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, marginBottom: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  leagueText: { color: '#1DB954', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  dateText: { color: '#888', fontSize: 13, marginBottom: 20 },
  teamsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  teamBadge: { flex: 1, alignItems: 'center' },
  teamLogo: { width: 48, height: 48, marginBottom: 8, resizeMode: 'contain' },
  scoreContainer: { alignItems: 'center', marginHorizontal: 16 },
  bigScore: { color: '#FFF', fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  stateText: { color: '#1DB954', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  teamText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  stadiumText: { color: '#888', fontSize: 12 },

  // Tabs
  tabsScroll: { marginBottom: 16, backgroundColor: '#121212', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  tabsContent: { flexDirection: 'row', overflow: 'hidden' },
  tabButton: { paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', minWidth: 100 },
  tabButtonActive: { backgroundColor: '#1A1A1A', borderBottomWidth: 2, borderBottomColor: '#1DB954' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#1DB954', fontWeight: 'bold' },

  // General Card
  cardSection: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
  },
  
  // AI Tahmin
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 12 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#1DB954' },
  predictionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  predictionLabel: { color: '#CCC', fontSize: 16 },
  predictionBadge: { backgroundColor: '#1DB954', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  predictionValue: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  confidenceValue: { color: '#1DB954', fontWeight: 'bold', fontSize: 20 },
  analysisText: { color: '#AAA', fontSize: 15, lineHeight: 22, marginTop: 8 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  statBarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statLabel: { width: 80, color: '#CCC', fontSize: 14 },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#333', borderRadius: 5, marginHorizontal: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 5 },
  statPercent: { width: 40, color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },

  // Lineups
  lineupTitle: { color: '#1DB954', fontSize: 14, fontWeight: 'bold', marginBottom: 16 },
  lineupPlayer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerName: { color: '#ECEDEE', fontSize: 13, flex: 1 },

  // Pitch Styles
  pitchContainer: {
    width: '100%',
    aspectRatio: 0.65,
    backgroundColor: '#1E6F3E', // Cimen Yesili
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    position: 'relative',
    overflow: 'hidden',
  },
  pitchCenterLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: '#FFF', transform: [{ translateY: -1 }] },
  pitchCenterCircle: { position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#FFF', transform: [{ translateX: -40 }, { translateY: -40 }] },
  pitchPenaltyBox: { position: 'absolute', width: '50%', height: '15%', left: '25%', borderWidth: 2, borderColor: '#FFF' },
  pitchGoalBox: { position: 'absolute', width: '24%', height: '5%', left: '38%', borderWidth: 2, borderColor: '#FFF' },
  playerJersey: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  homeJersey: { backgroundColor: '#1DB954', borderColor: '#FFF' },
  awayJersey: { backgroundColor: '#FFF', borderColor: '#FF3B30' },
  homeJerseyNumber: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  awayJerseyNumber: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  playerNameLabel: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  playerNameText: { color: '#FFF', fontSize: 9, textAlign: 'center' },

  // Mackolik-Style Timeline
  timelineContainer: { position: 'relative', width: '100%', paddingVertical: 10 },
  centerLine: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: '#333', marginLeft: -1 },
  eventRowRow: { flexDirection: 'row', width: '100%', minHeight: 50, marginBottom: 12, alignItems: 'center' },
  eventSideContainer: { width: '50%' },
  eventContentLeft: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 }, // 20px gap from center
  eventContentRight: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20 }, // 20px gap from center
  eventMinuteCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  minuteCapsule: { backgroundColor: '#222', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  minuteCapsuleText: { color: '#999', fontSize: 10, fontWeight: 'bold' },
  eventPlayerName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  eventRelatedPlayer: { color: '#888', fontSize: 11, fontWeight: '600' },
  eventScoreText: { color: '#1DB954', fontSize: 13, fontWeight: '900', marginBottom: 2 },
  
  // H2H & Standings
  h2hRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  h2hDate: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  h2hMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h2hTeam: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  h2hScoreContainer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  h2hScore: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: 'bold',
  },
  standingHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 5,
  },
  stText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  standingRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
    alignItems: 'center',
  },
  stValue: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'center',
  },
  formBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
