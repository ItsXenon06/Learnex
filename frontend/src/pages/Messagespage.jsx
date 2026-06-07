import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import conversationService from "../services/conversationService";
import userService from "../services/userService";

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap');
.msg-wrap{display:flex;height:calc(100vh - var(--tb));overflow:hidden;min-width:0;}

/* ── LEFT conv list ── */
.cl{width:300px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid var(--b1);background:var(--s1);}
.cl-head{padding:18px 16px 12px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.cl-title{font-family:var(--fd);font-size:20px;letter-spacing:3px;color:var(--t1);}
.cl-new{width:32px;height:32px;border-radius:8px;border:1px solid var(--red-border);background:var(--red-sub);color:var(--red);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;line-height:1;}
.cl-new:hover{background:var(--red);color:#fff;}
.cl-search{padding:10px 12px;border-bottom:1px solid var(--b1);flex-shrink:0;}
.cl-search input{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:20px;padding:7px 14px;color:var(--t1);font-size:13px;font-family:var(--fb);outline:none;transition:border-color .2s;}
.cl-search input:focus{border-color:var(--red-border);}
.cl-search input::placeholder{color:var(--t4);}
.cl-body{flex:1;overflow-y:auto;}
.cl-body::-webkit-scrollbar{width:2px;}
.cl-body::-webkit-scrollbar-thumb{background:var(--s4);border-radius:2px;}

/* Conv row */
.cv-row{display:flex;gap:11px;align-items:center;padding:13px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .12s;position:relative;}
.cv-row:hover{background:var(--s2);}
.cv-row.active{background:var(--red-sub);border-left:3px solid var(--red);}
.cv-row.active .cv-name{color:var(--t1);}
.cv-row.has-unread::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--red);box-shadow:0 0 8px var(--red-glow);}
.cv-row.active::before{display:none;}

