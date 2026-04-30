import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api/auth';

export default function ProfileScreen() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user?.displayName) setEditName(user.displayName);
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) { Alert.alert('Hata', 'İsim boş bırakılamaz.'); return; }
    setAuthLoading(true);
    try {
      await authApi.updateProfileData(editName);
      refreshUser();
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
        await authApi.logout();
        router.replace('/auth');
      }},
    ]);
  };

  // ── Loading ──
  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  if (!user) {
    // If not logged in, we shouldn't really be here, but just in case:
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // PROFILE SCREEN
  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileHeaderTitle}>Profilim</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color="#888" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.profileScroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={44} color="#1DB954" />
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Adınız Soyadınız"
                placeholderTextColor="#555"
                autoFocus
              />
              {authLoading ? <ActivityIndicator color="#1DB954" style={{ marginLeft: 10 }} /> : (
                <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
                  <TouchableOpacity onPress={handleUpdateProfile}>
                    <Ionicons name="checkmark-circle" size={34} color="#1DB954" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setIsEditing(false); setEditName(user.displayName || ''); }}>
                    <Ionicons name="close-circle" size={34} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setIsEditing(true)}>
              <Text style={styles.profileDisplayName}>{user.displayName || 'Kullanıcı'}</Text>
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={12} color="#1DB954" />
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.profileEmail}>{user.email}</Text>

          <TouchableOpacity style={styles.premiumBtn}>
            <Ionicons name="star" size={14} color="#000" />
            <Text style={styles.premiumBtnText}>Premium'a Geç</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[['0', 'Kuponlar'], ['%0', 'Başarı'], ['0', 'Takipçi']].map(([val, label], i) => (
            <React.Fragment key={label}>
              {i > 0 && <View style={styles.statSep} />}
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLbl}>{label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {[
            { icon: 'notifications-outline', label: 'Bildirimler', color: '#FFF' },
            { icon: 'bookmark-outline', label: 'Kaydedilenler', color: '#FFF' },
            { icon: 'trophy-outline', label: 'Başarılarım', color: '#FFF' },
            { icon: 'help-circle-outline', label: 'Destek & Yardım', color: '#FFF' },
          ].map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuRow, i === 3 && { borderBottomWidth: 0 }]}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>BetAnaliz v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#080808', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#080808' },
  profileHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  profileHeaderTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  profileScroll: { paddingHorizontal: 16, paddingBottom: 50 },

  // ── Avatar Card ──
  avatarCard: {
    backgroundColor: '#111', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: '#1DB954',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    padding: 3,
  },
  avatarInner: {
    flex: 1, width: '100%', borderRadius: 48,
    backgroundColor: 'rgba(29,185,84,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  profileDisplayName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  editBadge: {
    marginLeft: 8, backgroundColor: 'rgba(29,185,84,0.15)',
    borderRadius: 8, padding: 4,
  },
  profileEmail: { fontSize: 14, color: '#555', marginBottom: 20 },

  editRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  editInput: {
    backgroundColor: '#161616', color: '#FFF', fontSize: 18, fontWeight: '700',
    borderBottomWidth: 1.5, borderBottomColor: '#1DB954',
    paddingHorizontal: 12, paddingVertical: 6, minWidth: 160, textAlign: 'center', borderRadius: 8,
  },

  premiumBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1DB954', paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 24,
  },
  premiumBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 20,
    paddingVertical: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  statLbl: { fontSize: 12, color: '#555', letterSpacing: 0.5 },
  statSep: { width: 1, backgroundColor: '#1E1E1E', marginVertical: 8 },

  // ── Menu ──
  menuCard: {
    backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: '#181818',
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, color: '#CCC', fontSize: 15, fontWeight: '500' },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,59,48,0.08)', borderRadius: 16, paddingVertical: 16,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.15)',
  },
  logoutText: { color: '#FF3B30', fontWeight: '700', fontSize: 16 },

  // ── Version ──
  versionText: { textAlign: 'center', color: '#2A2A2A', fontSize: 12 },
});
