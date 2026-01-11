import React, { useState, useRef, useEffect } from 'react';
import { IssueReport, UserRole } from '../types';

interface ReportCardProps {
  report: IssueReport;
  userRole: UserRole;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, userRole, onToggleStatus, onDelete }) => {
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

  const getSeverityColor = (level: number) => {
    if (level >= 4) return 'rose';
    if (level >= 3) return 'amber';
    return 'blue';
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Electrical': return { icon: 'fa-bolt-lightning', color: 'blue', border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400' };
      case 'Plumbing': return { icon: 'fa-droplet', color: 'cyan', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', text: 'text-cyan-400' };
      case 'Maintenance': return { icon: 'fa-screwdriver-wrench', color: 'indigo', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5', text: 'text-indigo-400' };
      case 'Security': return { icon: 'fa-shield-halved', color: 'violet', border: 'border-violet-500/20', bg: 'bg-violet-500/5', text: 'text-violet-400' };
      case 'Custodial': return { icon: 'fa-broom', color: 'emerald', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400' };
      default: return { icon: 'fa-circle-exclamation', color: 'slate', border: 'border-slate-500/20', bg: 'bg-slate-500/5', text: 'text-slate-400' };
    }
  };

  const theme = getCategoryTheme(report.category);
  const severity = getSeverityColor(report.severity_level);
  const isAdmin = userRole === 'admin';

  return (
    <div className={`group bg-slate-900/40 rounded-[2.5rem] shadow-2xl border ${theme.border} overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:bg-slate-900/60 ${report.status === 'Solved' ? 'opacity-60 grayscale-[0.3]' : ''}`}>
      <div className="relative h-64 overflow-hidden bg-slate-800">
        <img 
          src={report.imageUrl} 
          alt={report.issue_detected} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
        
        <div className="absolute top-5 left-5 flex flex-col gap-2">
           <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl bg-${severity}-500 text-white flex items-center gap-2 neon-glow`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            SEVERITY {report.severity_level}
          </div>
          {report.requires_immediate_action && report.status === 'Pending' && (
            <div className="bg-slate-950/80 backdrop-blur-md text-rose-400 px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 border border-rose-500/30 shadow-xl animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
              PRIORITY
            </div>
          )}
        </div>

        {report.status === 'Solved' && (
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[4px] flex items-center justify-center">
             <div className="bg-slate-900/90 text-blue-400 px-8 py-4 rounded-3xl font-black text-sm shadow-2xl flex items-center gap-3 transform -rotate-2 scale-110 border-2 border-blue-500/30">
                <i className="fa-solid fa-circle-check text-xl"></i>
                DISPATCHED
             </div>
          </div>
        )}
      </div>

      <div className={`p-8 ${theme.bg}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-slate-950 border ${theme.border} flex items-center justify-center ${theme.text} shadow-inner`}>
              <i className={`fa-solid ${theme.icon} text-lg`}></i>
            </div>
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-70`}>{report.category}</p>
              <p className="text-[10px] text-slate-500 font-bold">{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest uppercase shadow-sm ${report.status === 'Solved' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
            {report.status}
          </div>
        </div>

        <h3 className="text-xl font-black text-white mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors tracking-tight">{report.issue_detected}</h3>
        
        <div className="space-y-5">
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 shadow-inner">
            <p className="text-slate-300 text-sm leading-relaxed italic font-medium">"{report.action_required}"</p>
          </div>

          {report.status === 'Pending' && (
            <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 flex-shrink-0">
                <i className="fa-solid fa-shield-heart"></i>
              </div>
              <div>
                <span className="text-rose-400 font-black uppercase text-[10px] tracking-widest block mb-1">Safety Warning</span>
                <p className="text-[11px] text-rose-300/80 font-semibold leading-snug">
                  {report.safety_warning_for_student}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex gap-3 items-center relative" ref={menuRef}>
          {isAdmin ? (
            <button 
              onClick={() => onToggleStatus(report.id)}
              className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all duration-300 shadow-lg active:scale-95 ${
                report.status === 'Pending' 
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20' 
                : 'bg-slate-800 text-blue-400 border border-blue-500/20 hover:bg-slate-700'
              }`}
            >
              {report.status === 'Pending' ? 'FINALIZE TICKET' : 'RE-OPEN TASK'}
            </button>
          ) : (
            <div className="flex-1 py-4 rounded-2xl text-xs font-black bg-slate-800 text-slate-500 border border-white/5 text-center cursor-default">
              STATUS: {report.status.toUpperCase()}
            </div>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-14 h-14 bg-slate-950 border border-white/5 rounded-2xl text-slate-600 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center shadow-sm"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-3 w-56 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl z-20 p-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="p-4 text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Delete Entry?</p>
                 <button 
                  onClick={() => {
                    onDelete(report.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-500 transition-colors shadow-lg shadow-rose-950/50"
                >
                  PURGE DATA
                </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};