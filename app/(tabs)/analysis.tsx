import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Analysis, analysisApi } from '../../services/api/analysis';

export default function AnalysisScreen() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setLoading(true);
    const data = await analysisApi.getAnalyses();
    setAnalyses(data);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: Analysis }) => {
    const confidenceVal = parseInt(item.confidence.replace('%', ''));
    const isHot = confidenceVal >= 90;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>{item.match}</Text>
            {isHot && (
              <View style={styles.hotBadge}>
                <Ionicons name="flame" size={12} color="#000" />
                <Text style={styles.hotText}>YÜKSEK GÜVEN</Text>
              </View>
            )}
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>%{confidenceVal}</Text>
          </View>
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.predictionBox}>
            <Text style={styles.label}>TAHMİN</Text>
            <Text style={styles.predictionValue}>{item.prediction}</Text>
          </View>
        </View>

        <View style={styles.descContainer}>
          <View style={styles.aiLabelRow}>
            <Ionicons name="flash" size={14} color="#1DB954" />
            <Text style={styles.aiLabel}>Yapay Zeka Analizi</Text>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>GÜNÜN TAHMİNLERİ</Text>
          <Text style={styles.headerTitle}>Premium Analiz</Text>
        </View>
        <TouchableOpacity onPress={loadAnalyses} style={styles.refreshIcon}>
          <Ionicons name="refresh" size={24} color="#1DB954" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Analizler Hazırlanıyor...</Text>
        </View>
      ) : analyses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={60} color="#222" />
          <Text style={styles.emptyText}>Henüz premium analiz yayınlanmadı.</Text>
          <Text style={styles.emptySubText}>Editörlerimiz maçları inceliyor...</Text>
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadAnalyses}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  refreshIcon: {
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 15,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  hotText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  confidenceBadge: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  confidenceText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
  },
  mainInfo: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  predictionBox: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  predictionValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  descContainer: {
    backgroundColor: 'rgba(29,185,84,0.05)',
    borderRadius: 12,
    padding: 15,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiLabel: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  description: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 22,
  }
});
