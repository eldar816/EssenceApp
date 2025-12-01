// @ts-nocheck
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { View, PanResponder, Modal, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsService } from '@/services/Database';
import { ClientConfig } from "@/constants/ClientConfig";

export const unstable_settings = {
  anchor: '(tabs)',
};

// --- INACTIVITY WRAPPER COMPONENT ---
function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState({ timeoutEnabled: false, timeoutSeconds: 60 });
  
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Load settings initially and periodically
  useEffect(() => {
    const load = async () => {
      const s = await SettingsService.getSettings();
      setSettings(s);
    };
    load();
    const interval = setInterval(load, 10000); 
    return () => clearInterval(interval);
  }, []);

  const resetTimer = () => {
    if (showWarning) return; 
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    
    // Don't timeout on Home or Admin
    if (!settings.timeoutEnabled || pathname === '/' || pathname.startsWith('/admin')) return;

    inactivityTimer.current = setTimeout(() => {
      triggerWarning();
    }, settings.timeoutSeconds * 1000);
  };

  const triggerWarning = () => {
    setShowWarning(true);
    setCountdown(10);
    
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    clearInterval(countdownInterval.current);
    setShowWarning(false);
    router.dismissAll(); // Clears stack
    router.replace('/'); // Go to home
  };

  const handleUserActive = () => {
    setShowWarning(false);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    resetTimer();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // Pass touch through to children
      },
    })
  ).current;

  useEffect(() => {
    resetTimer();
  }, [pathname, settings]);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
      
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Are you still there?</Text>
            <Text style={styles.desc}>Session closing in {countdown}s</Text>
            <TouchableOpacity style={styles.btn} onPress={handleUserActive}>
              <Text style={styles.btnText}>YES, I'M HERE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- MAIN ROOT LAYOUT ---
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <InactivityWrapper>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="quiz" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </InactivityWrapper>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#FFF', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 'bold', color: ClientConfig.colors.primary, marginBottom: 10 },
  desc: { fontSize: 16, color: '#666', marginBottom: 30 },
  btn: { backgroundColor: ClientConfig.colors.secondary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});