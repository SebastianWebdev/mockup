import { useState, useCallback, useMemo, useRef, useEffect } from "react";

const PLATFORMS = ["Google", "Facebook", "TikTok", "AppLovin", "Apple"];
const STATUSES = ["uploaded", "uploading", "not_uploaded", "upload_error", "removing", "partially_deleted", "delete_error", "skipped"];
const RATIOS = ["9:16", "16:9", "1:1", "4:5"];

const ACCOUNT_NAMES = {
  Google: ["Google - US Main", "Google - EU Brand", "Google - APAC Perf"],
  Facebook: ["FB - US Broad", "FB - EU Lookalike"],
  TikTok: ["TikTok - US Spark", "TikTok - UK TopView", "TikTok - DE Reach"],
  AppLovin: ["AppLovin - US iOS", "AppLovin - Global Android"],
  Apple: ["ASA - US Discovery", "ASA - EU Search"],
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

function pickStatus(messy) {
  const w = messy
    ? [0.25, 0.1, 0.1, 0.15, 0.08, 0.07, 0.05, 0.2]
    : [0.55, 0.1, 0.1, 0.05, 0.04, 0.02, 0.02, 0.12];
  const r = Math.random();
  let c = 0;
  for (let i = 0; i < w.length; i++) { c += w[i]; if (r < c) return STATUSES[i]; }
  return STATUSES[0];
}

function generateCreatives(startIdx = 0, count = 12) {
  const basenames = [
    "Summer_Sale_Hero", "UA_Gameplay_15s_EN", "Retarget_Boss_Fight_30s",
    "Install_CTA_Square", "Xmas_Promo_Stories", "Tutorial_Walkthrough_60s",
    "Reward_Chest_Open", "PvP_Arena_Teaser", "New_Character_Reveal",
    "Live_Event_Countdown", "Cinematic_Trailer", "Social_UGC_Style",
    "Endcard_Reward", "Playable_Demo_Cut", "Brand_Intro_Bumper",
    "Vertical_Story_Ad", "Carousel_Highlights", "Event_Hype_Reel",
    "Win_Streak_Montage", "Boss_Kill_Compilation", "Loot_Box_Reveal",
    "Guild_War_Promo", "Season_Pass_Intro", "Limited_Offer_Flash",
    "Character_Showcase", "Gameplay_Loop_Demo", "Achievement_Unlock",
    "Daily_Challenge_Ad", "Multiplayer_Chaos", "Idle_Progress_Show",
    "Upgrade_Path_Demo", "VIP_Benefits_Promo", "Referral_Program_CTA",
    "Weekend_Event_Hype", "Gacha_Pull_Montage", "Arena_Ranked_Promo",
    "New_Map_Showcase", "Collab_Event_Teaser", "Anniversary_Special",
    "Launch_Day_Trailer",
  ];
  return Array.from({ length: count }, (_, idx) => {
    const i = startIdx + idx;
    const name = basenames[i % basenames.length] + "_v" + (Math.floor(i / basenames.length) + 1);
    const ratio = RATIOS[i % RATIOS.length];
    const res = ratio === "9:16" ? "1080×1920" : ratio === "16:9" ? "1920×1080" : ratio === "1:1" ? "1080×1080" : "1080×1350";
    const messy = i % 5 === 0;
    const createdAt = new Date(Date.now() - Math.random() * 60 * 86400000);

    const platforms = PLATFORMS.map((p) => {
      const accounts = ACCOUNT_NAMES[p].map((accName) => {
        const status = pickStatus(messy);
        return {
          accountName: accName,
          status,
          skipReason: status === "skipped"
            ? SKIP_REASONS[Math.floor(Math.random() * SKIP_REASONS.length)].replace("{platform}", p) + " - " + name + ".mp4"
            : null,
        };
      });
      const hasLink = Math.random() > 0.4;
      return {
        name: p,
        accounts,
        link: hasLink ? `https://${p.toLowerCase().replace(" ", "")}.com/ads/library/${Math.random().toString(36).slice(2, 10)}` : null,
      };
    });

    return {
      id: i + 1, name, ratio, resolution: res,
      status: "ACTIVE",
      campaigns: Math.floor(Math.random() * 8),
      impressions: Math.floor(Math.random() * 150000),
      clicks: Math.floor(Math.random() * 3000),
      duration: `0:${(15 + Math.floor(Math.random() * 50)).toString().padStart(2, "0")}`,
      platforms,
      thumbnail: `hsl(${(i * 47 + 200) % 360}, 45%, ${22 + (i % 3) * 5}%)`,
      createdAt,
      createdAtStr: createdAt.toLocaleDateString("en-GB"),
    };
  });
}

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString());
function getAllAccounts(c) { return c.platforms.flatMap(p => p.accounts); }
function getAllAccountNames(creatives) {
  const s = new Set();
  creatives.forEach(c => c.platforms.forEach(p => p.accounts.forEach(a => s.add(a.accountName))));
  return [...s].sort();
}

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
            {creative.duration} · {creative.resolution}
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
            margin: 0, fontSize: 14, fontWeight: 700, color: "#e8e6e1",
            letterSpacing: "-0.01em", lineHeight: 1.3, wordBreak: "break-word",
          }}>{creative.name}</h3>
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
  const [creatives, setCreatives] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedApp, setSelectedApp] = useState(APPS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterRatio, setFilterRatio] = useState("all");
  const [filterAfter, setFilterAfter] = useState("");
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const fetchIdRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const creativesRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { creativesRef.current = creatives; }, [creatives]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Simulate server-side fetch with filters
  const fetchCreatives = useCallback((offset, params, fetchId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pool = generateCreatives(0, 800);
        const filtered = pool.filter(c => {
          if (params.search && !c.name.toLowerCase().includes(params.search.toLowerCase())) return false;
          if (params.ratio !== "all" && c.ratio !== params.ratio) return false;
          if (params.after) {
            if (c.createdAt < new Date(params.after)) return false;
          }
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

        const scaledTotal = Math.round((filtered.length / 800) * 8247);
        const page = filtered.slice(offset, offset + BATCH);

        resolve({
          items: page,
          total: scaledTotal,
          hasMore: offset + BATCH < scaledTotal,
          fetchId,
        });
      }, offset === 0 ? 500 : 1200);
    });
  }, []);

  const currentParams = useMemo(() => ({
    search: debouncedSearch,
    status: filterStatus,
    account: filterAccount,
    ratio: filterRatio,
    after: filterAfter,
    app: selectedApp,
  }), [debouncedSearch, filterStatus, filterAccount, filterRatio, filterAfter, selectedApp]);
  const currentParamsRef = useRef(currentParams);
  useEffect(() => { currentParamsRef.current = currentParams; }, [currentParams]);

  // Reset and fetch when filters change
  useEffect(() => {
    const id = ++fetchIdRef.current;
    setInitialLoading(true);
    setCreatives([]);
    setHasMore(true);
    hasMoreRef.current = true;
    loadingRef.current = false;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    fetchCreatives(0, currentParams, id).then(res => {
      if (res.fetchId !== fetchIdRef.current) return;
      setCreatives(res.items);
      creativesRef.current = res.items;
      setTotalCount(res.total);
      setHasMore(res.hasMore);
      hasMoreRef.current = res.hasMore;
      setInitialLoading(false);
    });
  }, [currentParams, fetchCreatives]);

  const allAccountNames = useMemo(() => {
    const s = new Set();
    Object.values(ACCOUNT_NAMES).forEach(names => names.forEach(n => s.add(n)));
    return [...s].sort();
  }, []);

  const handleUpdate = useCallback((updated) => {
    setCreatives(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  // Stable loadMore using refs
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const id = fetchIdRef.current;
    const offset = creativesRef.current.length;

    fetchCreatives(offset, currentParamsRef.current, id).then(res => {
      if (res.fetchId !== fetchIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
        return;
      }
      setCreatives(prev => {
        const next = [...prev, ...res.items];
        creativesRef.current = next;
        return next;
      });
      setTotalCount(res.total);
      setHasMore(res.hasMore);
      hasMoreRef.current = res.hasMore;
      loadingRef.current = false;
      setLoading(false);
    });
  }, [fetchCreatives]);

  // IntersectionObserver — stable, never re-created
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: container, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Creatives are already filtered server-side
  const filtered = creatives;

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
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 16, flexWrap: "wrap",
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#e8e6e1", lineHeight: 1 }}>Creatives</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
              {initialLoading ? "Loading…" : `Showing ${filtered.length.toLocaleString()} of ${totalCount.toLocaleString()} creatives`} · {APPS.find(a => a.id === selectedApp)?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Search creatives..." value={search}
                onChange={e => setSearch(e.target.value)}
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
              {search !== debouncedSearch && (
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  width: 12, height: 12, border: "1.5px solid rgba(212,190,140,0.2)",
                  borderTopColor: "#d4be8c", borderRadius: "50%",
                  animation: "prosecco-spin 0.7s linear infinite",
                }} />
              )}
            </div>
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

          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            width={180}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "errors", label: "Errors" },
              { value: "uploading", label: "Uploading / Queued" },
              { value: "skipped", label: "Skipped" },
              { value: "complete", label: "Complete" },
            ]}
          />

          <CustomAccountSelect value={filterAccount} onChange={setFilterAccount} />

          <CustomSelect
            value={filterRatio}
            onChange={setFilterRatio}
            width={140}
            options={[
              { value: "all", label: "All Ratios" },
              ...RATIOS.map(r => ({ value: r, label: r })),
            ]}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, whiteSpace: "nowrap" }}>Created after:</span>
            <input type="date" value={filterAfter} onChange={e => setFilterAfter(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8e6e1", borderRadius: 8, padding: "6px 10px",
                fontSize: 12, fontFamily: "inherit", outline: "none", colorScheme: "dark",
              }}
            />
          </div>

          {(filterStatus !== "all" || filterAccount !== "all" || filterRatio !== "all" || filterAfter) && (
            <button onClick={() => { setFilterStatus("all"); setFilterAccount("all"); setFilterRatio("all"); setFilterAfter(""); }}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 12px",
                fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                marginLeft: "auto",
              }}>✕ Clear filters</button>
          )}
        </div>
        </div>

        {/* Scrollable grid area */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 24px 48px" }}>
          {!initialLoading && (
            <div style={{
              maxWidth: 1440, margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 20,
            }}>
              {filtered.map(c => (
                <CreativeCard key={c.id} creative={c} onUpdate={handleUpdate} />
              ))}
            </div>
          )}

          {/* Initial loading skeleton */}
          {initialLoading && (
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

          {!initialLoading && filtered.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>∅</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>No creatives found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
            </div>
          )}

          {/* Loading more indicator */}
          {loading && !initialLoading && (
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
                Loading more… ({creatives.length.toLocaleString()} / {totalCount.toLocaleString()})
              </span>
            </div>
          )}

          {/* End of list */}
          {!hasMore && filtered.length > 0 && !initialLoading && (
            <div style={{
              textAlign: "center", padding: "24px 0 8px",
              fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500,
            }}>
              All {creatives.length.toLocaleString()} creatives loaded
            </div>
          )}

          {/* Sentinel for IntersectionObserver */}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      </main>
    </div>
  );
}
