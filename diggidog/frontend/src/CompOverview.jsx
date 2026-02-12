import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function CompOverview() {
  const [competitions, setCompetitions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await fetch(`${API_BASE}/get_comps/`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = await res.json();

        // make sure competitions is ALWAYS an array
        const comps = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.competitions)
          ? data.competitions
          : [];

        setCompetitions(comps);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not reach server. Is Django running?");
        setCompetitions([]);
      }
    }

    fetchCompetitions();
  }, []);

  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Competitions</h2>

      {competitions.length === 0 ? (
        <p>No competitions found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {competitions.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <h3 style={{ margin: "0 0 8px" }}>{c.name}</h3>

              <p style={{ margin: "0 0 8px", opacity: 0.85 }}>
                {c.description || "No description"}
              </p>

              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                <div>
                  <strong>Start:</strong> {formatDate(c.start_date)}
                </div>
                <div>
                  <strong>End:</strong> {formatDate(c.end_date)}
                </div>
                <div>
                  <strong>Max participants:</strong>{" "}
                  {c.max_participants ?? "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
