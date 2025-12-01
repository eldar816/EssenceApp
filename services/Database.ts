// @ts-nocheck
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';

// --- INTERFACES ---
export interface Fragrance {
  id: string;
  name: string;
  vendor: string;
  gender: 'masculine' | 'feminine' | 'unisex';
  occasion: string[];
  notes: { top: string[]; heart: string[]; base: string[]; };
  description: string;
  personality: string[];
  intensity: 'light' | 'medium' | 'strong';
  image?: string;
  inStock?: boolean;
  shelfLocation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: any[];
  categoryMatch: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  active: boolean;
  questions: QuizQuestion[];
}

export interface Coupon {
  code: string;
  discount: string;
  expiryDate: string;
  status: 'active' | 'redeemed' | 'expired';
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  quizResult: string; 
  timestamp: any;
  wishlist?: string[]; 
  coupons?: Coupon[]; 
}

const COLLECTION_FRAGRANCES = 'fragrances';
const COLLECTION_METADATA = 'metadata';
const COLLECTION_QUIZZES = 'quizzes';
const COLLECTION_SETTINGS = 'settings';
const COLLECTION_LEADS = 'leads';

// --- GLOBAL SESSION STORE ---
export const SessionStore = {
  user: null as Lead | null,
  listeners: [] as Function[],
  
  // Set user and notify all listening components
  setUser: (u: Lead | null) => {
    SessionStore.user = u;
    SessionStore.listeners.forEach(l => l(u));
  },
  
  // Get current user
  getUser: () => SessionStore.user,
  
  // Components subscribe to changes here
  subscribe: (cb: Function) => {
    SessionStore.listeners.push(cb);
    return () => { SessionStore.listeners = SessionStore.listeners.filter(l => l !== cb); }
  }
};

// --- STARTER DATA (FULL) ---
const STARTER_INVENTORY = [
  {
    name: "Noir Elegance",
    vendor: "Maison de Luxe",
    gender: "unisex",
    occasion: ["Evening", "Formal"],
    notes: { top: ["Bergamot", "Black Pepper"], heart: ["Jasmine", "Saffron"], base: ["Sandalwood", "Oud"] },
    description: "A mysterious and captivating scent that tells the story of a moonlit walk through a secret garden. It opens with a spark of spice and settles into a warm, woody embrace.",
    personality: ["Sophisticated", "Confident"],
    intensity: "strong",
    inStock: true,
    shelfLocation: "Wall A, Shelf 2"
  },
  {
    name: "Citrus Dawn",
    vendor: "Fresh & Co",
    gender: "unisex",
    occasion: ["Daily", "Casual"],
    notes: { top: ["Lemon", "Lime"], heart: ["Mint", "Ginger"], base: ["Cedar", "Musk"] },
    description: "Like the first rays of sunlight hitting the coast. Crisp, refreshing, and endlessly optimistic. Perfect for starting your day with energy.",
    personality: ["Energetic", "Fresh"],
    intensity: "light",
    inStock: true,
    shelfLocation: "Island 3, Row 1"
  },
  {
    name: "Velvet Rose",
    vendor: "Parfums Elite",
    gender: "feminine",
    occasion: ["Romantic", "Evening"],
    notes: { top: ["Red Currant"], heart: ["Rose", "Peony"], base: ["Amber", "Praline"] },
    description: "An ode to modern romance. Soft petals meet the warmth of amber in a scent that is both delicate and deeply lingering.",
    personality: ["Romantic", "Elegant"],
    intensity: "medium",
    inStock: true,
    shelfLocation: "Wall B, Shelf 1"
  },
  {
    name: "Urban Woods",
    vendor: "Modern Scent",
    gender: "masculine",
    occasion: ["Daily", "Business"],
    notes: { top: ["Pine", "Grapefruit"], heart: ["Vetiver"], base: ["Leather", "Tobacco"] },
    description: "Grounded and professional, yet undeniably wild at heart. It captures the essence of a forest in the middle of the city.",
    personality: ["Professional", "Grounded"],
    intensity: "medium",
    inStock: true,
    shelfLocation: "Wall C, Shelf 4"
  },
  {
    name: "Coastal Breeze",
    vendor: "Aqua Essence",
    gender: "unisex",
    occasion: ["Daily", "Sport"],
    notes: { top: ["Sea Salt"], heart: ["Sage"], base: ["Driftwood"] },
    description: "Clean, aquatic, and free-spirited. This scent brings the salty air of the ocean directly to your skin.",
    personality: ["Adventurous", "Fresh"],
    intensity: "light",
    inStock: true,
    shelfLocation: "Island 2, Row 2"
  },
  {
    name: "Midnight Oud",
    vendor: "Oriental Luxe",
    gender: "unisex",
    occasion: ["Evening", "Formal"],
    notes: { top: ["Incense"], heart: ["Oud", "Leather"], base: ["Amber"] },
    description: "Bold, intense, and unapologetically luxurious. A scent for those who command the room and leave a lasting impression.",
    personality: ["Bold", "Mysterious"],
    intensity: "strong",
    inStock: true,
    shelfLocation: "Wall A, Shelf 5"
  }
];

