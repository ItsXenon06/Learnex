import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.courses-main {
  min-width: 0;
  padding: 36px 36px 100px;
  background: var(--bg);
}

/* ── Header ── */
.cp-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 20px;
}
.cp-heading-group {}
.cp-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--t2);
  margin-bottom: 7px;
}
.cp-h1 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 34px;
  font-weight: 800;
  color: rgba(255,255,255,.75);
  letter-spacing: -0.8px;
  line-height: 1;
}
.cp-h1 span {
  color: var(--t3);
  font-weight: 400;
}

.cp-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 18px;
  background: rgba(220, 60, 60, .12);
  color: #f87171;
  border: 1px solid rgba(220, 60, 60, .28);
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: .1px;
}
.cp-add-btn:hover {
  background: rgba(220, 60, 60, .2);
  border-color: rgba(220, 60, 60, .45);
  color: #fca5a5;
  transform: translateY(-1px);
}
.cp-add-btn-ic {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: rgba(220, 60, 60, .18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1;
  color: #f87171;
}

/* ── Tabs ── */
.cp-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--b1);
  padding-bottom: 0;
}
.cp-tab {
  padding: 10px 20px 11px;
  border: none;
  background: transparent;
  color: var(--t3);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color .15s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.cp-tab::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--t1);
  transform: scaleX(0);
  transition: transform .2s cubic-bezier(.22,.68,0,1.2);
}
.cp-tab:hover { color: var(--t2); }
.cp-tab.on {
  color: var(--t1);
}
.cp-tab.on::after { transform: scaleX(1); }
.cp-tab-pill {
  background: var(--s3);
  color: var(--t2);
  font-size: 10px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 7px;
  border-radius: 100px;
  min-width: 20px;
  text-align: center;
}
.cp-tab.on .cp-tab-pill {
  background: var(--t1);
  color: var(--bg);
}

/* ── Grid ── */
.cp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

/* ── Card ── */
.cp-card {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  animation: card-in .38s cubic-bezier(.22,.68,0,1.15) both;
  transition: border-color .2s, box-shadow .2s, transform .2s;
  position: relative;
}
.cp-card:hover {
  border-color: var(--b2);
  box-shadow: 0 12px 40px rgba(0,0,0,.18);
  transform: translateY(-4px);
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(14px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Left accent stripe */
.cp-card-stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 18px 0 0 18px;
}

.cp-card-inner {
  padding: 22px 22px 22px 26px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Course code tag */
.cp-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-bottom: 13px;
  width: fit-content;
}

.cp-card-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1.4;
  margin-bottom: 7px;
  letter-spacing: -0.2px;
}

.cp-card-desc {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  color: var(--t3);
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 20px;
}

/* Footer */
.cp-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 22px 13px 26px;
  border-top: 1px solid var(--b1);
}

.cp-stats-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cp-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  color: var(--t3);
  font-weight: 500;
}
.cp-stat-ic {
  font-size: 13px;
  line-height: 1;
}

/* separator dot */
.cp-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--b2);
  flex-shrink: 0;
}

.cp-dept-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--t4);
  letter-spacing: .5px;
  text-transform: uppercase;
}

/* Star button */
.cp-star {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--b1);
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .16s;
  color: var(--t3);
  flex-shrink: 0;
}
.cp-star:hover {
  background: rgba(255, 196, 0, .08);
  border-color: rgba(255, 196, 0, .3);
}
.cp-star.on {
  background: rgba(255, 196, 0, .1);
  border-color: rgba(255, 196, 0, .35);
}

/* ── Skeleton ── */
.cp-skel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.cp-skel {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 18px;
  overflow: hidden;
}
.cp-skel-stripe {
  width: 3px;
  position: absolute;
  top: 0; bottom: 0; left: 0;
  background: var(--s3);
}
.cp-skel-body {
  padding: 22px 22px 22px 26px;
  position: relative;
}
.sk {
  background: var(--s3);
  border-radius: 5px;
  animation: sk-pulse 1.8s ease infinite;
}
@keyframes sk-pulse {
  0%, 100% { opacity: .18; }
  50%       { opacity: .38; }
}

