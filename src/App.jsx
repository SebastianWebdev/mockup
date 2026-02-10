import { useState, useCallback, useMemo, useRef, useEffect } from "react";

const PLATFORMS = ["Google", "Facebook", "TikTok", "AppLovin"];
const STATUSES = ["uploaded", "uploading", "not_uploaded", "upload_error", "removing", "partially_deleted", "delete_error", "skipped"];

const ACCOUNT_NAMES = {
  Google: ["Google - US Main", "Google - EU Brand", "Google - APAC Perf"],
  Facebook: ["FB - US Broad", "FB - EU Lookalike"],
  TikTok: ["TikTok - US Spark", "TikTok - UK TopView", "TikTok - DE Reach"],
  AppLovin: ["AppLovin - US iOS", "AppLovin - Global Android"],
};

const STATUS_CONFIG = {
  uploaded: { label: "Uploaded", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: "✓" },
  uploading: { label: "Uploading", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "◌" },
  not_uploaded: { label: "Not Uploaded", color: "#6b6b6b", bg: "rgba(107,107,107,0.08)", icon: "○" },
  upload_error: { label: "Upload Error", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "✕" },
  removing: { label: "Removing", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "↻" },
  partially_deleted: { label: "Partially Deleted", color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: "⚠" },
  delete_error: { label: "Delete Error", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "✕" },
  skipped: { label: "Skipped", color: "#6b6b6b", bg: "rgba(107,107,107,0.10)", icon: "–" },
};

const SKIP_REASONS = [
  "Invalid resolution for {platform}",
  "Unsupported aspect ratio for {platform}",
  "Video too long for {platform} (max 60s)",
  "Codec not supported by {platform}",
  "File size exceeds {platform} limit",
];

const APPS = [
  { id: 1, name: "Dragon Quest Legends" },
  { id: 2, name: "Puzzle Mania" },
  { id: 3, name: "Tower Defense Pro" },
  { id: 4, name: "Space Raiders" },
];

const LANGUAGES = ["en", "de", "es", "fr", "ja", "ko", "pt", "it", "zh", "ru"];
const RESOLUTIONS = [
  { w: 1080, h: 1920, ratio: "9:16" },
  { w: 1920, h: 1080, ratio: "16:9" },
  { w: 1080, h: 1080, ratio: "1:1" },
  { w: 1080, h: 1350, ratio: "4:5" },
];
const DURATIONS = ["15s", "30s", "45s", "60s"];

function pickStatus(messy) {
  const w = messy
    ? [0.30, 0.08, 0.08, 0.20, 0.06, 0.06, 0.06, 0.16]
    : [0.75, 0.08, 0.06, 0.03, 0.02, 0.01, 0.01, 0.04];
  const r = Math.random();
  let c = 0;
  for (let i = 0; i < w.length; i++) { c += w[i]; if (r < c) return STATUSES[i]; }
  return STATUSES[0];
}

// --- Pool generation ---

function generateTicketId(index) {
  if (index % 3 === 0) return (20000 + index * 7).toString();
  return Math.random().toString(36).slice(2, 7);
}

function pickCreativeCount(ticketIndex) {
  if (ticketIndex === 0) return 500 + Math.floor(Math.random() * 100);
  if (ticketIndex < 5) return 20 + Math.floor(Math.random() * 30);
  return 1 + Math.floor(Math.random() * 10);
}

function generatePool() {
  const NUM_TICKETS = 100;
  const tickets = [];
  const allCreatives = [];
  let globalId = 1;

  for (let t = 0; t < NUM_TICKETS; t++) {
    const ticketId = generateTicketId(t);
    const count = pickCreativeCount(t);
    const ticketDate = new Date(Date.now() - Math.random() * 60 * 86400000);
    const messy = t % 7 === 0;
    const allUploaded = !messy && t % 3 !== 0;
    const ticketCreatives = [];

    for (let c = 0; c < count; c++) {
      const lang = LANGUAGES[c % LANGUAGES.length];
      const res = RESOLUTIONS[c % RESOLUTIONS.length];
      const dur = DURATIONS[c % DURATIONS.length];
      const filename = `fc_v_${ticketId}_${lang}_${res.w}x${res.h}_${dur}.mp4`;

      const creative = {
        id: globalId++,
        ticketId,
        filename,
        language: lang,
        resolution: `${res.w}x${res.h}`,
        ratio: res.ratio,
        duration: dur,
        width: res.w,
        height: res.h,
        thumbnail: `hsl(${(t * 47 + c * 13 + 200) % 360}, 45%, ${22 + (c % 3) * 5}%)`,
        createdAt: new Date(ticketDate.getTime() - c * 60000),
        createdAtStr: ticketDate.toLocaleDateString("en-GB"),
        status: "ACTIVE",
        campaigns: Math.floor(Math.random() * 8),
        impressions: Math.floor(Math.random() * 150000),
        clicks: Math.floor(Math.random() * 3000),
        platforms: PLATFORMS.map(p => ({
          name: p,
          accounts: ACCOUNT_NAMES[p].map(accName => {
            const status = allUploaded ? "uploaded" : pickStatus(messy);
            return {
              accountName: accName,
              status,
              skipReason: status === "skipped"
                ? SKIP_REASONS[Math.floor(Math.random() * SKIP_REASONS.length)].replace("{platform}", p) + " - " + filename
                : null,
            };
          }),
          link: Math.random() > 0.4
            ? `https://${p.toLowerCase().replace(" ", "")}.com/ads/library/${Math.random().toString(36).slice(2, 10)}`
            : null,
        })),
      };
      ticketCreatives.push(creative);
      allCreatives.push(creative);
    }

    const accountSummary = PLATFORMS.flatMap(pName =>
      ACCOUNT_NAMES[pName].map(accName => {
        const counts = { uploaded: 0, uploading: 0, not_uploaded: 0, errors: 0, skipped: 0, removing: 0, total: 0 };
        ticketCreatives.forEach(cr => {
          const plat = cr.platforms.find(p => p.name === pName);
          if (!plat) return;
          const acc = plat.accounts.find(a => a.accountName === accName);
          if (!acc) return;
          counts.total++;
          if (acc.status === "uploaded") counts.uploaded++;
          else if (acc.status === "uploading") counts.uploading++;
          else if (acc.status === "not_uploaded") counts.not_uploaded++;
          else if (acc.status === "skipped") counts.skipped++;
          else if (acc.status === "removing") counts.removing++;
          else counts.errors++;
        });
        return { platform: pName, accountName: accName, ...counts };
      })
    );

    const platformSummary = PLATFORMS.map(pName => {
      let uploaded = 0, total = 0, errors = 0;
      ticketCreatives.forEach(cr => {
        const plat = cr.platforms.find(p => p.name === pName);
        if (!plat) return;
        plat.accounts.forEach(a => {
          total++;
          if (a.status === "uploaded") uploaded++;
          if (["upload_error", "delete_error", "partially_deleted"].includes(a.status)) errors++;
        });
      });
      return { name: pName, uploaded, total, errors };
    });

    const totalUploaded = platformSummary.reduce((s, p) => s + p.uploaded, 0);
    const totalAccounts = platformSummary.reduce((s, p) => s + p.total, 0);
    const totalErrors = platformSummary.reduce((s, p) => s + p.errors, 0);
    const totalUploading = accountSummary.reduce((s, a) => s + a.uploading, 0);
    const totalNotUploaded = accountSummary.reduce((s, a) => s + a.not_uploaded, 0);
    const totalSkipped = accountSummary.reduce((s, a) => s + a.skipped, 0);
    const totalRemoving = accountSummary.reduce((s, a) => s + a.removing, 0);

    tickets.push({
      ticketId,
      creativeCount: count,
      thumbnails: ticketCreatives.slice(0, 4).map(c => c.thumbnail),
      languages: [...new Set(ticketCreatives.map(c => c.language))],
      resolutions: [...new Set(ticketCreatives.map(c => c.resolution))],
      durations: [...new Set(ticketCreatives.map(c => c.duration))],
      latestCreatedAt: ticketCreatives[0].createdAt,
      latestCreatedAtStr: ticketCreatives[0].createdAtStr,
      accountSummary,
      platformSummary,
      totalUploaded,
      totalAccounts,
      totalErrors,
      totalUploading,
      totalNotUploaded,
      totalSkipped,
      totalRemoving,
      progressPercent: totalAccounts > 0 ? Math.round((totalUploaded / totalAccounts) * 100) : 0,
    });
  }

  return { tickets, creatives: allCreatives };
}

