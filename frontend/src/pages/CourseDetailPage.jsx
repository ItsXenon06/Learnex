import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";
import postService from "../services/postService";

const css = `
.course-detail-main{min-width:0;padding:24px 28px 90px;}

.cd-header{display:flex;align-items:flex-start;gap:20px;margin-bottom:32px;}
.cd-banner{width:100px;height:100px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:48px;background:linear-gradient(135deg,var(--s2),var(--s1));}
.cd-info{flex:1;}
.cd-title{font-family:var(--fd);font-size:28px;letter-spacing:2px;margin-bottom:8px;}
.cd-code{font-size:13px;color:var(--t3);font-family:var(--fm);margin-bottom:12px;}
.cd-meta{display:flex;gap:16px;font-size:13px;color:var(--t3);}

.cd-section{margin-bottom:28px;}
.cd-section-title{font-family:var(--fd);font-size:18px;letter-spacing:1px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--b1);}

/* Forum posts list */
.forum-posts{display:flex;flex-direction:column;gap:8px;}
.forum-post-item{
  background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:14px 16px;
  cursor:pointer;transition:all .15s;
}
.forum-post-item:hover{border-color:rgba(232,25,44,.3);background:var(--s2);}
.fpi-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.fpi-author{font-size:12px;font-weight:700;color:var(--t2);}
.fpi-time{font-size:11px;color:var(--t4);font-family:var(--fm);}
.fpi-content{font-size:13px;color:var(--t1);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

.empty-forum{text-align:center;padding:28px;border:1px solid var(--b1);border-radius:10px;background:linear-gradient(135deg,rgba(232,25,44,.02),transparent);}
.empty-ic{font-size:32px;margin-bottom:8px;}
.empty-t{font-size:14px;color:var(--t2);font-weight:700;margin-bottom:4px;}
.empty-s{font-size:12px;color:var(--t3);}

/* Compose button */
.create-post-btn{display:inline-block;padding:10px 20px;background:var(--grad-fire);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all .18s;margin-bottom:16px;box-shadow:0 3px 14px var(--red-glow);}
.create-post-btn:hover{transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}

.loading{text-align:center;padding:20px;color:var(--t3);}
.error{padding:12px;background:rgba(232,25,44,.1);border:1px solid var(--red-border);border-radius:8px;color:var(--red);font-size:13px;}
`;

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseRes = await courseService.getCourse(courseId);
        setCourse(courseRes.data);

        try {
          const postsRes = await courseService.getCoursePosts(courseId);
          setPosts(postsRes.data?.content || []);
        } catch (postsErr) {
          console.warn("[v0] Could not fetch course posts:", postsErr?.response?.status);
          setPosts([]);
        }
        setError("");
      } catch (err) {
        console.error("[v0] Error loading course details:", err);
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handlePostClick = (postId) => {
    navigate(`/courses/${courseId}/posts/${postId}`);
  };

  const handleCreatePost = () => {
    navigate(`/courses/${courseId}/create-post`);
  };

  if (loading) {
    return (
      <Layout active="courses">
        <main className="course-detail-main">
          <div className="loading">Loading course details...</div>
        </main>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout active="courses">
        <main className="course-detail-main">
          <div className="error">Course not found</div>
        </main>
      </Layout>
    );
  }

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="course-detail-main">
          {/* Course Header */}
          <div className="cd-header">
            <div
              className="cd-banner"
              style={{
                background: `linear-gradient(135deg,${course.color},transparent)`,
              }}
            >
              📚
            </div>
            <div className="cd-info">
              <h1 className="cd-title">{course.title}</h1>
              <div className="cd-code">{course.code}</div>
              <div className="cd-meta">
                <span>⭐ {course.enrolled} stars</span>
                <span>·</span>
                <span>{course.dept}</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--t2)", marginTop: "12px", lineHeight: "1.6" }}>
                {course.description}
              </p>
            </div>
          </div>

          {/* Course Forum Section */}
          <div className="cd-section">
            <div className="cd-section-title">📋 Course Forum</div>

            {user && (
              <button className="create-post-btn" onClick={handleCreatePost}>
                + Start Discussion
              </button>
            )}

            {error && <div className="error">{error}</div>}

            {posts.length === 0 ? (
              <div className="empty-forum">
                <div className="empty-ic">💭</div>
                <div className="empty-t">No discussions yet</div>
                <div className="empty-s">Be the first to start a discussion about this course</div>
              </div>
            ) : (
              <div className="forum-posts">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="forum-post-item"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="fpi-header">
                      <span className="fpi-author">{post.authorDisplayName || post.authorEmail}</span>
                      <span className="fpi-time">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="fpi-content">{post.content.substring(0, 150)}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </Layout>
    </>
  );
}
