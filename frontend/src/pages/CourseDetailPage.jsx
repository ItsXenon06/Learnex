import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.cd-main {
  min-width: 0;
  padding: 32px 36px 100px;
  background: var(--bg);
}

/* ── Back button ── */
.cd-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  color: var(--t3);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 28px;
  transition: color .15s;
  letter-spacing: .1px;
}
.cd-back:hover { color: var(--t1); }
.cd-back-arrow {
  font-size: 16px;
  line-height: 1;
  transition: transform .15s;
}
.cd-back:hover .cd-back-arrow { transform: translateX(-3px); }

/* ── Hero card ── */
.cd-hero {
  border-radius: 20px;
  border: 1px solid var(--b1);
  background: var(--s1);
  overflow: hidden;
  margin-bottom: 24px;
  position: relative;
}

/* accent stripe on left */
.cd-hero-stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: 20px 0 0 20px;
}

.cd-hero-inner {
  padding: 28px 30px 28px 34px;
  display: flex;
  align-items: flex-start;
  gap: 22px;
}

/* Icon block */
.cd-hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  border: 1px solid var(--b1);
  background: var(--s2);
}

.cd-hero-text { flex: 1; min-width: 0; }

.cd-code-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  width: fit-content;
}

.cd-course-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: rgba(255,255,255,.78);
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin-bottom: 10px;
}

.cd-course-desc {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  color: var(--t3);
  line-height: 1.7;
  margin-bottom: 18px;
}

/* Meta chips row */
.cd-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.cd-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--s2);
  border: 1px solid var(--b1);
  border-radius: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--t2);
}
.cd-meta-chip-ic {
  font-size: 13px;
  line-height: 1;
}

/* ── Section ── */
.cd-section {
  margin-bottom: 20px;
}
.cd-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b1);
}
.cd-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,.75);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.1px;
}
.cd-section-title-ic {
  font-size: 16px;
  line-height: 1;
}
.cd-post-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: var(--t4);
  letter-spacing: 1px;
}

/* ── New post button ── */
.cd-new-post-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: rgba(220, 60, 60, .1);
  color: #f87171;
  border: 1px solid rgba(220, 60, 60, .25);
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  letter-spacing: .1px;
}
.cd-new-post-btn:hover {
  background: rgba(220, 60, 60, .18);
  border-color: rgba(220, 60, 60, .4);
  color: #fca5a5;
  transform: translateY(-1px);
}

/* ── Post list ── */
.cd-posts { display: flex; flex-direction: column; gap: 10px; }

.cd-post {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 14px;
  padding: 18px 20px;
  cursor: pointer;
  transition: border-color .18s, box-shadow .18s, transform .18s;
  animation: post-in .35s cubic-bezier(.22,.68,0,1.1) both;
  position: relative;
  overflow: hidden;
}
.cd-post::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: transparent;
  transition: background .18s;
  border-radius: 14px 0 0 14px;
}
.cd-post:hover {
  border-color: var(--b2);
  box-shadow: 0 6px 24px rgba(0,0,0,.18);
  transform: translateX(3px);
}
.cd-post:hover::before {
  background: rgba(248,113,113,.35);
}
@keyframes post-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cd-post-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.cd-post-author {
  display: flex;
  align-items: center;
  gap: 9px;
}
.cd-post-av {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.cd-post-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--t2);
}
.cd-post-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t4);
  letter-spacing: .5px;
}

.cd-post-content {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  color: var(--t1);
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}

.cd-post-footer {
  display: flex;
  align-items: center;
  gap: 14px;
}
.cd-post-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  color: var(--t4);
  font-weight: 500;
}
.cd-post-view {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #f87171;
  font-weight: 500;
  letter-spacing: .5px;
  opacity: .7;
  transition: opacity .15s;
}
.cd-post:hover .cd-post-view { opacity: 1; }

/* ── Empty discussions ── */
.cd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 28px;
  border: 1px dashed var(--b2);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(248,113,113,.03), transparent);
}
.cd-empty-ic { font-size: 38px; margin-bottom: 12px; opacity: .45; }
.cd-empty-t {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--t2);
  margin-bottom: 6px;
}
.cd-empty-s {
  font-size: 13px;
  color: var(--t3);
  line-height: 1.7;
  max-width: 260px;
}

