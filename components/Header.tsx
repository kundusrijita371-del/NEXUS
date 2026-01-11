import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  activeTab: 'report' | 'dashboard' | 'polls' | 'canteen' | 'departments' | 'library' | 'leaderboard' | 'reels';
  setActiveTab: (tab: 'report' | 'dashboard' | 'polls' | 'canteen' | 'departments' | 'library' | 'leaderboard' | 'reels') => void;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, activeTab, setActiveTab, onLogout, onOpenProfile }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 glass px-4 py-3 md:px-10 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 neon-glow">
            <i className="fa-solid fa-bolt-lightning text-white text-lg"></i>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-black text-white tracking-tight leading-none mb-0.5">NEXUS</h1>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Neural Logistics Unit</p>
          </div>
        </div>
        
        <nav className="flex bg-slate-900/50 backdrop-blur-2xl p-1 rounded-2xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar max-w-[60%] sm:max-w-none">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span className="hidden md:inline">ANALYTICS</span>
          </button>

          <button 
            onClick={() => setActiveTab('reels')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'reels' 
              ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-play"></i>
            <span className="hidden md:inline">VIBES</span>
          </button>
          
          {user.role === 'student' && (
            <button 
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'report' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.05]' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-camera-retro"></i>
              <span className="hidden md:inline">DISPATCH</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'library' 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-book-open"></i>
            <span className="hidden md:inline">LIBRARY</span>
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'leaderboard' 
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-ranking-star"></i>
            <span className="hidden md:inline">RANKS</span>
          </button>

          <button 
            onClick={() => setActiveTab('polls')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'polls' 
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-square-poll-vertical"></i>
            <span className="hidden md:inline">CONSENSUS</span>
          </button>

          <button 
            onClick={() => setActiveTab('canteen')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'canteen' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-utensils"></i>
            <span className="hidden md:inline">CANTEEN</span>
          </button>

          <button 
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2.5 rounded-xl text-[9px] font-black transition-all duration-500 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'departments' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.05]' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            <span className="hidden md:inline">ACADEMICS</span>
          </button>
        </nav>

        <div className="flex items-center gap-4 shrink-0 relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Account Controls"
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1.5px] cursor-pointer hover:shadow-2xl hover:scale-105 transition-all group overflow-hidden"
          >
            <div className="w-full h-full rounded-[9px] bg-slate-900 flex items-center justify-center text-blue-400 font-black text-xs overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-slate-900 border border-white/10 rounded-3xl shadow-4xl z-[100] p-2 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
              <div className="p-4 border-b border-white/5 mb-1">
                <p className="text-[10px] font-black text-white uppercase truncate">{user.name}</p>
                <p className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter">{user.email}</p>
              </div>
              <button 
                onClick={() => {
                  onOpenProfile();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <i className="fa-solid fa-user-pen text-[10px]"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Edit Profile</span>
              </button>
              <button 
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
              >
                <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