.cv-av-wrap{position:relative;flex-shrink:0;}
.cv-av{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:16px;color:#fff;background:var(--grad-fire);}

/* Group avatar — initials style */
.cv-grp-av{
  width:42px;height:42px;border-radius:11px;
  background:linear-gradient(135deg,#c01020 0%,#8B0010 100%);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:16px;color:#fff;
  box-shadow:0 2px 8px rgba(180,0,20,.3);flex-shrink:0;
}

.cv-info{flex:1;min-width:0;max-width:calc(100% - 80px);}
.cv-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;color:var(--t2);}
.cv-preview{font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--fm);}
.cv-row.has-unread .cv-preview{color:var(--t2);font-weight:600;}
.cv-right{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
.cv-time{font-size:10px;color:var(--t4);font-family:var(--fm);}
.cv-badge{background:var(--red);color:#fff;font-size:9px;font-weight:800;font-family:var(--fm);border-radius:5px;padding:2px 6px;min-width:18px;text-align:center;}

/* ── RIGHT chat panel ── */
.chat-panel{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}
.chat-head{padding:13px 20px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:12px;flex-shrink:0;background:var(--s1);}
.chat-av{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:14px;color:#fff;cursor:pointer;transition:transform .15s;}
.chat-av:hover{transform:scale(1.06);}
.chat-grp-av{
  width:38px;height:38px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,#c01020 0%,#8B0010 100%);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:14px;color:#fff;
}
.chat-name{font-size:15px;font-weight:700;cursor:pointer;transition:color .15s;}
.chat-name:hover{color:var(--red);}
.chat-sub{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;}

.chat-scroll{flex:1;overflow-y:auto;padding:16px 20px 8px;display:flex;flex-direction:column;gap:2px;}
.chat-scroll::-webkit-scrollbar{width:3px;}
.chat-scroll::-webkit-scrollbar-thumb{background:var(--s4);border-radius:2px;}

.date-div{display:flex;align-items:center;gap:10px;margin:12px 0 8px;}
.date-div::before,.date-div::after{content:'';flex:1;height:1px;background:var(--b1);}
.date-div span{font-size:10px;font-family:var(--fm);color:var(--t4);white-space:nowrap;padding:2px 10px;background:var(--s2);border:1px solid var(--b1);border-radius:20px;}

.msg-group{display:flex;flex-direction:column;gap:2px;margin-bottom:6px;}
.msg-row{display:flex;gap:8px;align-items:flex-end;max-width:72%;animation:msg-in .18s ease both;}
@keyframes msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.msg-row.mine{align-self:flex-end;flex-direction:row-reverse;}
.msg-row.theirs{align-self:flex-start;}
.msg-mini-av{width:26px;height:26px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:10px;color:var(--t2);background:var(--s3);transition:transform .15s;cursor:pointer;}
.msg-mini-av:hover{transform:scale(1.1);}
.msg-mini-av.ghost{visibility:hidden;}
.bubble-wrap{display:flex;flex-direction:column;gap:1px;min-width:0;}
.bubble{padding:9px 14px;border-radius:16px;font-size:14px;line-height:1.65;word-break:break-word;position:relative;}
.mine .bubble{background:var(--grad-fire);color:#fff;border-bottom-right-radius:4px;}
.mine .bubble.grouped{border-bottom-right-radius:16px;border-top-right-radius:4px;}
.theirs .bubble{background:var(--s2);color:var(--t1);border:1px solid var(--b1);border-bottom-left-radius:4px;}
.theirs .bubble.grouped{border-bottom-left-radius:16px;border-top-left-radius:4px;}
.bubble.deleted{opacity:.45;font-style:italic;color:var(--t3);background:var(--s2)!important;border:1px solid var(--b1)!important;}
.bubble.optimistic{opacity:.65;}
.msg-meta{font-size:9px;color:var(--t4);font-family:var(--fm);padding:0 2px;display:flex;align-items:center;gap:4px;}
.mine .msg-meta{justify-content:flex-end;}
.reply-quote{background:rgba(255,255,255,.08);border-left:2px solid rgba(232,25,44,.5);border-radius:6px;padding:5px 10px;margin-bottom:6px;font-size:11px;color:rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--fm);}
.theirs .reply-quote{background:rgba(255,255,255,.04);color:var(--t3);}

.reply-bar{display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--s2);border-top:1px solid var(--b1);animation:slide-up .15s ease;}
@keyframes slide-up{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.reply-bar-content{flex:1;min-width:0;border-left:2px solid var(--red);padding-left:10px;}
.reply-bar-who{font-size:10px;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;}
.reply-bar-txt{font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--fm);}
.reply-dismiss{width:24px;height:24px;border:none;background:transparent;color:var(--t3);font-size:14px;cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;}
.reply-dismiss:hover{background:var(--s3);color:var(--t1);}

.chat-compose{padding:12px 16px;border-top:1px solid var(--b1);display:flex;gap:10px;align-items:flex-end;flex-shrink:0;background:var(--s1);}
.compose-box{flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:14px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;resize:none;max-height:120px;line-height:1.6;transition:border-color .2s,box-shadow .2s;}
.compose-box:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.compose-box::placeholder{color:var(--t4);}
.send-btn{width:40px;height:40px;border-radius:11px;flex-shrink:0;background:var(--grad-fire);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;box-shadow:0 2px 10px var(--red-glow);}
.send-btn:hover:not(:disabled){transform:scale(1.08);}
.send-btn:disabled{opacity:.35;cursor:not-allowed;}
.compose-hint{font-size:10px;color:var(--t4);font-family:var(--fm);padding:0 4px 4px;text-align:right;}

.chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--t3);padding:40px;}
.chat-empty-ic{font-size:48px;opacity:.5;}
.chat-empty-t{font-family:var(--fd);font-size:22px;letter-spacing:3px;color:var(--t2);}
.chat-empty-s{font-size:13px;font-family:var(--fm);text-align:center;max-width:240px;line-height:1.8;}
.btn-fire-sm{padding:9px 22px;background:var(--grad-fire);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;box-shadow:0 3px 14px var(--red-glow);margin-top:4px;}
.btn-fire-sm:hover{transform:translateY(-1px);}

