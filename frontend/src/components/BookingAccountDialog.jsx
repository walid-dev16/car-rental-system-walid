import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { bookingAuthLink } from "../booking/bookingNavigation.js";

export default function BookingAccountDialog({ target, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog.showModal) dialog.showModal();
    else dialog.open = true;
    return () => dialog.close?.();
  }, []);

  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="booking-account-title"
      className="m-auto w-11/12 max-w-md rounded-3xl border border-[#ff5f00]/30 bg-[#111] p-6 text-center text-white shadow-2xl backdrop:bg-black/60">
        <h3 id="booking-account-title" className="text-2xl font-bold text-white">Booking requires an account</h3>
        <p className="mt-3 text-gray-300">Sign in or register to continue with your selection.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link autoFocus to={bookingAuthLink("/login", target)} className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white">Login</Link>
          <Link to={bookingAuthLink("/register", target)} className="rounded-2xl bg-[#ff5f00] px-5 py-3 font-bold text-white">Register</Link>
        </div>
        <button onClick={onClose} className="mt-5 text-sm text-gray-400 hover:text-white">Close</button>
    </dialog>
  );
}
