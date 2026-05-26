import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, getInitials } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import postService from '../services/postService';
import commentService from '../services/commentService';

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
.pd-wrap{padding:18px 22px 90px;min-width:0;max-width:780px;}
.pd-back{display:flex;align-items:center;gap:8px;background:none;border:none;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;
  cursor:pointer;padding:0;margin-bottom:16px;transition:color .15s;letter-spacing:.3px;}
.pd-back:hover{color:var(--t1);}

/* ── Post card (detail variant — no hover lift) ── */
.pd-card{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;margin-bottom:14px;}
.pd-head{display:flex;align-items:flex-start;gap:13px;padding:20px 20px 0;}
.pd-ava{width:50px;height:50px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:20px;color:#fff;cursor:pointer;transition:transform .15s;}
.pd-ava:hover{transform:scale(1.05);}
.pd-meta{flex:1;min-width:0;}
.pd-name{font-size:16px;font-weight:700;cursor:pointer;transition:color .15s;}
.pd-name:hover{color:var(--red);}
.pd-sub{font-size:12px;color:var(--t3);margin-top:3px;font-family:var(--fm);display:flex;gap:5px;align-items:center;}
.pd-dot{color:var(--t4);}
.pd-body{padding:14px 20px;font-size:16px;line-height:1.85;color:var(--t1);white-space:pre-wrap;word-break:break-word;}
.pd-tag{background:var(--grad-fire);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:700;cursor:pointer;}
.pd-mention{color:var(--blue);font-weight:600;cursor:pointer;}
.pd-mention:hover{text-decoration:underline;}

/* ── Attachment grid ── */
.pd-media{padding:0 20px 14px;display:grid;gap:4px;border-radius:10px;overflow:hidden;}
.pd-media.n1{grid-template-columns:1fr;}
.pd-media.n2{grid-template-columns:1fr 1fr;}
.pd-media.n3{grid-template-columns:1fr 1fr;grid-template-rows:auto auto;}
.pd-media.n4{grid-template-columns:1fr 1fr;}
.pd-media.n3 .pm-img:first-child{grid-column:1/-1;}
.pm-img{width:100%;border-radius:8px;object-fit:cover;cursor:pointer;
  max-height:480px;transition:opacity .15s;}
.pm-img:hover{opacity:.9;}

/* ── Lightbox ── */
.lbox{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.92);
  display:flex;align-items:center;justify-content:center;
  animation:lbox-in .15s ease;}
