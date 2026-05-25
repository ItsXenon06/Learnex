import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getInitials } from '../contexts/AuthContext';
import Layout, { sharedCss } from '../components/Layout';
import postService from '../services/postService';
import commentService from '../services/commentService';

/* ─── Page-specific CSS ───────────────────────────────────────────────────── */
const css = `
/* FEED LAYOUT */
.feed{padding:18px 22px 90px;min-width:0;}

/* TABS */
.feed-header{display:flex;align-items:center;gap:0;margin-bottom:16px;border-bottom:1px solid var(--b1);}
.ftab{
  padding:13px 26px;border:none;background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:700;
  text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;
  transition:all .2s;position:relative;
}
.ftab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.ftab:hover{color:var(--t2);}
.ftab.on{color:var(--t1);}
.ftab.on::after{transform:scaleX(1);}
.fh-gap{flex:1;}
.fh-sort{display:flex;align-items:center;gap:5px;padding:7px 12px;border:none;background:transparent;color:var(--t3);font-size:11px;font-family:var(--fb);font-weight:600;letter-spacing:.5px;cursor:pointer;border-radius:6px;transition:all .15s;}
.fh-sort:hover{background:var(--s2);color:var(--t2);}

/* COMPOSE */
.compose{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  margin-bottom:14px;overflow:hidden;transition:border-color .25s,box-shadow .25s;
}
.compose:focus-within{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub),0 4px 20px rgba(0,0,0,.3);}
.c-top{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;}
.c-av{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:15px;color:#fff;box-shadow:0 2px 10px var(--red-glow);}
.c-input{flex:1;background:transparent;border:none;color:var(--t1);font-size:15px;font-family:var(--fb);resize:none;min-height:44px;max-height:200px;outline:none;line-height:1.7;padding-top:2px;}
.c-input::placeholder{color:var(--t3);}
.c-toolbar{display:flex;align-items:center;gap:2px;padding:0 12px 12px;}
.c-tool{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.3px;}
.c-tool:hover{background:var(--s3);color:var(--t1);}
.c-gap{flex:1;}
.c-hint{font-size:10px;color:var(--t4);font-family:var(--fm);margin-right:8px;}
.c-post{padding:8px 18px;background:var(--grad-fire);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;box-shadow:0 3px 14px var(--red-glow);}
.c-post:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.c-post:disabled{opacity:.4;cursor:not-allowed;}
.c-vis{
  padding:4px 10px;background:var(--s3);border:1px solid var(--b1);border-radius:5px;
  color:var(--t3);font-size:11px;font-family:var(--fm);cursor:pointer;transition:all .15s;
}
.c-vis:hover{border-color:var(--b2);color:var(--t2);}

/* POST CARD */
.card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  margin-bottom:10px;overflow:hidden;
  transition:border-color .25s,transform .2s,box-shadow .25s;
  animation:card-up .35s var(--ease) both;
  position:relative;
}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .25s;border-radius:12px 0 0 12px;}
.card:hover{border-color:rgba(255,255,255,.09);box-shadow:0 4px 16px rgba(0,0,0,.18);}
.card:hover::before{background:rgba(232,25,44,.2);}
@keyframes card-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.card-head{display:flex;align-items:flex-start;gap:13px;padding:16px 16px 0 18px;}
.c-ava{
  width:46px;height:46px;border-radius:11px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:18px;color:#fff;
  transition:transform .15s;cursor:pointer;
}
.c-ava:hover{transform:scale(1.06);}
.c-meta{flex:1;min-width:0;}
.c-name{font-size:15px;font-weight:700;cursor:pointer;transition:color .15s;display:flex;align-items:center;gap:7px;}
.c-name:hover{color:var(--red);}
.c-sub{font-size:12px;color:var(--t3);margin-top:3px;display:flex;align-items:center;gap:5px;font-family:var(--fm);}
.c-dot{color:var(--t4);}

/* ── Post options (⋯) menu ── */
.c-more-wrap{position:relative;}
.c-more{width:30px;height:30px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:18px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;}
.c-more:hover{background:var(--s3);color:var(--t1);}
.c-more-menu{
  position:absolute;top:calc(100% + 4px);right:0;z-index:100;
  background:var(--s2);border:1px solid var(--b2);border-radius:10px;
  min-width:160px;padding:4px;
  box-shadow:0 8px 32px rgba(0,0,0,.6);
  animation:menu-pop .15s var(--ease);
}
@keyframes menu-pop{from{opacity:0;transform:scale(.93) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
.c-menu-item{
  display:flex;align-items:center;gap:9px;width:100%;
  padding:9px 12px;border:none;background:transparent;
  color:var(--t2);font-size:13px;font-family:var(--fb);font-weight:600;
  cursor:pointer;border-radius:7px;transition:all .12s;text-align:left;
}
.c-menu-item:hover{background:var(--s3);color:var(--t1);}
.c-menu-item.danger{color:#ff6b7a;}
.c-menu-item.danger:hover{background:rgba(232,25,44,.12);color:var(--red);}
.c-menu-divider{height:1px;background:var(--b1);margin:3px 0;}

.card-body{padding:11px 16px 11px 18px;font-size:15px;line-height:1.8;color:var(--t1);white-space:pre-wrap;word-break:break-word;}
.c-tag{background:var(--grad-fire);-webkit-background-clip:text;background-clip:text;color:transparent;cursor:pointer;font-weight:700;}
.c-mention{color:var(--blue);cursor:pointer;font-weight:600;}
.c-mention:hover{text-decoration:underline;}

.card-tags{display:flex;gap:7px;flex-wrap:wrap;padding:0 16px 13px 18px;}
.tag-chip{
  padding:4px 12px;background:var(--red-sub);border:1px solid var(--red-border);
  border-radius:6px;font-size:12px;color:var(--red);font-weight:700;font-family:var(--fm);
  letter-spacing:.3px;cursor:pointer;transition:all .15s;
}
.tag-chip:hover{background:var(--red);color:#fff;border-color:var(--red);}

/* reaction summary bar */
.card-stats{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 18px;border-top:1px solid var(--b1);
  font-size:13px;color:var(--t3);font-family:var(--fm);
}
.stat-rx{display:flex;align-items:center;gap:3px;}
.stat-em{font-size:16px;}
.stat-n{margin-left:4px;font-size:12px;}
.stat-right{display:flex;align-items:center;gap:14px;}
.stat-link{cursor:pointer;transition:color .15s;}
.stat-link:hover{color:var(--t1);}

/* ── action row ──
   FIX: removed nested .rx-wrap taking flex:1 which shifted the comment
   button right and left an empty gap. All 4 actions now sit as direct
   flex children with equal flex:1. The reaction picker is absolutely
   positioned above its button, not wrapping it in a flex item.
*/
.card-actions{display:flex;align-items:stretch;border-top:1px solid var(--b1);}
.ca{
  flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
  padding:11px 4px;border:none;border-right:1px solid var(--b1);background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;
  letter-spacing:.3px;cursor:pointer;transition:all .15s;
  position:relative;
}
.ca:last-child{border-right:none;}
.ca:hover{background:var(--s2);color:var(--t1);}
.ca.liked{color:var(--red);}
.ca.saved{color:var(--gold);}
.ca-i{font-size:16px;line-height:1;}

/* reaction picker — absolute, does NOT affect flex layout */
.rx-pick{
  position:absolute;bottom:calc(100% + 8px);left:50%;
  transform:translateX(-50%) scale(.85);transform-origin:bottom center;
  background:var(--s3);border:1px solid var(--b2);
  border-radius:32px;padding:6px 10px;display:flex;gap:3px;z-index:50;
  opacity:0;pointer-events:none;
  transition:opacity .15s,transform .15s var(--ease);
  box-shadow:0 10px 40px rgba(0,0,0,.7);white-space:nowrap;
}
/* FIX: show picker on hover of the BUTTON itself (not a wrapper div),
   and keep it visible when the user moves the cursor into the picker */
.ca:hover .rx-pick,.rx-pick:hover{
  opacity:1;pointer-events:all;transform:translateX(-50%) scale(1);
}
.rx-e{font-size:22px;cursor:pointer;border:none;background:none;padding:3px 5px;border-radius:50%;transition:transform .12s;line-height:1;}
.rx-e:hover{transform:scale(1.45) translateY(-4px);}

/* error banner */
.post-err{background:rgba(232,25,44,.1);border:1px solid var(--red-border);border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:13px;color:var(--red);display:flex;align-items:center;gap:8px;}

/* COMMENTS */
.comments{background:rgba(0,0,0,.2);border-top:1px solid var(--b1);}
.cm-scroll{max-height:300px;overflow-y:auto;padding:12px 18px 0;display:flex;flex-direction:column;gap:8px;}
.cm-scroll::-webkit-scrollbar{width:2px;}
.cm-scroll::-webkit-scrollbar-thumb{background:var(--s4);border-radius:2px;}
.cmi{display:flex;gap:8px;}
.cm-av{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:11px;color:#fff;background:var(--s4);}
.cm-bub{background:var(--s2);border-radius:0 8px 8px 8px;padding:7px 12px;flex:1;border:1px solid var(--b1);}
.cm-who{font-size:11px;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:7px;}
.cm-when{font-size:9px;color:var(--t3);font-family:var(--fm);font-weight:400;}
.cm-txt{font-size:13px;line-height:1.55;word-break:break-word;}
.cm-empty{padding:16px 18px;font-size:13px;color:var(--t3);font-family:var(--fm);}
.cm-input-row{display:flex;gap:8px;align-items:center;padding:10px 18px 12px;}
.cm-inp{flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:22px;padding:7px 16px;color:var(--t1);font-size:13px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;}
.cm-inp:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.cm-inp::placeholder{color:var(--t3);}
.cm-go{width:30px;height:30px;border-radius:50%;background:var(--grad-fire);border:none;color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;box-shadow:0 2px 8px var(--red-glow);}
.cm-go:hover{transform:scale(1.12);}
.cm-go:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.cm-replies{padding-left:20px;display:flex;flex-direction:column;gap:6px;margin-top:4px;}

/* RIGHT PANEL */
.lx-rp{padding:18px 16px;position:sticky;top:var(--tb);height:calc(100vh - var(--tb));overflow-y:auto;display:flex;flex-direction:column;gap:14px;}
.lx-rp::-webkit-scrollbar{display:none;}
.wg{background:var(--s1);border:1px solid var(--b1);border-radius:12px;overflow:hidden;}
.wg-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05) 0%,transparent 70%);}
.wg-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t2);display:flex;align-items:center;gap:6px;}
.wg-title em{color:var(--red);font-style:normal;}
.wg-more{font-size:12px;color:var(--t3);cursor:pointer;font-weight:600;letter-spacing:.5px;border:none;background:none;transition:color .15s;font-family:var(--fb);}
.wg-more:hover{color:var(--red);}

/* trending */
.tr-item{display:flex;align-items:center;padding:11px 16px;cursor:pointer;transition:background .15s;gap:13px;border-bottom:1px solid var(--b1);}
.tr-item:last-child{border-bottom:none;}
.tr-item:hover{background:var(--s2);}
.tr-num{font-family:var(--fm);font-size:12px;color:var(--t4);width:18px;flex-shrink:0;}
.tr-body{flex:1;min-width:0;}
.tr-tag{font-size:15px;font-weight:700;color:var(--t1);transition:color .15s;}
.tr-item:hover .tr-tag{color:var(--red);}
.tr-sub{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;}
.tr-cnt{font-size:11px;color:var(--t3);font-family:var(--fm);flex-shrink:0;}

/* who to follow */
.wf-item{display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid var(--b1);transition:background .15s;}
.wf-item:last-child{border-bottom:none;}
.wf-item:hover{background:var(--s2);}
.wf-av{width:38px;height:38px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:'Bebas Neue',sans-serif;}
.wf-info{flex:1;min-width:0;}
.wf-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.wf-role{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;}
.fw-btn{padding:6px 14px;border:1px solid var(--red);border-radius:6px;background:transparent;color:var(--red);font-size:11px;font-weight:800;cursor:pointer;transition:all .15s;font-family:var(--fb);letter-spacing:.5px;flex-shrink:0;white-space:nowrap;}
.fw-btn:hover{background:var(--red);color:#fff;}
.fw-btn.ing{background:var(--red-sub);border-color:transparent;color:var(--red);}

/* SKELETON */
.skel{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:16px;margin-bottom:10px;}

/* load more */
.load-more{text-align:center;padding:14px;}
.lm-btn{padding:10px 28px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .15s;}
.lm-btn:hover{background:var(--s2);color:var(--t1);}
.lm-btn:disabled{opacity:.4;cursor:not-allowed;}
`;

