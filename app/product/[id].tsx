// @ts-nocheck
import NotePyramid from '@/components/NotePyramid';
import { ClientConfig } from '@/constants/ClientConfig';
import { FragranceService, LeadsService, SessionStore } from '@/services/Database';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MapPin, Share2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // USE GLOBAL SESSION
  const [sessionUser, setSessionUser] = useState<any>(SessionStore.getUser());
  
  useEffect(() => {
    const unsubscribe = SessionStore.subscribe((u) => setSessionUser(u));
    return () => unsubscribe();
  }, []);

  // Handle Wishlist Toggle
  const handleToggleHeart = async () => {
    if (!sessionUser || !sessionUser.id) {
        Alert.alert("Sign In Required", "Please sign in via the Search or Quiz screen to save favorites.");
        return;
    }
    try {
        const currentWishlist = sessionUser.wishlist || [];
        // This updates the global session store automatically
        await LeadsService.toggleWishlist(sessionUser.id, id as string, currentWishlist);
    } catch (e) {
        Alert.alert("Error", "Could not update wishlist.");
    }
  };

  // Check if current item is in wishlist
  const isFavorite = sessionUser?.wishlist?.includes(id);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productId = Array.isArray(id) ? id[0] : id;
        const data = await FragranceService.getById(productId);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><Stack.Screen options={{ headerShown: false }} /><ActivityIndicator size="large" color="#FFF" /></View>;
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{color: '#fff', fontSize: 18, marginBottom: 10}}>Product Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}><Text>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const notesObj = Array.isArray(product.notes) ? { top: product.notes, heart: [], base: [] } : product.notes;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{paddingBottom: 80}}>
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color={ClientConfig.colors.primary} /></TouchableOpacity>
          <View style={styles.visualContainer}>
            <View style={styles.placeholderCircle}><Text style={styles.initials}>{product.name ? product.name.substring(0, 2) : "??"}</Text></View>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{flex: 1}}>
              <Text style={styles.vendor}>{product.vendor ? product.vendor.toUpperCase() : "UNKNOWN"}</Text>
              <Text style={styles.title}>{product.name}</Text>
              {product.shelfLocation ? (
                <View style={{flexDirection:'row', alignItems:'center', marginTop: 5}}>
                    <MapPin size={14} color={ClientConfig.colors.secondary} />
                    <Text style={{color: ClientConfig.colors.secondary, marginLeft: 4, fontWeight: 'bold', fontSize: 12}}>Find at: {product.shelfLocation}</Text>
                </View>
              ) : null}
            </View>
            <View style={{flexDirection:'row', gap: 15}}>
                <TouchableOpacity onPress={handleToggleHeart}>
                    <Heart size={24} color={ClientConfig.colors.primary} fill={isFavorite ? ClientConfig.colors.primary : 'transparent'} />
                </TouchableOpacity>
                <TouchableOpacity><Share2 size={24} color={ClientConfig.colors.primary} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.badges}>
             {product.intensity && (<View style={styles.badge}><Text style={styles.badgeText}>{product.intensity}</Text></View>)}
             {product.gender && (<View style={styles.badge}><Text style={styles.badgeText}>{product.gender}</Text></View>)}
             {product.inStock === false && (<View style={[styles.badge, {backgroundColor:'#FFEBEE'}]}><Text style={[styles.badgeText, {color:'red'}]}>Out of Stock</Text></View>)}
          </View>
          {product.description && (<><Text style={styles.sectionTitle}>THE STORY</Text><Text style={styles.description}>{product.description}</Text></>)}
          <Text style={styles.sectionTitle}>OLFACTORY PYRAMID</Text>
          <NotePyramid top={notesObj?.top || []} heart={notesObj?.heart || []} base={notesObj?.base || []} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.addToCartBtn, product.inStock === false && {backgroundColor:'#CCC'}]} disabled={product.inStock === false}>
          <Text style={styles.btnText}>{product.inStock === false ? "Unavailable" : "Add to Collection"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { height: 350, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  visualContainer: { alignItems: 'center', justifyContent: 'center' },
  placeholderCircle: { width: 200, height: 200, borderRadius: 100, backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  initials: { fontSize: 60, color: ClientConfig.colors.primary, fontWeight: 'bold' },
  content: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -40, padding: 30, minHeight: 500 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  vendor: { fontSize: 12, letterSpacing: 1, color: '#888', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: ClientConfig.colors.primary },
  badges: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  badge: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 12, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 20, color: ClientConfig.colors.secondary },
  description: { fontSize: 16, lineHeight: 24, color: '#444' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
  addToCartBtn: { backgroundColor: ClientConfig.colors.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  errorBtn: { marginTop: 20, padding: 10, backgroundColor: '#fff', borderRadius: 8 }
});