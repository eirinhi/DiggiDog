import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./userpage.css";

export default function Userpage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
  });
  const [dogs, setDogs] = useState([]);
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
    setDogs(parsed.dogs || []);
  }, [navigate]);

  

  const handleAddDog = () => {
    setDogs([...dogs, { name: "", breed: "", age: "", image: "" }]);
  };

  const handleRemoveDog = (index) => {
    setDogs(dogs.filter((_, i) => i !== index));
  };

  const handleDogImage = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = dogs.map((dog, i) =>
        i === index ? { ...dog, image: e.target.result } : dog
      );
      setDogs(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleDogChange = (index, field, value) => {
    const updated = dogs.map((dog, i) =>
      i === index ? { ...dog, [field]: value } : dog
    );
    setDogs(updated);
  };

  const handleSave = () => {
    setSaving(true);
    setMessage("");
    setError("");

    const savedDogs = dogs.map((dog) => ({
      ...dog,
      age: dog.age !== "" ? parseInt(dog.age) : null,
    }));

    const updatedUser = { ...user, ...profile, dogs: savedDogs };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event("userChanged"));

    setMessage("Profilen din er lagret!");
    setSaving(false);
  };

  // Redirect skjer i useEffect, vis ingenting mens det skjer
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
                {profile.name || "Sett navnet ditt"}
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
    
            <h2 className="userpage__dogTitle">Dine hunder</h2>
          </div>

          {dogs.map((dog, index) => (
            <div className="userpage__dogCard" key={index}>
              <div className="userpage__dogCardHeader">
                <span className="userpage__dogCardTitle">
                  {dog.name || `Hund ${index + 1}`}
                </span>
                
              </div>
              <div className="userpage__dogImageSection">
                {dog.image ? (
                  <img className="userpage__dogImage" src={dog.image} alt={dog.name || "Hund"} />
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
                  {dog.image ? "Bytt bilde" : "Last opp bilde"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleDogImage(index, e.target.files[0])}
                  />
                </label>
              </div>
              <div className="userpage__row">
                <div className="userpage__section">
                  <label className="userpage__label">Navn</label>
                  <input
                    className="userpage__input"
                    value={dog.name}
                    onChange={(e) =>
                      handleDogChange(index, "name", e.target.value)
                    }
                    placeholder="Buddy"
                  />
                </div>
                <div className="userpage__section">
                  <label className="userpage__label">Rase</label>
                  <input
                    className="userpage__input"
                    value={dog.breed}
                    onChange={(e) =>
                      handleDogChange(index, "breed", e.target.value)
                    }
                    placeholder="Golden Retriever"
                  />
                </div>
              </div>
              <div className="userpage__section userpage__ageField">
                <label className="userpage__label">Alder (år)</label>
                <input
                  className="userpage__input"
                  type="number"
                  min={0}
                  max={30}
                  value={dog.age}
                  onChange={(e) =>
                    handleDogChange(index, "age", e.target.value)
                  }
                  placeholder="3"
                />
              </div>
              <span
                  className="userpage__removeDogBtn"
                  onClick={() => handleRemoveDog(index)}
                  role="button"
                  tabIndex={0}
                >
                  Fjern
                </span>
            </div>
          ))}

          <span
            className="userpage__addDogBtn"
            onClick={handleAddDog}
            role="button"
            tabIndex={0}
          >
            + Legg til hund
          </span>

          <span
            className="userpage__saveBtn"
            onClick={saving ? undefined : handleSave}
            role="button"
            tabIndex={0}
          >
            {saving ? "Lagrer..." : "Lagre profil"}
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
