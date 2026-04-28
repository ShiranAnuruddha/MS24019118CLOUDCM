export default function Dashboard({ profile, bookings, reports }) {
  return (
    <div className="page-grid">
      <div className="card">
        <h3>Profile Summary</h3>
        <p><strong>Name:</strong> {profile?.full_name || "-"}</p>
        <p><strong>Type:</strong> {profile?.profile_type || "-"}</p>
        <p><strong>Domain:</strong> {profile?.domain || "-"}</p>
        <p><strong>Experience:</strong> {profile?.experience_level || "-"}</p>
        <p><strong>Bio:</strong> {profile?.bio || "-"}</p>
      </div>

      <div className="card">
        <h3>Bookings</h3>
        <p className="metric">{bookings.length}</p>
        <p className="muted">Total sessions in your history</p>
      </div>

      <div className="card">
        <h3>Reports</h3>
        <p className="metric">{reports.length}</p>
        <p className="muted">Evaluation reports available</p>
      </div>
    </div>
  );
}
