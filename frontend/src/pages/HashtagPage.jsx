import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, getInitials } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import hashtagService from '../services/hashtagService';
import postService from '../services/postService';

const css = `
.htag-main{padding:18px 22px 90px;min-width:0;}

.htag-hero{margin-bottom:20px;}
.htag-back{display:flex;align-items:center;gap:8px;background:none;border:none;color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;cursor:pointer;padding:0;margin-bottom:14px;transition:color .15s;letter-spacing:.3px;}
.htag-back:hover{color:var(--t1);}
.htag-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.htag-title-block{}
.htag-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:var(--t3);font-family:var(--fm);margin-bottom:6px;}
.htag-name{font-family:var(--fd);font-size:42px;letter-spacing:3px;background:var(--grad-fire);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.1;}
.htag-count{font-size:13px;color:var(--t3);font-family:var(--fm);margin-top:6px;}

/* Sort */
.htag-sort{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.hs-btn{height:34px;padding:0 14px;background:var(--s2);border:1px solid var(--b1);border-radius:8px;color:var(--t3);font-size:11px;font-family:var(--fb);font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .15s;}
.hs-btn:hover{background:var(--s3);color:var(--t2);}
.hs-btn.active{background:var(--red-sub);border-color:var(--red-border);color:var(--red);}

.htag-divider{height:1px;background:var(--b1);margin:18px 0;}

/* Post card (reuse feed card style) */
.card{background:var(--s1);border:1px solid var(--b1);border-radius:12px;margin-bottom:10px;overflow:hidden;transition:border-color .25s,box-shadow .25s;position:relative;cursor:pointer;animation:card-up .35s var(--ease) both;}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .25s;border-radius:12px 0 0 12px;}
.card:hover{border-color:rgba(255,255,255,.09);box-shadow:0 4px 16px rgba(0,0,0,.18);}
.card:hover::before{background:rgba(232,25,44,.3);}
@keyframes card-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.card-head{display:flex;align-items:flex-start;gap:13px;padding:16px 16px 0 18px;}
.c-ava{width:44px;height:44px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:17px;color:#fff;cursor:pointer;transition:transform .15s;}
.c-ava:hover{transform:scale(1.05);}
.c-meta{flex:1;min-width:0;}
.c-name{font-size:14px;font-weight:700;cursor:pointer;transition:color .15s;}
.c-name:hover{color:var(--red);}
.c-sub{font-size:11px;color:var(--t3);margin-top:2px;font-family:var(--fm);}
.card-body{padding:10px 16px 10px 18px;font-size:15px;line-height:1.8;color:var(--t1);white-space:pre-wrap;word-break:break-word;}
.c-tag{background:var(--grad-fire);-webkit-background-clip:text;background-clip:text;color:transparent;cursor:pointer;font-weight:700;}
.c-tag.active{text-decoration:underline;}
.card-stats{display:flex;align-items:center;gap:14px;padding:8px 18px;border-top:1px solid var(--b1);font-size:12px;color:var(--t3);font-family:var(--fm);}

/* Empty / loading */
.htag-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;color:var(--t3);}
.he-ic{font-size:48px;opacity:.4;}
.he-t{font-family:var(--fd);font-size:24px;letter-spacing:3px;color:var(--t2);}
.he-s{font-size:13px;font-family:var(--fm);text-align:center;max-width:280px;line-height:1.8;}

.skel{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:16px;margin-bottom:10px;}
.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}

.load-more{text-align:center;padding:14px;}
.lm-btn{padding:10px 28px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;cursor:pointer;transition:all .15s;}
.lm-btn:hover{background:var(--s2);color:var(--t1);}
.lm-btn:disabled{opacity:.4;cursor:not-allowed;}
`;

