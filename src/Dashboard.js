import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiList, FiUser, FiLogOut } from 'react-icons/fi';
import logoCarrefour from './style/logo.png';              // logo
import './style/Dashboard.css';                            // styles

const Dashboard = () => {
  const { intervenantId } = useParams();
  const navigate          = useNavigate();
  const [intervenant, setIntervenant] = useState(null);

  /* ----------- récupère l’intervenant s’il existe ----------- */
  useEffect(() => {
    const stored = localStorage.getItem('intervenant');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id?.toString() === intervenantId) {
          setIntervenant(parsed);
        }
      } catch (err) {
        console.error('Erreur de parsing du localStorage', err);
      }
    }
  }, [intervenantId]);

  /* ---------------------- déconnexion ----------------------- */
  const handleLogout = () => {
    localStorage.removeItem('intervenant');
    navigate('/');
  };

  /* ---------------- composant bouton réutilisable ----------- */
  const NavButton = ({ to, className, icon: Icon, label }) => (
    <button
      className={`glass-button ${className}`}
      onClick={to === 'logout' ? handleLogout : () => navigate(to)}
    >
      <Icon className="btn-icon" size={22} aria-hidden="true" />
      <span className="btn-label">{label}</span>
    </button>
  );

  /* ------------------------------ rendu --------------------- */
  return (
    <div className="dashboard-glass">
      <div className="dashboard-content">
        {intervenant && (
          <h1 className="welcome-title">Bienvenue, {intervenant.name}</h1>
        )}

        {/* Logo juste au-dessus du sous-titre */}
        <img
          src={logoCarrefour}
          alt="Logo Carrefour"
          className="carrefour-logo-inline"
          onClick={() => navigate(`/dashboard/${intervenantId}`)}
        />

        <p className="dashboard-subtitle">Gestion des promotions&nbsp;:</p>

        <div className="button-group">
          <NavButton
            to="calendar"
            className="orange"
            icon={FiCalendar}
            label="Retroplanning des promos"
          />
          <NavButton
            to="promos"
            className="blue"
            icon={FiList}
            label="Toutes les promotions"
          />
          <NavButton
            to="mes-promos"
            className="green"
            icon={FiUser}
            label="Mes promotions à traiter"
          />
          <NavButton
            to="logout"
            className="logout"
            icon={FiLogOut}
            label="Se déconnecter"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
