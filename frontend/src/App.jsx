import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import EventTypes from "./pages/EventTypes/EventTypes";
import Bookings from "./pages/Bookings/Bookings";
import Availability from "./pages/Availability/Availability";
import PublicBooking from "./pages/PublicBooking/PublicBooking";
import BookingConfirmation from "./pages/BookingConfirmation/BookingConfirmation";
import RescheduleBooking from "./pages/RescheduleBooking/RescheduleBooking";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes — wrapped in sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/event-types" replace />} />
          <Route path="/event-types" element={<EventTypes />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/availability" element={<Availability />} />
        </Route>

        {/* Public routes — no sidebar */}
        <Route path="/book/:slug" element={<PublicBooking />} />
        <Route path="/booking/confirmed" element={<BookingConfirmation />} />
        <Route path="/booking/:id/reschedule" element={<RescheduleBooking />} />
      </Routes>
    </BrowserRouter>
  );
}
