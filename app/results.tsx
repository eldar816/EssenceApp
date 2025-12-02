// @ts-nocheck
import FragranceCard from '@/components/FragranceCard';
import Toast from '@/components/Toast';
import { ClientConfig } from '@/constants/ClientConfig';
import { LeadsService, SessionStore } from '@/services/Database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Home, RotateCcw, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const recommendations = params.data ? JSON.parse(params.data as string) : [];
  
  // --- GLOBAL SESSION STATE ---
  const [sessionUser, setSessionUser] = useState<any>(SessionStore.getUser());
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // Listen for session changes globally
  useEffect(() => {
    const unsubscribe = SessionStore.subscribe((u) => setSessionUser(u));
    return () => unsubscribe();
  }, []);

  // Function to pass session data back to quiz screen
  const retakeQuiz = () => {
    router.replace({ pathname: '/quiz' });
  };

  // --- HANDLE WISHLIST TOGGLE ---
  const handleToggleHeart = async (item: any) => {
    if (!sessionUser || !sessionUser.id) {
        Alert.alert("Sign In Required", "Please sign in via the Search or Quiz screen to save favorites.");
        return;
    }
    
    try {
        const currentWishlist = sessionUser.wishlist || [];
        const isRemoving = currentWishlist.includes(item.id);
        
        await LeadsService.toggleWishlist(sessionUser.id, item.id, currentWishlist);
        
        // Show Toast
        setToastMsg(isRemoving ? `Removed ${item.name} from favorites` : `Added ${item.name} to favorites`);
        setShowToast(true);
        
    } catch (e) {
        Alert.alert("Error", "Could not update wishlist.");
    }
  };

  // Navigation to Product Page
  const handleProductNavigation = (id: string) => { 
      router.push(`/product/${id}`); 
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.dismissAll()}>
            <ArrowLeft size={24} color={ClientConfig.colors.accent} />
          </TouchableOpacity>
          <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
             <Text style={styles.headerTitle}>Your Perfect Matches</Text>
             {sessionUser && (
                <View style={{flexDirection:'row', alignItems:'center'}}>
                   <Text style={{color: ClientConfig.colors.secondary, fontSize: 12, fontWeight: 'bold', marginRight: 5}}>Hi, {sessionUser.firstName}</Text>
                   <User size={16} color={ClientConfig.colors.secondary} />
                </View>
             )}
          </View>
          <View style={{width: 24}} /> 
        </View>
        
        <FlatList
          data={recommendations}
          contentContainerStyle={{padding: 20, paddingBottom: 40}}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({item, index}) => (
            <FragranceCard 
              id={item.id}
              name={item.name}
              vendor={item.vendor}
              notes={item.notes}
              isTopPick={index === 0}
              onPress={() => handleProductNavigation(item.id)}
              isFavorite={sessionUser?.wishlist?.includes(item.id)} 
              onToggleHeart={() => handleToggleHeart(item)}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {/* START OVER: Retake the quiz */}
              <TouchableOpacity 
                style={styles.mainButton} 
                onPress={retakeQuiz}
              >
                <RotateCcw size={20} color={ClientConfig.colors.primary} style={{marginRight: 8}} />
                <Text style={styles.mainButtonText}>Start Over</Text>
              </TouchableOpacity>

              {/* MAIN MENU: Go back to Home */}
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => router.dismissAll()}
              >
                <Home size={20} color={ClientConfig.colors.accent} style={{marginRight: 8}} />
                <Text style={styles.secondaryButtonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        {/* TOAST NOTIFICATION */}
        <Toast 
            message={toastMsg} 
            visible={showToast} 
            onHide={() => setShowToast(false)} 
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClientConfig.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    color: ClientConfig.colors.accent,
    fontWeight: 'bold',
  },
  footerContainer: {
    marginTop: 20,
    gap: 15,
  },
  mainButton: {
    backgroundColor: ClientConfig.colors.secondary,
    padding: 18,
    borderRadius: ClientConfig.borderRadius,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: ClientConfig.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: ClientConfig.borderRadius,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ClientConfig.colors.accent,
  },
  secondaryButtonText: {
    color: ClientConfig.colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
});