import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGpx } from '../context/GpxContext';

export default function SyncModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { syncCode, joinSyncCode } = useGpx();
  const [input, setInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState('');

  const handleCopy = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard
        ?.writeText(syncCode)
        .then(() => flashStatus('✅ Copié !'))
        .catch(() => flashStatus(syncCode));
    } else {
      Alert.alert('Code de synchronisation', syncCode);
    }
  };

  const flashStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2500);
  };

  const handleJoin = async () => {
    const code = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { flashStatus('⚠️ Code invalide'); return; }
    setJoining(true);
    setStatus('Connexion…');
    await joinSyncCode(code);
    setJoining(false);
    setInput('');
    flashStatus('✅ Synchronisé !');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <Text style={st.title}>🔗 Synchronisation</Text>
          <TouchableOpacity onPress={onClose} style={st.closeBtn}>
            <Text style={st.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={st.body}>
          <Text style={st.label}>Code de profil</Text>
          <View style={st.codeRow}>
            <Text style={st.code}>{syncCode || '…'}</Text>
            <TouchableOpacity style={st.copyBtn} onPress={handleCopy}>
              <Text style={st.copyTxt}>📋 Copier</Text>
            </TouchableOpacity>
          </View>
          <Text style={st.hint}>
            Ce code identifie vos données en base. Tous vos appareils doivent utiliser le même code.
          </Text>

          <View style={st.divider} />

          <Text style={st.label}>Changer de profil</Text>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={(v) => setInput(v.toUpperCase())}
            placeholder="Code à 6 caractères"
            autoCapitalize="characters"
            maxLength={8}
            placeholderTextColor="#bbb"
          />
          <TouchableOpacity
            style={[st.joinBtn, joining && st.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={st.joinTxt}>Synchroniser</Text>
          </TouchableOpacity>

          {!!status && <Text style={st.status}>{status}</Text>}

          <View style={st.divider} />

          <View style={st.sqlBox}>
            <Text style={st.sqlTitle}>⚙️ Configuration Supabase requise</Text>
            <Text style={st.sqlText}>
              Exécutez ce SQL dans le dashboard Supabase une seule fois :{'\n\n'}
              {'create table if not exists rando_sync (\n  code text primary key,\n  gpx_track jsonb,\n  itineraire jsonb,\n  trek_notes jsonb,\n  active_trek text,\n  trek_dates jsonb,\n  updated_at timestamptz default now()\n);\nalter table rando_sync enable row level security;\ncreate policy "anon_all" on rando_sync\n  for all using (true) with check (true);\n-- migrations si table existante:\n-- alter table rando_sync add column if not exists trek_notes jsonb;\n-- alter table rando_sync add column if not exists active_trek text;\n-- alter table rando_sync add column if not exists trek_dates jsonb;'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1FAEE' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#264653',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeTxt: { color: '#A8DADC', fontSize: 18 },
  body: { padding: 20, gap: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#264653' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  code: {
    fontSize: 32, fontWeight: '800', color: '#8338EC',
    letterSpacing: 6, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  copyTxt: { fontSize: 13, color: '#5B21B6', fontWeight: '600' },
  hint: { fontSize: 12, color: '#888', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#e0e0e0' },
  input: {
    borderWidth: 1.5, borderColor: '#8338EC', borderRadius: 8,
    padding: 12, fontSize: 22, fontWeight: '700', color: '#264653',
    backgroundColor: '#fff', letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  joinBtn: { backgroundColor: '#264653', borderRadius: 8, padding: 14, alignItems: 'center' },
  joinBtnDisabled: { backgroundColor: '#aaa' },
  joinTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  status: { fontSize: 14, color: '#2A9D8F', fontWeight: '600', textAlign: 'center' },
  sqlBox: { backgroundColor: '#1E1E2E', borderRadius: 8, padding: 12, gap: 6 },
  sqlTitle: { fontSize: 12, color: '#A8DADC', fontWeight: '700' },
  sqlText: { fontSize: 10, color: '#CDD6F4', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 16 },
});
