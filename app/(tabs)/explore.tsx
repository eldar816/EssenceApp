// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, SafeAreaView, TouchableOpacity, Text, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Search, Filter, X, ArrowLeft, SplitSquareHorizontal, Check, Heart, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ClientConfig } from '@/constants/ClientConfig';
import { useFragranceSearch } from '@/hooks/useFragranceSearch';
import FragranceCard from '@/components/FragranceCard';
import FilterDrawer from '@/components/FilterDrawer';
import { LeadsService } from '@/services/Database';

export default function SearchScreen() {
  const router = useRouter();
  const { 
    searchQuery, setSearchQuery, 
    activeFilters, filterOptions, 
    results, toggleFilter, clearFilters, clearSearch 
  } = useFragranceSearch();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // --- SESSION STATE ---
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [pendingWishlistId, setPendingWishlistId] = useState<string | null>(null); 
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  // --- COMPARISON STATE ---
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]); 
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // --- HELPER FOR ALERTS (Web Compatible) ---
  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result) {
            const okBtn = buttons.find(b => b.style !== 'cancel');
            if (okBtn && okBtn.onPress) okBtn.onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // --- WISHLIST LOGIC ---
  const handleToggleHeart = async (id: string) => {
    if (!id) return;
    
    if (!sessionUser) {
      setPendingWishlistId(id);
      setIsSessionModalOpen(true);
    } else {
      await processWishlistToggle(id);
    }
  };

  const processWishlistToggle = async (id: string) => {
    if (!sessionUser || !sessionUser.id) {
        showAlert("Session Error", "Could not verify user ID. Please sign in again.");
        setSessionUser(null);
        return;
    }

    try {
      const currentWishlist = sessionUser.wishlist || [];
      const newWishlist = await LeadsService.toggleWishlist(sessionUser.id, id, currentWishlist);
      
      setSessionUser({ ...sessionUser, wishlist: newWishlist });
    } catch (e) { 
      console.error("Wishlist Toggle Failed:", e);
      showAlert("Error", `Could not update wishlist: ${e.message || "Unknown error"}`);
    }
  };

  const resetUserForm = () => {
    setUserForm({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleSessionSubmit = async () => {
    const email = userForm.email.trim().toLowerCase();
    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const phone = userForm.phone.trim();

    setLoading(true);

    if (isSignInMode) {
        // SIGN IN FLOW
        if (!email) { showAlert("Required", "Email is required."); setLoading(false); return; }
        
        try {
            const user = await LeadsService.login(email);
            if (user && user.id) { 
                setSessionUser(user);
                setIsSessionModalOpen(false);
                showAlert("Welcome Back", `Logged in as ${user.firstName}.`);
                if (pendingWishlistId) { 
                    await processWishlistToggle(pendingWishlistId); 
                    setPendingWishlistId(null); 
                }
            } else {
                showAlert("Not Found", "No account found with this email. Please sign up.");
                setIsSignInMode(false); 
            }
        } catch (e) {
            console.error(e);
            showAlert("Error", "Login failed. Check console.");
        }
    } else {
        // SIGN UP FLOW
        if (!firstName || !email) { showAlert("Required", "Name and Email are required."); setLoading(false); return; }
        
        try {
            const exists = await LeadsService.checkExists(email);
            
            if (exists) {
                showAlert("Account Found", "An account with this email already exists. Signing you in instead...", [
                    { text: "Cancel", style: 'cancel' },
                    { text: "Sign In", onPress: () => setIsSignInMode(true) }
                ]);
                if (Platform.OS === 'web') setIsSignInMode(true); 
                setLoading(false);
                return;
            }
            
            const code = await LeadsService.saveLead({ firstName, lastName, email, phone, quizResult: '' });
            const user = await LeadsService.login(email);
            
            if (user && user.id) { 
                setSessionUser(user);
                setIsSessionModalOpen(false);
                resetUserForm(); 
                showAlert("Welcome!", `Profile created! Your coupon code: ${code}`);
                
                if (pendingWishlistId) { await processWishlistToggle(pendingWishlistId); setPendingWishlistId(null); }
            } else {
                 showAlert("Error", "Account created, but failed to retrieve session immediately. Try signing in.");
            }

        } catch (e) { 
            console.error("Sign up error:", e);
            showAlert("Error", "Could not start session. " + e.message); 
        }
    }
    setLoading(false);
  };

  const toggleComparisonSelect = (id: string) => {
    if (selectedForCompare.includes(id)) { setSelectedForCompare(selectedForCompare.filter(i => i !== id)); } 
    else { if (selectedForCompare.length < 2) { setSelectedForCompare([...selectedForCompare, id]); } else { setSelectedForCompare([selectedForCompare[1], id]); } }
  };

  const exitCompareMode = () => { setIsCompareMode(false); setSelectedForCompare([]); };
  const getCompareItem = (id: string) => results.find(r => r.id === id);
  
  // NEW: Navigation handler to Product Page, passing session data
  const handleProductNavigation = (id: string) => {
      router.push({
          pathname: `/product/${id}`,
          params: {
              user: sessionUser ? JSON.stringify(sessionUser) : null,
          },
      });
  };

  const SearchBar = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={24} color={ClientConfig.colors.primary} /></TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={20} color={ClientConfig.colors.textDark} style={{opacity: 0.5}} />
          <TextInput style={styles.searchInput} placeholder="Search perfumes..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={clearSearch} style={{marginRight: 10}}><X size={20} color={ClientConfig.colors.textDark} /></TouchableOpacity>}
          <TouchableOpacity onPress={() => setIsFilterOpen(!isFilterOpen)} style={[styles.filterButton, isFilterOpen && styles.filterButtonActive]}><Filter size={20} color={isFilterOpen ? ClientConfig.colors.accent : ClientConfig.colors.primary} /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.compareBar}>
        <TouchableOpacity style={[styles.compareToggle, isCompareMode && styles.compareToggleActive]} onPress={() => isCompareMode ? exitCompareMode() : setIsCompareMode(true)}>
          <SplitSquareHorizontal size={18} color={isCompareMode ? ClientConfig.colors.secondary : '#666'} />
          <Text style={[styles.compareText, isCompareMode && {color:ClientConfig.colors.secondary}]}>{isCompareMode ? "Exit Compare" : "Compare Scents"}</Text>
        </TouchableOpacity>
        {sessionUser ? (
           <View style={{flexDirection:'row', alignItems:'center'}}><Text style={{color: ClientConfig.colors.secondary, fontWeight:'bold', marginRight:5}}>Hi, {sessionUser.firstName}</Text><User size={16} color={ClientConfig.colors.secondary} /></View>
        ) : (<Text style={{color:'#888', fontSize:12}}>{isCompareMode ? `${selectedForCompare.length}/2 Selected` : "Tap ❤️ to save"}</Text>)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <SearchBar />
        {isFilterOpen && <FilterDrawer options={filterOptions} activeFilters={activeFilters} onToggle={toggleFilter} onClear={clearFilters} />}
        <FlatList
          data={results} numColumns={1} keyExtractor={item => item.id} contentContainerStyle={{padding: 20, paddingBottom: 100}}
          renderItem={({item}) => (
            <FragranceCard 
                id={item.id} 
                name={item.name} 
                vendor={item.vendor} 
                notes={item.notes} 
                // CRITICAL FIX: Use custom handler for navigation
                onPress={isCompareMode ? () => toggleComparisonSelect(item.id) : () => handleProductNavigation(item.id)} 
                selected={selectedForCompare.includes(item.id)} 
                isFavorite={sessionUser?.wishlist?.includes(item.id)} 
                onToggleHeart={() => handleToggleHeart(item.id)} 
            />
          )}
        />
        {isCompareMode && selectedForCompare.length === 2 && (
          <TouchableOpacity style={styles.fab} onPress={() => setIsCompareModalOpen(true)}><Text style={styles.fabText}>Compare Now</Text><ArrowLeft size={20} color="#FFF" style={{transform:[{rotate:'180deg'}]}} /></TouchableOpacity>
        )}

        {/* SESSION MODAL */}
        <Modal visible={isSessionModalOpen} animationType="slide" transparent>
           <View style={styles.modalOverlay}>
             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
                <Text style={styles.modalTitle}>{isSignInMode ? "Welcome Back" : "Save Your Favorites"}</Text>
                <Text style={styles.modalDesc}>{isSignInMode ? "Enter email to retrieve your wishlist." : "Create a session to track your likes and get coupons."}</Text>
                
                {!isSignInMode && (
                  <>
                    <TextInput style={styles.input} placeholder="First Name" value={userForm.firstName} onChangeText={t => setUserForm({...userForm, firstName: t})} />
                    <TextInput style={styles.input} placeholder="Last Name" value={userForm.lastName} onChangeText={t => setUserForm({...userForm, lastName: t})} />
                  </>
                )}
                <TextInput style={styles.input} placeholder="Email Address" value={userForm.email} onChangeText={t => setUserForm({...userForm, email: t})} keyboardType="email-address" autoCapitalize="none" />
                {!isSignInMode && <TextInput style={styles.input} placeholder="Phone (Optional)" value={userForm.phone} onChangeText={t => setUserForm({...userForm, phone: t})} keyboardType="phone-pad" />}

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => { setIsSessionModalOpen(false); setPendingWishlistId(null); setIsSignInMode(false); resetUserForm(); }} style={styles.cancelBtn}><Text style={{color:'#333'}}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleSessionSubmit} style={[styles.submitBtn, loading && {opacity:0.7}]} disabled={loading}>
                        <Text style={{color:'#FFF', fontWeight:'bold'}}>{loading ? "Processing..." : (isSignInMode ? "Retrieve Profile" : "Start Session")}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => { setIsSignInMode(!isSignInMode); resetUserForm(); }} style={{marginTop:15, alignItems:'center'}}>
                    <Text style={{color: ClientConfig.colors.primary}}>{isSignInMode ? "New User? Create Profile" : "Already have an account? Sign In"}</Text>
                </TouchableOpacity>
             </KeyboardAvoidingView>
           </View>
        </Modal>

        {/* COMPARISON MODAL */}
        <Modal visible={isCompareModalOpen} animationType="slide" presentationStyle="pageSheet">
           <View style={styles.modalContainer}>
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>Head to Head</Text><TouchableOpacity onPress={() => setIsCompareModalOpen(false)}><X size={24} color="#333" /></TouchableOpacity></View>
              <ScrollView contentContainerStyle={styles.compareContent}>
                 <View style={styles.compareRow}>
                    <View style={styles.compareCol}>
                       {selectedForCompare[0] && (() => { const item = getCompareItem(selectedForCompare[0]); return ( <><View style={styles.circle}><Text style={styles.initials}>{item.name.substring(0,2)}</Text></View><Text style={styles.colTitle}>{item.name}</Text><Text style={styles.colVendor}>{item.vendor}</Text><View style={styles.statBox}><Text style={styles.statLabel}>Intensity</Text><Text style={styles.statValue}>{item.intensity}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Gender</Text><Text style={styles.statValue}>{item.gender}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Top Notes</Text><Text style={styles.statValueSmall}>{Array.isArray(item.notes?.top) ? item.notes.top.join(', ') : '-'}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Occasion</Text><Text style={styles.statValueSmall}>{item.occasion?.join(', ') || '-'}</Text></View></> ); })()}
                    </View>
                    <View style={styles.vsLine} />
                    <View style={styles.compareCol}>
                       {selectedForCompare[1] && (() => { const item = getCompareItem(selectedForCompare[1]); return ( <><View style={[styles.circle, {backgroundColor: ClientConfig.colors.primary}]}><Text style={[styles.initials, {color: ClientConfig.colors.secondary}]}>{item.name.substring(0,2)}</Text></View><Text style={styles.colTitle}>{item.name}</Text><Text style={styles.colVendor}>{item.vendor}</Text><View style={styles.statBox}><Text style={styles.statLabel}>Intensity</Text><Text style={styles.statValue}>{item.intensity}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Gender</Text><Text style={styles.statValue}>{item.gender}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Top Notes</Text><Text style={styles.statValueSmall}>{Array.isArray(item.notes?.top) ? item.notes.top.join(', ') : '-'}</Text></View><View style={styles.statBox}><Text style={styles.statLabel}>Occasion</Text><Text style={styles.statValueSmall}>{item.occasion?.join(', ') || '-'}</Text></View></> ); })()}
                    </View>
                 </View>
              </ScrollView>
           </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ClientConfig.colors.primary },
  header: { padding: 20, backgroundColor: ClientConfig.colors.accent, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { padding: 5 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: ClientConfig.colors.textLight, paddingHorizontal: 15, height: 50, borderRadius: ClientConfig.borderRadius },
  searchInput: { flex: 1, height: '100%', marginLeft: 10, color: ClientConfig.colors.textDark, fontSize: 16 },
  filterButton: { padding: 8, borderRadius: 8, backgroundColor: ClientConfig.colors.textLight },
  filterButtonActive: { backgroundColor: ClientConfig.colors.primary },
  
  // Compare Styles
  compareBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 5 },
  compareToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.5)' },
  compareToggleActive: { backgroundColor: ClientConfig.colors.primary },
  compareText: { fontWeight: 'bold', color: '#555' },
  
  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: ClientConfig.colors.secondary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:4, elevation:8 },
  fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  compareContent: { padding: 20 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compareCol: { flex: 1, alignItems: 'center' },
  vsLine: { width: 1, backgroundColor: '#DDD', marginHorizontal: 10 },
  
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  initials: { fontSize: 24, fontWeight: 'bold', color: ClientConfig.colors.primary },
  colTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  colVendor: { fontSize: 12, color: '#666', marginBottom: 20 },
  
  statBox: { width: '100%', padding: 10, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statValueSmall: { fontSize: 12, color: '#333', textAlign: 'center' },

  // Session Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding: 20 },
  modalCard: { backgroundColor:'#FFF', padding:25, borderRadius:20, width:'100%', maxWidth:400 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: ClientConfig.colors.primary, marginBottom: 10, textAlign: 'center' },
  modalDesc: { color:'#666', marginBottom:20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection:'row', gap:15, marginTop:10 },
  cancelBtn: { flex:1, padding:15, backgroundColor:'#EEE', borderRadius:10, alignItems:'center' },
  submitBtn: { flex:1, padding:15, backgroundColor:ClientConfig.colors.secondary, borderRadius:10, alignItems:'center' }
});