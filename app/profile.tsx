// @ts-nocheck
import { ClientConfig } from '@/constants/ClientConfig';
import { FragranceService, SessionStore } from '@/services/Database';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, LogOut, Ticket } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(SessionStore.getUser());
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to session updates (in case logout happens)
    const unsubscribe = SessionStore.subscribe(u => {
      setUser(u);
      if (!u) router.replace('/'); // Redirect home if logged out
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (user && user.wishlist && user.wishlist.length > 0) {
        const items = await FragranceService.getByIds(user.wishlist);
        setWishlistItems(items);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [user]);

  const handleLogout = () => {
    SessionStore.setUser(null);
    router.replace('/');
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={ClientConfig.colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={20} color={ClientConfig.colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* USER CARD */}
        <View style={styles.card}>
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{user.firstName[0]}{user.lastName[0]}</Text>
          </View>
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>

        {/* COUPONS */}
        <Text style={styles.sectionTitle}>Active Coupons</Text>
        {user.coupons && user.coupons.length > 0 ? (
          user.coupons.map((c: any, i: number) => (
            <View key={i} style={styles.couponCard}>
               <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                  <View style={styles.iconBox}><Ticket size={20} color="#FFF" /></View>
                  <View>
                    <Text style={styles.couponCode}>{c.code}</Text>
                    <Text style={styles.couponMeta}>{c.discount} • Exp: {c.expiryDate}</Text>
                  </View>
               </View>
               <Text style={{color:'green', fontWeight:'bold', fontSize:12}}>{c.status.toUpperCase()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active coupons.</Text>
        )}

        {/* FAVORITES */}
        <Text style={styles.sectionTitle}>My Favorites</Text>
        {wishlistItems.length > 0 ? (
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10}}>
             {wishlistItems.map((item, i) => (
               <TouchableOpacity key={i} style={styles.favCard} onPress={() => router.push(`/product/${item.id}`)}>
                 <View style={styles.favCircle}><Text style={styles.favInitials}>{item.name.substring(0,1)}</Text></View>
                 <Text style={styles.favName} numberOfLines={1}>{item.name}</Text>
                 <Text style={styles.favVendor} numberOfLines={1}>{item.vendor}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No favorites yet.</Text>
        )}

        {/* HISTORY (Mocked based on timestamp/result field for now) */}
        <Text style={styles.sectionTitle}>Quiz History</Text>
        <View style={styles.historyCard}>
           <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
              <Clock size={16} color="#666" />
              <Text style={styles.historyText}>
                 Result: {user.quizResult || "None"}
              </Text>
           </View>
           {user.timestamp && (
             <Text style={styles.historyDate}>
               {new Date(user.timestamp.seconds ? user.timestamp.seconds * 1000 : user.timestamp).toLocaleDateString()}
             </Text>
           )}
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ClientConfig.colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: ClientConfig.colors.accent },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: ClientConfig.colors.primary },
  content: { padding: 20 },
  
  // User Card
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: ClientConfig.colors.primary },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  userPhone: { fontSize: 14, color: '#888', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: ClientConfig.colors.accent, marginBottom: 15, marginTop: 10 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' },

  // Coupon
  couponCard: { backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center' },
  couponCode: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  couponMeta: { fontSize: 12, color: '#666' },

  // Favorites
  favCard: { backgroundColor: '#FFF', width: 120, padding: 10, borderRadius: 12, alignItems: 'center' },
  favCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  favInitials: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  favName: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  favVendor: { fontSize: 10, color: '#888', textAlign: 'center' },

  // History
  historyCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyText: { color: '#FFF', fontSize: 14 },
  historyDate: { color: '#AAA', fontSize: 12 }
});