import React, { useState, useEffect } from "react";
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
    <div style={{
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

function Regime() {
  const [rows, setRows] = useState(() =>
    load("regime", Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      date: "",
      breakfast: "",
      last: "",
      fasting: pattern[i],
      done: false
    })))
  );

  useEffect(() => save("regime", rows), [rows]);

  const setDate = (i, val) => {
    const newRows = [...rows];
    const start = new Date(val);

    for (let j = i; j < newRows.length; j++) {
      const d = new Date(start);
      d.setDate(d.getDate() + (j - i));
      newRows[j].date = d.toISOString().slice(0, 10);
    }

    setRows(newRows);
  };

  const setLast = (i, val) => {
    const newRows = [...rows];
    newRows[i].last = val;

    if (val && newRows[i + 1]) {
      const [h, m] = val.split(":");
      const d = new Date();
      d.setHours(+h + newRows[i].fasting, +m);
      newRows[i + 1].breakfast =
        d.getHours().toString().padStart(2, "0") +
        ":" +
        d.getMinutes().toString().padStart(2, "0");
    }

    setRows(newRows);
  };

  return (
    <div>
      {rows.map((r, i) => (
  <div key={i} style={{
    display: "grid",
    gridTemplateColumns: "30px 120px 60px 120px 80px",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px"
  }}>
          <div>{r.id}</div>

          <input
            type="date"
            value={r.date}
            onChange={(e) => setDate(i, e.target.value)}
          />

          <div>{r.breakfast || "--:--"}</div>

          <input
            type="time"
            value={r.last}
            onChange={(e) => setLast(i, e.target.value)}
          />

          <div>{r.fasting}h</div>

          <button
            onClick={() => {
              const n = [...rows];
              n[i].done = !n[i].done;
              setRows(n);
            }}
          >
            {r.done ? "✔" : ""}
          </button>
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

      <input placeholder="Bust" value={form.bust} onChange={(e)=>setForm({...form,bust:e.target.value})}/>
      <input placeholder="Under bust" value={form.under} onChange={(e)=>setForm({...form,under:e.target.value})}/>
      <input placeholder="Waist" value={form.waist} onChange={(e)=>setForm({...form,waist:e.target.value})}/>
      <input placeholder="Hips" value={form.hips} onChange={(e)=>setForm({...form,hips:e.target.value})}/>
      <input placeholder="Thigh" value={form.thigh} onChange={(e)=>setForm({...form,thigh:e.target.value})}/>
      <input placeholder="Calf" value={form.calf} onChange={(e)=>setForm({...form,calf:e.target.value})}/>
      <input placeholder="Ankle" value={form.ankle} onChange={(e)=>setForm({...form,ankle:e.target.value})}/>

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
                  <input value={editForm.bust ?? ""} onChange={e=>setEditForm({...editForm,bust:e.target.value})} placeholder="Bust"/>
                  <input value={editForm.under ?? ""} onChange={e=>setEditForm({...editForm,under:e.target.value})} placeholder="Under"/>
                  <input value={editForm.waist ?? ""} onChange={e=>setEditForm({...editForm,waist:e.target.value})} placeholder="Waist"/>
                  <input value={editForm.hips ?? ""} onChange={e=>setEditForm({...editForm,hips:e.target.value})} placeholder="Hips"/>
                  <input value={editForm.thigh ?? ""} onChange={e=>setEditForm({...editForm,thigh:e.target.value})} placeholder="Thigh"/>
                  <input value={editForm.calf ?? ""} onChange={e=>setEditForm({...editForm,calf:e.target.value})} placeholder="Calf"/>
                  <input value={editForm.ankle ?? ""} onChange={e=>setEditForm({...editForm,ankle:e.target.value})} placeholder="Ankle"/>

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
	  {buildChart("thigh")}
      {buildChart("hips")}
	  {buildChart("calf")}
	  {buildChart("ankle")}
    </div>
  );
}