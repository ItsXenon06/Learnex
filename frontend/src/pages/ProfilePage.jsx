import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout, { sharedCss } from "../components/Layout";
import userService from "../services/userService";
import postService from "../services/postService";

/* ─── Page CSS ───────────────────────────────────────────────────────────── */
const css = `
.prof-main{min-width:0;padding:24px 28px 90px;}

/* HERO */
.hero{position:relative;border-radius:16px;overflow:hidden;background:var(--s1);border:1px solid var(--b1);margin-bottom:18px;}
.hero-banner{
  height:150px;
  background:
    linear-gradient(135deg,rgba(232,25,44,.18) 0%,rgba(255,107,53,.12) 50%,rgba(155,89,245,.1) 100%),
    repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.012) 20px,rgba(255,255,255,.012) 21px);
  position:relative;
}
.hero-banner::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,transparent 60%,var(--s1) 100%);}
.hero-body{padding:0 24px 22px;}
.hero-av-wrap{display:flex;align-items:flex-end;justify-content:space-between;margin-top:-36px;position:relative;z-index:2;margin-bottom:14px;}
.hero-av{
  width:82px;height:82px;border-radius:17px;
  background:var(--grad-fire);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:30px;color:#fff;
  border:3px solid var(--s1);box-shadow:0 8px 32px var(--red-glow);flex-shrink:0;
  overflow:hidden;
}
.hero-actions{display:flex;gap:8px;padding-bottom:4px;}

/* Buttons */
.btn{height:34px;padding:0 16px;border-radius:8px;font-family:var(--fb);font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px;border:none;}
.btn-fire{background:var(--grad-fire);color:#fff;box-shadow:0 3px 14px var(--red-glow);}
.btn-fire:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.btn-fire:disabled{opacity:.5;cursor:not-allowed;}
.btn-outline{background:transparent;color:var(--t2);border:1px solid var(--b2);}
.btn-outline:hover{background:var(--s3);color:var(--t1);border-color:var(--b3);}
.btn-ghost{background:var(--red-sub);color:var(--red);border:1px solid var(--red-border);}
.btn-ghost:hover{background:rgba(232,25,44,.14);}

.hero-name{font-family:var(--fd);font-size:28px;letter-spacing:3px;line-height:1;margin-bottom:4px;}
.hero-headline{font-size:14px;color:var(--t2);margin-bottom:8px;font-weight:500;}
.hero-bio{font-size:14px;color:var(--t2);line-height:1.75;max-width:560px;margin-bottom:12px;}
.hero-meta{display:flex;align-items:center;flex-wrap:wrap;gap:14px;}
.hero-link{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--blue);font-family:var(--fm);text-decoration:none;transition:opacity .15s;}
.hero-link:hover{opacity:.7;text-decoration:underline;}
.hero-email{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--t3);font-family:var(--fm);}

/* Stats */
.stats{display:flex;gap:0;border-top:1px solid var(--b1);margin-top:16px;}
.stat{flex:1;display:flex;flex-direction:column;align-items:center;padding:13px 8px;cursor:pointer;transition:background .15s;border-right:1px solid var(--b1);position:relative;}
.stat:last-child{border-right:none;}
.stat:hover{background:var(--s2);}
.stat-n{font-family:var(--fd);font-size:24px;letter-spacing:2px;color:var(--t1);line-height:1;}
.stat-l{font-size:11px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px;}
.stat.active .stat-n{color:var(--red);}
.stat-pip{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:22px;height:2px;background:var(--grad-fire);border-radius:2px;opacity:0;transition:opacity .2s;}
.stat.active .stat-pip{opacity:1;}

/* TABS */
.prof-tabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:16px;}
.prof-tab{padding:12px 22px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;transition:all .2s;position:relative;}
.prof-tab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.prof-tab:hover{color:var(--t2);}
.prof-tab.on{color:var(--t1);}
.prof-tab.on::after{transform:scaleX(1);}
.prof-tab-cnt{color:var(--t4);font-family:var(--fm);margin-left:5px;font-size:11px;}

/* POST CARDS (condensed profile view) */
.prof-post{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  padding:16px 18px;margin-bottom:8px;cursor:pointer;
  transition:border-color .2s,box-shadow .15s;
  animation:pp-up .3s var(--ease) both;
}
.prof-post:hover{border-color:rgba(255,255,255,.1);box-shadow:0 4px 14px rgba(0,0,0,.2);}
@keyframes pp-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.pp-content{font-size:14px;line-height:1.7;color:var(--t1);margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pp-meta{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--t3);font-family:var(--fm);}
.pp-rx{display:flex;align-items:center;gap:4px;}

/* FOLLOW CARDS */
.follow-grid{display:flex;flex-direction:column;gap:6px;}
.follow-card{display:flex;align-items:center;gap:14px;background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:13px 16px;transition:border-color .2s,box-shadow .15s;cursor:pointer;animation:pp-up .3s var(--ease) both;}
.follow-card:hover{border-color:rgba(255,255,255,.1);box-shadow:0 4px 14px rgba(0,0,0,.18);}
.follow-av{width:44px;height:44px;border-radius:11px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:16px;color:#fff;}
.follow-info{flex:1;min-width:0;}
.follow-name{font-size:14px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.follow-email{font-size:12px;color:var(--t3);font-family:var(--fm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

/* EDIT MODAL */
.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mfdin .2s var(--ease);}
@keyframes mfdin{from{opacity:0}to{opacity:1}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:500px;overflow:hidden;animation:mslup .25s var(--ease);}
@keyframes mslup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05) 0%,transparent 70%);}
.modal-title{font-family:var(--fd);font-size:20px;letter-spacing:3px;}
.modal-close{width:30px;height:30px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.modal-close:hover{background:var(--s3);color:var(--t1);}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
.mfield{display:flex;flex-direction:column;gap:6px;}
.mfield label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);}
.mfield input,.mfield textarea{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;resize:vertical;}
.mfield input:focus,.mfield textarea:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.mfield input::placeholder,.mfield textarea::placeholder{color:var(--t4);}
.modal-err{font-size:12px;color:var(--red);background:var(--red-sub);border:1px solid var(--red-border);border-radius:6px;padding:8px 12px;}
.modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:0 22px 20px;}

/* SKELETON */
.skel-hero{background:var(--s1);border:1px solid var(--b1);border-radius:16px;margin-bottom:18px;overflow:hidden;}

/* ERROR */
.err-banner{background:rgba(232,25,44,.1);border:1px solid var(--red-border);border-radius:10px;padding:12px 18px;margin-bottom:14px;color:var(--red);font-size:14px;}
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
  const i = id
    ? (typeof id === "string" ? id.charCodeAt(0) : 0) % AV_BG.length
    : 0;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
}

/* ─── HeroSkeleton ────────────────────────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <div className="skel-hero">
      <div style={{ height: 150, background: "var(--s2)" }} />
      <div style={{ padding: "0 24px 22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: -36,
            marginBottom: 14,
          }}
        >
          <div
            className="sk"
            style={{ width: 82, height: 82, borderRadius: 17 }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              paddingBottom: 4,
            }}
          >
            <div
              className="sk"
              style={{ width: 110, height: 34, borderRadius: 8 }}
            />
            <div
              className="sk"
              style={{ width: 90, height: 34, borderRadius: 8 }}
            />
          </div>
        </div>
        <div
          className="sk"
          style={{ height: 26, width: "35%", marginBottom: 8, borderRadius: 6 }}
        />
        <div
          className="sk"
          style={{
            height: 12,
            width: "25%",
            marginBottom: 12,
            borderRadius: 5,
          }}
        />
        <div
          className="sk"
          style={{ height: 12, width: "70%", marginBottom: 6, borderRadius: 5 }}
        />
        <div
          className="sk"
          style={{ height: 12, width: "55%", borderRadius: 5 }}
        />
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--b1)",
            marginTop: 16,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "13px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                className="sk"
                style={{ height: 20, width: 36, borderRadius: 5 }}
              />
              <div
                className="sk"
                style={{ height: 9, width: 52, borderRadius: 4 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── EditModal ───────────────────────────────────────────────────────────── */
function EditModal({ profile, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    displayName: profile.displayName || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    website: profile.website || "",
    avatarUrl: profile.avatarUrl || "",
  });
  const [err, setErr] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [avatarUploading, setAvatarUploading] = useState(false);

  // In EditModal, replace the submit function:
  const submit = async () => {
    setErr("");
    // Only send fields that have actual values — empty string would clear the field on backend
    // If user genuinely wants to clear a field, they must explicitly blank it
    const payload = {
      ...(form.displayName.trim()
        ? { displayName: form.displayName.trim() }
        : {}),
      ...(form.headline.trim()
        ? { headline: form.headline.trim() }
        : { headline: "" }),
      // Bio and website CAN be cleared intentionally — send as-is
      bio: form.bio,
      website: form.website,
      avatarUrl: form.avatarUrl,
    };
    try {
      await onSave(payload);
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed.");
    }
  };

  return (
    <div
      className="modal-bg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Edit Profile</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {err && <div className="modal-err">⚠ {err}</div>}
          {/* REPLACE the avatar mfield in EditModal */}
          <div className="mfield">
            <label>Avatar</label>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: form.avatarUrl
                    ? "transparent"
                    : "var(--grad-fire)",
                  overflow: "hidden",
                  border: "2px solid var(--b2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#fff",
                  fontFamily: "var(--fd)",
                }}
              >
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="avatar preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  getInitials(form.displayName, profile.email)
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAvatarUploading(true);
                      try {
                        const res = await postService.uploadMedia(file);
                        const data = res?.data ?? res;
                        set("avatarUrl", data.url);
                      } catch {
                        /* keep existing */
                      } finally {
                        setAvatarUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: "7px 14px",
                      background: "var(--s3)",
                      border: "1px solid var(--b2)",
                      borderRadius: 7,
                      color: "var(--t2)",
                      fontSize: 12,
                      fontFamily: "var(--fb)",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                    onClick={() =>
                      document.getElementById("avatar-file-input").click()
                    }
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? "⏳ Uploading…" : "📷 Upload photo"}
                  </button>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--red)",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "var(--fb)",
                      }}
                      onClick={() => {
                        set("avatarUrl", "");
                        setShowUrlInput(false);
                      }}
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--t3)",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--fm)",
                      textDecoration: "underline",
                    }}
                    onClick={() => setShowUrlInput((v) => !v)}
                  >
                    {showUrlInput ? "Hide URL" : "Use URL instead"}
                  </button>
                </div>
                {showUrlInput && (
                  <input
                    value={form.avatarUrl}
                    onChange={(e) => set("avatarUrl", e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    style={{ fontSize: 12 }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mfield">
            <label>Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="mfield">
            <label>
              Headline{" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (pronouns, teacher/student, etc…)
              </span>
            </label>
            <input
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="CS · Year 3 · Full-stack Dev"
            />
          </div>
          <div className="mfield">
            <label>Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell people about yourself…"
            />
          </div>
          <div className="mfield">
            <label>Website</label>
            <input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-fire" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ProfilePage ─────────────────────────────────────────────────────────── */
export default function ProfilePage({ initialTab, editOnOpen }) {
  const { userId: paramId } = useParams();
  const { user, logout, updateUserCache } = useAuth();
  const navigate = useNavigate();

  const uid = user?.userId ?? user?.id;
  const targetId = paramId ?? uid;
  const isOwn = uid === targetId;
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab || "posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(editOnOpen || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const profIni = getInitials(profile?.displayName, profile?.email);

  /* ── Load profile, followers, following ── */
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    setError("");

    Promise.all([
      userService.getProfile(targetId),
      userService.getFollowers(targetId),
      userService.getFollowing(targetId),
    ])
      .then(([profRes, flRes, fgRes]) => {
        // api.js unwraps ApiResponse, so .data is the actual payload
        const p = profRes?.data ?? profRes;
        const fl = flRes?.data ?? flRes;
        const fg = fgRes?.data ?? fgRes;
        setProfile(p);
        setFollowers(Array.isArray(fl) ? fl : []);
        setFollowing(Array.isArray(fg) ? fg : []);
        if (!isOwn) {
          setIsFollowing(
            (Array.isArray(fl) ? fl : []).some(
              (f) => (f.userId ?? f.id) === uid,
            ),
          );
        }
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [targetId]);

  /* ── Load posts when that tab is active ── */
  useEffect(() => {
    if (tab !== "posts" || !targetId) return;
    setPostsLoading(true);
    postService
      .getUserPosts(targetId)
      .then((res) => {
        const data = res?.data ?? res;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        setPosts(items);
      })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [tab, targetId]);

  /* ── Follow / Unfollow ── */
  const toggleFollow = async () => {
    if (!uid || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollow(targetId);
        setFollowers((f) => f.filter((x) => x.userId !== uid));
        setIsFollowing(false);
      } else {
        await userService.follow(targetId);
        setFollowers((f) => [
          ...f,
          { userId: uid, email: user.email, displayName: user.displayName },
        ]);
        setIsFollowing(true);
      }
    } catch {
      /* keep state */
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Save profile edits ── */
  const saveProfile = async (form) => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(form);
      const updated = res?.data ?? res;
      // Merge: only overwrite fields that the server actually returned non-null
      setProfile((p) => ({
        ...p,
        ...Object.fromEntries(
          Object.entries(updated).filter(
            ([, v]) => v !== null && v !== undefined,
          ),
        ),
      }));
      if (form.displayName) updateUserCache({ displayName: form.displayName });
      setEditOpen(false);
    } catch (e) {
      throw e; // re-throw so EditModal can show the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <Layout active="profile">
        <main className="prof-main">
          {error && <div className="err-banner">⚠ {error}</div>}

          {loading ? (
            <HeroSkeleton />
          ) : profile ? (
            <>
              {/* ── HERO ── */}
              <div className="hero">
                <div className="hero-banner" />
                <div className="hero-body">
                  <div className="hero-av-wrap">
                    <div className="hero-av">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName || "avatar"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                            display: "block",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        profIni
                      )}
                    </div>
                    <div className="hero-actions">
                      {isOwn ? (
                        <button
                          className="btn btn-outline"
                          onClick={() => setEditOpen(true)}
                        >
                          ✏ Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            className={`btn ${isFollowing ? "btn-ghost" : "btn-fire"}`}
                            onClick={toggleFollow}
                            disabled={followLoading}
                          >
                            {followLoading
                              ? "…"
                              : isFollowing
                                ? "✓ Following"
                                : "+ Follow"}
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={async () => {
                              try {
                                const { default: conversationService } =
                                  await import("../services/conversationService");
                                const res =
                                  await conversationService.startConversation(
                                    targetId,
                                  );
                                const conv = res?.data ?? res;
                                navigate(`/messages/${conv.id}`);
                              } catch {
                                navigate("/messages");
                              }
                            }}
                          >
                            💬 Message
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hero-name">
                    {profile.displayName ||
                      profile.email?.split("@")[0] ||
                      "Student"}
                  </div>
                  {profile.headline && (
                    <div className="hero-headline">{profile.headline}</div>
                  )}
                  {profile.bio && <div className="hero-bio">{profile.bio}</div>}

                  <div className="hero-meta">
                    {profile.website && (
                      <a
                        className="hero-link"
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🔗 {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <span className="hero-email">✉ {profile.email}</span>
                  </div>

                  {/* Stats — click to switch tab */}
                  <div className="stats">
                    <div
                      className={`stat ${tab === "posts" ? "active" : ""}`}
                      onClick={() => setTab("posts")}
                    >
                      <span className="stat-n">{posts.length || "—"}</span>
                      <span className="stat-l">Posts</span>
                      <div className="stat-pip" />
                    </div>
                    <div
                      className={`stat ${tab === "followers" ? "active" : ""}`}
                      onClick={() => setTab("followers")}
                    >
                      <span className="stat-n">{followers.length}</span>
                      <span className="stat-l">Followers</span>
                      <div className="stat-pip" />
                    </div>
                    <div
                      className={`stat ${tab === "following" ? "active" : ""}`}
                      onClick={() => setTab("following")}
                    >
                      <span className="stat-n">{following.length}</span>
                      <span className="stat-l">Following</span>
                      <div className="stat-pip" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── TABS ── */}
              <div className="prof-tabs">
                <button
                  className={`prof-tab ${tab === "posts" ? "on" : ""}`}
                  onClick={() => setTab("posts")}
                >
                  Posts
                </button>
                <button
                  className={`prof-tab ${tab === "followers" ? "on" : ""}`}
                  onClick={() => setTab("followers")}
                >
                  Followers
                  <span className="prof-tab-cnt">{followers.length}</span>
                </button>
                <button
                  className={`prof-tab ${tab === "following" ? "on" : ""}`}
                  onClick={() => setTab("following")}
                >
                  Following
                  <span className="prof-tab-cnt">{following.length}</span>
                </button>
              </div>

              {/* ── TAB CONTENT ── */}
              {tab === "posts" &&
                (postsLoading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="prof-post"
                      style={{ cursor: "default" }}
                    >
                      <div
                        className="sk"
                        style={{
                          height: 13,
                          width: "100%",
                          marginBottom: 7,
                          borderRadius: 5,
                        }}
                      />
                      <div
                        className="sk"
                        style={{ height: 13, width: "75%", borderRadius: 5 }}
                      />
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <div className="lx-empty">
                    <div className="lx-empty-ic">📝</div>
                    <div className="lx-empty-t">No Posts Yet</div>
                    <p className="lx-empty-s">
                      {isOwn
                        ? "Share something from the feed."
                        : `${profile.displayName || "This student"} hasn't posted yet.`}
                    </p>
                  </div>
                ) : (
                  posts.map((p, i) => (
                    <div
                      key={p.id}
                      className="prof-post"
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => navigate(`/post/${p.id}`)}
                    >
                      {p.content && (
                        <div className="pp-content">{p.content}</div>
                      )}
                      <div className="pp-meta">
                        <span>{timeAgo(p.createdAt)}</span>
                        {p.commentCount > 0 && <span>💬 {p.commentCount}</span>}
                        {p.reactions?.length > 0 && (
                          <span className="pp-rx">
                            👍{" "}
                            {p.reactions.reduce(
                              (s, r) => s + (r.count ?? 0),
                              0,
                            )}
                          </span>
                        )}
                        {p.visibility && p.visibility !== "public" && (
                          <span>
                            {p.visibility === "private" ? "🔒" : "🔗"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ))}

              {tab === "followers" && (
                <div className="follow-grid">
                  {followers.length === 0 ? (
                    <div className="lx-empty">
                      <div className="lx-empty-ic">👥</div>
                      <div className="lx-empty-t">No Followers Yet</div>
                      <p className="lx-empty-s">Be the first to follow.</p>
                    </div>
                  ) : (
                    followers.map((f, i) => {
                      const ini = getInitials(f.displayName, f.email);
                      return (
                        <div
                          key={f.userId}
                          className="follow-card"
                          style={{ animationDelay: `${i * 35}ms` }}
                          onClick={() => navigate(`/profile/${f.userId}`)}
                        >
                          <div className="follow-av" style={avStyle(f.userId)}>
                            {ini}
                          </div>
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.displayName || f.email}
                            </div>
                            <div className="follow-email">{f.email}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {tab === "following" && (
                <div className="follow-grid">
                  {following.length === 0 ? (
                    <div className="lx-empty">
                      <div className="lx-empty-ic">🔍</div>
                      <div className="lx-empty-t">Not Following Anyone</div>
                      <p className="lx-empty-s">
                        Discover students from the feed.
                      </p>
                    </div>
                  ) : (
                    following.map((f, i) => {
                      const ini = getInitials(f.displayName, f.email);
                      return (
                        <div
                          key={f.userId}
                          className="follow-card"
                          style={{ animationDelay: `${i * 35}ms` }}
                          onClick={() => navigate(`/profile/${f.userId}`)}
                        >
                          <div className="follow-av" style={avStyle(f.userId)}>
                            {ini}
                          </div>
                          <div className="follow-info">
                            <div className="follow-name">
                              {f.displayName || f.email}
                            </div>
                            <div className="follow-email">{f.email}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : null}
        </main>
      </Layout>

      {/* Edit modal — outside Layout to sit above everything */}
      {editOpen && profile && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={saveProfile}
          saving={saving}
        />
      )}
    </>
  );
}
