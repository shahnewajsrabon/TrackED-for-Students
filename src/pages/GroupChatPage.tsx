import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { Group, Message, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Send, ArrowLeft, Users, Trophy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { createGoogleMeet } from '@/lib/googleApi';
import ReactMarkdown from 'react-markdown';

export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Record<string, User>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [creatingMeet, setCreatingMeet] = useState(false);
  
  const hasGoogleToken = !!sessionStorage.getItem('google_access_token');
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const loadGroupData = async () => {
      try {
        const docRef = doc(db, 'groups', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Group not found');
        const gData = { id: docSnap.id, ...docSnap.data() } as Group;
        setGroup(gData);

        const memMap: Record<string, User> = {};
        if (gData.member_ids.length > 0) {
           const uQuery = query(collection(db, 'users'), where('id', 'in', gData.member_ids));
           const uSnap = await getDocs(uQuery);
           uSnap.forEach(d => { memMap[d.id] = d.data() as User; });
        }
        setMembers(memMap);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        let sessData: any[] = [];
        if (gData.member_ids.length > 0) {
           const sQuery = query(
             collection(db, 'sessions'), 
             where('user_id', 'in', gData.member_ids),
             where('started_at', '>=', startOfWeek.toISOString())
           );
           const sSnap = await getDocs(sQuery);
           sSnap.forEach(d => sessData.push(d.data()));
        }

        const hoursMap: Record<string, number> = {};
        sessData.forEach(s => {
          hoursMap[s.user_id] = (hoursMap[s.user_id] || 0) + s.duration_mins;
        });

        const lb = Object.values(memMap).map(m => ({
          ...m,
          hours: (hoursMap[m.id] || 0) / 60
        })).sort((a,b) => b.hours - a.hours);
        setLeaderboard(lb);

      } catch (err: any) {
        toast.error('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();

    const mQuery = query(collection(db, 'messages'), where('group_id', '==', id), orderBy('created_at', 'asc'), limit(100));
    const unsubscribe = onSnapshot(mQuery, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Optionally fetch missing user details if needed, but we rely on members map for now
      setMessages(msgs);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => { unsubscribe(); };
  }, [id, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;
    
    const txt = newMessage;
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'messages'), {
        group_id: id,
        user_id: user.uid,
        content: txt,
        created_at: new Date().toISOString()
      });
    } catch(e) {
      toast.error('Error sending message');
    }
  };

  const startFocusRoom = async () => {
    if (!user || !id) return;
    
    setCreatingMeet(true);
    let msg = `🎯 ${members[user.uid]?.display_name || 'I'} started a focus room! Join on /timer`;
    
    if (hasGoogleToken) {
      const meetRes = await createGoogleMeet(`Focus Room: ${group?.name || 'Group'}`, new Date().toISOString());
      if (meetRes.success) {
        msg = `🎯 ${members[user.uid]?.display_name || 'I'} started a focus room!\n\nJoin the Google Meet: [${meetRes.meetLink}](${meetRes.meetLink})\n\nThen start your timer on /timer`;
      } else {
        toast.error('Failed to create Meet link. Proceeding without it.');
      }
    }
    
    try {
      await addDoc(collection(db, 'messages'), {
        group_id: id,
        user_id: user.uid,
        content: msg,
        created_at: new Date().toISOString()
      });
      toast.success('Broadcasted focus room!');
    } catch (e) {
      toast.error('Error starting focus room');
    } finally {
      setCreatingMeet(false);
    }
  };

  if (loading || !group) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-h-[1000px]">
      
      {/* Header */}
      <div className="bg-brand-surface border text-sm md:text-base border-brand-border p-4 rounded-t-2xl flex items-center justify-between shrink-0 mb-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link to="/groups" className="p-2 hover:bg-gray-100 rounded-lg text-brand-text-secondary hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold flex items-center gap-2">{group.name} {group.is_private && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-medium">Private</span>}</h1>
            <div className="flex items-center gap-3 text-xs text-brand-text-secondary mt-0.5 font-medium">
              <span>{group.subject}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_ids.length} members</span>
              {group.is_private && <span>Code: <code className="bg-gray-100 px-1 py-0.5 rounded select-all font-mono">{group.invite_code}</code></span>}
            </div>
          </div>
        </div>
        <button 
          onClick={startFocusRoom}
          disabled={creatingMeet}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
        >
          {creatingMeet ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Start Focus Room
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        
        {/* Chat Area */}
        <div className="flex-1 bg-white border border-brand-border rounded-2xl flex flex-col overflow-hidden shadow-sm h-[400px] md:h-auto">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-brand-bg/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-brand-text-secondary text-sm">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">👋</div>
                 Say hello to the group!
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => {
                  const isMe = m.user_id === user?.uid;
                  const author = m.users || members[m.user_id];
                  const dName = author?.display_name || 'Unknown';
                  const initials = dName.charAt(0).toUpperCase();
                  const showAvatar = i === 0 || messages[i-1].user_id !== m.user_id;

                  return (
                    <div key={m.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 self-end mb-1">
                          {author?.avatar_url ? <img src={author.avatar_url} className="w-full h-full rounded-full object-cover" /> : initials}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <span className="text-[10px] font-medium text-brand-text-secondary mb-1 px-1">
                            {isMe ? 'You' : dName} • {format(new Date(m.created_at), 'HH:mm')}
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-200 text-brand-text-primary rounded-bl-sm'} markdown-body-chat`}>
                          <ReactMarkdown components={{
                            a: ({ node, ...props }) => <a {...props} className="underline font-medium hover:opacity-80" target="_blank" rel="noreferrer" />,
                            p: ({ node, ...props }) => <p {...props} className="m-0" />
                          }}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>
          
          <div className="p-3 md:p-4 bg-white border-t border-brand-border shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-primary text-white p-3 rounded-xl disabled:opacity-50 transition-colors shadow-sm disabled:shadow-none hover:bg-primary/90"
              >
                <Send className="w-5 h-5 absolute -translate-x-[2px] opacity-0" />
                <Send className="w-5 h-5 -ml-0.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="w-full md:w-72 bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm shrink-0 flex flex-col h-[300px] md:h-auto">
          <div className="p-4 border-b border-brand-border bg-gray-50 shrink-0">
            <h3 className="font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-warning" /> This Week's Leaders</h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            <div className="space-y-4">
              {leaderboard.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold text-gray-400 text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full rounded-full object-cover" /> : m.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{m.display_name}</div>
                    <div className="text-xs text-brand-text-secondary">{m.hours.toFixed(1)} hrs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-brand-border bg-indigo-50/50">
             <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex justify-between items-center">
                <span>Group Challenge</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">Active</span>
             </div>
             <p className="text-sm font-semibold text-gray-900 mb-1">10 Hours of {group.subject}</p>
             <p className="text-xs text-gray-500 mb-3">Goal: Everyone studies {group.subject} for 10 hours this week.</p>
             <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 opacity-80">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (leaderboard.reduce((acc, curr) => acc + curr.hours, 0) / (Object.keys(members).length || 1) / 10) * 100)}%` }}></div>
             </div>
             <p className="text-[10px] text-right text-gray-400 font-medium">Team Progress</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