let cachedPool = null;
let cachedAppId = null;

function getPool(appId) {
  if (cachedPool && cachedAppId === appId) return cachedPool;
  cachedPool = generatePool();
  cachedAppId = appId;
  return cachedPool;
}

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString());
function getAllAccounts(c) { return c.platforms.flatMap(p => p.accounts); }

// --- Components ---

function AccountRow({ account, onRetry, onCancel }) {
  const cfg = STATUS_CONFIG[account.status];
  const [showReason, setShowReason] = useState(false);
  const isError = ["upload_error", "delete_error", "partially_deleted"].includes(account.status);
  const isGrey = account.status === "skipped" || account.status === "not_uploaded";

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 8px",
        borderRadius: account.status === "skipped" && showReason ? "6px 6px 0 0" : 6,
        background: cfg.bg, border: `1px solid ${cfg.color}18`,
        fontSize: 11, gap: 6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflow: "hidden" }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: cfg.color, color: "#fff", fontSize: 8, fontWeight: 700,
          }}>{cfg.icon}</span>
          <span style={{
            color: isGrey ? "#777" : "#ccc", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{account.accountName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ color: cfg.color, fontWeight: 600, fontSize: 10, opacity: 0.9 }}>{cfg.label}</span>
          {isError && (
            <button onClick={onRetry} style={{
              background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.35)",
              color: "#fca5a5", borderRadius: 4, padding: "1px 6px", fontSize: 10,
              cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
            }}>Retry</button>
          )}
          {account.status === "removing" && (
            <button onClick={onCancel} style={{
              background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)",
              color: "#c4b5fd", borderRadius: 4, padding: "1px 6px", fontSize: 10,
              cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
            }}>Cancel</button>
          )}
          {account.status === "skipped" && account.skipReason && (
            <button onClick={() => setShowReason(!showReason)} style={{
              background: "rgba(107,107,107,0.15)", border: "1px solid rgba(107,107,107,0.2)",
              color: "#888", borderRadius: 4, padding: "1px 6px", fontSize: 10,
              cursor: "pointer", fontWeight: 500, fontFamily: "inherit",
            }}>{showReason ? "Hide" : "Why?"}</button>
          )}
        </div>
      </div>
      {account.status === "skipped" && account.skipReason && (
        <div style={{
          maxHeight: showReason ? 50 : 0, overflow: "hidden",
          transition: "max-height 0.2s ease", opacity: showReason ? 1 : 0,
        }}>
          <div style={{
            background: "rgba(107,107,107,0.05)", borderRadius: "0 0 6px 6px",
            border: "1px solid rgba(107,107,107,0.1)", borderTop: "none",
            padding: "3px 8px", fontSize: 9, color: "#666",
            fontStyle: "italic", wordBreak: "break-word",
          }}>{account.skipReason}</div>
        </div>
      )}
    </div>
  );
}

