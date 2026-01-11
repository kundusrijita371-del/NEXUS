import React, { useState, useRef, useEffect } from 'react';
import { Reel, UserRole, ReelCategory } from '../types';

interface ReelCardProps {
  reel: Reel;
  userRole: UserRole;
  onLike: (id: string) => void;
  onAddComment: (reelId: string, text: string) => void;
  onToggleEnabled?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({ 
  reel, 
  userRole, 
  onLike, 
  onAddComment,
  onToggleEnabled,
  onDelete
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAdmin = userRole === 'admin';

  const categoryColors: Record<ReelCategory, string> = {
    'Resolved Issue': 'blue',
    'Alert': 'rose',
    'Awareness': 'emerald',
    'Achievement': 'amber'
  };

  const color = categoryColors[reel.category] || 'blue';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset video state when URL changes
    setIsLoading(true);
    video.load();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Attempt to play only if the element is actually in view
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => {
      observer.unobserve(video);
      observer.disconnect();
    };
  }, [reel.videoUrl]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(reel.id, commentText);
      setCommentText('');
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  return (
    <div className={`relative w-full h-[80vh] max-w-md mx-auto rounded-[3.5rem] overflow-hidden shadow-4xl border transition-all duration-500 group bg-slate-950
      ${!reel.isEnabled && isAdmin ? 'opacity-60 grayscale-[0.5] border-white/10' : `border-${color}-500/20`}
    `}>
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Syncing Stream...</p>
        </div>
      )}

      <video
        key={reel.videoUrl}
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-cover cursor-pointer"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoading(false)}
        onClick={togglePlay}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none opacity-80"></div>

      {/* Top Controls */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-20">
        <div className={`px-4 py-2 rounded-2xl glass border border-${color}-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl`}>
          <span className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}></span>
          {reel.category}
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={toggleMute}
            className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-lg active:scale-90"
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'} text-xs`}></i>
          </button>
          
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleEnabled?.(reel.id); }}
                className={`w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center shadow-lg transition-all ${reel.isEnabled ? 'text-emerald-400' : 'text-rose-400'}`}
                title={reel.isEnabled ? "Disable Reel" : "Enable Reel"}
              >
                <i className={`fa-solid ${reel.isEnabled ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(reel.id); }}
                className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/20 shadow-lg"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Side Actions */}
      <div className="absolute right-6 bottom-32 flex flex-col gap-6 items-center z-10">
        <div className="flex flex-col items-center gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(reel.id); }}
            className={`w-14 h-14 rounded-full glass border flex items-center justify-center transition-all active:scale-125
              ${reel.isLiked ? `bg-rose-600 border-rose-500 text-white shadow-rose-500/40` : 'border-white/10 text-white hover:bg-white/10'}
            `}
          >
            <i className={`fa-solid fa-heart ${reel.isLiked ? 'animate-bounce' : ''} text-lg`}></i>
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md">{reel.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
            className="w-14 h-14 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:bg-white/10 shadow-xl"
          >
            <i className="fa-solid fa-comment text-lg"></i>
          </button>
          <span className="text-[10px] font-black text-white drop-shadow-md">{reel.comments.length}</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-10 left-8 right-24 pointer-events-none z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
            {reel.adminName.charAt(0)}
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">{reel.adminName}</span>
        </div>
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg line-clamp-2">{reel.title}</h3>
      </div>

      {/* Play indicator */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="w-20 h-20 bg-slate-900/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 animate-pulse">
              <i className="fa-solid fa-play text-white text-3xl ml-1"></i>
           </div>
        </div>
      )}

      {/* Comments Overlay */}
      {showComments && (
        <div className="absolute inset-0 z-30 glass backdrop-blur-3xl animate-in slide-in-from-bottom-full duration-500 flex flex-col">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
            <h4 className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Feedback Stream</h4>
            <button onClick={(e) => { e.stopPropagation(); setShowComments(false); }} className="text-slate-400 hover:text-white transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {reel.comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                <i className="fa-solid fa-comment-slash text-4xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Channel Quiet</p>
              </div>
            ) : (
              reel.comments.map(comment => (
                <div key={comment.id} className="flex gap-4 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white">{comment.userName}</span>
                      <span className="text-[8px] font-bold text-slate-500">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium break-words">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostComment} className="p-8 bg-slate-900/80 border-t border-white/10 backdrop-blur-md">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Broadcast a thought..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-90 shadow-xl shadow-blue-500/20"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
