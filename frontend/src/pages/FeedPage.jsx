import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, getInitials } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import TrendingHashtagWidget from "../components/TrendingHashtagWidget";
import postService from "../services/postService";
import commentService from "../services/commentService";

/* ─── Utility Functions ───────────────────────────────────────────────────── */
function truncateEmail(email, maxLength = 24) {
  if (!email) return "";
  if (email.length <= maxLength) return email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email.slice(0, maxLength) + "...";
  const namePart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex);
  const availableForName = Math.max(3, maxLength - domainPart.length - 2);
  return namePart.slice(0, availableForName) + "..." + domainPart;
}

/* ─── Page-specific CSS ───────────────────────────────────────────────────── */
const css = `
/* FEED LAYOUT */
.feed{padding:18px 22px 90px;min-width:0;}

/* TABS */
.feed-header{display:flex;align-items:center;gap:0;margin-bottom:16px;border-bottom:1px solid var(--b1);}
.ftab{
  padding:13px 26px;border:none;background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:700;
  text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;
  transition:all .2s;position:relative;
}
.ftab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s var(--ease);border-radius:2px;}
.ftab:hover{color:var(--t2);}
.ftab.on{color:var(--t1);}
.ftab.on::after{transform:scaleX(1);}
.fh-gap{flex:1;}

/* Sort dropdown */
.sort-wrap{position:relative;}
.fh-sort{display:flex;align-items:center;gap:5px;padding:7px 12px;border:none;background:transparent;color:var(--t3);font-size:11px;font-family:var(--fb);font-weight:600;letter-spacing:.5px;cursor:pointer;border-radius:6px;transition:all .15s;}
.fh-sort:hover{background:var(--s2);color:var(--t2);}
.sort-menu{position:absolute;right:0;top:calc(100% + 4px);background:var(--s2);border:1px solid var(--b2);border-radius:10px;min-width:190px;padding:4px;z-index:100;box-shadow:0 8px 32px rgba(0,0,0,.6);animation:menu-pop .15s var(--ease);}
@keyframes menu-pop{from{opacity:0;transform:scale(.93) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
.sort-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border:none;background:transparent;color:var(--t2);font-size:13px;font-family:var(--fb);font-weight:600;cursor:pointer;border-radius:7px;transition:all .12s;text-align:left;}
.sort-item:hover{background:var(--s3);color:var(--t1);}
.sort-item.active{color:var(--red);background:var(--red-sub);}

/* COMPOSE */
.compose{
  background:var(--s1);border:1px solid var(--b1);border-radius:12px;
  margin-bottom:14px;overflow:hidden;transition:border-color .25s,box-shadow .25s;
}
.compose:focus-within{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub),0 4px 20px rgba(0,0,0,.3);}
.c-top{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;}
.c-av{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:var(--grad-fire);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:15px;color:#fff;box-shadow:0 2px 10px var(--red-glow);}
.c-input{flex:1;background:transparent;border:none;color:var(--t1);font-size:15px;font-family:var(--fb);resize:none;min-height:44px;max-height:200px;outline:none;line-height:1.7;padding-top:2px;}
.c-input::placeholder{color:var(--t3);}
.c-toolbar{display:flex;align-items:center;gap:2px;padding:0 12px 12px;}
.c-tool{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.3px;}
.c-tool:hover{background:var(--s3);color:var(--t1);}
.c-tool.active{background:var(--red-sub);color:var(--red);}
.c-gap{flex:1;}
.c-hint{font-size:10px;color:var(--t4);font-family:var(--fm);margin-right:8px;}
.c-post{padding:8px 18px;background:var(--grad-fire);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:800;font-family:var(--fb);letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;box-shadow:0 3px 14px var(--red-glow);}
.c-post:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px var(--red-glow);}
.c-post:disabled{opacity:.4;cursor:not-allowed;}
.c-vis{
  padding:4px 10px;background:var(--s3);border:1px solid var(--b1);border-radius:5px;
  color:var(--t3);font-size:11px;font-family:var(--fm);cursor:pointer;transition:all .15s;
}
.c-vis:hover{border-color:var(--b2);color:var(--t2);}

/* image preview in compose */
.c-previews{display:flex;gap:6px;flex-wrap:wrap;padding:0 16px 10px;}
.c-prev-item{position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0;}
.c-prev-img{width:100%;height:100%;object-fit:cover;}
.c-prev-rm{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.75);border:none;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}
.c-prev-rm:hover{background:var(--red);}
.c-up-dot{width:6px;height:6px;border-radius:50%;background:var(--red);animation:upload-pulse .8s ease infinite;}
@keyframes upload-pulse{0%,100%{opacity:.3}50%{opacity:1}}

/* POST CARD */
.card{
background:var(--s1);border:1px solid var(--b1);border-radius:12px;
margin-bottom:10px;overflow:hidden;
transition:border-color .25s,transform .2s,box-shadow .25s;
animation:card-up .35s var(--ease) both;
position:relative;cursor:pointer;
}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .25s;border-radius:12px 0 0 12px;}
.card:hover{border-color:rgba(255,255,255,.09);box-shadow:0 4px 16px rgba(0,0,0,.18);}
.card:hover::before{background:rgba(232,25,44,.2);}
@keyframes card-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.card-head{display:flex;align-items:flex-start;gap:13px;padding:16px 16px 0 18px;}
.c-ava{
  width:46px;height:46px;border-radius:11px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:18px;color:#fff;
  transition:transform .15s;cursor:pointer;overflow:hidden;
}
.c-ava:hover{transform:scale(1.06);}
.c-meta{flex:1;min-width:0;}
.c-name{font-size:15px;font-weight:700;cursor:pointer;transition:color .15s;display:flex;align-items:center;gap:7px;}
.c-name:hover{color:var(--red);}
.c-sub{font-size:12px;color:var(--t3);margin-top:3px;display:flex;align-items:center;gap:5px;font-family:var(--fm);}
.c-dot{color:var(--t4);}

/* post options menu */
.c-more-wrap{position:relative;}
.c-more{width:30px;height:30px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:18px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;}
.c-more:hover{background:var(--s3);color:var(--t1);}
.c-more-menu{
  position:absolute;top:calc(100% + 4px);right:0;z-index:100;
  background:var(--s2);border:1px solid var(--b2);border-radius:10px;
  min-width:160px;padding:4px;
  box-shadow:0 8px 32px rgba(0,0,0,.6);
  animation:menu-pop .15s var(--ease);
}
.c-menu-item{
  display:flex;align-items:center;gap:9px;width:100%;
  padding:9px 12px;border:none;background:transparent;
  color:var(--t2);font-size:13px;font-family:var(--fb);font-weight:600;
  cursor:pointer;border-radius:7px;transition:all .12s;text-align:left;
}
.c-menu-item:hover{background:var(--s3);color:var(--t1);}
.c-menu-item.danger{color:#ff6b7a;}
.c-menu-item.danger:hover{background:rgba(232,25,44,.12);color:var(--red);}
.c-menu-divider{height:1px;background:var(--b1);margin:3px 0;}

.card-body{padding:11px 16px 11px 18px;font-size:15px;line-height:1.8;color:var(--t1);white-space:pre-wrap;word-break:break-word;}
.c-tag{background:var(--grad-fire);-webkit-background-clip:text;background-clip:text;color:transparent;cursor:pointer;font-weight:700;}
.c-mention{color:var(--blue);cursor:pointer;font-weight:600;}
.c-mention:hover{text-decoration:underline;}

/* attachment grid on card */
.card-media{padding:0 16px 12px 18px;}
.cm-grid{display:grid;gap:3px;border-radius:10px;overflow:hidden;}
.cm-grid.n1{grid-template-columns:1fr;}
.cm-grid.n2{grid-template-columns:1fr 1fr;}
.cm-grid.n3{grid-template-columns:1fr 1fr;grid-template-rows:auto auto;}
.cm-grid.n4{grid-template-columns:1fr 1fr;}
.cm-grid.n3 .cm-att:first-child{grid-column:1/-1;}
.cm-att{width:100%;border-radius:6px;object-fit:cover;max-height:360px;cursor:pointer;transition:opacity .15s;}
.cm-att:hover{opacity:.88;}
.card-tags{display:flex;gap:7px;flex-wrap:wrap;padding:0 16px 13px 18px;}
.tag-chip{
  padding:4px 12px;background:var(--red-sub);border:1px solid var(--red-border);
  border-radius:6px;font-size:12px;color:var(--red);font-weight:700;font-family:var(--fm);
  letter-spacing:.3px;cursor:pointer;transition:all .15s;
}
.tag-chip:hover{background:var(--red);color:#fff;border-color:var(--red);}

/* reaction summary bar */
.card-stats{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 18px;border-top:1px solid var(--b1);
  font-size:13px;color:var(--t3);font-family:var(--fm);
}
.stat-rx{display:flex;align-items:center;gap:3px;cursor:pointer;}
.stat-rx:hover .stat-n{color:var(--t1);}
.stat-em{font-size:16px;}
.stat-n{margin-left:4px;font-size:12px;transition:color .15s;}
.stat-right{display:flex;align-items:center;gap:14px;}
.stat-link{cursor:pointer;transition:color .15s;}
.stat-link:hover{color:var(--t1);}

/* ── ACTION BAR ──
   FIXED REACTION SYSTEM:
   - .rx-trigger is the Like button area + picker container
   - Clicking the button = like/unlike (no picker interaction)
   - Hovering button shows picker after 400ms delay
   - Picker is shown via JS state (not CSS :hover) so clicks register properly
   - Clicking picker emoji = apply that reaction
*/
.card-actions{display:flex;align-items:stretch;border-top:1px solid var(--b1);}
.ca{
  flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
  padding:11px 4px;border:none;border-right:1px solid var(--b1);background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;
  letter-spacing:.3px;cursor:pointer;transition:all .15s;
}
.ca:last-child{border-right:none;}
.ca:hover{background:var(--s2);color:var(--t1);}
.ca.liked{color:var(--red);}
.ca.saved{color:var(--gold);}
.ca-i{font-size:16px;line-height:1;}

/* Reaction trigger wrapper */
.rx-trigger{position:relative;flex:1;display:flex;}
.rx-trigger .ca-btn{
  width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
  padding:11px 4px;border:none;border-right:1px solid var(--b1);background:transparent;
  color:var(--t3);font-size:13px;font-family:var(--fb);font-weight:600;
  letter-spacing:.3px;cursor:pointer;transition:all .15s;
}
.rx-trigger .ca-btn:hover{background:var(--s2);color:var(--t1);}
.rx-trigger .ca-btn.liked{color:var(--red);}

/* Reaction picker — JS-controlled visibility */
.rx-pick{
  position:absolute;bottom:calc(100% + 8px);left:50%;
  transform:translateX(-50%) scale(.85);transform-origin:bottom center;
  background:var(--s3);border:1px solid var(--b2);border-radius:32px;
  padding:6px 10px;display:flex;gap:3px;z-index:200;
  transition:opacity .15s,transform .15s var(--ease);
  box-shadow:0 10px 40px rgba(0,0,0,.7);white-space:nowrap;
  pointer-events:none;opacity:0;
}
.rx-pick.visible{
  opacity:1;pointer-events:all;
  transform:translateX(-50%) scale(1);
}
.rx-e{
  font-size:22px;cursor:pointer;border:none;background:none;
  padding:3px 5px;border-radius:50%;transition:transform .12s;line-height:1;
  position:relative;
}
.rx-e:hover{transform:scale(1.45) translateY(-4px);}
.rx-e::after{
  content:attr(data-label);
  position:absolute;bottom:calc(100% + 4px);left:50%;
  transform:translateX(-50%);
  background:rgba(0,0,0,.8);color:#fff;font-size:9px;font-family:var(--fm);
  padding:2px 6px;border-radius:4px;white-space:nowrap;
  opacity:0;pointer-events:none;transition:opacity .1s;
}
.rx-e:hover::after{opacity:1;}

/* ── REACTION DETAILS MODAL ── */
.rx-detail-overlay{position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;animation:fade-in .15s ease;}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.rx-detail-modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:90%;max-width:420px;overflow:hidden;max-height:80vh;display:flex;flex-direction:column;animation:slide-up .2s var(--ease);}
@keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.rx-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--b1);}
.rx-modal-title{font-size:15px;font-weight:700;}
.rx-modal-close{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--t3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.rx-modal-close:hover{background:var(--s3);color:var(--t1);}
.rx-modal-tabs{display:flex;gap:0;padding:0 10px;border-bottom:1px solid var(--b1);overflow-x:auto;}
.rx-modal-tab{padding:10px 14px;border:none;background:transparent;color:var(--t3);font-size:12px;font-family:var(--fb);font-weight:700;cursor:pointer;transition:all .2s;position:relative;white-space:nowrap;display:flex;align-items:center;gap:5px;}
.rx-modal-tab::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--grad-fire);transform:scaleX(0);transition:transform .2s;border-radius:2px;}
.rx-modal-tab.on{color:var(--t1);}
.rx-modal-tab.on::after{transform:scaleX(1);}
.rx-modal-body{flex:1;overflow-y:auto;padding:8px 0;}
.rx-user-row{display:flex;align-items:center;gap:12px;padding:10px 18px;transition:background .15s;cursor:pointer;}
.rx-user-row:hover{background:var(--s2);}
.rx-user-av{width:36px;height:36px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:14px;color:#fff;}
.rx-user-name{font-size:13px;font-weight:600;flex:1;}
.rx-user-emoji{font-size:18px;}

/* error banner */
.post-err{background:rgba(232,25,44,.1);border:1px solid var(--red-border);border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:13px;color:var(--red);display:flex;align-items:center;gap:8px;}

/* COMMENTS */
.comments{background:rgba(0,0,0,.2);border-top:1px solid var(--b1);}
.cm-scroll{max-height:300px;overflow-y:auto;padding:12px 18px 0;display:flex;flex-direction:column;gap:8px;}
.cm-scroll::-webkit-scrollbar{width:2px;}
.cm-scroll::-webkit-scrollbar-thumb{background:var(--s4);border-radius:2px;}
.cmi{display:flex;gap:8px;}
.cm-av{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:11px;color:#fff;background:var(--s4);}
.cm-bub{background:var(--s2);border-radius:0 8px 8px 8px;padding:7px 12px;flex:1;border:1px solid var(--b1);}
.cm-who{font-size:11px;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:7px;}
.cm-when{font-size:9px;color:var(--t3);font-family:var(--fm);font-weight:400;}
.cm-txt{font-size:13px;line-height:1.55;word-break:break-word;}

/* ── COMMENT REACTIONS — JS-controlled like post reactions ── */
.cm-acts{display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;position:relative;}
.cm-rx-wrap{position:relative;display:inline-flex;}
.cm-rx-btn{
  display:flex;align-items:center;gap:4px;
  background:none;border:none;color:var(--t3);font-size:11px;
  font-family:var(--fb);font-weight:600;cursor:pointer;
  padding:2px 7px;border-radius:5px;transition:all .12s;
}
.cm-rx-btn:hover{background:var(--s3);color:var(--t1);}
.cm-rx-btn.liked{color:var(--red);}
.cm-rx-pick{
  position:absolute;bottom:calc(100% + 6px);left:0;
  background:var(--s3);border:1px solid var(--b2);border-radius:28px;
  padding:5px 8px;display:flex;gap:2px;z-index:200;
  transition:opacity .15s,transform .15s var(--ease);
  transform:scale(.85);transform-origin:bottom left;
  box-shadow:0 8px 32px rgba(0,0,0,.7);white-space:nowrap;
  pointer-events:none;opacity:0;
}
.cm-rx-pick.visible{opacity:1;pointer-events:all;transform:scale(1);}
.cm-rx-e{font-size:18px;cursor:pointer;border:none;background:none;padding:2px 4px;border-radius:50%;transition:transform .12s;line-height:1;}
.cm-rx-e:hover{transform:scale(1.4) translateY(-3px);}
.cm-rx-chip{
  display:flex;align-items:center;gap:3px;padding:2px 7px;
  background:var(--s3);border:1px solid var(--b1);border-radius:10px;
  font-size:10px;cursor:pointer;transition:all .12s;font-family:var(--fm);
}
.cm-rx-chip:hover{border-color:var(--red-border);background:var(--red-sub);color:var(--red);}
.cm-rx-chip.mine{border-color:var(--red-border);background:var(--red-sub);color:var(--red);}

.cm-empty{padding:16px 18px;font-size:13px;color:var(--t3);font-family:var(--fm);}
.cm-input-row{display:flex;gap:8px;align-items:center;padding:10px 18px 12px;}
.cm-inp{flex:1;background:var(--s2);border:1px solid var(--b1);border-radius:22px;padding:7px 16px;color:var(--t1);font-size:13px;font-family:var(--fb);outline:none;transition:border-color .2s,box-shadow .2s;}
.cm-inp:focus{border-color:var(--red-border);box-shadow:0 0 0 3px var(--red-sub);}
.cm-inp::placeholder{color:var(--t3);}
.cm-go{width:30px;height:30px;border-radius:50%;background:var(--grad-fire);border:none;color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;box-shadow:0 2px 8px var(--red-glow);}
.cm-go:hover{transform:scale(1.12);}
.cm-go:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.cm-replies{padding-left:20px;display:flex;flex-direction:column;gap:6px;margin-top:4px;}

/* SHARE / COPY TOAST */
.copy-toast{
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  background:var(--s2);border:1px solid var(--b2);border-radius:10px;
  padding:10px 20px;font-size:13px;color:var(--t1);font-family:var(--fm);
  z-index:9999;animation:toast-up .25s var(--ease);pointer-events:none;
  box-shadow:0 4px 20px rgba(0,0,0,.5);
}
@keyframes toast-up{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* RIGHT PANEL */
.lx-rp{padding:18px 16px;position:sticky;top:var(--tb);height:calc(100vh - var(--tb));overflow-y:auto;display:flex;flex-direction:column;gap:14px;}
.lx-rp::-webkit-scrollbar{display:none;}
.wg{background:var(--s1);border:1px solid var(--b1);border-radius:12px;overflow:hidden;}
.wg-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(232,25,44,.05) 0%,transparent 70%);}
.wg-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--t2);display:flex;align-items:center;gap:6px;}
.wg-title em{color:var(--red);font-style:normal;}
.wg-more{font-size:12px;color:var(--t3);cursor:pointer;font-weight:600;letter-spacing:.5px;border:none;background:none;transition:color .15s;font-family:var(--fb);}
.wg-more:hover{color:var(--red);}
.tr-item{display:flex;align-items:center;padding:11px 16px;cursor:pointer;transition:background .15s;gap:13px;border-bottom:1px solid var(--b1);}
.tr-item:last-child{border-bottom:none;}
.tr-item:hover{background:var(--s2);}
.tr-num{font-family:var(--fm);font-size:12px;color:var(--t4);width:18px;flex-shrink:0;}
.tr-body{flex:1;min-width:0;}
.tr-tag{font-size:15px;font-weight:700;color:var(--t1);transition:color .15s;}
.tr-item:hover .tr-tag{color:var(--red);}
.tr-sub{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;}
.tr-cnt{font-size:11px;color:var(--t3);font-family:var(--fm);flex-shrink:0;}
.wf-item{display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid var(--b1);transition:background .15s;}
.wf-item:last-child{border-bottom:none;}
.wf-item:hover{background:var(--s2);}
.wf-av{width:38px;height:38px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:'Bebas Neue',sans-serif;overflow:hidden;}
.wf-info{flex:1;min-width:0;}
.wf-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.wf-role{font-size:11px;color:var(--t3);font-family:var(--fm);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;}
.fw-btn{padding:6px 14px;border:1px solid var(--red);border-radius:6px;background:transparent;color:var(--red);font-size:11px;font-weight:800;cursor:pointer;transition:all .15s;font-family:var(--fb);letter-spacing:.5px;flex-shrink:0;white-space:nowrap;}
.fw-btn:hover{background:var(--red);color:#fff;}
.fw-btn.ing{background:var(--red-sub);border-color:transparent;color:var(--red);}

/* SKELETON */
.skel{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:16px;margin-bottom:10px;}
.load-more{text-align:center;padding:14px;}
.lm-btn{padding:10px 28px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--t2);font-size:12px;font-family:var(--fb);font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .15s;}
.lm-btn:hover{background:var(--s2);color:var(--t1);}
.lm-btn:disabled{opacity:.4;cursor:not-allowed;}

/* Responsive: on narrow screens, picker shouldn't go behind nav */
@media(max-width:780px){
  .rx-pick{left:0;transform:translateX(0) scale(.85);}
  .rx-pick.visible{transform:translateX(0) scale(1);}
}
`;