const DEFAULT_METADATA = {
  vendors: ['Louis Vuitton', 'Dior', 'Chanel', 'Tom Ford', 'Lattafa', 'Maison de Luxe', 'Modern Scent', 'Aqua Essence', 'Oriental Luxe'],
  notes: ['Bergamot', 'Oud', 'Rose', 'Jasmine', 'Amber', 'Musk', 'Vanilla', 'Sandalwood', 'Lemon', 'Leather', 'Pine', 'Sea Salt'],
  occasions: ['Daily', 'Evening', 'Date Night', 'Office', 'Party', 'Summer', 'Formal', 'Casual', 'Sport'],
  personalities: ['Bold', 'Fresh', 'Elegant', 'Sophisticated', 'Mysterious', 'Playful', 'Professional', 'Adventurous']
};

const DEFAULT_QUIZ_DOC = {
  title: "Find Your Signature Scent",
  description: "A quick quiz to find your perfect match.",
  active: true,
  questions: [
    {
      id: 'personality',
      categoryMatch: 'personality',
      question: "How would you describe yourself?",
      type: 'multiple',
      options: [
        { value: 'Sophisticated', label: 'Sophisticated & Elegant' },
        { value: 'Bold', label: 'Bold & Confident' },
        { value: 'Romantic', label: 'Romantic & Charming' },
        { value: 'Fresh', label: 'Fresh & Energetic' },
        { value: 'Professional', label: 'Professional & Grounded' },
        { value: 'Adventurous', label: 'Adventurous & Free-spirited' },
        { value: 'Mysterious', label: 'Mysterious & Intriguing' }
      ]
    },
    {
      id: 'occasion',
      categoryMatch: 'occasion',
      question: "When will you wear this fragrance?",
      type: 'multiple',
      options: [
        { value: 'Daily', label: 'Daily wear' },
        { value: 'Business', label: 'Business/Professional' },
        { value: 'Evening', label: 'Evening events' },
        { value: 'Romantic', label: 'Romantic occasions' },
      ]
    },
    {
      id: 'intensity',
      categoryMatch: 'intensity',
      question: "How strong do you like your fragrance?",
      type: 'single',
      options: [
        { value: 'light', label: 'Light & Subtle' },
        { value: 'medium', label: 'Moderate presence' },
        { value: 'strong', label: 'Bold & Long-lasting' }
      ]
    }
  ]
};

// --- SERVICES ---

export const MetadataService = {
  getAll: async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTION_METADATA));
      const data: any = {};
      if (snap.empty) {
        await MetadataService.seed();
        return DEFAULT_METADATA;
      }
      snap.docs.forEach(doc => {
        data[doc.id] = doc.data().values || [];
      });
      return data;
    } catch (e) {
      return DEFAULT_METADATA;
    }
  },

  addItem: async (category: string, item: string) => {
    const docRef = doc(db, COLLECTION_METADATA, category);
    const snap = await getDoc(docRef);
    let values = [];
    if (snap.exists()) {
      values = snap.data().values || [];
    }
    if (!values.includes(item)) {
      values.push(item);
      values.sort();
      await setDoc(docRef, { values }, { merge: true });
    }
    return values;
  },

  removeItem: async (category: string, item: string) => {
    const docRef = doc(db, COLLECTION_METADATA, category);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      let values = snap.data().values || [];
      values = values.filter((v: string) => v !== item);
      await updateDoc(docRef, { values });
      return values;
    }
    return [];
  },

  seed: async () => {
    for (const [key, values] of Object.entries(DEFAULT_METADATA)) {
      await setDoc(doc(db, COLLECTION_METADATA, key), { values });
    }
  }
};

