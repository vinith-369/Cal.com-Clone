import { useParams, useNavigate } from "react-router-dom";
import PublicBooking from "../PublicBooking/PublicBooking";

/**
 * Reschedule page — reuses the PublicBooking component with a reschedule booking ID.
 * The booking ID is extracted from the URL and the user selects a new time slot.
 */
export default function RescheduleBooking() {
    // This component is mounted at /booking/:id/reschedule
    // PublicBooking reads the `reschedule` search param, so we redirect
    const { id } = useParams();
    const navigate = useNavigate();

    // We need the event type slug to show the booking page
    // For simplicity, we fetch the booking and redirect to /book/:slug?reschedule=id
    import("../../api/client").then(({ bookingsApi, eventTypesApi }) => {
        bookingsApi.getById(id).then((booking) => {
            eventTypesApi.getById(booking.event_type_id).then((et) => {
                navigate(`/book/${et.slug}?reschedule=${id}`, { replace: true });
            });
        }).catch(() => navigate("/bookings"));
    });

    return (
        <div className="booking-page">
            <div className="spinner"><div className="spinner__circle" /></div>
        </div>
    );
}
