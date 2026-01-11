import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReportCard } from './components/ReportCard';
import { ReelCard } from './components/ReelCard';
import { 
  IssueReport, Poll, FoodItem, CartItem, Department, 
  User, UserRole, BookSuggestion, 
  Badge, ReportStatus, Reel, ReelCategory
} from './types';
import { analyzeIssue, analyzeIssueText, suggestPollOptions } from './services/geminiService';

const DB_KEYS = {
  USERS: 'nexus_db_users',
  SESSION: 'nexus_session',
  POLLS: 'nexus_polls',
  LIBRARY_BOOKS: 'nexus_library_books',
  REPORTS: 'nexus_reports',
  DEPT_MESSAGES: 'nexus_dept_messages',
  REELS: 'nexus_reels'
};

const AuthService = {
  ADMINS: [
    { email: 'Sdey97976@gmail.com', password: '1234', name: 'Admin S. Dey' },
    { email: 'kundusrijita371@gmail.com', password: '1234', name: 'Admin S. Kundu' }
  ],

  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  
  register: (name: string, email: string, password: string, role: UserRole): User => {
    const cleanEmail = email.trim().toLowerCase();
    if (AuthService.ADMINS.find(a => a.email.toLowerCase() === cleanEmail)) {
      throw new Error("This identifier is reserved for administration.");
    }
    const users = AuthService.getUsers();
    if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error("Identity already exists in database.");
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email: cleanEmail,
      password,
      role,
      createdAt: Date.now(),
      points: 0,
      badges: []
    };
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify([...users, newUser]));
    return newUser;
  },

  login: (email: string, password: string, role: UserRole): User => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const hardcodedAdmin = AuthService.ADMINS.find(
      a => a.email.toLowerCase() === cleanEmail && a.password === cleanPass
    );
    if (hardcodedAdmin) {
      if (role !== 'admin') throw new Error("Restricted access. Use Administrative Terminal.");
      return { id: `admin-${cleanEmail.split('@')[0]}`, name: hardcodedAdmin.name, email: hardcodedAdmin.email, role: 'admin', createdAt: Date.now(), points: 9999, badges: [] };
    }
    const users = AuthService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass && u.role === role);
    if (!user) throw new Error("Invalid credentials or access level mismatch.");
    return user;
  },

  updateUser: (updatedUser: User) => {
    const users = AuthService.getUsers();
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(newUsers));
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(updatedUser));
  }
};

const VoiceInput = ({ onTranscript, className = "" }: { onTranscript: (text: string) => void, className?: string }) => {
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice protocols not supported in this browser version.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.start();
  };

  return (
    <button 
      onClick={startListening}
      className={`relative btn-neural rounded-2xl flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-rose-600 text-white shadow-rose-500/50 scale-110' : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'} ${className}`}
      title="Voice Input"
    >
      {isListening && <div className="absolute inset-0 rounded-2xl border-2 border-rose-500 animate-ping"></div>}
      <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
    </button>
  );
};

const Footer = () => (
  <footer className="w-full py-10 text-center mt-auto border-t border-white/5">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center justify-center gap-2">
      Created with <i className="fa-solid fa-heart text-rose-500 animate-pulse"></i> & care by <span className="text-blue-500">team NEXUS</span>
    </p>
  </footer>
);

