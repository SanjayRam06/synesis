/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  Timestamp, 
  getDocs,
  limit,
  writeBatch,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { subDays, isAfter } from 'date-fns';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Insights from './components/Insights';
import Chat from './components/Chat';
import UploadStatement from './components/UploadStatement';
import UPILink from './components/UPILink';
import Login from './components/Login';
import { Transaction, UserProfile } from './types';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');

  const [insightsData, setInsightsData] = useState({
    insights: ["Upload a statement to get AI insights", "Connect UPI for real-time tracking"],
    prediction: "Add data to see future spending trends",
    healthScore: 0
  });

  useEffect(() => {
    if (userProfile?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile?.darkMode]);

  const toggleDarkMode = async () => {
    if (!user) return;
    const newMode = !userProfile?.darkMode;
    await setDoc(doc(db, 'users', user.uid), { darkMode: newMode }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, darkMode: newMode } : null);
  };

  const toggleEmailNotifications = async () => {
    if (!user) return;
    const newMode = !userProfile?.emailNotifications;
    await setDoc(doc(db, 'users', user.uid), { emailNotifications: newMode }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, emailNotifications: newMode } : null);
  };

  const clearAllTransactions = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to clear all transaction data? This cannot be undone.")) return;

    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setTransactions([]);
      alert("All transactions cleared successfully.");
    } catch (err) {
      console.error("Error clearing transactions:", err);
      alert("Failed to clear transactions.");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (dateRange === 'all') return true;
    const tDate = new Date(t.date);
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    return isAfter(tDate, subDays(now, days));
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            id: u.uid,
            email: u.email || '',
            onboarded: true,
            upiLinked: false
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      // Sort in-memory to avoid indexing issues for now
      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribeTransactions();
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to parse statement');
      
      const { transactions: newTxs } = await response.json();
      
      const batch = writeBatch(db);
      newTxs.forEach((tx: any) => {
        const docRef = doc(collection(db, 'transactions'));
        batch.set(docRef, {
          ...tx,
          userId: user.uid,
          createdAt: Timestamp.now()
        });
      });
      
      await batch.commit();
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert(err.message || "Failed to parse statement.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkUPI = async (vpa: string) => {
    if (!user) return;
    setIsLinking(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      const profileUpdates = { upiLinked: true, linkedVpa: vpa };
      await setDoc(doc(db, 'users', user.uid), profileUpdates, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      setActiveTab('dashboard');
    } catch (err) {
      alert("Failed to link UPI");
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent mb-4" size={48} />
        <p className="text-secondary font-medium animate-pulse">Initializing Synesis...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      healthScore={insightsData.healthScore}
    >
      {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} userProfile={userProfile} dateRange={dateRange} setDateRange={setDateRange} />}
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={filteredTransactions} 
          onUpload={handleUpload} 
          isUploading={isUploading} 
          onClearAll={clearAllTransactions}
        />
      )}
      {activeTab === 'insights' && (
        <Insights 
          insights={insightsData.insights} 
          prediction={insightsData.prediction} 
          healthScore={insightsData.healthScore} 
        />
      )}
      {activeTab === 'chat' && <Chat transactions={filteredTransactions} />}
      {activeTab === 'upload' && (
        <UploadStatement onUpload={handleUpload} isUploading={isUploading} />
      )}
      {activeTab === 'upi' && (
        <UPILink onLink={handleLinkUPI} isLinking={isLinking} linkedVpa={userProfile?.linkedVpa} />
      )}
      {activeTab === 'settings' && (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Settings</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Personalize your Synesis experience.</p>
          <div className="max-w-md mx-auto space-y-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-left">
                <div>
                   <p className="font-bold text-slate-800 dark:text-white">Email Notifications</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Weekly spending summaries</p>
                </div>
                <button 
                  onClick={toggleEmailNotifications}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${userProfile?.emailNotifications ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${userProfile?.emailNotifications ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-left">
                <div>
                   <p className="font-bold text-slate-800 dark:text-white">Dark Mode</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Easier on the eyes</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${userProfile?.darkMode ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${userProfile?.darkMode ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
             </div>
             
             <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-danger uppercase tracking-widest mb-4">Danger Zone</p>
                <button 
                  onClick={clearAllTransactions}
                  className="w-full py-4 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-2xl border border-danger/20 font-bold transition-all text-sm"
                >
                  Clear All Transaction Data
                </button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
