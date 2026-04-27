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
  limit
} from 'firebase/firestore';
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
import { setDoc, doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Initialize profile if it doesn't exist
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            onboarded: true,
            upiLinked: false
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLinkUPI = async (vpa: string) => {
    if (!user) return;
    setIsLinking(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    try {
      const profileUpdates = { 
        upiLinked: true, 
        linkedVpa: vpa 
      };
      await setDoc(doc(db, 'users', user.uid), profileUpdates, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    } finally {
      setIsLinking(false);
    }
  };
  const [insightsData, setInsightsData] = useState<{ insights: string[], prediction: string, healthScore: number }>({
    insights: [],
    prediction: 'Upload your statement to get a prediction.',
    healthScore: 0
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        // Sort in memory to avoid index requirements
        docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log("Firestore updated, transactions count:", docs.length);
        setTransactions(docs);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        if (error.message.includes("index")) {
          alert("Firestore index missing. Please check the console for the index creation link.");
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Analyze transactions whenever they change
  useEffect(() => {
    if (transactions.length > 0 && user) {
      const analyze = async () => {
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: transactions.slice(0, 50) }) // Only analyze recent 50
          });
          const data = await res.json();
          setInsightsData(data);
        } catch (err) {
          console.error("Analysis failed", err);
        }
      };
      
      const timer = setTimeout(analyze, 3000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [transactions, user]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Server responded with error:", data);
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      
      const parsedTransactions = data.transactions;

      if (!parsedTransactions || parsedTransactions.length === 0) {
        alert("Gemini couldn't find any transactions in this file. Please ensure it's a standard bank statement or valid CSV.");
        return;
      }

      console.log("Parsed transactions from API:", parsedTransactions);
      // Save to Firestore with progress tracking
      console.log(`Importing ${parsedTransactions.length} transactions...`);
      const batchPromises = parsedTransactions.map((t: any) => {
        const docData = {
          ...t,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          amount: Number(t.amount) || 0
        };
        console.log("Saving to Firestore:", docData);
        return addDoc(collection(db, 'transactions'), docData);
      });

      await Promise.all(batchPromises);
      console.log("Import complete.");
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert(err.message || "Failed to parse statement. Please ensure it's a valid PDF or CSV.");
    } finally {
      setIsUploading(false);
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
      {activeTab === 'dashboard' && <Dashboard transactions={transactions} userProfile={userProfile} />}
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          onUpload={handleUpload} 
          isUploading={isUploading} 
        />
      )}
      {activeTab === 'insights' && (
        <Insights 
          insights={insightsData.insights} 
          prediction={insightsData.prediction} 
          healthScore={insightsData.healthScore} 
        />
      )}
      {activeTab === 'chat' && <Chat transactions={transactions} />}
      {activeTab === 'upload' && (
        <UploadStatement onUpload={handleUpload} isUploading={isUploading} />
      )}
      {activeTab === 'upi' && (
        <UPILink onLink={handleLinkUPI} isLinking={isLinking} linkedVpa={userProfile?.linkedVpa} />
      )}
      {activeTab === 'settings' && (
        <div className="p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm text-center">
          <h3 className="text-2xl font-bold mb-4 text-slate-800">Settings</h3>
          <p className="text-slate-500 mb-8">Personalize your Synesis experience.</p>
          <div className="max-w-md mx-auto space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-left">
                <div>
                   <p className="font-bold text-slate-800">Email Notifications</p>
                   <p className="text-xs text-slate-500">Weekly spending summaries</p>
                </div>
                <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                   <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </div>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-left">
                <div>
                   <p className="font-bold text-slate-800">Dark Mode</p>
                   <p className="text-xs text-slate-500">Easier on the eyes</p>
                </div>
                <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                   <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </div>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
