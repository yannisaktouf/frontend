import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './style/PromoList.css';

function PromoList() {
  const { intervenantId } = useParams();
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtre, setFiltre] = useState('all');
  const [semaine, setSemaine] = useState('all');
  const [semainesDispo, setSemainesDispo] = useState([]);

  const getStatusFromSteps = promo => {
    const done  = Number(promo.steps_finished || 0);
    const total = Number(promo.total_steps    || 0);
    if (done === 0)      return 'à venir';
    if (done < total)    return 'en cours';
    return 'terminé';
  };

  const getDaysDiff = endDateStr => {
    const today = new Date();
    const end   = new Date(endDateStr);
    const diffMs = new Date(end.setHours(0,0,0,0)) - new Date(today.setHours(0,0,0,0));
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDaysClass = days => {
    if (days >= 0 && days <= 15) return 'j-small';
    if (days <= 30)              return 'j-medium';
    return 'j-large';
  };

  const formatDate = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getSemaineAnnee = dateStr => {
    const date   = new Date(dateStr);
    const onejan = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - onejan) / 86400000);
    const week      = Math.ceil((dayOfYear + onejan.getDay() + 1) / 7);
    return `${date.getFullYear()}-S${week.toString().padStart(2,'0')}`;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  useEffect(() => {
    async function fetchPromos() {
      setChargement(true);
      try {
        const { data } = await axios.get('https://backend-u89i.onrender.com/promos');
        setPromos(data);
        const semaines = Array.from(new Set(data.map(p => getSemaineAnnee(p.start_date)))).sort();
        setSemainesDispo(semaines);
      } catch {
        setErreur('Impossible de charger les promotions');
      } finally {
        setChargement(false);
      }
    }
    fetchPromos();
  }, []);

  const promosFiltrees = promos.filter(promo => {
    const status      = getStatusFromSteps(promo);
    const semainePromo = getSemaineAnnee(promo.start_date);
    const statusOk    = filtre === 'all' ||
                        (filtre === 'upcoming' && status === 'à venir') ||
                        (filtre === 'ongoing'  && status === 'en cours') ||
                        (filtre === 'past'     && status === 'terminé');
    const semaineOk   = semaine === 'all' || semaine === semainePromo;
    return statusOk && semaineOk;
  });

  const promosTriees = [...promosFiltrees].sort((a, b) => {
    const daysA = getDaysDiff(a.end_date);
    const daysB = getDaysDiff(b.end_date);
    const aFuture = daysA >= 0;
    const bFuture = daysB >= 0;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return daysA - daysB;
  });

  if (chargement) return <div className="chargement">Chargement des promotions…</div>;
  if (erreur)     return <div className="erreur">{erreur}</div>;

  return (
    <div className="promos-container">


      <h1>Liste des promotions</h1>

      <div className="filters">
        <select value={filtre} onChange={e => setFiltre(e.target.value)}>
          <option value="all">Tous</option>
          <option value="upcoming">À venir</option>
          <option value="ongoing">En cours</option>
          <option value="past">Terminées</option>
        </select>
        <select value={semaine} onChange={e => setSemaine(e.target.value)}>
          <option value="all">Toutes les semaines</option>
          {semainesDispo.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <ul className="promos-list">
        {promosTriees.map(promo => {
          const done = Number(promo.steps_finished || 0);
          const total = Number(promo.total_steps || 0);
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
                  {`${promo.promo_code} : ${truncateText(promo.title, 35)}`}
                </Link>
                <div className="status-container">
                  <span className={`promo-status ${status.replace(' ', '-')}`}>{status}</span>
                  {daysDiff >= 0 && <span className={`jours-pill ${getDaysClass(daysDiff)}`}>J-{daysDiff}</span>}
                </div>
              </div>

              <div className="date-badges">
                <span className="date-pill start">Déb : {formatDate(promo.start_date)}</span>
                <span className="date-pill end">Fin : {formatDate(promo.end_date)}</span>
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

export default PromoList;