function PlatformSection({ platform, onRetryAccount, onCancelAccount }) {
  const [open, setOpen] = useState(false);
  const total = platform.accounts.length;
  const uploaded = platform.accounts.filter(a => a.status === "uploaded").length;
  const errors = platform.accounts.filter(a => ["upload_error", "delete_error", "partially_deleted"].includes(a.status)).length;
  const skipped = platform.accounts.filter(a => a.status === "skipped").length;

  const color = errors > 0 ? "#ef4444"
    : uploaded + skipped === total ? "#22c55e"
    : "#f59e0b";

  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: open ? "8px 8px 0 0" : 8,
        padding: "7px 10px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "inherit", transition: "all 0.15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 9, color: "rgba(255,255,255,0.4)", transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block",
          }}>▶</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>{platform.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color,
            background: color + "18", padding: "1px 6px", borderRadius: 4,
          }}>{uploaded}/{total}</span>
          {errors > 0 && <span style={{ fontSize: 10, color: "#fca5a5", fontWeight: 500 }}>{errors} err</span>}
          {skipped > 0 && <span style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>{skipped} skip</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {platform.link && (
            <a href={platform.link} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 10, color: "#7ba8d4", textDecoration: "none",
                fontWeight: 500, display: "flex", alignItems: "center", gap: 3,
                padding: "1px 6px", borderRadius: 4,
                background: "rgba(123,168,212,0.1)", border: "1px solid rgba(123,168,212,0.15)",
              }}>
              <span style={{ fontSize: 11 }}>↗</span> Link
            </a>
          )}
        </div>
      </button>
      <div style={{
        maxHeight: open ? 600 : 0, overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.06)", borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "6px", display: "flex", flexDirection: "column", gap: 4,
        }}>
          {platform.accounts.map((acc, aIdx) => (
            <AccountRow key={acc.accountName} account={acc}
              onRetry={() => onRetryAccount(platform.name, aIdx)}
              onCancel={() => onCancelAccount(platform.name, aIdx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(165deg, #1e1d1b 0%, #252420 100%)",
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(212,190,140,0.25)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,190,140,0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Header: ticket ID, creatives count, date, errors */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{
              margin: 0, fontSize: 18, fontWeight: 700, color: "#e8e6e1",
              letterSpacing: "-0.01em",
            }}>#{ticket.ticketId}</h3>
            <span style={{
              padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
              background: "rgba(212,190,140,0.1)", color: "#d4be8c",
              border: "1px solid rgba(212,190,140,0.15)",
            }}>{ticket.creativeCount.toLocaleString()} file{ticket.creativeCount !== 1 ? "s" : ""}</span>
            {ticket.totalErrors > 0 && (
              <span style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: "rgba(239,68,68,0.15)", color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.2)",
              }}>{ticket.totalErrors} err</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {ticket.latestCreatedAtStr}
          </span>
        </div>

        {/* Platform summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: "auto" }}>
          {ticket.platformSummary.map(p => {
            const pct = p.total > 0 ? (p.uploaded / p.total) * 100 : 0;
            const color = p.errors > 0 ? "#ef4444" : pct === 100 ? "#22c55e" : "#f59e0b";
            return (
              <div key={p.name} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 11, padding: "2px 0",
              }}>
                <span style={{ width: 64, color: "#999", fontWeight: 500, flexShrink: 0, fontSize: 10 }}>{p.name}</span>
                <div style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: "rgba(255,255,255,0.06)", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 2,
                    background: color, transition: "width 0.3s",
                  }} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, color,
                  width: 48, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums",
                }}>{p.uploaded}/{p.total}</span>
                <span style={{ fontSize: 9, color: "#fca5a5", fontWeight: 500, width: 36, flexShrink: 0, textAlign: "right" }}>
                  {p.errors > 0 ? `${p.errors} err` : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Overall progress */}
        <div style={{ marginTop: 4 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
              Overall
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: ticket.totalErrors > 0 ? "#fca5a5"
                : ticket.progressPercent === 100 ? "#22c55e" : "#f59e0b",
            }}>
              {ticket.progressPercent}%
            </span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: "rgba(255,255,255,0.06)", overflow: "hidden",
          }}>
            <div style={{
              width: `${ticket.progressPercent}%`, height: "100%", borderRadius: 3,
              background: ticket.progressPercent === 100
                ? "#22c55e"
                : "linear-gradient(90deg, #22c55e, #f59e0b)",
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketListRow({ ticket, onViewCreatives }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isComplete = ticket.progressPercent === 100;
  const hasErrors = ticket.totalErrors > 0;
  const borderColor = expanded ? "rgba(212,190,140,0.15)" : hovered ? "rgba(212,190,140,0.2)" : hasErrors ? "rgba(239,68,68,0.25)" : isComplete ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)";
  const bgDefault = hasErrors ? "rgba(239,68,68,0.08)" : isComplete ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.015)";
  const bgHover = hasErrors ? "rgba(239,68,68,0.12)" : isComplete ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)";

  // Status pills to show (only non-zero, skip uploaded for non-complete)
  const statusPills = [];
  if (hasErrors) statusPills.push({ label: `${ticket.totalErrors.toLocaleString()} errors`, color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.25)" });
  if (ticket.totalUploading > 0) statusPills.push({ label: `${ticket.totalUploading.toLocaleString()} uploading`, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" });
  if (ticket.totalNotUploaded > 0) statusPills.push({ label: `${ticket.totalNotUploaded.toLocaleString()} queued`, color: "#6b6b6b", bg: "rgba(107,107,107,0.1)", border: "rgba(107,107,107,0.15)" });
  if (ticket.totalSkipped > 0) statusPills.push({ label: `${ticket.totalSkipped.toLocaleString()} skipped`, color: "#6b6b6b", bg: "rgba(107,107,107,0.1)", border: "rgba(107,107,107,0.15)" });
  if (ticket.totalRemoving > 0) statusPills.push({ label: `${ticket.totalRemoving.toLocaleString()} removing`, color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.2)" });

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      border: `1px solid ${borderColor}`,
      transition: "border-color 0.15s",
    }}>
      {/* Compact row */}
      <div
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: expanded || hovered ? bgHover : bgDefault,
          cursor: "pointer",
          transition: "background 0.15s",
          padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        {/* Expand arrow */}
        <span style={{
          fontSize: 9, color: "rgba(255,255,255,0.4)", flexShrink: 0, width: 10,
          transition: "transform 0.2s", display: "inline-block",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        }}>▶</span>

        {/* Ticket ID */}
        <span style={{
          fontSize: 14, fontWeight: 700, color: "#e8e6e1",
          width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>#{ticket.ticketId}</span>

        {/* File count */}
        <span style={{
          padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: "rgba(212,190,140,0.1)", color: "#d4be8c",
          border: "1px solid rgba(212,190,140,0.15)",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>{ticket.creativeCount.toLocaleString()} file{ticket.creativeCount !== 1 ? "s" : ""}</span>

        {/* Status area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {isComplete ? (
            <span style={{
              padding: "2px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: "rgba(34,197,94,0.12)", color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.2)",
              whiteSpace: "nowrap",
            }}>All uploaded</span>
          ) : (
            <>
              {/* Progress bar */}
              <div style={{
                width: 80, height: 4, borderRadius: 2, flexShrink: 0,
                background: "rgba(255,255,255,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${ticket.progressPercent}%`, height: "100%", borderRadius: 2,
                  background: hasErrors
                    ? "linear-gradient(90deg, #22c55e, #ef4444)"
                    : "linear-gradient(90deg, #22c55e, #f59e0b)",
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                color: hasErrors ? "#fca5a5" : "#f59e0b",
                fontVariantNumeric: "tabular-nums",
              }}>{ticket.progressPercent}%</span>

              {/* Status pills */}
              {statusPills.map(s => (
                <span key={s.label} style={{
                  padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600,
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{s.label}</span>
              ))}
            </>
          )}
        </div>

        {/* Date */}
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {ticket.latestCreatedAtStr}
        </span>
      </div>

      {/* Expanded details */}
      <div style={{
        maxHeight: expanded ? 800 : 0, overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "16px 20px 16px 44px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Per-platform per-account breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PLATFORMS.map(pName => {
              const accounts = ticket.accountSummary.filter(a => a.platform === pName);
              return (
                <div key={pName}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "#bbb",
                    marginBottom: 6,
                  }}>{pName}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {accounts.map(acc => {
                      const pct = acc.total > 0 ? (acc.uploaded / acc.total) * 100 : 0;
                      const color = acc.errors > 0 ? "#ef4444" : pct === 100 ? "#22c55e" : "#f59e0b";
                      return (
                        <div key={acc.accountName} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "3px 8px", borderRadius: 6,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}>
                          <span style={{
                            fontSize: 11, color: "#999", fontWeight: 500,
                            width: 180, flexShrink: 0, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{acc.accountName}</span>
                          <div style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: "rgba(255,255,255,0.06)", overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${pct}%`, height: "100%", borderRadius: 2,
                              background: color, transition: "width 0.3s",
                            }} />
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color,
                            width: 50, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums",
                          }}>{acc.uploaded}/{acc.total}</span>
                          <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 500, flexShrink: 0, width: 36, textAlign: "right" }}>
                            {acc.uploading > 0 ? `${acc.uploading} upl` : ""}
                          </span>
                          <span style={{ fontSize: 9, color: "#fca5a5", fontWeight: 500, flexShrink: 0, width: 36, textAlign: "right" }}>
                            {acc.errors > 0 ? `${acc.errors} err` : ""}
                          </span>
                          <span style={{ fontSize: 9, color: "#888", fontWeight: 500, flexShrink: 0, width: 40, textAlign: "right" }}>
                            {acc.skipped > 0 ? `${acc.skipped} skip` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions + View creatives */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {ticket.totalErrors > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  style={{
                    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                    color: "#fca5a5", borderRadius: 8, padding: "6px 14px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
                >Retry all errors</button>
              )}
              {ticket.totalRemoving > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  style={{
                    background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
                    color: "#c4b5fd", borderRadius: 8, padding: "6px 14px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(167,139,250,0.12)"; }}
                >Stop removing</button>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onViewCreatives(); }}
              style={{
                background: "rgba(212,190,140,0.1)", border: "1px solid rgba(212,190,140,0.2)",
                color: "#d4be8c", borderRadius: 8, padding: "7px 16px",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,190,140,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,190,140,0.1)"; }}
            >
              View {ticket.creativeCount.toLocaleString()} creatives <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativeCard({ creative, onUpdate }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const ctr = creative.clicks > 0 && creative.impressions > 0
    ? ((creative.clicks / creative.impressions) * 100).toFixed(2) + "%" : "0%";

  const allAcc = getAllAccounts(creative);
  const totalAcc = allAcc.length;
  const uploadedAcc = allAcc.filter(a => a.status === "uploaded").length;
  const errorAcc = allAcc.filter(a => ["upload_error", "delete_error", "partially_deleted"].includes(a.status)).length;

  const handleRetryAccount = (platName, aIdx) => {
    const updated = {
      ...creative,
      platforms: creative.platforms.map(p => {
        if (p.name !== platName) return p;
        return { ...p, accounts: p.accounts.map((a, i) => {
          if (i !== aIdx) return a;
          return { ...a, status: a.status === "upload_error" ? "uploading" : "removing" };
        })};
      }),
    };
    onUpdate(updated);
  };

  const handleCancelAccount = (platName, aIdx) => {
    const updated = {
      ...creative,
      platforms: creative.platforms.map(p => {
        if (p.name !== platName) return p;
        return { ...p, accounts: p.accounts.map((a, i) =>
          i === aIdx ? { ...a, status: "uploaded" } : a
        )};
      }),
    };
    onUpdate(updated);
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(165deg, #1e1d1b 0%, #252420 100%)",
        borderRadius: 16, overflow: "hidden",
        border: `1px solid ${hovered ? "rgba(212,190,140,0.25)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,190,140,0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Video Preview */}
      <div style={{
        position: "relative", paddingTop: "56.25%",
        background: `linear-gradient(135deg, ${creative.thumbnail}, #0a0a09)`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 6,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
            transition: "all 0.2s", transform: hovered ? "scale(1.1)" : "scale(1)",
          }}>
            <span style={{ color: "#fff", fontSize: 20, marginLeft: 3 }}>▶</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 500 }}>
            {creative.language.toUpperCase()} · {creative.resolution} · {creative.duration}
          </span>
        </div>
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
          <span style={{
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
            color: "#22c55e", border: "1px solid rgba(255,255,255,0.08)",
          }}>{creative.status}</span>
          <span style={{
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
            color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)",
          }}>{creative.ratio}</span>
        </div>
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
          <span style={{
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
            color: uploadedAcc === totalAcc ? "#22c55e" : "#f59e0b",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>{uploadedAcc}/{totalAcc} accounts</span>
          {errorAcc > 0 && (
            <span style={{
              background: "rgba(239,68,68,0.2)", backdropFilter: "blur(6px)",
              padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
              color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)",
            }}>{errorAcc} err</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div>
          <h3 style={{
            margin: 0, fontSize: 13, fontWeight: 700, color: "#e8e6e1",
            letterSpacing: "-0.01em", lineHeight: 1.3, wordBreak: "break-word",
            fontFamily: "monospace",
          }}>{creative.filename.replace('.mp4', '')}</h3>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            Created {creative.createdAtStr}
          </span>
        </div>

        {/* Collapsible details */}
        <div>
          <button onClick={() => setDetailsOpen(!detailsOpen)} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.4)",
            fontSize: 11, cursor: "pointer", padding: "2px 0",
            display: "flex", alignItems: "center", gap: 4, fontWeight: 500, fontFamily: "inherit",
          }}>
            <span style={{
              display: "inline-block", transition: "transform 0.2s",
              transform: detailsOpen ? "rotate(90deg)" : "rotate(0deg)", fontSize: 10,
            }}>▶</span>
            Video Details
          </button>
          <div style={{
            maxHeight: detailsOpen ? 120 : 0, overflow: "hidden",
            transition: "max-height 0.25s ease", opacity: detailsOpen ? 1 : 0,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", padding: "8px 0 4px" }}>
              {[["Campaigns", creative.campaigns], ["Impressions", fmt(creative.impressions)],
                ["Clicks", fmt(creative.clicks)], ["CTR", ctr],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: "auto" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>Platforms & Accounts</span>
          {creative.platforms.map(p => (
            <PlatformSection key={p.name} platform={p}
              onRetryAccount={handleRetryAccount}
              onCancelAccount={handleCancelAccount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketHeader({ ticket, onBack }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 12,
      padding: "16px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#d4be8c", borderRadius: 8, padding: "6px 12px",
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: 14 }}>←</span> All Tickets
        </button>
        <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
        <span style={{ color: "#e8e6e1", fontWeight: 600 }}>#{ticket.ticketId}</span>
        <span style={{
          padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: "rgba(212,190,140,0.1)", color: "#d4be8c",
          border: "1px solid rgba(212,190,140,0.15)",
        }}>{ticket.creativeCount.toLocaleString()} creatives</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ticket.languages.slice(0, 8).map(l => (
            <span key={l} style={{
              padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: "rgba(212,190,140,0.1)", color: "rgba(212,190,140,0.7)",
              border: "1px solid rgba(212,190,140,0.15)",
            }}>{l.toUpperCase()}</span>
          ))}
          {ticket.languages.length > 8 && (
            <span style={{ padding: "2px 6px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              +{ticket.languages.length - 8}
            </span>
          )}
        </div>
        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {ticket.resolutions.map(r => (
            <span key={r} style={{
              padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500,
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>{r}</span>
          ))}
        </div>
        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {ticket.durations.map(d => (
            <span key={d} style={{
              padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500,
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>{d}</span>
          ))}
        </div>
        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: ticket.totalErrors > 0 ? "#fca5a5" : ticket.progressPercent === 100 ? "#22c55e" : "#f59e0b",
        }}>
          {ticket.progressPercent}% uploaded{ticket.totalErrors > 0 ? ` · ${ticket.totalErrors} errors` : ""}
        </span>
      </div>
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder, width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const label = selected ? selected.label : placeholder || "Select…";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: width || 160 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...selectStyle,
          width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8,
          background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
          borderColor: open ? "rgba(212,190,140,0.3)" : "rgba(255,255,255,0.1)",
          backgroundImage: "none",
        }}
      >
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: value === "all" ? "rgba(255,255,255,0.5)" : "#e8e6e1",
        }}>{label}</span>
        <span style={{
          fontSize: 10, color: "rgba(255,255,255,0.35)", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          zIndex: 200, minWidth: "100%",
          background: "linear-gradient(180deg, #252320 0%, #1e1d1b 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          maxHeight: 280, overflowY: "auto",
        }}>
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: "100%", padding: "8px 14px",
                  background: isSelected ? "rgba(212,190,140,0.12)" : "transparent",
                  border: "none",
                  color: isSelected ? "#d4be8c" : "rgba(255,255,255,0.7)",
                  fontSize: 12, fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSelected) e.target.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!isSelected) e.target.style.background = isSelected ? "rgba(212,190,140,0.12)" : "transparent"; }}
              >
                <span style={{ width: 14, fontSize: 10, flexShrink: 0, color: "#d4be8c" }}>
                  {isSelected ? "✓" : ""}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomAccountSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = value === "all" ? "All Accounts" : value;

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 200 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...selectStyle,
          width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, maxWidth: 260,
          background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
          borderColor: open ? "rgba(212,190,140,0.3)" : "rgba(255,255,255,0.1)",
          backgroundImage: "none",
        }}
      >
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: value === "all" ? "rgba(255,255,255,0.5)" : "#e8e6e1",
        }}>{label}</span>
        <span style={{
          fontSize: 10, color: "rgba(255,255,255,0.35)", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 200, minWidth: 280,
          background: "linear-gradient(180deg, #252320 0%, #1e1d1b 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          maxHeight: 340, overflowY: "auto",
        }}>
          <button
            onClick={() => { onChange("all"); setOpen(false); }}
            style={{
              width: "100%", padding: "9px 14px",
              background: value === "all" ? "rgba(212,190,140,0.12)" : "transparent",
              border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
              color: value === "all" ? "#d4be8c" : "#ccc",
              fontSize: 12, fontWeight: value === "all" ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
              textAlign: "left", display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (value !== "all") e.target.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (value !== "all") e.target.style.background = value === "all" ? "rgba(212,190,140,0.12)" : "transparent"; }}
          >
            <span style={{ width: 14, fontSize: 10, flexShrink: 0, color: "#d4be8c" }}>{value === "all" ? "✓" : ""}</span>
            All Accounts
          </button>

          {PLATFORMS.map((platform, pIdx) => (
            <div key={platform}>
              <div style={{
                padding: "8px 14px 4px",
                fontSize: 10, fontWeight: 700,
                color: "rgba(212,190,140,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "rgba(0,0,0,0.15)",
                borderTop: pIdx > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                display: "flex", alignItems: "center", gap: 6,
                userSelect: "none",
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: 2,
                  background: "rgba(212,190,140,0.4)", flexShrink: 0,
                }} />
                {platform}
              </div>

              {ACCOUNT_NAMES[platform].map(accName => {
                const isSelected = value === accName;
                return (
                  <button
                    key={accName}
                    onClick={() => { onChange(accName); setOpen(false); }}
                    style={{
                      width: "100%", padding: "7px 14px 7px 24px",
                      background: isSelected ? "rgba(212,190,140,0.1)" : "transparent",
                      border: "none",
                      color: isSelected ? "#d4be8c" : "rgba(255,255,255,0.7)",
                      fontSize: 12, fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.target.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!isSelected) e.target.style.background = isSelected ? "rgba(212,190,140,0.1)" : "transparent"; }}
                  >
                    <span style={{ width: 14, fontSize: 10, flexShrink: 0, color: "#d4be8c" }}>{isSelected ? "✓" : ""}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accName}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#e8e6e1", borderRadius: 8, padding: "7px 28px 7px 10px",
  fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  appearance: "none", outline: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
};

export default function ProseccoApp() {
  const BATCH = 24;

  // View mode
  const [viewMode, setViewMode] = useState("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // App & menu
  const [selectedApp, setSelectedApp] = useState(APPS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ticketViewLayout, setTicketViewLayout] = useState("list"); // "grid" | "list"

  // Ticket list state
  const [tickets, setTickets] = useState([]);
  const [ticketTotalCount, setTicketTotalCount] = useState(0);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketInitialLoading, setTicketInitialLoading] = useState(true);
  const [ticketHasMore, setTicketHasMore] = useState(true);

  // Ticket filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketDebouncedSearch, setTicketDebouncedSearch] = useState("");
  const [ticketFilterStatus, setTicketFilterStatus] = useState("all");
  const [ticketFilterAfter, setTicketFilterAfter] = useState("");

  // Creative list state
  const [creatives, setCreatives] = useState([]);
  const [creativeTotalCount, setCreativeTotalCount] = useState(0);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [creativeInitialLoading, setCreativeInitialLoading] = useState(true);
  const [creativeHasMore, setCreativeHasMore] = useState(true);

  // Creative filters
  const [creativeSearch, setCreativeSearch] = useState("");
  const [creativeDebouncedSearch, setCreativeDebouncedSearch] = useState("");
  const [creativeFilterStatus, setCreativeFilterStatus] = useState("all");
  const [creativeFilterAccount, setCreativeFilterAccount] = useState("all");
  const [creativeFilterResolution, setCreativeFilterResolution] = useState("all");
  const [creativeFilterAfter, setCreativeFilterAfter] = useState("");

  // Ticket refs
  const ticketScrollRef = useRef(null);
  const ticketSentinelRef = useRef(null);
  const ticketFetchIdRef = useRef(0);
  const ticketLoadingRef = useRef(false);
  const ticketHasMoreRef = useRef(true);
  const ticketsRef = useRef([]);
  const ticketScrollPosition = useRef(0);

  // Creative refs
  const creativeScrollRef = useRef(null);
  const creativeSentinelRef = useRef(null);
  const creativeFetchIdRef = useRef(0);
  const creativeLoadingRef = useRef(false);
  const creativeHasMoreRef = useRef(true);
  const creativesRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);
  useEffect(() => { ticketHasMoreRef.current = ticketHasMore; }, [ticketHasMore]);
  useEffect(() => { creativesRef.current = creatives; }, [creatives]);
  useEffect(() => { creativeHasMoreRef.current = creativeHasMore; }, [creativeHasMore]);

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => setTicketDebouncedSearch(ticketSearch), 350);
    return () => clearTimeout(timer);
  }, [ticketSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setCreativeDebouncedSearch(creativeSearch), 350);
    return () => clearTimeout(timer);
  }, [creativeSearch]);

  // --- Fetch functions ---

  const fetchTickets = useCallback((offset, params, fetchId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pool = getPool(params.app);
        const filtered = pool.tickets.filter(t => {
          if (params.search && !t.ticketId.toLowerCase().includes(params.search.toLowerCase())) return false;
          if (params.after && t.latestCreatedAt < new Date(params.after)) return false;
          if (params.status === "has_errors") return t.totalErrors > 0;
          if (params.status === "all_uploaded") return t.totalUploaded === t.totalAccounts;
          if (params.status === "in_progress") return t.totalUploaded < t.totalAccounts && t.totalErrors === 0;
          return true;
        });

        const page = filtered.slice(offset, offset + BATCH);
        resolve({
          items: page,
          total: filtered.length,
          hasMore: offset + BATCH < filtered.length,
          fetchId,
        });
      }, offset === 0 ? 500 : 1200);
    });
  }, []);

  const fetchCreativesForTicket = useCallback((offset, params, fetchId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pool = getPool(params.app);
        const ticketCreatives = pool.creatives.filter(c => c.ticketId === params.ticketId);

        const filtered = ticketCreatives.filter(c => {
          if (params.search && !c.filename.toLowerCase().includes(params.search.toLowerCase())) return false;
          if (params.resolution !== "all" && c.resolution !== params.resolution) return false;
          if (params.after && c.createdAt < new Date(params.after)) return false;

          const accs = params.account === "all"
            ? getAllAccounts(c)
            : getAllAccounts(c).filter(a => a.accountName === params.account);
          if (params.account !== "all" && accs.length === 0) return false;
          if (params.status === "all") return true;
          if (params.status === "errors") return accs.some(a => ["upload_error", "delete_error", "partially_deleted"].includes(a.status));
          if (params.status === "uploading") return accs.some(a => a.status === "uploading" || a.status === "not_uploaded");
          if (params.status === "skipped") return accs.some(a => a.status === "skipped");
          if (params.status === "complete") return accs.every(a => a.status === "uploaded" || a.status === "skipped");
          return true;
        });

        const page = filtered.slice(offset, offset + BATCH);
        resolve({
          items: page,
          total: filtered.length,
          hasMore: offset + BATCH < filtered.length,
          fetchId,
        });
      }, offset === 0 ? 500 : 1200);
    });
  }, []);

  // --- Ticket params & reset ---

  const ticketParams = useMemo(() => ({
    search: ticketDebouncedSearch,
    status: ticketFilterStatus,
    after: ticketFilterAfter,
    app: selectedApp,
  }), [ticketDebouncedSearch, ticketFilterStatus, ticketFilterAfter, selectedApp]);
  const ticketParamsRef = useRef(ticketParams);
  useEffect(() => { ticketParamsRef.current = ticketParams; }, [ticketParams]);

  useEffect(() => {
    const id = ++ticketFetchIdRef.current;
    setTicketInitialLoading(true);
    setTickets([]);
    setTicketHasMore(true);
    ticketHasMoreRef.current = true;
    ticketLoadingRef.current = false;
    if (ticketScrollRef.current) ticketScrollRef.current.scrollTop = 0;

    fetchTickets(0, ticketParams, id).then(res => {
      if (res.fetchId !== ticketFetchIdRef.current) return;
      setTickets(res.items);
      ticketsRef.current = res.items;
      setTicketTotalCount(res.total);
      setTicketHasMore(res.hasMore);
      ticketHasMoreRef.current = res.hasMore;
      setTicketInitialLoading(false);
    });
  }, [ticketParams, fetchTickets]);

  // --- Creative params & reset ---

  const creativeParams = useMemo(() => ({
    search: creativeDebouncedSearch,
    status: creativeFilterStatus,
    account: creativeFilterAccount,
    resolution: creativeFilterResolution,
    after: creativeFilterAfter,
    app: selectedApp,
    ticketId: selectedTicketId,
  }), [creativeDebouncedSearch, creativeFilterStatus, creativeFilterAccount, creativeFilterResolution, creativeFilterAfter, selectedApp, selectedTicketId]);
  const creativeParamsRef = useRef(creativeParams);
  useEffect(() => { creativeParamsRef.current = creativeParams; }, [creativeParams]);

  useEffect(() => {
    if (viewMode !== "creatives" || !selectedTicketId) return;

    const id = ++creativeFetchIdRef.current;
    setCreativeInitialLoading(true);
    setCreatives([]);
    setCreativeHasMore(true);
    creativeHasMoreRef.current = true;
    creativeLoadingRef.current = false;
    if (creativeScrollRef.current) creativeScrollRef.current.scrollTop = 0;

    fetchCreativesForTicket(0, creativeParams, id).then(res => {
      if (res.fetchId !== creativeFetchIdRef.current) return;
      setCreatives(res.items);
      creativesRef.current = res.items;
      setCreativeTotalCount(res.total);
      setCreativeHasMore(res.hasMore);
      creativeHasMoreRef.current = res.hasMore;
      setCreativeInitialLoading(false);
    });
  }, [creativeParams, viewMode, fetchCreativesForTicket]);

  // --- Handle creative update ---

  const handleUpdate = useCallback((updated) => {
    setCreatives(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  // --- Load more functions ---

  const loadMoreTickets = useCallback(() => {
    if (ticketLoadingRef.current || !ticketHasMoreRef.current) return;
    ticketLoadingRef.current = true;
    setTicketLoading(true);
    const id = ticketFetchIdRef.current;
    const offset = ticketsRef.current.length;

    fetchTickets(offset, ticketParamsRef.current, id).then(res => {
      if (res.fetchId !== ticketFetchIdRef.current) {
        ticketLoadingRef.current = false;
        setTicketLoading(false);
        return;
      }
      setTickets(prev => {
        const next = [...prev, ...res.items];
        ticketsRef.current = next;
        return next;
      });
      setTicketTotalCount(res.total);
      setTicketHasMore(res.hasMore);
      ticketHasMoreRef.current = res.hasMore;
      ticketLoadingRef.current = false;
      setTicketLoading(false);
    });
  }, [fetchTickets]);

  const loadMoreCreatives = useCallback(() => {
    if (creativeLoadingRef.current || !creativeHasMoreRef.current) return;
    creativeLoadingRef.current = true;
    setCreativeLoading(true);
    const id = creativeFetchIdRef.current;
    const offset = creativesRef.current.length;

    fetchCreativesForTicket(offset, creativeParamsRef.current, id).then(res => {
      if (res.fetchId !== creativeFetchIdRef.current) {
        creativeLoadingRef.current = false;
        setCreativeLoading(false);
        return;
      }
      setCreatives(prev => {
        const next = [...prev, ...res.items];
        creativesRef.current = next;
        return next;
      });
      setCreativeTotalCount(res.total);
      setCreativeHasMore(res.hasMore);
      creativeHasMoreRef.current = res.hasMore;
      creativeLoadingRef.current = false;
      setCreativeLoading(false);
    });
  }, [fetchCreativesForTicket]);

  // --- IntersectionObservers ---

  useEffect(() => {
    if (viewMode !== "tickets") return;
    const sentinel = ticketSentinelRef.current;
    const container = ticketScrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreTickets(); },
      { root: container, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, loadMoreTickets]);

  useEffect(() => {
    if (viewMode !== "creatives") return;
    const sentinel = creativeSentinelRef.current;
    const container = creativeScrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreCreatives(); },
      { root: container, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, loadMoreCreatives]);

  // --- Navigation ---

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    const pool = getPool(selectedApp);
    return pool.tickets.find(t => t.ticketId === selectedTicketId) || null;
  }, [selectedTicketId, selectedApp]);

  const handleTicketClick = useCallback((ticketId) => {
    if (ticketScrollRef.current) {
      ticketScrollPosition.current = ticketScrollRef.current.scrollTop;
    }
    setSelectedTicketId(ticketId);
    setViewMode("creatives");
    setCreativeSearch("");
    setCreativeDebouncedSearch("");
    setCreativeFilterStatus("all");
    setCreativeFilterAccount("all");
    setCreativeFilterResolution("all");
    setCreativeFilterAfter("");
  }, []);

  const handleBackToTickets = useCallback(() => {
    setViewMode("tickets");
    setSelectedTicketId(null);
    requestAnimationFrame(() => {
      if (ticketScrollRef.current) {
        ticketScrollRef.current.scrollTop = ticketScrollPosition.current;
      }
    });
  }, []);

  // Reset to tickets when app changes
  useEffect(() => {
    setViewMode("tickets");
    setSelectedTicketId(null);
  }, [selectedApp]);

  // --- Derived ---

  const appName = APPS.find(a => a.id === selectedApp)?.name;
  const activeSearch = viewMode === "tickets" ? ticketSearch : creativeSearch;
  const activeDebouncedSearch = viewMode === "tickets" ? ticketDebouncedSearch : creativeDebouncedSearch;
  const setActiveSearch = viewMode === "tickets" ? setTicketSearch : setCreativeSearch;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #141310 0%, #0e0d0b 100%)",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #1e1d1b; color: #e8e6e1; }
        @keyframes prosecco-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* App Bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(18,17,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", gap: 4, padding: 4,
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", width: 20, height: 2,
                background: menuOpen && i === 1 ? "transparent" : "rgba(255,255,255,0.6)",
                borderRadius: 1, transition: "all 0.3s",
                transform: menuOpen
                  ? i === 0 ? "rotate(45deg) translate(4px, 4px)" : i === 2 ? "rotate(-45deg) translate(4px, -4px)" : "none"
                  : "none",
              }} />
            ))}
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 700, color: "#d4be8c", letterSpacing: "-0.02em",
            }}>prosecco</span>
            <span style={{
              fontSize: 9, fontWeight: 600, color: "rgba(212,190,140,0.5)",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>admin</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>App:</span>
          <CustomSelect
            value={selectedApp}
            onChange={setSelectedApp}
            width={200}
            options={APPS.map(a => ({ value: a.id, label: a.name }))}
          />
        </div>
      </header>

      {/* Side menu */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        }}>
          <nav onClick={e => e.stopPropagation()} style={{
            position: "absolute", left: 0, top: 60, bottom: 0, width: 260,
            background: "linear-gradient(180deg, #1a1917 0%, #141310 100%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4,
          }}>
            {["Creatives", "Campaigns", "Analytics", "Audiences", "Settings"].map((item, i) => (
              <button key={item} style={{
                background: i === 0 ? "rgba(212,190,140,0.1)" : "transparent",
                border: "none", color: i === 0 ? "#d4be8c" : "rgba(255,255,255,0.5)",
                padding: "12px 16px", borderRadius: 10, textAlign: "left",
                fontSize: 14, fontWeight: i === 0 ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
              }}>{item}</button>
            ))}
          </nav>
        </div>
      )}

      {/* Main */}
      <main style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>
        {/* Sticky header + filters */}
        <div style={{ padding: "24px 24px 0", maxWidth: 1440, margin: "0 auto", width: "100%", flexShrink: 0 }}>

        {/* Ticket Header (breadcrumb) when in creative view */}
        {viewMode === "creatives" && selectedTicket && (
          <TicketHeader ticket={selectedTicket} onBack={handleBackToTickets} />
        )}

        {/* Header row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 16, flexWrap: "wrap",
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#e8e6e1", lineHeight: 1 }}>
              {viewMode === "tickets" ? "Tickets" : "Creatives"}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
              {viewMode === "tickets"
                ? (ticketInitialLoading ? "Loading…" : `Showing ${tickets.length.toLocaleString()} of ${ticketTotalCount.toLocaleString()} tickets`)
                : (creativeInitialLoading ? "Loading…" : `Showing ${creatives.length.toLocaleString()} of ${creativeTotalCount.toLocaleString()} creatives`)
              } · {appName}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input type="text"
                placeholder={viewMode === "tickets" ? "Search by ticket ID..." : "Search by filename..."}
                value={activeSearch}
                onChange={e => setActiveSearch(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e8e6e1", borderRadius: 10, padding: "9px 14px 9px 36px",
                  fontSize: 13, fontFamily: "inherit", width: 220, outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(212,190,140,0.3)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.25)", fontSize: 14, pointerEvents: "none",
              }}>⌕</span>
              {activeSearch !== activeDebouncedSearch && (
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  width: 12, height: 12, border: "1.5px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
              )}
            </div>
            {viewMode === "tickets" && (
              <div style={{
                display: "flex", background: "rgba(255,255,255,0.06)",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}>
                {[
                  { value: "list", icon: "☰" },
                  { value: "grid", icon: "▦" },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setTicketViewLayout(opt.value)}
                    style={{
                      background: ticketViewLayout === opt.value ? "rgba(212,190,140,0.15)" : "transparent",
                      border: "none",
                      color: ticketViewLayout === opt.value ? "#d4be8c" : "rgba(255,255,255,0.35)",
                      padding: "6px 10px", fontSize: 14, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                      lineHeight: 1,
                    }}
                  >{opt.icon}</button>
                ))}
              </div>
            )}
            <button style={{
              background: "linear-gradient(135deg, #d4be8c 0%, #b8a274 100%)",
              border: "none", color: "#141310", borderRadius: 10,
              padding: "9px 20px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 2px 12px rgba(212,190,140,0.25)",
            }}>+ Upload</button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          marginBottom: 20, padding: "12px 16px",
          background: "rgba(255,255,255,0.02)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4,
          }}>Filters</span>

          {viewMode === "tickets" ? (
            <>
              <CustomSelect
                value={ticketFilterStatus}
                onChange={setTicketFilterStatus}
                width={180}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "has_errors", label: "Has Errors" },
                  { value: "all_uploaded", label: "All Uploaded" },
                  { value: "in_progress", label: "In Progress" },
                ]}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, whiteSpace: "nowrap" }}>Created after:</span>
                <input type="date" value={ticketFilterAfter} onChange={e => setTicketFilterAfter(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e8e6e1", borderRadius: 8, padding: "6px 10px",
                    fontSize: 12, fontFamily: "inherit", outline: "none", colorScheme: "dark",
                  }}
                />
              </div>

              {(ticketFilterStatus !== "all" || ticketFilterAfter) && (
                <button onClick={() => { setTicketFilterStatus("all"); setTicketFilterAfter(""); }}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 12px",
                    fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    marginLeft: "auto",
                  }}>✕ Clear filters</button>
              )}
            </>
          ) : (
            <>
              <CustomSelect
                value={creativeFilterStatus}
                onChange={setCreativeFilterStatus}
                width={180}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "errors", label: "Errors" },
                  { value: "uploading", label: "Uploading / Queued" },
                  { value: "skipped", label: "Skipped" },
                  { value: "complete", label: "Complete" },
                ]}
              />

              <CustomAccountSelect value={creativeFilterAccount} onChange={setCreativeFilterAccount} />

              <CustomSelect
                value={creativeFilterResolution}
                onChange={setCreativeFilterResolution}
                width={160}
                options={[
                  { value: "all", label: "All Resolutions" },
                  ...RESOLUTIONS.map(r => ({ value: `${r.w}x${r.h}`, label: `${r.w}x${r.h} (${r.ratio})` })),
                ]}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, whiteSpace: "nowrap" }}>Created after:</span>
                <input type="date" value={creativeFilterAfter} onChange={e => setCreativeFilterAfter(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e8e6e1", borderRadius: 8, padding: "6px 10px",
                    fontSize: 12, fontFamily: "inherit", outline: "none", colorScheme: "dark",
                  }}
                />
              </div>

              {(creativeFilterStatus !== "all" || creativeFilterAccount !== "all" || creativeFilterResolution !== "all" || creativeFilterAfter) && (
                <button onClick={() => { setCreativeFilterStatus("all"); setCreativeFilterAccount("all"); setCreativeFilterResolution("all"); setCreativeFilterAfter(""); }}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 12px",
                    fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    marginLeft: "auto",
                  }}>✕ Clear filters</button>
              )}
            </>
          )}
        </div>
        </div>

        {/* === TICKET VIEW === */}
        {viewMode === "tickets" && (
          <div ref={ticketScrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 24px 48px" }}>
            {!ticketInitialLoading && ticketViewLayout === "grid" && (
              <div style={{
                maxWidth: 1440, margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 20,
              }}>
                {tickets.map(t => (
                  <TicketCard key={t.ticketId} ticket={t} onClick={() => handleTicketClick(t.ticketId)} />
                ))}
              </div>
            )}

            {!ticketInitialLoading && ticketViewLayout === "list" && (
              <div style={{
                maxWidth: 1440, margin: "0 auto",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                {tickets.map(t => (
                  <TicketListRow key={t.ticketId} ticket={t} onViewCreatives={() => handleTicketClick(t.ticketId)} />
                ))}
              </div>
            )}

            {ticketInitialLoading && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "80px 20px", gap: 12,
              }}>
                <div style={{
                  width: 28, height: 28, border: "2.5px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  Loading tickets…
                </span>
              </div>
            )}

            {!ticketInitialLoading && tickets.length === 0 && !ticketLoading && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.25)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>∅</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>No tickets found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
              </div>
            )}

            {ticketLoading && !ticketInitialLoading && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "32px 0 16px", gap: 10,
              }}>
                <div style={{
                  width: 20, height: 20, border: "2px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  Loading more… ({tickets.length.toLocaleString()} / {ticketTotalCount.toLocaleString()})
                </span>
              </div>
            )}

            {!ticketHasMore && tickets.length > 0 && !ticketInitialLoading && (
              <div style={{
                textAlign: "center", padding: "24px 0 8px",
                fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500,
              }}>
                All {tickets.length.toLocaleString()} tickets loaded
              </div>
            )}

            <div ref={ticketSentinelRef} style={{ height: 1 }} />
          </div>
        )}

        {/* === CREATIVE VIEW === */}
        {viewMode === "creatives" && (
          <div ref={creativeScrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 24px 48px" }}>
            {!creativeInitialLoading && (
              <div style={{
                maxWidth: 1440, margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 20,
              }}>
                {creatives.map(c => (
                  <CreativeCard key={c.id} creative={c} onUpdate={handleUpdate} />
                ))}
              </div>
            )}

            {creativeInitialLoading && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "80px 20px", gap: 12,
              }}>
                <div style={{
                  width: 28, height: 28, border: "2.5px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  Loading creatives…
                </span>
              </div>
            )}

            {!creativeInitialLoading && creatives.length === 0 && !creativeLoading && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.25)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>∅</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>No creatives found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
              </div>
            )}

            {creativeLoading && !creativeInitialLoading && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "32px 0 16px", gap: 10,
              }}>
                <div style={{
                  width: 20, height: 20, border: "2px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                  Loading more… ({creatives.length.toLocaleString()} / {creativeTotalCount.toLocaleString()})
                </span>
              </div>
            )}

            {!creativeHasMore && creatives.length > 0 && !creativeInitialLoading && (
              <div style={{
                textAlign: "center", padding: "24px 0 8px",
                fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500,
              }}>
                All {creatives.length.toLocaleString()} creatives loaded
              </div>
            )}

            <div ref={creativeSentinelRef} style={{ height: 1 }} />
          </div>
        )}
      </main>
    </div>
  );
}
