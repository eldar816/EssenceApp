// @ts-nocheck
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import { ClientConfig } from '@/constants/ClientConfig';
import { AnalyticsService, FragranceService, LeadsService, MetadataService, SettingsService } from '@/services/Database';
import { useRouter } from 'expo-router';
import { ArrowDown, ArrowLeft, ArrowUp, CheckSquare, Clock, Edit2, Eye, Heart, Lock, Mail, MapPin, Phone, Plus, Power, Search, Square, Ticket, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inventory' | 'parameters' | 'quizzes' | 'settings' | 'leads' | 'analytics'>('inventory');
  const [paramCategory, setParamCategory] = useState<'vendors' | 'notes' | 'occasions' | 'personalities'>('vendors');
  const [loading, setLoading] = useState(true);
  
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({ vendors: [], notes: [], occasions: [], personalities: [] });
  const [quizList, setQuizList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ collectUserInfo: false, timeoutEnabled: true, timeoutSeconds: 60, pinEnabled: false, adminPin: '1234' });
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuizListModalOpen, setIsQuizListModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isParamEditModalOpen, setIsParamEditModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [leadWishlistItems, setLeadWishlistItems] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newVendor, setNewVendor] = useState<string[]>([]); 
  const [newDescription, setNewDescription] = useState('');
  const [newShelfLocation, setNewShelfLocation] = useState(''); 
  const [newGender, setNewGender] = useState<'masculine'|'feminine'|'unisex'>('unisex');
  const [newIntensity, setNewIntensity] = useState<'light'|'medium'|'strong'>('medium');
  const [newInStock, setNewInStock] = useState(true);
  const [newNotesTop, setNewNotesTop] = useState<string[]>([]);
  const [newNotesHeart, setNewNotesHeart] = useState<string[]>([]);
  const [newNotesBase, setNewNotesBase] = useState<string[]>([]);
  const [newOccasion, setNewOccasion] = useState<string[]>([]);
  const [newPersonality, setNewPersonality] = useState<string[]>([]);

  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [tempOptions, setTempOptions] = useState<any[]>([]);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [newOptionValue, setNewOptionValue] = useState<string[]>([]); 
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newParamItem, setNewParamItem] = useState('');
  const [editingParam, setEditingParam] = useState<{ original: string, current: string } | null>(null);
  const [leadForm, setLeadForm] = useState({ firstName: '', lastName: '', email: '', phone: '', quizResult: '' });
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => { setSelectedIds([]); setIsSelectionMode(false); setAdminSearch(''); }, [activeTab, paramCategory]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [frags, meta, quizzes, config, leadList, stats] = await Promise.all([
        FragranceService.getAll(), MetadataService.getAll(), FragranceService.getQuizzes(),
        SettingsService.getSettings(), LeadsService.getLeads(), AnalyticsService.getStats()
      ]);
      setInventoryItems(frags); setMetadata(meta); setQuizList(quizzes); setSettings(config); setLeads(leadList); setAnalytics(stats);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const updateSetting = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value }; setSettings(updated); await SettingsService.updateSettings({ [key]: value });
  };

  const getFilteredInventory = () => { if (!adminSearch) return inventoryItems; const lower = adminSearch.toLowerCase(); return inventoryItems.filter(item => item.name.toLowerCase().includes(lower) || item.vendor.toLowerCase().includes(lower)); };
  const getFilteredParameters = () => { const list = metadata[paramCategory] || []; if (!adminSearch) return list; return list.filter(item => item.toLowerCase().includes(adminSearch.toLowerCase())); };
  const getFilteredQuizzes = () => { if (!adminSearch) return quizList; return quizList.filter(item => item.title.toLowerCase().includes(adminSearch.toLowerCase())); };
  const getFilteredLeads = () => { if (!adminSearch) return leads; const lower = adminSearch.toLowerCase(); return leads.filter(l => `${l.firstName} ${l.lastName} ${l.email} ${l.phone || ''}`.toLowerCase().includes(lower)); };

  const confirmExit = (onConfirm: () => void) => { if (Platform.OS === 'web') { if (window.confirm("Discard changes?")) onConfirm(); } else { Alert.alert("Discard Changes?", "Unsaved progress will be lost.", [{ text: "Keep Editing", style: "cancel" }, { text: "Discard", style: "destructive", onPress: onConfirm }]); } };
  const handleBatchAction = async () => { const message = `Delete ${selectedIds.length} items?`; if (Platform.OS === 'web') { if (window.confirm(message)) executeBatchDelete(); } else { Alert.alert("Batch Delete", message, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: executeBatchDelete }]); } };
  const toggleSelection = (id: string) => { if (selectedIds.includes(id)) { const remaining = selectedIds.filter(i => i !== id); setSelectedIds(remaining); if (remaining.length === 0) setIsSelectionMode(false); } else { setSelectedIds([...selectedIds, id]); setIsSelectionMode(true); } };
  const executeBatchDelete = async () => { setLoading(true); try { if (activeTab === 'inventory') await FragranceService.deleteFragrances(selectedIds); else if (activeTab === 'quizzes') await FragranceService.deleteQuizzes(selectedIds); else if (activeTab === 'leads') await LeadsService.deleteLeads(selectedIds); else if (activeTab === 'parameters') { for (const id of selectedIds) await MetadataService.removeItem(paramCategory, id); setMetadata(await MetadataService.getAll()); } setSelectedIds([]); setIsSelectionMode(false); loadAllData(); } catch (e) { Alert.alert("Error", "Batch delete failed"); } finally { setLoading(false); } };

  // --- INVENTORY HANDLERS ---
  const handleToggleStock = async (item: any) => { try { const newStatus = item.inStock === false; setInventoryItems(prev => prev.map(i => i.id === item.id ? {...i, inStock: newStatus} : i)); await FragranceService.updateFragrance(item.id, { inStock: newStatus }); } catch (e) { loadAllData(); } };
  const handleEdit = (item: any) => { setEditingId(item.id); setNewName(item.name); setNewVendor(item.vendor ? [item.vendor] : []); setNewDescription(item.description || ''); setNewShelfLocation(item.shelfLocation || ''); setNewGender(item.gender || 'unisex'); setNewIntensity(item.intensity || 'medium'); setNewInStock(item.inStock !== false); setNewNotesTop(item.notes?.top || []); setNewNotesHeart(item.notes?.heart || []); setNewNotesBase(item.notes?.base || []); setNewOccasion(item.occasion || []); setNewPersonality(item.personality || []); setIsModalOpen(true); };
  const handleSave = async () => { if(!newName || newVendor.length === 0) { Alert.alert("Missing Info", "Name and Vendor required"); return; } const data = { name: newName, vendor: newVendor[0], description: newDescription || "No desc.", shelfLocation: newShelfLocation, gender: newGender, intensity: newIntensity, inStock: newInStock, notes: { top: newNotesTop, heart: newNotesHeart, base: newNotesBase }, occasion: newOccasion, personality: newPersonality, image: "" }; setLoading(true); try { if (editingId) await FragranceService.updateFragrance(editingId, data); else await FragranceService.addFragrance(data); setIsModalOpen(false); loadAllData(); } catch (e) { Alert.alert("Error", "Save failed"); } finally { setLoading(false); } };
  const resetForm = () => { setEditingId(null); setNewName(''); setNewVendor([]); setNewDescription(''); setNewShelfLocation(''); setNewGender('unisex'); setNewIntensity('medium'); setNewInStock(true); setNewNotesTop([]); setNewNotesHeart([]); setNewNotesBase([]); setNewOccasion([]); setNewPersonality([]); };
  const handleDelete = async (id: string) => { if(Platform.OS==='web' ? confirm("Delete?") : true) { try { await FragranceService.deleteFragrance(id); loadAllData(); } catch(e) { Alert.alert("Error", "Delete failed"); } } };
  const handleViewProduct = (id: string) => { router.push(`/product/${id}`); };

  // --- PARAM, QUIZ, LEAD LOGIC ---
  const handleAddParam = async () => { if (!newParamItem.trim()) return; setLoading(true); try { await MetadataService.addItem(paramCategory, newParamItem.trim()); setNewParamItem(''); setMetadata(await MetadataService.getAll()); } catch (e) { Alert.alert("Error", "Add failed"); } finally { setLoading(false); } };
  const handleEditParam = (item: string) => { setEditingParam({ original: item, current: item }); setIsParamEditModalOpen(true); };
  const saveParamEdit = async () => { if (!editingParam || !editingParam.current.trim() || editingParam.original === editingParam.current.trim()) { setIsParamEditModalOpen(false); return; } setLoading(true); try { await MetadataService.removeItem(paramCategory, editingParam.original); await MetadataService.addItem(paramCategory, editingParam.current.trim()); setMetadata(await MetadataService.getAll()); setIsParamEditModalOpen(false); } catch (e) { Alert.alert("Error", "Update failed"); } finally { setLoading(false); } };
  const handleDeleteParam = async (val: string) => { if (Platform.OS === 'web') { if(window.confirm(`Remove "${val}"?`)) processParamDelete(val); } else Alert.alert("Remove", `Remove "${val}"?`, [{ text: "Cancel" }, { text: "Remove", style: 'destructive', onPress: () => processParamDelete(val) }]); };
  const processParamDelete = async (val: string) => { setLoading(true); const newVals = await MetadataService.removeItem(paramCategory, val); setMetadata(prev => ({ ...prev, [paramCategory]: newVals })); setLoading(false); };
  const handleAddNewMeta = async (cat: string, val: string) => { const nv = await MetadataService.addItem(cat, val); setMetadata(prev => ({ ...prev, [cat]: nv })); };
  const handleCreateQuiz = () => { setCurrentQuiz({ title: "New Quiz", description: "", active: false, questions: [] }); setIsQuizListModalOpen(true); setIsReordering(false); };
  const handleEditQuiz = (quiz: any) => { setCurrentQuiz({ ...quiz }); setIsQuizListModalOpen(true); setIsReordering(false); };
  const toggleQuizActive = async (item: any) => { try { await FragranceService.saveQuiz({ ...item, active: !item.active }); loadAllData(); } catch (e) { Alert.alert("Error", "Could not update status"); } };
  const handleSaveQuiz = async () => { if (!currentQuiz.title) { Alert.alert("Error", "Title required"); return; } try { await FragranceService.saveQuiz(currentQuiz); setIsQuizListModalOpen(false); loadAllData(); } catch (e) { Alert.alert("Error", "Could not save quiz"); } };
  const handleDeleteQuiz = async (id: string) => { try { await FragranceService.deleteQuiz(id); loadAllData(); } catch(e) { Alert.alert("Error", "Delete failed"); } };
  const handleAddQuestion = () => { setEditingQuestion({ id: Date.now().toString(), question: '', type: 'single', options: [], categoryMatch: 'personality' }); setTempOptions([]); setNewOptionValue([]); setNewOptionLabel(''); setIsQuestionModalOpen(true); };
  const handleEditQuestion = (q: any, index: number) => { setEditingQuestion({ ...q, _index: index }); setTempOptions(q.options || []); setNewOptionValue([]); setNewOptionLabel(''); setIsQuestionModalOpen(true); };
  const saveQuestionToQuiz = () => { if (!editingQuestion.question) { Alert.alert("Error", "Text required"); return; } const newQ = { ...editingQuestion, options: tempOptions }; const updated = [...currentQuiz.questions]; if (editingQuestion._index !== undefined) updated[editingQuestion._index] = newQ; else updated.push(newQ); setCurrentQuiz({ ...currentQuiz, questions: updated }); setIsQuestionModalOpen(false); };
  const deleteQuestionFromQuiz = (index: number) => { const updated = [...currentQuiz.questions]; updated.splice(index, 1); setCurrentQuiz({ ...currentQuiz, questions: updated }); };
  const moveQuestion = (index: number, direction: 'up'|'down') => { if (direction === 'up' && index === 0) return; if (direction === 'down' && index === currentQuiz.questions.length - 1) return; const newIndex = direction === 'up' ? index - 1 : index + 1; const updated = [...currentQuiz.questions]; const [moved] = updated.splice(index, 1); updated.splice(newIndex, 0, moved); setCurrentQuiz({ ...currentQuiz, questions: updated }); };
  const handleAddOption = () => { if (newOptionValue.length === 0) return; const val = newOptionValue[0]; const lbl = newOptionLabel.trim() || val; if (editingOptionIndex !== null) { const up = [...tempOptions]; up[editingOptionIndex] = { value: val, label: lbl }; setTempOptions(up); setEditingOptionIndex(null); } else setTempOptions([...tempOptions, { value: val, label: lbl }]); setNewOptionValue([]); setNewOptionLabel(''); };
  const handleEditOption = (index: number) => { const opt = tempOptions[index]; setNewOptionValue([opt.value]); setNewOptionLabel(opt.label); setEditingOptionIndex(index); };
  const handleCancelOptionEdit = () => { setNewOptionValue([]); setNewOptionLabel(''); setEditingOptionIndex(null); };
  const handleRemoveOption = (index: number) => { const up = [...tempOptions]; up.splice(index, 1); setTempOptions(up); if(editingOptionIndex===index) handleCancelOptionEdit(); };
  const handleAddLead = () => { setEditingLeadId(null); setLeadForm({ firstName: '', lastName: '', email: '', phone: '', quizResult: '' }); setIsLeadModalOpen(true); };
  const handleEditLead = (lead: any) => { setEditingLeadId(lead.id); setLeadForm({ firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: lead.phone || '', quizResult: lead.quizResult || '' }); setIsLeadModalOpen(true); };
  const saveLead = async () => { if (!leadForm.firstName || !leadForm.email) { Alert.alert("Missing Info", "First Name and Email are required"); return; } setLoading(true); try { if (editingLeadId) { await LeadsService.updateLead(editingLeadId, leadForm); } else { await LeadsService.saveLead(leadForm); } setIsLeadModalOpen(false); loadAllData(); } catch (e) { Alert.alert("Error", "Could not save lead"); } finally { setLoading(false); } };
  const handleDeleteLead = async (id: string) => { if (Platform.OS === 'web') { if (window.confirm("Delete this lead?")) processDeleteLead(id); } else { Alert.alert("Delete", "Delete this lead?", [ { text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => processDeleteLead(id) } ]); } };
  const processDeleteLead = async (id: string) => { setLoading(true); try { await LeadsService.deleteLead(id); const newLeads = await LeadsService.getLeads(); setLeads(newLeads); } catch(e) { Alert.alert("Error", "Could not delete lead"); } finally { setLoading(false); } };

  // --- LEAD DETAILS HANDLER ---
  const handleViewLead = async (lead: any) => {
    setCurrentLead(lead);
    setIsLeadDetailOpen(true);
    if (lead.wishlist && lead.wishlist.length > 0) {
       const items = await FragranceService.getByIds(lead.wishlist);
       setLeadWishlistItems(items);
    } else { setLeadWishlistItems([]); }
  };

  const getMetadataForQuestion = (q: any) => { const key = q.categoryMatch || q.id; if (key === 'personality') return { list: metadata.personalities, label: 'Personality Tag' }; if (key === 'occasion') return { list: metadata.occasions, label: 'Occasion Tag' }; if (key === 'notes') return { list: metadata.notes, label: 'Fragrance Note' }; if (key === 'gender') return { list: ['masculine', 'feminine', 'unisex'], label: 'Gender' }; if (key === 'intensity') return { list: ['light', 'medium', 'strong'], label: 'Intensity' }; return { list: [], label: 'Value' }; };
  const SelectionChip = ({ label, value, current, onSelect }: any) => ( <TouchableOpacity onPress={() => onSelect(value)} style={[styles.chip, current === value && styles.chipActive]}><Text style={[styles.chipText, current === value && styles.chipTextActive]}>{label}</Text></TouchableOpacity> );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Admin Manager</Text>
        {isSelectionMode ? (
          <TouchableOpacity onPress={handleBatchAction} style={styles.batchDeleteBtn}><Trash2 size={20} color="#FFF" /><Text style={{color: '#FFF', fontWeight:'bold', marginLeft: 5}}>{selectedIds.length}</Text></TouchableOpacity>
        ) : <View style={{width: 24}} />}
      </View>
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['inventory', 'analytics', 'parameters', 'quizzes', 'leads', 'settings'].map(t => (
             <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.activeTab]} onPress={() => setActiveTab(t as any)}><Text style={[styles.tabText, activeTab === t && styles.activeTabText, {textTransform:'capitalize'}]}>{t}</Text></TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {activeTab !== 'analytics' && activeTab !== 'settings' && (
        <View style={styles.searchContainer}>
          <Search size={20} color="#888" />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#888" value={adminSearch} onChangeText={setAdminSearch} />
          {adminSearch.length > 0 && <TouchableOpacity onPress={() => setAdminSearch('')}><X size={18} color="#888" /></TouchableOpacity>}
        </View>
      )}
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#FFF" /></View>
      ) : activeTab === 'inventory' ? (
        <FlatList 
          data={getFilteredInventory()}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity style={[styles.row, selectedIds.includes(item.id) && styles.selectedRow, item.inStock === false && {opacity: 0.6}]} onLongPress={() => toggleSelection(item.id)} onPress={() => isSelectionMode ? toggleSelection(item.id) : null}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
                {isSelectionMode && (selectedIds.includes(item.id) ? <CheckSquare size={20} color={ClientConfig.colors.secondary} /> : <Square size={20} color="#666" />)}
                <View><Text style={styles.rowTitle}>{item.name} {item.inStock === false && <Text style={{color:'red', fontSize:12}}> (OOS)</Text>}</Text><Text style={styles.rowSubtitle}>{item.vendor}</Text></View>
              </View>
              {!isSelectionMode && (
                <View style={styles.actionButtons}>
                   <Switch value={item.inStock !== false} onValueChange={() => handleToggleStock(item)} trackColor={{false: '#666', true: ClientConfig.colors.secondary}} style={{transform: [{scaleX: 0.7}, {scaleY: 0.7}]}} />
                  <TouchableOpacity onPress={() => handleViewProduct(item.id)} style={styles.iconBtn}><Eye size={18} color="#CCC" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}><Edit2 size={18} color={ClientConfig.colors.secondary} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}><Trash2 size={18} color="red" /></TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      ) : activeTab === 'analytics' ? (
        <ScrollView style={styles.paramScroll}><Text style={styles.infoText}>Performance Overview</Text><View style={{flexDirection:'row', gap:10, marginBottom:20}}><View style={styles.statCard}><Text style={styles.statValue}>{analytics?.totalLeads || 0}</Text><Text style={styles.statLabel}>Leads</Text></View><View style={styles.statCard}><Text style={styles.statValue}>{analytics?.totalInventory || 0}</Text><Text style={styles.statLabel}>Products</Text></View><View style={styles.statCard}><Text style={[styles.statValue, {color: analytics?.outOfStockCount > 0 ? 'red' : '#FFF'}]}>{analytics?.outOfStockCount || 0}</Text><Text style={styles.statLabel}>Out of Stock</Text></View></View><Text style={styles.sectionHeader}>Top Recommended</Text>{analytics?.topProducts?.map((p, i) => (<View key={i} style={styles.statRow}><Text style={{color:'#FFF', flex:1}}>{i+1}. {p.name}</Text><View style={{flexDirection:'row', alignItems:'center'}}><View style={{width: 100, height: 8, backgroundColor: '#444', borderRadius: 4, marginRight: 10}}><View style={{width: `${Math.min(p.count * 10, 100)}%`, height: '100%', backgroundColor: ClientConfig.colors.secondary, borderRadius: 4}} /></View><Text style={{color:'#CCC', width: 30, textAlign:'right'}}>{p.count}</Text></View></View>))}</ScrollView>
      ) : activeTab === 'settings' ? (
        <ScrollView style={styles.paramScroll}><Text style={styles.infoText}>App Configuration</Text><View style={styles.settingRow}><View><Text style={styles.settingTitle}>Collect User Info</Text><Text style={styles.settingDesc}>Require Name/Email before showing quiz results</Text></View><Switch value={settings.collectUserInfo} onValueChange={val => updateSetting('collectUserInfo', val)} trackColor={{false: '#666', true: ClientConfig.colors.secondary}} /></View><View style={styles.settingRow}><View style={{flex:1}}><Text style={styles.settingTitle}>Inactivity Timeout</Text><Text style={styles.settingDesc}>Reset app after user walks away</Text></View><Switch value={settings.timeoutEnabled} onValueChange={val => updateSetting('timeoutEnabled', val)} trackColor={{false: '#666', true: ClientConfig.colors.secondary}} /></View>{settings.timeoutEnabled && (<View style={styles.settingRow}><View style={{flex:1}}><View style={{flexDirection:'row', alignItems:'center', gap:8}}><Clock size={20} color="#AAA" /><Text style={styles.settingTitle}>Duration (Seconds)</Text></View></View><TextInput style={styles.settingInput} keyboardType="numeric" value={String(settings.timeoutSeconds || 60)} onChangeText={val => updateSetting('timeoutSeconds', parseInt(val) || 60)} /></View>)}<View style={styles.settingRow}><View style={{flex:1}}><View style={{flexDirection:'row', alignItems:'center', gap:8}}><Lock size={20} color="#AAA" /><Text style={styles.settingTitle}>Admin PIN Protection</Text></View><Text style={styles.settingDesc}>Require code to access dashboard</Text></View><Switch value={settings.pinEnabled} onValueChange={val => updateSetting('pinEnabled', val)} trackColor={{false: '#666', true: ClientConfig.colors.secondary}} /></View>{settings.pinEnabled && (<View style={styles.settingRow}><Text style={styles.settingTitle}>Change PIN Code</Text><TextInput style={styles.settingInput} keyboardType="numeric" maxLength={4} value={settings.adminPin} onChangeText={val => updateSetting('adminPin', val)} /></View>)}</ScrollView>
      ) : activeTab === 'parameters' ? (
        <View style={{flex: 1}}><View style={styles.paramTabs}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{padding: 15, gap: 10}}>{['vendors', 'notes', 'occasions', 'personalities'].map((cat: any) => (<SelectionChip key={cat} label={cat} value={cat} current={paramCategory} onSelect={setParamCategory} />))}</ScrollView></View><View style={styles.subHeader}><Text style={styles.sectionTitle}>{paramCategory} List</Text><TouchableOpacity onPress={() => setIsSelectionMode(!isSelectionMode)}><Text style={{color: isSelectionMode ? ClientConfig.colors.secondary : '#888'}}>{isSelectionMode ? 'Cancel' : 'Select Multiple'}</Text></TouchableOpacity></View><FlatList data={getFilteredParameters()} keyExtractor={item => item} contentContainerStyle={{paddingBottom: 80}} ListHeaderComponent={!isSelectionMode ? (<View style={styles.paramInputRow}><TextInput style={styles.paramInput} placeholder={`Add new ${paramCategory.slice(0,-1)}...`} value={newParamItem} onChangeText={setNewParamItem} /><TouchableOpacity onPress={handleAddParam} style={styles.paramAddBtn}><Plus size={20} color="#FFF" /></TouchableOpacity></View>) : null} renderItem={({item}) => (<TouchableOpacity style={[styles.row, selectedIds.includes(item) && styles.selectedRow]} onPress={() => isSelectionMode ? toggleSelection(item) : null}><View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>{isSelectionMode && (selectedIds.includes(item) ? <CheckSquare size={20} color={ClientConfig.colors.secondary} /> : <Square size={20} color="#666" />)}<Text style={styles.rowTitle}>{item}</Text></View>{!isSelectionMode && (<View style={{flexDirection: 'row'}}><TouchableOpacity onPress={() => handleEditParam(item)} style={styles.iconBtn}><Edit2 size={18} color={ClientConfig.colors.secondary} /></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteParam(item)} style={styles.deleteBtn}><Trash2 size={18} color="red" /></TouchableOpacity></View>)}</TouchableOpacity>)}/></View>
      ) : activeTab === 'quizzes' ? (
        <><View style={styles.subHeader}><Text style={styles.sectionTitle}>Quizzes ({getFilteredQuizzes().length})</Text><TouchableOpacity onPress={() => setIsSelectionMode(!isSelectionMode)}><Text style={{color: isSelectionMode ? ClientConfig.colors.secondary : '#888'}}>{isSelectionMode ? 'Cancel' : 'Select Multiple'}</Text></TouchableOpacity></View><FlatList data={getFilteredQuizzes()} keyExtractor={item => item.id} renderItem={({item}) => (<TouchableOpacity style={[styles.row, selectedIds.includes(item.id) && styles.selectedRow]} onPress={() => isSelectionMode ? toggleSelection(item.id) : null}><View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>{isSelectionMode && (selectedIds.includes(item.id) ? <CheckSquare size={20} color={ClientConfig.colors.secondary} /> : <Square size={20} color="#666" />)}<View style={{flex: 1}}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowSubtitle}>{item.questions ? item.questions.length : 0} Questions • {item.active ? 'Active' : 'Inactive'}</Text></View></View>{!isSelectionMode && (<View style={styles.actionButtons}><TouchableOpacity onPress={() => toggleQuizActive(item)} style={styles.iconBtn}><Power size={18} color={item.active ? '#4CAF50' : '#666'} /></TouchableOpacity><TouchableOpacity onPress={() => handleEditQuiz(item)} style={styles.iconBtn}><Edit2 size={18} color={ClientConfig.colors.secondary} /></TouchableOpacity><TouchableOpacity onPress={() => { if(Platform.OS==='web' ? confirm("Delete quiz?") : Alert.alert("Delete", "Delete quiz?", [{text:"Cancel"},{text:"Delete", style:'destructive', onPress:async ()=>{ await FragranceService.deleteQuiz(item.id); loadAllData(); }}])) { if(Platform.OS==='web') { FragranceService.deleteQuiz(item.id).then(loadAllData); } } }} style={styles.iconBtn}><Trash2 size={18} color="red" /></TouchableOpacity></View>)}</TouchableOpacity>)}/></>
      ) : (
        <FlatList 
            data={getFilteredLeads()}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TouchableOpacity 
                style={[styles.row, selectedIds.includes(item.id) && styles.selectedRow, {alignItems: 'flex-start'}]} 
                onLongPress={() => toggleSelection(item.id)} 
                onPress={() => isSelectionMode ? toggleSelection(item.id) : null}
              >
                <View style={{flexDirection: 'row', gap: 10, flex: 1}}>
                  {isSelectionMode && (
                    <View style={{marginTop: 4}}>
                      {selectedIds.includes(item.id) ? <CheckSquare size={20} color={ClientConfig.colors.secondary} /> : <Square size={20} color="#666" />}
                    </View>
                  )}
                  <View style={{flex: 1}}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom:4}}>
                      <User size={16} color="#FFF" style={{marginRight:6}} />
                      <Text style={styles.rowTitle}>{item.firstName} {item.lastName}</Text>
                    </View>
                    <View style={{marginLeft: 22}}>
                      <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                          <Mail size={12} color="#AAA" style={{marginRight:6}} />
                          <Text style={styles.rowSubtitle}>{item.email}</Text>
                      </View>
                      {item.phone && (
                          <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                              <Phone size={12} color="#AAA" style={{marginRight:6}} />
                              <Text style={styles.rowSubtitle}>{item.phone}</Text>
                          </View>
                      )}
                      <Text style={[styles.rowSubtitle, {color: ClientConfig.colors.secondary, marginTop:4}]}>Result: {item.quizResult}</Text>
                    </View>
                  </View>
                </View>
                {!isSelectionMode && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleViewLead(item)} style={styles.iconBtn}><Eye size={18} color="#CCC" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditLead(item)} style={styles.iconBtn}><Edit2 size={18} color={ClientConfig.colors.secondary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteLead(item.id)} style={styles.iconBtn}><Trash2 size={18} color="red" /></TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
      )}

      {/* MODALS */}
      <Modal visible={isParamEditModalOpen} animationType="fade" transparent><View style={styles.centerModalOverlay}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.centerModalContainer}><View style={styles.centerModalContent}><Text style={styles.modalTitle}>Edit Parameter</Text><TextInput style={[styles.input, {marginTop:15}]} value={editingParam?.current} onChangeText={t=>setEditingParam(p=>({...p, current:t}))} autoFocus /><View style={styles.modalButtons}><TouchableOpacity onPress={()=>setIsParamEditModalOpen(false)} style={[styles.btn, styles.cancelBtn]}><Text style={{color:'#333'}}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={saveParamEdit} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#FFF', fontWeight:'bold'}}>Update</Text></TouchableOpacity></View></View></KeyboardAvoidingView></View></Modal>
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.modal}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingId ? "Edit Fragrance" : "New Fragrance"}</Text><TouchableOpacity onPress={()=>confirmExit(()=>{setIsModalOpen(false);resetForm();})}><X size={24} color="#333" /></TouchableOpacity></View><ScrollView style={styles.formScroll} contentContainerStyle={{paddingBottom:80}}><Text style={styles.label}>Basic Info</Text><TextInput style={styles.input} placeholder="Name" value={newName} onChangeText={setNewName} /><SearchableMultiSelect label="Vendor" options={metadata.vendors} selected={newVendor} onSelectionChange={setNewVendor} onAddNew={v=>handleAddNewMeta('vendors',v)} single={true} /><Text style={styles.label}>Description</Text><TextInput style={[styles.input,{height:80}]} multiline value={newDescription} onChangeText={setNewDescription} />
      <Text style={styles.label}>Location</Text><View style={{flexDirection:'row', alignItems:'center', marginBottom:15}}><MapPin size={20} color="#666" style={{marginRight:10}} /><TextInput style={[styles.input, {marginBottom:0, flex:1}]} placeholder="e.g. Wall A, Shelf 2" value={newShelfLocation} onChangeText={setNewShelfLocation} /></View><View style={[styles.settingRow, {backgroundColor:'transparent', padding:0, marginVertical:5}]}><Text style={styles.label}>In Stock?</Text><Switch value={newInStock} onValueChange={setNewInStock} trackColor={{false: '#666', true: ClientConfig.colors.secondary}} /></View><Text style={styles.label}>Gender</Text><View style={styles.chipRow}>{['masculine','feminine','unisex'].map(g=><SelectionChip key={g} label={g} value={g} current={newGender} onSelect={setNewGender} />)}</View><Text style={styles.label}>Intensity</Text><View style={styles.chipRow}>{['light','medium','strong'].map(i=><SelectionChip key={i} label={i} value={i} current={newIntensity} onSelect={setNewIntensity} />)}</View><View style={styles.divider}/><Text style={styles.sectionHeader}>Pyramid</Text><SearchableMultiSelect label="Top" options={metadata.notes} selected={newNotesTop} onSelectionChange={setNewNotesTop} onAddNew={v=>handleAddNewMeta('notes',v)} /><SearchableMultiSelect label="Heart" options={metadata.notes} selected={newNotesHeart} onSelectionChange={setNewNotesHeart} onAddNew={v=>handleAddNewMeta('notes',v)} /><SearchableMultiSelect label="Base" options={metadata.notes} selected={newNotesBase} onSelectionChange={setNewNotesBase} onAddNew={v=>handleAddNewMeta('notes',v)} /><View style={styles.divider}/><Text style={styles.sectionHeader}>Tags</Text><SearchableMultiSelect label="Occasion" options={metadata.occasions} selected={newOccasion} onSelectionChange={setNewOccasion} onAddNew={v=>handleAddNewMeta('occasions',v)} /><SearchableMultiSelect label="Personality" options={metadata.personalities} selected={newPersonality} onSelectionChange={setNewPersonality} onAddNew={v=>handleAddNewMeta('personalities',v)} /><View style={styles.modalButtons}><TouchableOpacity onPress={()=>confirmExit(()=>{setIsModalOpen(false);resetForm()})} style={[styles.btn, styles.cancelBtn]}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={handleSave} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#FFF', fontWeight:'bold'}}>Save</Text></TouchableOpacity></View></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
      <Modal visible={isQuizListModalOpen} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.modal}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{currentQuiz?.id ? "Edit Quiz" : "New Quiz"}</Text><TouchableOpacity onPress={()=>confirmExit(()=>setIsQuizListModalOpen(false))}><X size={24} color="#333" /></TouchableOpacity></View><ScrollView style={styles.formScroll}><Text style={styles.label}>Quiz Title</Text><TextInput style={styles.input} value={currentQuiz?.title} onChangeText={t=>setCurrentQuiz({...currentQuiz, title: t})} placeholder="Title" /><Text style={styles.label}>Description</Text><TextInput style={styles.input} value={currentQuiz?.description} onChangeText={t=>setCurrentQuiz({...currentQuiz, description: t})} placeholder="Desc" /><View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical: 10}}><Text style={styles.label}>Questions ({currentQuiz?.questions?.length || 0})</Text><TouchableOpacity onPress={()=>setIsReordering(!isReordering)}><Text style={{color: isReordering ? 'blue' : '#666', fontWeight:'bold'}}>{isReordering ? 'Done Reordering' : 'Reorder'}</Text></TouchableOpacity></View>{currentQuiz?.questions?.map((q, index) => (<View key={index} style={styles.optionRow}><View style={{flex: 1}}><Text style={{fontWeight:'bold'}}>Q{index + 1}. {q.question}</Text><Text style={{fontSize: 12, color: '#666'}}>{q.type} • {q.options.length} options</Text></View>{isReordering ? (<View style={{flexDirection:'row'}}><TouchableOpacity onPress={() => moveQuestion(index, 'up')} style={{padding:5}}><ArrowUp size={20} color={index === 0 ? '#EEE' : '#333'} /></TouchableOpacity><TouchableOpacity onPress={() => moveQuestion(index, 'down')} style={{padding:5}}><ArrowDown size={20} color={index === currentQuiz?.questions?.length - 1 ? '#EEE' : '#333'} /></TouchableOpacity></View>) : (<View style={{flexDirection:'row'}}><TouchableOpacity onPress={() => handleEditQuestion(q, index)} style={{padding:5}}><Edit2 size={18} color={ClientConfig.colors.secondary} /></TouchableOpacity><TouchableOpacity onPress={() => deleteQuestionFromQuiz(index)} style={{padding:5}}><Trash2 size={18} color="red" /></TouchableOpacity></View>)}</View>))}<TouchableOpacity onPress={handleAddQuestion} style={[styles.btn, styles.saveBtn, {backgroundColor: '#444', marginTop: 10}]}><Plus size={18} color="#FFF" style={{marginRight:5}} /><Text style={{color:'#FFF'}}>Add Question</Text></TouchableOpacity><View style={{height: 100}} /></ScrollView><View style={[styles.modalButtons, {padding: 20, backgroundColor: '#FFF'}]}><TouchableOpacity onPress={()=>confirmExit(()=>setIsQuizListModalOpen(false))} style={[styles.btn, styles.cancelBtn]}><Text style={{color:'#333'}}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={handleSaveQuiz} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#FFF', fontWeight:'bold'}}>Save Quiz</Text></TouchableOpacity></View></KeyboardAvoidingView></SafeAreaView></Modal>
      <Modal visible={isQuestionModalOpen} animationType="slide"><SafeAreaView style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Edit Question</Text><TouchableOpacity onPress={()=>setIsQuestionModalOpen(false)}><X size={24} color="#333" /></TouchableOpacity></View><ScrollView style={styles.formScroll}>{editingQuestion && (<><Text style={styles.label}>Question Text</Text><TextInput style={styles.input} value={editingQuestion.question} onChangeText={t=>setEditingQuestion({...editingQuestion, question: t})} /><Text style={styles.label}>Type</Text><View style={styles.chipRow}>{['single', 'multiple'].map(t => (<SelectionChip key={t} label={t} value={t} current={editingQuestion.type} onSelect={v => setEditingQuestion({...editingQuestion, type: v})} />))}</View><Text style={styles.label}>Maps To Category</Text><View style={[styles.chipRow, {flexWrap:'wrap'}]}>{['personality', 'occasion', 'notes', 'gender', 'intensity'].map(c => (<SelectionChip key={c} label={c} value={c} current={editingQuestion.categoryMatch} onSelect={v => setEditingQuestion({...editingQuestion, categoryMatch: v})} />))}</View><View style={styles.divider} /><Text style={styles.sectionHeader}>Options</Text>{tempOptions.map((opt, idx) => (<View key={idx} style={styles.optionRow}><View style={{flex: 1}}><Text style={{fontWeight: 'bold'}}>{opt.label}</Text><Text style={{fontSize: 12, color: '#666'}}>Maps to: {opt.value}</Text></View><TouchableOpacity onPress={() => handleEditOption(idx)} style={{padding: 5}}><Edit2 size={18} color="#666" /></TouchableOpacity><TouchableOpacity onPress={() => handleRemoveOption(idx)} style={{padding: 5}}><Trash2 size={18} color="red" /></TouchableOpacity></View>))}<View style={styles.addOptionBox}><Text style={styles.label}>{editingOptionIndex !== null ? "Edit Option" : "Add Option"}</Text><SearchableMultiSelect label={`Select Matching ${getMetadataForQuestion(editingQuestion).label}`} options={getMetadataForQuestion(editingQuestion).list} selected={newOptionValue} onSelectionChange={setNewOptionValue} single={true} placeholder="Search tags..." /><Text style={styles.label}>Display Label</Text><TextInput style={styles.input} placeholder="e.g. 'I like to party'" value={newOptionLabel} onChangeText={setNewOptionLabel} /><View style={{flexDirection:'row', gap:10}}>{editingOptionIndex !== null && <TouchableOpacity onPress={handleCancelOptionEdit} style={[styles.btn, styles.cancelBtn]}><Text>Cancel</Text></TouchableOpacity>}<TouchableOpacity onPress={handleAddOption} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#FFF'}}>{editingOptionIndex !== null ? "Update" : "Add"}</Text></TouchableOpacity></View></View></>)}<View style={{height: 100}} /></ScrollView><View style={[styles.modalButtons, {padding: 20, backgroundColor: '#FFF'}]}><TouchableOpacity onPress={saveQuestionToQuiz} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#FFF', fontWeight:'bold'}}>Done</Text></TouchableOpacity></View></SafeAreaView></Modal>
      <Modal visible={isLeadModalOpen} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.modal}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{editingLeadId ? "Edit Lead" : "New Lead"}</Text><TouchableOpacity onPress={()=>confirmExit(()=>{setIsLeadModalOpen(false);})}><X size={24} color="#333" /></TouchableOpacity></View><ScrollView style={styles.formScroll}><Text style={styles.label}>First Name</Text><TextInput style={styles.input} value={leadForm.firstName} onChangeText={t=>setLeadForm({...leadForm, firstName: t})} /><Text style={styles.label}>Last Name</Text><TextInput style={styles.input} value={leadForm.lastName} onChangeText={t=>setLeadForm({...leadForm, lastName: t})} /><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={leadForm.email} onChangeText={t=>setLeadForm({...leadForm, email: t})} keyboardType="email-address" autoCapitalize="none" /><Text style={styles.label}>Phone</Text><TextInput style={styles.input} value={leadForm.phone} onChangeText={t=>setLeadForm({...leadForm, phone: t})} keyboardType="phone-pad" /><Text style={styles.label}>Quiz Result (Optional)</Text><TextInput style={styles.input} value={leadForm.quizResult} onChangeText={t=>setLeadForm({...leadForm, quizResult: t})} placeholder="e.g. Noir Elegance" /><TouchableOpacity onPress={saveLead} style={[styles.btn, styles.saveBtn, {marginTop: 20}]}><Text style={{color:'#FFF', fontWeight: 'bold'}}>{editingLeadId ? "Update Lead" : "Save Lead"}</Text></TouchableOpacity></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
      <Modal visible={isLeadDetailOpen} animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Client Profile</Text><TouchableOpacity onPress={() => setIsLeadDetailOpen(false)}><X size={24} color="#333" /></TouchableOpacity></View><ScrollView style={styles.formScroll}>{currentLead && (<><View style={{alignItems:'center', marginBottom:20}}><View style={{width:80, height:80, borderRadius:40, backgroundColor: ClientConfig.colors.secondary, justifyContent:'center', alignItems:'center', marginBottom:10}}><Text style={{fontSize:24, fontWeight:'bold', color:ClientConfig.colors.primary}}>{currentLead.firstName[0]}{currentLead.lastName[0]}</Text></View><Text style={{fontSize:22, fontWeight:'bold', color:'#333'}}>{currentLead.firstName} {currentLead.lastName}</Text><Text style={{fontSize:14, color:'#666'}}>{currentLead.email}</Text>{currentLead.phone && <Text style={{fontSize:14, color:'#666'}}>{currentLead.phone}</Text>}</View><View style={styles.divider} /><Text style={styles.sectionHeader}>Coupons</Text>{currentLead.coupons && currentLead.coupons.length > 0 ? currentLead.coupons.map((c, i) => (<View key={i} style={{flexDirection:'row', justifyContent:'space-between', backgroundColor:'#EFEFEF', padding:15, borderRadius:8, marginBottom:8}}><View style={{flexDirection:'row', gap:10, alignItems:'center'}}><Ticket size={20} color={ClientConfig.colors.secondary} /><View><Text style={{fontWeight:'bold'}}>{c.code}</Text><Text style={{fontSize:12, color:'#666'}}>Expires: {c.expiryDate}</Text></View></View><Text style={{fontWeight:'bold', color:'green', textTransform:'uppercase'}}>{c.status}</Text></View>)) : <Text style={{color:'#999', fontStyle:'italic'}}>No coupons available.</Text>}<View style={styles.divider} /><Text style={styles.sectionHeader}>Favorites</Text>{leadWishlistItems.length > 0 ? leadWishlistItems.map((item, i) => (<View key={i} style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderBottomColor:'#EEE', paddingVertical:10}}><View><Text style={{fontWeight:'bold'}}>{item.name}</Text><Text style={{fontSize:12, color:'#666'}}>{item.vendor}</Text></View><Heart size={18} color="red" fill="red" /></View>)) : <Text style={{color:'#999', fontStyle:'italic'}}>No favorites saved.</Text>}<View style={{height: 50}} /></>)}</ScrollView></SafeAreaView></Modal>
      
      {(activeTab === 'inventory' || activeTab === 'quizzes' || activeTab === 'leads') && (
        <TouchableOpacity style={styles.fab} onPress={() => { 
          if (activeTab === 'inventory') { resetForm(); setIsModalOpen(true); } 
          else if (activeTab === 'quizzes') { handleCreateQuiz(); }
          else if (activeTab === 'leads') { handleAddLead(); }
        }}>
             <Plus size={30} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222' },
  tabs: { flexDirection: 'row', backgroundColor: '#222' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent', minWidth: 100 },
  activeTab: { borderBottomColor: ClientConfig.colors.secondary },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#FFF' },
  paramTabs: { backgroundColor: '#444' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#333' },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { color: '#CCC', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#444', backgroundColor: '#333' },
  selectedRow: { backgroundColor: '#444' },
  rowTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  rowSubtitle: { color: '#AAA', fontSize: 12 },
  batchDeleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'red', padding: 8, borderRadius: 8 },
  actionButtons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#444', margin: 20, marginBottom: 0, paddingHorizontal: 15, borderRadius: 10, height: 45 },
  searchInput: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 16 },
  paramScroll: { padding: 20 },
  infoText: { color: '#AAA', marginBottom: 20 },
  paramInputRow: { flexDirection: 'row', gap: 10, margin: 20 },
  paramInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 8, padding: 10 },
  paramAddBtn: { backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center', width: 44, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formScroll: { padding: 20 },
  label: { marginBottom: 8, fontWeight: 'bold', color: '#555', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 15, borderRadius: 8, backgroundColor: '#FFF', fontSize: 16, marginBottom: 15 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CCC', backgroundColor: '#FFF' },
  chipActive: { backgroundColor: ClientConfig.colors.secondary, borderColor: ClientConfig.colors.secondary },
  chipText: { color: '#555', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginVertical: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtn: { backgroundColor: ClientConfig.colors.secondary },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: ClientConfig.colors.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  addOptionBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { backgroundColor: '#EEE' },
  deleteBtn: { padding: 8 },
  editBtn: { padding: 8 },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  centerModalContainer: { width: '90%', maxWidth: 400 },
  centerModalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#333', padding: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#444' },
  settingTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  settingDesc: { color: '#AAA', fontSize: 12, marginTop: 4 },
  settingInput: { backgroundColor: '#444', color: '#FFF', width: 80, padding: 10, borderRadius: 8, textAlign: 'center' },
  
  // Stats
  statCard: { flex: 1, backgroundColor: '#444', borderRadius: 12, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 12, color: '#AAA', marginTop: 5 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#444' }
});