/* ─── Constants ─────────────────────────────────────────────────────────── */
const RX_TYPES_BASE = [
  { emoji: "👍", type: "like", labelKey: "feed.likeBtn" },
  { emoji: "❤️", type: "love", labelKey: "feed.loveBtn" },
  { emoji: "💡", type: "insightful", labelKey: "feed.insightfulBtn" },
  { emoji: "🎉", type: "celebrate", labelKey: "feed.celebrateBtn" },
  { emoji: "🤝", type: "support", labelKey: "feed.supportBtn" },
];
const RX_EMOJI = {
  like: "👍",
  love: "❤️",
  insightful: "💡",
  celebrate: "🎉",
  support: "🤝",
};

const SORT_OPTIONS_BASE = [
  { key: "latest", labelKey: "feed.sortLatest", sort: "latest" },
  { key: "likes_day", labelKey: "feed.sortTop24h", sort: "likes", window: "24h" },
  { key: "likes_month", labelKey: "feed.sortTopMonth", sort: "likes", window: "30d" },
  { key: "likes_year", labelKey: "feed.sortTopYear", sort: "likes", window: "365d" },
];

const TRENDS = [
  { tag: "#FinalExams", sub: "Trending in Education", cnt: "2.4k" },
  { tag: "#CampusLife", sub: "Trending near you", cnt: "1.8k" },
  { tag: "#StudyGroup", sub: "Popular today", cnt: "943" },
  { tag: "#InternSeason", sub: "Career & Jobs", cnt: "712" },
  { tag: "#LearnexTips", sub: "Community picks", cnt: "500" },
];

