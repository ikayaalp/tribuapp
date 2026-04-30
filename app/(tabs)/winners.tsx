import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { winnersApi, WinnersData, PastPrediction } from '../../services/api/winners';
import { getTurkeyNow, toTurkeyDateStr } from '../../services/timezone';

const pad = (n: number) => n.toString().padStart(2, '0');

function DatePickerModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean; current: string;
  onSelect: (d: string) => void; onClose: () => void;
}) {
  const days: { label: string; value: string }[] = [];
  const trNow = getTurkeyNow();
  for (let i = -30; i <= 0; i++) { // Son 30 gün
    const d = new Date(trNow);
    d.setDate(d.getDate() + i);
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const label = i === 0
      ? 'Bugün'
      : (i === -1 ? 'Dün' : `${d.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()]} ${dayNames[d.getDay()]}`);
    days.push({ label, value: val });
  }

  // Yeniden eskiye sırala
  days.reverse();

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

export default function WinnersScreen() {
  const [data, setData] = useState<WinnersData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Varsayılan olarak dünü seç
  const d = new Date(getTurkeyNow());
  d.setDate(d.getDate() - 1);
  const yesterdayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  
  const [selectedDate, setSelectedDate] = useState(yesterdayStr);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    loadWinners(selectedDate);
  }, [selectedDate]);

  const loadWinners = async (dateStr: string) => {
    setLoading(true);
    const result = await winnersApi.getWinners(dateStr);
    setData(result);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: PastPrediction }) => {
    const isWon = item.is_won;
    const color = isWon ? '#1DB954' : '#FF3B30';
    const icon = isWon ? 'checkmark-circle' : 'close-circle';
    
    return (
      <View style={[styles.card, { borderColor: isWon ? '#1DB95440' : '#FF3B3040' }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name={icon} size={24} color={color} style={{ marginRight: 8 }} />
            <Text style={styles.matchTitle}>{item.match}</Text>
          </View>
        </View>
        
        <View style={styles.predictionRow}>
          <Text style={styles.predictionLabel}>Yapay Zeka:</Text>
          <Text style={[styles.predictionText, { color: '#FFF' }]}>{item.prediction}</Text>
        </View>
        
        <View style={styles.predictionRow}>
          <Text style={styles.predictionLabel}>Skor:</Text>
          <Text style={[styles.predictionText, { color }]}>{item.actual_score}</Text>
        </View>
      </View>
    );
  };

  // Create date ribbon data (-7 to 0 days)
  const dateRibbon: { label: string, dayNum: number, value: string }[] = [];
  const trNow = getTurkeyNow();
  for (let i = -7; i <= 0; i++) {
    const dObj = new Date(trNow);
    dObj.setDate(dObj.getDate() + i);
    const val = toTurkeyDateStr(dObj);
    const dayName = i === 0 ? 'Bugün' : (i === -1 ? 'Dün' : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][dObj.getDay()]);
    const dayNum = dObj.getDate();
    dateRibbon.push({ label: dayName, dayNum, value: val });
  }

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Karne</Text>
        <TouchableOpacity onPress={() => setCalendarOpen(true)}>
          <Ionicons name="calendar-outline" size={24} color="#1DB954" />
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={calendarOpen}
        current={selectedDate}
        onSelect={(d) => setSelectedDate(d)}
        onClose={() => setCalendarOpen(false)}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Sonuçlar analiz ediliyor...</Text>
        </View>
      ) : !data || data.predictions.length === 0 ? (
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>Bu tarihe ait bitmiş maç bulunamadı.</Text>
          </View>
        </View>
      ) : (
        <>
          {renderHeader()}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.total}</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#1DB954' }]}>{data.won}</Text>
              <Text style={styles.statLabel}>Tutan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{data.lost}</Text>
              <Text style={styles.statLabel}>Yatan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>%{data.success_rate}</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
          </View>
          
          <FlatList
            data={data.predictions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={() => loadWinners(selectedDate)}
          />
        </>
      )}
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  statBox: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF'
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4
  },
  listContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16, textAlign: 'center' },
  
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  matchTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', flex: 1 },
  
  predictionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  predictionLabel: { color: '#AAA', fontSize: 14, width: 90 },
  predictionText: { fontSize: 15, fontWeight: 'bold' },
});
