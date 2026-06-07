import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import notificationService from "../services/notificationService";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.notif-main{min-width:0;padding:24px 28px 90px;}

.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.ph-left{display:flex;align-items:baseline;gap:12px;}
.ph-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;}
.ph-count{font-size:13px;color:var(--t3);font-family:var(--fm);}

.ftabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:14px;}
.ftab{
  padding:11px 22px;border:none;background:transparent;
  color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;
  text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;
  transition:all .2s;position:relative;
}
.ftab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.ftab:hover{color:var(--t2);}
.ftab.on{color:var(--t1);}
.ftab.on::after{transform:scaleX(1);}

.btn-ghost{
  height:32px;padding:0 16px;border-radius:8px;
  background:var(--red-sub);color:var(--red);
  border:1px solid var(--red-border);
  font-family:var(--fb);font-size:12px;font-weight:800;letter-spacing:.6px;
  cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;
}
.btn-ghost:hover{background:rgba(232,25,44,.14);}

.notif-list{display:flex;flex-direction:column;gap:4px;}

.notif{
  display:flex;align-items:flex-start;gap:14px;
  padding:14px 18px;border-radius:12px;
  background:var(--s1);border:1px solid var(--b1);
  cursor:pointer;transition:border-color .2s,background .15s;
  position:relative;overflow:hidden;
  animation:nf-up .3s var(--ease) both;
}
@keyframes nf-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.notif:hover{border-color:rgba(255,255,255,.1);background:var(--s2);}
.notif.unread{border-left:2px solid rgba(232,25,44,.45);}
.notif.unread::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,rgba(232,25,44,.22),transparent);
}
@keyframes toast-up {
  from { opacity:0; transform:translateX(-50%) translateY(8px); }
  to   { opacity:1; transform:translateX(-50%) translateY(0); }
}
.notif-icon{position:relative;flex-shrink:0;}
.notif-av{
  width:44px;height:44px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:17px;
}
.notif-badge{
  position:absolute;bottom:-3px;right:-3px;
  width:19px;height:19px;border-radius:6px;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;border:2px solid var(--s1);
}

.notif-body{flex:1;min-width:0;}
.notif-text{font-size:14px;line-height:1.6;margin-bottom:4px;}
.notif-text strong{font-weight:700;color:var(--t1);}
.notif-time{font-size:11px;color:var(--t3);font-family:var(--fm);}

.unread-dot{
  width:8px;height:8px;border-radius:50%;
  background:var(--red);flex-shrink:0;margin-top:6px;
  box-shadow:0 0 6px var(--red);
}

.load-more-row{text-align:center;padding:14px;}
.lm-btn{
  padding:10px 28px;background:transparent;border:1px solid var(--b2);border-radius:8px;
  color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;
  cursor:pointer;transition:all .15s;
}
.lm-btn:hover{background:var(--s2);color:var(--t1);}
.lm-btn:disabled{opacity:.4;cursor:not-allowed;}

