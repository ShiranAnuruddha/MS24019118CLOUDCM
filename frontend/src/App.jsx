import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { amplifyEnabled } from "./lib/amplify";
import { api } from "./lib/api";
import { getAuthContext, getMockUser, logout } from "./lib/auth";
import MockAuth from "./components/MockAuth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Interviewers from "./pages/Interviewers";
import Bookings from "./pages/Bookings";
import Submissions from "./pages/Submissions";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";

function AppInner() {
  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState(getMockUser());
  const [profile, setProfile] = useState(null);
  const [interviewers, setInterviewers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [mySlots, setMySlots] = useState([]);
  const [notice, setNotice] = useState("");

  async function refreshUser() {
    const auth = await getAuthContext();
    setUser(auth.user);
  }

  async function loadAll() {
    try {
      const [meProfile, interviewerList, myBookings, mySubmissions, myReports] = await Promise.all([
        api("/profiles/me"),
        api("/profiles/interviewers"),
        api("/bookings/mine"),
        api("/submissions/mine"),
        api("/evaluations/reports/mine"),
      ]);

      setProfile(meProfile);
      setInterviewers(interviewerList);
      setBookings(myBookings);
      setSubmissions(mySubmissions);
      setReports(myReports);

      if ((meProfile?.profile_type || user?.role) === "interviewer") {
        const slots = await api("/profiles/interviewer/me/slots");
        setMySlots(slots);
      } else {
        setMySlots([]);
      }
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAll();
    }
  }, [user]);

  async function handleSearch(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) params.set(key, value);
    });
    const data = await api(`/profiles/interviewers?${params.toString()}`);
    setInterviewers(data);
  }

  async function handleBook(payload) {
    try {
      await api("/bookings", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Booking created.");
      await loadAll();
      setTab("bookings");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSaveProfile(payload) {
    try {
      await api("/profiles/me/upsert", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Profile saved.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleAddSlot(payload) {
    try {
      await api("/profiles/interviewer/slots", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Slot added.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handlePay(bookingId) {
    try {
      await api(`/bookings/${bookingId}/pay`, { method: "POST" });
      setNotice("Payment completed in mock gateway.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleUpdateStatus(bookingId, status) {
    try {
      await api(`/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
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
      await api("/submissions", { method: "POST", body: data });
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
      const data = await api(`/messages/threads/${bookingId}`);
      setThreads(data);
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
      await api("/evaluations/reports", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Evaluation report created.");
      await loadAll();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setProfile(null);
    setInterviewers([]);
    setBookings([]);
    setSubmissions([]);
    setReports([]);
    setThreads([]);
    setMySlots([]);
    setSelectedBookingId(null);
  }

  const content = useMemo(() => {
    switch (tab) {
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
        return null;
    }
  }, [tab, user, profile, interviewers, bookings, submissions, reports, threads, selectedBookingId, mySlots]);

  if (!user) {
    return <MockAuth onAuthenticated={(mockUser) => setUser(mockUser)} />;
  }

  return (
    <Layout user={user} currentTab={tab} setCurrentTab={setTab} onLogout={handleLogout}>
      {notice && <div className="notice">{notice}</div>}
      {content}
    </Layout>
  );
}

export default function App() {
  if (amplifyEnabled) {
    return (
      <Authenticator>
        <AppInner />
      </Authenticator>
    );
  }

  return <AppInner />;
}
