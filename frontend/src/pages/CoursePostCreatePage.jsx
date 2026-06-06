import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";
import postService from "../services/postService";

const css = `
.create-post-main{min-width:0;padding:24px 28px 90px;max-width:700px;}

.cp-header{font-family:var(--fd);font-size:24px;letter-spacing:2px;margin-bottom:20px;}

.cp-form{background:var(--s1);border:1px solid var(--b1);border-radius:12px;overflow:hidden;transition:border-color .25s,box-shadow .25s;}
.cp-form:focus-within{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub),0 4px 20px rgba(0,0,0,.3);}

.cp-top{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;}
.cp-av{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:15px;color:#fff;box-shadow:0 2px 10px var(--red-glow);}

.cp-textarea{flex:1;background:transparent;border:none;color:var(--t1);font-size:15px;font-family:var(--fb);resize:none;min-height:120px;outline:none;line-height:1.7;padding-top:2px;}
.cp-textarea::placeholder{color:var(--t3);}

.cp-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px 12px;}
.cp-gap{flex:1;}

.cp-buttons{display:flex;gap:8px;}
.btn-cancel{padding:8px 18px;background:transparent;border:1px solid var(--b2);border-radius:7px;color:var(--t2);font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.btn-cancel:hover{background:var(--s3);color:var(--t1);}

.btn-submit{padding:8px 18px;background:var(--grad-fire);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;box-shadow:0 3px 14px var(--red-glow);}
.btn-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.btn-submit:disabled{opacity:.4;cursor:not-allowed;}

.error{padding:12px;background:rgba(232,25,44,.1);border:1px solid var(--red-border);border-radius:8px;color:var(--red);font-size:13px;margin-bottom:16px;}
`;

export default function CoursePostCreatePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, getInitials: getInitialsUtil } = useAuth();

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userIni = user ? getInitials(user.displayName || user.email) : "";

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await courseService.getCourse(courseId);
        setCourse(res.data.data);
        setError("");
      } catch (err) {
        console.error("[v0] Error loading course:", err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Discussion cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const response = await courseService.createCoursePost(
        courseId,
        content,
        "public"
      );
      setSubmitting(false);
      // Navigate back to course detail page
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setSubmitting(false);
      console.error("[v0] Error creating post:", err);
      setError(err?.response?.data?.message || "Failed to post discussion");
    }
  };

  if (loading) {
    return (
      <Layout active="courses">
        <main className="create-post-main">
          <div style={{ padding: "20px", color: "var(--t3)" }}>Loading...</div>
        </main>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout active="courses">
        <main className="create-post-main">
          <div className="error">Course not found</div>
        </main>
      </Layout>
    );
  }

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="create-post-main">
          <h1 className="cp-header">Start a Discussion</h1>
          <div
            style={{
              fontSize: "13px",
              color: "var(--t3)",
              marginBottom: "20px",
            }}
          >
            in <strong>{course.title}</strong>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="cp-form">
            <div className="cp-top">
              <div className="cp-av">{userIni}</div>
              <textarea
                className="cp-textarea"
                placeholder="Share your thoughts, questions, or insights about this course…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="cp-toolbar">
              <div className="cp-gap" />
              <div className="cp-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => navigate(`/courses/${courseId}`)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting}
                >
                  {submitting ? "Posting…" : "Post Discussion →"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
