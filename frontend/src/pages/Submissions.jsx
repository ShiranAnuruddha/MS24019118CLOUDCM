import { useState } from "react";

export default function Submissions({ submissions, onSubmit, onAnnotate, user }) {
  const [form, setForm] = useState({
    bookingId: "",
    githubUrl: "",
    notes: "",
    file: null,
  });

  function handleUpload(event) {
    event.preventDefault();
    onSubmit(form);
    setForm({ bookingId: "", githubUrl: "", notes: "", file: null });
    event.target.reset();
  }

  return (
    <div className="page-grid">
      <div className="card">
        <h3>Submit Coding Challenge</h3>
        <form className="form-grid" onSubmit={handleUpload}>
          <label>Booking ID<input value={form.bookingId} onChange={(e) => setForm((c) => ({ ...c, bookingId: e.target.value }))} /></label>
          <label>GitHub URL<input value={form.githubUrl} onChange={(e) => setForm((c) => ({ ...c, githubUrl: e.target.value }))} /></label>
          <label className="span-2">Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} /></label>
          <label className="span-2">File<input type="file" onChange={(e) => setForm((c) => ({ ...c, file: e.target.files?.[0] || null }))} /></label>
          <button type="submit">Upload Submission</button>
        </form>
      </div>

      <div className="card span-2">
        <h3>Submission History</h3>
        <div className="list">
          {submissions.map((item) => (
            <div className="list-item stacked" key={item.id}>
              <div>
                <strong>Submission #{item.id}</strong>
                <p>Booking: {item.booking_id || "-"}</p>
                <p>GitHub: {item.github_url || "-"}</p>
                <p>Storage: {item.storage_url || "-"}</p>
                <p className="muted">Notes: {item.notes || "-"}</p>
                <p className="muted">Annotations: {item.annotations || "-"}</p>
              </div>
              {user.role === "interviewer" && (
                <button onClick={() => {
                  const annotations = prompt("Enter annotations");
                  if (annotations !== null) onAnnotate(item.id, annotations);
                }}>
                  Add Annotation
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
