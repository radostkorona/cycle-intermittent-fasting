import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc, getDoc, setDoc
} from "firebase/firestore";

/* ---------------- FIRESTORE STORAGE ---------------- */
const saveToCloud = async (uid, key, value) => {
  try {
    await setDoc(doc(db, "users", uid), { [key]: value }, { merge: true });
  } catch (e) {
    console.error("Save error:", e);
  }
};

const loadFromCloud = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.error("Load error:", e);
    return {};
  }
};

/* ---------------- PATTERN ---------------- */
const pattern = [
  15, 15, 15, 15, 15,
  24,
  17, 17, 17, 17,
  15, 15, 15, 15, 15,
  24,
  17, 17, 17,
  ...Array(11).fill(13)
];

const defaultRows = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  date: "",
  last: "",
  breakfast: "",
  fasting: pattern[i],
  done: false,
}));

/* ---------------- LOGIN SCREEN ---------------- */
function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, ""));
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 340,
      margin: "80px auto",
      padding: 30,
      background: "white",
      borderRadius: 12,
      boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
      fontFamily: "sans-serif"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#c0396b" }}>
        🌸 Cycle Intermittent Fasting
      </h2>

      <div style={{ marginBottom: 16 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
        />
      </div>

      {error && (
        <div style={{ color: "red", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      <button
        onClick={handle}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: "#c0396b",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 15,
          marginBottom: 12
        }}
      >
        {loading ? "..." : mode === "login" ? "Log in" : "Register"}
      </button>

      <div style={{ textAlign: "center", fontSize: 13 }}>
        {mode === "login" ? (
          <>No account? <span style={{ color: "#c0396b", cursor: "pointer" }} onClick={() => setMode("register")}>Register</span></>
        ) : (
          <>Already have an account? <span style={{ color: "#c0396b", cursor: "pointer" }} onClick={() => setMode("login")}>Log in</span></>
        )}
      </div>
    </div>
  );
}

/* ---------------- APP ---------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("regime");
  const [userData, setUserData] = useState(null);

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const data = await loadFromCloud(u.uid);
        setUserData(data);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontFamily: "sans-serif", color: "#999" }}>
        Loading...
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  if (!userData) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontFamily: "sans-serif", color: "#999" }}>
        Loading your data...
      </div>
    );
  }

  return (
    <div lang="bg" style={{
      padding: 20,
      maxWidth: 500,
      margin: "auto",
      fontFamily: "sans-serif",
      background: "#f9f9f9",
      minHeight: "100vh"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#c0396b" }}>Cycle Intermittent Fasting</h2>
        <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
          <div>{user.email}</div>
          <span
            onClick={handleLogout}
            style={{ color: "#c0396b", cursor: "pointer" }}
          >
            Log out
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {["regime", "weight", "measures", "charts", "help"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              marginRight: 5,
              marginBottom: 5,
              background: tab === t ? "#ff69b4" : "#e0ffe0",
              color: "black",
              border: "none",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "regime" && <Regime uid={user.uid} initial={userData.regime || defaultRows} />}
      {tab === "weight" && <Weight uid={user.uid} initial={userData.weight || []} />}
      {tab === "measures" && <Measures uid={user.uid} initial={userData.measures || []} />}
      {tab === "charts" && <Charts uid={user.uid} weight={userData.weight || []} measures={userData.measures || []} />}
      {tab === "help" && <Help />}
    </div>
  );
}

/* ---------------- REGIME ---------------- */
function Regime({ uid, initial }) {
  const [rows, setRows] = useState(initial);

  const persist = (updated) => {
    setRows(updated);
    saveToCloud(uid, "regime", updated);
  };

  const add = () => {
    persist([...rows, {
      id: rows.length + 1,
      date: "", last: "", breakfast: "",
      fasting: pattern[rows.length] ?? 13,
      done: false,
    }]);
  };

  const setDate = (i, value) => {
    const updated = [...rows];
    const start = new Date(value);
    for (let j = i; j < updated.length; j++) {
      const d = new Date(start);
      d.setDate(d.getDate() + (j - i));
      updated[j].date = d.toISOString().slice(0, 10);
    }
    persist(updated);
  };

  const setLast = (i, value) => {
    const updated = [...rows];
    updated[i].last = value;
    if (value && updated[i + 1] !== undefined) {
      const [h, m] = value.split(":").map(Number);
      const fastingHours = Number(updated[i].fasting) || 15;
      const total = h * 60 + m + fastingHours * 60;
      const bh = Math.floor(total / 60) % 24;
      const bm = total % 60;
      updated[i + 1].breakfast =
        String(bh).padStart(2, "0") + ":" + String(bm).padStart(2, "0");
    }
    persist(updated);
  };

  const toggleDone = (i) => {
    const updated = [...rows];
    updated[i].done = !updated[i].done;
    persist(updated);
  };

  const startNewCycle = () => {
    const ok = window.confirm("Start new cycle? This will reset all dates, times and checkmarks.");
    if (!ok) return;
    const resetRows = Array.from({ length: rows.length }, (_, i) => ({
      id: i + 1, date: "", last: "", breakfast: "",
      fasting: pattern[i] ?? 13, done: false,
    }));
    persist(resetRows);
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={add}>Add</button>
        <button onClick={startNewCycle} style={{ marginLeft: 10 }}>🔄 New Cycle</button>
      </div>

      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "25px 100px 30px 55px 28px 75px 28px",
        fontWeight: "bold",
        borderBottom: "1px solid #ccc",
        paddingBottom: "4px",
        marginBottom: "6px",
        fontSize: 13,
        columnGap: "6px",
      }}>
        <div>#</div>
        <div>Date</div>
        <div>Day</div>
        <div>Breakfast</div>
        <div>✔</div>
        <div>Last meal</div>
        <div>F</div>
      </div>

      {/* Rows */}
      {rows.map((r, i) => {
        const dayAbbr = r.date
          ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(r.date).getDay()]
          : "";
        return (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "25px 100px 30px 55px 28px 75px 28px",
            alignItems: "center",
            columnGap: "6px",
            marginBottom: "4px",
            background: i % 2 ? "#fafafa" : "white",
          }}>
            <div style={{ fontSize: 13 }}>{r.id}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <input
                type="date"
                value={r.date}
                onChange={(e) => setDate(i, e.target.value)}
                style={{ width: 22, padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: 12 }}>
                {r.date ? (() => {
                  const [y, m, d] = r.date.split("-");
                  return `${d}.${m}.${y.slice(2)}`;
                })() : "дд.мм.гг"}
              </span>
            </div>

            <div style={{ fontSize: 12, color: "#555" }}>{dayAbbr}</div>
            <div style={{ fontSize: 13 }}>{r.breakfast || "--:--"}</div>

            <button
              onClick={() => toggleDone(i)}
              style={{
                width: 22, height: 22, padding: 0, fontSize: 12,
                border: "1px solid #ccc", borderRadius: 4,
                background: r.done ? "#ff69b4" : "white",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              {r.done ? "✔" : ""}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <input
                type="time"
                value={r.last}
                onChange={(e) => setLast(i, e.target.value)}
                style={{ width: 22, padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: 13 }}>{r.last || "--:--"}</span>
            </div>

            <div style={{ fontSize: 12 }}>{r.fasting}h</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- WEIGHT ---------------- */
function Weight({ uid, initial }) {
  const [data, setData] = useState(initial);
  const [form, setForm] = useState({ date: "", weight: "" });

  const persist = (updated) => {
    setData(updated);
    saveToCloud(uid, "weight", updated);
  };

  const add = () => {
    if (!form.date || !form.weight) return;
    persist([form, ...data]);
    setForm({ date: "", weight: "" });
  };

  return (
    <div>
      <input
        type="date" value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />
      <input
        value={form.weight}
        onChange={(e) => setForm({ ...form, weight: e.target.value.replace(".", ",") })}
        placeholder="kg"
      />
      <button onClick={add}>Add</button>

      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          {d.date} - {d.weight}
          <button onClick={() => {
            const newVal = prompt("Edit weight:", d.weight);
            if (!newVal) return;
            const updated = [...data];
            updated[i].weight = newVal;
            persist(updated);
          }}>✏️</button>
          <button onClick={() => persist(data.filter((_, idx) => idx !== i))}>❌</button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- MEASURES ---------------- */
function Measures({ uid, initial }) {
  const [data, setData] = useState(initial);
  const [form, setForm] = useState({ date: "", bust: "", under: "", waist: "", hips: "", thigh: "", calf: "", ankle: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const persist = (updated) => {
    setData(updated);
    saveToCloud(uid, "measures", updated);
  };

  const saveEntry = () => {
    if (!form.date) return;
    const newEntry = {
      ...form,
      bust: form.bust ? Number(form.bust) : null,
      under: form.under ? Number(form.under) : null,
      waist: form.waist ? Number(form.waist) : null,
      hips: form.hips ? Number(form.hips) : null,
      thigh: form.thigh ? Number(form.thigh) : null,
      calf: form.calf ? Number(form.calf) : null,
      ankle: form.ankle ? Number(form.ankle) : null,
    };
    persist([newEntry, ...data]);
    setForm({ date: "", bust: "", under: "", waist: "", hips: "", thigh: "", calf: "", ankle: "" });
  };

  return (
    <div>
      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      {["bust","under","waist","hips","thigh","calf","ankle"].map(f => (
        <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={form[f]}
          onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
      ))}
      <button onClick={saveEntry}>Save</button>

      <div style={{ marginTop: 20 }}>
        {data.map((d, i) => {
          const isEditing = editingIndex === i;
          return (
            <div key={i} style={{ border: "1px solid #ccc", padding: "8px", marginBottom: "8px", borderRadius: "6px" }}>
              <div>{d.date}</div>
              {isEditing ? (
                <>
                  {["bust","under","waist","hips","thigh","calf","ankle"].map(f => (
                    <input key={f} placeholder={f} value={editForm[f] ?? ""}
                      onChange={e => setEditForm({ ...editForm, [f]: e.target.value })} />
                  ))}
                  <button onClick={() => {
                    const updated = [...data];
                    updated[i] = {
                      ...updated[i],
                      ...Object.fromEntries(["bust","under","waist","hips","thigh","calf","ankle"].map(f => [f, editForm[f] ? Number(editForm[f]) : null]))
                    };
                    persist(updated);
                    setEditingIndex(null);
                  }}>Save</button>
                  <button onClick={() => setEditingIndex(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {["bust","under","waist","hips","thigh","calf","ankle"].map(f => (
                    <div key={f}>{f.charAt(0).toUpperCase() + f.slice(1)}: {d[f] ?? "-"}</div>
                  ))}
                  <button onClick={() => { setEditingIndex(i); setEditForm(d); }}>Edit</button>
                  <button onClick={() => persist(data.filter((_, idx) => idx !== i))}>X</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- CHARTS ---------------- */
function Charts({ weight, measures }) {
  const [range, setRange] = useState("3m");

  const weightData = weight
    .map(d => ({ date: d.date, value: Number(d.weight?.replace(",", ".")) }))
    .filter(d => !isNaN(d.value));

  const clean = (v) => {
    if (!v) return undefined;
    const num = Number(v.toString().replace(",", "."));
    return isNaN(num) ? undefined : num;
  };

  const getStartDate = () => {
    const now = new Date();
    if (range === "1m") now.setMonth(now.getMonth() - 1);
    if (range === "3m") now.setMonth(now.getMonth() - 3);
    if (range === "6m") now.setMonth(now.getMonth() - 6);
    if (range === "1y") now.setFullYear(now.getFullYear() - 1);
    return now;
  };

  const startDate = getStartDate();
  const filtered = measures
    .filter(m => new Date(m.date) >= startDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const buildChart = (key) => {
    const data = filtered
      .map(d => ({ date: d.date, value: clean(d[key]) }))
      .filter(d => d.value !== undefined);
    if (data.length === 0) return null;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2 || 1;
    return (
      <div style={{ marginBottom: 30 }}>
        <h4>{key}</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis domain={[min - padding, max + padding]} />
            <YAxis orientation="right" domain={[min - padding, max + padding]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 15 }}>
        {[{ label: "1M", value: "1m" }, { label: "3M", value: "3m" }, { label: "6M", value: "6m" }, { label: "1Y", value: "1y" }].map(btn => (
          <button key={btn.value} onClick={() => setRange(btn.value)} style={{
            marginRight: 5,
            background: range === btn.value ? "black" : "white",
            color: range === btn.value ? "white" : "black"
          }}>{btn.label}</button>
        ))}
      </div>

      {weightData.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h4>Weight</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <XAxis dataKey="date" />
              <YAxis />
              <YAxis orientation="right" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="green" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {buildChart("bust")}
      {buildChart("under")}
      {buildChart("waist")}
      {buildChart("hips")}
      {buildChart("thigh")}
      {buildChart("calf")}
      {buildChart("ankle")}
    </div>
  );
}

/* ---------------- HELP ---------------- */
function Help() {
  const h = (text) => (
    <h4 style={{ marginTop: 18, marginBottom: 4, color: "#c0396b" }}>{text}</h4>
  );
  const p = (text) => (
    <p style={{ margin: "4px 0", fontSize: 13, lineHeight: 1.5 }}>{text}</p>
  );

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {h("📋 Regime tab")}
      {p("This is the main fasting schedule. It contains 30 rows — one for each day of your cycle.")}
      {p("• Date — click the calendar icon to pick a date. If you set a date in any row, all following rows will be automatically filled with consecutive dates.")}
      {p("• Day — shows the day of the week (Mon, Tue, etc.) automatically once the date is set.")}
      {p("• Breakfast — filled in automatically based on the previous day's Last meal time and fasting duration.")}
      {p("• ✔ — click to mark the day as done. The button turns pink.")}
      {p("• Last meal — click the clock icon to enter the time of your last meal for that day. Once filled, the next row's Breakfast time is calculated automatically.")}
      {p("• F — shows the fasting window in hours for that day, according to Mindy Pelz's 30-day plan (15h, 17h, 24h, or 13h).")}

      {h("🔄 New Cycle button")}
      {p("Clears all dates, times and checkmarks from the Regime table, but keeps the 30 rows and the fasting pattern. Use this at the start of each new cycle.")}

      {h("➕ Add button")}
      {p("Adds an extra row at the bottom of the Regime table if you need more than 30 days.")}

      {h("⚖️ Weight tab")}
      {p("Record your weight over time. Pick a date, enter your weight in kg (use a comma for decimals, e.g. 63,5), and click Add.")}
      {p("Each entry can be edited (✏️) or deleted (❌). Weight progress is shown in the Charts tab.")}

      {h("📏 Measures tab")}
      {p("Record your body measurements in centimetres: Bust, Under bust, Waist, Hips, Thigh, Calf, Ankle.")}
      {p("Pick a date, fill in the fields you want, and click Save. You don't need to fill all fields.")}
      {p("Each entry can be edited or deleted. All measurements are shown as separate charts in the Charts tab.")}

      {h("📈 Charts tab")}
      {p("Shows line charts for Weight and all body measurements over time.")}
      {p("Use the 1M / 3M / 6M / 1Y buttons to filter the time range displayed.")}

      {h("👤 Account")}
      {p("Your data is saved to the cloud and synced across all your devices. Log out and log back in on any device to access your data.")}
      {p("Your email is shown in the top right corner. Click 'Log out' to sign out.")}
    </div>
  );
}
