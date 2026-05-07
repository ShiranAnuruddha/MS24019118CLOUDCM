export default function Layout({
  user,
  currentTab,
  setCurrentTab,
  onLogout,
  children,
}) {
  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "interviewers", label: "Interviewers / Candidates" },
    { key: "bookings", label: "Bookings" },
    { key: "submissions", label: "Submissions" },
    { key: "messages", label: "Messages" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>HireSphere</h2>
        <p className="muted">{user?.name || "User"}</p>
        <p className="muted small">{user?.email || ""}</p>
        <p className="pill">{user?.role || ""}</p>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={currentTab === item.key ? "nav-item active" : "nav-item"}
              onClick={() => setCurrentTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="secondary" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}