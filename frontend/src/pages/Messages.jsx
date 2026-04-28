import { useState } from "react";

export default function Messages({ bookings, threads, selectedBookingId, onSelectBooking, onSend }) {
  const [message, setMessage] = useState("");

  function handleSend(event) {
    event.preventDefault();
    if (!selectedBookingId || !message.trim()) return;
    onSend(selectedBookingId, message.trim());
    setMessage("");
  }

  return (
    <div className="page-grid">
      <div className="card">
        <h3>Booking Threads</h3>
        <div className="list">
          {bookings.map((booking) => (
            <button key={booking.id} className={selectedBookingId === booking.id ? "list-item active" : "list-item"} onClick={() => onSelectBooking(booking.id)}>
              <div>
                <strong>Booking #{booking.id}</strong>
                <p>{booking.interview_type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card span-2">
        <h3>Conversation</h3>
        <div className="thread">
          {threads.map((item) => (
            <div className="message-bubble" key={item.id}>
              <strong>{item.sender_name}</strong> <span className="muted">({item.sender_role})</span>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
        <form className="message-compose" onSubmit={handleSend}>
          <input placeholder="Type message..." value={message} onChange={(e) => setMessage(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
