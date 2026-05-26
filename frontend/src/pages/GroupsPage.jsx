import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getInitials } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import groupService from '../services/groupService';
import conversationService from '../services/conversationService';

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.groups-main{min-width:0;padding:24px 28px 90px;}

/* Page header */
.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.ph-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;}
.btn-fire{height:36px;padding:0 20px;background:var(--grad-fire);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:8px;box-shadow:0 3px 14px var(--red-glow);}
.btn-fire:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.btn-fire:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-outline{height:36px;padding:0 18px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px;}
.btn-outline:hover{background:var(--s3);color:var(--t1);}

/* Tabs */
.gtabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:18px;}
.gtab{padding:11px 22px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;transition:all .2s;position:relative;}
.gtab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.gtab:hover{color:var(--t2);}
.gtab.on{color:var(--t1);}
.gtab.on::after{transform:scaleX(1);}

/* Group grid */
.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}

/* Group card */
.gcard{
  background:var(--s1);border:1px solid var(--b1);border-radius:14px;
  overflow:hidden;transition:border-color .2s,box-shadow .2s,transform .2s;
  cursor:pointer;animation:gc-up .35s var(--ease) both;
  display:flex;flex-direction:column;
}
.gcard:hover{border-color:rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.25);transform:translateY(-2px);}
@keyframes gc-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.gc-banner{
  height:72px;
  background:linear-gradient(135deg,rgba(232,25,44,.2),rgba(255,107,53,.12));
  position:relative;display:flex;align-items:flex-end;padding:10px 14px;
}
.gc-type-badge{
  font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;
  padding:3px 8px;border-radius:4px;font-family:var(--fm);
}
.gc-type-class  {background:rgba(74,158,255,.2);color:#4a9eff;}
.gc-type-club   {background:rgba(34,197,94,.2);color:#22c55e;}
.gc-type-society{background:rgba(155,89,245,.2);color:#9b59f5;}
.gc-type-general{background:rgba(201,168,76,.2);color:var(--gold);}

.gc-body{padding:14px;flex:1;display:flex;flex-direction:column;}
.gc-name{font-size:16px;font-weight:800;margin-bottom:4px;line-height:1.3;}
.gc-desc{font-size:12px;color:var(--t3);line-height:1.6;flex:1;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.gc-foot{display:flex;align-items:center;justify-content:space-between;}
.gc-members{font-size:11px;color:var(--t3);font-family:var(--fm);display:flex;align-items:center;gap:4px;}
.gc-priv{font-size:10px;color:var(--t4);font-family:var(--fm);}

/* Join / Leave button */
.join-btn{
  height:30px;padding:0 14px;border-radius:7px;
  font-size:11px;font-weight:800;font-family:var(--fb);letter-spacing:.6px;
  cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;
}
.join-btn.join{background:var(--red-sub);color:var(--red);border:1px solid var(--red-border);}
.join-btn.join:hover{background:var(--red);color:#fff;}
.join-btn.leave{background:var(--s3);color:var(--t2);border:1px solid var(--b2);}
.join-btn.leave:hover{background:var(--s4);color:var(--t1);}
.join-btn:disabled{opacity:.4;cursor:not-allowed;}

/* Skeleton */
.gskel{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;}

/* CREATE MODAL */
.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mfdin .2s var(--ease);}
@keyframes mfdin{from{opacity:0}to{opacity:1}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:480px;overflow:hidden;animation:mslup .25s var(--ease);}
@keyframes mslup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05) 0%,transparent 70%);}
.modal-title{font-family:var(--fd);font-size:20px;letter-spacing:3px;}
.modal-close{width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--t3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.modal-close:hover{background:var(--s3);color:var(--t1);}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
.mfield label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-bottom:6px;}
.mfield input,.mfield textarea,.mfield select{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;resize:vertical;}
.mfield input:focus,.mfield textarea:focus,.mfield select:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.mfield input::placeholder,.mfield textarea::placeholder{color:var(--t4);}
.mfield select option{background:var(--s2);}
.mfield-row{display:flex;gap:12px;}
.mfield-row .mfield{flex:1;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--s2);border:1px solid var(--b1);border-radius:8px;}
.toggle-label{font-size:13px;font-weight:600;color:var(--t2);}
.toggle-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.toggle{position:relative;width:38px;height:22px;flex-shrink:0;}
.toggle input{opacity:0;width:0;height:0;}
.toggle-slider{position:absolute;inset:0;background:var(--s4);border-radius:22px;cursor:pointer;transition:background .2s;}
.toggle-slider::before{content:'';position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform .2s;}
.toggle input:checked + .toggle-slider{background:var(--red);}
.toggle input:checked + .toggle-slider::before{transform:translateX(16px);}
.modal-err{font-size:12px;color:var(--red);background:var(--red-sub);border:1px solid var(--red-border);border-radius:6px;padding:7px 12px;}
.modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:0 22px 20px;}
`;

/* ─── Group type colors ─────────────────────────────────────────────────── */
const TYPE_STYLE = {
  class:   { label: 'Class',   cls: 'gc-type-class',   banner: 'linear-gradient(135deg,rgba(74,158,255,.2),rgba(74,158,255,.05))' },
  club:    { label: 'Club',    cls: 'gc-type-club',    banner: 'linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.05))' },
  society: { label: 'Society', cls: 'gc-type-society', banner: 'linear-gradient(135deg,rgba(155,89,245,.2),rgba(155,89,245,.05))' },
  general: { label: 'General', cls: 'gc-type-general', banner: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.05))' },
};

/* ─── GroupCard ───────────────────────────────────────────────────────────── */
function GroupCard({ group, isMember, onJoin, onLeave, onChat, joining }) {
  const navigate = useNavigate();
  const ts = TYPE_STYLE[group.type] || TYPE_STYLE.general;

  const handleAction = (e) => {
    e.stopPropagation();
    isMember ? onLeave(group.id) : onJoin(group.id);
  };

  return (
    <div
      className="gcard"
      style={{ animationDelay: `${Math.random() * 100}ms` }}
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      <div className="gc-banner" style={{ background: ts.banner }}>
        <span className={`gc-type-badge ${ts.cls}`}>{ts.label}</span>
        {group.isPrivate && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--t4)' }}>🔒</span>}
      </div>
      <div className="gc-body">
        <div className="gc-name">{group.name}</div>
        <div className="gc-desc">{group.description || 'No description provided.'}</div>
        <div className="gc-foot">
          <span className="gc-members">👥 {group.memberCount ?? 0} member{group.memberCount !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {isMember && (
              <button
                className="join-btn join"
                style={{ background: 'rgba(155,89,245,.15)', color: '#9b59f5', borderColor: 'rgba(155,89,245,.3)' }}
                onClick={e => { e.stopPropagation(); onChat(group); }}
              >
                💬
              </button>
            )}
            <button
              className={`join-btn ${isMember ? 'leave' : 'join'}`}
              onClick={handleAction}
              disabled={joining === group.id}
            >
              {joining === group.id ? '…' : isMember ? '✓ Joined' : group.isPrivate ? '🔒 Request' : '+ Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GroupSkeleton ───────────────────────────────────────────────────────── */
function GroupSkeleton() {
  return (
    <div className="group-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="gskel">
          <div style={{ height: 72, background: 'var(--s2)' }} />
          <div style={{ padding: 14 }}>
            <div className="sk" style={{ height: 16, width: '65%', marginBottom: 8, borderRadius: 5 }} />
            <div className="sk" style={{ height: 11, width: '100%', marginBottom: 5, borderRadius: 4 }} />
            <div className="sk" style={{ height: 11, width: '80%', marginBottom: 14, borderRadius: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="sk" style={{ height: 10, width: '35%', borderRadius: 4 }} />
              <div className="sk" style={{ height: 30, width: 70, borderRadius: 7 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── CreateModal ─────────────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreate, creating }) {
  const [form, setForm] = useState({
    name: '', description: '', type: 'general', isPrivate: false,
  });
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setErr('Group name is required.'); return; }
    setErr('');
    try { await onCreate(form); }
    catch (e) { setErr(e?.response?.data?.message || 'Failed to create group.'); }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Create Group</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="modal-err">⚠ {err}</div>}
          <div className="mfield">
            <label>Group Name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. CS Algorithm Study Group"
            />
          </div>
          <div className="mfield">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What is this group about?"
            />
          </div>
          <div className="mfield-row">
            <div className="mfield">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="general">General</option>
                <option value="class">Class</option>
                <option value="club">Club</option>
                <option value="society">Society</option>
              </select>
            </div>
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Private Group</div>
              <div className="toggle-sub">Members must request to join</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={e => set('isPrivate', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-fire" onClick={submit} disabled={creating}>
            {creating ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── GroupsPage ──────────────────────────────────────────────────────────── */
export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.userId ?? user?.id;

  const [tab,        setTab]        = useState('discover');
  const [groups,     setGroups]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [joined,     setJoined]     = useState(new Set());
  const [joining,    setJoining]    = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      groupService.getGroups().catch(() => ({ data: [] })),
      groupService.getMyGroups().catch(() => ({ data: [] })),
    ]).then(([allRes, myRes]) => {
      const all = allRes?.data ?? allRes;
      const my  = myRes?.data  ?? myRes;
      const allGroups = Array.isArray(all) ? all : (all?.content ?? []);
      const myList    = Array.isArray(my)  ? my  : (my?.content  ?? []);
      setGroups(allGroups);
      setJoined(new Set(myList.map(g => g.id)));
    }).finally(() => setLoading(false));
  }, [uid]);

  const handleJoin = async (groupId) => {
    setJoining(groupId);
    try {
      await groupService.joinGroup(groupId);
      setJoined(prev => new Set([...prev, groupId]));
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, memberCount: (g.memberCount ?? 0) + 1 } : g
      ));
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not join group.');
    } finally { setJoining(null); }
  };

  const handleLeave = async (groupId) => {
    setJoining(groupId);
    try {
      await groupService.leaveGroup(groupId);
      setJoined(prev => { const s = new Set(prev); s.delete(groupId); return s; });
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, memberCount: Math.max(0, (g.memberCount ?? 1) - 1) } : g
      ));
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not leave group.');
    } finally { setJoining(null); }
  };

  const handleCreate = async (form) => {
    setCreating(true);
    try {
      const res = await groupService.createGroup(form);
      const created = res?.data ?? res;
      setGroups(prev => [created, ...prev]);
      setJoined(prev => new Set([...prev, created.id]));
      setCreateOpen(false);
    } finally { setCreating(false); }
  };

  const openGroupChat = async (group) => {
    try {
      const token = localStorage.getItem('learnex_auth')
        ? JSON.parse(localStorage.getItem('learnex_auth')).token
        : '';
      const membersRes = await fetch(`/api/groups/${group.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const membersData = await membersRes.json();
      const members = membersData?.data ?? membersData;
      const memberIds = (Array.isArray(members) ? members : [])
        .map(m => m.userId)
        .filter(id => id !== uid);
      const res  = await conversationService.startGroupConversation(group.name, memberIds);
      const conv = res?.data ?? res;
      navigate(`/messages/${conv.id}`);
    } catch {
      navigate('/messages');
    }
  };

  const displayed = tab === 'mine'
    ? groups.filter(g => joined.has(g.id))
    : groups;

  return (
    <>
      <style>{css}</style>
      <Layout active="groups">
        <main className="groups-main">
          <div className="ph">
            <span className="ph-title">Groups</span>
            <button className="btn-fire" onClick={() => setCreateOpen(true)}>
              + Create Group
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(232,25,44,.1)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: 'var(--red)', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <div className="gtabs">
            <button className={`gtab ${tab === 'discover' ? 'on' : ''}`} onClick={() => setTab('discover')}>
              Discover
            </button>
            <button className={`gtab ${tab === 'mine' ? 'on' : ''}`} onClick={() => setTab('mine')}>
              My Groups {joined.size > 0 && `(${joined.size})`}
            </button>
          </div>

          {loading ? <GroupSkeleton /> : displayed.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">{tab === 'mine' ? '👥' : '🔍'}</div>
              <div className="lx-empty-t">{tab === 'mine' ? 'No Groups Yet' : 'No Groups Found'}</div>
              <p className="lx-empty-s">
                {tab === 'mine'
                  ? 'Join a group from the Discover tab or create your own.'
                  : 'No groups have been created yet. Be the first!'}
              </p>
            </div>
          ) : (
            <div className="group-grid">
              {displayed.map((g, i) => (
                <div key={g.id} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <GroupCard
                    group={g}
                    isMember={joined.has(g.id)}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onChat={openGroupChat}
                    joining={joining}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </Layout>

      {createOpen && (
        <CreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          creating={creating}
        />
      )}
    </>
  );
}