/* ── Error ── */
.cp-err {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(239, 68, 68, .07);
  border: 1px solid rgba(239, 68, 68, .2);
  border-radius: 12px;
  font-size: 13px;
  color: #f87171;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ── Empty ── */
.cp-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 32px;
  border: 1px dashed var(--b2);
  border-radius: 18px;
}
.cp-empty-ic { font-size: 40px; margin-bottom: 14px; opacity: .5; }
.cp-empty-t {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--t2);
  margin-bottom: 6px;
}
.cp-empty-s {
  font-size: 13px;
  color: var(--t3);
  line-height: 1.7;
  max-width: 280px;
}

/* ── Modal overlay ── */
.cp-modal-bg {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: mfade .18s ease;
}
@keyframes mfade { from { opacity: 0; } to { opacity: 1; } }

.cp-modal {
  width: 100%;
  max-width: 460px;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: 20px;
  overflow: hidden;
  animation: mrise .22s cubic-bezier(.22,.68,0,1.2);
}
@keyframes mrise {
  from { opacity: 0; transform: translateY(18px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.cp-modal-head {
  padding: 22px 24px 20px;
  border-bottom: 1px solid var(--b1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cp-modal-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--t1);
  letter-spacing: -0.2px;
}
.cp-modal-x {
  width: 30px;
  height: 30px;
  border: none;
  background: var(--s2);
  border-radius: 8px;
  color: var(--t3);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .12s;
}
.cp-modal-x:hover { background: var(--s3); color: var(--t1); }

.cp-modal-body {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cp-field label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 7px;
}
.cp-field input, .cp-field textarea {
  width: 100%;
  background: var(--s2);
  border: 1px solid var(--b1);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--t1);
  font-size: 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  outline: none;
  transition: border-color .18s, box-shadow .18s;
  resize: vertical;
}
.cp-field input:focus, .cp-field textarea:focus {
  border-color: var(--t3);
  box-shadow: 0 0 0 3px rgba(255,255,255,.04);
}
.cp-field input::placeholder, .cp-field textarea::placeholder { color: var(--t4); }

.cp-modal-foot {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 0 24px 22px;
}
.cp-btn-sec {
  padding: 0 18px;
  height: 38px;
  background: transparent;
  border: 1px solid var(--b2);
  border-radius: 10px;
  color: var(--t2);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .16s;
}
.cp-btn-sec:hover { background: var(--s3); color: var(--t1); }
.cp-btn-prim {
  padding: 0 22px;
  height: 38px;
  background: var(--t1);
  border: none;
  border-radius: 10px;
  color: var(--bg);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all .16s;
}
.cp-btn-prim:hover:not(:disabled) { opacity: .88; }
.cp-btn-prim:disabled { opacity: .35; cursor: not-allowed; }

/* Success */
.cp-success {
  padding: 48px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cp-success-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(34,197,94,.1);
  border: 1px solid rgba(34,197,94,.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 16px;
}
.cp-success-t {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--t1);
  margin-bottom: 8px;
  letter-spacing: -0.2px;
}
.cp-success-s {
  font-size: 13px;
  color: var(--t3);
  line-height: 1.7;
  max-width: 300px;
  margin-bottom: 24px;
}
`;

/* Accent colours per card — balanced, not too red */
const ACCENTS = [
  { stripe: "#6366f1", tagBg: "rgba(99,102,241,.12)", tagColor: "#818cf8" },
  { stripe: "#0ea5e9", tagBg: "rgba(14,165,233,.12)", tagColor: "#38bdf8" },
  { stripe: "#10b981", tagBg: "rgba(16,185,129,.12)", tagColor: "#34d399" },
  { stripe: "#f59e0b", tagBg: "rgba(245,158,11,.12)", tagColor: "#fbbf24" },
  { stripe: "#ec4899", tagBg: "rgba(236,72,153,.12)", tagColor: "#f472b6" },
  { stripe: "#8b5cf6", tagBg: "rgba(139,92,246,.12)", tagColor: "#a78bfa" },
  { stripe: "#06b6d4", tagBg: "rgba(6,182,212,.12)", tagColor: "#22d3ee" },
  { stripe: "#ef4444", tagBg: "rgba(239,68,68,.1)", tagColor: "#f87171" },
];

function accent(id) {
  const i = typeof id === "string"
    ? [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length
    : (id ?? 0) % ACCENTS.length;
  return ACCENTS[i];
}

function getStarCount(courseId) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("learnex_starred_courses_")) {
      try {
        const ids = JSON.parse(localStorage.getItem(key) || "[]");
        if (ids.includes(courseId)) count++;
      } catch { /* no-op */ }
    }
  }
  return count;
}

function SkelCard({ delay }) {
  return (
    <div className="cp-skel" style={{ animationDelay: `${delay}ms`, position: "relative" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div className="sk" style={{ width: 3, minHeight: 160, borderRadius: 0, flexShrink: 0 }} />
        <div className="cp-skel-body" style={{ flex: 1, paddingLeft: 22 }}>
          <div className="sk" style={{ height: 20, width: "32%", marginBottom: 14, borderRadius: 6 }} />
          <div className="sk" style={{ height: 14, width: "75%", marginBottom: 8, borderRadius: 4 }} />
          <div className="sk" style={{ height: 13, width: "100%", marginBottom: 5, borderRadius: 4 }} />
          <div className="sk" style={{ height: 13, width: "60%", borderRadius: 4, marginBottom: 20 }} />
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--b1)" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="sk" style={{ height: 11, width: 60, borderRadius: 4 }} />
              <div className="sk" style={{ height: 11, width: 40, borderRadius: 4 }} />
            </div>
            <div className="sk" style={{ height: 28, width: 28, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("all");
  const starKey = `learnex_starred_courses_${user?.userId ?? user?.id ?? "guest"}`;
  const [starred, setStarred] = useState(() => {
    try {
      const s = localStorage.getItem(starKey);
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });

  const [reqOpen, setReqOpen] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [reqForm, setReqForm] = useState({ courseName: "", reason: "", courseCode: "", schoolName: "" });
  const [sending, setSending] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    courseService.getCourses()
      .then((res) => {
        const data = res?.data ?? res;
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => setApiError(t("courses.loadingCourses")))
      .finally(() => setLoading(false));
  }, []);

  const toggleStar = (e, id) => {
    e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(starKey, JSON.stringify([...next])); } catch { /**/ }
      return next;
    });
  };

  const openReq = () => {
    setReqOpen(true);
    setReqSent(false);
    setReqForm({ courseName: "", reason: "", courseCode: "", schoolName: "" });
  };

  const sendRequest = async () => {
    if (!reqForm.courseName.trim() || !reqForm.reason.trim()) return;
    setSending(true);
    try {
      await courseService.requestCourse(reqForm.courseName, reqForm.reason, reqForm.courseCode, reqForm.schoolName);
      setReqSent(true);
    } catch (e) {
      alert(e?.response?.data?.message || t("courses.requestFailed"));
    } finally {
      setSending(false);
    }
  };

  const displayed = tab === "starred" ? courses.filter(c => starred.has(c.id)) : courses;

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="courses-main">

          {/* ── Top bar ── */}
          <div className="cp-top">
            <div className="cp-heading-group">
              <div className="cp-label">Academic catalogue</div>
              <div className="cp-h1">
                {t("courses.title")}
                {!loading && courses.length > 0 && (
                  <span> &thinsp;{courses.length}</span>
                )}
              </div>
            </div>
            <button className="cp-add-btn" onClick={openReq}>
              <span className="cp-add-btn-ic">+</span>
              {t("courses.requestBtn")}
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="cp-tabs">
            <button className={`cp-tab ${tab === "all" ? "on" : ""}`} onClick={() => setTab("all")}>
              {t("courses.allTab")}
              {!loading && (
                <span className="cp-tab-pill">{courses.length}</span>
              )}
            </button>
            <button className={`cp-tab ${tab === "starred" ? "on" : ""}`} onClick={() => setTab("starred")}>
              {t("courses.starredTab")}
              {starred.size > 0 && (
                <span className="cp-tab-pill">{starred.size}</span>
              )}
            </button>
          </div>

          {/* ── Grid ── */}
          {loading ? (
            <div className="cp-skel-grid">
              {[0,1,2,3,4,5].map(i => <SkelCard key={i} delay={i * 50} />)}
            </div>
          ) : (
            <div className="cp-grid">
              {apiError && (
                <div className="cp-err">⚠ {apiError}</div>
              )}

              {!apiError && displayed.length === 0 && (
                <div className="cp-empty">
                  <div className="cp-empty-ic">{tab === "starred" ? "☆" : "📖"}</div>
                  <div className="cp-empty-t">
                    {tab === "starred" ? t("courses.noStarredTitle") : "No courses yet"}
                  </div>
                  <p className="cp-empty-s">
                    {tab === "starred" ? t("courses.noStarredHint") : "Courses will appear here once added."}
                  </p>
                </div>
              )}

              {!apiError && displayed.map((c, i) => {
                const a = accent(c.id);
                const isStarred = starred.has(c.id);
                const starCount = getStarCount(c.id);
                const enrolled = c.enrolled ?? 0;
                const code = c.code ?? c.courseCode ?? "";
                const name = c.title ?? c.name ?? "Untitled";
                const dept = c.dept ?? c.department ?? "";

                return (
                  <div
                    key={c.id}
                    className="cp-card"
                    style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
                    onClick={() => navigate(`/courses/${c.id}`)}
                  >
                    {/* Left accent stripe */}
                    <div className="cp-card-stripe" style={{ background: a.stripe }} />

                    <div className="cp-card-inner">
                      {/* Code */}
                      {code && (
                        <div className="cp-tag" style={{ background: a.tagBg, color: a.tagColor }}>
                          {code}
                        </div>
                      )}

                      <div className="cp-card-name">{name}</div>
                      <div className="cp-card-desc">
                        {c.description || "No description available."}
                      </div>
                    </div>

                    <div className="cp-card-foot">
                      {/* Stats: enrolled count = enrolled + stars, star icon when user starred */}
                      <div className="cp-stats-row">
                        <div className="cp-stat">
                          <span className="cp-stat-ic">👤</span>
                          {(enrolled + starCount).toLocaleString()}
                          &nbsp;enrolled
                        </div>
                        {dept && (
                          <>
                            <span className="cp-sep" />
                            <span className="cp-dept-tag">{dept}</span>
                          </>
                        )}
                      </div>

                      {/* Star toggle */}
                      <button
                        className={`cp-star ${isStarred ? "on" : ""}`}
                        onClick={e => toggleStar(e, c.id)}
                        title={isStarred ? t("courses.unstarTitle") : t("courses.starTitle")}
                      >
                        {isStarred ? "⭐" : "☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </Layout>

      {/* ── Request modal ── */}
      {reqOpen && (
        <div className="cp-modal-bg" onClick={e => e.target === e.currentTarget && setReqOpen(false)}>
          <div className="cp-modal">
            <div className="cp-modal-head">
              <span className="cp-modal-title">{t("courses.requestModalTitle")}</span>
              <button className="cp-modal-x" onClick={() => setReqOpen(false)}>✕</button>
            </div>

            {reqSent ? (
              <div className="cp-success">
                <div className="cp-success-ring">✓</div>
                <div className="cp-success-t">{t("courses.requestSentTitle")}</div>
                <p className="cp-success-s">{t("courses.requestSentBody")}</p>
                <button className="cp-btn-prim" onClick={() => setReqOpen(false)}>
                  {t("courses.doneBtn")}
                </button>
              </div>
            ) : (
              <>
                <div className="cp-modal-body">
                  <div className="cp-field">
                    <label>{t("courses.courseNameRequired")}</label>
                    <input
                      autoFocus
                      value={reqForm.courseName}
                      onChange={e => setReqForm(f => ({ ...f, courseName: e.target.value }))}
                      placeholder="e.g. Advanced Machine Learning"
                    />
                  </div>
                  <div className="cp-field">
                    <label>
                      {t("courses.reasonLabel")}{" "}
                      <span style={{ color: "var(--t4)" }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reqForm.reason}
                      onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder={t("courses.reasonPlaceholder")}
                    />
                  </div>
                  <div className="cp-field">
                    <label>{t("courses.codeLabel")}</label>
                    <input
                      value={reqForm.courseCode}
                      onChange={e => setReqForm(f => ({ ...f, courseCode: e.target.value }))}
                      placeholder="e.g. CS302, MATH401"
                    />
                  </div>
                  <div className="cp-field">
                    <label>{t("courses.schoolLabel")}</label>
                    <input
                      value={reqForm.schoolName}
                      onChange={e => setReqForm(f => ({ ...f, schoolName: e.target.value }))}
                      placeholder="e.g. Stanford University, MIT"
                    />
                  </div>
                </div>
                <div className="cp-modal-foot">
                  <button className="cp-btn-sec" onClick={() => setReqOpen(false)}>
                    {t("courses.cancelBtn")}
                  </button>
                  <button
                    className="cp-btn-prim"
                    onClick={sendRequest}
                    disabled={!reqForm.courseName.trim() || !reqForm.reason.trim() || sending}
                  >
                    {sending ? t("courses.sendingRequest") : t("courses.sendRequestBtn")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}