import { useState } from "react";

export default function Reports({ user, reports, bookings, onCreate }) {
  const [form, setForm] = useState({
    bookingId: "",
    candidateId: "",
    communication: 4,
    problemSolving: 4,
    systemDesign: 4,
    coding: 4,
    summary: "",
    strengths: "",
    improvements: "",
  });

  function handleSubmit(event) {
    event.preventDefault();
    onCreate({
      bookingId: Number(form.bookingId),
      candidateId: form.candidateId,
      scores: {
        communication: Number(form.communication),
        problemSolving: Number(form.problemSolving),
        systemDesign: Number(form.systemDesign),
        coding: Number(form.coding),
      },
      summary: form.summary,
      strengths: form.strengths.split(",").map((s) => s.trim()).filter(Boolean),
      improvements: form.improvements.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }

  return (
    <div className="page-grid">
      {user.role === "interviewer" && (
        <div className="card">
          <h3>Create Evaluation Report</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Booking ID<input value={form.bookingId} onChange={(e) => setForm((c) => ({ ...c, bookingId: e.target.value }))} /></label>
            <label>Candidate ID<input value={form.candidateId} onChange={(e) => setForm((c) => ({ ...c, candidateId: e.target.value }))} /></label>
            <label>Communication<input type="number" min="1" max="5" value={form.communication} onChange={(e) => setForm((c) => ({ ...c, communication: e.target.value }))} /></label>
            <label>Problem Solving<input type="number" min="1" max="5" value={form.problemSolving} onChange={(e) => setForm((c) => ({ ...c, problemSolving: e.target.value }))} /></label>
            <label>System Design<input type="number" min="1" max="5" value={form.systemDesign} onChange={(e) => setForm((c) => ({ ...c, systemDesign: e.target.value }))} /></label>
            <label>Coding<input type="number" min="1" max="5" value={form.coding} onChange={(e) => setForm((c) => ({ ...c, coding: e.target.value }))} /></label>
            <label className="span-2">Summary<textarea rows="3" value={form.summary} onChange={(e) => setForm((c) => ({ ...c, summary: e.target.value }))} /></label>
            <label>Strengths<input value={form.strengths} onChange={(e) => setForm((c) => ({ ...c, strengths: e.target.value }))} placeholder="Communication, coding speed" /></label>
            <label>Improvements<input value={form.improvements} onChange={(e) => setForm((c) => ({ ...c, improvements: e.target.value }))} placeholder="Algorithms, testing" /></label>
            <button type="submit">Save Report</button>
          </form>
        </div>
      )}

      <div className="card span-2">
        <h3>Reports</h3>
        <div className="list">
          {reports.map((report) => (
            <div key={report.id} className="list-item stacked">
              <div>
                <strong>Report #{report.id}</strong>
                <p>Booking #{report.booking_id}</p>
                <p>{report.summary}</p>
                <p className="muted">Scores: {JSON.stringify(report.scores)}</p>
                <p className="muted">Strengths: {(report.strengths || []).join(", ")}</p>
                <p className="muted">Improvements: {(report.improvements || []).join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
