import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

/* ---------------- STORAGE ---------------- */
const save = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const load = (key, fallback) => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
};

const exportData = () => {
  const data = {
    regime: load("regime", []),
    weight: load("weight", []),
    measures: load("measures", [])
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fasting-backup.json";
  a.click();
};

const importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.regime) save("regime", data.regime);
      if (data.weight) save("weight", data.weight);
      if (data.measures) save("measures", data.measures);

      alert("Data imported successfully!");
      window.location.reload();
    } catch {
      alert("Invalid file!");
    }
  };

  reader.readAsText(file);
};

/* ---------------- APP ---------------- */

export default function App() {
  const [tab, setTab] = useState("regime");

  return (
    <div lang="bg" style={{
      padding: 20,
      maxWidth: 420,
      margin: "auto",
      fontFamily: "sans-serif",
      background: "#f9f9f9"
    }}>
      <h2>Cycle Intermittent Fasting</h2>

      <div style={{ marginBottom: 10 }}>
        <button onClick={exportData}>
          Export
        </button>

        <label style={{ marginLeft: 10 }}>
          Import
          <input
            type="file"
            accept="application/json"
            onChange={importData}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        {["regime", "weight", "measures", "charts"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              marginRight: 5,
              background: tab === t ? "#ff69b4" : "#e0ffe0",
              color: "black",
              border: "none",
              padding: "6px 10px",
              borderRadius: 6
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "regime" && <Regime />}
      {tab === "weight" && <Weight />}
      {tab === "measures" && <Measures />}
      {tab === "charts" && <Charts />}
    </div>
  );
}


/* ---------------- REGIME ---------------- */
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

function Regime() {
  const [rows, setRows] = React.useState(() =>
    load("regime", defaultRows)
  );

  React.useEffect(() => {
    save("regime", rows);
  }, [rows]);

  const add = () => {
    setRows([
      ...rows,
      {
        id: rows.length + 1,
        date: "",
        last: "",
        breakfast: "",
        fasting: pattern[rows.length] ?? 13,
        done: false,
      },
    ]);
  };

  const setDate = (i, value) => {
    const updated = [...rows];
    const start = new Date(value);
    for (let j = i; j < updated.length; j++) {
      const d = new Date(start);
      d.setDate(d.getDate() + (j - i));
      updated[j].date = d.toISOString().slice(0, 10);
    }
    setRows(updated);
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
        String(bh).padStart(2, "0") +
        ":" +
        String(bm).padStart(2, "0");
    }

    setRows(updated);
  };

  const toggleDone = (i) => {
    const updated = [...rows];
    updated[i].done = !updated[i].done;
    setRows(updated);
  };

  const startNewCycle = () => {
    const ok = window.confirm(
      "Start new cycle? This will reset all data but keep the structure."
    );
    if (!ok) return;

    const resetRows = Array.from({ length: rows.length }, (_, i) => ({
      id: i + 1,
      date: "",
      last: "",
      breakfast: "",
      fasting: pattern[i] ?? 13,
      done: false,
    }));

    setRows(resetRows);
    save("regime", resetRows);
  };

  return (
    <div>
      {/* Buttons */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={add}>Add</button>

        <button
          onClick={startNewCycle}
          style={{ marginLeft: 10 }}
        >
          🔄 New Cycle
        </button>
      </div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "25px 100px 55px 28px 75px 40px",
          fontWeight: "bold",
          borderBottom: "1px solid #ccc",
          paddingBottom: "4px",
          marginBottom: "6px",
          fontSize: 13,
          columnGap: "6px",
        }}
      >
        <div>#</div>
        <div>Date</div>
        <div>Breakfast</div>
        <div>✔</div>
        <div>Last meal</div>
        <div>Fast</div>
      </div>

      {/* Rows */}
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "25px 100px 55px 28px 75px 40px",
            alignItems: "center",
            columnGap: "6px",
            marginBottom: "4px",
            background: i % 2 ? "#fafafa" : "white",
          }}
        >
          <div style={{ fontSize: 13 }}>{r.id}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <input
              type="date"
              value={r.date}
              onChange={(e) => setDate(i, e.target.value)}
              style={{ width: 22, padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ fontSize: 12 }}>
              {r.date
                ? (() => {
                    const [y, m, d] = r.date.split("-");
                    return `${d}.${m}.${y.slice(2)}`;
                  })()
                : "дд.мм.гг"}
            </span>
          </div>

          <div style={{ fontSize: 13 }}>{r.breakfast || "--:--"}</div>

          <button
            onClick={() => toggleDone(i)}
            style={{
              width: 22,
              height: 22,
              padding: 0,
              fontSize: 12,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: r.done ? "#ff69b4" : "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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

          <div style={{ fontSize: 13 }}>{r.fasting}h</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- WEIGHT ---------------- */
function Weight() {
  const [data, setData] = useState(() => load("weight", []));
  const [form, setForm] = useState({ date: "", weight: "" });

  const add = () => {
    if (!form.date || !form.weight) return;

    const newData = [form, ...data];
    setData(newData);
    save("weight", newData);

    setForm({ date: "", weight: "" });
  };

  return (
    <div>
      <input
        type="date"
        value={form.date}
        onChange={(e) =>
          setForm({ ...form, date: e.target.value })
        }
      />

      <input
        value={form.weight}
        onChange={(e) =>
          setForm({
            ...form,
            weight: e.target.value.replace(".", ",")
          })
        }
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

            setData(updated);
            save("weight", updated);
          }}>
            ✏️
          </button>

          <button onClick={() => {
            const updated = data.filter((_, idx) => idx !== i);
            setData(updated);
            save("weight", updated);
          }}>
            ❌
          </button>
        </div>
      ))}
    </div>
  );
}


