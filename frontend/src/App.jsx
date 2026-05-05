import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { amplifyEnabled } from "./lib/amplify";
import { api } from "./lib/api";
import { getAuthContext, logout } from "./lib/auth";
import AuthLanding from "./components/AuthLanding";
import AuthLoginPage from "./components/AuthLoginPage";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Interviewers from "./pages/Interviewers";
import Bookings from "./pages/Bookings";
import Submissions from "./pages/Submissions";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";

const VALID_TABS = ["dashboard", "interviewers", "bookings", "submissions", "messages", "reports"];

function ProtectedRoleApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [interviewers, setInterviewers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [mySlots, setMySlots] = useState([]);
  const [notice, setNotice] = useState("");

  const currentTab = useMemo(() => {
    const part = location.pathname.split("/")[2] || "dashboard";
    return VALID_TABS.includes(part) ? part : "dashboard";
  }, [location.pathname]);

  async function refreshUser() {
    const auth = await getAuthContext();

    if (!auth.user) {
      navigate("/login", { replace: true });
      return;
    }

    if (role && auth.user.role && auth.user.role !== role) {
      navigate(`/${auth.user.role}/dashboard`, { replace: true });
      return;
    }

    setUser(auth.user);
  }

  async function loadAll() {
    let meProfile = null;

    try {
      meProfile = await api("/profiles/me");
      setProfile(meProfile);
    } catch {
      setProfile(null);
    }

    try {
      setInterviewers(await api("/profiles/interviewers"));
    } catch {
      setInterviewers([]);
    }

    try {
      setBookings(await api("/bookings/mine"));
    } catch {
      setBookings([]);
    }

    try {
      setSubmissions(await api("/submissions/mine"));
    } catch {
      setSubmissions([]);
    }

    try {
      setReports(await api("/evaluations/reports/mine"));
    } catch {
      setReports([]);
    }

    try {
      if ((meProfile?.profile_type || user?.role) === "interviewer") {
        setMySlots(await api("/profiles/interviewer/me/slots"));
      } else {
        setMySlots([]);
      }
    } catch {
      setMySlots([]);
    }
  }

  useEffect(() => {
    refreshUser();
  }, [role]);

  useEffect(() => {
    if (user) {
      loadAll();
    }
  }, [user]);

  function setCurrentTab(nextTab) {
    if (!user?.role) return;
    navigate(`/${user.role}/${nextTab}`);
  }

  async function handleSearch(filters) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.set(key, value);
        }
      });
      setInterviewers(await api(`/profiles/interviewers?${params.toString()}`));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleBook(payload) {
    try {
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotice("Booking created.");
      await loadAll();
      navigate(`/${user.role}/bookings`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSaveProfile(payload) {
    try {
      const saved = await api("/profiles/me/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setProfile(saved);
      setNotice("Profile saved successfully.");
      await loadAll();
    } catch (error) {
      setNotice(`Save failed: ${error.message}`);
      alert(`Save failed: ${error.message}`);
    }
  }

  async function handleAddSlot(payload) {
    try {
      await api("/profiles/interviewer/slots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotice("Slot added.");
      await loadAll();
    } catch (error) {
      setNotice(`Add slot failed: ${error.message}`);
      alert(`Add slot failed: ${error.message}`);
    }
  }

  async function handlePay(bookingId) {
    try {
      await api(`/bookings/${bookingId}/pay`, { method: "POST" });
      setNotice("Payment completed.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleUpdateStatus(bookingId, status) {
    try {
      await api(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(`Booking updated to ${status}.`);
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSubmission(form) {
    try {
      const data = new FormData();
      if (form.bookingId) data.append("bookingId", form.bookingId);
      if (form.githubUrl) data.append("githubUrl", form.githubUrl);
      if (form.notes) data.append("notes", form.notes);
      if (form.file) data.append("file", form.file);

      await api("/submissions", {
        method: "POST",
        body: data,
      });

      setNotice("Submission uploaded.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleAnnotate(id, annotations) {
    try {
      await api(`/submissions/${id}/annotations`, {
        method: "PATCH",
        body: JSON.stringify({ annotations }),
      });
      setNotice("Annotations saved.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSelectBooking(bookingId) {
    setSelectedBookingId(bookingId);
    try {
      setThreads(await api(`/messages/threads/${bookingId}`));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSendMessage(bookingId, content) {
    try {
      await api(`/messages/threads/${bookingId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      await handleSelectBooking(bookingId);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleCreateReport(payload) {
    try {
      await api("/evaluations/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNotice("Evaluation report created.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate("/login", { replace: true });
  }

  const content = useMemo(() => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard profile={profile} bookings={bookings} reports={reports} />;

      case "interviewers":
        return (
          <Interviewers
            user={user}
            interviewers={interviewers}
            onSearch={handleSearch}
            onBook={handleBook}
            onSaveProfile={handleSaveProfile}
            onAddSlot={handleAddSlot}
            mySlots={mySlots}
            profile={profile}
          />
        );

      case "bookings":
        return (
          <Bookings
            user={user}
            bookings={bookings}
            onPay={handlePay}
            onUpdateStatus={handleUpdateStatus}
          />
        );

      case "submissions":
        return (
          <Submissions
            submissions={submissions}
            onSubmit={handleSubmission}
            onAnnotate={handleAnnotate}
            user={user}
          />
        );

      case "messages":
        return (
          <Messages
            bookings={bookings}
            threads={threads}
            selectedBookingId={selectedBookingId}
            onSelectBooking={handleSelectBooking}
            onSend={handleSendMessage}
          />
        );

      case "reports":
        return (
          <Reports
            user={user}
            reports={reports}
            bookings={bookings}
            onCreate={handleCreateReport}
          />
        );

      default:
        return <Dashboard profile={profile} bookings={bookings} reports={reports} />;
    }
  }, [
    currentTab,
    user,
    profile,
    interviewers,
    bookings,
    submissions,
    reports,
    threads,
    selectedBookingId,
    mySlots,
  ]);

  if (!user) {
    return <div style={{ padding: 24 }}>Checking session...</div>;
  }

  return (
    <Layout user={user} currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={handleLogout}>
      {notice && <div className="notice">{notice}</div>}
      {content}
    </Layout>
  );
}

export default function App() {
  if (!amplifyEnabled) {
    return <div style={{ padding: 24 }}>Cognito is not configured yet.</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthLanding />} />
      <Route path="/login/interviewer" element={<AuthLoginPage role="interviewer" />} />
      <Route path="/login/candidate" element={<AuthLoginPage role="candidate" />} />
      <Route path="/interviewer/:tab" element={<ProtectedRoleApp />} />
      <Route path="/candidate/:tab" element={<ProtectedRoleApp />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}