/* ── Error / loading ── */
.cd-loading {
  padding: 60px;
  text-align: center;
  color: var(--t3);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
}
.cd-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(239,68,68,.07);
  border: 1px solid rgba(239,68,68,.2);
  border-radius: 12px;
  font-size: 13px;
  color: #f87171;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ── Skeletons ── */
.sk {
  background: var(--s3);
  border-radius: 5px;
  animation: sk-pulse 1.8s ease infinite;
}
@keyframes sk-pulse {
  0%, 100% { opacity: .18; }
  50%       { opacity: .4; }
}
.cd-skel-post {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 10px;
}
`;

/* ── Accent palette — matches CoursePage ── */
const ACCENTS = [
  { stripe: "#6366f1", tagBg: "rgba(99,102,241,.12)", tagColor: "#818cf8" },
  { stripe: "#0ea5e9", tagBg: "rgba(14,165,233,.12)", tagColor: "#38bdf8" },
  { stripe: "#10b981", tagBg: "rgba(16,185,129,.12)", tagColor: "#34d399" },
  { stripe: "#f59e0b", tagBg: "rgba(245,158,11,.12)", tagColor: "#fbbf24" },
  { stripe: "#ec4899", tagBg: "rgba(236,72,153,.12)", tagColor: "#f472b6" },
  { stripe: "#8b5cf6", tagBg: "rgba(139,92,246,.12)", tagColor: "#a78bfa" },
  { stripe: "#06b6d4", tagBg: "rgba(6,182,212,.12)", tagColor: "#22d3ee" },
  { stripe: "#ef4444", tagBg: "rgba(239,68,68,.1)",  tagColor: "#f87171" },
];

const AV_BG = ["#0d1f35","#0d2918","#2a0d1e","#1e1a0d","#1a0d2e","#1a1a0d"];
const AV_C  = ["#4a9eff","#4adf8a","#df4a8a","#dfb84a","#af4adf","#df9a4a"];

function accent(id) {
  const i = typeof id === "string"
    ? [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length
    : (id ?? 0) % ACCENTS.length;
  return ACCENTS[i];
}
function avStyle(seed) {
  const i = (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
}
function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PostSkeleton() {
  return (
    <div className="cd-skel-post">
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <div className="sk" style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0 }} />
        <div className="sk" style={{ height: 12, width: "28%", borderRadius: 4 }} />
        <div className="sk" style={{ height: 10, width: "14%", borderRadius: 4, marginLeft: "auto" }} />
      </div>
      <div className="sk" style={{ height: 13, width: "100%", marginBottom: 6, borderRadius: 4 }} />
      <div className="sk" style={{ height: 13, width: "80%", marginBottom: 6, borderRadius: 4 }} />
      <div className="sk" style={{ height: 13, width: "55%", borderRadius: 4 }} />
    </div>
  );
}

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseRes = await courseService.getCourse(courseId);
        setCourse(courseRes.data ?? courseRes);
        setError("");
      } catch (err) {
        setError(t("courses.loadDetailsFailed"));
      } finally {
        setLoading(false);
      }

      try {
        setPostsLoading(true);
        const postsRes = await courseService.getCoursePosts(courseId);
        const data = postsRes?.data ?? postsRes;
        setPosts(data?.content ?? (Array.isArray(data) ? data : []));
      } catch {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handlePostClick = (postId) => navigate(`/post/${postId}`);
  const handleCreatePost = () => navigate(`/courses/${courseId}/create-post`);

  /* ── Loading state ── */
  if (loading) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="cd-main">
            <div className="cd-loading">{t("courseDetail.loadingCourse")}</div>
          </main>
        </Layout>
      </>
    );
  }

  /* ── Error state ── */
  if (!course || error) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="cd-main">
            <button className="cd-back" onClick={() => navigate("/courses")}>
              <span className="cd-back-arrow">←</span>
              {t("courseDetail.backBtn")}
            </button>
            <div className="cd-error">⚠ {error || t("courses.notFound")}</div>
          </main>
        </Layout>
      </>
    );
  }

  const a = accent(courseId);

function getStarCount(id) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("learnex_starred_courses_")) {
      try {
        const ids = JSON.parse(localStorage.getItem(key) || "[]");
        if (ids.includes(id)) count++;
      } catch { /* no-op */ }
    }
  }
  return count;
}

const localStarCount = getStarCount(courseId);
const enrolled = (course.enrolled ?? 0) + localStarCount;
const starCount = course.starCount ?? 0;

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="cd-main">

          {/* Back */}
          <button className="cd-back" onClick={() => navigate("/courses")}>
            <span className="cd-back-arrow">←</span>
            {t("courseDetail.backBtn")}
          </button>

          {/* ── Hero ── */}
          <div className="cd-hero">
            <div className="cd-hero-stripe" style={{ background: a.stripe }} />
            <div className="cd-hero-inner">
              <div className="cd-hero-icon">📚</div>

              <div className="cd-hero-text">
                {course.code && (
                  <div className="cd-code-pill" style={{ background: a.tagBg, color: a.tagColor }}>
                    {course.code}
                  </div>
                )}

                <div className="cd-course-name">{course.name}</div>

                {course.description && (
                  <div className="cd-course-desc">{course.description}</div>
                )}

                <div className="cd-meta-row">
                  <div className="cd-meta-chip">
                    <span className="cd-meta-chip-ic">👤</span>
                    {t("courseDetail.enrolled", { count: enrolled })}
                  </div>
                  {starCount > 0 && (
                    <div className="cd-meta-chip">
                      <span className="cd-meta-chip-ic">⭐</span>
                      {t("courseDetail.starCount", { count: starCount })}
                    </div>
                  )}
                  {course.department && (
                    <div className="cd-meta-chip">
                      <span className="cd-meta-chip-ic">🏛</span>
                      {course.department}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Discussions ── */}
          <div className="cd-section">
            <div className="cd-section-header">
              <div className="cd-section-title">
                <span className="cd-section-title-ic">💬</span>
                {t("courseDetail.discussionsTitle")}
                {!postsLoading && posts.length > 0 && (
                  <span className="cd-post-count">{posts.length} posts</span>
                )}
              </div>
              {user && (
                <button className="cd-new-post-btn" onClick={handleCreatePost}>
                  ✎ {t("courseDetail.startDiscussionBtn")}
                </button>
              )}
            </div>

            {postsLoading ? (
              <div>
                {[1,2,3].map(i => <PostSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="cd-empty">
                <div className="cd-empty-ic">💭</div>
                <div className="cd-empty-t">{t("courseDetail.noDiscussionsTitle")}</div>
                <div className="cd-empty-s">{t("courseDetail.noDiscussionsHint")}</div>
              </div>
            ) : (
              <div className="cd-posts">
                {posts.map((post, i) => {
                  const ini = getInitials(post.authorDisplayName, post.authorEmail);
                  const rxTotal = (post.reactions ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
                  return (
                    <div
                      key={post.id}
                      className="cd-post"
                      style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div className="cd-post-head">
                        <div className="cd-post-author">
                          <div className="cd-post-av" style={avStyle(post.authorId)}>
                            {ini}
                          </div>
                          <span className="cd-post-name">
                            {post.authorDisplayName || post.authorEmail || "Student"}
                          </span>
                        </div>
                        <span className="cd-post-time">{timeAgo(post.createdAt)}</span>
                      </div>

                      <div className="cd-post-content">{post.content}</div>

                      <div className="cd-post-footer">
                        {(post.commentCount ?? 0) > 0 && (
                          <div className="cd-post-stat">
                            <span>💬</span>
                            {post.commentCount}
                          </div>
                        )}
                        {rxTotal > 0 && (
                          <div className="cd-post-stat">
                            <span>👍</span>
                            {rxTotal}
                          </div>
                        )}
                        <span className="cd-post-view">{t("courseDetail.viewArrow")} VIEW →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </Layout>
    </>
  );
}