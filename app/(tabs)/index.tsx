// @ts-nocheck
import { ClientConfig } from '@/constants/ClientConfig';
import { LeadsService, SessionStore, SettingsService } from '@/services/Database';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Lock, Search, Settings, Sparkles, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({ pinEnabled: false, adminPin: '1234' });
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  
  // SESSION STATE
  const [sessionUser, setSessionUser] = useState<any>(SessionStore.getUser());
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  useEffect(() => {
    const unsubscribe = SessionStore.subscribe((u) => setSessionUser(u));
    return () => unsubscribe();
  }, []);

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

  const handleProfilePress = () => {
    if (sessionUser) {
      router.push('/profile');
    } else {
      setIsLoginModalVisible(true);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()) return;
    const user = await LeadsService.login(loginEmail.trim().toLowerCase());
    if (user) {
      setIsLoginModalVisible(false);
      setLoginEmail('');
      router.push('/profile');
    } else {
      Alert.alert("Not Found", "No account found with this email.");
    }
  };

  return (
    <View style={styles.container}>
      
      {/* ADMIN BUTTON (Hidden/Subtle Top Left) */}
      <TouchableOpacity 
        style={styles.adminButton} 
        onPress={handleAdminPress}
      >
        <Settings size={20} color={ClientConfig.colors.accent} />
      </TouchableOpacity>

      {/* LOGIN INDICATOR (Top Right - Only shows if logged in) */}
      {sessionUser && (
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => router.push('/profile')}
        >
          <View style={styles.profileButtonInner}>
             <Text style={styles.profileText}>Hi, {sessionUser.firstName}</Text>
             <User size={20} color={ClientConfig.colors.accent} />
          </View>
        </TouchableOpacity>
      )}

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

          {/* SUBTLE LOGIN INVITATION (Below buttons) */}
          {!sessionUser && (
            <TouchableOpacity 
                style={styles.subtleLoginButton} 
                onPress={() => setIsLoginModalVisible(true)}
            >
                <Text style={styles.subtleLoginText}>Already have a profile? Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.footerText}>Powered by {ClientConfig.companyName}</Text>

      {/* PIN MODAL */}
      <Modal visible={isPinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Lock size={40} color={ClientConfig.colors.secondary} style={{marginBottom: 20}} />
                <Text style={styles.modalTitle}>Admin Access</Text>
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
                    <TouchableOpacity onPress={() => setIsPinModalVisible(false)} style={styles.cancelBtn}><Text style={{color:'#333'}}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity onPress={verifyPin} style={styles.enterBtn}><Text style={{color:'#FFF', fontWeight:'bold'}}>Enter</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* LOGIN MODAL */}
      <Modal visible={isLoginModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <User size={40} color={ClientConfig.colors.secondary} style={{marginBottom: 20}} />
                <Text style={styles.modalTitle}>Client Sign In</Text>
                <Text style={{color:'#666', marginBottom: 15, textAlign:'center'}}>Enter your email to access your profile, favorites, and coupons.</Text>
                
                <TextInput 
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    placeholder="email@example.com"
                    autoFocus
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setIsLoginModalVisible(false)} style={styles.cancelBtn}>
                        <Text style={{color:'#333'}}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogin} style={styles.enterBtn}>
                        <Text style={{color:'#FFF', fontWeight:'bold'}}>Sign In</Text>
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
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  profileButton: {
    position: 'absolute', 
    top: 60, 
    right: 20, 
    zIndex: 100,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  profileButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  profileText: {
    color: ClientConfig.colors.accent,
    fontWeight: 'bold',
    fontSize: 14
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
  subtleLoginButton: {
      alignItems: 'center',
      padding: 15,
  },
  subtleLoginText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 14,
      textDecorationLine: 'underline',
  },
  footerText: {
    textAlign: 'center',
    color: ClientConfig.colors.accent,
    opacity: 0.5,
    paddingBottom: 30,
  },
  // Modal Styles
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center', padding: 20 },
  modalContent: { backgroundColor:'#FFF', padding:30, borderRadius:20, width:'100%', maxWidth:350, alignItems:'center' },
  modalTitle: { fontSize: 22, fontWeight:'bold', color:'#333', marginBottom:5 },
  pinInput: { backgroundColor:'#F0F0F0', fontSize:24, letterSpacing:10, textAlign:'center', width:'100%', padding:15, borderRadius:10, marginBottom:20 },
  input: { backgroundColor:'#F0F0F0', fontSize:16, width:'100%', padding:15, borderRadius:10, marginBottom:20 },
  modalButtons: { flexDirection:'row', gap:10, width:'100%' },
  cancelBtn: { flex:1, padding:15, backgroundColor:'#EEE', borderRadius:10, alignItems:'center' },
  enterBtn: { flex:1, padding:15, backgroundColor:ClientConfig.colors.secondary, borderRadius:10, alignItems:'center' }
});