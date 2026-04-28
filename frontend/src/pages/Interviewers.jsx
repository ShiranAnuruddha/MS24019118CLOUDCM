import { useMemo, useState } from "react";

export default function Interviewers({ user, interviewers, onSearch, onBook, onSaveProfile, onAddSlot, mySlots, profile }) {
  const [filters, setFilters] = useState({
    domain: "",
    interviewType: "",
    experienceLevel: "",
    minRating: 0,
  });
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || user.name,
    profile_type: profile?.profile_type || user.role,
    domain: profile?.domain || "",
    interview_types: (profile?.interview_types || []).join(", "),
    experience_level: profile?.experience_level || "",
    bio: profile?.bio || "",
    specialization_badges: (profile?.specialization_badges || []).join(", "),
    hourly_rate: profile?.hourly_rate || 0,
  });
  const [slotForm, setSlotForm] = useState({ slot_start: "", slot_end: "" });

  function updateProfile(key, value) {
    setProfileForm((current) => ({ ...current, [key]: value }));
  }

  function submitProfile(event) {
    event.preventDefault();
    onSaveProfile({
      ...profileForm,
      interview_types: profileForm.interview_types.split(",").map((s) => s.trim()).filter(Boolean),
      specialization_badges: profileForm.specialization_badges.split(",").map((s) => s.trim()).filter(Boolean),
      hourly_rate: Number(profileForm.hourly_rate || 0),
    });
  }

  const filtered = useMemo(() => interviewers, [interviewers]);

  return (
    <div className="page-grid">
      <div className="card">
        <h3>My Profile</h3>
        <form className="form-grid" onSubmit={submitProfile}>
          <label>Name<input value={profileForm.full_name} onChange={(e) => updateProfile("full_name", e.target.value)} /></label>
          <label>Profile Type
            <select value={profileForm.profile_type} onChange={(e) => updateProfile("profile_type", e.target.value)}>
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </label>
          <label>Domain<input value={profileForm.domain} onChange={(e) => updateProfile("domain", e.target.value)} /></label>
          <label>Experience<input value={profileForm.experience_level} onChange={(e) => updateProfile("experience_level", e.target.value)} /></label>
          <label>Interview Types<input value={profileForm.interview_types} onChange={(e) => updateProfile("interview_types", e.target.value)} placeholder="DSA, System Design" /></label>
          <label>Badges<input value={profileForm.specialization_badges} onChange={(e) => updateProfile("specialization_badges", e.target.value)} placeholder="Java, React" /></label>
          <label>Hourly Rate<input type="number" value={profileForm.hourly_rate} onChange={(e) => updateProfile("hourly_rate", e.target.value)} /></label>
          <label className="span-2">Bio<textarea rows="3" value={profileForm.bio} onChange={(e) => updateProfile("bio", e.target.value)} /></label>
          <button type="submit">Save Profile</button>
        </form>
      </div>

      {user.role === "interviewer" && (
        <div className="card">
          <h3>Publish Availability</h3>
          <form className="form-grid" onSubmit={(e) => {
            e.preventDefault();
            onAddSlot(slotForm);
            setSlotForm({ slot_start: "", slot_end: "" });
          }}>
            <label>Start<input type="datetime-local" value={slotForm.slot_start} onChange={(e) => setSlotForm((c) => ({ ...c, slot_start: e.target.value }))} /></label>
            <label>End<input type="datetime-local" value={slotForm.slot_end} onChange={(e) => setSlotForm((c) => ({ ...c, slot_end: e.target.value }))} /></label>
            <button type="submit">Add Slot</button>
          </form>
          <div className="list">
            {mySlots.map((slot) => (
              <div className="list-item" key={slot.id}>
                <div>
                  <strong>{new Date(slot.slot_start).toLocaleString()}</strong>
                  <p>{new Date(slot.slot_end).toLocaleString()}</p>
                </div>
                <span className={slot.is_booked ? "pill danger" : "pill success"}>
                  {slot.is_booked ? "Booked" : "Open"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card span-2">
        <h3>Find Interviewers</h3>
        <div className="filter-row">
          <input placeholder="Domain" value={filters.domain} onChange={(e) => setFilters((c) => ({ ...c, domain: e.target.value }))} />
          <input placeholder="Interview Type" value={filters.interviewType} onChange={(e) => setFilters((c) => ({ ...c, interviewType: e.target.value }))} />
          <input placeholder="Experience" value={filters.experienceLevel} onChange={(e) => setFilters((c) => ({ ...c, experienceLevel: e.target.value }))} />
          <input type="number" placeholder="Min Rating" value={filters.minRating} onChange={(e) => setFilters((c) => ({ ...c, minRating: e.target.value }))} />
          <button onClick={() => onSearch(filters)}>Search</button>
        </div>

        <div className="list">
          {filtered.map((item) => (
            <div className="list-item stacked" key={item.user_id}>
              <div>
                <h4>{item.full_name}</h4>
                <p>{item.domain} · {item.experience_level} · Rating {item.ratings}</p>
                <p className="muted">{item.bio}</p>
                <p className="muted">Badges: {(item.specialization_badges || []).join(", ")}</p>
                <p><strong>Interview Types:</strong> {(item.interview_types || []).join(", ")}</p>
              </div>

              <div className="slot-grid">
                {(item.slots || []).map((slot) => (
                  <div className="slot-card" key={slot.id}>
                    <p>{new Date(slot.slot_start).toLocaleString()}</p>
                    <p>{new Date(slot.slot_end).toLocaleString()}</p>
                    {user.role === "candidate" && (
                      <button onClick={() => onBook({
                        interviewerId: item.user_id,
                        slotId: slot.id,
                        interviewType: item.interview_types?.[0] || "DSA",
                      })}>
                        Book
                      </button>
                    )}
                  </div>
                ))}
                {!item.slots?.length && <p className="muted">No open slots</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
