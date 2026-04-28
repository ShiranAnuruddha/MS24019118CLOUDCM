import { useState } from "react";
import LiveRoom from "../components/LiveRoom";

export default function Bookings({ user, bookings, onPay, onUpdateStatus }) {
  const [selectedLiveRoom, setSelectedLiveRoom] = useState(null);
  const [reportForm, setReportForm] = useState({});

  return (
    <div className="page-grid">
      <div className="card span-2">
        <h3>Bookings</h3>
        <div className="list">
          {bookings.map((booking) => (
            <div className="list-item stacked" key={booking.id}>
              <div>
                <strong>Booking #{booking.id}</strong>
                <p>{booking.interview_type} · {new Date(booking.scheduled_start).toLocaleString()}</p>
                <p>Status: <span className="pill">{booking.status}</span> Payment: <span className="pill">{booking.payment_status}</span></p>
                <p className="muted">Amount: ${booking.amount}</p>
                {booking.notes && <p className="muted">Notes: {booking.notes}</p>}
              </div>
              <div className="button-row">
                {user.role === "candidate" && booking.payment_status !== "paid" && (
                  <button onClick={() => onPay(booking.id)}>Mock Pay</button>
                )}
                {user.role === "candidate" && booking.status !== "cancelled" && (
                  <button className="secondary" onClick={() => onUpdateStatus(booking.id, "cancelled")}>Cancel</button>
                )}
                {user.role === "interviewer" && booking.status === "pending" && (
                  <>
                    <button onClick={() => onUpdateStatus(booking.id, "accepted")}>Accept</button>
                    <button className="secondary" onClick={() => onUpdateStatus(booking.id, "rejected")}>Reject</button>
                  </>
                )}
                {user.role === "interviewer" && booking.status === "accepted" && (
                  <button onClick={() => onUpdateStatus(booking.id, "completed")}>Mark Completed</button>
                )}
                <button onClick={() => setSelectedLiveRoom(`booking-${booking.id}`)}>Open Live Room</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLiveRoom && <LiveRoom roomId={selectedLiveRoom} user={user} />}
    </div>
  );
}
