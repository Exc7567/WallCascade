import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  deleteDoc
} from 'firebase/firestore';
import { Check, X, Shield, Smartphone, Monitor, Trash2, Gift, Snowflake, Star } from 'lucide-react';

// --- FIREBASE CONFIGURATION ---

// 🔴 1. MANUAL CONFIG (For Vercel/GitHub):
// UNCOMMENT this block and PASTE your keys from Firebase Console.

const firebaseConfig = {
  apiKey: "AIzaSyCAa6CLaTL2egvtsymwuoQ66ONQbtrxn_0",

  authDomain: "newyearwall-21c4d.firebaseapp.com",

  projectId: "newyearwall-21c4d",

  storageBucket: "newyearwall-21c4d.firebasestorage.app",

  messagingSenderId: "506412116766",

  appId: "1:506412116766:web:a305c6faa5748c986ef70f"

};



// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "christmas-wall-sketch-layout"; 

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes snow {
    0% { transform: translateY(-10px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0.3; }
  }
  
  /* HEAVY FALL ANIMATION */
  @keyframes dropFromSpace {
    0% { 
      opacity: 0; 
      transform: translateY(-120vh) rotate(-5deg); /* Start way above screen */
    }
    60% {
      opacity: 1;
      transform: translateY(20px) rotate(2deg); /* Crash down past target */
    }
    80% {
      transform: translateY(-10px) rotate(-1deg); /* Bounce up */
    }
    100% { 
      opacity: 1; 
      transform: translateY(0) rotate(0deg); /* Land */
    }
  }

  .snowflake {
    position: absolute;
    top: -10px;
    color: white;
    animation: snow linear infinite;
  }
  
  .falling-message {
    /* Ensure opacity starts at 0 so we don't see it before it falls */
    opacity: 0; 
    animation: dropFromSpace 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Custom Scrollbar to hide it but keep functionality */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // @ts-ignore
        await import('firebase/auth').then(({ signInWithCustomToken }) => 
          signInWithCustomToken(auth, __initial_auth_token)
        );
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guest') setView('guest');

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white animate-pulse">Loading Christmas Magic...</div>;

  const renderView = () => {
    switch (view) {
      case 'wall': return <WallView onBack={() => setView('landing')} />;
      case 'guest': return <GuestView onBack={() => setView('landing')} />;
      case 'admin': return <AdminView onBack={() => setView('landing')} />;
      default: return <LandingView onSelect={setView} />;
    }
  };

  return (
    <div className="font-sans">
      <style>{styles}</style>
      {renderView()}
    </div>
  );
}

// --- 1. LANDING VIEW ---
function LandingView({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 to-green-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="snowflake opacity-20" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${10 + Math.random() * 20}px`
          }}>❄</div>
        ))}
      </div>

      <h1 className="text-5xl font-bold mb-4 text-center text-yellow-400 drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]" style={{ fontFamily: 'serif' }}>
        Christmas Wish Wall
      </h1>
      
      <div className="grid gap-6 w-full max-w-md z-10 mt-12">
        <MenuButton icon={<Smartphone />} title="Guest Mode" desc="Scan QR to open this" color="bg-green-600" onClick={() => onSelect('guest')} />
        <MenuButton icon={<Monitor />} title="Wall Mode" desc="The Giant Display" color="bg-red-600" onClick={() => onSelect('wall')} />
        <MenuButton icon={<Shield />} title="Admin Mode" desc="Moderator Dashboard" color="bg-slate-600" onClick={() => onSelect('admin')} />
      </div>
    </div>
  );
}

function MenuButton({ icon, title, desc, color, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 p-6 ${color} hover:brightness-110 rounded-xl shadow-xl transition-all group border-2 border-white/20`}>
      <div className="p-3 bg-white/20 rounded-full text-white group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-left">
        <h3 className="font-bold text-xl">{title}</h3>
        <p className="text-sm text-white/80">{desc}</p>
      </div>
    </button>
  );
}

