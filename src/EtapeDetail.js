import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './style/PromoDetail.css';

export default function PromoDetail() {
  const { intervenantId, promoId } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [progressByEtape, setProgressByEtape] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const labelByStatus = {
    vide: 'Vide',
    rienfait: 'À faire',
    encours: 'En cours',
    termine: 'Terminé',
  };
  const emojiByStatus = {
    vide: '⚪',
    rienfait: '🔴',
    encours: '🟠',
    termine: '✅',
  };

  const getStatusKey = useCallback(id => {
    const { done = 0, total = 0 } = progressByEtape[id] || {};
    if (total === 0) return 'vide';
    if (done === 0) return 'rienfait';
    if (done < total) return 'encours';
    return 'termine';
  }, [progressByEtape]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const [resPromo, resEtapes] = await Promise.all([
        fetch(`https://backend-u89i.onrender.com/promos/${promoId}`),
        fetch(`https://backend-u89i.onrender.com/promos/${promoId}/etapes`)
      ]);
      if (!resPromo.ok) throw new Error('Erreur chargement promo');
      if (!resEtapes.ok) throw new Error('Erreur chargement étapes');

      const promoData = await resPromo.json();
      const etapesData = await resEtapes.json();
      setPromo(promoData);
      setEtapes(etapesData);

      const prog = {};
      await Promise.all(etapesData.map(async e => {
        const resSubs = await fetch(
          `https://backend-u89i.onrender.com/promos/${promoId}/etapes/${e.id}/sous_etapes`
        );
        if (!resSubs.ok) return;
        const subs = await resSubs.json();
        const doneCount = subs.filter(s => s.sous_etape_status === 'Terminé').length;
        prog[e.id] = { total: subs.length, done: doneCount };
      }));
      setProgressByEtape(prog);

      setUpdating(true);
      await Promise.all(etapesData.map(async e => {
        const key = getStatusKey(e.id);
        const label = labelByStatus[key];
        if (e.etape_status !== label) {
          await fetch(
            `https://backend-u89i.onrender.com/promos/${promoId}/etapes/${e.id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ statut: label }),
            }
          );
        }
      }));
      setMessage('Statuts synchronisés');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, [promoId, getStatusKey]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return (
    <div className="error">
      <h1>Erreur</h1>
      <p>{error}</p>
      <button onClick={() => navigate(`/dashboard/${intervenantId}/promos`)} className="back-link">
        ← Retour aux promotions
      </button>
    </div>
  );

  return (
    <div className="container">
      <button onClick={() => navigate(`/dashboard/${intervenantId}/promos`)} className="back-link">
        ← Retour aux promotions
      </button>
      <h1>Détails de la promo : {promo.promo_code}</h1>
      {updating && <p className="update-notice">Mise à jour des statuts...</p>}
      {message && <p className="confirmation-message">{message}</p>}

      <div className="timeline-container">
        <div className="vertical-line" />
        <ul className="etapes-list">
          {etapes.map(e => {
            const key = e.id;
            const statusKey = getStatusKey(key);
            const label = labelByStatus[statusKey];
            const emoji = emojiByStatus[statusKey];
            return (
              <li key={key} className="etape-item">
                {/* Direct link to step detail within dashboard context */}
                <Link
                  to={`/dashboard/${intervenantId}/promos/${promoId}/etapes/${key}`}
                  className="etape-link"
                >
                  <span className="etape-emoji">{emoji}</span>
                  <span className="etape-name">{e.etape_name}</span>
                  <span className={`etape-status ${statusKey}`}>{label}</span>
                </Link>
                {progressByEtape[key]?.total > 0 && (
                  <span className="sous-progress">
                    ✅ {progressByEtape[key].done}/{progressByEtape[key].total}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
