import { useEffect, useState } from "react";
import "./CompOverview.css";
import Ad from "./components/Ad.jsx";
import { Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";


const DJANGO_HOST = "http://127.0.0.1:8000";

function toImageUrl(picture) {
  if (!picture) return null;
  if (picture.startsWith("data:")) return picture; // Base64 data URL
  if (picture.startsWith("http")) return picture;
  return `${DJANGO_HOST}${picture}`; // picture like "/media/competition_pics/..."
}



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
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUser = () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        try {
          setLoggedIn(true);
          const user = JSON.parse(savedUser);
          setIsAdmin(!!user?.is_admin);
        } catch {
          setLoggedIn(false);
          setIsAdmin(false);
        }
      } else {
        setLoggedIn(false);
        setIsAdmin(false);
      }
    };

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
    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => {
      cancelled = true;
      window.removeEventListener("userChanged", checkUser);
    };
  }, []);

  return (
    <div className="compLayout">
      <aside className="compSideAd">
        <div className="compAdBox">
          {isAdmin && (
            <Link className="compAddAdLink" to="/upload_ad">+ Add Ad</Link>
          )}
          <Ad />
          <Ad />
          <Ad />
          <Ad />
        </div>
      </aside>
      <section className="comp-container">
        <header className="comp-header">
          <div className="comp-header-content">
            <h2 className="comp-title">Competitions</h2>
            <p className="comp-subtitle">Browse active and upcoming competitions.</p>
          </div>
          <div className="comp-header-action">
            {loggedIn && isAdmin && (
              <Link className="btn-create" to="/create_comps">Create Competition</Link>
            )}
          </div>
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
      {competitions.map((c) => {
        const imgUrl = toImageUrl(c.picture);

        return (
          <Link key={c.id} to={`/competition/${c.id}`} className="comp-card-link">
            <article className="comp-card">
              {imgUrl && (
                <img
                  className="comp-card-img"
                  src={imgUrl}
                  alt={`${c.name} cover`}
                  loading="lazy"
                />
              )}

              <div className="comp-card-top">
                <h3 className="comp-card-title">{c.name}</h3>
              </div>

              <p className="comp-card-desc">{c.description || "No description"}</p>

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
          </Link>
        );
      })}
        </div>
        )}
      </section>
    </div>
  );
}