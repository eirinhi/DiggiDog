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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        i === index ? { ...dog, imagePreview: e.target.result, imageBase64: e.target.result, imageError: "" } : dog
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

  const handleOpenPasswordModal = () => {
    setPasswordForm({ current: "", newPass: "", confirm: "" });
    setPasswordError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwordForm.current === passwordForm.newPass) {
      setPasswordError("New password cannot be the same as the current password.");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/change_password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          current_password: passwordForm.current,
          new_password: passwordForm.newPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Could not change password.");
        return;
      }
      setShowPasswordModal(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
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
        const errors = { nameError: "", breedError: "", ageError: "", imageError: "" };
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
        if (!dog.imageBase64) {
          errors.imageError = "Picture is required.";
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
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="userpage__modalOverlay">
          <div className="userpage__modal">
            <h3 className="userpage__modalTitle">Change Password</h3>

            <div className="userpage__section">
              <label className="userpage__label">Current Password</label>
              <div className="userpage__passwordFieldRow">
                <input
                  className="userpage__input"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="Current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="userpage__showBtn"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="userpage__section">
              <label className="userpage__label">New Password</label>
              <div className="userpage__passwordFieldRow">
                <input
                  className="userpage__input"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  placeholder="New password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="userpage__showBtn"
                  onClick={() => setShowNewPassword((value) => !value)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="userpage__section">
              <label className="userpage__label">Confirm New Password</label>
              <div className="userpage__passwordFieldRow">
                <input
                  className="userpage__input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="userpage__showBtn"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="userpage__message userpage__message--error">{passwordError}</p>
            )}

            <div className="userpage__modalActions">
              <span
                className="userpage__modalCancelBtn"
                onClick={handleClosePasswordModal}
                role="button"
                tabIndex={0}
              >
                Cancel
              </span>
              <span
                className="userpage__modalSaveBtn"
                onClick={savingPassword ? undefined : handleChangePassword}
                role="button"
                tabIndex={0}
              >
                {savingPassword ? "Saving..." : "Save"}
              </span>
            </div>
          </div>
        </div>
      )}
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
            {user.is_admin && (
              <div className="userpage__adminSection">
                <span className="userpage__adminBadge">Admin</span>
              </div>
            )}
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

          {/* Change Password */}
          <div className="userpage__changePasswordRow">
            <span
              className="userpage__changePasswordBtn"
              onClick={handleOpenPasswordModal}
              role="button"
              tabIndex={0}
            >
              Change Password
            </span>
            {passwordSuccess && (
              <span className="userpage__passwordSuccessMsg">Password changed!</span>
            )}
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
                {dog.imagePreview && (
                  <img className="userpage__dogImage" src={dog.imagePreview} alt={dog.name || "Hund"} />
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
                {dog.imageError && (
                  <span className="userpage__fieldError">{dog.imageError}</span>
                )}
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
                    placeholder="Name"
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
                    placeholder="Breed"
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
                  placeholder="Age"
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

          {newDogs.length === 0 && (
            <span
              className="userpage__addDogBtn"
              onClick={handleAddDog}
              role="button"
              tabIndex={0}
            >
              + Add Dog
            </span>
          )}

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
