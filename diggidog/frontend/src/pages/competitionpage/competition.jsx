import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./competition.css";

const API_BASE = "http://127.0.0.1:8000/api";
const DJANGO_HOST = "http://127.0.0.1:8000";

function toImageUrl(picture) {
  if (!picture) return null;
  if (picture.startsWith("http")) return picture;
  return `${DJANGO_HOST}${picture}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function Competition_page() {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const checkUser = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setLoggedIn(true);
      setUser(JSON.parse(savedUser));
    } else {
      setLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchCompetitionData() {
      try {
        setLoading(true);

        const compRes = await fetch(`${API_BASE}/get_comps/`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!compRes.ok) {
          throw new Error(`Failed to fetch competitions: ${compRes.status}`);
        }

        const competitions = await compRes.json();
        const comp = competitions.find(c => c.id === parseInt(id));

        if (!comp) {
          throw new Error("Competition not found");
        }

        const partRes = await fetch(`${API_BASE}/competitions/${id}/participants/`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!partRes.ok) {
          throw new Error(`Failed to fetch participants: ${partRes.status}`);
        }

        const parts = await partRes.json();

        const dogsPromises = parts.map(async (p) => {
          try {
            const dogRes = await fetch(`${API_BASE}/dogs/${p.dog_id}/`, {
              method: "GET",
              headers: { Accept: "application/json" },
            });
            if (dogRes.ok) {
              const dog = await dogRes.json();
              return { ...p, dog };
            }
            return p;
          } catch (err) {
            console.error(`Failed to fetch dog ${p.dog_id}:`, err);
            return p;
          }
        });

        const participantsWithDogs = await Promise.all(dogsPromises);

        if (!cancelled) {
          setCompetition(comp);
          setParticipants(participantsWithDogs);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Could not load competition data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompetitionData();
    checkUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleParticipate = async () => {
    if (!loggedIn || !user) {
      alert("Please log in to participate");
      return;
    }

    alert("Participation feature coming soon!");
  };

  if (loading) {
    return (
      <div className="competition-page">
        <div className="loading">Loading competition...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="competition-page">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="competition-page">
        <div className="error">
          <h2>Competition Not Found</h2>
          <p>The competition you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const compImageUrl = toImageUrl(competition.picture);

  return (
    <div className="competition-page">
      {compImageUrl && (
        <div className="competition-header">
          <img
            src={compImageUrl}
            alt={`${competition.name} cover`}
            className="competition-image"
          />
        </div>
      )}

      <div className="competition-content">
        <div className="competition-left">
          <h1 className="competition-title">{competition.name}</h1>
          <p className="competition-description">
            {competition.description || "No description available."}
          </p>
        </div>

        <div className="competition-right">
          <div className="details-box">
            <h2>Details:</h2>
            <div className="details-content">
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{formatDate(competition.start_date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">{formatDate(competition.end_date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Maximum Participants:</span>
                <span className="detail-value">{competition.max_participants}</span>
              </div>
            </div>
            <button
              className="participate-btn"
              onClick={handleParticipate}
              disabled={!loggedIn}
            >
              {loggedIn ? "Participate" : "Login to Participate"}
            </button>
          </div>
        </div>
      </div>

      <div className="participating-dogs">
        <h2>Participating Dogs:</h2>
        {participants.length === 0 ? (
          <p className="no-dogs">No dogs have registered for this competition yet.</p>
        ) : (
          <div className="dogs-grid">
            {participants.map((participant) => (
              <div key={participant.id} className="dog-card">
                {participant.dog?.picture && (
                  <img
                    src={toImageUrl(participant.dog.picture)}
                    alt={participant.dog.name}
                    className="dog-image"
                  />
                )}
                <div className="dog-info">
                  <h3 className="dog-name">{participant.dog?.name || "Unknown Dog"}</h3>
                  <p className="dog-owner">Owner: {participant.dog?.owner_name || "Unknown"}</p>
                  <p className="dog-details">
                    Age: {participant.dog?.age || "N/A"}, Breed: {participant.dog?.breed || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}