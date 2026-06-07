import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import groupService from "../services/groupService";

const css = `
.gm-wrap { min-width: 0; padding: 0 0 90px; }

.gm-hero {
  position: relative; height: 140px;
  display: flex; align-items: flex-end; padding: 0 28px 20px;
  border-bottom: 1px solid var(--b1);
  background: linear-gradient(135deg, rgba(232,25,44,.18) 0%, rgba(255,107,53,.12) 50%, rgba(155,89,245,.1) 100%);
}

.gm-back {
  position: absolute; top: 16px; left: 20px;
  display: flex; align-items: center; gap: 6px;
  background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px; padding: 6px 12px;
  color: var(--t2); font-size: 12px; font-family: var(--fb); font-weight: 700;
  cursor: pointer; transition: all .15s; letter-spacing: .3px; backdrop-filter: blur(4px);
}

.gm-back:hover { background: rgba(0,0,0,.6); color: var(--t1); }

.gm-title { font-family: var(--fd); font-size: 32px; letter-spacing: 3px; position: relative; z-index: 1; }

.gm-body { padding: 28px; max-width: 900px; margin: 0 auto; }

.gm-section {
  background: var(--s1); border: 1px solid var(--b1); border-radius: 12px;
  padding: 20px; margin-bottom: 24px;
}

.gm-section-title {
  font-size: 14px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 1.5px; color: var(--t2); margin-bottom: 16px;
}

.gm-member-list {
  display: flex; flex-direction: column; gap: 8px;
}

.gm-member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--s2); border-radius: 8px;
  transition: background .12s;
}

.gm-member-row:hover { background: var(--s3); }

.gm-member-left {
  display: flex; align-items: center; gap: 12px; flex: 1;
}

.gm-avatar {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--fd); font-size: 14px; color: #fff; flex-shrink: 0;
}

.gm-member-info {
  display: flex; flex-direction: column; min-width: 0;
}

.gm-member-name {
  font-size: 13px; font-weight: 600; color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.gm-member-email {
  font-size: 11px; color: var(--t3); font-family: var(--fm);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.gm-member-role {
  font-size: 10px; font-weight: 700; padding: 3px 8px;
  border-radius: 4px; text-transform: uppercase; letter-spacing: .5px;
  background: var(--s3); color: var(--t3);
}

.gm-member-role.owner {
  background: rgba(201,168,76,.15); color: var(--gold);
  border: 1px solid rgba(201,168,76,.3);
}

.gm-member-role.admin {
  background: rgba(74,158,255,.15); color: #4a9eff;
  border: 1px solid rgba(74,158,255,.3);
}

.gm-member-role.moderator {
  background: rgba(74,198,144,.15); color: #4ac690;
  border: 1px solid rgba(74,198,144,.3);
}

.gm-member-actions {
  display: flex; gap: 8px; flex-shrink: 0;
}

.gm-btn-small {
  height: 28px; padding: 0 12px;
  background: var(--s3); border: 1px solid var(--b2);
  border-radius: 6px; color: var(--t2); font-size: 11px;
  font-weight: 700; font-family: var(--fb); letter-spacing: .5px;
  cursor: pointer; transition: all .12s; text-transform: uppercase;
}

.gm-btn-small:hover {
  background: rgba(232,25,44,.2); color: var(--red); border-color: rgba(232,25,44,.4);
}

.gm-btn-small.fire {
  background: var(--grad-fire); color: #fff; border: none;
}

.gm-btn-small.fire:hover {
  transform: translateY(-1px); box-shadow: 0 2px 8px var(--red-glow);
}

.gm-danger {
  background: var(--s1); border: 1px solid rgba(232,25,44,.3);
  padding: 20px; border-radius: 12px; margin-top: 24px;
}

.gm-danger-title {
  font-size: 14px; font-weight: 800; color: var(--red); margin-bottom: 12px;
  text-transform: uppercase; letter-spacing: 1px;
}

.gm-danger-text {
  font-size: 13px; color: var(--t3); margin-bottom: 16px; line-height: 1.6;
}

.gm-danger-btn {
  height: 36px; padding: 0 20px;
  background: rgba(232,25,44,.15); border: 1px solid rgba(232,25,44,.4);
  border-radius: 8px; color: var(--red); font-size: 12px;
  font-weight: 800; font-family: var(--fb); letter-spacing: .8px;
  text-transform: uppercase; cursor: pointer; transition: all .18s;
}

.gm-danger-btn:hover {
  background: rgba(232,25,44,.25); border-color: rgba(232,25,44,.6);
}

.gm-loading {
  padding: 40px; text-align: center;
  color: var(--t3); font-family: var(--fm); font-size: 13px;
}

.gm-empty {
  padding: 40px; text-align: center;
  color: var(--t3); font-size: 13px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,.72); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: mfdin .2s var(--ease);
}

@keyframes mfdin { from { opacity: 0; } to { opacity: 1; } }

.modal-box {
  background: var(--s1); border: 1px solid var(--b2); border-radius: 16px;
  width: 100%; max-width: 400px; overflow: hidden;
  animation: mslup .25s var(--ease);
}

@keyframes mslup { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

.modal-header {
  padding: 18px 22px; border-bottom: 1px solid var(--b1);
  display: flex; align-items: center; justify-content: space-between;
}

.modal-title {
  font-family: var(--fd); font-size: 18px; letter-spacing: 2px;
}

.modal-close {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: transparent; color: var(--t3); font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .12s;
}

.modal-close:hover { background: var(--s3); color: var(--t1); }

.modal-body {
  padding: 20px; display: flex; flex-direction: column; gap: 12px;
}

.modal-text {
  font-size: 13px; color: var(--t2); line-height: 1.6;
}

.modal-actions {
  display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px;
}

.modal-btn {
  height: 32px; padding: 0 16px; border-radius: 6px; border: 1px solid var(--b2);
  background: var(--s2); color: var(--t2); font-size: 11px; font-weight: 800;
  font-family: var(--fb); cursor: pointer; transition: all .12s;
  text-transform: uppercase; letter-spacing: .5px;
}

.modal-btn:hover { background: var(--s3); color: var(--t1); }

.modal-btn.danger {
  background: rgba(232,25,44,.15); color: var(--red);
  border-color: rgba(232,25,44,.4);
}

.modal-btn.danger:hover {
  background: rgba(232,25,44,.25); border-color: rgba(232,25,44,.6);
}

.modal-btn.primary {
  background: var(--grad-fire); color: #fff; border: none;
}

.modal-btn.primary:hover {
  transform: translateY(-1px); box-shadow: 0 2px 8px var(--red-glow);
}
`;