/* ---------------- MEASURES ---------------- */
function Measures() {
  const [data, setData] = useState(() => load("measures", []));
  const [form, setForm] = useState({
    date: "",
    bust: "",
    under: "",
    waist: "",
    hips: "",
    thigh: "",
    calf: "",
    ankle: ""
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

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

    const updated = [newEntry, ...data];
    setData(updated);
    save("measures", updated);

    setForm({
      date: "",
      bust: "",
      under: "",
      waist: "",
      hips: "",
      thigh: "",
      calf: "",
      ankle: ""
    });
  };

  return (
    <div>

      {/* INPUT FORM */}
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <input placeholder="Bust" value={form.bust} onChange={(e) => setForm({ ...form, bust: e.target.value })} />
      <input placeholder="Under bust" value={form.under} onChange={(e) => setForm({ ...form, under: e.target.value })} />
      <input placeholder="Waist" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
      <input placeholder="Hips" value={form.hips} onChange={(e) => setForm({ ...form, hips: e.target.value })} />
      <input placeholder="Thigh" value={form.thigh} onChange={(e) => setForm({ ...form, thigh: e.target.value })} />
      <input placeholder="Calf" value={form.calf} onChange={(e) => setForm({ ...form, calf: e.target.value })} />
      <input placeholder="Ankle" value={form.ankle} onChange={(e) => setForm({ ...form, ankle: e.target.value })} />

      <button onClick={saveEntry}>Save</button>

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        {data.map((d, i) => {
          const isEditing = editingIndex === i;

          return (
            <div key={i} style={{
              border: "1px solid #ccc",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "6px"
            }}>

              <div>{d.date}</div>

              {isEditing ? (
                <>
                  <input value={editForm.bust ?? ""} onChange={e => setEditForm({ ...editForm, bust: e.target.value })} placeholder="Bust" />
                  <input value={editForm.under ?? ""} onChange={e => setEditForm({ ...editForm, under: e.target.value })} placeholder="Under" />
                  <input value={editForm.waist ?? ""} onChange={e => setEditForm({ ...editForm, waist: e.target.value })} placeholder="Waist" />
                  <input value={editForm.hips ?? ""} onChange={e => setEditForm({ ...editForm, hips: e.target.value })} placeholder="Hips" />
                  <input value={editForm.thigh ?? ""} onChange={e => setEditForm({ ...editForm, thigh: e.target.value })} placeholder="Thigh" />
                  <input value={editForm.calf ?? ""} onChange={e => setEditForm({ ...editForm, calf: e.target.value })} placeholder="Calf" />
                  <input value={editForm.ankle ?? ""} onChange={e => setEditForm({ ...editForm, ankle: e.target.value })} placeholder="Ankle" />

                  <button onClick={() => {
                    const updated = [...data];

                    updated[i] = {
                      ...updated[i],
                      bust: editForm.bust ? Number(editForm.bust) : null,
                      under: editForm.under ? Number(editForm.under) : null,
                      waist: editForm.waist ? Number(editForm.waist) : null,
                      hips: editForm.hips ? Number(editForm.hips) : null,
                      thigh: editForm.thigh ? Number(editForm.thigh) : null,
                      calf: editForm.calf ? Number(editForm.calf) : null,
                      ankle: editForm.ankle ? Number(editForm.ankle) : null,
                    };

                    setData(updated);
                    save("measures", updated);
                    setEditingIndex(null);
                  }}>
                    Save
                  </button>

                  <button onClick={() => setEditingIndex(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div>Bust: {d.bust ?? "-"}</div>
                  <div>Under: {d.under ?? "-"}</div>
                  <div>Waist: {d.waist ?? "-"}</div>
                  <div>Hips: {d.hips ?? "-"}</div>
                  <div>Thigh: {d.thigh ?? "-"}</div>
                  <div>Calf: {d.calf ?? "-"}</div>
                  <div>Ankle: {d.ankle ?? "-"}</div>

                  <button onClick={() => {
                    setEditingIndex(i);
                    setEditForm(d);
                  }}>
                    Edit
                  </button>

                  <button onClick={() => {
                    const updated = data.filter((_, idx) => idx !== i);
                    setData(updated);
                    save("measures", updated);
                  }}>
                    X
                  </button>
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
function Charts() {
  const [range, setRange] = useState("3m");
  const weightData = load("weight", [])
    .map(d => ({
      date: d.date,
      value: Number(d.weight?.replace(",", "."))
    }))
    .filter(d => !isNaN(d.value));
  const measures = load("measures", []);

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
      .map(d => ({
        date: d.date,
        value: clean(d[key])
      }))
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

            <Line
              type="monotone"
              dataKey="value"
              stroke="#000"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div>
      {/* FILTER BUTTONS */}
      <div style={{ marginBottom: 15 }}>
        {[
          { label: "1M", value: "1m" },
          { label: "3M", value: "3m" },
          { label: "6M", value: "6m" },
          { label: "1Y", value: "1y" }
        ].map(btn => (
          <button
            key={btn.value}
            onClick={() => setRange(btn.value)}
            style={{
              marginRight: 5,
              background: range === btn.value ? "black" : "white",
              color: range === btn.value ? "white" : "black"
            }}
          >
            {btn.label}
          </button>
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

              <Line
                type="monotone"
                dataKey="value"
                stroke="green"
                strokeWidth={2}
                dot
              />
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
