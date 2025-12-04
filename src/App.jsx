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
const appId = "christmas-wall-final"; 

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes snow {
    0% { transform: translateY(-10px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0.3; }
  }
  
  /* THE FALLING ANIMATION */
  @keyframes fallFromSky {
    0% { 
      opacity: 0; 
      transform: translateY(-200px) scale(0.8); /* Start above screen */
    }
    60% {
      opacity: 1;
      transform: translateY(20px) scale(1.02); /* Overshoot slightly (bounce) */
    }
    100% { 
      opacity: 1; 
      transform: translateY(0) scale(1); /* Land */
    }
  }

  .snowflake {
    position: absolute;
    top: -10px;
    color: white;
    animation: snow linear infinite;
  }
  
  .message-card {
    animation: fallFromSky 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
`;

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 

  useEffect(() => {
    const initAuth = async () => {
      // Connect to Firebase anonymously
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
    
    // Check URL for ?mode=guest to auto-route scanners
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
      <p className="text-red-200 mb-12 text-center text-lg">Select your interface</p>
      
      <div className="grid gap-6 w-full max-w-md z-10">
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

// --- 2. GUEST VIEW (Phone - NO NAME FIELD) ---
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
          <p className="text-red-200">Your message will appear on the big screen!</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-800/80 border border-green-500 p-8 rounded-2xl text-center backdrop-blur-md animate-pulse">
            <Check size={48} className="mx-auto text-green-300 mb-4" />
            <h3 className="text-2xl font-bold text-green-100">Sent to Santa!</h3>
            <p className="text-green-200 mt-2">Look for it on the big screen!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-red-500/30 rounded-xl p-6 h-48 text-white placeholder-red-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all resize-none text-2xl font-serif text-center leading-relaxed"
              placeholder="Type your wish here..."
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

// --- 3. WALL VIEW (FALLING TEXT + ILLUSTRATION LAYOUT) ---
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
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first
      setMessages(msgs);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  // Logic to determine font size AND box width based on text length
  const getCardStyle = (text) => {
    const len = text.length;
    if (len < 20) {
      // Short text: Huge font, wide box
      return { 
        textSize: 'text-5xl md:text-7xl font-black leading-none tracking-tight', 
        width: 'md:col-span-2', // Takes up 2 slots width
        bg: 'bg-gradient-to-br from-red-600 to-red-900 border-red-400'
      };
    } else if (len < 60) {
      // Medium text: Big font, normal box
      return { 
        textSize: 'text-3xl md:text-4xl font-bold leading-tight', 
        width: 'md:col-span-1',
        bg: 'bg-gradient-to-br from-green-700 to-green-900 border-green-500'
      };
    } else {
      // Long text: Normal font, wide box to fit it
      return { 
        textSize: 'text-xl md:text-2xl font-medium leading-normal', 
        width: 'md:col-span-2',
        bg: 'bg-gradient-to-br from-slate-800 to-black border-yellow-600/50'
      };
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-red-950 font-sans flex">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576692139035-773a726759c8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-red-900/60 to-red-950/90"></div>
      
      {/* Snowfall */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.7
          }}>❄</div>
        ))}
      </div>

      {/* LEFT PANEL: 30% Width (Matches your illustration) */}
      <div className="relative z-10 w-[30%] h-screen flex flex-col justify-start items-center p-8 border-r border-white/10 bg-black/30 backdrop-blur-md shadow-2xl pt-20">
        {/* QR Code Box at Top */}
        <div className="mb-10 p-3 bg-white rounded-3xl shadow-[0_0_60px_rgba(255,255,0,0.2)] transform hover:scale-105 transition-transform duration-500">
           <img src={qrUrl} alt="Scan QR" className="w-56 h-56 object-contain" />
        </div>

        {/* Text Below QR */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm leading-tight" style={{ fontFamily: 'serif' }}>
            SCAN<br/>ME
          </h1>
          <div className="w-16 h-1 bg-yellow-500 mx-auto rounded-full"></div>
          <p className="text-green-100 text-lg font-light leading-relaxed px-4">
            Open your camera<br/>
            Scan the code<br/>
            <span className="text-yellow-400 font-bold">Write a wish!</span>
          </p>
        </div>
        
        <button onClick={onBack} className="absolute bottom-4 left-4 text-white/30 text-xs hover:text-white">Exit</button>
      </div>

      {/* RIGHT PANEL: 70% Width (The "Wall") */}
      <div className="relative z-10 w-[70%] h-screen overflow-hidden p-8">
        {/* Using CSS Grid for the "Masonry" Look in your sketch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-start pb-32 pr-2 custom-scrollbar overflow-y-auto h-full">
          {messages.length === 0 ? (
            <div className="col-span-2 mt-40 text-center text-white/30 text-3xl font-serif italic">
              Waiting for the first wish to fall from the sky...
            </div>
          ) : (
            messages.map((msg, idx) => {
              const style = getCardStyle(msg.text);
              return (
                <div 
                  key={msg.id} 
                  className={`
                    message-card relative rounded-3xl p-8 border shadow-2xl
                    flex items-center justify-center text-center
                    ${style.width} ${style.bg}
                  `}
                  style={{ 
                    // Stagger animation slightly for natural feel
                    animationDelay: `${idx < 5 ? idx * 0.15 : 0}s` 
                  }}
                >
                  {/* Decorative Icon */}
                  <div className="absolute -top-3 -right-3 bg-white text-red-600 rounded-full p-2 shadow-lg">
                    {idx % 2 === 0 ? <Gift size={20} /> : <Snowflake size={20} />}
                  </div>

                  {/* THE MESSAGE TEXT (Inside the box) */}
                  <p className={`text-white font-serif ${style.textSize}`}>
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