const AV_BG = ["#0d1f35", "#0d2918", "#2a0d1e", "#1e1a0d", "#1a0d2e"];
const AV_C = ["#4a9eff", "#4adf8a", "#df4a8a", "#dfb84a", "#af4adf"];

function avStyle(seed) {
  const i = (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { background: `linear-gradient(135deg, ${AV_BG[i]}, ${AV_C[i]})` };
}

export default function GroupManagePage() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.userId ?? user?.id;

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [myRole, setMyRole] = useState(null);

  const [modal, setModal] = useState(null); // "change-role" | "confirm-delete"
  const [modalTarget, setModalTarget] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (!groupId) return;
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, mRes] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getMembers(groupId).catch(() => ({ data: [] })),
      ]);

      const g = gRes?.data ?? gRes;
      const m = mRes?.data ?? mRes;

      setGroup(g);
      setMembers(Array.isArray(m) ? m : []);

      // Find my role
      const myMembership = (Array.isArray(m) ? m : []).find((m) => m.userId === uid);
      setMyRole(myMembership?.roleName ?? null);
    } catch (e) {
      console.error(e);
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const canManage = myRole === "owner" || myRole === "admin";
  const canDeleteGroup = myRole === "owner";

  const handleChangeRole = async (member, role) => {
    setUpdating(true);
    try {
      await groupService.updateMemberRole(groupId, member.userId, role);
      await loadData();
      setModal(null);
    } catch (e) {
      alert(e?.response?.data?.message || t("groups.changeRoleFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setUpdating(true);
    try {
      await groupService.removeMember(groupId, memberId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberId));
      setModal(null);
    } catch (e) {
      alert(e?.response?.data?.message || t("groups.removeMemberFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    setUpdating(true);
    try {
      await groupService.deleteGroup(groupId);
      navigate("/groups");
    } catch (e) {
      alert(e?.response?.data?.message || t("groups.deleteFailed"));
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <Layout active="groups">
          <div className="gm-loading">Loading…</div>
        </Layout>
      </>
    );
  }

  if (!group) return null;

  return (
    <>
      <style>{css}</style>
      <Layout active="groups">
        <div className="gm-wrap">
          <div className="gm-hero">
            <button className="gm-back" onClick={() => navigate(`/groups/${groupId}`)}>
              ← Back to {group.name}
            </button>
            <div className="gm-title">Manage Group</div>
          </div>

          <div className="gm-body">
            {!canManage && (
              <div className="gm-section" style={{ background: "rgba(232,25,44,.05)", border: "1px solid rgba(232,25,44,.2)" }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>
                  You don&apos;t have permission to manage this group. Only owners and admins can manage members.
                </div>
              </div>
            )}

            <div className="gm-section">
              <div className="gm-section-title">Members ({members.length})</div>
              {members.length === 0 ? (
                <div className="gm-empty">No members</div>
              ) : (
                <div className="gm-member-list">
                  {members.map((member) => (
                    <div key={member.userId} className="gm-member-row">
                      <div className="gm-member-left">
                        <div
                          className="gm-avatar"
                          style={avStyle(member.displayName)}
                        >
                          {getInitials(member.displayName, member.email)}
                        </div>
                        <div className="gm-member-info">
                          <div className="gm-member-name">{member.displayName || member.email}</div>
                          <div className="gm-member-email">{member.email}</div>
                        </div>
                      </div>
                      <div
                        className={`gm-member-role ${member.roleName}`}
                      >
                        {member.roleName}
                      </div>
                      {canManage && member.userId !== uid && (
                        <div className="gm-member-actions">
                          <button
                            className="gm-btn-small"
                            onClick={() => {
                              setModalTarget(member);
                              setNewRole(member.roleName);
                              setModal("change-role");
                            }}
                          >
                            Assign Role
                          </button>
                          <button
                            className="gm-btn-small"
                            onClick={() => {
                              setModalTarget(member);
                              setModal("remove-member");
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canDeleteGroup && (
              <div className="gm-danger">
                <div className="gm-danger-title">Danger Zone</div>
                <div className="gm-danger-text">
                  Delete this group permanently. This action cannot be undone.
                </div>
                <button
                  className="gm-danger-btn"
                  onClick={() => setModal("delete-group")}
                >
                  Delete Group
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* Change Role Modal */}
      {modal === "change-role" && modalTarget && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Change Role</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-text">
                Assign a new role to {modalTarget.displayName || modalTarget.email}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {["member", "moderator", "admin"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    style={{
                      padding: "10px 14px",
                      background: newRole === role ? "rgba(232,25,44,.2)" : "var(--s2)",
                      border: newRole === role ? "1px solid var(--red)" : "1px solid var(--b1)",
                      borderRadius: 8,
                      color: "var(--t1)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all .12s",
                      textTransform: "capitalize",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="modal-actions">
                <button className="modal-btn" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  onClick={() => handleChangeRole(modalTarget, newRole)}
                  disabled={updating || newRole === modalTarget.roleName}
                >
                  {updating ? "…" : t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {modal === "remove-member" && modalTarget && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Remove Member</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-text">
                Remove {modalTarget.displayName || modalTarget.email} from this group?
              </div>
              <div className="modal-actions">
                <button className="modal-btn" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button
                  className="modal-btn danger"
                  onClick={() => handleRemoveMember(modalTarget.userId)}
                  disabled={updating}
                >
                  {updating ? "…" : t("common.remove")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {modal === "delete-group" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Delete Group</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-text">
                Are you sure you want to delete "{group.name}"? This action cannot be undone.
              </div>
              <div className="modal-actions">
                <button className="modal-btn" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button
                  className="modal-btn danger"
                  onClick={handleDeleteGroup}
                  disabled={updating}
                >
                  {updating ? "…" : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}