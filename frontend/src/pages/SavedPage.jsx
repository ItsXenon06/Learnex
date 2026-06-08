import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout, { sharedCss } from "../components/Layout";
import postService from "../services/postService";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.saved-main{min-width:0;padding:24px 28px 90px;}

.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.ph-left{display:flex;align-items:baseline;gap:12px;}
.ph-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;}
.ph-count{font-size:13px;color:var(--t3);font-family:var(--fm);}

.saved-list{display:flex;flex-direction:column;gap:8px;}

.saved-card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  display:flex;gap:0;overflow:hidden;
  transition:border-color .2s,box-shadow .15s;
  animation:sv-up .35s var(--ease) both;
}
.saved-card:hover{border-color:rgba(255,255,255,.1);box-shadow:0 4px 16px rgba(0,0,0,.2);}
@keyframes sv-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Left accent stripe */
.saved-stripe{width:3px;flex-shrink:0;background:var(--grad-fire);opacity:.6;}

/* Card body */
.saved-body{flex:1;padding:14px 16px;cursor:pointer;min-width:0;}
.saved-author{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.saved-av{width:32px;height:32px;border-radius:8px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:12px;color:#fff;}
.saved-name{font-size:13px;font-weight:700;}
.saved-time{font-size:11px;color:var(--t3);font-family:var(--fm);margin-left:auto;}
.saved-content{font-size:14px;line-height:1.7;color:var(--t1);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.saved-meta{display:flex;align-items:center;gap:12px;font-size:12px;color:var(--t3);font-family:var(--fm);}
.saved-tag{display:inline-block;padding:3px 9px;background:var(--red-sub);border:1px solid var(--red-border);border-radius:5px;font-size:11px;color:var(--red);font-weight:700;font-family:var(--fm);}

/* Unsave button */
.unsave-col{display:flex;align-items:center;padding:0 14px;border-left:1px solid var(--b1);}
.unsave-btn{
  width:32px;height:32px;border-radius:7px;border:none;
  background:transparent;color:var(--t3);font-size:16px;
  cursor:pointer;transition:all .15s;
  display:flex;align-items:center;justify-content:center;
}
.unsave-btn:hover{background:var(--red-sub);color:var(--red);}

/* Skeleton */
.saved-skel{display:flex;flex-direction:column;gap:8px;}
.sskel{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:14px 16px;display:flex;gap:12px;}
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const AV_BG = ["#0d1f35", "#0d2918", "#2a0d1e", "#1e1a0d", "#1a0d2e"];
const AV_C = ["#4a9eff", "#4adf8a", "#df4a8a", "#dfb84a", "#af4adf"];
function avStyle(id) {
  const i = id ? String(id).charCodeAt(0) % AV_BG.length : 0;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="saved-skel">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="sskel">
          <div
            className="sk"
            style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="sk"
              style={{
                height: 12,
                width: "35%",
                marginBottom: 10,
                borderRadius: 5,
              }}
            />
            <div
              className="sk"
              style={{
                height: 12,
                width: "100%",
                marginBottom: 6,
                borderRadius: 5,
              }}
            />
            <div
              className="sk"
              style={{ height: 12, width: "75%", borderRadius: 5 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── SavedPage ───────────────────────────────────────────────────────────── */
export default function SavedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.userId ?? user?.id;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsaving, setUnsaving] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    postService
      .getSavedPosts()
      .then((res) => {
        const data = res?.data ?? res;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        setPosts(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  const unsave = async (e, postId) => {
    e.stopPropagation();
    setUnsaving(postId);
    try {
      await postService.unsavePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      /* no-op */
    } finally {
      setUnsaving(null);
    }
  };

  return (
    <>
      <style>{css}</style>
      <Layout active="saved">
        <main className="saved-main">
          <div className="ph">
            <div className="ph-left">
              <span className="ph-title">{t("saved.title")}</span>
              {posts.length > 0 && (
                <span className="ph-count">
                  {t(posts.length === 1 ? "saved.postCount_one" : "saved.postCount_other", { count: posts.length })}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <Skeleton />
          ) : posts.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">🔖</div>
              <div className="lx-empty-t">{t("saved.emptyTitle")}</div>
              <p className="lx-empty-s">
                {t("saved.emptyHint")}
              </p>
            </div>
          ) : (
            <div className="saved-list">
              {posts.map((p, i) => {
                const authorIni = getInitials(
                  p.authorDisplayName,
                  p.authorEmail,
                );
                const tags = p.hashtags?.map((h) => `#${h}`) ?? [];

                return (
                  <div
                    key={p.id}
                    className="saved-card"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="saved-stripe" />
                    <div
                      className="saved-body"
                      onClick={() => navigate(`/post/${p.id}`)}
                    >
                      <div className="saved-author">
                        <div
                          className="saved-av"
                          style={{ ...avStyle(p.authorId), cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${p.authorId}`);
                          }}
                        >
                          {authorIni}
                        </div>
                        <span
                          className="saved-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${p.authorId}`);
                          }}
                          style={{
                            cursor: "pointer",
                            transition: "color .15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "var(--red)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "")
                          }
                        >
                          {p.authorDisplayName || p.authorEmail || "Unknown"}
                        </span>
                        <span className="saved-time">
                          {timeAgo(p.createdAt)}
                        </span>
                      </div>

                      {p.content && (
                        <div className="saved-content">{p.content}</div>
                      )}

                      <div className="saved-meta">
                        {tags.slice(0, 3).map((t) => (
                          <span key={t} className="saved-tag">
                            {t}
                          </span>
                        ))}
                        {p.commentCount > 0 && <span>💬 {p.commentCount}</span>}
                        {p.reactions?.reduce((s, r) => s + (r.count ?? 0), 0) >
                          0 && (
                          <span>
                            👍{" "}
                            {p.reactions.reduce(
                              (s, r) => s + (r.count ?? 0),
                              0,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unsave */}
                    <div className="unsave-col">
                      <button
                        className="unsave-btn"
                        title={t("saved.removeTooltip")}
                        onClick={(e) => unsave(e, p.id)}
                        disabled={unsaving === p.id}
                      >
                        {unsaving === p.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </Layout>
    </>
  );
}