const CuteRobot = ({ mood = 'happy', className = '', message = '', type = 'default', onClick }: { 
  mood?: 'happy' | 'thinking' | 'scanning' | 'success' | 'disco' | 'error', 
  className?: string, 
  message?: string,
  type?: 'default' | 'chef' | 'grad' | 'winner' | 'book' | 'vote',
  onClick?: () => void
}) => {
  const colors = {
    default: '#3b82f6',
    chef: '#f97316',
    grad: '#10b981',
    winner: '#f59e0b',
    book: '#06b6d4',
    vote: '#8b5cf6'
  };

  const primaryColor = colors[type];

  return (
    <div className={`flex flex-col items-center transition-all duration-500 ${className}`} onClick={onClick}>
      <div className={`relative select-none pointer-events-none transition-all duration-500 w-full h-full`}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="100" cy="180" rx="40" ry="10" fill="black" fillOpacity="0.2" />
          
          {/* Hat / Accessory Layer */}
          {type === 'chef' && <path d="M70 45 C70 20, 130 20, 130 45 L130 55 L70 55 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />}
          {type === 'grad' && <path d="M60 40 L100 20 L140 40 L100 60 Z" fill="#1e293b" /><rect x="98" y="40" width="4" height="20" fill="#1e293b" /><circle cx="100" cy="65" r="4" fill="#f59e0b" />}
          {type === 'winner' && <path d="M80 15 L120 15 L115 35 L85 35 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />}
          {type === 'book' && <rect x="110" y="30" width="40" height="50" rx="4" fill="#0891b2" transform="rotate(15 110 30)" className="animate-bounce" />}

          {/* Body */}
          <rect x="60" y="80" width="80" height="70" rx="30" fill={mood === 'success' ? '#10b981' : mood === 'disco' ? '#d946ef' : mood === 'error' ? '#ef4444' : primaryColor} fillOpacity="0.9" />
          <rect x="70" y="90" width="60" height="50" rx="20" fill="white" fillOpacity="0.1" />
          
          {/* Head */}
          <g className={mood === 'scanning' ? 'animate-pulse' : ''}>
            <rect x="50" y="30" width="100" height="70" rx="35" fill={mood === 'success' ? '#065f46' : mood === 'disco' ? '#701a75' : mood === 'error' ? '#7f1d1d' : primaryColor} />
            <rect x="60" y="40" width="80" height="50" rx="25" fill="#020617" />
            
            {/* Eyes */}
            {mood === 'thinking' ? (
              <g><rect x="75" y="55" width="15" height="5" rx="2" fill="#60a5fa" className="animate-pulse" /><rect x="110" y="55" width="15" height="5" rx="2" fill="#60a5fa" className="animate-pulse" /></g>
            ) : mood === 'scanning' ? (
              <g><circle cx="82" cy="65" r="8" fill="#60a5fa" /><circle cx="118" cy="65" r="8" fill="#60a5fa" /><rect x="70" y="60" width="60" height="10" fill="#3b82f6" fillOpacity="0.5" className="animate-pulse" /></g>
            ) : mood === 'success' ? (
              <g><path d="M75 65 L85 75 L95 55" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M110 65 L120 75 L130 55" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
            ) : mood === 'error' ? (
              <g><path d="M75 55 L95 75 M95 55 L75 75" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /><path d="M110 55 L130 75 M130 55 L110 75" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /></g>
            ) : (
              <g>
                <circle cx="82" cy="65" r="10" fill="#60a5fa"><animate attributeName="r" values="10;8;10" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="118" cy="65" r="10" fill="#60a5fa"><animate attributeName="r" values="10;8;10" dur="2s" repeatCount="indefinite" /></circle>
                {type === 'book' && <rect x="70" y="55" width="60" height="2" fill="#60a5fa" />}
              </g>
            )}
          </g>
          
          <line x1="100" y1="30" x2="100" y2="10" stroke={primaryColor} strokeWidth="6" />
          <circle cx="100" cy="10" r="8" fill={primaryColor} className="animate-pulse" />
        </svg>
      </div>
      {message && (
        <div className="mt-4 glass px-6 py-2 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  );
};

const AuthPage = ({ onAuthSuccess }: { onAuthSuccess: (user: User) => void }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [mode, setMode] = useState<'login' | 'signup' | 'role-select'>('role-select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [robotMood, setRobotMood] = useState<'happy' | 'thinking' | 'scanning' | 'success' | 'error'>('happy');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) {
      setError("Incomplete data packets detected.");
      setRobotMood('error');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRobotMood('thinking');
    setTimeout(() => {
      try {
        let authUser: User;
        if (mode === 'signup') authUser = AuthService.register(name, email, password, role);
        else authUser = AuthService.login(email, password, role);
        setRobotMood('success');
        setTimeout(() => onAuthSuccess(authUser), 800);
      } catch (err: any) {
        setError(err.message || "Auth uplink failure.");
        setRobotMood('error');
        setIsLoading(false);
      }
    }, 1200);
  };

  if (mode === 'role-select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between p-6 text-center animate-in fade-in duration-1000">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full">
          <div className="mb-12 inline-block p-10 bg-blue-600 rounded-[3.5rem] shadow-2xl neon-glow floating">
            <i className="fa-solid fa-bolt-lightning text-white text-6xl"></i>
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-4 animate-in slide-in-from-bottom-4 duration-700">NE<span className="gradient-text">XUS</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] mb-20 animate-in fade-in delay-300">Select Access Protocol to Begin</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 stagger-entry">
            <button onClick={() => { setRole('student'); setMode('login'); }} className="group relative glass p-12 rounded-[3.5rem] border border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-500 overflow-hidden shimmer">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500"><i className="fa-solid fa-user-graduate text-4xl"></i></div>
                <h3 className="text-4xl font-black text-white mb-2 tracking-tight">Student</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Report issues, vote in polls,<br/>and access resources.</p>
              </div>
            </button>
            <button onClick={() => { setRole('admin'); setMode('login'); }} className="group relative glass p-12 rounded-[3.5rem] border border-rose-500/10 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all duration-500 overflow-hidden shimmer">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-rose-600/10 rounded-3xl flex items-center justify-center text-rose-500 border border-blue-500/20 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500"><i className="fa-solid fa-shield-halved text-4xl"></i></div>
                <h3 className="text-4xl font-black text-white mb-2 tracking-tight">Admin</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Manage dispatches and<br/>logistics infrastructure.</p>
              </div>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isStudent = role === 'student';
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 animate-in zoom-in-95 duration-500">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <div className="text-center mb-12">
          <button onClick={() => setMode('role-select')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.3em] mb-6 inline-flex items-center gap-2 group"><i className="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1"></i> Re-verify clearance</button>
          <h2 className={`text-6xl font-black ${isStudent ? 'text-white' : 'text-rose-500'} tracking-tighter mb-2`}>{role === 'admin' ? 'ADMIN' : mode === 'login' ? 'LOGIN' : 'SIGN UP'}</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">{role === 'admin' ? 'Secure Command Terminal' : 'Student Identity Port'}</p>
        </div>
        
        <div className="relative mt-20 w-full">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 z-20 scale-150">
            <CuteRobot mood={robotMood} className="w-24 h-24" />
          </div>
          
          <div className={`glass p-10 md:p-12 rounded-[3.5rem] shadow-4xl border ${isStudent ? 'border-white/5' : 'border-rose-500/20'} relative overflow-visible`}>
            <div className="absolute inset-0 rounded-[3.5rem] overflow-hidden pointer-events-none shimmer opacity-30"></div>
            
            <form onSubmit={handleAuth} className="space-y-6 mt-10 relative z-10">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-blue-500/50 outline-none transition-all" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="name@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Key</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-blue-500/50 outline-none transition-all" />
              </div>
              {error && <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-black uppercase text-center tracking-widest animate-pulse"><i className="fa-solid fa-circle-exclamation mr-2"></i> {error}</div>}
              <button type="submit" disabled={isLoading} className={`w-full py-6 text-white rounded-2xl font-black text-xs shadow-xl transition-all btn-neural flex items-center justify-center gap-3 disabled:opacity-50 ${isStudent ? 'bg-blue-600 shadow-blue-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
                {isLoading ? <i className="fa-solid fa-spinner animate-spin text-lg"></i> : <span className="tracking-[0.2em]">{mode === 'signup' ? 'CREATE PROFILE' : 'ACCESS CORE'}</span>}
              </button>
            </form>
            {isStudent && (
              <div className="mt-8 text-center relative z-10">
                <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">{mode === 'login' ? "New arrival? Sign Up" : "Existing Identity? Login"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Dashboard/Reports State
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [activeTab, setActiveTab] = useState<'report' | 'dashboard' | 'polls' | 'canteen' | 'departments' | 'library' | 'leaderboard' | 'reels'>('dashboard');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [textDispatchInput, setTextDispatchInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [robotMood, setRobotMood] = useState<'happy' | 'thinking' | 'scanning' | 'success' | 'disco' | 'error'>('happy');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant State
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("Initializing Matrix Analytics...");
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Library State
  const [bookSuggestions, setBookSuggestions] = useState<BookSuggestion[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<User[]>([]);

  // Reel State
  const [reels, setReels] = useState<Reel[]>([]);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelVideoData, setNewReelVideoData] = useState<string | null>(null);
  const [newReelCategory, setNewReelCategory] = useState<ReelCategory>('Resolved Issue');
  const reelFileInputRef = useRef<HTMLInputElement>(null);

  // Department Chat State
  const [activeChatDept, setActiveChatDept] = useState<Department | null>(null);
  const [deptMessages, setDeptMessages] = useState<Record<string, any[]>>({});
  const [chatText, setChatText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const stickers = ["🚀", "💻", "⚡", "🤖", "🔥", "🎓", "📚", "📡", "🧠", "🔧", "🔋", "💡", "🌈", "✅", "🆘", "🏆", "😀", "😎", "👍", "👎", "❤️", "🎉", "👀", "🤝"];

  // Handle Assistant Display and Messaging
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const timer = setTimeout(() => {
        setShowAssistant(true);
        const messages = [
          "Optimizing neural dispatch routes...",
          "Matrix integrity is optimal.",
          "Network efficiency at 98.4%",
          "Analytics sync complete."
        ];
        let i = 0;
        const interval = setInterval(() => {
          if (!isCelebrating) {
             setAssistantMessage(messages[i % messages.length]);
             i++;
          }
        }, 5000);
        return () => clearInterval(interval);
      }, 800);
      return () => {
        clearTimeout(timer);
        setShowAssistant(false);
      };
    } else {
      setShowAssistant(false);
    }
  }, [activeTab, isCelebrating]);

  // Gamification Logic
  const handleAwardPoints = (userId: string, points: number) => {
    const allUsers = AuthService.getUsers();
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser) {
      const currentPoints = targetUser.points || 0;
      const newPoints = currentPoints + points;
      const newBadges = [...(targetUser.badges || [])];
      
      if (newPoints >= 50 && !newBadges.find(b => b.id === 'badge-veteran')) {
        newBadges.push({ id: 'badge-veteran', name: 'Campus Veteran', icon: 'fa-shield-halved', description: 'Resolved multiple anomalies', color: 'blue' });
      }
      if (newPoints >= 100 && !newBadges.find(b => b.id === 'badge-hero')) {
        newBadges.push({ id: 'badge-hero', name: 'Guardian of Matrix', icon: 'fa-crown', description: 'Exceptional campus contribution', color: 'amber' });
      }

      const updatedUser: User = { ...targetUser, points: newPoints, badges: newBadges };
      AuthService.updateUser(updatedUser);
      if (user && user.id === userId) setUser(updatedUser);
      
      setLeaderboard(AuthService.getUsers().sort((a, b) => (b.points || 0) - (a.points || 0)));
    }
  };

  // Poll State Management
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isSuggestingOptions, setIsSuggestingOptions] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);

  // Canteen State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [useCredits, setUseCredits] = useState(false);

  const foodItems: FoodItem[] = [
    { id: 'f1', name: 'Chicken Biryani', price: 80, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800&q=80', category: 'Meal' },
    { id: 'f2', name: 'Chicken Lollipop', price: 30, imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80', category: 'Snack' },
    { id: 'f3', name: 'Paneer Butter Masala', price: 60, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe94bc7?w=800&q=80', category: 'Meal' },
    { id: 'f4', name: 'Paneer Fried Rice', price: 90, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80', category: 'Meal' },
    { id: 'f5', name: 'Tea', price: 10, imageUrl: 'https://images.unsplash.com/photo-1544787210-228394474f00?w=800&q=80', category: 'Drink' },
    { id: 'f6', name: 'Coffee', price: 20, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', category: 'Drink' }
  ];

  const departments: Department[] = [
    { id: 'd1', name: 'CSE', fullName: 'Computer Science & Engineering', headOfDept: 'Dr. Soumya Chatterjee', icon: 'fa-code', color: 'blue', resources: [] },
    { id: 'd2', name: 'ECE', fullName: 'Electronics & Communication', headOfDept: 'Dr. Sritoma Singha', icon: 'fa-tower-broadcast', color: 'violet', resources: [] },
    { id: 'd3', name: 'EE', fullName: 'Electrical Engineering', headOfDept: 'Dr. Poulami Ganguly', icon: 'fa-bolt', color: 'yellow', resources: [] },
    { id: 'd4', name: 'EEE', fullName: 'Electrical & Electronics', headOfDept: 'Dr. Abhisekh Basu', icon: 'fa-plug', color: 'orange', resources: [] },
    { id: 'd5', name: 'ME', fullName: 'Mechanical Engineering', headOfDept: 'Dr. Niloy Ghosh', icon: 'fa-gears', color: 'slate', resources: [] },
    { id: 'd6', name: 'CSBS', fullName: 'Computer Science & Business Systems', headOfDept: 'Dr. Avisekh Chakrobarty', icon: 'fa-briefcase', color: 'emerald', resources: [] },
    { id: 'd7', name: 'CSE AI&ML', fullName: 'Artificial Intelligence & ML', headOfDept: 'Dr. G. Bose', icon: 'fa-brain', color: 'indigo', resources: [] }
  ];

  useEffect(() => {
    try {
      const session = localStorage.getItem(DB_KEYS.SESSION);
      if (session) setUser(JSON.parse(session));
      
      const storedPolls = localStorage.getItem(DB_KEYS.POLLS);
      if (storedPolls) setPolls(JSON.parse(storedPolls));

      const storedBooks = localStorage.getItem(DB_KEYS.LIBRARY_BOOKS);
      if (storedBooks) setBookSuggestions(JSON.parse(storedBooks));

      const storedReports = localStorage.getItem(DB_KEYS.REPORTS);
      if (storedReports) setReports(JSON.parse(storedReports));

      const storedMessages = localStorage.getItem(DB_KEYS.DEPT_MESSAGES);
      if (storedMessages) setDeptMessages(JSON.parse(storedMessages));

      const storedReels = localStorage.getItem(DB_KEYS.REELS);
      if (storedReels) setReels(JSON.parse(storedReels));

      setLeaderboard(AuthService.getUsers().sort((a, b) => (b.points || 0) - (a.points || 0)));
    } catch { console.warn("Initialization failed."); }
  }, []);

  useEffect(() => {
    localStorage.setItem(DB_KEYS.POLLS, JSON.stringify(polls));
    localStorage.setItem(DB_KEYS.LIBRARY_BOOKS, JSON.stringify(bookSuggestions));
    localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(reports));
    localStorage.setItem(DB_KEYS.DEPT_MESSAGES, JSON.stringify(deptMessages));
    localStorage.setItem(DB_KEYS.REELS, JSON.stringify(reels));
  }, [polls, bookSuggestions, reports, deptMessages, reels]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [deptMessages, activeChatDept]);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(DB_KEYS.SESSION);
  };

  const openProfileModal = () => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
      setEditDept(user.department || '');
      setEditYear(user.year || '');
      setEditImage(user.profileImage);
      setIsProfileModalOpen(true);
    }
  };

  const saveProfile = () => {
    if (user) {
      const updatedUser: User = { ...user, name: editName, phone: editPhone, department: editDept, year: editYear, profileImage: editImage };
      setUser(updatedUser);
      AuthService.updateUser(updatedUser);
      setIsProfileModalOpen(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setEditImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setPreviewUrl(reader.result as string); setError(null); };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async () => {
    if (!previewUrl || !user) return;
    setIsAnalyzing(true);
    setError(null);
    setRobotMood('scanning');
    try {
      const base64Data = previewUrl.split(',')[1];
      const result = await analyzeIssue(base64Data);
      
      const newReport: IssueReport = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        imageUrl: previewUrl,
        status: 'Pending',
        reportedById: user.id,
        userNotes: userNotes
      };

      setReports(prev => [newReport, ...prev]);
      setPreviewUrl(null);
      setUserNotes('');
      setActiveTab('dashboard');
      setRobotMood('success');
    } catch (err: any) { 
      setError(err.message || "Analysis failed."); 
      setRobotMood('error');
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleVoiceReport = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support voice input.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsAnalyzing(true);
      setRobotMood('scanning');
    };
    recognition.onend = () => {
      setIsAnalyzing(false);
    };
    recognition.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (!transcript) return;
      
      setIsAnalyzing(true);
      setRobotMood('thinking');
      try {
        const result = await analyzeIssueText(transcript);
        const newReport: IssueReport = {
          ...result,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          imageUrl: 'https://images.unsplash.com/photo-1590650516494-23aa49aa3f71?w=500&q=80', // Voice placeholder
          status: 'Pending',
          reportedById: user!.id,
          userNotes: `[Voice Dispatch]: ${transcript}`
        };
        setReports(prev => [newReport, ...prev]);
        setActiveTab('dashboard');
        setRobotMood('success');
      } catch (err: any) {
        setError("Voice analysis protocols failed.");
        setRobotMood('error');
      } finally {
        setIsAnalyzing(false);
      }
    };
    recognition.start();
  };

  const handleTextReport = async () => {
    if (!textDispatchInput.trim() || !user) return;
    setIsAnalyzing(true);
    setRobotMood('thinking');
    setError(null);
    try {
      const result = await analyzeIssueText(textDispatchInput);
      const newReport: IssueReport = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        imageUrl: 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=500&q=80', // Text placeholder
        status: 'Pending',
        reportedById: user.id,
        userNotes: `[Text Dispatch]: ${textDispatchInput}`
      };
      setReports(prev => [newReport, ...prev]);
      setTextDispatchInput('');
      setActiveTab('dashboard');
      setRobotMood('success');
    } catch (err: any) {
      setError("Text diagnostic protocols failed.");
      setRobotMood('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleReportStatus = (id: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus: ReportStatus = r.status === 'Pending' ? 'Solved' : 'Pending';
        if (nextStatus === 'Solved') {
          handleAwardPoints(r.reportedById, 10);
          setIsCelebrating(true);
          setAssistantMessage("Dispatch Successful! System health improving.");
          setTimeout(() => setIsCelebrating(false), 3000);
        }
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  // Reels Logic
  const handleReelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReelVideoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelTitle || !newReelVideoData || !user) return;
    
    const reel: Reel = {
      id: Math.random().toString(36).substr(2, 9),
      title: newReelTitle,
      videoUrl: newReelVideoData,
      category: newReelCategory,
      likes: 0,
      comments: [],
      isEnabled: true,
      timestamp: Date.now(),
      adminName: user.name
    };

    setReels(prev => [reel, ...prev]);
    setNewReelTitle('');
    setNewReelVideoData(null);
    setIsUploadingReel(false);
  };

  const handleLikeReel = (id: string) => {
    setReels(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked };
      }
      return r;
    }));
  };

  const handleAddReelComment = (reelId: string, text: string) => {
    if (!user) return;
    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        const newComment = {
          id: Math.random().toString(36).substr(2, 9),
          userName: user.name,
          text,
          timestamp: Date.now()
        };
        return { ...r, comments: [...r.comments, newComment] };
      }
      return r;
    }));
  };

  const handleToggleReelEnabled = (id: string) => {
    setReels(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const handleDeleteReel = (id: string) => {
    setReels(prev => prev.filter(r => r.id !== id));
  };

  const visibleReels = useMemo(() => {
    if (user?.role === 'admin') return reels;
    return reels.filter(r => r.isEnabled);
  }, [reels, user]);

  // Chat Logic
  const sendDeptMessage = (type: 'text' | 'voice' | 'sticker', content: string) => {
    if (!activeChatDept || !user) return;
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.name,
      type,
      content,
      timestamp: Date.now()
    };
    setDeptMessages(prev => ({
      ...prev,
      [activeChatDept.id]: [...(prev[activeChatDept.id] || []), newMessage]
    }));
    setChatText('');
    setShowStickerPicker(false);
  };

  // Library Logic
  const suggestBook = () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim() || !user) return;
    const suggestion: BookSuggestion = {
      id: Math.random().toString(36).substr(2, 9),
      title: newBookTitle,
      author: newBookAuthor,
      suggestedBy: user.name,
      suggestedById: user.id,
      timestamp: Date.now(),
      votes: 0,
      status: 'Requested'
    };
    setBookSuggestions(prev => [suggestion, ...prev]);
    setNewBookTitle('');
    setNewBookAuthor('');
  };

  const voteForBook = (id: string) => {
    setBookSuggestions(prev => prev.map(b => b.id === id ? { ...b, votes: b.votes + 1 } : b));
  };

  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return bookSuggestions;
    return bookSuggestions.filter(b => 
      b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(bookSearchQuery.toLowerCase())
    );
  }, [bookSuggestions, bookSearchQuery]);

  // Existing Feature Helpers
  const handleAddPollOption = () => setPollOptions(prev => [...prev, '']);
  const handleRemovePollOption = (index: number) => setPollOptions(prev => prev.filter((_, i) => i !== index));
  const handleUpdatePollOption = (index: number, val: string) => {
    setPollOptions(prev => prev.map((o, i) => i === index ? val : o));
  };

  const handleSuggestPollOptions = async () => {
    if (!pollQuestion.trim()) return;
    setIsSuggestingOptions(true);
    try {
      const suggestions = await suggestPollOptions(pollQuestion);
      if (suggestions && suggestions.length > 0) setPollOptions(suggestions);
    } finally { setIsSuggestingOptions(false); }
  };

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    const newPoll: Poll = {
      id: Math.random().toString(36).substr(2, 9),
      question: pollQuestion,
      options: pollOptions.filter(o => o.trim()).map(text => ({ id: Math.random().toString(36).substr(2, 9), text, votes: 0 })),
      timestamp: Date.now(),
      creator: user?.name || 'Student',
      totalVotes: 0,
      hasVoted: false
    };
    setPolls(prev => [newPoll, ...prev]);
    setIsCreatingPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id === pollId && !p.hasVoted) {
        return {
          ...p,
          hasVoted: true,
          totalVotes: p.totalVotes + 1,
          options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
        };
      }
      return p;
    }));
  };

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const appliedDiscount = useCredits ? Math.min(Math.floor((user?.points || 0) / 25) * 10, cartSubtotal) : 0;
  const cartTotal = Math.max(0, cartSubtotal - appliedDiscount);

  const handlePayment = () => {
    if (cartTotal <= 0 || !user) return;
    if (useCredits) {
      const creditsToDeduct = Math.floor(appliedDiscount / 10) * 25;
      handleAwardPoints(user.id, -creditsToDeduct);
      setUseCredits(false);
    }
    const upiUri = `upi://pay?pa=7003489239@axl&pn=NEXUS_Canteen&am=${cartTotal.toFixed(2)}&cu=INR&tn=FoodOrder`;
    window.location.href = upiUri;
  };

  if (!user) return <AuthPage onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Header 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        onOpenProfile={openProfileModal}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
            <div className="w-full max-w-lg glass p-10 rounded-[4rem] border border-white/10 shadow-4xl relative max-h-[90vh] overflow-y-auto shimmer">
              <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-2xl"></i></button>
              <div className="text-center mb-10"><h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Neural <span className="gradient-text">Profile</span></h2></div>
              <div className="space-y-8">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] p-8 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><i className="fa-solid fa-award text-2xl"></i></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Credits</p>
                      <p className="text-3xl font-black text-white leading-none mt-1">{user.points || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6">
                   <div onClick={() => profileImageInputRef.current?.click()} className="relative group w-32 h-32 rounded-full bg-slate-900 border-2 border-blue-500/30 overflow-hidden cursor-pointer transition-transform hover:scale-105">
                     {editImage ? <img src={editImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-500"><i className="fa-solid fa-camera text-2xl"></i></div>}
                     <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-black uppercase">Change</div>
                   </div>
                   <input type="file" ref={profileImageInputRef} onChange={handleProfileImageChange} accept="image/*" className="hidden" />
                </div>
                <div className="grid gap-6">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-5 px-6 text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-5 px-6 text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <button onClick={saveProfile} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 btn-neural uppercase tracking-widest">Sync Credentials</button>
              </div>
            </div>
          </div>
        )}

        {showAssistant && activeTab === 'dashboard' && (
          <div className="fixed bottom-10 right-10 z-[100] flex items-end gap-4 bounce-in-up">
            <div className="glass p-6 rounded-[2.5rem] border border-blue-500/30 shadow-4xl max-w-[240px] relative shimmer animate-in zoom-in duration-300">
              <div className="absolute -bottom-2 right-12 w-4 h-4 bg-slate-900 rotate-45 border-r border-b border-blue-500/30"></div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                Nexus Analyst
              </p>
              <p className="text-xs text-white font-bold leading-relaxed">{assistantMessage}</p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
              <CuteRobot 
                mood={isCelebrating ? 'success' : 'happy'} 
                className={`w-28 h-28 cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isCelebrating ? 'celebrate-spin' : 'floating'}`} 
                onClick={() => setAssistantMessage("Current campus matrix integrity: 99.8% Nominal.")} 
              />
            </div>
          </div>
        )}

        {/* --- TABS --- */}

        {activeTab === 'dashboard' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-8 backdrop-blur-sm floating">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Interface Active</span>
                </div>
                <h2 className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-[1] mb-6 animate-in slide-in-from-left-8 duration-700">Nexus <span className="gradient-text">Matrix</span></h2>
                <p className="text-slate-400 font-bold text-xl leading-relaxed max-w-md opacity-80">Systems operational for <span className="text-white">{user.name}</span>. Network health is optimal.</p>
                {user.badges && user.badges.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-4 stagger-entry">
                    {user.badges.map(b => (
                      <div key={b.id} className={`flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all`}>
                        <i className={`fa-solid ${b.icon}`}></i> {b.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-12">
                <CuteRobot mood={robotMood} className="w-48 h-48 drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]" />
                {user.role === 'student' && (
                  <button onClick={() => setActiveTab('report')} className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-xs shadow-2xl btn-neural uppercase tracking-widest flex items-center gap-4 group">
                    <i className="fa-solid fa-bolt group-hover:rotate-12 transition-transform"></i> New Dispatch
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 stagger-entry">
              {[
                { label: 'Network Reports', value: reports.length, icon: 'fa-microchip' },
                { label: 'Active Tasks', value: reports.filter(r => r.status === 'Pending').length, icon: 'fa-bolt' },
                { label: 'Resolved', value: reports.filter(r => r.status === 'Solved').length, icon: 'fa-check' },
                { label: 'Neural Credits', value: user.points || 0, icon: 'fa-award' },
              ].map((stat, i) => (
                <div key={i} className="glass p-10 rounded-[3rem] group hover:border-blue-500/30 transition-all duration-500 shimmer">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                    <i className={`fa-solid ${stat.icon} text-xl`}></i>
                  </div>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block opacity-70">{stat.label}</span>
                  <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="space-y-12">
              <h3 className="text-4xl font-black text-white tracking-tighter flex items-center gap-5 animate-in fade-in duration-1000"><div className="w-2.5 h-10 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div> Recent Anomalies</h3>
              {reports.length === 0 ? (
                <div className="glass rounded-[4rem] p-32 text-center border-dashed border-white/5 opacity-40 animate-pulse">
                  <i className="fa-solid fa-satellite-dish text-5xl text-slate-500 mb-6"></i>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em]">No transmissions detected.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 stagger-entry">
                  {reports.map(r => (
                    <ReportCard key={r.id} report={r} userRole={user.role} onToggleStatus={toggleReportStatus} onDelete={(id) => setReports(prev => prev.filter(x => x.id !== id))} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-lg mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">Campus <span className="gradient-text">Vibes</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Neural feed of latest updates & achievements</p>
            </div>

            {user.role === 'admin' && (
              <div className="mb-12">
                {!isUploadingReel ? (
                  <button 
                    onClick={() => setIsUploadingReel(true)}
                    className="w-full py-8 glass rounded-[3rem] border border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 transition-all group flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Broadcast New Transmission</span>
                  </button>
                ) : (
                  <div className="glass p-10 rounded-[3.5rem] border border-blue-500/20 shadow-4xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Signal Config</h3>
                      <button onClick={() => setIsUploadingReel(false)} className="text-slate-500 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    <form onSubmit={handleAddReel} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vibe Title</label>
                        <input 
                          type="text" 
                          required
                          value={newReelTitle}
                          onChange={(e) => setNewReelTitle(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-blue-500/50"
                          placeholder="Short catchy title..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Upload Video Data</label>
                        <div 
                          onClick={() => reelFileInputRef.current?.click()}
                          className={`w-full py-10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 cursor-pointer 
                            ${newReelVideoData ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-slate-950/40 hover:border-blue-500/40'}
                          `}
                        >
                          <i className={`fa-solid ${newReelVideoData ? 'fa-check text-emerald-400' : 'fa-film text-slate-500'} text-3xl`}></i>
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            {newReelVideoData ? 'Signal Loaded Successfully' : 'Select Video File'}
                          </span>
                          <input 
                            ref={reelFileInputRef}
                            type="file" 
                            accept="video/*"
                            onChange={handleReelFileSelect}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Channel Category</label>
                        <select 
                          value={newReelCategory}
                          onChange={(e) => setNewReelCategory(e.target.value as ReelCategory)}
                          className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-blue-500/50"
                        >
                          <option value="Resolved Issue">Resolved Issue</option>
                          <option value="Alert">Alert</option>
                          <option value="Awareness">Awareness</option>
                          <option value="Achievement">Achievement</option>
                        </select>
                      </div>
                      <button 
                        type="submit" 
                        disabled={!newReelVideoData || !newReelTitle}
                        className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-30"
                      >
                        Launch Transmission
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-24 pb-20 snap-y snap-mandatory h-[85vh] overflow-y-auto no-scrollbar">
              {visibleReels.length === 0 ? (
                <div className="text-center py-20 opacity-30 snap-start">
                  <i className="fa-solid fa-tower-broadcast text-6xl mb-6 block"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No active vibes detected</p>
                </div>
              ) : (
                visibleReels.map(reel => (
                  <div key={reel.id} className="snap-start w-full">
                    <ReelCard 
                      reel={reel} 
                      userRole={user.role} 
                      onLike={handleLikeReel} 
                      onAddComment={handleAddReelComment}
                      onToggleEnabled={handleToggleReelEnabled}
                      onDelete={handleDeleteReel}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="text-center mb-12">
              <h2 className="text-6xl font-black text-white tracking-tighter mb-4">Community <span className="gradient-text">Consensus</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Voice your opinion in the neural network</p>
            </div>

            {/* Create Poll Section */}
            <div className="max-w-3xl mx-auto mb-16">
              {!isCreatingPoll ? (
                <button 
                  onClick={() => setIsCreatingPoll(true)}
                  className="w-full py-8 glass rounded-[3rem] border-dashed border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 text-slate-400 hover:text-white transition-all group flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-plus text-2xl"></i>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Initiate New Poll</span>
                </button>
              ) : (
                <div className="glass p-10 rounded-[3rem] border border-violet-500/20 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-black text-white">Create Protocol</h3>
                     <button onClick={() => setIsCreatingPoll(false)} className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Topic</label>
                      <div className="flex gap-4">
                        <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="What should we vote on?" className="flex-1 bg-slate-950/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-violet-500/50 outline-none" />
                        <button onClick={handleSuggestPollOptions} disabled={!pollQuestion || isSuggestingOptions} className="px-6 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-violet-500/20 transition-colors whitespace-nowrap">
                           {isSuggestingOptions ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} AI Suggest
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Options</label>
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-3">
                           <input type="text" value={opt} onChange={(e) => handleUpdatePollOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm focus:border-violet-500/50 outline-none" />
                           {pollOptions.length > 2 && (
                             <button onClick={() => handleRemovePollOption(i)} className="w-12 rounded-xl bg-slate-900 border border-white/10 text-rose-500 hover:bg-rose-500/10 transition-colors"><i className="fa-solid fa-trash"></i></button>
                           )}
                        </div>
                      ))}
                      <button onClick={handleAddPollOption} className="text-[10px] font-black text-violet-400 uppercase tracking-widest hover:text-white transition-colors ml-2">+ Add Option</button>
                    </div>
                    <button onClick={createPoll} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:bg-violet-500 transition-colors mt-4">Launch Poll</button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-entry">
               {polls.map(poll => (
                 <div key={poll.id} className="glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                    <div className="mb-8">
                       <h3 className="text-2xl font-black text-white mb-2">{poll.question}</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initiated by {poll.creator}</p>
                    </div>
                    <div className="space-y-4">
                       {poll.options.map(option => {
                         const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                         return (
                           <button 
                            key={option.id}
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={poll.hasVoted}
                            className={`w-full relative h-14 rounded-2xl overflow-hidden border transition-all ${poll.hasVoted ? 'cursor-default border-transparent bg-slate-900' : 'cursor-pointer hover:border-violet-500/50 border-white/10 bg-slate-950/40'}`}
                           >
                              <div className="absolute inset-y-0 left-0 bg-violet-600/20 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                              <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                                 <span className="text-sm font-bold text-white">{option.text}</span>
                                 {poll.hasVoted && <span className="text-xs font-black text-violet-400">{percentage}%</span>}
                              </div>
                           </button>
                         )
                       })}
                    </div>
                    <div className="mt-6 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                       <span>{poll.totalVotes} Votes recorded</span>
                       {poll.hasVoted && <span className="text-violet-400"><i className="fa-solid fa-check-circle"></i> Voted</span>}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'canteen' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div>
                   <h2 className="text-6xl font-black text-white tracking-tighter">Nexus <span className="gradient-text">Nutrients</span></h2>
                   <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-3 opacity-70">Refuel for optimal performance</p>
                </div>
                <div className="glass px-6 py-3 rounded-2xl border border-orange-500/20 flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cart Total</p>
                      <p className="text-xl font-black text-white">₹{cartTotal}</p>
                   </div>
                   <button onClick={handlePayment} disabled={cart.length === 0} className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale">
                      <i className="fa-solid fa-arrow-right"></i>
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-entry">
                {foodItems.map(item => (
                  <div key={item.id} className="glass p-6 rounded-[2.5rem] group hover:border-orange-500/30 transition-all duration-500 relative overflow-hidden">
                     <div className="h-48 rounded-[2rem] overflow-hidden mb-6 relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-black">₹{item.price}</div>
                     </div>
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">{item.category}</span>
                           <h3 className="text-xl font-black text-white leading-tight">{item.name}</h3>
                        </div>
                        <button onClick={() => addToCart(item)} className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-lg">
                           <i className="fa-solid fa-plus"></i>
                        </button>
                     </div>
                  </div>
                ))}
             </div>
             
             {cart.length > 0 && (
               <div className="glass p-8 rounded-[3rem] border border-orange-500/20">
                  <h3 className="text-2xl font-black text-white mb-6">Current Order</h3>
                  <div className="space-y-4 mb-8">
                     {cart.map(item => (
                       <div key={item.id} className="flex justify-between items-center p-4 bg-slate-950/40 rounded-2xl">
                          <div className="flex items-center gap-4">
                             <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                             <div>
                                <p className="text-sm font-bold text-white">{item.name}</p>
                                <p className="text-xs text-slate-500">x{item.quantity}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <p className="font-black text-white">₹{item.price * item.quantity}</p>
                              <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-slate-900 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors">
                                  <i className="fa-solid fa-trash-can text-xs"></i>
                              </button>
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                     <input type="checkbox" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-orange-500 focus:ring-orange-500" />
                     <div>
                        <p className="text-sm font-bold text-white">Use Neural Credits</p>
                        <p className="text-[10px] text-slate-500">Available: {user.points} (Max discount: ₹{Math.min(Math.floor((user.points || 0) / 25) * 10, cartSubtotal)})</p>
                     </div>
                  </div>
                  <button onClick={handlePayment} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-500 transition-all">
                     Confirm Payment • ₹{cartTotal}
                  </button>
               </div>
             )}
          </div>
        )}
        
        {activeTab === 'departments' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-[80vh] flex gap-8">
             {!activeChatDept ? (
               <div className="w-full space-y-12">
                 <div className="text-center">
                    <h2 className="text-6xl font-black text-white tracking-tighter mb-4">Academic <span className="gradient-text">Hubs</span></h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Select a frequency to connect</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-entry">
                    {departments.map(dept => (
                      <button 
                        key={dept.id} 
                        onClick={() => setActiveChatDept(dept)}
                        className={`glass p-8 rounded-[2.5rem] border border-${dept.color}-500/10 hover:border-${dept.color}-500/40 group text-left transition-all hover:bg-${dept.color}-500/5`}
                      >
                         <div className={`w-14 h-14 rounded-2xl bg-${dept.color}-500/10 flex items-center justify-center text-${dept.color}-500 text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                            <i className={`fa-solid ${dept.icon}`}></i>
                         </div>
                         <h3 className="text-3xl font-black text-white mb-2">{dept.name}</h3>
                         <p className="text-xs text-slate-400 font-medium mb-4">{dept.fullName}</p>
                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <i className="fa-solid fa-user-tie"></i> {dept.headOfDept}
                         </div>
                      </button>
                    ))}
                 </div>
               </div>
             ) : (
               <div className="w-full h-full glass rounded-[3rem] border border-white/5 overflow-hidden flex flex-col relative animate-in zoom-in-95">
                  <div className={`p-6 bg-slate-900/50 border-b border-white/5 flex justify-between items-center`}>
                     <div className="flex items-center gap-4">
                        <div onClick={() => setActiveChatDept(null)} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-colors">
                           <i className="fa-solid fa-arrow-left"></i>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl bg-${activeChatDept.color}-500/10 flex items-center justify-center text-${activeChatDept.color}-500`}>
                           <i className={`fa-solid ${activeChatDept.icon}`}></i>
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white leading-none">{activeChatDept.name} Global</h3>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Frequency</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/30">
                     {(!deptMessages[activeChatDept.id] || deptMessages[activeChatDept.id].length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                           <i className="fa-solid fa-comments text-4xl mb-4"></i>
                           <p className="text-xs font-black uppercase tracking-widest">Channel Quiet</p>
                        </div>
                     )}
                     {deptMessages[activeChatDept.id]?.map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
                           <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg border border-white/5">
                              {msg.senderName.charAt(0)}
                           </div>
                           <div className={`max-w-[70%] space-y-1 ${msg.senderId === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-slate-400 uppercase">{msg.senderName}</span>
                                 <span className="text-[8px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${msg.senderId === user.id ? `bg-${activeChatDept.color}-600 text-white rounded-tr-none` : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                                 {msg.content}
                              </div>
                           </div>
                        </div>
                     ))}
                     <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5 relative">
                     {showStickerPicker && (
                       <div className="absolute bottom-full left-4 mb-2 p-4 glass rounded-2xl grid grid-cols-6 gap-2 w-64 shadow-2xl animate-in zoom-in-95">
                          {stickers.map(emoji => (
                            <button key={emoji} onClick={() => setChatText(prev => prev + emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>
                          ))}
                       </div>
                     )}
                     <div className="flex gap-3">
                        <button onClick={() => setShowStickerPicker(!showStickerPicker)} className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 transition-colors flex items-center justify-center">
                           <i className="fa-solid fa-face-smile text-lg"></i>
                        </button>
                        <input 
                          type="text" 
                          value={chatText} 
                          onChange={(e) => setChatText(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && chatText.trim() && sendDeptMessage('text', chatText)}
                          placeholder={`Message ${activeChatDept.name} channel...`} 
                          className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-6 text-white text-sm focus:border-white/20 outline-none" 
                        />
                        <button 
                          onClick={() => chatText.trim() && sendDeptMessage('text', chatText)}
                          disabled={!chatText.trim()}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg ${chatText.trim() ? `bg-${activeChatDept.color}-600 hover:scale-105` : 'bg-slate-800 opacity-50 cursor-not-allowed'}`}
                        >
                           <i className="fa-solid fa-paper-plane"></i>
                        </button>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'report' && user.role === 'student' && (
          <div className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="glass p-12 md:p-20 rounded-[4rem] text-center shadow-4xl relative overflow-hidden shimmer">
               {!previewUrl ? (
                 <div className="space-y-16">
                   <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-white/5 p-24 rounded-[3.5rem] cursor-pointer hover:bg-slate-950/60 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                      <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform duration-700 relative z-10">
                        <i className="fa-solid fa-camera text-4xl text-blue-500"></i>
                      </div>
                      <h4 className="text-4xl font-black text-white mb-3 tracking-tight relative z-10">Optical Scanner</h4>
                      <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] relative z-10">Select issue frame for AI diagnostics.</p>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </div>
                   
                   <div className="space-y-10">
                      <div className="flex items-center gap-6">
                        <div className="flex-1 h-px bg-white/5"></div>
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] whitespace-nowrap">Alternative Protocols</p>
                        <div className="flex-1 h-px bg-white/5"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 stagger-entry">
                        {/* Voice Assistant */}
                        <button 
                          onClick={handleVoiceReport}
                          disabled={isAnalyzing}
                          className="group relative glass p-10 rounded-[3rem] border border-white/5 hover:border-rose-500/30 transition-all flex flex-col items-center gap-6 active:scale-95 disabled:opacity-50 shimmer"
                        >
                          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-700 relative">
                            <i className="fa-solid fa-microphone-lines text-3xl"></i>
                            {isAnalyzing && robotMood === 'scanning' && <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping"></div>}
                          </div>
                          <div className="text-center">
                            <h5 className="text-2xl font-black text-white tracking-tight">Neural Voice</h5>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Dictate issue frame</p>
                          </div>
                        </button>

                        {/* Text Dispatch Chatbox */}
                        <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col gap-6 text-left shimmer">
                          <div className="flex items-center gap-4 mb-2">
                             <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 shadow-inner"><i className="fa-solid fa-terminal text-base"></i></div>
                             <h5 className="text-base font-black text-white uppercase tracking-widest">Neural Dispatch</h5>
                          </div>
                          <textarea 
                            value={textDispatchInput}
                            onChange={(e) => setTextDispatchInput(e.target.value)}
                            placeholder="Describe anomaly..."
                            className="w-full bg-slate-950/60 border border-white/10 rounded-[2rem] py-5 px-6 text-white text-xs focus:border-blue-500/50 outline-none transition-all resize-none h-32"
                          />
                          <button 
                            onClick={handleTextReport}
                            disabled={!textDispatchInput.trim() || isAnalyzing}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl btn-neural flex items-center justify-center gap-3 disabled:opacity-30"
                          >
                             {isAnalyzing && robotMood === 'thinking' ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                             {isAnalyzing && robotMood === 'thinking' ? 'ANALYZING' : 'BROADCAST REPORT'}
                          </button>
                        </div>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-12 text-left animate-in slide-in-from-bottom-8 duration-700">
                    <div className="relative rounded-[3.5rem] overflow-hidden shadow-4xl border border-white/10 shimmer">
                      <img src={previewUrl} className="w-full object-cover max-h-[600px] transition-transform duration-[2000ms] hover:scale-110" alt="Preview" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-md flex flex-col items-center justify-center">
                          <div className="scanner-line"></div>
                          <p className="text-white font-black text-xs uppercase tracking-[0.8em] mt-12 animate-pulse">Running Diagnostic Protocols...</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Additional Context (Optional)</label>
                        <VoiceInput onTranscript={(t) => setUserNotes(prev => prev + ' ' + t)} className="w-14 h-14 shadow-lg shadow-rose-500/10" />
                      </div>
                      <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} placeholder="Speak or type extra details..." className="w-full bg-slate-950/60 border border-white/10 rounded-[2.5rem] py-7 px-8 text-white text-base focus:border-blue-500/50 outline-none transition-all resize-none h-40 shadow-inner" />
                    </div>
                    <div className="flex flex-col gap-5">
                      <button onClick={submitReport} className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black text-sm shadow-2xl btn-neural disabled:opacity-50 flex items-center justify-center gap-5" disabled={isAnalyzing}>
                         {isAnalyzing ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : <i className="fa-solid fa-cloud-arrow-up text-xl"></i>}
                         <span className="tracking-[0.3em]">{isAnalyzing ? 'UPLINKING...' : 'INITIATE ANALYSIS'}</span>
                      </button>
                      <button onClick={() => setPreviewUrl(null)} className="py-3 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] hover:text-rose-500 transition-colors w-full text-center">Discard Frame</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
        
        {activeTab === 'library' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="flex items-center gap-6">
                <CuteRobot type="book" className="w-32 h-32 floating" />
                <div>
                  <h2 className="text-6xl font-black text-white tracking-tighter">Library <span className="gradient-text">Nexus</span></h2>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-3 opacity-70">Suggest Books & Expand Knowledge</p>
                </div>
              </div>
              {user.role === 'student' && (
                <div className="flex gap-5">
                   <div className="glass p-2 rounded-3xl flex border border-white/10 shadow-2xl shimmer">
                      <input type="text" placeholder="Title" value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} className="bg-transparent px-6 py-3 text-sm text-white outline-none w-40 md:w-56" />
                      <input type="text" placeholder="Author" value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} className="bg-transparent px-6 py-3 text-sm text-white outline-none border-l border-white/5 w-40" />
                      <button onClick={suggestBook} className="bg-cyan-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest btn-neural">Suggest</button>
                   </div>
                </div>
              )}
            </div>

             <div className="relative max-w-md mx-auto md:mx-0">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input 
                type="text" 
                placeholder="Search repository..." 
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-[2rem] py-4 pl-14 pr-6 text-white text-sm focus:border-cyan-500/50 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-entry">
              {filteredBooks.map(book => (
                <div key={book.id} className="glass p-8 rounded-[2.5rem] border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 group relative overflow-hidden bg-slate-900/40">
                   <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 ${
                         book.status === 'Purchased' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         book.status === 'In-Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                         'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                       }`}>
                         {book.status}
                       </span>
                       <div className="flex flex-col items-end">
                         <span className="text-3xl font-black text-white leading-none">{book.votes}</span>
                         <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Votes</span>
                       </div>
                     </div>
                     
                     <div className="mb-8">
                        <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-slate-400 font-medium italic">by {book.author}</p>
                     </div>
                     
                     <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-[10px] font-black text-cyan-400 shadow-inner">
                             {book.suggestedBy.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Suggested by</span>
                             <span className="text-[10px] font-bold text-slate-300">{book.suggestedBy}</span>
                           </div>
                        </div>
                        
                        <button 
                          onClick={() => voteForBook(book.id)}
                          className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-600/10 hover:text-cyan-400 text-slate-500 transition-all flex items-center justify-center shadow-lg active:scale-95 group/btn"
                        >
                          <i className="fa-solid fa-thumbs-up text-sm group-hover/btn:scale-125 transition-transform"></i>
                        </button>
                     </div>
                   </div>
                </div>
              ))}
              
              {filteredBooks.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                     <i className="fa-solid fa-book-open text-3xl text-slate-600"></i>
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Repository Empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-6">
                 <i className="fa-solid fa-trophy text-amber-500"></i>
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Elite Personnel</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter mb-4">Nexus <span className="gradient-text">Leaderboard</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Top performing units in the matrix</p>
            </div>

            <div className="glass rounded-[3rem] border border-white/5 overflow-hidden shadow-4xl relative">
               <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-7 pl-4">Identity</div>
                  <div className="col-span-3 text-right pr-4">Neural Credits</div>
               </div>

               <div className="divide-y divide-white/5">
                  {leaderboard.map((user, index) => (
                    <div key={user.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors group">
                       <div className="col-span-2 flex justify-center">
                          {index === 0 ? (
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                              <i className="fa-solid fa-crown"></i>
                            </div>
                          ) : index === 1 ? (
                            <div className="w-10 h-10 rounded-full bg-slate-400/20 flex items-center justify-center text-slate-300 border border-slate-400/30">
                              <i className="fa-solid fa-medal"></i>
                            </div>
                          ) : index === 2 ? (
                            <div className="w-10 h-10 rounded-full bg-orange-700/20 flex items-center justify-center text-orange-600 border border-orange-700/30">
                              <i className="fa-solid fa-medal"></i>
                            </div>
                          ) : (
                            <span className="text-xl font-black text-slate-600 font-mono">#{index + 1}</span>
                          )}
                       </div>
                       
                       <div className="col-span-7 flex items-center gap-4 pl-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-blue-500 font-black shadow-inner overflow-hidden shrink-0">
                             {user.profileImage ? (
                               <img src={user.profileImage} className="w-full h-full object-cover" alt={user.name} />
                             ) : (
                               user.name.charAt(0)
                             )}
                          </div>
                          <div className="min-w-0">
                             <h4 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">{user.name}</h4>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">{user.department || user.role}</p>
                          </div>
                       </div>

                       <div className="col-span-3 text-right pr-4">
                          <span className="text-xl font-black text-blue-400">{user.points || 0}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
