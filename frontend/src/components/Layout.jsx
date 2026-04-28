export default function Layout({ user, currentTab, setCurrentTab, onLogout, children }) {
  const tabs = ["dashboard", "interviewers", "bookings", "submissions", "messages", "reports"];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>HireSphere</h2>
        <p className="muted">{user.name}</p>
        <p className="muted small">{user.email}</p>
        <p className="pill">{user.role}</p>
        <nav className="nav-list">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={currentTab === tab ? "nav-item active" : "nav-item"}
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