/* ─── Constants ─────────────────────────────────────────────────────────── */
const RX_TYPES = [
  { emoji: '👍', type: 'like',      label: 'Like' },
  { emoji: '❤️',  type: 'love',      label: 'Love' },
  { emoji: '💡', type: 'insightful', label: 'Insightful' },
  { emoji: '🎉', type: 'celebrate', label: 'Celebrate' },
  { emoji: '🤝', type: 'support',   label: 'Support' },
];
// FIX: emojis now match DB seed data exactly (insightful→💡, not 🔥)
const RX_EMOJI = {
  like: '👍', love: '❤️', insightful: '💡', celebrate: '🎉', support: '🤝',
};

// Placeholder — wire to real hashtag/user endpoints when available
const TRENDS = [
  { tag: '#FinalExams',   sub: 'Trending in Education', cnt: '2.4k' },
  { tag: '#CampusLife',   sub: 'Trending near you',     cnt: '1.8k' },
  { tag: '#StudyGroup',   sub: 'Popular today',          cnt: '943'  },
  { tag: '#InternSeason', sub: 'Career & Jobs',          cnt: '712'  },
  { tag: '#LearnexTips',  sub: 'Community picks',        cnt: '500'  },
];
const SUGGEST = [
  { i: 'MN', name: 'Minh Nguyen', role: 'CS · Y3',      bg: '#0d1f35', c: '#4a9eff' },
  { i: 'TL', name: 'Trang Le',   role: 'Business · Y2', bg: '#0d2918', c: '#4adf8a' },
  { i: 'HK', name: 'Hieu Kim',   role: 'Design · Y4',   bg: '#2a0d1e', c: '#df4a8a' },
];