const AV_BG = ['#0d1f35','#0d2918','#2a0d1e','#1e1a0d','#1a0d2e','#1a1a0d'];
const AV_C  = ['#4a9eff','#4adf8a','#df4a8a','#dfb84a','#af4adf','#df9a4a'];
function avStyle(seed) {
  const i = (typeof seed === 'string' ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
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
function renderText(text, activeTag) {
  if (!text) return null;
  return text.split(/(\#\w+|@\w+)/g).map((p, i) => {
    if (p.startsWith('#')) return (
      <span key={i} className={`c-tag ${p.slice(1).toLowerCase() === activeTag?.toLowerCase() ? 'active' : ''}`}>{p}</span>
    );
    return <span key={i}>{p}</span>;
  });
}

function PostSkeleton() {
  return (
    <div className="skel">
      <div style={{display:'flex',gap:12,marginBottom:12}}>
        <div className="sk" style={{width:44,height:44,borderRadius:11,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div className="sk" style={{height:12,width:'35%',marginBottom:7,borderRadius:4}}/>
          <div className="sk" style={{height:10,width:'20%',borderRadius:4}}/>
        </div>
      </div>
      <div className="sk" style={{height:12,width:'100%',marginBottom:6,borderRadius:4}}/>
      <div className="sk" style={{height:12,width:'80%',borderRadius:4}}/>
    </div>
  );
}

export default function HashtagPage() {
  const { t } = useTranslation();
  const { tag }  = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState('latest');
  const [page,    setPage]    = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setPosts([]); setPage(0); setLoading(true);
    fetchPosts(0, true);
  }, [tag, sort]);

  const fetchPosts = async (p, reset = false) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      // Try dedicated hashtag endpoint first; fall back to discover + client filter
      let items = [];
      let next  = false;
      try {
        const res  = await hashtagService.getHashtagPosts(tag, p, 20);
        const data = res?.data ?? res;
        items = data?.content ?? (Array.isArray(data) ? data : []);
        next  = data?.hasNext ?? false;
      } catch {
        // Fallback: load discover and filter
        const res  = await postService.getDiscover(p, 40);
        const data = res?.data ?? res;
        const all  = data?.content ?? (Array.isArray(data) ? data : []);
        items = all.filter(post => post.content?.toLowerCase().includes(`#${tag.toLowerCase()}`));
        next  = data?.hasNext ?? false;
      }

      // Client-side sort
      if (sort !== 'latest') {
        items = [...items].sort((a, b) => {
          const ar = (a.reactions ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
          const br = (b.reactions ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
          return br - ar;
        });
      }

      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasNext(next);
      setPage(p + 1);
    } catch { /* no-op */ }
    finally { reset ? setLoading(false) : setLoadingMore(false); }
  };

  return (
    <>
      <style>{css}</style>
      <Layout active="feed">
        <main className="htag-main">
          <div className="htag-hero">
            <button className="htag-back" onClick={() => navigate(window.history.length > 1 ? -1 : '/feed')}>← Back</button>
            <div className="htag-header">
              <div className="htag-title-block">
                <div className="htag-label">Hashtag</div>
                <div className="htag-name">#{tag}</div>
                {!loading && (
                  <div className="htag-count">{posts.length} post{posts.length !== 1 ? 's' : ''}</div>
                )}
              </div>
              <div className="htag-sort">
                <button className={`hs-btn ${sort === 'latest' ? 'active' : ''}`} onClick={() => setSort('latest')}>
                  🕐 Latest
                </button>
                <button className={`hs-btn ${sort === 'top' ? 'active' : ''}`} onClick={() => setSort('top')}>
                  🔥 Top
                </button>
              </div>
            </div>
          </div>
          <div className="htag-divider" />

          {loading ? (
            [1,2,3].map(i => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="htag-empty">
              <div className="he-ic">#️⃣</div>
              <div className="he-t">No Posts Yet</div>
              <p className="he-s">No one has used #{tag} yet. Be the first to post with this hashtag!</p>
            </div>
          ) : (
            <>
              {posts.map((p, i) => {
                const ini    = getInitials(p.authorDisplayName, p.authorEmail);
                const totalRx = (p.reactions ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    onClick={() => navigate(`/post/${p.id}`)}
                  >
                    <div className="card-head">
                      <div
                        className="c-ava"
                        style={avStyle(p.authorId)}
                        onClick={e => { e.stopPropagation(); navigate(`/profile/${p.authorId}`); }}
                      >
                        {ini}
                      </div>
                      <div className="c-meta">
                        <div className="c-name" onClick={e => { e.stopPropagation(); navigate(`/profile/${p.authorId}`); }}>
                          {p.authorDisplayName || p.authorEmail || 'Unknown'}
                        </div>
                        <div className="c-sub">{timeAgo(p.createdAt)}</div>
                      </div>
                    </div>
                    {p.content && (
                      <div className="card-body">{renderText(p.content, tag)}</div>
                    )}
                    <div className="card-stats">
                      {totalRx > 0 && <span>👍 {totalRx}</span>}
                      {p.commentCount > 0 && <span>💬 {p.commentCount}</span>}
                    </div>
                  </div>
                );
              })}
              {hasNext && (
                <div className="load-more">
                  <button className="lm-btn" onClick={() => fetchPosts(page)} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load more'}
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
