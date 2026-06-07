import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import courseService from "../services/courseService";

const css = `
.courses-main{min-width:0;padding:24px 28px 90px;}

.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.ph-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;}

.btn-fire{height:36px;padding:0 20px;background:var(--grad-fire);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:8px;box-shadow:0 3px 14px var(--red-glow);}
.btn-fire:hover{transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}

/* Tabs — vertical pill style */
.ctabs{display:flex;flex-direction:column;gap:6px;margin-bottom:24px;max-width:200px;}
.ctab{
  padding:14px 22px;border:none;
  background:var(--s2);border:1px solid var(--b1);
  border-radius:10px;color:var(--t3);font-size:13px;font-family:var(--fb);
  font-weight:700;text-transform:uppercase;letter-spacing:1.5px;
  cursor:pointer;transition:all .2s;text-align:left;
  display:flex;align-items:center;gap:10px;
}
.ctab:hover{background:var(--s3);color:var(--t2);}
.ctab.on{background:var(--red-sub);border-color:var(--red-border);color:var(--red);}

/* Course list layout */
.course-grid{display:flex;flex-direction:column;gap:8px;}
.course-card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  overflow:hidden;cursor:pointer;
  transition:border-color .2s,box-shadow .2s,transform .12s;
  animation:cc-up .3s var(--ease) both;
  display:flex;align-items:stretch;
}
.course-card:hover{border-color:rgba(255,255,255,.1);box-shadow:0 4px 16px rgba(0,0,0,.22);transform:translateX(3px);}
@keyframes cc-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.cc-banner{width:6px;flex-shrink:0;}
.cc-code{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;font-family:var(--fm);padding:3px 9px;border-radius:5px;}
.cc-body{padding:14px 18px;flex:1;display:flex;align-items:center;gap:16px;min-width:0;}
.cc-code-pill{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;font-family:var(--fm);padding:4px 10px;border-radius:6px;flex-shrink:0;}
.cc-title{font-size:15px;font-weight:800;margin-bottom:2px;line-height:1.3;}
.cc-desc{font-size:12px;color:var(--t3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
.cc-text{flex:1;min-width:0;}
.cc-foot{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.cc-meta{font-size:11px;color:var(--t3);font-family:var(--fm);display:flex;align-items:center;gap:6px;white-space:nowrap;}
.cc-star{font-size:14px;cursor:pointer;padding:5px 7px;border-radius:6px;transition:all .12s;border:none;background:transparent;flex-shrink:0;}
.cc-star:hover{background:var(--s3);}
.cc-star.starred{filter:drop-shadow(0 0 5px gold);}

/* Request modal */
.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mfdin .2s var(--ease);}
@keyframes mfdin{from{opacity:0}to{opacity:1}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:460px;overflow:hidden;animation:mslup .25s var(--ease);}
@keyframes mslup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05),transparent 70%);}
.modal-title{font-family:var(--fd);font-size:20px;letter-spacing:3px;}
.modal-close{width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--t3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.modal-close:hover{background:var(--s3);color:var(--t1);}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
.mfield label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-bottom:6px;}
.mfield input,.mfield textarea{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;resize:vertical;}
.mfield input:focus,.mfield textarea:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.mfield input::placeholder,.mfield textarea::placeholder{color:var(--t4);}
.modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:0 22px 20px;}
.btn-outline{height:36px;padding:0 18px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;}
.btn-outline:hover{background:var(--s3);color:var(--t1);}
.modal-success{text-align:center;padding:28px 22px;}
.ms-ic{font-size:48px;margin-bottom:12px;}
.ms-t{font-family:var(--fd);font-size:22px;letter-spacing:2px;margin-bottom:8px;}
.ms-s{font-size:13px;color:var(--t3);font-family:var(--fm);line-height:1.7;}

/* Empty state */
.cs-banner{
  border:1px solid var(--b1);border-radius:14px;padding:48px 32px;text-align:center;
  background:linear-gradient(135deg,rgba(232,25,44,.04),rgba(255,107,53,.02));
  margin-bottom:20px;
}
.cs-ic{font-size:52px;margin-bottom:14px;}
.cs-t{font-family:var(--fd);font-size:26px;letter-spacing:3px;margin-bottom:8px;}
.cs-s{font-size:14px;color:var(--t3);font-family:var(--fm);line-height:1.8;max-width:380px;margin:0 auto 20px;}

.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}
`;

