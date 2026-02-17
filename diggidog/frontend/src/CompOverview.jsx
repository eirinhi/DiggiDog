import { useEffect, useState } from "react";
import "./CompOverview.css";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCompetitions() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/get_comps/`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const comps = await res.json();
        if (!cancelled) {
          setCompetitions(Array.isArray(comps) ? comps : []);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Could not reach server. Is Django running?");
          setCompetitions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompetitions();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="comp-container" >
      <header className="comp-header">
        <h2 className="comp-title">Competitions</h2>
        <p className="comp-subtitle">Browse active and upcoming competitions.</p>
      </header>

      {loading && <p className="comp-state">Loading competitions…</p>}

      {!loading && error && (
        <div className="comp-error">
          <strong>Something went wrong:</strong>
          <div className="comp-error-msg">{error}</div>
        </div>
      )}

      {!loading && !error && competitions.length === 0 && (
        <p className="comp-state">No competitions found.</p>
      )}

      {!loading && !error && competitions.length > 0 && (
        <div className="comp-grid">
          {competitions.map((c) => (
            <article key={c.id} className="comp-card">
              <div className="comp-card-top">
                <h3 className="comp-card-title">{c.name}</h3>
              </div>

              <p className="comp-card-desc">
                {c.description || "No description"}
              </p>

              <dl className="comp-meta">
                <div className="comp-meta-row">
                  <dt>Start</dt>
                  <dd>{formatDate(c.start_date)}</dd>
                </div>
                <div className="comp-meta-row">
                  <dt>End</dt>
                  <dd>{formatDate(c.end_date)}</dd>
                </div>
                <div className="comp-meta-row">
                  <dt>Max participants</dt>
                  <dd>{c.max_participants ?? "-"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}