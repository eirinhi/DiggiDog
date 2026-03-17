import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./userprofile.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserAndDogs = async () => {
      setLoading(true);
      setError("");

      try {
        const userResponse = await fetch(`${API_BASE}/users/${userId}/`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        } else {
          setUser({
            id: userId,
            username: "Unknown",
            name: "Unknown",
          });
        }

        const dogsResponse = await fetch(`${API_BASE}/dogs/?owner=${userId}`);
        if (dogsResponse.ok) {
          const dogsData = await dogsResponse.json();
          setDogs(dogsData || []);
        }
      } catch (err) {
        setError("Failed to load user profile. Please try again.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDogs();
  }, [userId]);

  if (loading) {
    return (
      <div className="userProfile">
        <div className="userProfile__container">
          <p className="userProfile__loading">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="userProfile">
        <div className="userProfile__container">
          <p className="userProfile__error">{error}</p>
        </div>
      </div>
    );
  }

  const initials = (user?.name || user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <div className="userProfile">
      <div className="userProfile__container">
        <div className="userProfile__card">
          {user && (
            <div className="userProfile__profileHeader">
              <div className="userProfile__avatar">{initials}</div>
              <div className="userProfile__profileInfo">
                <h2 className="userProfile__displayName">{user.name || "No name set"}</h2>
                <p className="userProfile__username">@{user.username}</p>
              </div>
            </div>
          )}

          <div className="userProfile__section">
            <label className="userProfile__label">Name</label>
            <p className="userProfile__value">{user?.name || "No name set"}</p>
          </div>

          <div className="userProfile__section">
            <label className="userProfile__label">Bio</label>
            <p className="userProfile__value">{user?.bio || "No bio yet"}</p>
          </div>

          <hr className="userProfile__separator" />

          <h2 className="userProfile__dogsTitle">Dogs</h2>

          {dogs.length === 0 ? (
            <p className="userProfile__noDogs">This user has no dogs yet.</p>
          ) : (
            <div className="userProfile__dogsList">
              {dogs.map((dog) => (
                <div key={dog.id} className="userProfile__dogCard">
                  {dog.picture && (
                    <img className="userProfile__dogImage" src={dog.picture} alt={dog.name} />
                  )}
                  <div className="userProfile__dogInfo">
                    <h3 className="userProfile__dogName">{dog.name}</h3>
                    <p className="userProfile__dogBreed">{dog.breed}</p>
                    <p className="userProfile__dogAge">Age: {dog.age} years</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
