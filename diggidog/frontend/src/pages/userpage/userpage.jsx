import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userpage.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Userpage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
  });
  const [savedDogs, setSavedDogs] = useState([]);
  const [newDogs, setNewDogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    setProfile({
      name: parsed.name || "",
      bio: parsed.bio || "",
    });

    fetch(`${API_BASE}/dogs/?owner=${parsed.id}`)
      .then((res) => res.json())
      .then((data) => setSavedDogs(data))
      .catch(() => setSavedDogs([]));
  }, [navigate]);

  const handleDeleteDog = async (dogId) => {
    try {
      const res = await fetch(`${API_BASE}/dogs/${dogId}/delete/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedDogs(savedDogs.filter((dog) => dog.id !== dogId));
      }
    } catch (err) {
      setError("Could not delete dog");
    }
  };

  const handleAddDog = () => {
    setNewDogs([...newDogs, { name: "", breed: "", age: "" }]);
  };

  const handleRemoveNewDog = (index) => {
    setNewDogs(newDogs.filter((_, i) => i !== index));
  };

  const handleNewDogImage = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = newDogs.map((dog, i) =>
        i === index ? { ...dog, imagePreview: e.target.result, imageBase64: e.target.result } : dog
      );
      setNewDogs(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleNewDogChange = (index, field, value) => {
    const updated = newDogs.map((dog, i) =>
      i === index
        ? {
            ...dog,
            [field]: value,
            nameError: field === "name" ? "" : dog.nameError,
            breedError: field === "breed" ? "" : dog.breedError,
            ageError: field === "age" ? "" : dog.ageError,
          }
        : dog
    );
    setNewDogs(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const profileRes = await fetch(`${API_BASE}/profile/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: profile.name,
          bio: profile.bio,
        }),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        throw new Error(data.error || "Could not update profile");
      }

      const profileData = await profileRes.json();
      const updatedUser = { ...user, ...profileData.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("userChanged"));

      let hasError = false;
      const validatedDogs = newDogs.map((dog) => {
        const errors = { nameError: "", breedError: "", ageError: "" };
        if (!dog.name.trim()) {
          errors.nameError = "Name is required.";
          hasError = true;
        }
        if (!dog.breed.trim()) {
          errors.breedError = "Breed is required.";
          hasError = true;
        }
        if (!dog.age) {
          errors.ageError = "Age is required.";
          hasError = true;
        } else if (parseInt(dog.age) > 30) {
          errors.ageError = "Age cannot exceed 30.";
          hasError = true;
        }
        return { ...dog, ...errors };
      });

      if (hasError) {
        setNewDogs(validatedDogs);
        setSaving(false);
        return;
      }

      for (const dog of newDogs) {

        const res = await fetch(`${API_BASE}/dogs/create/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dog.name,
            breed: dog.breed,
            age: parseInt(dog.age),
            owner: user.id,
            picture: dog.imageBase64 || "",
          }),
        });

        if (!res.ok) {
          throw new Error("Could not save dog");
        }
      }

      const dogsRes = await fetch(`${API_BASE}/dogs/?owner=${user.id}`);
      const dogsData = await dogsRes.json();
      setSavedDogs(dogsData);
      setNewDogs([]);

      setMessage("Profile is saved!");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const initials = (profile.name || user.username || "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="userpage">
      <div className="userpage__container">
        <div className="userpage__header">
          <h1 className="userpage__title">My Profile</h1>
        </div>

        <div className="userpage__card">
          {/* Profilheader med avatar */}
          <div className="userpage__profileHeader">
            <div className="userpage__avatar">{initials}</div>
            <div className="userpage__profileInfo">
              <h2 className="userpage__displayName">
                {profile.name || "Set your name"}
              </h2>
              <p className="userpage__username">@{user.username}</p>
            </div>
          </div>

          {/* Navn */}
          <div className="userpage__section">
            <label className="userpage__label">Name</label>
            <input
              className="userpage__input"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              placeholder="Ditt navn"
            />
          </div>

          {/* Bio */}
          <div className="userpage__section">
            <label className="userpage__label">Bio</label>
            <input
              className="userpage__input"
              value={profile.bio}
              onChange={(e) =>
                setProfile({ ...profile, bio: e.target.value })
              }
              placeholder="Fortell litt om deg selv..."
            />
          </div>

          <hr className="userpage__separator" />

          {/* Hunder-seksjon */}
          <div className="userpage__dogHeader">
            <h2 className="userpage__dogTitle">Your Dogs</h2>
          </div>

          {/* Allerede lagrede hunder fra backend */}
          {savedDogs.map((dog) => (
            <div className="userpage__dogCard" key={`saved-${dog.id}`}>
              <div className="userpage__dogCardHeader">
                <span className="userpage__dogCardTitle">{dog.name}</span>
                <span
                  className="userpage__removeDogBtn"
                  onClick={() => handleDeleteDog(dog.id)}
                  role="button"
                  tabIndex={0}
                >
                  Remove
                </span>
              </div>
              {dog.picture && (
                <img className="userpage__dogImage" src={dog.picture} alt={dog.name} />
              )}
              <p className="userpage__dogInfo">
                {dog.breed} · {dog.age} Years
              </p>
            </div>
          ))}

          {/* Nye hunder som ikke er lagret ennå */}
          {newDogs.map((dog, index) => (
            <div className="userpage__dogCard" key={`new-${index}`}>
              <div className="userpage__dogCardHeader">
                <span className="userpage__dogCardTitle">
                  {dog.name || `New Dog`}
                </span>
              </div>
              <div className="userpage__dogImageSection">
                {dog.imagePreview ? (
                  <img className="userpage__dogImage" src={dog.imagePreview} alt={dog.name || "Hund"} />
                ) : (
                  <div className="userpage__dogImagePlaceholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <label className="userpage__dogImageBtn">
                  {dog.imagePreview ? "Change Picture" : "Upload picture"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleNewDogImage(index, e.target.files[0])}
                  />
                </label>
              </div>
              <div className="userpage__row">
                <div className="userpage__section">
                  <label className="userpage__label">Name</label>
                  <input
                    className="userpage__input"
                    value={dog.name}
                    onChange={(e) =>
                      handleNewDogChange(index, "name", e.target.value)
                    }
                    placeholder="Buddy"
                  />
                  {dog.nameError && (
                    <span className="userpage__fieldError">{dog.nameError}</span>
                  )}
                </div>
                <div className="userpage__section">
                  <label className="userpage__label">Breed</label>
                  <input
                    className="userpage__input"
                    value={dog.breed}
                    onChange={(e) =>
                      handleNewDogChange(index, "breed", e.target.value)
                    }
                    placeholder="Golden Retriever"
                  />
                  {dog.breedError && (
                    <span className="userpage__fieldError">{dog.breedError}</span>
                  )}
                </div>
              </div>
              <div className="userpage__section userpage__ageField">
                <label className="userpage__label">Age</label>
                <input
                  className="userpage__input"
                  type="number"
                  min={0}
                  max={30}
                  value={dog.age}
                  onChange={(e) =>
                    handleNewDogChange(index, "age", e.target.value)
                  }
                  placeholder="3"
                />
                {dog.ageError && (
                  <span className="userpage__fieldError">{dog.ageError}</span>
                )}
              </div>
              <span
                  className="userpage__removeDogBtn"
                  onClick={() => handleRemoveNewDog(index)}
                  role="button"
                  tabIndex={0}
                >
                  Remove
                </span>
            </div>
          ))}

          <span
            className="userpage__addDogBtn"
            onClick={handleAddDog}
            role="button"
            tabIndex={0}
          >
            + Add Dog 
          </span>

          <span
            className="userpage__saveBtn"
            onClick={saving ? undefined : handleSave}
            role="button"
            tabIndex={0}
          >
            {saving ? "Saving..." : "Save Profile"}
          </span>

          {message && (
            <p className="userpage__message userpage__message--success">
              {message}
            </p>
          )}
          {error && (
            <p className="userpage__message userpage__message--error">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
