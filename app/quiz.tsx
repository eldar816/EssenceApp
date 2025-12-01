// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, FlatList, TextInput, Modal, Alert } from 'react-native';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ClientConfig } from '@/constants/ClientConfig';
import { FragranceService, SettingsService, LeadsService } from '@/services/Database';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activeQuizzes, setActiveQuizzes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ collectUserInfo: false });
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [errors, setErrors] = useState<any>({}); 
  
  // Parse session user if it exists
  const [sessionUser, setSessionUser] = useState(params.user ? JSON.parse(params.user) : null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const [active, config] = await Promise.all([
          FragranceService.getActiveQuizzes(),
          SettingsService.getSettings()
        ]);
        setActiveQuizzes(active);
        setSettings(config);
        
        if (params.quizId) {
            const quiz = active.find(q => q.id === params.quizId);
            if (quiz) handleStartQuiz(quiz);
        } else if (active.length === 1 && active[0].questions && active[0].questions.length > 0) {
            handleStartQuiz(active[0]);
        }
      } catch (error) {
        console.log("Error loading quiz data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStartQuiz = (quiz: any) => {
    if (!quiz.questions || quiz.questions.length === 0) return;
    setCurrentQuiz(quiz);
    setQuizAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (value: string) => {
    const question = currentQuiz.questions[currentQuestionIndex];
    let newAnswers = { ...quizAnswers };

    if (question.type === 'single') {
      newAnswers[question.id] = value;
      setTimeout(() => nextStep(newAnswers), 200);
    } else {
      const current = newAnswers[question.id] || [];
      const updated = current.includes(value) ? current.filter((v: string) => v !== value) : [...current, value];
      newAnswers[question.id] = updated;
    }
    setQuizAnswers(newAnswers);
  };

  const nextStep = (answersState = quizAnswers) => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz Finished
      // If info collection ON and NO session, show form
      if (settings.collectUserInfo && !sessionUser) {
        setShowContactForm(true);
      } else {
        // If session exists (or collection off), finish immediately
        finishQuiz(answersState, sessionUser);
      }
    }
  };

  // --- VALIDATION ---
  const validateName = (name: string, fieldLabel: string) => {
    if (!name || !name.trim()) return `${fieldLabel} is required.`;
    if (name.length > 25) return `${fieldLabel} is too long (max 25 chars).`;
    const lettersOnly = /^[a-zA-Z\s]+$/;
    if (!lettersOnly.test(name)) return `${fieldLabel} should contain letters only.`;
    return null;
  };
  const validateEmail = (email: string) => { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email) ? null : "Please enter a valid email address."; };
  const validatePhoneUS = (phone: string) => { const re = /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/; return re.test(phone) ? null : "Invalid US phone format."; };

  const submitContactForm = async () => {
    const newErrors: any = {};
    let isValid = true;
    const fNameError = validateName(contactInfo.firstName, "First Name");
    if (fNameError) { newErrors.firstName = fNameError; isValid = false; }
    const lNameError = validateName(contactInfo.lastName, "Last Name");
    if (lNameError) { newErrors.lastName = lNameError; isValid = false; }
    if (!contactInfo.email) { newErrors.email = "Email is required."; isValid = false; } 
    else { const emailError = validateEmail(contactInfo.email); if (emailError) { newErrors.email = emailError; isValid = false; } }
    if (contactInfo.phone) { const phoneError = validatePhoneUS(contactInfo.phone); if (phoneError) { newErrors.phone = phoneError; isValid = false; } }

    setErrors(newErrors);
    if (!isValid) return;

    setIsCalculating(true);
    
    try {
      const leadData = { 
        firstName: contactInfo.firstName.trim(), 
        lastName: contactInfo.lastName.trim(), 
        email: contactInfo.email.trim(), 
        phone: contactInfo.phone.trim() 
      };
      
      // Correctly call identify from LeadsService
      const user = await LeadsService.identify(leadData); 

      finishQuiz(quizAnswers, user);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save information. Please try again.");
      setIsCalculating(false);
    }
  };

  const finishQuiz = async (finalAnswers: any, finalUser: any | null = null) => {
    setIsCalculating(true);
    const recommendations = await FragranceService.getRecommendations(finalAnswers);
    setIsCalculating(false);
    
    router.push({
      pathname: "/results",
      params: { 
          data: JSON.stringify(recommendations),
          user: finalUser && finalUser.id ? JSON.stringify(finalUser) : null
      }
    });
  };

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={ClientConfig.colors.secondary} /></View>;

  // Selection Screen (If Multiple)
  if (!currentQuiz && activeQuizzes.length > 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={ClientConfig.colors.accent} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Select a Quiz</Text>
            <View style={{width:24}}/>
          </View>
          <FlatList
            data={activeQuizzes}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 20}}
            renderItem={({item}) => {
              const isAvailable = item.questions && item.questions.length > 0;
              return (
                <TouchableOpacity 
                  style={[styles.quizCard, !isAvailable && styles.quizCardDisabled]} 
                  onPress={() => isAvailable ? handleStartQuiz(item) : null}
                  activeOpacity={isAvailable ? 0.7 : 1}
                >
                  <View style={{flex: 1}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 5}}>
                        <Text style={[styles.quizTitle, !isAvailable && {color:'#888', marginBottom:0}]}>{item.title}</Text>
                        {!isAvailable && <View style={styles.unavailableBadge}><Text style={styles.unavailableText}>UNAVAILABLE</Text></View>}
                    </View>
                    <Text style={styles.quizDesc}>{item.description || "No description"}</Text>
                    <Text style={styles.quizMeta}>{item.questions ? item.questions.length : 0} Questions</Text>
                  </View>
                  {isAvailable && <ArrowLeft size={20} color={ClientConfig.colors.secondary} style={{transform:[{rotate:'180deg'}]}} />}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Contact Form
  if (showContactForm) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{flex:1, padding: 20, justifyContent: 'center'}}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Almost There!</Text>
            <Text style={styles.formDesc}>Enter your details to see your personalized scent recommendation.</Text>
            
            <View>
              <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder="First Name" value={contactInfo.firstName} onChangeText={t => { setContactInfo({...contactInfo, firstName: t}); setErrors({...errors, firstName: null}); }} maxLength={25} />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            <View>
              <TextInput style={[styles.input, errors.lastName && styles.inputError]} placeholder="Last Name" value={contactInfo.lastName} onChangeText={t => { setContactInfo({...contactInfo, lastName: t}); setErrors({...errors, lastName: null}); }} maxLength={25} />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
            <View>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email Address" value={contactInfo.email} keyboardType="email-address" autoCapitalize="none" onChangeText={t => { setContactInfo({...contactInfo, email: t}); setErrors({...errors, email: null}); }} />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            <View>
              <TextInput style={[styles.input, errors.phone && styles.inputError]} placeholder="Phone Number (Optional)" value={contactInfo.phone} keyboardType="phone-pad" onChangeText={t => { setContactInfo({...contactInfo, phone: t}); setErrors({...errors, phone: null}); }} />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <TouchableOpacity onPress={submitContactForm} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>See My Results</Text>
            </TouchableOpacity>
            
            {/* Back Button */}
            <TouchableOpacity onPress={() => setShowContactForm(false)} style={{marginTop: 15, alignItems: 'center'}}>
               <Text style={{color: '#666'}}>Back to Quiz</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {isCalculating && (
          <View style={[styles.center, {position:'absolute', top:0, bottom:0, left:0, right:0, backgroundColor:'rgba(0,0,0,0.7)'}]}>
             <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
      </View>
    );
  }

  if (!currentQuiz) return <View style={[styles.container, styles.center]}><Text style={{color:'#FFF'}}>No active quiz.</Text></View>;

  if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
        <View style={[styles.container, {justifyContent:'center', alignItems:'center', padding: 20}]}>
          <Text style={{color:'#FFF', fontSize: 18, marginBottom: 10, textAlign:'center'}}>This quiz is under construction.</Text>
          <TouchableOpacity onPress={() => {
             if (activeQuizzes.length > 1) setCurrentQuiz(null);
             else router.back();
          }} style={{padding:10, backgroundColor:ClientConfig.colors.secondary, borderRadius:8}}>
              <Text style={{color:'#FFF'}}>Go Back</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const question = currentQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (activeQuizzes.length > 1) setCurrentQuiz(null); else router.back(); }}>
            <ArrowLeft size={24} color={ClientConfig.colors.accent} />
          </TouchableOpacity>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress}%` }]} /></View>
        </View>
        <View style={styles.quizContent}>
          <Text style={styles.questionText}>{question.question}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {question.options.map((option: any) => {
              const isSelected = question.type === 'multiple' ? (quizAnswers[question.id] || []).includes(option.value) : quizAnswers[question.id] === option.value;
              return (
                <TouchableOpacity key={option.value} style={[styles.optionButton, isSelected && styles.optionSelected]} onPress={() => handleAnswer(option.value)}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                  {isSelected && <CheckCircle size={20} color={ClientConfig.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {question.type === 'multiple' && (quizAnswers[question.id] || []).length > 0 && (
            <TouchableOpacity style={styles.continueButton} onPress={() => nextStep()}><Text style={styles.continueButtonText}>Continue</Text></TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ClientConfig.colors.primary },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: ClientConfig.colors.accent },
  progressBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(240, 230, 210, 0.2)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: ClientConfig.colors.secondary, borderRadius: 3 },
  quizContent: { flex: 1, padding: 24 },
  questionText: { fontSize: 28, color: ClientConfig.colors.accent, fontWeight: 'bold', marginBottom: 30 },
  optionButton: { backgroundColor: ClientConfig.colors.accent, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionSelected: { backgroundColor: ClientConfig.colors.secondary },
  optionText: { fontSize: 18, color: ClientConfig.colors.primary, fontWeight: '500' },
  optionTextSelected: { fontWeight: 'bold', color: ClientConfig.colors.primary },
  continueButton: { backgroundColor: ClientConfig.colors.secondary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  continueButtonText: { color: ClientConfig.colors.primary, fontWeight: 'bold', fontSize: 18 },
  quizCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizCardDisabled: { backgroundColor: '#E0E0E0', opacity: 0.8 },
  quizTitle: { fontSize: 18, fontWeight: 'bold', color: ClientConfig.colors.primary, marginBottom: 5 },
  quizDesc: { fontSize: 14, color: '#666', marginBottom: 8 },
  quizMeta: { fontSize: 12, color: ClientConfig.colors.secondary, fontWeight: 'bold' },
  unavailableBadge: { backgroundColor: '#666', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 10 },
  unavailableText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  // Contact Form
  formCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 20 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: ClientConfig.colors.primary, marginBottom: 10, textAlign: 'center' },
  formDesc: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  inputError: { borderColor: 'red', borderWidth: 1 },
  errorText: { color: 'red', fontSize: 12, marginTop: -12, marginBottom: 15, marginLeft: 5 },
  submitBtn: { backgroundColor: ClientConfig.colors.secondary, padding: 15, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});