/* ─── Avatar helpers ─────────────────────────────────────────────────────── */
const AV_BG = [
  "#0d1f35",
  "#0d2918",
  "#2a0d1e",
  "#1e1a0d",
  "#1a0d2e",
  "#1a1a0d",
];
const AV_C = ["#4a9eff", "#4adf8a", "#df4a8a", "#dfb84a", "#af4adf", "#df9a4a"];
function avatarStyle(seed) {
  const i =
    (typeof seed === "string" ? seed.charCodeAt(0) : seed || 0) % AV_BG.length;
  return { bg: AV_BG[i], c: AV_C[i] };
}
function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function renderText(text) {
  if (!text) return null;
  return text.split(/(\#\w+|@\w+)/g).map((p, i) => {
    if (p.startsWith("#"))
      return (
        <span key={i} className="c-tag">
          {p}
        </span>
      );
    if (p.startsWith("@"))
      return (
        <span key={i} className="c-mention">
          {p}
        </span>
      );
    return <span key={i}>{p}</span>;
  });
}
function extractTags(content) {
  if (!content) return [];
  return [...new Set(content.match(/#\w+/g) || [])];
}

/* ─── Lightbox ───────────────────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose, getImageUrl }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [images.length, onClose]);
  const imageUrl = getImageUrl
    ? getImageUrl(images[idx]?.url)
    : images[idx]?.url;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 18,
          right: 22,
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: 28,
          cursor: "pointer",
          opacity: 0.7,
        }}
      >
        ✕
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i - 1 + images.length) % images.length);
            }}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,.08)",
              border: "none",
              borderRadius: "50%",
              width: 46,
              height: 46,
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % images.length);
            }}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,.08)",
              border: "none",
              borderRadius: "50%",
              width: 46,
              height: 46,
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ›
          </button>
        </>
      )}
      <img
        src={imageUrl}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "92vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: 8,
        }}
      />
    </div>
  );
}

/* ─── ReactionDetailsModal ───────────────────────────────────────────────── */
function ReactionDetailsModal({ postId, reactions, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [reactors, setReactors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postService
      .getPostReactions(postId)
      .then((res) => {
        const data = res?.data ?? res;
        setReactors(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const total = reactions.reduce((s, r) => s + (r.count ?? 0), 0);
  const filtered =
    activeTab === "all"
      ? reactors
      : reactors.filter(
          (r) => (r.reactionType ?? r.type ?? r.name) === activeTab,
        );

  return (
    <div
      className="rx-detail-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rx-detail-modal">
        <div className="rx-modal-head">
          <span className="rx-modal-title">Reactions</span>
          <button className="rx-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="rx-modal-tabs">
          <button
            className={`rx-modal-tab ${activeTab === "all" ? "on" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            ⚡ {total}
          </button>
          {reactions
            .filter((r) => r.count > 0)
            .map((r) => (
              <button
                key={r.name ?? r.type}
                className={`rx-modal-tab ${activeTab === (r.name ?? r.type) ? "on" : ""}`}
                onClick={() => setActiveTab(r.name ?? r.type)}
              >
                {RX_EMOJI[r.name ?? r.type] ?? "👍"} {r.count}
              </button>
            ))}
        </div>
        <div className="rx-modal-body">
          {loading ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--t3)",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--t3)",
                fontSize: 13,
              }}
            >
              No reactions yet
            </div>
          ) : (
            filtered.map((r, i) => {
              const ini = getInitials(r.displayName, r.email);
              const { bg, c } = avatarStyle(r.userId);
              return (
                <div
                  key={i}
                  className="rx-user-row"
                  onClick={() => {
                    navigate(`/profile/${r.userId}`);
                    onClose();
                  }}
                >
                  <div
                    className="rx-user-av"
                    style={{ background: `linear-gradient(135deg,${bg},${c})` }}
                  >
                    {ini}
                  </div>
                  <span className="rx-user-name">
                    {r.displayName || r.email || "User"}
                  </span>
                  <span className="rx-user-emoji">
                    {RX_EMOJI[r.reactionType ?? r.type ?? r.name] ?? "👍"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CommentReactions — JS hover-controlled, no CSS :hover race ─────────── */
function CommentReactions({
  commentId,
  reactions: initRx,
  myReaction: initMy,
}) {
  const [reactions, setReactions] = useState(initRx ?? []);
  const [myRx, setMyRx] = useState(initMy ?? null);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hoverTimerRef = useRef(null);
  const wrapRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const handle = async (type) => {
    if (busy) return;
    setPickerOpen(false);
    setBusy(true);
    try {
      let updated;
      if (myRx === type) {
        const res = await commentService.removeCommentReaction(commentId);
        updated = res?.data ?? res;
        setMyRx(null);
      } else {
        const res = await commentService.reactToComment(commentId, type);
        updated = res?.data ?? res;
        setMyRx(type);
      }
      if (Array.isArray(updated)) setReactions(updated);
    } catch {
      /* no-op */
    } finally {
      setBusy(false);
    }
  };

  // Click the main button: if already reacted → remove reaction; else open picker
  const handleBtnClick = () => {
    if (myRx) {
      handle(myRx); // un-react
    } else {
      setPickerOpen((v) => !v);
    }
  };

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => setPickerOpen(true), 350);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
  };

  const total = reactions.reduce((s, r) => s + (r.count ?? 0), 0);

  return (
    <div className="cm-acts">
      <div
        className="cm-rx-wrap"
        ref={wrapRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`cm-rx-btn ${myRx ? "liked" : ""}`}
          disabled={busy}
          onClick={handleBtnClick}
          title={
            myRx
              ? "Click to remove reaction · Hold to change"
              : "Click or hold to react"
          }
        >
          {myRx ? (RX_EMOJI[myRx] ?? "👍") : "👍"}
          {total > 0 && <span style={{ fontSize: 10 }}>{total}</span>}
        </button>
        <div className={`cm-rx-pick ${pickerOpen ? "visible" : ""}`}>
          {RX_TYPES.map((r) => (
            <button
              key={r.type}
              className="cm-rx-e"
              title={r.label}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handle(r.type);
              }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </div>
      {/* Reaction chips — clicking removes if it's your reaction, adds otherwise */}
      {reactions
        .filter((r) => r.count > 0)
        .map((r) => (
          <span
            key={r.name}
            className={`cm-rx-chip ${myRx === r.name ? "mine" : ""}`}
            onClick={() => handle(r.name)}
            title={myRx === r.name ? "Remove reaction" : `React with ${r.name}`}
          >
            {RX_EMOJI[r.name] ?? r.emoji} {r.count}
          </span>
        ))}
    </div>
  );
}

/* ─── URL Helpers ─────────────────────────────────────────────────────────────── */
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:1008/Learnex";

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return BACKEND_URL + url;
}

/* ─── Default Anonymous Avatar ───────────────────────────────────────────────── */
const DEFAULT_AVATAR_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23d1d5db" width="100" height="100"/%3E%3Ccircle cx="50" cy="30" r="15" fill="%239ca3af"/%3E%3Cellipse cx="50" cy="65" rx="20" ry="25" fill="%239ca3af"/%3E%3C/svg%3E';

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return DEFAULT_AVATAR_URL;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://"))
    return avatarUrl;
  return BACKEND_URL + avatarUrl;
}

function CardAttachmentGrid({ attachments }) {
  const [lightbox, setLightbox] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  const images = attachments
    .filter((a) => a.type === "image" || a.mimeType?.startsWith("image/"))
    .filter((img) => !failedImages.has(img.id || img.url));

  if (images.length === 0) return null;
  const n = Math.min(images.length, 4);

  const handleImageError = (imgId) => {
    setFailedImages((prev) => new Set([...prev, imgId]));
  };

  return (
    <>
      <div className="card-media">
        <div className={`cm-grid n${n}`}>
          {images.slice(0, 4).map((img, i) => (
            <img
              key={img.id ?? i}
              className="cm-att"
              src={getImageUrl(img.url)}
              alt=""
              onError={() => handleImageError(img.id || img.url)}
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(i);
              }}
            />
          ))}
        </div>
      </div>
      {lightbox !== null && (
        <Lightbox
          images={images}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
          getImageUrl={getImageUrl}
        />
      )}
    </>
  );
}

/* ─── PostCard ───────────────────────────────────────────────────────────── */
function PostCard({
  post: initPost,
  currentUserId,
  currentUserIni,
  onDelete,
  showCopyToast,
}) {
  const navigate = useNavigate();
  const longPressTimer = useRef(null);
  const [post, setPost] = useState(initPost);
  const [myRx, setMyRx] = useState(initPost.myReaction ?? null);
  const [showCm, setShowCm] = useState(false);
  const [comments, setComments] = useState([]);
  const [cmLoaded, setCmLoaded] = useState(false);
  const [cmLoading, setCmLoading] = useState(false);
  const [cmTxt, setCmTxt] = useState("");
  const [cmSending, setCmSending] = useState(false);
  const [rxLoading, setRxLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRxDetail, setShowRxDetail] = useState(false);
  // Reaction picker state — JS controlled, not CSS :hover
  const [rxPickerOpen, setRxPickerOpen] = useState(false);
  const hoverTimerRef = useRef(null);
  const pickerRef = useRef(null);
  const menuRef = useRef(null);
  const cmRef = useRef(null);

  const isOwn = post.authorId === currentUserId;

  // Close options menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close reaction picker on outside click
  useEffect(() => {
    if (!rxPickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setRxPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [rxPickerOpen]);

  const reactions = Array.isArray(post.reactions) ? post.reactions : [];
  const totalRx = reactions.reduce((s, r) => s + (r.count ?? 0), 0);
  const topRx = [...reactions]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 3);
  const authorIni = getInitials(post.authorDisplayName, post.authorEmail);
  const { bg, c } = avatarStyle(post.authorId);
  const commentCount = post.commentCount ?? 0;
  const tags = post.hashtags?.map((h) => `#${h}`) ?? extractTags(post.content);
  const attachments = post.attachments ?? [];

  const loadComments = useCallback(async () => {
    if (cmLoading || cmLoaded) return;
    setCmLoading(true);
    try {
      const res = await commentService.getComments(post.id);
      const data = res?.data ?? res;
      setComments(Array.isArray(data) ? data : []);
      setCmLoaded(true);
    } catch {
      /* keep empty */
    } finally {
      setCmLoading(false);
    }
  }, [post.id, cmLoading, cmLoaded]);

  const toggleComments = (e) => {
    if (e) e.stopPropagation();
    const next = !showCm;
    setShowCm(next);
    if (next) {
      loadComments();
      setTimeout(() => cmRef.current?.focus(), 150);
    }
  };

  const handleCardClick = (e) => {
    const tag = e.target.tagName;
    if (["BUTTON", "INPUT", "TEXTAREA", "A"].includes(tag)) return;
    if (e.target.closest(".c-more-wrap")) return;
    if (e.target.closest(".comments")) return;
    if (e.target.closest(".rx-pick")) return;
    if (e.target.closest(".rx-trigger")) return;
    if (e.target.closest(".card-media")) return; // lightbox handles its own click
    if (e.target.closest(".card-tags")) return;
    navigate(`/post/${post.id}`);
  };

  // Hover on reaction trigger area → show picker after delay
  const handleRxMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => setRxPickerOpen(true), 350);
  };
  const handleRxMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    // Don't close if mouse moved to picker itself
  };

  // Click the Like button itself: toggle current reaction (or like if none)
  const handleReactClick = async (e) => {
    e.stopPropagation();
    clearTimeout(hoverTimerRef.current);
    setRxPickerOpen(false);
    if (rxLoading) return;
    setRxLoading(true);
    try {
      let updatedReactions;
      if (myRx) {
        const res = await postService.removePostReaction(post.id);
        updatedReactions = res?.data ?? res;
        setMyRx(null);
      } else {
        const res = await postService.reactToPost(post.id, "like");
        updatedReactions = res?.data ?? res;
        setMyRx("like");
      }
      if (Array.isArray(updatedReactions))
        setPost((p) => ({ ...p, reactions: updatedReactions }));
    } catch {
      /* no-op */
    } finally {
      setRxLoading(false);
    }
  };

  // Pick a specific reaction from picker
  const handlePickReact = async (type, e) => {
    e.stopPropagation();
    e.preventDefault();
    setRxPickerOpen(false);
    if (rxLoading) return;
    setRxLoading(true);
    try {
      let updatedReactions;
      if (myRx === type) {
        const res = await postService.removePostReaction(post.id);
        updatedReactions = res?.data ?? res;
        setMyRx(null);
      } else {
        const res = await postService.reactToPost(post.id, type);
        updatedReactions = res?.data ?? res;
        setMyRx(type);
      }
      if (Array.isArray(updatedReactions))
        setPost((p) => ({ ...p, reactions: updatedReactions }));
    } catch {
      /* no-op */
    } finally {
      setRxLoading(false);
    }
  };

  const sendComment = async (e) => {
    if (e) e.stopPropagation();
    if (!cmTxt.trim() || cmSending) return;
    setCmSending(true);
    const text = cmTxt.trim();
    setCmTxt("");
    try {
      const res = await commentService.createComment(post.id, text);
      const saved = res?.data ?? res;
      setComments((prev) => [...prev, saved]);
      setPost((p) => ({ ...p, commentCount: (p.commentCount ?? 0) + 1 }));
    } catch {
      setCmTxt(text);
    } finally {
      setCmSending(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm(t('feed.deleteConfirm'))) return;
    try {
      await postService.deletePost(post.id);
      onDelete(post.id);
    } catch (e) {
      alert(e?.response?.data?.message || t('feed.couldNotDelete'));
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "/Learnex";
    const url = `${window.location.origin}${base}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showCopyToast();
  };

  return (
    <>
      <div className="card" onClick={handleCardClick}>
        {/* Author row */}
        <div className="card-head">
          <div
            className="c-ava"
            style={{
              background: post.authorAvatarUrl
                ? "transparent"
                : `linear-gradient(135deg,${bg},${c})`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.authorId}`);
            }}
          >
            {post.authorAvatarUrl ? (
              <img
                src={post.authorAvatarUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              authorIni
            )}
          </div>
          <div className="c-meta">
            <div
              className="c-name"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${post.authorId}`);
              }}
            >
              {post.authorDisplayName || post.authorEmail || "Unknown"}
            </div>
            <div className="c-sub">
              {post.authorHeadline && (
                <>
                  <span>{post.authorHeadline}</span>
                  <span className="c-dot">·</span>
                </>
              )}
              <span>{timeAgo(post.createdAt)}</span>
              {post.visibility && post.visibility !== "public" && (
                <>
                  <span className="c-dot">·</span>
                  <span>
                    {post.visibility === "private"
                      ? "🔒 Only me"
                      : "🔗 Connections"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="c-more-wrap" ref={menuRef}>
            <button
              className="c-more"
              title="Options"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="c-more-menu">
                {isOwn ? (
                  <button className="c-menu-item danger" onClick={handleDelete}>
                    🗑 {t('feed.deletePost')}
                  </button>
                ) : (
                  <>
                    <button
                      className="c-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      🚫 {t('feed.notInterested')}
                    </button>
                    <div className="c-menu-divider" />
                    <button
                      className="c-menu-item danger"
                      onClick={() => {
                        setMenuOpen(false);
                        alert(t('feed.reportSubmitted'));
                      }}
                    >
                      ⚑ {t('feed.reportPost')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {post.content && (
          <div className="card-body">{renderText(post.content)}</div>
        )}

        {attachments.length > 0 && (
          <CardAttachmentGrid attachments={attachments} />
        )}

        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map((t) => (
              <span
                key={t}
                className="tag-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/hashtag/${t.slice(1)}`);
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        {(totalRx > 0 || commentCount > 0) && (
          <div className="card-stats">
            <div
              className="stat-rx"
              onClick={(e) => {
                e.stopPropagation();
                if (totalRx > 0) setShowRxDetail(true);
              }}
            >
              {topRx.map((r) => (
                <span key={r.name ?? r.type} className="stat-em">
                  {RX_EMOJI[r.name ?? r.type] ?? "👍"}
                </span>
              ))}
              {totalRx > 0 && <span className="stat-n">{totalRx}</span>}
            </div>
            <div className="stat-right">
              {commentCount > 0 && (
                <span className="stat-link" onClick={(e) => toggleComments(e)}>
                  {commentCount} comment{commentCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="card-actions">
          {/* Like button with JS-controlled hover picker */}
          <div
            className="rx-trigger"
            ref={pickerRef}
            onMouseEnter={handleRxMouseEnter}
            onMouseLeave={handleRxMouseLeave}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <button
              className={`ca-btn ${myRx ? "liked" : ""}`}
              onClick={handleReactClick}
              disabled={rxLoading}
              onTouchStart={(e) => {
                longPressTimer.current = setTimeout(() => {
                  setRxPickerOpen(true);
                }, 500);
              }}
              onTouchEnd={() => {
                clearTimeout(longPressTimer.current);
              }}
              onTouchMove={() => {
                clearTimeout(longPressTimer.current);
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {myRx ? (RX_EMOJI[myRx] ?? "👍") : "👍"}
              </span>
              {myRx
                ? (RX_TYPES.find((r) => r.type === myRx)?.label ?? "Liked")
                : "Like"}
            </button>
            <div className={`rx-pick ${rxPickerOpen ? "visible" : ""}`}>
              {RX_TYPES.map((r) => (
                <button
                  key={r.type}
                  className="rx-e"
                  data-label={r.label}
                  onMouseDown={(e) => handlePickReact(r.type, e)}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>

          <button className="ca" onClick={(e) => toggleComments(e)}>
            <span className="ca-i">💬</span>{t('feed.commentBtn')}
          </button>

          <button className="ca" onClick={handleShare}>
            <span className="ca-i">🔗</span>{t('feed.shareBtn')}
          </button>

          <button
            className={`ca ${post.saved ? "saved" : ""}`}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (post.saved) {
                  await postService.unsavePost(post.id);
                  setPost((p) => ({ ...p, saved: false }));
                } else {
                  await postService.savePost(post.id);
                  setPost((p) => ({ ...p, saved: true }));
                }
              } catch {
                /* no-op */
              }
            }}
          >
            <span className="ca-i">{post.saved ? "🔖" : "🏷"}</span>
            {post.saved ? t('feed.savedBtn') : t('feed.saveBtn')}
          </button>
        </div>

        {/* Comments */}
        {showCm && (
          <div className="comments" onClick={(e) => e.stopPropagation()}>
            {cmLoading ? (
              <div style={{ padding: "14px 18px" }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 8, marginBottom: 8 }}
                  >
                    <div
                      className="sk"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="sk"
                      style={{ height: 44, flex: 1, borderRadius: 8 }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="cm-scroll">
                {comments.length === 0 ? (
                  <div className="cm-empty">
                    No comments yet — be the first.
                  </div>
                ) : (
                  comments.map((cm) => (
                    <CommentItem
                      key={cm.id}
                      comment={cm}
                      currentUserIni={currentUserIni}
                    />
                  ))
                )}
              </div>
            )}
            <div className="cm-input-row">
              <div className="cm-av" style={{ background: "var(--grad-fire)" }}>
                {currentUserIni}
              </div>
              <input
                ref={cmRef}
                className="cm-inp"
                placeholder="Write a comment…"
                value={cmTxt}
                onChange={(e) => setCmTxt(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendComment(e)
                }
              />
              <button
                className="cm-go"
                onClick={(e) => sendComment(e)}
                disabled={!cmTxt.trim() || cmSending}
                title={cmSending ? "Sending…" : "Send comment"}
              >
                {cmSending ? (
                  <span
                    style={{
                      fontSize: 10,
                      animation: "lx-pulse 1s ease infinite",
                    }}
                  >
                    ⏳
                  </span>
                ) : (
                  "➤"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reaction detail modal */}
      {showRxDetail && (
        <ReactionDetailsModal
          postId={post.id}
          reactions={reactions}
          onClose={() => setShowRxDetail(false)}
        />
      )}
    </>
  );
}

/* ─── CommentItem ────────────────────────────────────────────────────────── */
function CommentItem({ comment, currentUserIni }) {
  const authorIni = getInitials(comment.authorDisplayName, comment.authorEmail);
  const { bg, c } = avatarStyle(comment.authorId?.toString());
  return (
    <div className="cmi">
      <div
        className="cm-av"
        style={{ background: `linear-gradient(135deg,${bg},${c})` }}
      >
        {authorIni}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cm-bub">
          <div className="cm-who">
            {comment.authorDisplayName || comment.authorEmail || "User"}
            <span className="cm-when">{timeAgo(comment.createdAt)}</span>
          </div>
          <div className="cm-txt">{comment.content}</div>
        </div>
        <CommentReactions
          commentId={comment.id}
          reactions={comment.reactions ?? []}
          myReaction={comment.myReaction ?? null}
        />
        {comment.replies?.length > 0 && (
          <div className="cm-replies">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                currentUserIni={currentUserIni}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PostSkeleton ───────────────────────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="skel">
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          className="sk"
          style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div
            className="sk"
            style={{
              height: 13,
              width: "38%",
              marginBottom: 8,
              borderRadius: 5,
            }}
          />
          <div
            className="sk"
            style={{ height: 10, width: "22%", borderRadius: 5 }}
          />
        </div>
      </div>
      <div
        className="sk"
        style={{ height: 13, width: "100%", marginBottom: 7, borderRadius: 5 }}
      />
      <div
        className="sk"
        style={{ height: 13, width: "85%", marginBottom: 7, borderRadius: 5 }}
      />
      <div
        className="sk"
        style={{ height: 13, width: "60%", borderRadius: 5 }}
      />
    </div>
  );
}

/* ─── RightPanel ─────────────────────────────────────────────────────────── */
function RightPanel({ followed, onToggleFollow }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.userId ?? user?.id;
  const [suggestions, setSuggestions] = useState([]);

  // FINAL VERSION
  useEffect(() => {
    import("../services/userService").then(({ default: us }) => {
      us.getSuggestions()
        .catch(() => null)
        .then((res) => {
          if (!res) return;
          const data = res?.data ?? res;
          const users = Array.isArray(data) ? data : [];
          setSuggestions(
            users.filter((u) => (u.userId ?? u.id) !== uid).slice(0, 3),
          );
        });
    });
  }, [uid]);

  return (
    <>
      <TrendingHashtagWidget />

      <div className="wg">
        <div className="wg-head">
          <div className="wg-title">✦ Suggested</div>
          <button className="wg-more">See all</button>
        </div>
        {suggestions.length === 0 ? (
          <div
            style={{
              padding: "16px",
              fontSize: 12,
              color: "var(--t3)",
              fontFamily: "var(--fm)",
              lineHeight: 1.7,
            }}
          >
            Discover students by searching or exploring posts.
          </div>
        ) : (
          suggestions.map((s) => {
            const id = s.userId ?? s.id;
            const ini = getInitials(s.displayName, s.email);
            const { bg, c } = avatarStyle(id);
            return (
              <div key={id} className="wf-item">
                <div
                  className="wf-av"
                  style={{
                    background: s.avatarUrl
                      ? "transparent"
                      : `linear-gradient(135deg,${bg},${c})`,
                    color: c,
                    overflow: "hidden",
                  }}
                  onClick={() => navigate(`/profile/${id}`)}
                >
                  {s.avatarUrl ? (
                    <img
                      src={s.avatarUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    ini
                  )}
                </div>
                <div
                  className="wf-info"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${id}`)}
                >
                  <div className="wf-name">
                    {s.displayName || s.email?.split("@")[0]}
                  </div>
                  <div className="wf-role" title={s.email}>
                    {truncateEmail(s.email)}
                  </div>
                </div>
                <button
                  className={`fw-btn ${followed[id] ? "ing" : ""}`}
                  onClick={() => onToggleFollow(id)}
                >
                  {followed[id] ? t('feed.followingBtn') : t('feed.followBtn')}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          fontSize: 9,
          color: "var(--t4)",
          lineHeight: 1.8,
          padding: "0 4px",
          fontFamily: "var(--fm)",
        }}
      >
        Learnex · Terms · Privacy
        <br />© 2026 Learnex Inc.
      </div>
    </>
  );
}

/* ─── FeedPage ───────────────────────────────────────────────────────────── */
export default function FeedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Localized constants
  const RX_TYPES = RX_TYPES_BASE.map(rx => ({ ...rx, label: t(rx.labelKey) }));
  const SORT_OPTIONS = SORT_OPTIONS_BASE.map(opt => ({ ...opt, label: `${opt.key === "latest" ? "🕐" : opt.key.includes("day") ? "🔥" : opt.key.includes("month") ? "📅" : "🗓"} ${t(opt.labelKey)}`, sort: opt.sort, window: opt.window }));

  const uid = user?.userId ?? user?.id;
  const userIni = getInitials(user?.displayName, user?.email);
  const userName = user?.displayName || user?.email?.split("@")[0] || "Student";

  const [tab, setTab] = useState("discover");
  const [sortKey, setSortKey] = useState("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postErr, setPostErr] = useState("");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followed, setFollowed] = useState({});
  // Reset to 'public' after each post — visibility is per-post
  const [visibility, setVisibility] = useState("public");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [copyToast, setCopyToast] = useState(false);
  const fileInputRef = useRef(null);
  const sortRef = useRef(null);
  const pageRef = useRef(0);

  const showCopyToast = useCallback(() => {
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  }, []);

  // Close sort menu on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const h = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sortOpen]);

  const handleToggleFollow = async (targetId) => {
    const isNowFollowing = !followed[targetId];
    setFollowed((f) => ({ ...f, [targetId]: isNowFollowing }));
    try {
      const { default: us } = await import("../services/userService");
      isNowFollowing ? await us.follow(targetId) : await us.unfollow(targetId);
    } catch {
      setFollowed((f) => ({ ...f, [targetId]: !isNowFollowing }));
    }
  };

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const slots = 4 - mediaFiles.length;
    const toAdd = selected.slice(0, slots);
    const newEntries = toAdd.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      id: null,
      uploading: true,
      error: null,
    }));
    setMediaFiles((prev) => [...prev, ...newEntries]);
    for (let i = 0; i < toAdd.length; i++) {
      const idx = mediaFiles.length + i;
      try {
        const res = await postService.uploadMedia(toAdd[i]);
        const data = res?.data ?? res;
        setMediaFiles((prev) =>
          prev.map((m, j) =>
            j === idx ? { ...m, id: data.id, uploading: false } : m,
          ),
        );
      } catch {
        setMediaFiles((prev) =>
          prev.map((m, j) =>
            j === idx
              ? {
                  ...m,
                  uploading: false,
                  error: "Upload failed — click × to remove and try again",
                }
              : m,
          ),
        );
      }
    }
    e.target.value = "";
  };

  const removeMedia = (idx) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].previewUrl);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const loadFeed = useCallback(
    async (reset = true) => {
      if (!uid) return;
      reset ? setLoading(true) : setLoadingMore(true);
      setPostErr("");
      try {
        const p = reset ? 0 : pageRef.current;
        const opt =
          SORT_OPTIONS.find((s) => s.key === sortKey) ?? SORT_OPTIONS[0];
        const params = { page: p, size: 20, sort: opt.sort ?? "latest" };
        if (opt.window) params.window = opt.window;

        const res =
          tab === "following"
            ? await postService.getFeed(
                params.page,
                params.size,
                params.sort,
                params.window,
              )
            : await postService.getDiscover(
                params.page,
                params.size,
                params.sort,
                params.window,
              );

        const data = res?.data ?? res;
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        if (reset) {
          setPosts(items);
          pageRef.current = 1;
        } else {
          setPosts((prev) => [...prev, ...items]);
          pageRef.current += 1;
        }
        setHasNext(data?.hasNext ?? data?.last === false);
      } catch {
        if (reset) setPostErr("Could not load posts. Check your connection.");
      } finally {
        reset ? setLoading(false) : setLoadingMore(false);
      }
    },
    [uid, tab, sortKey],
  );

  useEffect(() => {
    loadFeed(true);
  }, [uid, tab, sortKey]);

  const submitPost = async () => {
    const hasContent = draft.trim().length > 0;
    const hasMedia = mediaFiles.some((m) => m.id);
    if ((!hasContent && !hasMedia) || posting) return;
    if (mediaFiles.some((m) => m.uploading)) {
      setPostErr("Please wait for uploads to finish.");
      return;
    }
    setPosting(true);
    setPostErr("");
    try {
      const mediaIds = mediaFiles.filter((m) => m.id).map((m) => m.id);
      const res = await postService.createPost({
        content: draft.trim() || null,
        visibility,
        mediaIds,
      });
      const saved = res?.data ?? res;
      setPosts((prev) => [saved, ...prev]);
      setDraft("");
      setMediaFiles([]);
      setVisibility("public"); // ← always reset to public after posting
    } catch (err) {
      setPostErr(err?.response?.data?.message || "Failed to post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (postId) =>
    setPosts((prev) => prev.filter((p) => p.id !== postId));

  const cycleVisibility = () => {
    const opts = ["public", "connections", "private"];
    setVisibility((v) => opts[(opts.indexOf(v) + 1) % opts.length]);
  };
  const visLabel = {
    public: `🌍 ${t('feed.visPublic')}`,
    connections: `🔗 ${t('feed.visConnections')}`,
    private: `🔒 ${t('feed.visPrivate')}`,
  };

  return (
    <>
      <style>{css}</style>
      <Layout
        active="feed"
        rightPanel={
          <RightPanel followed={followed} onToggleFollow={handleToggleFollow} />
        }
      >
        <main className="feed">
          {/* Tabs + Sort */}
          <div className="feed-header">
            <button
              className={`ftab ${tab === "discover" ? "on" : ""}`}
              onClick={() => setTab("discover")}
            >
              Discover
            </button>
            <button
              className={`ftab ${tab === "following" ? "on" : ""}`}
              onClick={() => setTab("following")}
            >
              Following
            </button>
            <div className="fh-gap" />
            <div className="sort-wrap" ref={sortRef}>
              <button
                className="fh-sort"
                onClick={() => setSortOpen((v) => !v)}
              >
                ⇅{" "}
                {SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "Latest"}
              </button>
              {sortOpen && (
                <div className="sort-menu">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className={`sort-item ${sortKey === opt.key ? "active" : ""}`}
                      onClick={() => {
                        setSortKey(opt.key);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compose */}
          <div className="compose">
            <div className="c-top">
              <div className="c-av">{userIni}</div>
              <textarea
                className="c-input"
                placeholder={t('feed.whatsOnMind', { name: userName.split(" ")[0] })}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={draft.length > 80 ? 3 : 1}
                onKeyDown={(e) =>
                  e.key === "Enter" && e.ctrlKey && submitPost()
                }
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className="c-previews">
                {mediaFiles.map((m, i) => (
                  <div key={i} className="c-prev-item">
                    <img className="c-prev-img" src={m.previewUrl} alt="" />
                    {m.uploading && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div className="c-up-dot" />
                      </div>
                    )}
                    {m.error && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(232,25,44,.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "#fff",
                        }}
                      >
                        ✕
                      </div>
                    )}
                    <button
                      className="c-prev-rm"
                      onClick={() => removeMedia(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="c-toolbar">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,application/pdf"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button
                className={`c-tool ${mediaFiles.length > 0 ? "active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= 4}
              >
                📷 {mediaFiles.length > 0 ? `${mediaFiles.length}/4` : t('feed.photo')}
              </button>
              <button className="c-vis" onClick={cycleVisibility}>
                {visLabel[visibility]}
              </button>
              {draft.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color:
                      draft.length > 900
                        ? "var(--red)"
                        : draft.length > 700
                          ? "#EF9F27"
                          : "var(--t4)",
                    fontFamily: "var(--fm)",
                    marginRight: 4,
                    transition: "color .2s",
                  }}
                >
                  {draft.length}/1000
                </span>
              )}
              <div className="c-gap" />
              {(draft.length > 0 || mediaFiles.length > 0) && (
                <span className="c-hint">Ctrl+Enter</span>
              )}
              {(draft.length > 0 || mediaFiles.length > 0) && (
                <button
                  className="c-post"
                  onClick={submitPost}
                  disabled={
                    posting ||
                    mediaFiles.some((m) => m.uploading) ||
                    (!draft.trim() && !mediaFiles.some((m) => m.id))
                  }
                >
                  {posting ? t('feed.posting') : t('feed.postBtn')}
                </button>
              )}
            </div>
          </div>

          {postErr && <div className="post-err">⚠ {postErr}</div>}

          {/* Posts */}
          {loading ? (
            [1, 2, 3].map((i) => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="lx-empty">
              <div className="lx-empty-ic">
                {tab === "following" ? "👥" : "📭"}
              </div>
              <div className="lx-empty-t">
                {tab === "following" ? t('feed.noPostsFollowing') : t('feed.noPostsDiscover')}
              </div>
              <p className="lx-empty-s">
                {tab === "following"
                  ? t('feed.noPostsFollowingDesc')
                  : t('feed.noPostsDiscoverDesc')}
              </p>
              {tab === "following" && (
                <button
                  onClick={() => setTab("discover")}
                  style={{
                    marginTop: 16,
                    padding: "10px 24px",
                    background: "var(--grad-fire)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "var(--fb)",
                    letterSpacing: ".5px",
                    cursor: "pointer",
                    boxShadow: "0 3px 14px var(--red-glow)",
                  }}
                >
                  Discover Students →
                </button>
              )}
            </div>
          ) : (
            <>
              {posts.map((p, i) => (
                <div
                  key={p.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <PostCard
                    post={p}
                    currentUserId={uid}
                    currentUserIni={userIni}
                    onDelete={handleDelete}
                    showCopyToast={showCopyToast}
                  />
                </div>
              ))}
              {hasNext && (
                <div className="load-more">
                  <button
                    className="lm-btn"
                    onClick={() => loadFeed(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load more posts"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </Layout>

      {/* Global copy-link toast */}
      {copyToast && (
        <div className="copy-toast">🔗 Link copied to clipboard!</div>
      )}
    </>
  );
}