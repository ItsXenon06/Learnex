import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";

const css = `
.course-detail-main{min-width:0;padding:24px 28px 90px;}

.cd-back{display:flex;align-items:center;gap:8px;background:none;border:none;color:var(--t3);
  font-size:13px;font-family:var(--fb);font-weight:600;cursor:pointer;padding:0;
  margin-bottom:20px;transition:color .15s;letter-spacing:.3px;}
.cd-back:hover{color:var(--t1);}

.cd-header{display:flex;align-items:flex-start;gap:20px;margin-bottom:32px;
  background:var(--s1);border:1px solid var(--b1);border-radius:14px;padding:24px;
  position:relative;overflow:hidden;}
.cd-header::before{content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(232,25,44,.04),transparent 60%);pointer-events:none;}
.cd-banner{width:80px;height:80px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:40px;
  background:linear-gradient(135deg,var(--s2),var(--s3));}
.cd-info{flex:1;position:relative;z-index:1;}
.cd-title{font-family:var(--fd);font-size:26px;letter-spacing:2px;margin-bottom:6px;}
.cd-code{font-size:12px;color:var(--t3);font-family:var(--fm);margin-bottom:10px;
  display:inline-flex;align-items:center;gap:6px;padding:3px 10px;
  background:var(--s3);border:1px solid var(--b2);border-radius:5px;}
.cd-meta{display:flex;gap:16px;font-size:13px;color:var(--t3);margin-bottom:10px;}
.cd-desc{font-size:13px;color:var(--t2);line-height:1.7;}

.cd-section{margin-bottom:28px;}
.cd-section-title{font-family:var(--fd);font-size:18px;letter-spacing:1px;margin-bottom:16px;
  padding-bottom:12px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:8px;}

.forum-posts{display:flex;flex-direction:column;gap:8px;}
.forum-post-item{
  background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:16px;
  cursor:pointer;transition:all .2s;position:relative;overflow:hidden;
}
.forum-post-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  background:transparent;transition:background .2s;border-radius:10px 0 0 10px;}
.forum-post-item:hover{border-color:rgba(232,25,44,.3);background:var(--s2);}
.forum-post-item:hover::before{background:rgba(232,25,44,.5);}
.fpi-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.fpi-author{display:flex;align-items:center;gap:8px;}
.fpi-av{width:26px;height:26px;border-radius:7px;background:var(--grad-fire);
  display:flex;align-items:center;justify-content:center;font-family:var(--fd);
  font-size:10px;color:#fff;flex-shrink:0;}
.fpi-name{font-size:12px;font-weight:700;color:var(--t2);}
.fpi-time{font-size:11px;color:var(--t4);font-family:var(--fm);}
.fpi-content{font-size:13px;color:var(--t1);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.fpi-footer{display:flex;align-items:center;gap:12px;margin-top:10px;
  font-size:11px;color:var(--t4);font-family:var(--fm);}

.empty-forum{text-align:center;padding:40px 28px;border:1px dashed var(--b2);
  border-radius:12px;background:linear-gradient(135deg,rgba(232,25,44,.02),transparent);}
.empty-ic{font-size:36px;margin-bottom:10px;opacity:.6;}
.empty-t{font-size:14px;color:var(--t2);font-weight:700;margin-bottom:4px;font-family:var(--fd);letter-spacing:1px;}
.empty-s{font-size:12px;color:var(--t3);line-height:1.7;}

.create-post-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 20px;background:var(--grad-fire);color:#fff;border:none;border-radius:8px;
  font-size:12px;font-weight:800;cursor:pointer;transition:all .18s;margin-bottom:16px;
  box-shadow:0 3px 14px var(--red-glow);letter-spacing:.6px;text-transform:uppercase;
  font-family:var(--fb);
}
.create-post-btn:hover{transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}

.loading{text-align:center;padding:40px;color:var(--t3);font-family:var(--fm);font-size:13px;}
.error-msg{padding:12px 16px;background:rgba(232,25,44,.1);border:1px solid var(--red-border);
  border-radius:8px;color:var(--red);font-size:13px;margin-bottom:16px;}

.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}
`;

