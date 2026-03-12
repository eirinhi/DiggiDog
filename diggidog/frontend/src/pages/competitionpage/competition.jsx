import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, MessageCircle, Send, Trash2, X } from "lucide-react";
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

  const [likeCounts, setLikeCounts] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [commentCounts, setCommentCounts] = useState({});

  const [commentModalParticipant, setCommentModalParticipant] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

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

  const fetchLikesAndComments = async (parts, currentUser) => {
    const likeCountsMap = {};
    const userLikesMap = {};
    const commentCountsMap = {};

    await Promise.all(
      parts.map(async (p) => {
        try {
          const likesRes = await fetch(`${API_BASE}/get_likes/?participant_id=${p.id}`);
          if (likesRes.ok) {
            const data = await likesRes.json();
            likeCountsMap[p.id] = data.likes.length;
            if (currentUser) {
              userLikesMap[p.id] = data.likes.some((l) => l.user_id === currentUser.id);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch likes for participant ${p.id}:`, err);
        }

        try {
          const commentsRes = await fetch(`${API_BASE}/participants/${p.id}/comments/`);
          if (commentsRes.ok) {
            const data = await commentsRes.json();
            commentCountsMap[p.id] = data.length;
          }
        } catch (err) {
          console.error(`Failed to fetch comments for participant ${p.id}:`, err);
        }
      })
    );

    setLikeCounts(likeCountsMap);
    setUserLikes(userLikesMap);
    setCommentCounts(commentCountsMap);
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

          const savedUser = localStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          fetchLikesAndComments(parts, currentUser);
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

  const handleLike = async (participantId) => {
    if (!loggedIn || !user) {
      alert("Please log in to like");
      return;
    }

    const alreadyLiked = userLikes[participantId];

    if (alreadyLiked) {
      try {
        const res = await fetch(`${API_BASE}/unlike_participant/`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, participant_id: participantId }),
        });
        if (res.ok) {
          setUserLikes((prev) => ({ ...prev, [participantId]: false }));
          setLikeCounts((prev) => ({ ...prev, [participantId]: (prev[participantId] || 1) - 1 }));
        }
      } catch (err) {
        console.error("Error unliking:", err);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/like_participant/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, participant_id: participantId }),
        });
        if (res.ok) {
          setUserLikes((prev) => ({ ...prev, [participantId]: true }));
          setLikeCounts((prev) => ({ ...prev, [participantId]: (prev[participantId] || 0) + 1 }));
        }
      } catch (err) {
        console.error("Error liking:", err);
      }
    }
  };

  const openCommentModal = async (participant) => {
    if (!loggedIn || !user) {
      alert("Please log in to comment");
      return;
    }

    setCommentModalParticipant(participant);
    setNewComment("");
    setCommentsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/participants/${participant.id}/comments/`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !commentModalParticipant || !user) return;

    try {
      const res = await fetch(`${API_BASE}/comments/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          participant_id: commentModalParticipant.id,
          text: newComment.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [
          {
            id: data.comment.id,
            user_id: user.id,
            username: user.username,
            text: data.comment.text,
            created_at: data.comment.created_at,
          },
          ...prev,
        ]);
        setNewComment("");
        setCommentCounts((prev) => ({
          ...prev,
          [commentModalParticipant.id]: (prev[commentModalParticipant.id] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Error creating comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}/delete/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCounts((prev) => ({
          ...prev,
          [commentModalParticipant.id]: Math.max((prev[commentModalParticipant.id] || 1) - 1, 0),
        }));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

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
      const removedDog = userParticipatingDogs.find((dog) => dog.participant_id === participantId);
      const res = await fetch(`${API_BASE}/participants/${participantId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setUserParticipatingDogs((prev) => prev.filter((dog) => dog.participant_id !== participantId));
        if (removedDog) {
          setUserDogs((prev) => [...prev, {
            id: removedDog.id,
            name: removedDog.name,
            age: removedDog.age,
            breed: removedDog.breed,
            picture: removedDog.picture,
          }]);
        }
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        alert("Successfully removed from the competition!");
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
              <div
                key={participant.id}
                className="dog-card"
                onClick={() => openCommentModal(participant)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCommentModal(participant);
                  }
                }}
                role="button"
                tabIndex={0}
                title={loggedIn ? "Open comments" : "Log in to comment"}
              >
                {participant.dog?.picture && (
                  <img
                    src={toImageUrl(participant.dog.picture)}
                    alt={participant.dog.name}
                    className="dog-image"
                  />
                )}
                <div className="dog-info">
                  <div className="dog-info-layout">
                    <div className="dog-info-main">
                      <h3 className="dog-name">{participant.dog?.name || "Unknown Dog"}</h3>
                      <p className="dog-owner">Owner: {participant.dog?.owner_name || "Unknown"}</p>
                      <p className="dog-details">
                        Age: {participant.dog?.age || "N/A"}, Breed: {participant.dog?.breed || "N/A"}
                      </p>
                    </div>
                    {user && participant.user_id === user.id && (
                      <button
                        type="button"
                        className={`participating-remove-btn ${participateLoading ? "disabled" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!participateLoading) {
                            handleRemoveParticipation(participant.id);
                          }
                        }}
                        title="Remove from competition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="dog-card-actions">
                  <span
                    className={`action-icon-btn ${userLikes[participant.id] ? "liked" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(participant.id);
                    }}
                    title={loggedIn ? (userLikes[participant.id] ? "Unlike" : "Like") : "Log in to like"}
                  >
                    <Heart
                      size={18}
                      fill={userLikes[participant.id] ? "currentColor" : "none"}
                    />
                    <span className="action-count">{likeCounts[participant.id] || 0}</span>
                  </span>
                  <span
                    className="action-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCommentModal(participant);
                    }}
                    title={loggedIn ? "Comments" : "Log in to comment"}
                  >
                    <MessageCircle size={18} />
                    <span className="action-count">{commentCounts[participant.id] || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {commentModalParticipant && (
        <div className="modal-overlay" onClick={() => setCommentModalParticipant(null)}>
          <div className="comment-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setCommentModalParticipant(null)}
            >
              &times;
            </button>
            <div className="comment-modal-layout">
              <div className="comment-modal-image-section">
                {commentModalParticipant.dog?.picture ? (
                  <img
                    src={toImageUrl(commentModalParticipant.dog.picture)}
                    alt={commentModalParticipant.dog?.name}
                    className="comment-modal-dog-image"
                  />
                ) : (
                  <div className="comment-modal-no-image">No image</div>
                )}
                <div className="comment-modal-dog-info">
                  <h3>{commentModalParticipant.dog?.name || "Unknown Dog"}</h3>
                  <p>Owner: {commentModalParticipant.dog?.owner_name || "Unknown"}</p>
                </div>
              </div>
              <div className="comment-modal-comments-section">
                <h3 className="comments-title">Comments</h3>
                <div className="comments-list">
                  {commentsLoading ? (
                    <p className="comments-loading">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="no-comments">No comments yet. Be the first!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-username">{comment.username}</span>
                          {user && comment.user_id === user.id && (
                            <span
                              className="comment-delete-icon"
                              onClick={() => handleDeleteComment(comment.id)}
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </span>
                          )}
                        </div>
                        <span className="comment-text">{comment.text}</span>
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="comment-input-area">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitComment();
                    }}
                    maxLength={250}
                  />
                  <span
                    className={`comment-send-icon ${!newComment.trim() ? "disabled" : ""}`}
                    onClick={() => { if (newComment.trim()) handleSubmitComment(); }}
                  >
                    <Send size={18} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showParticipateModal && (
        <div className="modal-overlay" onClick={() => setShowParticipateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select a Dog to Participate</h2>
              <button
                className="modal-close participate-modal-close"
                onClick={() => setShowParticipateModal(false)}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="modal-body">
              {(!competition || participants.length < competition.max_participants) && (
                <div className="available-section">
                  <h3>Add More Dogs</h3>
                  {userDogs.length === 0 ? (
                    <div className="no-dogs-message">
                      <p>You don't have any additional dogs available to participate.</p>
                      <p>Go to your profile to register more dogs.</p>
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

              {competition && participants.length >= competition.max_participants && (
                <div className="no-dogs-message">
                  <p>This competition has reached the maximum number of dogs.</p>
                  <p>You can remove your dogs from the Participating Dogs section.</p>
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
