import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getInitials } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import userService from '../services/userService';
import postService from '../services/postService';
import hashtagService from '../services/hashtagService';
import groupService from '../services/groupService';
import courseService from '../services/courseService';

const css = `
.search-main{min-width:0;padding:24px 28px 90px;}

.search-hero{margin-bottom:24px;}
.search-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;margin-bottom:14px;}
.search-bar-wrap{position:relative;max-width:560px;}
.search-bar{
  width:100%;background:var(--s1);border:1px solid var(--b2);border-radius:12px;
  padding:13px 18px 13px 48px;color:var(--t1);font-size:15px;font-family:var(--fb);
  outline:none;transition:border-color .2s,box-shadow .2s;
}
.search-bar:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.search-bar::placeholder{color:var(--t4);}
.search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;color:var(--t3);}
.search-clear{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--t3);font-size:15px;cursor:pointer;padding:2px 6px;border-radius:5px;transition:all .12s;}
.search-clear:hover{background:var(--s3);color:var(--t1);}

.search-tabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:18px;}
.stab{padding:11px 22px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;transition:all .2s;position:relative;}
.stab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.stab:hover{color:var(--t2);}
.stab.on{color:var(--t1);}
.stab.on::after{transform:scaleX(1);}
.stab-cnt{color:var(--t4);font-family:var(--fm);margin-left:5px;font-size:11px;}

/* User results */
.user-list{display:flex;flex-direction:column;gap:6px;}
.user-card{
  display:flex;align-items:center;gap:14px;
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  padding:14px 18px;cursor:pointer;
  transition:border-color .2s,box-shadow .15s,transform .15s;
  animation:sr-up .3s var(--ease) both;
}
.user-card:hover{border-color:rgba(255,255,255,.1);box-shadow:0 4px 14px rgba(0,0,0,.2);transform:translateX(3px);}
@keyframes sr-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.user-av{
  width:48px;height:48px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:18px;color:#fff;overflow:hidden;
}
.user-info{flex:1;min-width:0;}
.user-name{font-size:15px;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:8px;}
.user-email{font-size:12px;color:var(--t3);font-family:var(--fm);}
.user-headline{font-size:12px;color:var(--t2);margin-top:2px;}
.user-arrow{font-size:18px;color:var(--t4);transition:color .15s,transform .15s;}
.user-card:hover .user-arrow{color:var(--red);transform:translateX(3px);}

/* Post results */
.post-list{display:flex;flex-direction:column;gap:8px;}
.post-result{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  padding:16px 18px;cursor:pointer;
  transition:border-color .2s,box-shadow .15s;
  animation:sr-up .3s var(--ease) both;
  position:relative;overflow:hidden;
}
.post-result::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .2s;border-radius:12px 0 0 12px;}
.post-result:hover::before{background:rgba(232,25,44,.35);}
.post-result:hover{border-color:rgba(255,255,255,.09);box-shadow:0 4px 14px rgba(0,0,0,.18);}
.pr-author{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.pr-av{width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:11px;color:#fff;}
.pr-name{font-size:13px;font-weight:700;}
.pr-time{font-size:11px;color:var(--t3);font-family:var(--fm);margin-left:auto;}
.pr-content{font-size:14px;line-height:1.7;color:var(--t1);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;}
.pr-highlight{background:rgba(232,25,44,.18);color:var(--red);border-radius:3px;padding:0 2px;font-weight:700;}
.pr-meta{display:flex;align-items:center;gap:12px;font-size:12px;color:var(--t3);font-family:var(--fm);}

/* Empty / loading */
.search-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;color:var(--t3);}
.se-ic{font-size:48px;opacity:.4;}
.se-t{font-family:var(--fd);font-size:24px;letter-spacing:3px;color:var(--t2);}
.se-s{font-size:13px;font-family:var(--fm);text-align:center;max-width:280px;line-height:1.8;}

.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}
.skel-row{display:flex;gap:14px;align-items:center;background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:14px 18px;margin-bottom:6px;}
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

// Highlight the query term inside text
function highlight(text, q) {
  if (!text || !q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="pr-highlight">{p}</mark>
      : p
  );
}

function UserSkeleton() {
  return (
    <>
      {[1,2,3].map(i => (
        <div key={i} className="skel-row">
          <div className="sk" style={{width:48,height:48,borderRadius:12,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div className="sk" style={{height:13,width:'40%',marginBottom:8,borderRadius:5}}/>
            <div className="sk" style={{height:10,width:'60%',borderRadius:4}}/>
          </div>
        </div>
      ))}
    </>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  const initialQ = searchParams.get('q') || '';
  const [query,    setQuery]    = useState(initialQ);
  const [tab,      setTab]      = useState('people');
  const [users,    setUsers]    = useState([]);
  const [posts,    setPosts]    = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  // Run search when q param changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (!q.trim()) { 
      setUsers([]); setPosts([]); setHashtags([]); setGroups([]); setCourses([]);
      setSearched(false); 
      return; 
    }
    runSearch(q);
  }, [searchParams]);

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [usersRes, postsRes, hashtagsRes, groupsRes, coursesRes] = await Promise.allSettled([
        userService.search(q),
        postService.getDiscover(0, 50),
        hashtagService.getTrendingHashtags(100),
        groupService.getGroups(0, 100),
        courseService.getCourses(),
      ]);

      // Users search
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value?.data ?? usersRes.value;
        setUsers(Array.isArray(data) ? data : []);
      }

      // Posts search - client-side filter
      if (postsRes.status === 'fulfilled') {
        const data = postsRes.value?.data ?? postsRes.value;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        const lower = q.toLowerCase();
        setPosts(items.filter(p =>
          p.content?.toLowerCase().includes(lower) ||
          p.authorDisplayName?.toLowerCase().includes(lower) ||
          p.authorEmail?.toLowerCase().includes(lower)
        ));
      }

      // Hashtags search - client-side filter
      if (hashtagsRes.status === 'fulfilled') {
        const data = hashtagsRes.value?.data ?? hashtagsRes.value;
        const items = Array.isArray(data) ? data : [];
        const lower = q.toLowerCase();
        setHashtags(items.filter(h => h.toLowerCase().includes(lower)));
      }

      // Groups search - client-side filter
      if (groupsRes.status === 'fulfilled') {
        const data = groupsRes.value?.data ?? groupsRes.value;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        const lower = q.toLowerCase();
        setGroups(items.filter(g => g.name?.toLowerCase().includes(lower)));
      }

      // Courses search - client-side filter by course code or name
      if (coursesRes.status === 'fulfilled') {
        const data = coursesRes.value?.data ?? coursesRes.value;
        const items = Array.isArray(data) ? data : [];
        const lower = q.toLowerCase();
        setCourses(items.filter(c => 
          c.courseCode?.toLowerCase().includes(lower) ||
          c.courseName?.toLowerCase().includes(lower)
        ));
      }
    } catch { /* no-op */ }
    finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim() });
  };

  const handleClear = () => {
    setQuery('');
    setSearchParams({});
    setUsers([]); setPosts([]); setHashtags([]); setGroups([]); setCourses([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const q = searchParams.get('q') || '';

  return (
    <>
      <style>{css}</style>
      <Layout active="search">
        <main className="search-main">
          <div className="search-hero">
            <div className="search-title">{t('search.title')}</div>
            <form onSubmit={handleSubmit} className="search-bar-wrap">
              <span className="search-icon">🔍</span>
              <input
                ref={inputRef}
                className="search-bar"
                placeholder={t('search.placeholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button type="button" className="search-clear" onClick={handleClear}>✕</button>
              )}
            </form>
          </div>

          {!searched ? (
            <div className="search-empty">
              <div className="se-ic">🔍</div>
              <div className="se-t">{t('search.emptyHeading')}</div>
              <p className="se-s">{t('search.emptyDescription')}</p>
            </div>
          ) : (
            <>
              <div className="search-tabs">
                <button className={`stab ${tab === 'people' ? 'on' : ''}`} onClick={() => setTab('people')}>
                  {t('search.tabs.people')} <span className="stab-cnt">{users.length}</span>
                </button>
                <button className={`stab ${tab === 'posts' ? 'on' : ''}`} onClick={() => setTab('posts')}>
                  {t('search.tabs.posts')} <span className="stab-cnt">{posts.length}</span>
                </button>
                <button className={`stab ${tab === 'hashtags' ? 'on' : ''}`} onClick={() => setTab('hashtags')}>
                  Hashtags <span className="stab-cnt">{hashtags.length}</span>
                </button>
                <button className={`stab ${tab === 'groups' ? 'on' : ''}`} onClick={() => setTab('groups')}>
                  Groups <span className="stab-cnt">{groups.length}</span>
                </button>
                <button className={`stab ${tab === 'courses' ? 'on' : ''}`} onClick={() => setTab('courses')}>
                  Courses <span className="stab-cnt">{courses.length}</span>
                </button>
              </div>

              {tab === 'people' && (
                loading ? <UserSkeleton /> :
                users.length === 0 ? (
                  <div className="search-empty">
                    <div className="se-ic">👤</div>
                    <div className="se-t">{t('search.noPeopleTitle')}</div>
                    <p className="se-s">{t('search.noPeopleDescription', { query: q })}</p>
                  </div>
                ) : (
                  <div className="user-list">
                    {users.map((u, i) => {
                      const id  = u.userId ?? u.id;
                      const ini = getInitials(u.displayName, u.email);
                      return (
                        <div
                          key={id}
                          className="user-card"
                          style={{ animationDelay: `${i * 40}ms` }}
                          onClick={() => navigate(`/profile/${id}`)}
                        >
                          <div className="user-av" style={u.avatarUrl ? {background:'transparent',overflow:'hidden'} : avStyle(id)}>
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              : ini
                            }
                          </div>
                          <div className="user-info">
                            <div className="user-name">{highlight(u.displayName || u.email?.split('@')[0], q)}</div>
                            <div className="user-email">{u.email}</div>
                            {u.headline && <div className="user-headline">{u.headline}</div>}
                          </div>
                          <span className="user-arrow">→</span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {tab === 'posts' && (
                loading ? <UserSkeleton /> :
                posts.length === 0 ? (
                  <div className="search-empty">
                    <div className="se-ic">📝</div>
                    <div className="se-t">{t('search.noPostsTitle')}</div>
                    <p className="se-s">{t('search.noPostsDescription', { query: q })}</p>
                  </div>
                ) : (
                  <div className="post-list">
                    {posts.map((p, i) => {
                      const ini = getInitials(p.authorDisplayName, p.authorEmail);
                      const totalRx = (p.reactions ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
                      return (
                        <div
                          key={p.id}
                          className="post-result"
                          style={{ animationDelay: `${i * 35}ms` }}
                          onClick={() => navigate(`/post/${p.id}`)}
                        >
                          <div className="pr-author">
                            <div className="pr-av" style={avStyle(p.authorId)}>{ini}</div>
                            <span className="pr-name">{p.authorDisplayName || p.authorEmail}</span>
                            <span className="pr-time">{timeAgo(p.createdAt)}</span>
                          </div>
                          {p.content && (
                            <div className="pr-content">{highlight(p.content, q)}</div>
                          )}
                          <div className="pr-meta">
                            {totalRx > 0 && <span>👍 {totalRx}</span>}
                            {p.commentCount > 0 && <span>💬 {p.commentCount}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {tab === 'hashtags' && (
                loading ? <UserSkeleton /> :
                hashtags.length === 0 ? (
                  <div className="search-empty">
                    <div className="se-ic">#️⃣</div>
                    <div className="se-t">No Hashtags</div>
                    <p className="se-s">No hashtags matching "{q}"</p>
                  </div>
                ) : (
                  <div className="user-list">
                    {hashtags.map((h, i) => (
                      <div
                        key={h}
                        className="user-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => navigate(`/hashtag/${encodeURIComponent(h)}`)}
                      >
                        <div className="user-av" style={{background:'var(--blue)',fontSize:'20px'}}>#{h.charAt(0).toUpperCase()}</div>
                        <div className="user-info">
                          <div className="user-name">{highlight(h, q)}</div>
                          <div className="user-email">Hashtag</div>
                        </div>
                        <span className="user-arrow">→</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'groups' && (
                loading ? <UserSkeleton /> :
                groups.length === 0 ? (
                  <div className="search-empty">
                    <div className="se-ic">👥</div>
                    <div className="se-t">No Groups</div>
                    <p className="se-s">No groups matching "{q}"</p>
                  </div>
                ) : (
                  <div className="user-list">
                    {groups.map((g, i) => (
                      <div
                        key={g.id}
                        className="user-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => navigate(`/groups/${g.id}`)}
                      >
                        <div className="user-av" style={{background:'var(--purple)',fontSize:'20px'}}>👥</div>
                        <div className="user-info">
                          <div className="user-name">{highlight(g.name, q)}</div>
                          <div className="user-email">{g.memberCount ?? 0} members</div>
                        </div>
                        <span className="user-arrow">→</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'courses' && (
                loading ? <UserSkeleton /> :
                courses.length === 0 ? (
                  <div className="search-empty">
                    <div className="se-ic">📚</div>
                    <div className="se-t">No Courses</div>
                    <p className="se-s">No courses matching "{q}"</p>
                  </div>
                ) : (
                  <div className="user-list">
                    {courses.map((c, i) => (
                      <div
                        key={c.id}
                        className="user-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => navigate(`/courses/${c.id}`)}
                      >
                        <div className="user-av" style={{background:'var(--gold)',fontSize:'20px'}}>📚</div>
                        <div className="user-info">
                          <div className="user-name">{highlight(c.courseCode ?? c.courseName, q)}</div>
                          <div className="user-email">{c.courseName}</div>
                        </div>
                        <span className="user-arrow">→</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>
      </Layout>
    </>
  );
}
