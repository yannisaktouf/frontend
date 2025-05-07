import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './style/PromoList.css';

function MesPromos() {
  const { intervenantId } = useParams();
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [semaine, setSemaine] = useState('all');
  const [semainesDispo, setSemainesDispo] = useState([]);

  // Différence de jours
  const getDaysDiff = endDateStr => {
    const today = new Date();
    const end = new Date(endDateStr);
    const diffMs = new Date(end.setHours(0,0,0,0)) - new Date(today.setHours(0,0,0,0));
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  // Couleurs J-XX
  const getDaysClass = days => {
    if (days >= 0 && days <= 15) return 'j-small';
    if (days <= 30) return 'j-medium';
    return 'j-large';
  };

  // Format date
  const formatDate = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Semaine-année
  const getSemaineAnnee = dateStr => {
    const date = new Date(dateStr);
    const onejan = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - onejan) / 86400000);
    const week = Math.ceil((dayOfYear + onejan.getDay() + 1) / 7);
    return `${date.getFullYear()}-S${week.toString().padStart(2,'0')}`;
  };

  // Statut d'après progressMap
  const getStatusFromSteps = promo => {
    const { done = 0, total = 0 } = progressMap[promo.id] || {};
    if (done === 0) return 'à venir';
    if (done < total) return 'en cours';
    return 'terminé';
  };

  // Charge promos
  useEffect(() => {
    const fetchData = async () => {
      setChargement(true);
      try {
        const res = await axios.get(
          `https://backend-u89i.onrender.com/api/promos/intervenants/${intervenantId}/promos`
        );
        const data = res.data;
        setPromos(data);
        const semaines = Array.from(
          new Set(data.map(p => getSemaineAnnee(p.start_date)))
        ).sort();
        setSemainesDispo(semaines);

        // Progression
        const map = {};
        await Promise.all(
          data.map(async p => {
            const resEtapes = await axios.get(
              `https://backend-u89i.onrender.com/api/promos/${p.id}/etapes`
            );
            const etapes = resEtapes.data;
            map[p.id] = {
              total: etapes.length,
              done: etapes.filter(e => e.etape_status === 'Terminé').length,
            };
          })
        );
        setProgressMap(map);
      } catch (err) {
        console.error(err);
        setErreur('Impossible de charger les promotions.');
      } finally {
        setChargement(false);
      }
    };
    fetchData();
  }, [intervenantId]);

  if (chargement) return <div className="chargement">Chargement…</div>;
  if (erreur) return <div className="erreur">{erreur}</div>;

  return (
    <div className="promos-container">
      
      {/* 
        <button
          className="btn-retour-dashboard"
          onClick={() => navigate(`/dashboard/${intervenantId}`)}
        >
          ⬅️ Retour au Dashboard
        </button>
      */}


      <h1>Mes promotions à traiter</h1>

      {/* Filtre semaine */}
      <div className="filters">
        <select value={semaine} onChange={e => setSemaine(e.target.value)}>
          <option value="all">Toutes les semaines</option>
          {semainesDispo.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>



      <ul className="promos-list">
        {promos
          .filter(p => (semaine === 'all' || getSemaineAnnee(p.start_date) === semaine) && getDaysDiff(p.end_date) <= 30 && getDaysDiff(p.end_date) >= 0)
          .sort((a, b) => {
            const dA = getDaysDiff(a.end_date);
            const dB = getDaysDiff(b.end_date);
            const fA = dA >= 0;
            const fB = dB >= 0;
            if (fA && !fB) return -1;
            if (!fA && fB) return 1;
            return dA - dB;
          })
          .map(promo => {
            const { done = 0, total = 0 } = progressMap[promo.id] || {};
            const status = getStatusFromSteps(promo);
            const daysDiff = getDaysDiff(promo.end_date);
            const progress = total === 0 ? 0 : Math.round((done / total) * 100);

            return (
              <li key={promo.id} className="promo-item">
                <div className="promo-header">
                  <Link
                    to={`/dashboard/${intervenantId}/promos/${promo.id}`}
                    className="promo-code"
                  >
                    {`${promo.promo_code} : ${promo.title.slice(0,35)}…`}
                  </Link>
                  <span className={`promo-status ${status.replace(' ', '-')}`}>{status}</span>
                </div>

                <div className="date-badges">
                  <span className="date-pill start">Déb : {formatDate(promo.start_date)}</span>
                  <span className="date-pill end">Fin : {formatDate(promo.end_date)}</span>
                  {daysDiff >= 0 && <span className={`jours-pill ${getDaysClass(daysDiff)}`}>J-{daysDiff}</span>}
                </div>

                <div className="progress-section">
                  <div className="progress-info">Étapes : {done}/{total}</div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default MesPromos;
