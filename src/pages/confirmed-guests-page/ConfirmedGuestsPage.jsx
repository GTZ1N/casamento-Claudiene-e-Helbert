import { useState } from 'react';
import OfficialGuestListSection from '../../sections/OfficialGuestListSection';
import ConfirmedGuestsSection from '../../sections/ConfirmedGuestsSection';
import ConfirmedChildrenSection from '../../sections/ConfirmedChildrenSection';
import AdminLogin from '../../components/admin-login/AdminLogin';
import { clearAdminAuthenticated, isAdminAuthenticated } from '../../lib/adminAuth';
import './confirmed-guests-page.css';

export default function ConfirmedGuestsPage() {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated());

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <main>
      <OfficialGuestListSection />
      <ConfirmedGuestsSection />
      <ConfirmedChildrenSection />
      <button
        type="button"
        className="admin-logout"
        onClick={() => {
          clearAdminAuthenticated();
          setAuthenticated(false);
        }}
      >
        sair
      </button>
    </main>
  );
}