.notif-skel{display:flex;flex-direction:column;gap:4px;}
.nskel-row{display:flex;gap:14px;padding:14px 18px;background:var(--s1);border:1px solid var(--b1);border-radius:12px;}
.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}
`;

/* ─── Persistent read IDs ─────────────────────────────────────────────────
   We keep a localStorage set of notification IDs the user has already read
   so the red dot doesn't reappear after a page reload (server marks them
   read but a new fetch returns isRead=true from DB — however the dot logic
   below merges DB state with this local set as the source of truth).
──────────────────────────────────────────────────────────────────────────── */
const READ_KEY = "learnex_read_notifs";

function getLocalRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function addLocalRead(ids) {
  try {
    const s = getLocalRead();
    (Array.isArray(ids) ? ids : [ids]).forEach((id) => s.add(id));
    // Keep at most 500 entries to avoid bloat
    const arr = [...s];
    if (arr.length > 500) arr.splice(0, arr.length - 500);
    localStorage.setItem(READ_KEY, JSON.stringify(arr));
  } catch {
    /* no-op */
  }
}

/* ─── Type metadata ─────────────────────────────────────────────────────── */
const TYPE_META = {
  like: { bg: "rgba(74,158,255,.15)", color: "#4a9eff", emoji: "👍" },
  love: { bg: "rgba(212,83,126,.15)", color: "#D4537E", emoji: "❤️" },
  comment: { bg: "rgba(239,159,39,.15)", color: "#EF9F27", emoji: "💬" },
  mention: { bg: "rgba(155,89,245,.15)", color: "#9b59f5", emoji: "@" },
  follow: { bg: "rgba(34,197,94,.15)", color: "#22c55e", emoji: "➕" },
  message: { bg: "rgba(74,158,255,.15)", color: "#4a9eff", emoji: "✉" },
  group_invite: { bg: "rgba(232,25,44,.15)", color: "#E8192C", emoji: "👥" },
  group_join_request: {
    bg: "rgba(201,168,76,.15)",
    color: "#C9A84C",
    emoji: "🔔",
  },
  friend_request: { bg: "rgba(34,197,94,.15)", color: "#22c55e", emoji: "🤝" },
  share: { bg: "rgba(155,89,245,.15)", color: "#9b59f5", emoji: "↗" },
  poll_ended: { bg: "rgba(239,159,39,.15)", color: "#EF9F27", emoji: "📊" },
};
const DEFAULT_META = { bg: "var(--s3)", color: "var(--t2)", emoji: "🔔" };

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function buildText(n) {
  const actor = (n.payloadJson ?? n.payload)?.actorName || "Someone";
  switch (n.type) {
    case "like":
      return (
        <>
          <strong>{actor}</strong> reacted to your post
        </>
      );
    case "love":
      return (
        <>
          <strong>{actor}</strong> loved your post
        </>
      );
    case "comment":
      return (
        <>
          <strong>{actor}</strong> commented on your post
        </>
      );
    case "mention":
      return (
        <>
          <strong>{actor}</strong> mentioned you in a{" "}
          {n.payload?.targetType || "post"}
        </>
      );
    case "follow":
      return (
        <>
          <strong>{actor}</strong> started following you
        </>
      );
    case "message":
      return (
        <>
          <strong>{actor}</strong> sent you a message
        </>
      );
    case "group_invite":
      return (
        <>
          <strong>{actor}</strong> invited you to a group
        </>
      );
    case "group_join_request":
      return (
        <>
          <strong>{actor}</strong> requested to join your group
        </>
      );
    case "friend_request":
      return (
        <>
          <strong>{actor}</strong> sent you a connection request
        </>
      );
    case "share":
      return (
        <>
          <strong>{actor}</strong> shared your post
        </>
      );
    case "poll_ended":
      return <>A poll you voted in has ended</>;
    default:
      return <>{actor} did something</>;
  }
}

function handleNav(n, navigate) {
  const p = n.payloadJson || n.payload || {};
  switch (n.type) {
    case "like":
    case "love":
    case "comment":
    case "mention":
    case "share":
      if (p.postId) navigate(`/post/${p.postId}`);
      break;
    case "follow":
    case "friend_request":
      if (p.actorId) navigate(`/profile/${p.actorId}`);
      break;
    case "message":
      navigate(
        p.conversationId ? `/messages/${p.conversationId}` : "/messages",
      );
      break;
    case "group_invite":
    case "group_join_request":
      navigate("/groups");
      break;
    default:
      break;
  }
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

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="notif-skel">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="nskel-row">
          <div
            className="sk"
            style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="sk"
              style={{
                height: 13,
                width: "58%",
                marginBottom: 8,
                borderRadius: 5,
              }}
            />
            <div
              className="sk"
              style={{ height: 10, width: "22%", borderRadius: 4 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── NotificationsPage ───────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [markAllDone, setMarkAllDone] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Local set of IDs the user has read this session + previous sessions
  const [localRead, setLocalRead] = useState(() => getLocalRead());

  const pageRef = useRef(0);

  // Helper: is a notification visually unread?
  // Unread = server says unread AND not in our local-read cache
  const isUnread = (n) => !n.isRead && !localRead.has(n.id);

  // Mark IDs as read locally and persist to localStorage
  const markLocalRead = (ids) => {
    addLocalRead(ids);
    setLocalRead(getLocalRead());
  };

  useEffect(() => {
    pageRef.current = 0;
    setLoading(true);
    notificationService
      .getNotifications(0, 20, filter === "unread")
      .then((res) => {
        const data = res?.data ?? res;
        const fetched = data.content ?? data.notifications ?? [];
        setNotifs(fetched);
        // Recalculate unread count accounting for locally-read IDs
        const localReadSet = getLocalRead();
        const trueUnread = fetched.filter(
          (n) => !n.isRead && !localReadSet.has(n.id),
        ).length;
        setUnreadCount(data.unreadCount ?? trueUnread);
        setHasNext(data.hasNext ?? false);
        pageRef.current = 1;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await notificationService.getNotifications(
        pageRef.current,
        20,
        filter === "unread",
      );
      const data = res?.data ?? res;
      setNotifs((prev) => [...prev, ...(data.content ?? data.notifications ?? [])]);
      setHasNext(data.hasNext ?? false);
      pageRef.current += 1;
    } catch {
      /* no-op */
    } finally {
      setLoadingMore(false);
    }
  };

  // Click a notification: mark read on server + locally, then navigate
  const handleClick = async (n) => {
    if (isUnread(n)) {
      // Optimistic local update immediately — no waiting for server
      markLocalRead([n.id]);
      setNotifs((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (displayedUnread - 1 <= 0) {
        window.dispatchEvent(new Event("learnex:notifications-cleared"));
      }
      // Fire-and-forget server update
      notificationService.markAsRead(n.id).catch(() => {
        /* no-op */
      });
    }
    handleNav(n, navigate);
  };

  // Mark all read: server + local cache
  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      const allIds = notifs.map((n) => n.id);
      markLocalRead(allIds);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("learnex:notifications-cleared"));
      setMarkAllDone(true);
      setTimeout(() => setMarkAllDone(false), 2500);
    } catch {
      /* no-op */
    }
  };

  // Recalculate displayed unread count using merged local+server state
  const displayedUnread = notifs.filter((n) => isUnread(n)).length;

  const displayed =
    filter === "unread" ? notifs.filter((n) => isUnread(n)) : notifs;

  return (
    <>
      <style>{css}</style>
      <Layout active="notifications" unreadNotif={displayedUnread}>
        <main className="notif-main">
          {/* Header */}
          <div className="ph">
            <div className="ph-left">
              <span className="ph-title">Notifications</span>
              {displayedUnread > 0 && (
                <span className="ph-count">{displayedUnread} unread</span>
              )}
            </div>
            {displayedUnread > 0 && (
              <button className="btn-ghost" onClick={markAll}>
                ✓ Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="ftabs">
            <button
              className={`ftab ${filter === "all" ? "on" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`ftab ${filter === "unread" ? "on" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread {displayedUnread > 0 ? `(${displayedUnread})` : ""}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <Skeleton />
          ) : displayed.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">🔔</div>
              <div className="lx-empty-t">
                {filter === "unread" ? t('notifications.allCaughtUp') : t('notifications.noNotifications')}
              </div>
              <p className="lx-empty-s">
                {filter === "unread"
                  ? t('notifications.noUnread')
                  : t('notifications.empty')}
              </p>
            </div>
          ) : (
            <div className="notif-list">
              {displayed.map((n, i) => {
                const unread = isUnread(n);
                const meta = TYPE_META[n.type] || DEFAULT_META;
                const actorName = n.payloadJson?.actorName || "";
                const actorIni = actorName
                  ? getInitials(actorName, "")
                  : meta.emoji;

                return (
                  <div
                    key={n.id}
                    className={`notif ${unread ? "unread" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                    onClick={() => handleClick(n)}
                  >
                    <div className="notif-icon">
                      <div
                        className="notif-av"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {actorName ? actorIni : meta.emoji}
                      </div>
                      {actorName && (
                        <div
                          className="notif-badge"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.emoji}
                        </div>
                      )}
                    </div>

                    <div className="notif-body">
                      <div className="notif-text">{buildText(n)}</div>
                      <div className="notif-time">{timeAgo(n.createdAt)}</div>
                    </div>

                    {unread && <div className="unread-dot" />}
                  </div>
                );
              })}

              {hasNext && (
                <div className="load-more-row">
                  <button
                    className="lm-btn"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t('common.loading') : t('notifications.loadMore')}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        {markAllDone && (
          <div
            style={{
              position: "fixed",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--s2)",
              border: "1px solid var(--b2)",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 13,
              color: "var(--t1)",
              fontFamily: "var(--fm)",
              zIndex: 9999,
              boxShadow: "0 4px 20px rgba(0,0,0,.5)",
              animation: "toast-up .25s var(--ease)",
              pointerEvents: "none",
            }}
          >
            ✓ All notifications marked as read
          </div>
        )}
      </Layout>
    </>
  );
}