@keyframes lbox-in{from{opacity:0}to{opacity:1}}
.lbox-img{max-width:92vw;max-height:90vh;object-fit:contain;border-radius:8px;}
.lbox-close{position:absolute;top:18px;right:22px;background:none;border:none;
  color:#fff;font-size:28px;cursor:pointer;opacity:.7;transition:opacity .15s;}
.lbox-close:hover{opacity:1;}
.lbox-nav{position:absolute;top:50%;transform:translateY(-50%);
  background:rgba(255,255,255,.08);border:none;border-radius:50%;
  width:46px;height:46px;color:#fff;font-size:20px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:background .15s;}
.lbox-nav:hover{background:rgba(255,255,255,.18);}
.lbox-prev{left:16px;}
.lbox-next{right:16px;}

/* ── Stats & actions (same as feed) ── */
.pd-stats{display:flex;align-items:center;justify-content:space-between;
  padding:10px 20px;border-top:1px solid var(--b1);
  font-size:13px;color:var(--t3);font-family:var(--fm);}
.pd-rx-row{display:flex;align-items:center;gap:3px;}
.pd-em{font-size:16px;}
.pd-actions{display:flex;border-top:1px solid var(--b1);}
.pda{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 4px;border:none;border-right:1px solid var(--b1);background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;
  letter-spacing:.3px;cursor:pointer;transition:all .15s;position:relative;}
.pda:last-child{border-right:none;}
.pda:hover{background:var(--s2);color:var(--t1);}
.pda.liked{color:var(--red);}
.pda.saved{color:var(--gold);}
.pda-i{font-size:16px;line-height:1;}

/* reaction picker */
.pd-rx-pick{
  position:absolute;bottom:calc(100% + 8px);left:50%;
  transform:translateX(-50%) scale(.85);transform-origin:bottom center;
  background:var(--s3);border:1px solid var(--b2);
  border-radius:32px;padding:6px 10px;display:flex;gap:3px;z-index:50;
  opacity:0;pointer-events:none;
  transition:opacity .15s,transform .15s var(--ease);
  box-shadow:0 10px 40px rgba(0,0,0,.7);white-space:nowrap;
}
.pda:hover .pd-rx-pick,.pd-rx-pick:hover{
  opacity:1;pointer-events:all;transform:translateX(-50%) scale(1);
}
.pd-rx-e{font-size:22px;cursor:pointer;border:none;background:none;
  padding:3px 5px;border-radius:50%;transition:transform .12s;line-height:1;}
.pd-rx-e:hover{transform:scale(1.45) translateY(-4px);}

/* ── Comments section ── */
.pd-comments{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;}
.pd-cm-head{padding:16px 20px;border-bottom:1px solid var(--b1);
  font-size:13px;font-weight:700;color:var(--t2);letter-spacing:.5px;text-transform:uppercase;}
.pd-cm-list{padding:14px 20px;display:flex;flex-direction:column;gap:10px;}
.pd-cm-empty{padding:20px;text-align:center;font-size:13px;color:var(--t3);font-family:var(--fm);}

/* comment item */
.pdc{display:flex;gap:10px;}
.pdc-av{width:34px;height:34px;border-radius:9px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:13px;color:#fff;}
.pdc-main{flex:1;min-width:0;}
.pdc-bub{background:var(--s2);border:1px solid var(--b1);border-radius:0 10px 10px 10px;padding:10px 14px;}
.pdc-who{font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.pdc-when{font-size:10px;color:var(--t3);font-family:var(--fm);font-weight:400;}
.pdc-txt{font-size:14px;line-height:1.6;word-break:break-word;}

/* comment actions row */
.pdc-acts{display:flex;align-items:center;gap:2px;margin-top:5px;padding-left:2px;}
.pdc-act{background:none;border:none;color:var(--t3);font-size:11px;font-family:var(--fb);
  font-weight:600;cursor:pointer;padding:3px 8px;border-radius:5px;
  transition:all .12s;letter-spacing:.3px;display:flex;align-items:center;gap:5px;}
.pdc-act:hover{background:var(--s3);color:var(--t1);}
.pdc-act.liked{color:var(--red);}

/* inline reaction picker for comments */
.pdc-rx-wrap{position:relative;display:inline-flex;}
.pdc-rx-pick{
  position:absolute;bottom:calc(100% + 6px);left:0;
  background:var(--s3);border:1px solid var(--b2);
  border-radius:28px;padding:5px 8px;display:flex;gap:2px;z-index:60;
  opacity:0;pointer-events:none;
  transition:opacity .15s,transform .15s var(--ease);
  transform:scale(.85);transform-origin:bottom left;
  box-shadow:0 8px 32px rgba(0,0,0,.7);white-space:nowrap;
}
.pdc-rx-wrap:hover .pdc-rx-pick,.pdc-rx-pick:hover{
  opacity:1;pointer-events:all;transform:scale(1);
}
.pdc-rx-e{font-size:19px;cursor:pointer;border:none;background:none;
  padding:2px 4px;border-radius:50%;transition:transform .12s;line-height:1;}
.pdc-rx-e:hover{transform:scale(1.4) translateY(-3px);}

/* reaction mini-bar on comment */
.pdc-rx-bar{display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;}
.pdc-rx-chip{display:flex;align-items:center;gap:3px;padding:2px 8px;
  background:var(--s3);border:1px solid var(--b1);border-radius:12px;
  font-size:11px;cursor:pointer;transition:all .12s;font-family:var(--fm);}
.pdc-rx-chip:hover{border-color:var(--red-border);background:var(--red-sub);}
.pdc-rx-chip.mine{border-color:var(--red-border);background:var(--red-sub);color:var(--red);}

/* replies indent */
.pdc-replies{padding-left:24px;margin-top:8px;display:flex;flex-direction:column;gap:8px;
  border-left:2px solid var(--b1);}

/* reply input */
.pdc-reply-inp{display:flex;gap:8px;align-items:center;margin-top:6px;}
.pdc-reply-field{flex:1;background:var(--s3);border:1px solid var(--b1);border-radius:20px;
  padding:6px 14px;color:var(--t1);font-size:12px;font-family:var(--fb);
  outline:none;transition:border-color .2s;}
.pdc-reply-field:focus{border-color:var(--red-border);}
.pdc-reply-field::placeholder{color:var(--t3);}
.pdc-reply-go{width:26px;height:26px;border-radius:50%;background:var(--grad-fire);
  border:none;color:#fff;font-size:11px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:transform .15s;flex-shrink:0;}
.pdc-reply-go:hover{transform:scale(1.12);}
.pdc-reply-go:disabled{opacity:.4;cursor:not-allowed;transform:none;}

/* compose comment */
.pd-compose{display:flex;gap:10px;align-items:center;padding:14px 20px;border-top:1px solid var(--b1);}
.pd-cm-inp{flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:24px;
  padding:10px 18px;color:var(--t1);font-size:14px;font-family:var(--fb);
  outline:none;transition:border-color .2s,box-shadow .2s;}
.pd-cm-inp:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.pd-cm-inp::placeholder{color:var(--t3);}
.pd-cm-go{width:36px;height:36px;border-radius:50%;background:var(--grad-fire);
  border:none;color:#fff;font-size:14px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .15s;box-shadow:0 2px 8px var(--red-glow);}
.pd-cm-go:hover{transform:scale(1.1);}
.pd-cm-go:disabled{opacity:.4;cursor:not-allowed;transform:none;}

/* loading / error */
.pd-loading{padding:60px 20px;text-align:center;color:var(--t3);font-family:var(--fm);font-size:13px;}
.pd-err{padding:40px 20px;text-align:center;}
.pd-err-ic{font-size:36px;margin-bottom:12px;}
.pd-err-t{font-family:var(--fd);font-size:28px;letter-spacing:2px;margin-bottom:8px;}
.pd-err-s{font-size:13px;color:var(--t3);}
`;

/* ─── Constants ───────────────────────────────────────────────────────────── */
const RX_TYPES = [
  { emoji: '👍', type: 'like',       label: 'Like' },
  { emoji: '❤️',  type: 'love',       label: 'Love' },
  { emoji: '💡', type: 'insightful', label: 'Insightful' },
  { emoji: '🎉', type: 'celebrate',  label: 'Celebrate' },
  { emoji: '🤝', type: 'support',    label: 'Support' },
];
const RX_EMOJI = { like:'👍', love:'❤️', insightful:'💡', celebrate:'🎉', support:'🤝' };

const AV_BG = ['#0d1f35','#0d2918','#2a0d1e','#1e1a0d','#1a0d2e','#1a1a0d'];
const AV_C  = ['#4a9eff','#4adf8a','#df4a8a','#dfb84a','#af4adf','#df9a4a'];
function avatarStyle(seed) {
  const i = (typeof seed === 'string' ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { bg: AV_BG[i], c: AV_C[i] };
}
function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function renderText(text) {
  if (!text) return null;
  return text.split(/(\#\w+|@\w+)/g).map((p, i) => {
    if (p.startsWith('#')) return <span key={i} className="pd-tag">{p}</span>;
    if (p.startsWith('@')) return <span key={i} className="pd-mention">{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

/* ─── Lightbox ────────────────────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div className="lbox" onClick={onClose}>
      <button className="lbox-close" onClick={onClose}>✕</button>
      {images.length > 1 && (
        <>
          <button className="lbox-nav lbox-prev"
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}>
            ‹
          </button>
          <button className="lbox-nav lbox-next"
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}>
            ›
          </button>
        </>
      )}
      <img
        className="lbox-img"
        src={images[idx].url}
        alt=""
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── AttachmentGrid ──────────────────────────────────────────────────────── */
function AttachmentGrid({ attachments }) {
  const [lightbox, setLightbox] = useState(null);
  const images = attachments.filter(a => a.type === 'image' || a.mimeType?.startsWith('image/'));
  if (images.length === 0) return null;
  const cls = `pd-media n${Math.min(images.length, 4)}`;
  return (
    <>
      <div className={cls}>
        {images.slice(0, 4).map((img, i) => (
          <img
            key={img.id ?? i}
            className="pm-img"
            src={img.url}
            alt=""
            onClick={() => setLightbox(i)}
          />
        ))}
      </div>
      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

/* ─── CommentReactionBar ──────────────────────────────────────────────────── */
function CommentReactionBar({ commentId, reactions: initRx, myReaction: initMy }) {
  const [reactions, setReactions] = useState(initRx ?? []);
  const [myRx, setMyRx]           = useState(initMy ?? null);
  const [busy, setBusy]           = useState(false);

  const handle = async (type) => {
    if (busy) return;
    setBusy(true);
    try {
      let updated;
      if (myRx === type) {
        const res = await commentService.removeCommentReaction(commentId);
        updated   = res?.data ?? res;
        setMyRx(null);
      } else {
        const res = await commentService.reactToComment(commentId, type);
        updated   = res?.data ?? res;
        setMyRx(type);
      }
      if (Array.isArray(updated)) setReactions(updated);
    } catch { /* no-op */ }
    finally { setBusy(false); }
  };

  const total = reactions.reduce((s, r) => s + (r.count ?? 0), 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {/* Hover-to-pick trigger */}
      <div className="pdc-rx-wrap">
        <button
          className={`pdc-act ${myRx ? 'liked' : ''}`}
          disabled={busy}
        >
          {myRx ? (RX_EMOJI[myRx] ?? '👍') : '👍'}
          {total > 0 && <span style={{ fontSize: 10 }}>{total}</span>}
          <div className="pdc-rx-pick" onMouseDown={e => e.stopPropagation()}>
            {RX_TYPES.map(r => (
              <button
                key={r.type}
                className="pdc-rx-e"
                title={r.label}
                onMouseDown={e => { e.stopPropagation(); e.preventDefault(); handle(r.type); }}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </button>
      </div>
      {/* Chips for each type with count */}
      {reactions.filter(r => r.count > 0).map(r => (
        <span
          key={r.name}
          className={`pdc-rx-chip ${myRx === r.name ? 'mine' : ''}`}
          onClick={() => handle(r.name)}
        >
          {RX_EMOJI[r.name] ?? r.emoji} {r.count}
        </span>
      ))}
    </div>
  );
}

/* ─── CommentItem (detail page) ───────────────────────────────────────────── */
function DetailCommentItem({ comment, postId, currentUserIni, depth = 0 }) {
  const navigate       = useNavigate();
  const [showReply, setShowReply] = useState(false);
  const [replyTxt, setReplyTxt]   = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replies, setReplies]     = useState(comment.replies ?? []);
  const replyRef = useRef(null);

  const { bg, c } = avatarStyle(comment.authorId?.toString());
  const ini       = getInitials(comment.authorDisplayName, comment.authorEmail);

  const sendReply = async () => {
    if (!replyTxt.trim() || replySending) return;
    setReplySending(true);
    const text = replyTxt.trim();
    setReplyTxt('');
    try {
      const res   = await commentService.createComment(postId, text, comment.id);
      const saved = res?.data ?? res;
      setReplies(prev => [...prev, saved]);
      setShowReply(false);
    } catch {
      setReplyTxt(text);
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="pdc">
      <div
        className="pdc-av"
        style={{ background: `linear-gradient(135deg,${bg},${c})` }}
        onClick={() => navigate(`/profile/${comment.authorId}`)}
      />
      <div className="pdc-main">
        <div className="pdc-bub">
          <div className="pdc-who">
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${comment.authorId}`)}
            >
              {comment.authorDisplayName || comment.authorEmail || 'User'}
            </span>
            <span className="pdc-when">{timeAgo(comment.createdAt)}</span>
          </div>
          <div className="pdc-txt">{comment.content}</div>
        </div>

        {/* Actions */}
        <div className="pdc-acts">
          <CommentReactionBar
            commentId={comment.id}
            reactions={comment.reactions ?? []}
            myReaction={comment.myReaction ?? null}
          />
          {depth < 1 && (
            <button
              className="pdc-act"
              onClick={() => {
                setShowReply(v => !v);
                setTimeout(() => replyRef.current?.focus(), 100);
              }}
            >
              ↩ Reply
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="pdc-reply-inp">
            <input
              ref={replyRef}
              className="pdc-reply-field"
              placeholder="Write a reply…"
              value={replyTxt}
              onChange={e => setReplyTxt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
            />
            <button
              className="pdc-reply-go"
              onClick={sendReply}
              disabled={!replyTxt.trim() || replySending}
            >➤</button>
          </div>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="pdc-replies">
            {replies.map(r => (
              <DetailCommentItem
                key={r.id}
                comment={r}
                postId={postId}
                currentUserIni={currentUserIni}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PostDetailPage ──────────────────────────────────────────────────────── */
export default function PostDetailPage() {
  const { postId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const uid        = user?.userId ?? user?.id;
  const userIni    = getInitials(user?.displayName, user?.email);

  const [post,       setPost]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [comments,   setComments]   = useState([]);
  const [cmLoading,  setCmLoading]  = useState(true);
  const [cmTxt,      setCmTxt]      = useState('');
  const [cmSending,  setCmSending]  = useState(false);
  const [myRx,       setMyRx]       = useState(null);
  const [rxLoading,  setRxLoading]  = useState(false);
  const cmRef = useRef(null);

  // Load post
  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    postService.getPost(postId)
      .then(res => {
        const data = res?.data ?? res;
        setPost(data);
        setMyRx(data?.myReaction ?? null);
      })
      .catch(() => setError('Post not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [postId]);

  // Load comments
  useEffect(() => {
    if (!postId) return;
    setCmLoading(true);
    commentService.getComments(postId)
      .then(res => {
        const data = res?.data ?? res;
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setCmLoading(false));
  }, [postId]);

  const handleReact = async (type) => {
    if (rxLoading || !post) return;
    setRxLoading(true);
    try {
      let updated;
      if (myRx === type) {
        const res = await postService.removePostReaction(post.id);
        updated   = res?.data ?? res;
        setMyRx(null);
      } else {
        const res = await postService.reactToPost(post.id, type);
        updated   = res?.data ?? res;
        setMyRx(type);
      }
      if (Array.isArray(updated)) setPost(p => ({ ...p, reactions: updated }));
    } catch { /* no-op */ }
    finally { setRxLoading(false); }
  };

  const sendComment = async () => {
    if (!cmTxt.trim() || cmSending) return;
    setCmSending(true);
    const text = cmTxt.trim();
    setCmTxt('');
    try {
      const res   = await commentService.createComment(postId, text);
      const saved = res?.data ?? res;
      setComments(prev => [...prev, saved]);
      setPost(p => ({ ...p, commentCount: (p.commentCount ?? 0) + 1 }));
    } catch {
      setCmTxt(text);
    } finally {
      setCmSending(false);
    }
  };

  /* ── Render states ── */
  if (loading) return (
    <>
      <style>{css}</style>
      <Layout active="feed">
        <div className="pd-wrap">
          <div className="pd-loading">Loading post…</div>
        </div>
      </Layout>
    </>
  );

  if (error || !post) return (
    <>
      <style>{css}</style>
      <Layout active="feed">
        <div className="pd-wrap">
          <div className="pd-err">
            <div className="pd-err-ic">🔍</div>
            <div className="pd-err-t">Not Found</div>
            <div className="pd-err-s">{error || 'This post does not exist.'}</div>
          </div>
        </div>
      </Layout>
    </>
  );

  const reactions    = Array.isArray(post.reactions) ? post.reactions : [];
  const totalRx      = reactions.reduce((s, r) => s + (r.count ?? 0), 0);
  const topRx        = [...reactions].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 3);
  const authorIni    = getInitials(post.authorDisplayName, post.authorEmail);
  const { bg, c }    = avatarStyle(post.authorId);
  const attachments  = post.attachments ?? [];

  return (
    <>
      <style>{css}</style>
      <Layout active="feed">
        <div className="pd-wrap">
          {/* Back button */}
          <button className="pd-back" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {/* Post card */}
          <div className="pd-card">
            <div className="pd-head">
              <div
                className="pd-ava"
                style={{ background: `linear-gradient(135deg,${bg},${c})` }}
                onClick={() => navigate(`/profile/${post.authorId}`)}
              >
                {authorIni}
              </div>
              <div className="pd-meta">
                <div className="pd-name" onClick={() => navigate(`/profile/${post.authorId}`)}>
                  {post.authorDisplayName || post.authorEmail || 'Unknown'}
                </div>
                <div className="pd-sub">
                  {post.authorHeadline && <><span>{post.authorHeadline}</span><span className="pd-dot">·</span></>}
                  <span>{timeAgo(post.createdAt)}</span>
                  {post.visibility && post.visibility !== 'public' && (
                    <><span className="pd-dot">·</span>
                    <span>{post.visibility === 'private' ? '🔒' : '🔗'}</span></>
                  )}
                </div>
              </div>
            </div>

            {post.content && (
              <div className="pd-body">{renderText(post.content)}</div>
            )}

            {attachments.length > 0 && (
              <AttachmentGrid attachments={attachments} />
            )}

            {/* Stats */}
            {(totalRx > 0 || (post.commentCount ?? 0) > 0) && (
              <div className="pd-stats">
                <div className="pd-rx-row">
                  {topRx.map(r => (
                    <span key={r.name ?? r.type} className="pd-em">
                      {RX_EMOJI[r.name ?? r.type] ?? '👍'}
                    </span>
                  ))}
                  {totalRx > 0 && <span style={{ marginLeft: 4, fontSize: 12 }}>{totalRx}</span>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--fm)' }}>
                  {post.commentCount ?? comments.length} comment{(post.commentCount ?? comments.length) !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pd-actions">
              <button
                className={`pda ${myRx ? 'liked' : ''}`}
                onClick={() => handleReact(myRx || 'like')}
                disabled={rxLoading}
              >
                <span className="pda-i">{myRx ? (RX_EMOJI[myRx] ?? '👍') : '👍'}</span>
                {myRx ? (RX_TYPES.find(r => r.type === myRx)?.label ?? 'Liked') : 'Like'}
                <div className="pd-rx-pick" onMouseDown={e => e.stopPropagation()}>
                  {RX_TYPES.map(r => (
                    <button
                      key={r.type}
                      className="pd-rx-e"
                      title={r.label}
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); handleReact(r.type); }}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </button>

              <button className="pda" onClick={() => cmRef.current?.focus()}>
                <span className="pda-i">💬</span>Comment
              </button>

              <button className="pda" onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}>
                <span className="pda-i">🔗</span>Copy Link
              </button>

              <button
                className={`pda ${post.saved ? 'saved' : ''}`}
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
                <span className="pda-i">{post.saved ? '🔖' : '🏷'}</span>
                {post.saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="pd-comments">
            <div className="pd-cm-head">
              💬 Comments {comments.length > 0 && `· ${comments.length}`}
            </div>

            {cmLoading ? (
              <div className="pd-cm-empty">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="pd-cm-empty">No comments yet — be the first.</div>
            ) : (
              <div className="pd-cm-list">
                {comments.map(cm => (
                  <DetailCommentItem
                    key={cm.id}
                    comment={cm}
                    postId={postId}
                    currentUserIni={userIni}
                    depth={0}
                  />
                ))}
              </div>
            )}

            {/* Compose comment */}
            <div className="pd-compose">
              <div className="pdc-av" style={{ background: 'var(--grad-fire)', flexShrink: 0, width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fd)', fontSize: 13, color: '#fff' }}>
                {userIni}
              </div>
              <input
                ref={cmRef}
                className="pd-cm-inp"
                placeholder="Write a comment…"
                value={cmTxt}
                onChange={e => setCmTxt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendComment()}
              />
              <button
                className="pd-cm-go"
                onClick={sendComment}
                disabled={!cmTxt.trim() || cmSending}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}