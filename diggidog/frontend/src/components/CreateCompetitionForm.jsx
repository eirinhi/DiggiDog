import { useState } from "react";
import "./CreateCompetitionForm.css";

export default function CreateCompetitionForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [compPicture, setCompPicture] = useState(null); // <-- store File


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCompPicture(file);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      setError("Start date cannot be in the past.");
      setLoading(false);
      return;
    }
    if (end <= start) {
      setError("End date must be after start date.");
      setLoading(false);
      return;
    }

    const maxDuration = 14 * 24 * 60 * 60 * 1000;
    if (end - start > maxDuration) {
      setError("The competition cannot last for longer than 2 weeks.");
      setLoading(false);
      return;
    }

    const maxFuture = 61 * 24 * 60 * 60 * 1000;
    if (start - now > maxFuture) {
      setError("The competition cannot be more than 2 months in the future.");
      setLoading(false);
      return;
    }

    // If you want the picture required:
    if (!compPicture) {
      setError("Please upload a picture.");
      setLoading(false);
      return;
    }

    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("max_participants", String(Number(maxParticipants)));
      formData.append("user_id", "1");
      formData.append("picture", compPicture); 
      const response = await fetch("http://localhost:8000/api/create_comp/", {
        method: "POST",
     
        body: formData,
      });

      if (!response.ok) {
        // backend might return JSON error, but sometimes plain text
        let message = "Something went wrong";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch (_) {}
        throw new Error(message);
      }

      setSuccess("Competition created!");
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setMaxParticipants("");
      setCompPicture(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Create Competition</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Competition Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />
          </div>

          <div className="form-group">
            <label>Start Date & Time *</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date & Time *</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Maximum Participants *</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="form-group">
            <label>Add picture *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: "100%", marginTop: 8, borderRadius: 8 }}
              />
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Competition"}
          </button>
        </form>
      </div>
    </div>
  );
}