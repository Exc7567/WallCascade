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

// --- FIREBASE SETUP ---
// TODO: PASTE YOUR FIREBASE CONFIGURATION HERE
// Go to Firebase Console -> Project Settings -> General -> Your Apps -> SDK Setup and config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "new-year-wall"; // We can hardcode this for your project

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes snow {
    0% { transform: translateY(-10px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0.3; }
  }
  @keyframes glideIn {
    0% { transform: translateY(-50px) scale(0.9); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
    50% { transform: translateY(-10px) rotate(var(--rot)); }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  .snowflake {
    position: absolute;
    top: -10px;
    color: white;
    animation: snow linear infinite;
  }
  .card-enter {
    animation: glideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .card-float {
    animation: float 6s ease-in-out infinite;
  }
`;

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 

  // Auth & URL Routing for QR Code
  useEffect(() => {
    const initAuth = async () => {
      // In the real app, we just use Anonymous auth for everyone
      await signInAnonymously(auth);
    };
    initAuth();
    
    // Check URL for ?mode=guest to auto-route scanners
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guest') {
      setView('guest');
    }

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

// --- 2. GUEST VIEW (Phone) ---
function GuestView({ onBack }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wall_messages'), {
        sender: name || 'Secret Santa',
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
          <p className="text-red-200">Spread the Christmas cheer!</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-800/80 border border-green-500 p-8 rounded-2xl text-center backdrop-blur-md animate-pulse">
            <Check size={48} className="mx-auto text-green-300 mb-4" />
            <h3 className="text-2xl font-bold text-green-100">Sent to Santa!</h3>
            <p className="text-green-200 mt-2">Wait for it to appear on the big screen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-red-500/30 rounded-xl p-4 text-white placeholder-red-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all"
              placeholder="Your Name (Optional)"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-red-500/30 rounded-xl p-4 h-40 text-white placeholder-red-300/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all resize-none text-lg"
              placeholder="Write your Christmas wish..."
              required
            />
            <button
              disabled={status === 'sending'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 py-4 rounded-xl font-bold text-xl shadow-lg shadow-green-900/50 hover:scale-[1.02] active:scale-95 transition-all text-white border border-green-400/30"
            >
              {status === 'sending' ? 'Sending...' : 'Send Wish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- 3. WALL VIEW (The Animated Christmas Display) ---
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-red-950 font-sans flex">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576692139035-773a726759c8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-red-900/60 to-red-950/90"></div>
      
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.7
          }}>❄</div>
        ))}
      </div>

      <div className="relative z-10 w-[35%] h-screen flex flex-col justify-center items-center p-8 border-r border-white/10 bg-black/20 backdrop-blur-md shadow-2xl">
        <div className="mb-8 p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-green-500 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.3)] animate-pulse">
          <div className="bg-white p-4 rounded-xl">
             <img src={qrUrl} alt="Scan QR" className="w-64 h-64 object-contain" />
          </div>
        </div>

        <h1 className="text-6xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-sm mb-4" style={{ fontFamily: 'serif' }}>
          Merry<br/>Christmas
        </h1>
        
        <div className="bg-green-900/80 border border-green-500/50 p-6 rounded-2xl max-w-sm text-center transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-[sparkle_2s_infinite]" />
          <h3 className="text-xl font-bold text-green-100 mb-2">Scan & Send a Wish</h3>
          <p className="text-green-200 text-sm">Open your camera, scan the code, and your message will fly onto the screen!</p>
        </div>

        <button onClick={onBack} className="absolute bottom-4 left-4 text-white/30 text-xs hover:text-white">Exit</button>
      </div>

      <div className="relative z-10 w-[65%] h-screen overflow-hidden p-8">
        <div className="flex flex-wrap content-start gap-6 h-full overflow-y-auto pb-32 pr-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-serif italic">
              Santa is waiting for the first wish...
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isLarge = idx % 5 === 0; 
              const rotation = (idx % 2 === 0 ? 1 : -1) * (Math.random() * 3);
              const colors = [
                'bg-red-900/80 border-red-500', 
                'bg-green-900/80 border-green-500', 
                'bg-slate-900/80 border-yellow-500'
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <div 
                  key={msg.id} 
                  className={`
                    card-enter card-float relative rounded-2xl p-6 border backdrop-blur-md shadow-2xl
                    ${isLarge ? 'w-full text-2xl' : 'w-[47%] text-lg'}
                    ${colorClass}
                  `}
                  style={{ 
                    '--rot': `${rotation}deg`,
                    animationDelay: `${idx * 0.1}s` 
                  }}
                >
                  <div className="absolute -top-3 -right-3 bg-white text-red-600 rounded-full p-2 shadow-lg">
                    {idx % 2 === 0 ? <Gift size={isLarge ? 24 : 16} /> : <Snowflake size={isLarge ? 24 : 16} />}
                  </div>

                  <p className="text-white font-serif leading-relaxed mb-4">
                    "{msg.text}"
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className={`font-bold ${isLarge ? 'text-lg text-yellow-400' : 'text-sm text-yellow-200/80'}`}>
                      - {msg.sender}
                    </span>
                  </div>
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
                  <h4 className="font-bold text-slate-800">{msg.sender}</h4>
                  <p className="text-slate-600 text-lg">"{msg.text}"</p>
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