/* ── Modal ── */
.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.75);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fade-in .18s ease;}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:420px;overflow:hidden;animation:modal-up .22s ease;}
@keyframes modal-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.06) 0%,transparent 70%);}
.modal-title{font-family:var(--fd);font-size:18px;letter-spacing:3px;}
.modal-close{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.modal-close:hover{background:var(--s3);color:var(--t1);}
.modal-body{padding:20px;display:flex;flex-direction:column;gap:14px;}
.modal-err{font-size:12px;color:var(--red);background:var(--red-sub);border:1px solid var(--red-border);border-radius:7px;padding:8px 13px;}
.mfield label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-bottom:6px;}
.mfield input{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:9px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;}
.mfield input:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.mfield input::placeholder{color:var(--t4);}
.modal-hint{font-size:11px;color:var(--t4);font-family:var(--fm);line-height:1.7;}
.modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:0 20px 18px;}
.btn-outline-sm{padding:8px 18px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-weight:700;font-family:var(--fb);cursor:pointer;transition:all .15s;}
.btn-outline-sm:hover{background:var(--s3);color:var(--t1);}

.sk{background:var(--s3);animation:lx-pulse 1.7s ease infinite;border-radius:5px;}
@keyframes lx-pulse{0%,100%{opacity:.2}50%{opacity:.45}}

.chat-mob-back{
  display:none;
}

