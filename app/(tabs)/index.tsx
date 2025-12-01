// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Sparkles, ChevronRight, Search, Settings, Lock } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { ClientConfig } from '@/constants/ClientConfig';
import { SettingsService } from '@/services/Database';

export default function HomeScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({ pinEnabled: false, adminPin: '1234' });
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  // Refresh settings every time we visit Home
  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const s = await SettingsService.getSettings();
        setSettings(s);
      };
      load();
    }, [])
  );

  const handleAdminPress = () => {
    if (settings.pinEnabled) {
      setEnteredPin('');
      setIsPinModalVisible(true);
    } else {
      router.push('/admin');
    }
  };

  const verifyPin = () => {
    if (enteredPin === settings.adminPin) {
      setIsPinModalVisible(false);
      router.push('/admin');
    } else {
      Alert.alert("Access Denied", "Incorrect PIN.");
      setEnteredPin('');
    }
  };

  return (
    <View style={styles.container}>
      
      {/* VISIBLE ADMIN BUTTON */}
      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={handleAdminPress}
      >
        <Settings size={20} color={ClientConfig.colors.accent} />
        <Text style={styles.adminText}>ADMIN</Text>
      </TouchableOpacity>

      <View style={styles.homeContent}>
        <View style={styles.logoContainer}>
          <Sparkles size={60} color={ClientConfig.colors.primary} />
        </View>
        <Text style={styles.title}>{ClientConfig.appName}</Text>
        <Text style={styles.subtitle}>{ClientConfig.tagline}</Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={() => router.push('/quiz')}
          >
            <Text style={styles.mainButtonText}>Find Your Scent</Text>
            <ChevronRight size={24} color={ClientConfig.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/explore')} 
          >
            <Text style={styles.secondaryButtonText}>Search Scents</Text>
            <Search size={24} color={ClientConfig.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.footerText}>Powered by {ClientConfig.companyName}</Text>

      {/* PIN MODAL */}
      <Modal visible={isPinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Lock size={40} color={ClientConfig.colors.secondary} style={{marginBottom: 20}} />
                <Text style={styles.modalTitle}>Admin Access</Text>
                <Text style={{color:'#666', marginBottom: 20}}>Enter your security PIN</Text>
                
                <TextInput 
                    style={styles.pinInput}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={enteredPin}
                    onChangeText={setEnteredPin}
                    placeholder="****"
                    autoFocus
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setIsPinModalVisible(false)} style={styles.cancelBtn}>
                        <Text style={{color:'#333'}}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={verifyPin} style={styles.enterBtn}>
                        <Text style={{color:'#FFF', fontWeight:'bold'}}>Enter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClientConfig.colors.primary,
  },
  adminButton: {
    position: 'absolute', 
    top: 60, 
    left: 20, 
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
    gap: 6
  },
  adminText: {
    color: ClientConfig.colors.accent, 
    fontWeight: 'bold',
    fontSize: 12
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ClientConfig.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: ClientConfig.colors.accent,
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: ClientConfig.colors.accent,
    opacity: 0.8,
    marginBottom: 50,
  },
  buttonGroup: {
    width: '100%',
    gap: 15,
  },
  mainButton: {
    backgroundColor: ClientConfig.colors.secondary,
    padding: 18,
    borderRadius: ClientConfig.borderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    color: ClientConfig.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  secondaryButton: {
    backgroundColor: ClientConfig.colors.accent,
    padding: 18,
    borderRadius: ClientConfig.borderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ClientConfig.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  footerText: {
    textAlign: 'center',
    color: ClientConfig.colors.accent,
    opacity: 0.5,
    paddingBottom: 30,
  },
  // Modal Styles
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center' },
  modalContent: { backgroundColor:'#FFF', padding:30, borderRadius:20, width:'80%', maxWidth:350, alignItems:'center' },
  modalTitle: { fontSize:22, fontWeight:'bold', color:'#333', marginBottom:5 },
  pinInput: { backgroundColor:'#F0F0F0', fontSize:24, letterSpacing:10, textAlign:'center', width:'100%', padding:15, borderRadius:10, marginBottom:20 },
  modalButtons: { flexDirection:'row', gap:10, width:'100%' },
  cancelBtn: { flex:1, padding:15, backgroundColor:'#EEE', borderRadius:10, alignItems:'center' },
  enterBtn: { flex:1, padding:15, backgroundColor:ClientConfig.colors.secondary, borderRadius:10, alignItems:'center' }
});