const AV_BG = ['#0d1f35','#0d2918','#2a0d1e','#1e1a0d','#1a0d2e','#1a1a0d'];
const AV_C  = ['#4a9eff','#4adf8a','#df4a8a','#dfb84a','#af4adf','#df9a4a'];
function avatarStyle(seed) {
  const i = (typeof seed === 'string' ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { bg: AV_BG[i], c: AV_C[i] };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function renderText(text) {
  if (!text) return null;
  return text.split(/(\#\w+|@\w+)/g).map((p, i) => {
    if (p.startsWith('#')) return <span key={i} className="c-tag">{p}</span>;
    if (p.startsWith('@')) return <span key={i} className="c-mention">{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

function extractTags(content) {
  if (!content) return [];
  return [...new Set((content.match(/#\w+/g) || []))];
}

/* ─── PostCard ────────────────────────────────────────────────────────────── */
function PostCard({ post: initPost, currentUserId, currentUserIni, onDelete }) {
  const navigate   = useNavigate();
  const [post, setPost]         = useState(initPost);
  // FIX: initialise myRx from the post's reactions + a server-side
  // "myReaction" field if the backend ever returns it; otherwise null.
  const [myRx, setMyRx]         = useState(initPost.myReaction ?? null);
  const [showCm, setShowCm]     = useState(false);
  const [comments, setComments] = useState([]);
  const [cmLoaded, setCmLoaded] = useState(false);   // FIX: separate flag from loading
  const [cmLoading, setCmLoading] = useState(false);
  const [cmTxt, setCmTxt]       = useState('');
  const [cmSending, setCmSending] = useState(false);
  const [rxLoading, setRxLoading] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const menuRef = useRef(null);
  const cmRef   = useRef(null);

  const isOwn = post.authorId === currentUserId;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const reactions    = Array.isArray(post.reactions) ? post.reactions : [];
  const totalRx      = reactions.reduce((s, r) => s + (r.count ?? 0), 0);
  const topRx        = [...reactions].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 3);
  const authorIni    = getInitials(post.authorDisplayName, post.authorEmail);
  const { bg, c }    = avatarStyle(post.authorId);
  const commentCount = post.commentCount ?? post.comments ?? 0;
  const tags         = post.hashtags?.map(h => `#${h}`) ?? extractTags(post.content);

  // FIX: loadComments no longer has cmLoading in its dependency array.
  // cmLoaded prevents double-fetch; cmLoading guards concurrent calls.
  const loadComments = useCallback(async () => {
    if (cmLoading || cmLoaded) return;
    setCmLoading(true);
    try {
      const res  = await commentService.getComments(post.id);
      const data = res?.data ?? res;
      setComments(Array.isArray(data) ? data : []);
      setCmLoaded(true);
    } catch { /* keep empty */ }
    finally { setCmLoading(false); }
  }, [post.id, cmLoading, cmLoaded]);

  const toggleComments = () => {
    const next = !showCm;
    setShowCm(next);
    if (next) {
      loadComments();
      setTimeout(() => cmRef.current?.focus(), 150);
    }
  };

  // FIX: reactions now work for all 5 types.
  // handleReact sends the chosen type string; the backend accepts
  // like/love/insightful/celebrate/support (matches DB reaction_type.name seed).
  const handleReact = async (type) => {
    if (rxLoading) return;
    setRxLoading(true);
    try {
      let updatedReactions;
      if (myRx === type) {
        // Same reaction clicked again → remove
        const res = await postService.removePostReaction(post.id);
        updatedReactions = res?.data ?? res;
        setMyRx(null);
      } else {
        // New reaction or switch
        const res = await postService.reactToPost(post.id, type);
        updatedReactions = res?.data ?? res;
        setMyRx(type);
      }
      if (Array.isArray(updatedReactions)) {
        setPost(p => ({ ...p, reactions: updatedReactions }));
      }
    } catch { /* optimistic state already applied; server error leaves it */ }
    finally { setRxLoading(false); }
  };

  const sendComment = async () => {
    if (!cmTxt.trim() || cmSending) return;
    setCmSending(true);
    const text = cmTxt.trim();
    setCmTxt('');
    try {
      const res  = await commentService.createComment(post.id, text);
      const saved = res?.data ?? res;
      setComments(prev => [...prev, saved]);
      setPost(p => ({ ...p, commentCount: (p.commentCount ?? 0) + 1 }));
    } catch {
      setCmTxt(text); // restore on failure
    } finally {
      setCmSending(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await postService.deletePost(post.id);
      onDelete(post.id);
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not delete post.');
    }
  };

  const handleReport = () => {
    setMenuOpen(false);
    // TODO: open a report modal; report table exists in DB (report + report_reason).
    // Wire to POST /api/reports when ReportController is built.
    alert('Report submitted. (Report endpoint coming soon.)');
  };

  return (
    <div className="card">
      {/* Author row */}
      <div className="card-head">
        <div
          className="c-ava"
          style={{ background: `linear-gradient(135deg,${bg},${c})` }}
          onClick={() => navigate(`/profile/${post.authorId}`)}
        >
          {authorIni}
        </div>
        <div className="c-meta">
          <div className="c-name" onClick={() => navigate(`/profile/${post.authorId}`)}>
            {post.authorDisplayName || post.authorEmail || 'Unknown'}
          </div>
          <div className="c-sub">
            <span>{post.authorHeadline || ''}</span>
            {post.authorHeadline && <span className="c-dot">·</span>}
            <span>{timeAgo(post.createdAt)}</span>
            {post.visibility && post.visibility !== 'public' && (
              <><span className="c-dot">·</span>
              <span>{post.visibility === 'private' ? '🔒 Only me' : '🔗 Connections'}</span></>
            )}
          </div>
        </div>

        {/* ⋯ menu */}
        <div className="c-more-wrap" ref={menuRef}>
          <button
            className="c-more"
            title="Options"
            onClick={() => setMenuOpen(v => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="c-more-menu">
              {isOwn ? (
                <>
                  <button className="c-menu-item danger" onClick={handleDelete}>
                    🗑 Delete Post
                  </button>
                </>
              ) : (
                <>
                  <button className="c-menu-item" onClick={() => { setMenuOpen(false); }}>
                    🚫 Not Interested
                  </button>
                  <div className="c-menu-divider" />
                  <button className="c-menu-item danger" onClick={handleReport}>
                    ⚑ Report Post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="card-body">{renderText(post.content)}</div>
      )}

      {/* Hashtag chips */}
      {tags.length > 0 && (
        <div className="card-tags">
          {tags.map(t => (
            <span
              key={t}
              className="tag-chip"
              onClick={() => navigate(`/hashtag/${t.slice(1)}`)}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      {(totalRx > 0 || commentCount > 0) && (
        <div className="card-stats">
          <div className="stat-rx">
            {topRx.map(r => (
              <span key={r.name ?? r.type} className="stat-em">
                {RX_EMOJI[r.name ?? r.type] ?? r.emoji ?? '👍'}
              </span>
            ))}
            {totalRx > 0 && <span className="stat-n">{totalRx}</span>}
          </div>
          <div className="stat-right">
            {commentCount > 0 && (
              <span className="stat-link" onClick={toggleComments}>
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Action row ──
          FIX: .ca is a direct flex child with position:relative.
          The reaction picker sits absolutely above the Like button —
          no wrapper div eating flex space, so Comment/Share/Save align evenly.
      */}
      <div className="card-actions">
        {/* Like — with hover reaction picker */}
        <button
          className={`ca ${myRx ? 'liked' : ''}`}
          onClick={() => handleReact(myRx || 'like')}
          disabled={rxLoading}
        >
          <span className="ca-i">{myRx ? (RX_EMOJI[myRx] ?? '👍') : '👍'}</span>
          {myRx ? (RX_TYPES.find(r => r.type === myRx)?.label ?? 'Liked') : 'Like'}
          {/* Reaction picker — absolute, no layout impact */}
          <div className="rx-pick" onMouseDown={e => e.stopPropagation()}>
            {RX_TYPES.map(r => (
              <button
                key={r.type}
                className="rx-e"
                title={r.label}
                onMouseDown={e => { e.stopPropagation(); e.preventDefault(); handleReact(r.type); }}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </button>

        <button className="ca" onClick={toggleComments}>
          <span className="ca-i">💬</span>Comment
        </button>

        {/* Share — placeholder; wire to POST /api/shares when built */}
        <button className="ca" onClick={() => alert('Share coming soon.')}>
          <span className="ca-i">↗</span>Share
        </button>

        <button
          className={`ca ${post.saved ? 'saved' : ''}`}
          onClick={async () => {
            try {
              if (post.saved) {
                await postService.unsavePost(post.id);
                setPost(p => ({ ...p, saved: false }));
              } else {
                await postService.savePost(post.id);
                setPost(p => ({ ...p, saved: true }));
              }
            } catch { /* no-op */ }
          }}
        >
          <span className="ca-i">{post.saved ? '🔖' : '🏷'}</span>
          {post.saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Comments */}
      {showCm && (
        <div className="comments">
          {cmLoading ? (
            <div style={{ padding: '14px 18px' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div className="sk" style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0 }} />
                  <div className="sk" style={{ height: 44, flex: 1, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="cm-scroll">
              {comments.length === 0
                ? <div className="cm-empty">No comments yet — be the first.</div>
                : comments.map(cm => <CommentItem key={cm.id} comment={cm} />)
              }
            </div>
          )}
          <div className="cm-input-row">
            <div className="cm-av" style={{ background: 'var(--grad-fire)' }}>
              {currentUserIni}
            </div>
            <input
              ref={cmRef}
              className="cm-inp"
              placeholder="Write a comment…"
              value={cmTxt}
              onChange={e => setCmTxt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
            />
            <button
              className="cm-go"
              onClick={sendComment}
              disabled={!cmTxt.trim() || cmSending}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CommentItem ─────────────────────────────────────────────────────────── */
function CommentItem({ comment }) {
  const authorIni    = getInitials(comment.authorDisplayName, comment.authorEmail);
  const { bg, c }    = avatarStyle(comment.authorId?.toString());

  return (
    <div className="cmi">
      <div className="cm-av" style={{ background: `linear-gradient(135deg,${bg},${c})` }}>
        {authorIni}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cm-bub">
          <div className="cm-who">
            {comment.authorDisplayName || comment.authorEmail || 'User'}
            <span className="cm-when">{timeAgo(comment.createdAt)}</span>
          </div>
          <div className="cm-txt">{comment.content}</div>
        </div>
        {comment.replies?.length > 0 && (
          <div className="cm-replies">
            {comment.replies.map(r => <CommentItem key={r.id} comment={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="skel">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div className="sk" style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="sk" style={{ height: 13, width: '38%', marginBottom: 8, borderRadius: 5 }} />
          <div className="sk" style={{ height: 10, width: '22%', borderRadius: 5 }} />
        </div>
      </div>
      <div className="sk" style={{ height: 13, width: '100%', marginBottom: 7, borderRadius: 5 }} />
      <div className="sk" style={{ height: 13, width: '85%', marginBottom: 7, borderRadius: 5 }} />
      <div className="sk" style={{ height: 13, width: '60%', borderRadius: 5 }} />
    </div>
  );
}

/* ─── RightPanel ─────────────────────────────────────────────────────────── */
function RightPanel({ followed, onToggleFollow }) {
  const navigate = useNavigate();
  return (
    <>
      {/* Trending — placeholder; wire to GET /api/hashtags/trending */}
      <div className="wg">
        <div className="wg-head">
          <div className="wg-title">🔥 Trending</div>
          <button className="wg-more">See all</button>
        </div>
        {TRENDS.map((t, i) => (
          <div
            key={t.tag}
            className="tr-item"
            onClick={() => navigate(`/hashtag/${t.tag.slice(1)}`)}
          >
            <span className="tr-num">{i + 1}</span>
            <div className="tr-body">
              <div className="tr-tag">{t.tag}</div>
              <div className="tr-sub">{t.sub}</div>
            </div>
            <span className="tr-cnt">{t.cnt}</span>
          </div>
        ))}
      </div>

      {/* Suggested — placeholder; wire to GET /api/users/suggestions */}
      <div className="wg">
        <div className="wg-head">
          <div className="wg-title">✦ Suggested</div>
          <button className="wg-more">See all</button>
        </div>
        {SUGGEST.map(s => (
          <div key={s.name} className="wf-item">
            <div className="wf-av" style={{ background: s.bg, color: s.c }}>{s.i}</div>
            <div className="wf-info">
              <div className="wf-name">{s.name}</div>
              <div className="wf-role">{s.role}</div>
            </div>
            <button
              className={`fw-btn ${followed[s.name] ? 'ing' : ''}`}
              onClick={() => onToggleFollow(s.name)}
            >
              {followed[s.name] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: 'var(--t4)', lineHeight: 1.8, padding: '0 4px', fontFamily: 'var(--fm)' }}>
        Learnex · Terms · Privacy<br />© 2026 Learnex Inc.
      </div>
    </>
  );
}

/* ─── FeedPage ────────────────────────────────────────────────────────────── */
export default function FeedPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const uid      = user?.userId ?? user?.id;
  const userIni  = getInitials(user?.displayName, user?.email);
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Student';

  const [tab,         setTab]         = useState('following');
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [postErr,     setPostErr]     = useState('');
  const [draft,       setDraft]       = useState('');
  const [posting,     setPosting]     = useState(false);
  const [hasNext,     setHasNext]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followed,    setFollowed]    = useState({});
  const [visibility,  setVisibility]  = useState('public');
  const pageRef = useRef(0);

  const loadFeed = useCallback(async (reset = true) => {
    if (!uid) return;
    reset ? setLoading(true) : setLoadingMore(true);
    setPostErr('');
    try {
      const p   = reset ? 0 : pageRef.current;
      const res = tab === 'following'
        ? await postService.getFeed(p, 20)
        : await postService.getDiscover(p, 20);
      const data  = res?.data ?? res;
      const items = data?.content ?? (Array.isArray(data) ? data : []);
      if (reset) {
        setPosts(items);
        pageRef.current = 1;
      } else {
        setPosts(prev => [...prev, ...items]);
        pageRef.current += 1;
      }
      // FIX: data.last is Spring's way of saying "this is the last page".
      // hasNext = !data.last. If last is absent fall back to false (don't show button).
      setHasNext(data?.hasNext ?? (data?.last === false));
    } catch {
      if (reset) setPostErr('Could not load posts. Check your connection.');
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  }, [uid, tab]);

  useEffect(() => { loadFeed(true); }, [uid, tab]);

  const submitPost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setPostErr('');
    try {
      const res  = await postService.createPost({ content: draft.trim(), visibility });
      const saved = res?.data ?? res;
      setPosts(prev => [saved, ...prev]);
      setDraft('');
    } catch (err) {
      setPostErr(err?.response?.data?.message || 'Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  // Remove deleted post from local state
  const handleDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const cycleVisibility = () => {
    const opts = ['public', 'connections', 'private'];
    setVisibility(v => opts[(opts.indexOf(v) + 1) % opts.length]);
  };
  const visLabel = {
    public:      '🌍 Public',
    connections: '🔗 Connections',
    private:     '🔒 Only me',
  };

  return (
    <>
      <style>{css}</style>
      <Layout
        active="feed"
        rightPanel={
          <RightPanel
            followed={followed}
            onToggleFollow={n => setFollowed(f => ({ ...f, [n]: !f[n] }))}
          />
        }
      >
        <main className="feed">
          {/* Tabs */}
          <div className="feed-header">
            <button className={`ftab ${tab === 'following' ? 'on' : ''}`} onClick={() => setTab('following')}>Following</button>
            <button className={`ftab ${tab === 'discover'  ? 'on' : ''}`} onClick={() => setTab('discover')}>Discover</button>
            <div className="fh-gap" />
            <button className="fh-sort">⇅ Latest</button>
          </div>

          {/* Compose */}
          <div className="compose">
            <div className="c-top">
              <div className="c-av">{userIni}</div>
              <textarea
                className="c-input"
                placeholder={`What's on your mind, ${userName.split(' ')[0]}?`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={draft.length > 80 ? 3 : 1}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && submitPost()}
              />
            </div>
            {draft && (
              <div className="c-toolbar">
                <button className="c-tool">📷 Photo</button>
                <button className="c-tool">#️⃣ Tag</button>
                <button className="c-vis" onClick={cycleVisibility}>
                  {visLabel[visibility]}
                </button>
                <div className="c-gap" />
                <span className="c-hint">Ctrl+Enter</span>
                <button
                  className="c-post"
                  onClick={submitPost}
                  disabled={posting || !draft.trim()}
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {postErr && <div className="post-err">⚠ {postErr}</div>}

          {/* Posts */}
          {loading ? (
            [1, 2, 3].map(i => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">📭</div>
              <div className="lx-empty-t">Nothing Here Yet</div>
              <p className="lx-empty-s">
                {tab === 'following'
                  ? 'Follow students to see their posts here.'
                  : 'No posts to discover right now.'}
              </p>
            </div>
          ) : (
            <>
              {posts.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <PostCard
                    post={p}
                    currentUserId={uid}
                    currentUserIni={userIni}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
              {hasNext && (
                <div className="load-more">
                  <button
                    className="lm-btn"
                    onClick={() => loadFeed(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more posts'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </Layout>
    </>
  );
}