@media(max-width:700px){

  .chat-mob-back{
    display:flex;
    align-items:center;
    justify-content:center;
    width:32px;
    height:32px;
    border:none;
    background:transparent;
    color:var(--t2);
    font-size:20px;
    cursor:pointer;
    flex-shrink:0;
  }

  .cl{
    display:none;
  }

  .cl.show{
    display:flex;
    position:fixed;
    top:var(--tb);
    left:0;
    right:0;
    bottom:0;
    z-index:200;
    background:var(--bg);
    width:100%;
  }
}
`;

/* ─── Persistent unread storage — keyed per user ─────────────────────────
   We track which conv IDs the user has OPENED so the badge doesn't
   reappear on reload. Keyed by userId so multi-account works.
──────────────────────────────────────────────────────────────────────────── */
function getReadKey(uid) {
  return `learnex_read_convs_${uid}`;
}

function getLocalReadConvs(uid) {
  try {
    return new Set(JSON.parse(localStorage.getItem(getReadKey(uid)) || "[]"));
  } catch {
    return new Set();
  }
}

function markConvReadLocal(uid, convId) {
  try {
    const s = getLocalReadConvs(uid);
    s.add(convId);
    localStorage.setItem(getReadKey(uid), JSON.stringify([...s]));
  } catch {
    /* no-op */
  }
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const AV_BG = ["#0d1f35", "#0d2918", "#2a0d1e", "#1e1a0d", "#1a0d2e"];
const AV_C = ["#4a9eff", "#4adf8a", "#df4a8a", "#dfb84a", "#af4adf"];
function avStyle(seed) {
  const i = (typeof seed === "string" ? seed.charCodeAt(0) : 0) % AV_BG.length;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
}
function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
function fullTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function dateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("common.today");
  if (d.toDateString() === yesterday.toDateString()) return t("common.yesterday");
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Initials from group name — first letter of first two words, or first two chars */
function groupInitials(name) {
  if (!name) return "G";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Display name for a conversation */
function convDisplayName(conv) {
  if (!conv) return "";
  if (conv.type === "group" || conv.type === "class")
    return conv.name || t("messages.groupChat");
  // For DMs: prefer displayName, fall back to email username (not full email)
  if (conv.otherUserDisplayName) return conv.otherUserDisplayName;
  if (conv.otherUserEmail) return conv.otherUserEmail.split("@")[0];
  return "Unknown";
}

/** Initials for a conversation avatar */
function convInitials(conv) {
  if (!conv) return "?";
  if (conv.type === "group" || conv.type === "class")
    return groupInitials(conv.name);
  return getInitials(conv.otherUserDisplayName, conv.otherUserEmail);
}

/* ─── Group avatar component ─────────────────────────────────────────── */
function GroupAvatar({ name, size = 42 }) {
  return (
    <div
      className="cv-grp-av"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        borderRadius: size * 0.26,
      }}
    >
      {groupInitials(name)}
    </div>
  );
}

/* ─── Skeletons ──────────────────────────────────────────────────────── */
function ConvSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 11,
            alignItems: "center",
            padding: "13px 14px",
            borderBottom: "1px solid var(--b1)",
          }}
        >
          <div
            className="sk"
            style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="sk"
              style={{
                height: 12,
                width: "50%",
                marginBottom: 7,
                borderRadius: 4,
              }}
            />
            <div
              className="sk"
              style={{ height: 10, width: "75%", borderRadius: 4 }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function MsgSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 0",
      }}
    >
      {[false, true, false, false, true].map((mine, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            alignSelf: mine ? "flex-end" : "flex-start",
            maxWidth: "60%",
            flexDirection: mine ? "row-reverse" : "row",
            alignItems: "flex-end",
          }}
        >
          <div
            className="sk"
            style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0 }}
          />
          <div
            className="sk"
            style={{
              height: 36 + (i % 2) * 16,
              width: 100 + i * 30,
              borderRadius: 14,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── MessagesPage ───────────────────────────────────────────────────── */
export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { convId: paramConvId } = useParams();

  const uid = user?.userId ?? user?.id;
  const myIni = getInitials(user?.displayName, user?.email);

  const [convs, setConvs] = useState([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeId, setActiveId] = useState(paramConvId || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [dmOpen, setDmOpen] = useState(false);
  const [dmEmail, setDmEmail] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmErr, setDmErr] = useState("");
  const [dmTab, setDmTab] = useState("dm");
  const [groupName, setGroupName] = useState("");
  const [groupEmails, setGroupEmails] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupErr, setGroupErr] = useState("");

  // Per-user local read set — initialised once on mount
  const [localReadConvs, setLocalReadConvs] = useState(() =>
    uid ? getLocalReadConvs(uid) : new Set(),
  );

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [showConvList, setShowConvList] = useState(!paramConvId);
  // Re-init local read set when uid resolves (login)
  useEffect(() => {
    if (uid) setLocalReadConvs(getLocalReadConvs(uid));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setConvsLoading(true);
    conversationService
      .getConversations()
      .then((res) => {
        const data = res?.data ?? res;
        setConvs(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setConvsLoading(false));
  }, [uid]);

  useEffect(() => {
    if (paramConvId) setActiveId(paramConvId);
  }, [paramConvId]);

  useEffect(() => {
    if (!activeId || !uid) return;
    const conv = convs.find((c) => c.id === activeId);
    setActiveConv(conv || null);
    setMsgsLoading(true);
    setMessages([]);
    setReplyTo(null);

    conversationService
      .getMessages(activeId, 0, 50)
      .then((res) => {
        const data = res?.data ?? res;
        const msgs = data.messages ?? (Array.isArray(data) ? data : []);
        setMessages([...msgs].reverse());
      })
      .catch(() => {})
      .finally(() => setMsgsLoading(false));
  }, [activeId, uid]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const isConvUnread = useCallback(
    (conv) => {
      if (!conv || activeId === conv.id) return false;
      // If user has opened this conv (local record), never show unread dot
      if (localReadConvs.has(conv.id)) return false;
      return (conv.unreadCount ?? 0) > 0;
    },
    [activeId, localReadConvs],
  );

  const selectConv = useCallback(
    (conv) => {
      setActiveId(conv.id);
      setActiveConv(conv);
      navigate(`/messages/${conv.id}`, { replace: true });
      markConvReadLocal(uid, conv.id);
      setLocalReadConvs(getLocalReadConvs(uid));
      setConvs((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );
      setShowConvList(false); // hide list on mobile when conv selected
      setTimeout(() => inputRef.current?.focus(), 80);
    },
    [navigate, uid],
  );

  const sendMsg = async () => {
    const text = draft.trim();
    if (!text || sending || !activeId) return;
    setSending(true);
    setDraft("");

    const optimistic = {
      id: `opt-${Date.now()}`,
      senderId: uid,
      content: text,
      replyToId: replyTo?.id || null,
      sentAt: new Date().toISOString(),
      isDeleted: false,
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyTo(null);

    try {
      const res = await conversationService.sendMessage(
        activeId,
        text,
        replyTo?.id || null,
      );
      const saved = res?.data ?? res;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...saved, _sent: true } : m,
        ),
      );
      setConvs((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, lastMessage: saved } : c)),
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const startDm = async () => {
    const emailOrId = dmEmail.trim();
    if (!emailOrId || dmLoading) return;
    setDmLoading(true);
    setDmErr("");
    try {
      let recipientId = emailOrId;
      if (emailOrId.includes("@")) {
        const searchRes = await userService.searchByEmail(emailOrId);
        const found = searchRes?.data ?? searchRes;
        const resolved = Array.isArray(found) ? found[0] : found;
        if (!resolved?.userId && !resolved?.id) {
          setDmErr(t("messages.userNotFound"));
          return;
        }
        recipientId = resolved.userId ?? resolved.id;
      }
      const res = await conversationService.startConversation(recipientId);
      const conv = res?.data ?? res;
      setConvs((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setDmOpen(false);
      setDmEmail("");
      selectConv(conv);
    } catch (e) {
      setDmErr(
        e?.response?.data?.message ||
          e?.displayMessage ||
          t("messages.startConvFailed"),
      );
    } finally {
      setDmLoading(false);
    }
  };

  const startGroupChat = async () => {
    const name = groupName.trim();
    if (!name || groupLoading) return;
    setGroupLoading(true);
    setGroupErr("");
    try {
      const emails = groupEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const memberIds = [];
      for (const email of emails) {
        const res = await userService.searchByEmail(email);
        const found = res?.data ?? res;
        const u = Array.isArray(found) ? found[0] : found;
        const id = u?.userId ?? u?.id;
        if (!id) {
          setGroupErr(`No user found: ${email}`);
          return;
        }
        memberIds.push(id);
      }
      const res = await conversationService.startGroupConversation(
        name,
        memberIds,
      );
      const conv = res?.data ?? res;
      setConvs((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setDmOpen(false);
      setGroupName("");
      setGroupEmails("");
      setDmTab("dm");
      selectConv(conv);
    } catch (e) {
      setGroupErr(
        e?.response?.data?.message ||
          e?.displayMessage ||
          t("messages.createGroupFailed"),
      );
    } finally {
      setGroupLoading(false);
    }
  };

  function buildGroups(msgs) {
    const groups = [];
    let i = 0;
    while (i < msgs.length) {
      const sender = msgs[i].senderId;
      const group = [];
      while (i < msgs.length && msgs[i].senderId === sender) {
        group.push(msgs[i]);
        i++;
      }
      groups.push({ sender, messages: group });
    }
    return groups;
  }

  const filtered = convs.filter((c) => {
    if (!searchQ) return true;
    const name = convDisplayName(c);
    return name.toLowerCase().includes(searchQ.toLowerCase());
  });

  const isGroup = activeConv?.type === "group" || activeConv?.type === "class";
  const otherName = convDisplayName(activeConv ?? {});
  const otherIni = activeConv ? convInitials(activeConv) : "";

  return (
    <>
      <style>{css}</style>
      <Layout active="messages" fullHeight>
        <div className="msg-wrap">
          {/* ── Conversation list ── */}
          <div className={`cl ${showConvList ? "show" : ""}`}>
            <div className="cl-head">
              <span className="cl-title">Messages</span>
              <button
                className="cl-new"
                title=t("messages.newMessage")
                onClick={() => {
                  setDmOpen(true);
                  setDmErr("");
                  setDmEmail("");
                }}
              >
                ✎
              </button>
            </div>
            <div className="cl-search">
              <input
                placeholder=t("messages.searchPlaceholder")
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>
            <div className="cl-body">
              {convsLoading ? (
                <ConvSkeleton />
              ) : filtered.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--t3)",
                    fontSize: 13,
                    fontFamily: "var(--fm)",
                  }}
                >
                  {searchQ ? t("messages.noResults") : t("messages.noConversations")}
                </div>
              ) : (
                filtered.map((conv) => {
                  const name = convDisplayName(conv);
                  const ini = convInitials(conv);
                  const isGrp = conv.type === "group" || conv.type === "class";
                  const preview = conv.lastMessage?.isDeleted
                    ? t("messages.messageDeleted")
                    : conv.lastMessage?.content || t("messages.startConversation");
                  const unread = isConvUnread(conv);

                  return (
                    <div
                      key={conv.id}
                      className={`cv-row ${activeId === conv.id ? "active" : ""} ${unread ? "has-unread" : ""}`}
                      onClick={() => selectConv(conv)}
                    >
                      <div className="cv-av-wrap">
                        {isGrp ? (
                          <GroupAvatar name={conv.name} size={42} />
                        ) : (
                          <div
                            className="cv-av"
                            style={avStyle(conv.otherUserId || conv.id)}
                          >
                            {ini}
                          </div>
                        )}
                      </div>
                      <div className="cv-info">
                        <div className="cv-name">{name}</div>
                        <div className="cv-preview">{preview}</div>
                      </div>
                      <div className="cv-right">
                        <span className="cv-time">
                          {timeAgo(conv.lastMessage?.sentAt || conv.createdAt)}
                        </span>
                        {unread && (
                          <span className="cv-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="chat-panel">
            {!activeId ? (
              <div className="chat-empty">
                <div className="chat-empty-ic" style={{ fontSize: 40}}>💬</div>
                <div className="chat-empty-t">Your Messages</div>
                <p className="chat-empty-s">
                  Pick a conversation or start a new one.
                </p>
                <button
                  className="btn-fire-sm"
                  onClick={() => {
                    setDmOpen(true);
                    setDmErr("");
                    setDmEmail("");
                  }}
                >
                  + New Message
                </button>
              </div>
            ) : (
              <>
                <div className="chat-head">
                  <button
                    className="chat-mob-back"
                    onClick={() => {
                      setActiveId(null);
                      setShowConvList(true);
                      navigate("/messages", { replace: true });
                    }}
                  >
                    ‹
                  </button>
                  {isGroup ? (
                    <GroupAvatar name={activeConv?.name} size={38} />
                  ) : (
                    <div
                      className="chat-av"
                      style={avStyle(activeConv?.otherUserId)}
                      onClick={() =>
                        activeConv?.otherUserId &&
                        navigate(`/profile/${activeConv.otherUserId}`)
                      }
                    >
                      {otherIni}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="chat-name"
                      onClick={() =>
                        !isGroup &&
                        activeConv?.otherUserId &&
                        navigate(`/profile/${activeConv.otherUserId}`)
                      }
                    >
                      {otherName}
                    </div>
                    {!isGroup && activeConv?.otherUserEmail && (
                      <div className="chat-sub">
                        {activeConv.otherUserEmail}
                      </div>
                    )}
                    {isGroup && (
                      <div className="chat-sub">Group conversation</div>
                    )}
                  </div>
                </div>

                <div className="chat-scroll" ref={scrollRef}>
                  {msgsLoading ? (
                    <MsgSkeleton />
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--t3)",
                        fontSize: 13,
                        fontFamily: "var(--fm)",
                        paddingTop: 60,
                      }}
                    >
                      Say hello 👋
                    </div>
                  ) : (
                    (() => {
                      const groups = buildGroups(messages);
                      const elements = [];
                      let lastDate = null;
                      // Build a member name map for group chats
                      const memberMap = {};

                      if (isGroup && activeConv) {
                        messages.forEach((m) => {
                          if (m.senderId && m.senderDisplayName) {
                            memberMap[m.senderId] = {
                              displayName: m.senderDisplayName,
                              email: m.senderEmail,
                            };
                          }
                        });
                      }
                      groups.forEach((group, gi) => {
                        const isMine = group.sender === uid;
                        const senderInfo = memberMap[group.sender];

                        const senderDisplay =
                          !isMine && senderInfo
                            ? getInitials(
                                senderInfo.displayName,
                                senderInfo.email,
                              )
                            : !isMine
                              ? otherIni
                              : myIni;
                        //const ini = isMine ? myIni : otherIni;
                        const firstMsg = group.messages[0];
                        const thisDate = dateLabel(firstMsg.sentAt);
                        if (thisDate !== lastDate) {
                          lastDate = thisDate;
                          elements.push(
                            <div className="date-div" key={`date-${gi}`}>
                              <span>{thisDate}</span>
                            </div>,
                          );
                        }
                        const msgElements = group.messages.map((msg, mi) => {
                          const isLast = mi === group.messages.length - 1;
                          const grouped = !isLast;
                          const replySrc = msg.replyToId
                            ? messages.find((m) => m.id === msg.replyToId)
                            : null;
                          return (
                            <div
                              key={msg.id}
                              className={`msg-row ${isMine ? "mine" : "theirs"}`}
                            >
                              <div
                                className={`msg-mini-av ${isLast ? "" : "ghost"}`}
                                style={
                                  isLast
                                    ? isMine
                                      ? {
                                          background: "var(--grad-fire)",
                                          color: "#fff",
                                        }
                                      : avStyle(group.sender)
                                    : {}
                                }
                                onClick={() =>
                                  !isMine &&
                                  activeConv?.otherUserId &&
                                  navigate(`/profile/${activeConv.otherUserId}`)
                                }
                              >
                                {isLast
                                  ? isMine
                                    ? myIni
                                    : getInitials(
                                        msg.senderDisplayName,
                                        msg.senderEmail,
                                      )
                                  : ""}
                              </div>
                              <div className="bubble-wrap">
                                {isLast && (
                                  <div className="msg-meta">
                                    <span>{fullTime(msg.sentAt)}</span>
                                    {isMine && (
                                      <span
                                        style={{
                                          color: "var(--t4)",
                                          fontSize: 9,
                                        }}
                                      >
                                        {msg._optimistic ? "◌" : "✓✓"}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div
                                  className={`bubble ${grouped ? "grouped" : ""} ${msg.isDeleted ? "deleted" : ""} ${msg._optimistic ? "optimistic" : ""}`}
                                  onDoubleClick={() =>
                                    !msg.isDeleted &&
                                    setReplyTo({
                                      id: msg.id,
                                      content: msg.content,
                                      who: isMine
                                        ? user?.displayName ||
                                          user?.email?.split("@")[0]
                                        : otherName,
                                    })
                                  }
                                  title=t("messages.doubleClickReply")
                                >
                                  {replySrc && (
                                    <div className="reply-quote">
                                      ↩{" "}
                                      <strong>
                                        {replySrc.senderId === uid
                                          ? t("common.you")
                                          : replySrc.senderDisplayName ||
                                            otherName}
                                        :
                                      </strong>{" "}
                                      {replySrc.content?.slice(0, 70)}
                                      {replySrc.content?.length > 70 ? "…" : ""}
                                    </div>
                                  )}
                                  {msg.isDeleted
                                    ? t("messages.messageDeleted")
                                    : msg.content}
                                </div>
                              </div>
                            </div>
                          );
                        });
                        elements.push(
                          <div className="msg-group" key={`group-${gi}`}>
                            {msgElements}
                          </div>,
                        );
                      });
                      return elements;
                    })()
                  )}
                </div>

                {replyTo && (
                  <div className="reply-bar">
                    <div className="reply-bar-content">
                      <div className="reply-bar-who">
                        Replying to {replyTo.who}
                      </div>
                      <div className="reply-bar-txt">
                        {replyTo.content?.slice(0, 90)}
                        {replyTo.content?.length > 90 ? "…" : ""}
                      </div>
                    </div>
                    <button
                      className="reply-dismiss"
                      onClick={() => setReplyTo(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="chat-compose">
                  <textarea
                    ref={inputRef}
                    className="compose-box"
                    placeholder={`Message ${otherName}…`}
                    value={draft}
                    rows={1}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMsg();
                      }
                    }}
                  />
                  <button
                    className="send-btn"
                    onClick={sendMsg}
                    disabled={!draft.trim() || sending}
                    title=t("messages.sendEnter")
                  >
                    ➤
                  </button>
                </div>
                {draft && (
                  <div className="compose-hint">
                    Shift+Enter for new line · Enter to send
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Layout>

      {/* ── New DM / Group modal ── */}
      {dmOpen && (
        <div
          className="modal-bg"
          onClick={(e) => e.target === e.currentTarget && setDmOpen(false)}
        >
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">New Message</span>
              <button
                className="modal-close"
                onClick={() => {
                  setDmOpen(false);
                  setDmTab("dm");
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: "flex", borderBottom: "1px solid var(--b1)" }}
            >
              {["dm", "group"].map((t) => (
                <button
                  key={t}
                  onClick={() => setDmTab(t)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "none",
                    background: "transparent",
                    color: dmTab === t ? "var(--t1)" : "var(--t3)",
                    fontFamily: "var(--fb)",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    borderBottom:
                      dmTab === t
                        ? "2px solid var(--red)"
                        : "2px solid transparent",
                    transition: "all .15s",
                  }}
                >
                  {t === "dm" ? "💬 Direct" : "👥 Group"}
                </button>
              ))}
            </div>
            {dmTab === "dm" ? (
              <>
                <div className="modal-body">
                  {dmErr && <div className="modal-err">⚠ {dmErr}</div>}
                  <div className="mfield">
                    <label>Student Email or User ID</label>
                    <input
                      autoFocus
                      placeholder="classmate@university.edu"
                      value={dmEmail}
                      onChange={(e) => {
                        setDmEmail(e.target.value);
                        setDmErr("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && startDm()}
                    />
                  </div>
                  <p className="modal-hint">
                    Enter a student's email to start a direct conversation.
                  </p>
                </div>
                <div className="modal-foot">
                  <button
                    className="btn-outline-sm"
                    onClick={() => setDmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-fire-sm"
                    onClick={startDm}
                    disabled={!dmEmail.trim() || dmLoading}
                  >
                    {dmLoading ? t("common.lookingUp") : t("messages.startChat")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-body">
                  {groupErr && <div className="modal-err">⚠ {groupErr}</div>}
                  <div className="mfield">
                    <label>Group Name</label>
                    <input
                      autoFocus
                      placeholder="e.g. CS Study Squad"
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        setGroupErr("");
                      }}
                    />
                  </div>
                  <div className="mfield">
                    <label>Member Emails (comma-separated)</label>
                    <input
                      placeholder="alice@uni.edu, bob@uni.edu"
                      value={groupEmails}
                      onChange={(e) => {
                        setGroupEmails(e.target.value);
                        setGroupErr("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && startGroupChat()}
                    />
                  </div>
                  <p className="modal-hint">
                    You will be added as the group owner automatically.
                  </p>
                </div>
                <div className="modal-foot">
                  <button
                    className="btn-outline-sm"
                    onClick={() => setDmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-fire-sm"
                    onClick={startGroupChat}
                    disabled={!groupName.trim() || groupLoading}
                  >
                    {groupLoading ? t("common.creating") : t("messages.createGroupChat")}
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
