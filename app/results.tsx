// @ts-nocheck
import FragranceCard from '@/components/FragranceCard';
import { ClientConfig } from '@/constants/ClientConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Home, RotateCcw, User } from 'lucide-react-native';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const recommendations = params.data ? JSON.parse(params.data as string) : [];
  
  // NEW: Retrieve user session info from params
  const sessionUser = params.user ? JSON.parse(params.user) : null;

  // Function to pass session data back to quiz screen
  const retakeQuiz = () => {
    router.replace({
        pathname: '/quiz',
        // CRITICAL FIX: Pass the user session so quiz page knows who they are
        params: { user: sessionUser ? JSON.stringify(sessionUser) : null }
    });
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
              // Card onPress is undefined here, but the card itself has logic for navigation
            />
          )}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {/* START OVER: Retake the quiz, passing session back */}
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