import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './Dashboard';
import PromoList from './PromoList';
import MesPromos from './MesPromos';
import PromoDetail from './PromoDetail';
import EtapeDetail from './EtapeDetail';
import SousEtapesDetail from './SousEtapesDetail';
import PromoCalendar from './PromoCalendar';

/**
 * Définition des routes de l'application avec routes imbriquées
 */
function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Gestion des Promotions</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Toutes les vues du dashboard sous ce layout */}
            <Route path="/dashboard/:intervenantId" element={<DashboardLayout />}>
              {/* Vue principale du dashboard */}
              <Route index element={<Dashboard />} />

              {/* Liste de toutes les promos */}
              <Route path="promos" element={<PromoList />} />

              {/* Liste des promos à traiter par l’intervenant */}
              <Route path="mes-promos" element={<MesPromos />} />

              {/* Détail d’une promo */}
              <Route path="promos/:promoId" element={<PromoDetail />} />

              {/* Détail d’une étape d’une promo */}
              <Route
                path="promos/:promoId/etapes/:etapeId"
                element={<EtapeDetail />}
              />

              {/* Sous-étapes d’une étape d’une promo */}
              <Route
                path="promos/:promoId/etapes/:etapeId/sous-etapes"
                element={<SousEtapesDetail />}
              />

              {/* Calendrier global des promotions (sous le dashboard) */}
              <Route path="calendar" element={<PromoCalendar />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
