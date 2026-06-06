import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import groupService from "../services/groupService";
import conversationService from "../services/conversationService";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.groups-main{min-width:0;padding:24px 28px 90px;}

.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.ph-title{font-family:var(--fd);font-size:32px;letter-spacing:4px;}
.btn-fire{height:36px;padding:0 20px;background:var(--grad-fire);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:8px;box-shadow:0 3px 14px var(--red-glow);}
.btn-fire:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.btn-fire:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-outline{height:36px;padding:0 18px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px;}
.btn-outline:hover{background:var(--s3);color:var(--t1);}
.btn-danger{height:36px;padding:0 18px;background:rgba(232,25,44,.12);border:1px solid var(--red-border);border-radius:8px;color:var(--red);font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px;}
.btn-danger:hover:not(:disabled){background:var(--red);color:#fff;}
.btn-danger:disabled{opacity:.4;cursor:not-allowed;}

.gtabs{display:flex;gap:0;border-bottom:1px solid var(--b1);margin-bottom:18px;}
.gtab{padding:11px 22px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;transition:all .2s;position:relative;}
.gtab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.gtab:hover{color:var(--t2);}
.gtab.on{color:var(--t1);}
.gtab.on::after{transform:scaleX(1);}

.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}

.gcard{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;transition:border-color .2s,box-shadow .2s,transform .2s;cursor:pointer;animation:gc-up .35s var(--ease) both;display:flex;flex-direction:column;}
.gcard:hover{border-color:rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.25);transform:translateY(-2px);}
@keyframes gc-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.gc-banner{height:72px;background:linear-gradient(135deg,rgba(232,25,44,.2),rgba(255,107,53,.12));position:relative;display:flex;align-items:flex-end;padding:10px 14px;}
.gc-type-badge{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:3px 8px;border-radius:4px;font-family:var(--fm);}
.gc-type-class{background:rgba(74,158,255,.2);color:#4a9eff;}
.gc-type-club{background:rgba(34,197,94,.2);color:#22c55e;}
.gc-type-society{background:rgba(155,89,245,.2);color:#9b59f5;}
.gc-admin-badge{position:absolute;top:10px;right:10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:4px;font-family:var(--fm);background:rgba(201,168,76,.25);color:var(--gold);border:1px solid rgba(201,168,76,.3);}

.gc-body{padding:14px;flex:1;display:flex;flex-direction:column;}
.gc-name{font-size:16px;font-weight:800;margin-bottom:4px;line-height:1.3;}
.gc-desc{font-size:12px;color:var(--t3);line-height:1.6;flex:1;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.gc-foot{display:flex;align-items:center;justify-content:space-between;}
.gc-members{font-size:11px;color:var(--t3);font-family:var(--fm);display:flex;align-items:center;gap:4px;}

.join-btn{height:30px;padding:0 14px;border-radius:7px;font-size:11px;font-weight:800;font-family:var(--fb);letter-spacing:.6px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;border:none;}
.join-btn.join{background:var(--red-sub);color:var(--red);border:1px solid var(--red-border);}
.join-btn.join:hover{background:var(--red);color:#fff;}
.join-btn.leave{background:var(--s3);color:var(--t2);border:1px solid var(--b2);}
.join-btn.leave:hover{background:rgba(232,25,44,.12);color:var(--red);border-color:var(--red-border);}
.join-btn.chat{background:rgba(155,89,245,.12);color:#9b59f5;border:1px solid rgba(155,89,245,.3);}
.join-btn.chat:hover{background:rgba(155,89,245,.22);color:#b07cf8;}
.join-btn.manage{background:var(--gold-sub);color:var(--gold);border:1px solid var(--gold-border);}
.join-btn.manage:hover{background:rgba(201,168,76,.2);}
.join-btn:disabled{opacity:.4;cursor:not-allowed;}

.gskel{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;}

.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mfdin .2s var(--ease);}
@keyframes mfdin{from{opacity:0}to{opacity:1}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:480px;overflow:hidden;animation:mslup .25s var(--ease);}
.modal.sm{max-width:380px;}
@keyframes mslup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05) 0%,transparent 70%);}
.modal-title{font-family:var(--fd);font-size:20px;letter-spacing:3px;}
.modal-close{width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--t3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.modal-close:hover{background:var(--s3);color:var(--t1);}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
.mfield label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-bottom:6px;}
.mfield input,.mfield textarea,.mfield select{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:10px 14px;color:var(--t1);font-size:14px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;resize:vertical;}
.mfield input:focus,.mfield textarea:focus,.mfield select:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.mfield input::placeholder,.mfield textarea::placeholder{color:var(--t4);}
.mfield select option{background:var(--s2);}
.mfield-row{display:flex;gap:12px;}
.mfield-row .mfield{flex:1;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--s2);border:1px solid var(--b1);border-radius:8px;}
.toggle-label{font-size:13px;font-weight:600;color:var(--t2);}
.toggle-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.toggle{position:relative;width:38px;height:22px;flex-shrink:0;}
.toggle input{opacity:0;width:0;height:0;}
.toggle-slider{position:absolute;inset:0;background:var(--s4);border-radius:22px;cursor:pointer;transition:background .2s;}
.toggle-slider::before{content:'';position:absolute;width:16px;height:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform .2s;}
.toggle input:checked + .toggle-slider{background:var(--red);}
.toggle input:checked + .toggle-slider::before{transform:translateX(16px);}
.modal-err{font-size:12px;color:var(--red);background:var(--red-sub);border:1px solid var(--red-border);border-radius:6px;padding:7px 12px;}
.modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:0 22px 20px;}

.confirm-body{padding:22px;font-size:14px;line-height:1.7;color:var(--t2);}
.confirm-body strong{color:var(--t1);}
.confirm-warn{font-size:12px;color:var(--t3);margin-top:8px;}

.member-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--b1);}
.member-row:last-child{border-bottom:none;}
.member-av{width:34px;height:34px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:13px;color:#fff;}
.member-info{flex:1;min-width:0;}
.member-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.member-role-label{font-size:10px;font-family:var(--fm);margin-top:2px;}
.role-owner{color:var(--gold);}
.role-admin{color:#4a9eff;}
.role-member{color:var(--t4);}
.member-actions{display:flex;gap:6px;flex-shrink:0;}
.mem-act-btn{height:26px;padding:0 10px;border-radius:6px;font-size:10px;font-weight:800;font-family:var(--fb);letter-spacing:.5px;cursor:pointer;transition:all .15s;border:none;}
.mem-act-btn.promote{background:rgba(74,158,255,.15);color:#4a9eff;border:1px solid rgba(74,158,255,.3);}
.mem-act-btn.promote:hover{background:rgba(74,158,255,.28);}
.mem-act-btn.demote{background:var(--s3);color:var(--t3);border:1px solid var(--b1);}
.mem-act-btn.demote:hover{background:var(--s4);color:var(--t2);}
.mem-act-btn.transfer{background:rgba(201,168,76,.15);color:var(--gold);border:1px solid var(--gold-border);}
.mem-act-btn.transfer:hover{background:rgba(201,168,76,.28);}
.mem-act-btn.kick{background:rgba(232,25,44,.1);color:var(--red);border:1px solid var(--red-border);}
.mem-act-btn.kick:hover{background:rgba(232,25,44,.2);}
.mem-act-btn:disabled{opacity:.35;cursor:not-allowed;}

.danger-zone{margin-top:8px;padding:14px;background:rgba(232,25,44,.06);border:1px solid rgba(232,25,44,.2);border-radius:10px;}
.danger-zone-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--red);margin-bottom:10px;}

.gp-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--b2);border-radius:10px;padding:10px 22px;font-size:13px;color:var(--t1);font-family:var(--fm);z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.5);pointer-events:none;animation:toast-up .25s var(--ease);}
@keyframes toast-up{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const AV_BG = ["#0d1f35","#0d2918","#2a0d1e","#1e1a0d","#1a0d2e"];
const AV_C  = ["#4a9eff","#4adf8a","#df4a8a","#dfb84a","#af4adf"];
function avStyle(seed) {
  const i = (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { background: `linear-gradient(135deg,${AV_BG[i]},${AV_C[i]})` };
}

/** Role hierarchy: owner > admin > member */
const ROLE_RANK = { owner: 3, admin: 2, member: 1 };
function roleLabel(role) {
  if (role === "owner") return { text: "👑 Owner", cls: "role-owner" };
  if (role === "admin") return { text: "🛡 Admin", cls: "role-admin" };
  return { text: "Member", cls: "role-member" };
}

const TYPE_STYLE = {
  class:   { label:"Class",   cls:"gc-type-class",   banner:"linear-gradient(135deg,rgba(74,158,255,.2),rgba(74,158,255,.05))" },
  club:    { label:"Club",    cls:"gc-type-club",    banner:"linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.05))" },
  society: { label:"Society", cls:"gc-type-society", banner:"linear-gradient(135deg,rgba(155,89,245,.2),rgba(155,89,245,.05))" },
};
const DEFAULT_TYPE = TYPE_STYLE.club;

/* ─── ConfirmLeaveModal ───────────────────────────────────────────────────── */
function ConfirmLeaveModal({ groupName, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal sm">
        <div className="modal-head">
          <span className="modal-title">Leave Group</span>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="confirm-body">
          You are about to leave <strong>{groupName}</strong>.
          <div className="confirm-warn">You can rejoin later if the group is public.</div>
        </div>
        <div className="modal-foot">
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Leaving…" : "Leave Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ConfirmDeleteModal ──────────────────────────────────────────────────── */
function ConfirmDeleteModal({ groupName, onConfirm, onCancel, loading }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toLowerCase() === groupName?.toLowerCase();
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal sm">
        <div className="modal-head" style={{ background:"linear-gradient(90deg,rgba(232,25,44,.1),transparent 70%)" }}>
          <span className="modal-title">Delete Group</span>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="confirm-body">
          This will <strong style={{ color:"var(--red)" }}>permanently delete</strong>{" "}
          <strong>{groupName}</strong> and all its posts. This cannot be undone.
          <div className="confirm-warn" style={{ marginTop:14 }}>
            <div style={{ marginBottom:6, color:"var(--t2)", fontSize:12 }}>
              Type <strong style={{ color:"var(--t1)", fontFamily:"var(--fm)" }}>{groupName}</strong> to confirm:
            </div>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={groupName}
              style={{
                width:"100%", background:"var(--s2)", border:"1px solid var(--red-border)",
                borderRadius:7, padding:"8px 12px", color:"var(--t1)",
                fontFamily:"var(--fm)", fontSize:13, outline:"none",
              }}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading || !confirmed}>
            {loading ? "Deleting…" : "Delete Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ManageModal ─────────────────────────────────────────────────────────── */
function ManageModal({ group, uid, onClose, onGroupDeleted, onGroupUpdated, showToast }) {
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [err, setErr]               = useState("");

  useEffect(() => {
    groupService.getMembers(group.id)
      .then(res => {
        const data = res?.data ?? res;
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(() => setErr("Could not load members."))
      .finally(() => setLoading(false));
  }, [group.id]);

  // String() guards against UUID vs string type mismatch from server
  const myRole  = members.find(m => String(m.userId) === String(uid))?.roleName ?? "member";
  const isOwner = myRole === "owner";

  const updateMemberRole = async (targetUserId, newRole) => {
    setBusy(targetUserId);
    setErr("");
    try {
      await groupService.updateMemberRole(group.id, targetUserId, newRole);
      // String() coercion required — server userId may be string, local may be UUID object
      setMembers(prev => prev.map(m =>
        String(m.userId) === String(targetUserId) ? { ...m, roleName: newRole } : m
      ));
      if (newRole === "owner") {
        // Current user steps down to admin after transferring ownership
        setMembers(prev => prev.map(m =>
          String(m.userId) === String(uid) ? { ...m, roleName: "admin" } : m
        ));
      }
      showToast(newRole === "owner" ? "Ownership transferred." : `Role updated to ${newRole}.`);
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not update role.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setErr("");
    try {
      console.log("[v0] Deleting group:", group.id);
      await groupService.deleteGroup(group.id);
      console.log("[v0] Group deleted successfully:", group.id);
      onGroupDeleted(group.id);
      onClose();
    } catch (e) {
      console.error("[v0] Delete failed:", e?.response?.data);
      setErr(e?.response?.data?.message || "Could not delete group.");
      setDeleting(false);
    }
  };

  const sorted = [...members].sort((a, b) => {
    const rd = (ROLE_RANK[b.roleName] ?? 1) - (ROLE_RANK[a.roleName] ?? 1);
    if (rd !== 0) return rd;
    return (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "");
  });

  return (
    <>
      <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth:500 }}>
          <div className="modal-head">
            <span className="modal-title">Manage — {group.name}</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body" style={{ maxHeight:"70vh", overflowY:"auto" }}>
            {err && <div className="modal-err">⚠ {err}</div>}

            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:2, color:"var(--t3)", marginBottom:4 }}>
              Members · {members.length}
            </div>

            {loading ? (
              <div style={{ color:"var(--t3)", fontSize:13, fontFamily:"var(--fm)", padding:"12px 0" }}>
                Loading members…
              </div>
            ) : (
              sorted.map(m => {
                const rl            = roleLabel(m.roleName);
                const ini           = getInitials(m.displayName, m.email);
                const isMe          = String(m.userId) === String(uid);
                const isOwnerTarget = m.roleName === "owner";

                return (
                  <div key={m.userId} className="member-row">
                    <div className="member-av" style={avStyle(m.userId)}>{ini}</div>
                    <div className="member-info">
                      <div className="member-name">{m.displayName || m.email}</div>
                      <div className={`member-role-label ${rl.cls}`}>{rl.text}</div>
                    </div>
                    {!isMe && isOwner && !isOwnerTarget && (
                      <div className="member-actions">
                        {m.roleName === "member" && (
                          <button
                            className="mem-act-btn promote"
                            disabled={!!busy}
                            onClick={() => updateMemberRole(m.userId, "admin")}
                            title="Promote to Admin"
                          >
                            {busy === m.userId ? "…" : "↑ Admin"}
                          </button>
                        )}
                        {m.roleName === "admin" && (
                          <button
                            className="mem-act-btn demote"
                            disabled={!!busy}
                            onClick={() => updateMemberRole(m.userId, "member")}
                            title="Demote to Member"
                          >
                            {busy === m.userId ? "…" : "↓ Member"}
                          </button>
                        )}
                        {m.roleName === "admin" && (
                          <button
                            className="mem-act-btn transfer"
                            disabled={!!busy}
                            onClick={() => {
                              if (window.confirm(`Transfer ownership to ${m.displayName || m.email}? You will become an Admin.`))
                                updateMemberRole(m.userId, "owner");
                            }}
                            title="Transfer Ownership"
                          >
                            {busy === m.userId ? "…" : "👑 Transfer"}
                          </button>
                        )}
                      </div>
                    )}
                    {isMe && (
                      <span style={{ fontSize:10, color:"var(--t4)", fontFamily:"var(--fm)" }}>You</span>
                    )}
                  </div>
                );
              })
            )}

            {isOwner && (
              <div className="danger-zone">
                <div className="danger-zone-title">⚠ Danger Zone</div>
                <div style={{ fontSize:12, color:"var(--t3)", marginBottom:12, lineHeight:1.7 }}>
                  Deleting this group will remove all posts, members, and chat history. This is permanent.
                </div>
                <button className="btn-danger" style={{ height:32, fontSize:11 }} onClick={() => setDeleteOpen(true)}>
                  🗑 Delete Group
                </button>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {deleteOpen && (
        <ConfirmDeleteModal
          groupName={group.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
          loading={deleting}
        />
      )}
    </>
  );
}

/* ─── GroupCard ───────────────────────────────────────────────────────────── */
function GroupCard({ group, isMember, myRole, onJoin, onLeaveRequest, onManage, onChat, joining }) {
  const navigate   = useNavigate();
  const ts         = TYPE_STYLE[group.type] || DEFAULT_TYPE;
  const [chatBusy, setChatBusy] = useState(false);
  const isAdmin = myRole === "owner" || myRole === "admin";

  const handleJoinLeave = e => {
    e.stopPropagation();
    if (isMember) onLeaveRequest(group);
    else onJoin(group.id);
  };

  const handleChat = async e => {
    e.stopPropagation();
    setChatBusy(true);
    try { await onChat(group); } finally { setChatBusy(false); }
  };

  // Extracted to avoid inline stopPropagation noise
  const handleManage = e => {
    e.stopPropagation();
    onManage(group);
  };

  return (
    <div className="gcard" onClick={() => navigate(`/groups/${group.id}`)}>
      <div className="gc-banner" style={{ background: ts.banner }}>
        <span className={`gc-type-badge ${ts.cls}`}>{ts.label}</span>
        {(group.isPrivate || group.type === "class") && (
          <span style={{ marginLeft:6, fontSize:10, color:"var(--t4)" }}>🔒</span>
        )}
        {isMember && myRole === "owner" && <span className="gc-admin-badge">👑 Owner</span>}
        {isMember && myRole === "admin"  && (
          <span className="gc-admin-badge" style={{ color:"#4a9eff", background:"rgba(74,158,255,.2)", borderColor:"rgba(74,158,255,.3)" }}>
            🛡 Admin
          </span>
        )}
      </div>
      <div className="gc-body">
        <div className="gc-name">{group.name}</div>
        <div className="gc-desc">{group.description || "No description provided."}</div>
        <div className="gc-foot">
          <span className="gc-members">
            👥 {group.memberCount ?? 0} member{group.memberCount !== 1 ? "s" : ""}
          </span>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            {isMember && (
              <button className="join-btn chat" onClick={handleChat} disabled={chatBusy}>
                {chatBusy ? "…" : "💬"}
              </button>
            )}
            {isMember && isAdmin && (
              <button className="join-btn manage" onClick={handleManage} title="Manage group">
                ⚙
              </button>
            )}
            <button
              className={`join-btn ${isMember ? "leave" : "join"}`}
              onClick={handleJoinLeave}
              disabled={joining === group.id}
            >
              {joining === group.id
                ? "…"
                : isMember
                  ? "Leave"
                  : (group.isPrivate || group.type === "class") ? "🔒 Request" : "+ Join"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GroupSkeleton ───────────────────────────────────────────────────────── */
function GroupSkeleton() {
  return (
    <div className="group-grid">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="gskel">
          <div style={{ height:72, background:"var(--s2)" }} />
          <div style={{ padding:14 }}>
            <div className="sk" style={{ height:16, width:"65%", marginBottom:8, borderRadius:5 }} />
            <div className="sk" style={{ height:11, width:"100%", marginBottom:5, borderRadius:4 }} />
            <div className="sk" style={{ height:11, width:"80%", marginBottom:14, borderRadius:4 }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div className="sk" style={{ height:10, width:"35%", borderRadius:4 }} />
              <div className="sk" style={{ height:30, width:70, borderRadius:7 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── CreateModal ─────────────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreate, creating }) {
  const [form, setForm] = useState({ name:"", description:"", type:"club", isPrivate:false });
  const [err, setErr]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const effectivePrivate = form.type === "class" ? true : form.isPrivate;

  const submit = async () => {
    if (!form.name.trim()) { setErr("Group name is required."); return; }
    setErr("");
    try {
      await onCreate({ ...form, isPrivate: effectivePrivate });
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create group.");
    }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">Create Group</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {err && <div className="modal-err">⚠ {err}</div>}
          <div className="mfield">
            <label>Group Name *</label>
            <input autoFocus value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. CS Algorithm Study Group" />
          </div>
          <div className="mfield">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What is this group about?" />
          </div>
          <div className="mfield-row">
            <div className="mfield">
              <label>Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="club">Club</option>
                <option value="class">Class (invite-only)</option>
                <option value="society">Society</option>
              </select>
            </div>
          </div>
          {form.type !== "class" && (
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Private Group</div>
                <div className="toggle-sub">Members must request to join</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={form.isPrivate} onChange={e => set("isPrivate", e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          )}
          {form.type === "class" && (
            <div style={{ fontSize:12, color:"var(--t3)", fontFamily:"var(--fm)", padding:"4px 0" }}>
              🔒 Class groups are always private — only invited members can view content.
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-fire" onClick={submit} disabled={creating}>
            {creating ? "Creating…" : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── GroupsPage ──────────────────────────────────────────────────────────── */
export default function GroupsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const uid        = user?.userId ?? user?.id;

  const [tab, setTab]               = useState("discover");
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [joining, setJoining]       = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState("");
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [leavingId, setLeavingId]   = useState(null);
  const [manageTarget, setManageTarget] = useState(null);
  const [toast, setToast]           = useState("");

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    groupService.getGroups()
      .then(res => {
        const data = res?.data ?? res;
        if (!active) return;
        setGroups(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!active) return; setError("Failed to load groups."); })
      .finally(() => { if (!active) return; setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleJoin = async (groupId) => {
    setJoining(groupId);
    // Optimistic update — show as member immediately
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: true, myRole: "member" } : g));
    try {
      const res     = await groupService.joinGroup(groupId);
      const updated = res?.data ?? res;
      // Sync all three fields from server response
      setGroups(prev => prev.map(g => g.id === groupId ? {
        ...g,
        isMember:    updated?.isMember    ?? true,
        myRole:      updated?.myRole      ?? "member",
        memberCount: updated?.memberCount ?? (g.memberCount ?? 0) + 1,
      } : g));
      const name = groups.find(g => g.id === groupId)?.name ?? "group";
      showToast(`Joined "${name}"!`);
    } catch (e) {
      // Rollback optimistic update on failure
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: false, myRole: null } : g));
      setError(e?.response?.data?.message || "Could not join group.");
    } finally {
      setJoining(null);
    }
  };

  const handleLeaveRequest = group => setLeaveTarget(group);

  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;
    setLeavingId(leaveTarget.id);
    try {
      await groupService.leaveGroup(leaveTarget.id);
      // Keep card visible on Discover — clear membership state and decrement count.
      // My Groups tab hides it automatically via the isMember filter.
      setGroups(prev => prev.map(g => g.id === leaveTarget.id
        ? { ...g, isMember: false, myRole: null, memberCount: Math.max(0, (g.memberCount ?? 1) - 1) }
        : g
      ));
      setLeaveTarget(null);
      showToast("Left group.");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not leave group.");
      setLeaveTarget(null);
    } finally {
      setLeavingId(null);
    }
  };

  const handleGroupDeleted = groupId => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    showToast("Group deleted.");
  };

  // Extracted so both tab buttons share one handler
  const handleTabChange = newTab => { setError(""); setTab(newTab); };

  const handleCreate = async (form) => {
    setCreating(true);
    try {
      const res     = await groupService.createGroup(form);
      const created = res?.data ?? res;
      setGroups(prev => [{
        ...created,
        isMember: created.isMember ?? true,
        myRole:   created.myRole   ?? "owner",
      }, ...prev]);
      setCreateOpen(false);
      showToast(`"${created.name}" created!`);
    } catch (e) {
      throw e; // let CreateModal handle display
    } finally {
      setCreating(false);
    }
  };

  const openGroupChat = async (group) => {
    try {
      const groupTag   = `grp:${group.id}`;
      const membersRes = await groupService.getMembers(group.id);
      const members    = membersRes?.data ?? membersRes;
      const memberIds  = (Array.isArray(members) ? members : [])
        .map(m => m.userId)
        .filter(id => id !== uid);
      const res  = await conversationService.startGroupConversation(group.name, memberIds, groupTag);
      const conv = res?.data ?? res;
      navigate(`/messages/${conv.id}`);
    } catch {
      navigate("/messages");
    }
  };

  const displayed = tab === "mine" ? groups.filter(g => g.isMember) : groups;

  return (
    <>
      <style>{css}</style>
      <Layout active="groups">
        <main className="groups-main">
          <div className="ph">
            <span className="ph-title">Groups</span>
            <button className="btn-fire" onClick={() => setCreateOpen(true)}>+ Create Group</button>
          </div>

          {error && (
            <div style={{ background:"rgba(232,25,44,.1)", border:"1px solid var(--red-border)", borderRadius:8, padding:"10px 14px", marginBottom:14, color:"var(--red)", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              ⚠ {error}
              <button onClick={() => setError("")} style={{ marginLeft:"auto", background:"none", border:"none", color:"var(--red)", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
          )}

          <div className="gtabs">
            <button className={`gtab ${tab === "discover" ? "on" : ""}`} onClick={() => handleTabChange("discover")}>
              Discover
            </button>
            <button className={`gtab ${tab === "mine" ? "on" : ""}`} onClick={() => handleTabChange("mine")}>
              My Groups{" "}{groups.filter(g => g.isMember).length > 0 && `(${groups.filter(g => g.isMember).length})`}
            </button>
          </div>

          {loading ? (
            <GroupSkeleton />
          ) : displayed.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">{tab === "mine" ? "👥" : "🔍"}</div>
              <div className="lx-empty-t">{tab === "mine" ? "No Groups Yet" : "No Groups Found"}</div>
              <p className="lx-empty-s">
                {tab === "mine"
                  ? "Join a group from the Discover tab or create your own."
                  : "No groups have been created yet. Be the first!"}
              </p>
            </div>
          ) : (
            <div className="group-grid">
              {displayed.map((g, i) => (
                <div key={g.id} style={{ animationDelay:`${Math.min(i,8)*40}ms` }}>
                  <GroupCard
                    group={g}
                    isMember={g.isMember}
                    myRole={g.myRole}
                    onJoin={handleJoin}
                    onLeaveRequest={handleLeaveRequest}
                    onManage={setManageTarget}
                    onChat={openGroupChat}
                    joining={joining}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        {toast && <div className="gp-toast">✓ {toast}</div>}
      </Layout>

      {createOpen && (
        <CreateModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} creating={creating} />
      )}

      {leaveTarget && (
        <ConfirmLeaveModal
          groupName={leaveTarget.name}
          onConfirm={handleLeaveConfirm}
          onCancel={() => setLeaveTarget(null)}
          loading={!!leavingId}
        />
      )}

      {manageTarget && (
        <ManageModal
          group={manageTarget}
          uid={uid}
          onClose={() => setManageTarget(null)}
          onGroupDeleted={handleGroupDeleted}
          onGroupUpdated={updated => setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g))}
          showToast={showToast}
        />
      )}
    </>
  );
}