// Placeholder course data — swap out when CourseService is implemented

export default function CoursePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("all");
  const starKey = `learnex_starred_courses_${user?.userId ?? user?.id ?? "guest"}`;
  const [starred, setStarred] = useState(() => {
    try {
      const saved = localStorage.getItem(starKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [reqOpen, setReqOpen] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [reqForm, setReqForm] = useState({
    courseName: "",
    reason: "",
    courseCode: "",
    schoolName: "",
  });
  const [sending, setSending] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  useEffect(() => {
    courseService
      .getCourses()
      .then((res) => {
        const data = res?.data ?? res;
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setApiError(t("courses.loadFailed"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleStar = (e, id) => {
    e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(starKey, JSON.stringify([...next]));
      } catch {
        /* no-op */
      }
      return next;
    });
  };

  const sendRequest = async () => {
    if (!reqForm.courseName.trim() || !reqForm.reason.trim()) return;

    setSending(true);

    try {
      await courseService.requestCourse(
        reqForm.courseName,
        reqForm.reason,
        reqForm.courseCode,
        reqForm.schoolName
      );

      setSending(false);
      setReqSent(true);
    } catch (e) {
      setSending(false);

      alert(e?.response?.data?.message || t("courses.requestFailed"));
    }
  };
  const displayed =
    tab === "starred" ? courses.filter((c) => starred.has(c.id)) : courses;

  return (
    <>
      <style>{css}</style>
      <Layout active="courses">
        <main className="courses-main">
          <div className="ph">
            <span className="ph-title">Courses</span>
            <button
              className="btn-fire"
              onClick={() => {
                setReqOpen(true);
                setReqSent(false);
                setReqForm({
                  courseName: "",
                  reason: "",
                  courseCode: "",
                  schoolName: "",
                });
              }}
            >
              + Request Course
            </button>
          </div>

          <div className="ctabs">
            <button
              className={`ctab ${tab === "all" ? "on" : ""}`}
              onClick={() => setTab("all")}
            >
              All Courses
            </button>
            <button
              className={`ctab ${tab === "starred" ? "on" : ""}`}
              onClick={() => setTab("starred")}
            >
              Starred {starred.size > 0 && `(${starred.size})`}
            </button>
          </div>
          {apiError && (
            <div
              style={{
                padding: "12px",
                marginBottom: "16px",
                border: "1px solid #E8192C",
                borderRadius: "8px",
                color: "#E8192C",
              }}
            >
              {apiError}
            </div>
          )}
          {/* REPLACE the grid rendering block */}
          {apiError ? (
            <div style={{ color: "var(--red)", padding: 20 }}>⚠ {apiError}</div>
          ) : loading ? (
            <div className="course-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="course-card"
                  style={{ cursor: "default", minHeight: 180 }}
                >
                  <div
                    className="cc-banner"
                    style={{ background: "var(--s3)" }}
                  />
                  <div className="cc-body">
                    <div
                      className="sk"
                      style={{
                        height: 14,
                        width: "60%",
                        marginBottom: 8,
                        borderRadius: 5,
                      }}
                    />
                    <div
                      className="sk"
                      style={{
                        height: 10,
                        width: "100%",
                        marginBottom: 5,
                        borderRadius: 4,
                      }}
                    />
                    <div
                      className="sk"
                      style={{ height: 10, width: "80%", borderRadius: 4 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="cs-banner">
              <div className="cs-ic">⭐</div>
              <div className="cs-t">No Starred Courses</div>
              <p className="cs-s">
                Star courses from the All tab to bookmark them here for quick
                access.
              </p>
            </div>
          ) : (
            <div className="course-grid">
              {displayed.map((c, i) => (
                <div
                  key={c.id}
                  className="course-card"
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/courses/${c.id}`)}
                >
                  <div
                    className="cc-banner"
                    style={{
                      background: `linear-gradient(135deg,${c.color},transparent)`,
                    }}
                  >
                    <span
                      className="cc-code"
                      style={{
                        background: `${c.color}`,
                        color: c.accent,
                        border: `1px solid ${c.accent}30`,
                      }}
                    >
                      {c.code}
                    </span>
                  </div>
                  <div className="cc-body">
                    <div className="cc-title">{c.title}</div>
                    <div className="cc-desc">{c.description}</div>
                    <div className="cc-foot">
                      <div className="cc-meta">
                        <span>🎓 {c.enrolled} enrolled</span>
                        <span>·</span>
                        <span>{c.dept}</span>
                      </div>
                      <button
                        className={`cc-star ${starred.has(c.id) ? "starred" : ""}`}
                        onClick={(e) => toggleStar(e, c.id)}
                        title={
                          starred.has(c.id) ? t("courses.unstar") : t("courses.star")
                        }
                      >
                        {starred.has(c.id) ? "⭐" : "☆"}
                        {/* Show star count — reads aggregate from a shared key across users */}
                        <span
                          style={{
                            fontSize: 10,
                            marginLeft: 4,
                            color: starred.has(c.id)
                              ? "var(--gold)"
                              : "var(--t4)",
                            fontFamily: "var(--fm)",
                            fontWeight: 700,
                          }}
                        >
                          {(() => {
                            // Count how many user-specific star sets contain this course id
                            // This is a client-side aggregate across localStorage keys
                            let count = 0;
                            for (let i = 0; i < localStorage.length; i++) {
                              const key = localStorage.key(i);
                              if (
                                key &&
                                key.startsWith("learnex_starred_courses_")
                              ) {
                                try {
                                  const ids = JSON.parse(
                                    localStorage.getItem(key) || "[]",
                                  );
                                  if (ids.includes(c.id)) count++;
                                } catch {
                                  /* no-op */
                                }
                              }
                            }
                            return count > 0 ? count : null;
                          })()}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </Layout>

      {/* Request Course Modal */}
      {reqOpen && (
        <div
          className="modal-bg"
          onClick={(e) => e.target === e.currentTarget && setReqOpen(false)}
        >
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Request Course</span>
              <button className="modal-close" onClick={() => setReqOpen(false)}>
                ✕
              </button>
            </div>
            {reqSent ? (
              <div className="modal-success">
                <div className="ms-ic">✅</div>
                <div className="ms-t">Request Sent!</div>
                <p className="ms-s">
                  Your course request has been submitted. An admin will review
                  it and add the course to the platform.
                </p>
                <br />
                <button
                  className="btn-fire"
                  style={{ margin: "0 auto" }}
                  onClick={() => setReqOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <div className="mfield">
                    <label>
                      Course Name <span style={{ color: "var(--red)" }}>*</span>
                    </label>
                    <input
                      autoFocus
                      value={reqForm.courseName}
                      onChange={(e) =>
                        setReqForm((f) => ({
                          ...f,
                          courseName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Advanced Machine Learning"
                    />
                  </div>
                  <div className="mfield">
                    <label>
                      Why should this course be added?{" "}
                      <span style={{ color: "var(--red)" }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reqForm.reason}
                      onChange={(e) =>
                        setReqForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      placeholder={t("courses.description")}
                    />
                  </div>
                  <div className="mfield">
                    <label>Course Code (Optional)</label>
                    <input
                      value={reqForm.courseCode}
                      onChange={(e) =>
                        setReqForm((f) => ({
                          ...f,
                          courseCode: e.target.value,
                        }))
                      }
                      placeholder="e.g. CS302, MATH401"
                    />
                  </div>
                  <div className="mfield">
                    <label>School/University (Optional)</label>
                    <input
                      value={reqForm.schoolName}
                      onChange={(e) =>
                        setReqForm((f) => ({
                          ...f,
                          schoolName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Stanford University, MIT"
                    />
                  </div>
                </div>
                <div className="modal-foot">
                  <button
                    className="btn-outline"
                    onClick={() => setReqOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-fire"
                    onClick={sendRequest}
                    disabled={
                      !reqForm.courseName.trim() ||
                      !reqForm.reason.trim() ||
                      sending
                    }
                  >
                    {sending ? t("common.sending") : t("courses.sendRequest")}
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