const AV_BG = ["#0d1f35","#0d2918","#2a0d1e","#1e1a0d","#1a0d2e"];
const AV_C  = ["#4a9eff","#4adf8a","#df4a8a","#dfb84a","#af4adf"];
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

export default function CourseDetailPage() {
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
        // FIX: api.js already unwraps ApiResponse, so res.data is CourseResponse directly
        // Previously was res.data.data (double unwrap) which gave undefined
        const courseRes = await courseService.getCourse(courseId);
        setCourse(courseRes.data ?? courseRes);
        setError("");
      } catch (err) {
        console.error("[v0] Error loading course:", err);
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }

      try {
        setPostsLoading(true);
        const postsRes = await courseService.getCoursePosts(courseId);
        // getCoursePosts returns Page<PostResponse>; content is the array
        const data = postsRes?.data ?? postsRes;
        setPosts(data?.content ?? (Array.isArray(data) ? data : []));
      } catch (postsErr) {
        console.warn("[v0] Could not fetch course posts:", postsErr?.response?.status);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // FIX: navigate to /post/:postId (which exists in App.jsx)
  // Previously navigated to /courses/:courseId/posts/:postId which is not a route
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleCreatePost = () => {
    navigate(`/courses/${courseId}/create-post`);
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="course-detail-main">
            <div className="loading">Loading course…</div>
          </main>
        </Layout>
      </>
    );
  }

  if (!course || error) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="course-detail-main">
            <div className="error-msg">{error || "Course not found"}</div>
          </main>
        </Layout>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="course-detail-main">
          <button className="cd-back" onClick={() => navigate("/courses")}>
            ← Courses
          </button>

          {/* Course Header */}
          <div className="cd-header">
            <div
              className="cd-banner"
              style={{ background: `linear-gradient(135deg,${course.color ?? "rgba(74,158,255,.3)"},transparent)` }}
            >
              📚
            </div>
            <div className="cd-info">
              <h1 className="cd-title">{course.name}</h1>
              <div className="cd-code">{course.code}</div>
              <div className="cd-meta">
                <span>🎓 {course.enrolled ?? 0} enrolled</span>
                <span>·</span>
                <span>{course.department}</span>
              </div>
              {course.description && (
                <p className="cd-desc">{course.description}</p>
              )}
            </div>
          </div>

          {/* Course Forum Section */}
          <div className="cd-section">
            <div className="cd-section-title">📋 Discussions</div>

            {user && (
              <button className="create-post-btn" onClick={handleCreatePost}>
                ✎ Start Discussion
              </button>
            )}

            {postsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <div className="sk" style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="sk" style={{ height: 11, width: "30%", marginBottom: 6, borderRadius: 4 }} />
                      </div>
                    </div>
                    <div className="sk" style={{ height: 12, width: "100%", marginBottom: 5, borderRadius: 4 }} />
                    <div className="sk" style={{ height: 12, width: "70%", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-forum">
                <div className="empty-ic">💭</div>
                <div className="empty-t">No Discussions Yet</div>
                <div className="empty-s">Be the first to start a discussion about this course.</div>
              </div>
            ) : (
              <div className="forum-posts">
                {posts.map((post) => {
                  const ini = getInitials(post.authorDisplayName, post.authorEmail);
                  return (
                    <div
                      key={post.id}
                      className="forum-post-item"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div className="fpi-header">
                        <div className="fpi-author">
                          <div className="fpi-av" style={avStyle(post.authorId)}>
                            {ini}
                          </div>
                          <span className="fpi-name">
                            {post.authorDisplayName || post.authorEmail || "Student"}
                          </span>
                        </div>
                        <span className="fpi-time">{timeAgo(post.createdAt)}</span>
                      </div>
                      <div className="fpi-content">{post.content}</div>
                      <div className="fpi-footer">
                        {(post.commentCount ?? 0) > 0 && (
                          <span>💬 {post.commentCount}</span>
                        )}
                        {post.reactions?.reduce((s, r) => s + (r.count ?? 0), 0) > 0 && (
                          <span>👍 {post.reactions.reduce((s, r) => s + (r.count ?? 0), 0)}</span>
                        )}
                        <span style={{ marginLeft: "auto", color: "var(--red)", fontWeight: 700, fontSize: 10, letterSpacing: ".3px" }}>
                          VIEW →
                        </span>
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