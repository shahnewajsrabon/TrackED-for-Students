import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { Group } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, Search, Plus, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const { user } = useAuthContext();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discover, setDiscover] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', subject: '', is_private: false });
  const [inviteCode, setInviteCode] = useState('');

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const qMy = query(collection(db, 'groups'), where('member_ids', 'array-contains', user.uid));
      const mySnap = await getDocs(qMy);
      setMyGroups(mySnap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));

      const qPub = query(collection(db, 'groups'), where('is_private', '==', false));
      const pubSnap = await getDocs(qPub);
      const allPub = pubSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group)).filter(g => !g.member_ids.includes(user.uid));
      setDiscover(allPub);
    } catch (e: any) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroup.name || !newGroup.subject) return;
    const invCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroup.name,
        description: newGroup.description,
        subject: newGroup.subject,
        created_by: user.uid,
        member_ids: [user.uid],
        is_private: newGroup.is_private,
        invite_code: invCode,
        created_at: new Date().toISOString()
      });
      toast.success('Group created!');
      setShowCreate(false);
      loadGroups();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleJoin = async (code: string) => {
    if (!user || !code) return;
    try {
      const q = query(collection(db, 'groups'), where('invite_code', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Invalid code');
      const data = snap.docs[0].data() as Group;
      const docId = snap.docs[0].id;
      
      if (data.member_ids.includes(user.uid)) return toast('Already a member');

      const updatedMembers = [...data.member_ids, user.uid];
      await updateDoc(doc(db, 'groups', docId), { member_ids: updatedMembers });
      
      toast.success('Joined group!');
      setInviteCode('');
      loadGroups();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredDiscover = discover.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-brand-text-secondary">Collaborate and compete with friends.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-primary/90 transition-colors flex-1 md:flex-none shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> My Groups</h2>
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(g => (
              <Link to={`/groups/${g.id}`} key={g.id} className="block group">
                <div className="p-5 border border-brand-border rounded-2xl hover:border-primary transition-colors bg-brand-bg group-hover:bg-primary-light">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{g.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-medium bg-white px-2 py-1 rounded border border-gray-200 text-brand-text-secondary">
                      <Users className="w-3 h-3" /> {g.member_ids.length}
                    </div>
                  </div>
                  <div className="inline-flex text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded text-brand-text-secondary mb-3">
                    {g.subject}
                  </div>
                  <p className="text-sm text-brand-text-secondary line-clamp-2">{g.description || 'No description provided.'}</p>
                </div>
              </Link>
            ))}
            {myGroups.length === 0 && (
              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-2xl text-brand-text-secondary">
                You haven't joined any groups yet.
              </div>
            )}
         </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Discover Public Groups</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search groups..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredDiscover.map(g => (
              <div key={g.id} className="flex items-center justify-between p-4 border border-brand-border rounded-2xl">
                <div>
                  <h3 className="font-semibold">{g.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-text-secondary">
                    <span>{g.subject}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {g.member_ids.length}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoin(g.invite_code)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
            {filteredDiscover.length === 0 && (
              <p className="text-center text-sm py-4 text-brand-text-secondary">No public groups found.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-border h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /> Join with Code</h2>
          <p className="text-sm text-brand-text-secondary mb-4">Have an invite code from a friend? Enter it here to join their private group.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. A1B2C3" 
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase text-sm"
            />
            <button 
              onClick={() => handleJoin(inviteCode)}
              className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create Group</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name</label>
                <input required type="text" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} className="w-full p-3 border rounded-2xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject / Topic</label>
                <input required type="text" value={newGroup.subject} onChange={e => setNewGroup({...newGroup, subject: e.target.value})} className="w-full p-3 border rounded-2xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} className="w-full p-3 border rounded-2xl h-20 resize-none" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="private" checked={newGroup.is_private} onChange={e => setNewGroup({...newGroup, is_private: e.target.checked})} className="w-4 h-4 text-primary" />
                <label htmlFor="private" className="text-sm font-medium">Make Private (Invite code only)</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 p-3 bg-gray-100 rounded-2xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 p-3 bg-primary text-white rounded-2xl font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
