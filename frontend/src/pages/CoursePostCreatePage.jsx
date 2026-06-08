import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";

const css = `
.create-post-main{min-width:0;padding:24px 28px 90px;max-width:720px;}

.cp-back{display:flex;align-items:center;gap:8px;background:none;border:none;color:var(--t3);
  font-size:13px;font-family:var(--fb);font-weight:600;cursor:pointer;padding:0;
  margin-bottom:20px;transition:color .15s;letter-spacing:.3px;}
.cp-back:hover{color:var(--t1);}

.cp-breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t3);
  font-family:var(--fm);margin-bottom:20px;}
.cp-breadcrumb em{color:var(--t2);font-style:normal;}

.cp-header{font-family:var(--fd);font-size:26px;letter-spacing:2px;margin-bottom:6px;}
.cp-sub{font-size:13px;color:var(--t3);margin-bottom:22px;display:flex;align-items:center;gap:6px;}
.cp-sub strong{color:var(--t2);}

.cp-form{
  background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;
  transition:border-color .25s,box-shadow .25s;
}
.cp-form:focus-within{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub),0 4px 20px rgba(0,0,0,.3);}

.cp-top{display:flex;gap:12px;align-items:flex-start;padding:16px;}
.cp-av{
  width:38px;height:38px;border-radius:9px;flex-shrink:0;
  background:var(--grad-fire);display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:15px;color:#fff;box-shadow:0 2px 10px var(--red-glow);
}
.cp-textarea{
  flex:1;background:transparent;border:none;color:var(--t1);font-size:15px;
  font-family:var(--fb);resize:none;min-height:140px;outline:none;line-height:1.75;
  padding-top:2px;
}
.cp-textarea::placeholder{color:var(--t3);}

.cp-divider{height:1px;background:var(--b1);margin:0 16px;}

.cp-toolbar{
  display:flex;align-items:center;justify-content:space-between;
  gap:8px;padding:12px 16px;
}
.cp-hint{font-size:11px;color:var(--t4);font-family:var(--fm);}
.cp-char{font-size:11px;font-family:var(--fm);color:var(--t4);
  transition:color .2s;}
.cp-char.warn{color:#EF9F27;}
.cp-char.danger{color:var(--red);}

.cp-buttons{display:flex;gap:8px;}
.btn-cancel{
  padding:9px 18px;background:transparent;border:1px solid var(--b2);border-radius:8px;
  color:var(--t2);font-size:12px;font-weight:800;font-family:var(--fb);
  letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .2s;
}
.btn-cancel:hover{background:var(--s3);color:var(--t1);}
.btn-submit{
  padding:9px 18px;background:var(--grad-fire);border:none;border-radius:8px;
  color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);
  letter-spacing:1px;text-transform:uppercase;cursor:pointer;
  transition:all .2s;box-shadow:0 3px 14px var(--red-glow);
}
.btn-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.btn-submit:disabled{opacity:.4;cursor:not-allowed;}

.error-msg{padding:12px 16px;background:rgba(232,25,44,.1);border:1px solid var(--red-border);
  border-radius:8px;color:var(--red);font-size:13px;margin-bottom:16px;}

.loading{text-align:center;padding:40px;color:var(--t3);font-family:var(--fm);font-size:13px;}
`;

export default function CoursePostCreatePage() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userIni = user ? getInitials(user.displayName || user.email, user.email) : "";

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await courseService.getCourse(courseId);
        // FIX: api.js interceptor already unwraps ApiResponse<CourseResponse>
        // so res.data is CourseResponse directly — not res.data.data
        setCourse(res.data ?? res);
        setError("");
      } catch (err) {
        console.error("[v0] Error loading course:", err);
        setError(t("coursePost.loadingCourse"));
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t("coursePost.emptyError"));
      return;
    }
    if (content.length > 2000) {
      setError(t("coursePost.tooLongError"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await courseService.createCoursePost(courseId, content.trim(), "public");
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setSubmitting(false);
      console.error("[v0] Error creating post:", err);
      setError(err?.response?.data?.message || t("coursePost.failedPost"));
    }
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="create-post-main">
            <div className="loading">{t("coursePost.loadingCourse")}</div>
          </main>
        </Layout>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <style>{css}</style>
        <Layout active="courses">
          <main className="create-post-main">
            <div className="error-msg">{error || t("coursePost.courseNotFound")}</div>
          </main>
        </Layout>
      </>
    );
  }

  const charWarn = content.length > 1800;
  const charDanger = content.length > 1950;

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="create-post-main">
          <button className="cp-back" onClick={() => navigate(`/courses/${courseId}`)}>
            {t("coursePost.backBtn", { name: course.name })}
          </button>

          <h1 className="cp-header">{t("coursePost.title")}</h1>
          <p className="cp-sub">
            {t("coursePost.inCourse")} <strong>{course.name}</strong>
            <span style={{ color: "var(--t4)", fontSize: 11, fontFamily: "var(--fm)" }}>
              · {course.code}
            </span>
          </p>

          {error && <div className="error-msg">⚠ {error}</div>}

          <div className="cp-form">
            <div className="cp-top">
              <div className="cp-av">{userIni}</div>
              <textarea
                className="cp-textarea"
                placeholder={t("coursePost.placeholder")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                autoFocus
              />
            </div>

            <div className="cp-divider" />

            <div className="cp-toolbar">
              <span className={`cp-char ${charDanger ? "danger" : charWarn ? "warn" : ""}`}>
                {t("coursePost.charCount", { count: content.length })}
              </span>
              <div className="cp-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => navigate(`/courses/${courseId}`)}
                  disabled={submitting}
                >
                  {t("coursePost.cancelBtn")}
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting || content.length > 2000}
                >
                  {submitting ? t("coursePost.posting") : t("coursePost.postBtn")}
                </button>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}