// --- 2. GUEST VIEW ---
function GuestView({ onBack }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wall_messages'), {
        text: message,
        status: 'pending',
        createdAt: Date.now()
      });
      setStatus('success');
      setMessage('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-red-950 text-white p-6 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-red-900 to-black pointer-events-none" />
      <button onClick={onBack} className="self-start text-sm text-red-300 mb-6 z-10 flex items-center gap-1">← Back</button>
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center z-10">
        <div className="text-center mb-8">
          <Gift className="w-16 h-16 mx-auto text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-yellow-100" style={{ fontFamily: 'serif' }}>Send a Wish</h2>
        </div>
        {status === 'success' ? (
          <div className="bg-green-800/80 border border-green-500 p-8 rounded-2xl text-center backdrop-blur-md animate-pulse">
            <Check size={48} className="mx-auto text-green-300 mb-4" />
            <h3 className="text-2xl font-bold text-green-100">Sent to Santa!</h3>
            <p className="text-green-200 mt-2">Look up at the screen!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-red-500/30 rounded-xl p-6 h-48 text-white placeholder-red-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all resize-none text-2xl font-serif text-center leading-relaxed"
              placeholder="Type your wish..."
              required
            />
            <button
              disabled={status === 'sending'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 py-4 rounded-xl font-bold text-xl shadow-lg shadow-green-900/50 hover:scale-[1.02] active:scale-95 transition-all text-white border border-green-400/30"
            >
              {status === 'sending' ? 'Sending...' : 'Send to Screen'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- 3. WALL VIEW (SKETCH MATCHING LAYOUT) ---
function WallView({ onBack }) {
  const [messages, setMessages] = useState([]);
  const guestUrl = window.location.href.split('?')[0] + '?mode=guest';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestUrl)}&color=000000&bgcolor=ffffff`;

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'wall_messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.status === 'approved')
        .sort((a, b) => b.createdAt - a.createdAt);
      setMessages(msgs);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  // Use a pseudo-random generator based on string char codes to make layout consistent but look random
  const getRandomStyle = (id, textLength) => {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    
    // Width Variation
    let widthClass = 'w-full'; 
    if (textLength < 15) widthClass = 'w-[45%]'; // Short text = small box
    else if (textLength > 50) widthClass = 'w-full'; // Long text = full width box
    else widthClass = seed % 2 === 0 ? 'w-[55%]' : 'w-[40%]'; // Medium = Random
    
    // Background Variation
    const colors = [
      'bg-red-800/90 border-red-500',
      'bg-green-800/90 border-green-500', 
      'bg-slate-800/90 border-yellow-500'
    ];
    const bgClass = colors[seed % 3];

    // Margin offsets to create the "Scattered" look (not a grid)
    const marginClass = seed % 5 === 0 ? 'mt-8' : (seed % 3 === 0 ? 'mt-0' : 'mt-4');
    
    // Font Size
    const fontClass = textLength < 20 ? 'text-4xl md:text-5xl font-bold' : 'text-xl md:text-2xl';

    return { widthClass, bgClass, marginClass, fontClass };
  };

  return (
    <div className="relative h-screen overflow-hidden bg-red-950 font-sans flex flex-row">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576692139035-773a726759c8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm"></div>
      
      {/* Snowfall */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.7
          }}>❄</div>
        ))}
      </div>

      {/* --- LEFT SIDEBAR (25%) Matches Sketch --- */}
      <div className="relative z-10 w-[25%] h-full bg-black/40 backdrop-blur-md border-r-2 border-yellow-500/30 flex flex-col pt-12 px-6 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
         {/* QR Code Container (Square Box) */}
         <div className="w-full aspect-square bg-white p-4 rounded-xl shadow-2xl mb-8 transform hover:scale-105 transition-transform">
            <img src={qrUrl} alt="Scan QR" className="w-full h-full object-contain" />
         </div>

         {/* Text Below */}
         <div className="text-center">
            <h1 className="text-5xl font-serif text-yellow-400 mb-4 drop-shadow-md">SCAN<br/>ME</h1>
            <div className="w-full h-px bg-white/30 my-6"></div>
            <div className="space-y-2 text-green-100 font-light text-lg">
              <p>1. Open Camera</p>
              <p>2. Scan Code</p>
              <p className="font-bold text-yellow-300 animate-pulse">3. Make a Wish!</p>
            </div>
         </div>
         
         <button onClick={onBack} className="mt-auto mb-4 text-white/20 text-xs">Exit</button>
      </div>

      {/* --- RIGHT CONTENT (75%) "Scattered Wall" --- */}
      <div className="relative z-10 w-[75%] h-full p-8 overflow-y-hidden">
        {/* Container with Flex Wrap + Random Margins to break the grid look */}
        <div className="w-full h-full flex flex-wrap content-start gap-4 overflow-y-auto pb-40 no-scrollbar pr-4">
          
          {messages.length === 0 ? (
            <div className="w-full mt-40 text-center text-white/30 text-4xl font-serif italic">
              Waiting for wishes to fall from the sky...
            </div>
          ) : (
            messages.map((msg, idx) => {
              const style = getRandomStyle(msg.id, msg.text.length);
              
              return (
                <div 
                  key={msg.id} 
                  className={`
                    falling-message
                    relative p-6 rounded-2xl border shadow-xl flex items-center justify-center text-center
                    min-h-[120px] 
                    ${style.widthClass} 
                    ${style.bgClass}
                    ${style.marginClass}
                  `}
                  style={{ 
                    // Stagger animation so they don't all drop at once on load
                    animationDelay: `${idx < 10 ? idx * 0.2 : 0}s` 
                  }}
                >
                  {/* Icon Badge */}
                  <div className="absolute -top-3 -right-3 bg-white text-red-700 rounded-full p-2 shadow-sm">
                    {idx % 2 === 0 ? <Gift size={18} /> : <Snowflake size={18} />}
                  </div>

                  <p className={`text-white font-serif leading-tight ${style.fontClass}`}>
                    "{msg.text}"
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// --- 4. ADMIN VIEW ---
function AdminView({ onBack }) {
  const [pendingMessages, setPendingMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'wall_messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.status === 'pending')
        .sort((a, b) => a.createdAt - b.createdAt);
      setPendingMessages(msgs);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wall_messages', id), { status });
  };

  const clearDb = async () => {
    if(confirm("Delete ALL data?")) {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'wall_messages'));
      onSnapshot(q, (snap) => snap.forEach(d => deleteDoc(d.ref)));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="bg-white px-4 py-2 rounded-lg shadow hover:bg-slate-50">← Back</button>
             <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
          </div>
          <button onClick={clearDb} className="text-red-500 text-xs hover:underline flex items-center gap-1"><Trash2 size={12}/> Clear All</button>
        </div>

        <div className="space-y-4">
          {pendingMessages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-400">No pending wishes.</p>
            </div>
          ) : (
            pendingMessages.map((msg) => (
              <div key={msg.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1">
                  <p className="text-slate-800 text-xl font-serif">"{msg.text}"</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => updateStatus(msg.id, 'rejected')} className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X /></button>
                  <button onClick={() => updateStatus(msg.id, 'approved')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30 flex items-center gap-2"><Check /> Approve</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
