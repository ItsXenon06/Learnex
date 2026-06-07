import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import groupService from "../services/groupService";
import postService from "../services/postService";
import conversationService from "../services/conversationService";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.gd-wrap{min-width:0;padding:0 0 90px;}

/* Hero banner */
.gd-hero{
  position:relative;height:160px;
  display:flex;align-items:flex-end;padding:0 28px 20px;
  border-bottom:1px solid var(--b1);
  background:linear-gradient(135deg,rgba(232,25,44,.18) 0%,rgba(255,107,53,.12) 50%,rgba(155,89,245,.1) 100%);
}
.gd-hero::before{
  content:'';position:absolute;inset:0;
  background-image:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.012) 20px,rgba(255,255,255,.012) 21px);
}
.gd-back{
  position:absolute;top:16px;left:20px;
  display:flex;align-items:center;gap:6px;
  background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);
  border-radius:8px;padding:6px 12px;
  color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;
  cursor:pointer;transition:all .15s;letter-spacing:.3px;backdrop-filter:blur(4px);
}
.gd-back:hover{background:rgba(0,0,0,.6);color:var(--t1);}
.gd-hero-info{position:relative;z-index:1;flex:1;min-width:0;}
.gd-name{font-family:var(--fd);font-size:36px;letter-spacing:4px;line-height:1;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,.5);}
.gd-meta{display:flex;align-items:center;gap:12px;font-size:12px;color:rgba(255,255,255,.7);font-family:var(--fm);}
.gd-badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;border-radius:5px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;
}
.gd-badge.class  {background:rgba(74,158,255,.25);color:#4a9eff;}
.gd-badge.club   {background:rgba(34,197,94,.25);color:#22c55e;}
.gd-badge.society{background:rgba(155,89,245,.25);color:#9b59f5;}
.gd-hero-actions{position:relative;z-index:1;display:flex;gap:8px;align-items:flex-end;}
.gd-btn{
  height:36px;padding:0 18px;border-radius:8px;border:none;
  font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.7px;
  cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:7px;
}
.gd-btn-fire{background:var(--grad-fire);color:#fff;box-shadow:0 3px 14px var(--red-glow);}
.gd-btn-fire:hover{transform:translateY(-1px);}
.gd-btn-outline{background:rgba(0,0,0,.4);color:var(--t2);border:1px solid rgba(255,255,255,.15);backdrop-filter:blur(4px);}
.gd-btn-outline:hover{background:rgba(0,0,0,.6);color:var(--t1);}
.gd-btn-ghost{background:rgba(232,25,44,.15);color:var(--red);border:1px solid rgba(232,25,44,.3);}
.gd-btn-ghost:hover{background:rgba(232,25,44,.25);}

/* Body layout */
.gd-body{display:grid;grid-template-columns:1fr 280px;gap:20px;padding:20px 28px;}
@media(max-width:900px){.gd-body{grid-template-columns:1fr;}.gd-sidebar{display:none;}}

/* Feed column */
.gd-feed{min-width:0;}

/* Tabs */
.gd-tabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:16px;}
.gd-tab{padding:11px 20px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;transition:all .2s;position:relative;}
.gd-tab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.gd-tab:hover{color:var(--t2);}
.gd-tab.on{color:var(--t1);}
.gd-tab.on::after{transform:scaleX(1);}

/* Compose */
.gd-compose{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  margin-bottom:14px;overflow:hidden;transition:border-color .2s;
}
.gd-compose:focus-within{border-color:var(--red-border);}
.gd-c-top{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;}
.gd-c-av{width:36px;height:36px;border-radius:9px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:14px;color:#fff;}
.gd-c-inp{flex:1;background:transparent;border:none;color:var(--t1);font-size:14px;font-family:var(--fb);resize:none;min-height:40px;max-height:180px;outline:none;line-height:1.7;}
.gd-c-inp::placeholder{color:var(--t3);}
.gd-c-foot{display:flex;align-items:center;justify-content:flex-end;padding:0 14px 12px;gap:8px;}
.gd-post-btn{padding:7px 18px;background:var(--grad-fire);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;cursor:pointer;transition:all .2s;}
.gd-post-btn:hover:not(:disabled){transform:translateY(-1px);}
.gd-post-btn:disabled{opacity:.4;cursor:not-allowed;}

/* Post card */
.gd-card{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  margin-bottom:10px;overflow:hidden;
  transition:border-color .2s,box-shadow .15s;
  animation:gd-up .3s var(--ease) both;cursor:pointer;
}
.gd-card:hover{border-color:rgba(255,255,255,.09);box-shadow:0 4px 14px rgba(0,0,0,.18);}
@keyframes gd-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.gd-card-head{display:flex;align-items:flex-start;gap:12px;padding:14px 16px 0;}
.gd-av{width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:16px;color:#fff;cursor:pointer;overflow:hidden;}
.gd-card-meta{flex:1;min-width:0;}
.gd-card-name{font-size:14px;font-weight:700;cursor:pointer;transition:color .15s;}
.gd-card-name:hover{color:var(--red);}
.gd-card-sub{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;}
.gd-card-body{padding:10px 16px;font-size:14px;line-height:1.75;color:var(--t1);white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}
.gd-card-foot{display:flex;align-items:center;gap:14px;padding:10px 16px;border-top:1px solid var(--b1);font-size:12px;color:var(--t3);font-family:var(--fm);}

/* Sidebar */
.gd-sidebar{display:flex;flex-direction:column;gap:14px;}
.gd-widget{background:var(--s1);border:1px solid var(--b1);border-radius:12px;overflow:hidden;}
.gd-whead{padding:12px 16px;border-bottom:1px solid var(--b1);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);}
.gd-info-row{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--b1);font-size:13px;}
.gd-info-row:last-child{border-bottom:none;}
.gd-info-label{color:var(--t3);font-family:var(--fm);font-size:11px;width:70px;flex-shrink:0;}
.gd-info-val{color:var(--t1);font-weight:600;}
.gd-member-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--b1);cursor:pointer;transition:background .12s;}
.gd-member-row:last-child{border-bottom:none;}
.gd-member-row:hover{background:var(--s2);}
.gd-member-av{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:12px;color:#fff;}
.gd-member-name{font-size:13px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gd-member-role{font-size:10px;font-family:var(--fm);padding:2px 7px;border-radius:4px;}
.gd-role-owner{background:var(--gold-sub);color:var(--gold);border:1px solid var(--gold-border);}
.gd-role-member{background:var(--s3);color:var(--t3);}

/* Access denied */
.gd-denied{padding:60px 20px;text-align:center;}
.gd-denied-ic{font-size:48px;margin-bottom:16px;}
.gd-denied-t{font-family:var(--fd);font-size:30px;letter-spacing:3px;margin-bottom:8px;}
.gd-denied-s{font-size:13px;color:var(--t3);line-height:1.8;}

/* Skeletons */
.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const AV_BG = ["#0d1f35", "#0d2918", "#2a0d1e", "#1e1a0d", "#1a0d2e"];
const AV_C = ["#4a9eff", "#4adf8a", "#df4a8a", "#dfb84a", "#af4adf"];
function avStyle(seed) {
  const i =
    (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
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

const TYPE_BADGE = {
  class: "class",
  club: "club",
  society: "society",
};

/* ─── GroupDetailPage ─────────────────────────────────────────────────────── */
export default function GroupDetailPage() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.userId ?? user?.id;
  const userIni = getInitials(user?.displayName, user?.email);
  const [chatLoading, setChatLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoad, setPostsLoad] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState("feed");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState("");
  const [denied, setDenied] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Load group info + members
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([
      groupService.getGroup(groupId),
      groupService.getMembers(groupId).catch(() => ({ data: [] })),
    ])
      .then(([gRes, mRes]) => {
        const g = gRes?.data ?? gRes;
        const m = mRes?.data ?? mRes;
        setGroup(g);
        setMembers(Array.isArray(m) ? m : []);
        setIsMember(g?.isMember ?? false);
        setMyRole(g?.myRole ?? null);
      })
      //.catch(() => navigate("/groups"))
      .catch((err) => {
        navigate("/groups");
      })
      .finally(() => setLoading(false));
  },  [groupId, uid, navigate]);

  // Load posts
  const loadPosts = useCallback(async () => {
    if (!groupId) return;
    setPostsLoad(true);
    try {
      const res = await postService.getGroupPosts(groupId);
      const data = res?.data ?? res;
      const items = data?.content ?? (Array.isArray(data) ? data : []);
      setPosts(items);
      setDenied(false);
    } catch (e) {
      if (e?.response?.status === 403) setDenied(true);
    } finally {
      setPostsLoad(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (group) loadPosts();
  }, [group, loadPosts]);

  const handleJoin = async () => {
  setJoining(true);
  setIsMember(true);
  setMyRole("member");
  try {
    const res = await groupService.joinGroup(groupId);
    const updated = res?.data ?? res;
    setIsMember(updated?.isMember ?? true);
    setMyRole(updated?.myRole ?? (updated?.isMember ? "member" : null));
    setGroup((g) => {
      const newGroup = { ...g, memberCount: updated?.memberCount ?? (g?.memberCount ?? 0) + 1 };
      return newGroup;
    });
    await Promise.all([
      loadPosts(),
      groupService.getMembers(groupId).then((res) => {
        const m = res?.data ?? res;
        setMembers(Array.isArray(m) ? m : []);
      }),
    ]);
  } catch (e) {
    setIsMember(false);
    setMyRole(null);
    alert(e?.response?.data?.message || t("groups.joinFailed"));
  } finally {
    setJoining(false);
  }
};
  const handleLeave = async () => {
    setLeaving(true);
    // Optimistic update — show as not member immediately
    const prevIsMember = isMember;
    const prevRole = myRole;
    const prevCount = group?.memberCount ?? 0;
    setIsMember(false);
    setMyRole(null);
    setGroup((g) => ({
      ...g,
      memberCount: Math.max(0, (g?.memberCount ?? 1) - 1),
    }));
    try {
      await groupService.leaveGroup(groupId);
      setLeaveOpen(false);
      // Navigate to groups page after successful leave
      setTimeout(() => navigate('/groups'), 300);
    } catch (e) {
      // Rollback optimistic update on failure
      setIsMember(prevIsMember);
      setMyRole(prevRole);
      setGroup((g) => ({ ...g, memberCount: prevCount }));
      alert(e?.response?.data?.message || t("groups.leaveFailed"));
    } finally {
      setLeaving(false);
    }
  };
  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setPostErr("");
    try {
      const res = await postService.createPost({
        content: draft.trim(),
        visibility: "group",
        groupId,
      });
      const saved = res?.data ?? res;
      setPosts((prev) => [saved, ...prev]);
      setDraft("");
    } catch (e) {
      setPostErr(e?.response?.data?.message || t("groups.postFailed"));
    } finally {
      setPosting(false);
    }
  };

  const openGroupChat = async () => {
    setChatLoading(true);
    try {
      const groupTag = `grp:${groupId}`;
      // Use already-loaded members; if empty just open messages
      const memberIds = members.map((m) => m.userId).filter((id) => id !== uid);
      const res = await conversationService.startGroupConversation(
        group.name,
        memberIds,
        groupTag,
      );
      const conv = res?.data ?? res;
      navigate(`/messages/${conv.id}`);
    } catch {
      navigate("/messages");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading)
    return (
      <>
        <style>{css}</style>
        <Layout active="groups">
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--t3)",
              fontFamily: "var(--fm)",
              fontSize: 13,
            }}
          >
            Loading group…
          </div>
        </Layout>
      </>
    );

  if (!group) return null;

  const badgeCls = TYPE_BADGE[group.type] || "club";
  const typeLabel = group.type
    ? group.type.charAt(0).toUpperCase() + group.type.slice(1)
    : "Group";
  const isPrivate = group.isPrivate || group.type === "class";

  return (
    <>
      <style>{css}</style>
      <Layout active="groups">
        <div className="gd-wrap">
          {/* Hero */}
          <div className="gd-hero">
            <button className="gd-back" onClick={() => navigate("/groups")}>
              ← Groups
            </button>
            <div className="gd-hero-info">
              <div className="gd-name">{group.name}</div>
              <div className="gd-meta">
                <span className={`gd-badge ${badgeCls}`}>{typeLabel}</span>
                {isPrivate && <span>🔒 Private</span>}
                <span>👥 {group.memberCount ?? 0} members</span>
              </div>
            </div>
            <div className="gd-hero-actions">
              {isMember ? (
                <>
                  <button
                    className="gd-btn gd-btn-outline"
                    onClick={openGroupChat}
                    disabled={chatLoading}
                    style={
                      chatLoading ? { opacity: 0.6, cursor: "not-allowed" } : {}
                    }
                  >
                    {chatLoading ? "⏳ Opening…" : "💬 Group Chat"}
                  </button>
                  {(myRole === "owner" || myRole === "admin") && (
                    <button
                      className="gd-btn gd-btn-outline"
                      onClick={() => navigate(`/groups/${groupId}/manage`)}
                      style={{
                        color: "var(--gold)",
                        borderColor: "rgba(201,168,76,.4)",
                      }}
                    >
                      ⚙ Manage
                    </button>
                  )}
                  <button
                    className="gd-btn gd-btn-ghost"
                    onClick={() => setLeaveOpen(true)}
                  >
                    Leave Group
                  </button>
                </>
              ) : (
                <button
                  className="gd-btn gd-btn-fire"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining
                    ? "…"
                    : isPrivate
                      ? "🔒 Request to Join"
                      : "+ Join"}
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="gd-body">
            {/* Feed column */}
            <div className="gd-feed">
              <div className="gd-tabs">
                <button
                  className={`gd-tab ${tab === "feed" ? "on" : ""}`}
                  onClick={() => setTab("feed")}
                >
                  Feed
                </button>
                <button
                  className={`gd-tab ${tab === "members" ? "on" : ""}`}
                  onClick={() => setTab("members")}
                >
                  Members {!loading && `(${members.length})`}
                </button>
              </div>

              {tab === "feed" && (
                <>
                  {/* Compose — only for members */}
                  {isMember && (
                    <div className="gd-compose">
                      <div className="gd-c-top">
                        <div className="gd-c-av">{userIni}</div>
                        <textarea
                          className="gd-c-inp"
                          placeholder={`Post something to ${group.name}…`}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={draft.length > 60 ? 3 : 1}
                          onKeyDown={(e) =>
                            e.key === "Enter" && e.ctrlKey && handlePost()
                          }
                        />
                      </div>
                      {postErr && (
                        <div
                          style={{
                            padding: "0 16px 8px",
                            fontSize: 12,
                            color: "var(--red)",
                          }}
                        >
                          ⚠ {postErr}
                        </div>
                      )}
                      {draft.trim() && (
                        <div className="gd-c-foot">
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--t4)",
                              fontFamily: "var(--fm)",
                            }}
                          >
                            Ctrl+Enter
                          </span>
                          <button
                            className="gd-post-btn"
                            onClick={handlePost}
                            disabled={posting}
                          >
                            {posting ? t("common.posting") : "Post"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Access denied for class groups */}
                  {denied ? (
                    <div className="gd-denied">
                      <div className="gd-denied-ic">🔒</div>
                      <div className="gd-denied-t">Members Only</div>
                      <p className="gd-denied-s">
                        This is a private group. Join to see its posts.
                      </p>
                      {!isMember && (
                        <button
                          className="gd-btn gd-btn-fire"
                          style={{ margin: "16px auto 0", display: "flex" }}
                          onClick={handleJoin}
                          disabled={joining}
                        >
                          {joining ? "…" : t("groups.requestToJoin")}
                        </button>
                      )}
                    </div>
                  ) : postsLoad ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="gd-card"
                        style={{ padding: 16, cursor: "default" }}
                      >
                        <div
                          style={{ display: "flex", gap: 12, marginBottom: 12 }}
                        >
                          <div
                            className="sk"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              className="sk"
                              style={{
                                height: 12,
                                width: "40%",
                                marginBottom: 7,
                                borderRadius: 4,
                              }}
                            />
                            <div
                              className="sk"
                              style={{
                                height: 10,
                                width: "25%",
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className="sk"
                          style={{
                            height: 12,
                            width: "100%",
                            marginBottom: 6,
                            borderRadius: 4,
                          }}
                        />
                        <div
                          className="sk"
                          style={{ height: 12, width: "80%", borderRadius: 4 }}
                        />
                      </div>
                    ))
                  ) : posts.length === 0 ? (
                    <div className="lx-empty">
                      <div className="lx-empty-ic">📝</div>
                      <div className="lx-empty-t">No Posts Yet</div>
                      <p className="lx-empty-s">
                        {isMember
                          ? t("groups.noPosts")
                          : t("groups.joinToView")}
                      </p>
                    </div>
                  ) : (
                    posts.map((p, i) => {
                      const ini = getInitials(
                        p.authorDisplayName,
                        p.authorEmail,
                      );
                      const rxTotal = (p.reactions ?? []).reduce(
                        (s, r) => s + (r.count ?? 0),
                        0,
                      );
                      return (
                        <div
                          key={p.id}
                          className="gd-card"
                          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                          onClick={() => navigate(`/post/${p.id}`)}
                        >
                          <div className="gd-card-head">
                            <div
                              className="gd-av"
                              style={avStyle(p.authorId)}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${p.authorId}`);
                              }}
                            >
                              {ini}
                            </div>
                            <div className="gd-card-meta">
                              <div
                                className="gd-card-name"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${p.authorId}`);
                                }}
                              >
                                {p.authorDisplayName ||
                                  p.authorEmail ||
                                  t("common.unknown")}
                              </div>
                              <div className="gd-card-sub">
                                {timeAgo(p.createdAt)}
                              </div>
                            </div>
                          </div>
                          {p.content && (
                            <div className="gd-card-body">{p.content}</div>
                          )}
                          <div className="gd-card-foot">
                            {rxTotal > 0 && <span>👍 {rxTotal}</span>}
                            {(p.commentCount ?? 0) > 0 && (
                              <span>💬 {p.commentCount}</span>
                            )}
                            <span
                              style={{
                                marginLeft: "auto",
                                color: "var(--red)",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: ".3px",
                              }}
                            >
                              VIEW POST →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {tab === "members" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {members.length === 0 ? (
                    <div className="lx-empty">
                      <div className="lx-empty-ic">👥</div>
                      <div className="lx-empty-t">No Members</div>
                    </div>
                  ) : (
                    members.map((m) => {
                      const ini = getInitials(m.displayName, m.email);
                      return (
                        <div
                          key={m.userId}
                          className="gd-member-row"
                          style={{
                            background: "var(--s1)",
                            border: "1px solid var(--b1)",
                            borderRadius: 10,
                          }}
                          onClick={() => navigate(`/profile/${m.userId}`)}
                        >
                          <div
                            className="gd-member-av"
                            style={avStyle(m.userId)}
                          >
                            {ini}
                          </div>
                          <span className="gd-member-name">
                            {m.displayName || m.email}
                          </span>

<span
    className={`gd-member-role ${
        m.roleName === "owner" ? "gd-role-owner" : "gd-role-member"
    }`}
>
    {m.roleName === "owner"
        ? "👑 Owner"
        : m.roleName === "admin"
          ? "🛡 Admin"
          : t("common.member")}
</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="gd-sidebar">
              {/* About */}
              <div className="gd-widget">
                <div className="gd-whead">About</div>
                {group.description && (
                  <div
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--t2)",
                      lineHeight: 1.7,
                      borderBottom: "1px solid var(--b1)",
                    }}
                  >
                    {group.description}
                  </div>
                )}
                <div className="gd-info-row">
                  <span className="gd-info-label">Type</span>
                  <span className="gd-info-val">{typeLabel}</span>
                </div>
                <div className="gd-info-row">
                  <span className="gd-info-label">Privacy</span>
                  <span className="gd-info-val">
                    {isPrivate ? "🔒 Private" : "🌍 Public"}
                  </span>
                </div>
                <div className="gd-info-row">
                  <span className="gd-info-label">Members</span>
                  <span className="gd-info-val">{group.memberCount ?? 0}</span>
                </div>
              </div>

              {/* Members preview */}
              {members.length > 0 && (
                <div className="gd-widget">
                  <div className="gd-whead">Members · {members.length}</div>
                  {members.slice(0, 5).map((m) => {
                    const ini = getInitials(m.displayName, m.email);
                    return (
                      <div
                        key={m.userId}
                        className="gd-member-row"
                        onClick={() => navigate(`/profile/${m.userId}`)}
                      >
                        <div className="gd-member-av" style={avStyle(m.userId)}>
                          {ini}
                        </div>
                        <span className="gd-member-name">
                          {m.displayName || m.email}
                        </span>
                        {m.roleName === "owner" && (
                          <span className="gd-member-role gd-role-owner">
                            👑
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {members.length > 5 && (
                    <div
                      style={{
                        padding: "10px 16px",
                        fontSize: 12,
                        color: "var(--t3)",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                      onClick={() => setTab("members")}
                    >
                      + {members.length - 5} more members
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </Layout>
      {leaveOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(0,0,0,.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "mfdin .2s var(--ease)",
          }}
          onClick={(e) => e.target === e.currentTarget && setLeaveOpen(false)}
        >
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--b2)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 360,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
                borderBottom: "1px solid var(--b1)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 20,
                  letterSpacing: 3,
                }}
              >
                Leave Group
              </span>
              <button
                onClick={() => setLeaveOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--t3)",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                padding: "18px 22px",
                fontSize: 14,
                color: "var(--t2)",
                lineHeight: 1.7,
              }}
            >
              Leave <strong style={{ color: "var(--t1)" }}>{group.name}</strong>
              ? You can rejoin later if it's public.
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "0 22px 20px",
              }}
            >
              <button
                onClick={() => setLeaveOpen(false)}
                className="gd-btn gd-btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="gd-btn gd-btn-ghost"
              >
                {leaving ? t("common.leaving") : t("groups.leaveGroup")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