export const FragranceService = {
  getAll: async (): Promise<Fragrance[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_FRAGRANCES));
      if (querySnapshot.empty) {
        await FragranceService.seedInventory();
        return [];
      }
      return querySnapshot.docs.map(doc => ({ inStock: true, shelfLocation: '', ...doc.data(), id: doc.id } as Fragrance));
    } catch (e) { return []; }
  },
  
  getById: async (id: string): Promise<Fragrance | null> => {
    try {
      if (!id) return null;
      const docRef = doc(db, COLLECTION_FRAGRANCES, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ inStock: true, shelfLocation: '', ...docSnap.data(), id: docSnap.id } as Fragrance) : null;
    } catch (e) { return null; }
  },
  
  getByIds: async (ids: string[]): Promise<Fragrance[]> => {
    if (!ids || ids.length === 0) return [];
    const all = await FragranceService.getAll();
    return all.filter(f => ids.includes(f.id));
  },

  search: async (queryText: string, activeFilters: any): Promise<Fragrance[]> => {
    const allItems = await FragranceService.getAll();
    let results = allItems;

    if (queryText) {
      const lowerQ = queryText.toLowerCase();
      results = results.filter(f => f.name.toLowerCase().includes(lowerQ) || f.vendor.toLowerCase().includes(lowerQ));
    }

    if (activeFilters.gender?.length > 0) results = results.filter(f => activeFilters.gender.includes(f.gender));
    if (activeFilters.vendor?.length > 0) results = results.filter(f => activeFilters.vendor.includes(f.vendor));
    if (activeFilters.occasion?.length > 0) results = results.filter(f => f.occasion.some(o => activeFilters.occasion.includes(o)));
    if (activeFilters.notes?.length > 0) {
      const getNotes = (f: Fragrance) => {
         if(!f.notes) return [];
         if (Array.isArray(f.notes)) return f.notes;
         return [...(f.notes.top||[]), ...(f.notes.heart||[]), ...(f.notes.base||[])];
      };
      results = results.filter(f => getNotes(f).some(n => activeFilters.notes.includes(n)));
    }
    return results;
  },

  getFilterOptions: async () => {
    const meta = await MetadataService.getAll();
    return {
      genders: ['masculine', 'feminine', 'unisex'],
      vendors: meta.vendors || [],
      occasions: meta.occasions || [],
      notes: meta.notes || []
    };
  },

  addFragrance: async (fragrance: Omit<Fragrance, 'id'>) => {
    const docRef = await addDoc(collection(db, COLLECTION_FRAGRANCES), fragrance);
    return { id: docRef.id, ...fragrance };
  },
  deleteFragrance: async (id: string) => { await deleteDoc(doc(db, COLLECTION_FRAGRANCES, id)); },
  deleteFragrances: async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => { batch.delete(doc(db, COLLECTION_FRAGRANCES, id)); });
    await batch.commit();
  },
  updateFragrance: async (id: string, updates: Partial<Fragrance>) => {
    const docRef = doc(db, COLLECTION_FRAGRANCES, id);
    await updateDoc(docRef, updates);
  },
  seedInventory: async () => {
    const batch = writeBatch(db);
    STARTER_INVENTORY.forEach(item => {
      const docRef = doc(collection(db, COLLECTION_FRAGRANCES));
      batch.set(docRef, item);
    });
    await batch.commit();
  },

  // --- QUIZ METHODS ---
  getQuizzes: async (): Promise<Quiz[]> => {
    try {
      const snap = await getDocs(collection(db, COLLECTION_QUIZZES));
      if (snap.empty) {
        await addDoc(collection(db, COLLECTION_QUIZZES), DEFAULT_QUIZ_DOC);
        return []; // Return empty to trigger re-fetch in UI if needed
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
    } catch (e) { return []; }
  },
  getActiveQuizzes: async (): Promise<Quiz[]> => {
    try {
      const all = await FragranceService.getQuizzes();
      return all.filter(q => q.active);
    } catch (e) { return []; }
  },
  saveQuiz: async (quiz: Partial<Quiz>) => {
    if (quiz.id) {
      const docRef = doc(db, COLLECTION_QUIZZES, quiz.id);
      await updateDoc(docRef, { title: quiz.title, description: quiz.description, active: quiz.active, questions: quiz.questions });
    } else { await addDoc(collection(db, COLLECTION_QUIZZES), quiz); }
  },
  deleteQuiz: async (id: string) => { await deleteDoc(doc(db, COLLECTION_QUIZZES, id)); },
  deleteQuizzes: async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => { batch.delete(doc(db, COLLECTION_QUIZZES, id)); });
    await batch.commit();
  },
  getRecommendations: async (answers: any) => {
    const allItems = await FragranceService.getAll();
    const availableItems = allItems.filter(f => f.inStock !== false);
    let scored = availableItems.map(fragrance => {
      let score = 0;
      if (answers.personality && fragrance.personality) {
        const matches = answers.personality.filter((p: string) => fragrance.personality.includes(p)).length;
        score += matches * 3;
      }
      if (answers.occasion && fragrance.occasion) {
        const matches = answers.occasion.filter((o: string) => fragrance.occasion.includes(o)).length;
        score += matches * 2;
      }
      if (answers.intensity && fragrance.intensity === answers.intensity) score += 2;
      return { ...fragrance, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }
};

export const SettingsService = {
  getSettings: async () => {
    try {
      const docRef = doc(db, COLLECTION_SETTINGS, 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data();
      return { collectUserInfo: false, timeoutEnabled: true, timeoutSeconds: 60, pinEnabled: false, adminPin: '1234' };
    } catch (e) { return { collectUserInfo: false, timeoutEnabled: true, timeoutSeconds: 60, pinEnabled: false, adminPin: '1234' }; }
  },
  updateSettings: async (settings: any) => {
    const docRef = doc(db, COLLECTION_SETTINGS, 'global');
    await setDoc(docRef, settings, { merge: true });
  },
};

export const LeadsService = {
  checkExists: async (email: string) => {
    const q = query(collection(db, COLLECTION_LEADS), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  login: async (email: string) => {
    const q = query(collection(db, COLLECTION_LEADS), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() };
      await updateDoc(doc(db, COLLECTION_LEADS, userDoc.id), { timestamp: new Date() });
      SessionStore.setUser(userData);
      return userData;
    }
    return null;
  },

  saveLead: async (lead: Omit<Lead, 'id'>) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const expiryStr = expiry.toISOString().split('T')[0]; 
    const newCoupon = {
        code: 'WELCOME' + Math.floor(Math.random() * 1000),
        discount: '10% OFF',
        expiryDate: expiryStr,
        status: 'active'
    };
    const leadData = { ...lead, timestamp: new Date(), wishlist: [], coupons: [newCoupon] };
    const docRef = await addDoc(collection(db, COLLECTION_LEADS), leadData);
    const fullUser = { id: docRef.id, ...leadData };
    SessionStore.setUser(fullUser);
    return fullUser;
  },
  
  getLeads: async () => {
    const snap = await getDocs(collection(db, COLLECTION_LEADS));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  updateLead: async (id: string, data: Partial<Lead>) => {
    const docRef = doc(db, COLLECTION_LEADS, id);
    await updateDoc(docRef, data);
  },
  deleteLead: async (id: string) => { await deleteDoc(doc(db, COLLECTION_LEADS, id)); },
  deleteLeads: async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => { batch.delete(doc(db, COLLECTION_LEADS, id)); });
    await batch.commit();
  },
  toggleWishlist: async (leadId: string, fragranceId: string, currentWishlist: string[]) => {
    const docRef = doc(db, COLLECTION_LEADS, leadId);
    let newWishlist = [];
    if (currentWishlist.includes(fragranceId)) {
      await updateDoc(docRef, { wishlist: arrayRemove(fragranceId) });
      newWishlist = currentWishlist.filter(id => id !== fragranceId);
    } else {
      await updateDoc(docRef, { wishlist: arrayUnion(fragranceId) });
      newWishlist = [...currentWishlist, fragranceId];
    }
    const currentUser = SessionStore.getUser();
    if (currentUser && currentUser.id === leadId) {
        SessionStore.setUser({ ...currentUser, wishlist: newWishlist });
    }
    return newWishlist;
  },
  identify: async (info: any) => {
     const exists = await LeadsService.checkExists(info.email);
     if(exists) return await LeadsService.login(info.email);
     return await LeadsService.saveLead(info);
  }
};

export const AnalyticsService = {
  getStats: async () => {
    const [leads, inventory, quizzes] = await Promise.all([
        LeadsService.getLeads(),
        FragranceService.getAll(),
        FragranceService.getActiveQuizzes()
    ]);
    const productCounts: any = {};
    leads.forEach(l => { if(l.quizResult) productCounts[l.quizResult] = (productCounts[l.quizResult] || 0) + 1; });
    const topProducts = Object.entries(productCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const outOfStockCount = inventory.filter(i => i.inStock === false).length;
    return { totalLeads: leads.length, totalInventory: inventory.length, activeQuizzes: quizzes.length, outOfStockCount, topProducts };
  }
};