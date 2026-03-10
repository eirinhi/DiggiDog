import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./competition.css";

const API_BASE = "http://127.0.0.1:8000/api";
const DJANGO_HOST = "http://127.0.0.1:8000";

function toImageUrl(picture) {
  if (!picture) return null;
  if (picture.startsWith("data:")) return picture;
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
  const [showParticipateModal, setShowParticipateModal] = useState(false);
  const [userDogs, setUserDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [participateLoading, setParticipateLoading] = useState(false);
  const [userParticipatingDogs, setUserParticipatingDogs] = useState([]);

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

    const userHasParticipatingDogs = participants.some(p => p.user_id === user.id);
    if (competition && participants.length >= competition.max_participants && !userHasParticipatingDogs) {
      alert("This competition has reached the maximum number of dogs and you don't have any dogs entered.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/dogs/?owner=${user.id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch your dogs");
      }

      const dogs = await res.json();
      const participatingDogIds = participants.map(p => p.dog_id);
      const availableDogs = dogs.filter(dog => !participatingDogIds.includes(dog.id));
      const userParticipating = participants.filter(p => p.user_id === user.id).map(p => {
        const dog = dogs.find(d => d.id === p.dog_id);
        return dog ? { ...dog, participant_id: p.id } : null;
      }).filter(Boolean);

      setUserDogs(availableDogs);
      setUserParticipatingDogs(userParticipating);
      setSelectedDog(null);
      setShowParticipateModal(true);
    } catch (err) {
      console.error("Error fetching dogs:", err);
      alert("Failed to load your dogs. Please try again.");
    }
  };

  const handleDogSelect = (dog) => {
    setSelectedDog(dog);
  };

  const handleSubmitParticipation = async () => {
    if (!selectedDog) {
      alert("Please select a dog to participate");
      return;
    }

    setParticipateLoading(true);

    try {
      const res = await fetch(`${API_BASE}/participants/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          competition_id: id,
          dog_id: selectedDog.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Successfully registered for the competition!");
        setShowParticipateModal(false);
        window.location.reload();
      } else {
        alert(`Error: ${data.error || "Failed to register"}`);
      }
    } catch (err) {
      console.error("Error registering participant:", err);
      alert("Failed to register. Please try again.");
    } finally {
      setParticipateLoading(false);
    }
  };

  const handleRemoveParticipation = async (participantId) => {
    if (!confirm("Are you sure you want to remove this dog from the competition?")) {
      return;
    }

    setParticipateLoading(true);

    try {
      const res = await fetch(`${API_BASE}/participants/${participantId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        alert("Successfully removed from the competition!");
        setShowParticipateModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to remove"}`);
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Failed to remove. Please try again.");
    } finally {
      setParticipateLoading(false);
    }
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
                <span className="detail-label">Participants:</span>
                <span className="detail-value">{participants.length} / {competition.max_participants}</span>
              </div>
            </div>
            <button
              className="participate-btn"
              onClick={handleParticipate}
              disabled={!loggedIn || (competition && participants.length >= competition.max_participants && !participants.some(p => p.user_id === user?.id))}
            >
              {loggedIn
                ? (competition && participants.length >= competition.max_participants
                    ? (participants.some(p => p.user_id === user?.id)
                        ? "Manage Participation"
                        : "Competition Full")
                    : "Participate")
                : "Login to Participate"}
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

      {/* Participation Modal */}
      {showParticipateModal && (
        <div className="modal-overlay" onClick={() => setShowParticipateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {competition && participants.length >= competition.max_participants
                  ? "Manage Your Participation"
                  : "Select a Dog to Participate"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowParticipateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Participating Dogs Section */}
              {userParticipatingDogs.length > 0 && (
                <div className="participating-section">
                  <h3>Your Participating Dogs</h3>
                  <div className="dogs-list">
                    {userParticipatingDogs.map((dog) => (
                      <div key={dog.id} className="dog-option participating">
                        <div className="dog-option-content">
                          {dog.picture && (
                            <img
                              src={toImageUrl(dog.picture)}
                              alt={dog.name}
                              className="dog-option-image"
                            />
                          )}
                          <div className="dog-option-info">
                            <h3>{dog.name}</h3>
                            <p>Age: {dog.age}, Breed: {dog.breed}</p>
                            <span className="participating-badge">Participating</span>
                          </div>
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveParticipation(dog.participant_id)}
                            disabled={participateLoading}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Dogs Section - Only show if competition not at max capacity */}
              {(!competition || participants.length < competition.max_participants) && (
                <div className="available-section">
                  <h3>Add More Dogs</h3>
                  {userDogs.length === 0 ? (
                    <div className="no-dogs-message">
                      <p>You don't have any additional dogs available to participate.</p>
                      {userParticipatingDogs.length > 0 && (
                        <p>All your other dogs are already registered for this competition.</p>
                      )}
                    </div>
                  ) : (
                    <div className="dogs-selection">
                      <p>Choose one of your dogs to enter in this competition:</p>
                      <div className="dogs-list">
                        {userDogs.map((dog) => (
                          <div
                            key={dog.id}
                            className={`dog-option ${selectedDog?.id === dog.id ? 'selected' : ''}`}
                            onClick={() => handleDogSelect(dog)}
                          >
                            <div className="dog-option-content">
                              {dog.picture && (
                                <img
                                  src={toImageUrl(dog.picture)}
                                  alt={dog.name}
                                  className="dog-option-image"
                                />
                              )}
                              <div className="dog-option-info">
                                <h3>{dog.name}</h3>
                                <p>Age: {dog.age}, Breed: {dog.breed}</p>
                              </div>
                              <div className="dog-radio">
                                <div className={`radio-circle ${selectedDog?.id === dog.id ? 'checked' : ''}`}>
                                  {selectedDog?.id === dog.id && <div className="radio-dot"></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show message when at max capacity and no dogs to remove */}
              {competition && participants.length >= competition.max_participants && userParticipatingDogs.length === 0 && (
                <div className="no-dogs-message">
                  <p>This competition has reached the maximum number of dogs.</p>
                  <p>You don't have any dogs participating that you can remove.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowParticipateModal(false)}
              >
                Close
              </button>
              {(!competition || participants.length < competition.max_participants) && (
                <button
                  className="btn-primary"
                  onClick={handleSubmitParticipation}
                  disabled={!selectedDog || participateLoading || userDogs.length === 0}
                >
                  {participateLoading ? "Registering..." : "Register Dog"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}