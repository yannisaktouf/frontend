import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './style/PromoDetail.css';

const PromoDetail = () => {
  // Récupération de l'ID intervenant et promo
  const { intervenantId, promoId } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [progressByEtape, setProgressByEtape] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

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

  const getEtapeStatusKey = (etapeId) => {
    const p = progressByEtape[etapeId] || { done: 0, total: 0 };
    if (p.total === 0) return 'vide';
    if (p.done === 0) return 'rienfait';
    if (p.done < p.total) return 'encours';
    return 'termine';
  };

  // Synchronisation des statuts en BDD
  useEffect(() => {
    if (chargement) return;
    etapes.forEach((etape) => {
      const key = etape.id;
      const computedKey = getEtapeStatusKey(key);
      const computedLabel = labelByStatus[computedKey];

      if (etape.etape_status !== computedLabel) {
        fetch(
          `https://backend-u89i.onrender.com/promos/${promoId}/etapes/${key}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: computedLabel }),
          }
        )
          .then((res) => {
            if (res.ok) {
              setEtapes((prev) =>
                prev.map((e) =>
                  e.id === key ? { ...e, etape_status: computedLabel } : e
                )
              );
            } else {
              console.error(`Échec MAJ statut étape ${key}`);
            }
          })
          .catch((err) =>
            console.error(`Erreur réseau MAJ statut étape ${key}:`, err)
          );
      }
    });
  }, [chargement, etapes, progressByEtape, promoId]);

  // Chargement des données promo + étapes + sous-étapes
  const recupererDetailPromo = useCallback(async () => {
    try {
      setChargement(true);
      // 1) Promo
      const resPromo = await fetch(
        `https://backend-u89i.onrender.com/promos/${promoId}`
      );
      if (!resPromo.ok) throw new Error('Erreur chargement promo');
      setPromo(await resPromo.json());

      // 2) Étapes
      const resEtapes = await fetch(
        `https://backend-u89i.onrender.com/promos/${promoId}/etapes`
      );
      if (!resEtapes.ok) throw new Error('Erreur chargement étapes');
      const dataEtapes = await resEtapes.json();
      setEtapes(dataEtapes);

      // 3) Sous-étapes -> progression
      const prog = {};
      await Promise.all(
        dataEtapes.map(async (etape) => {
          const resSous = await fetch(
            `https://backend-u89i.onrender.com/promos/${promoId}/etapes/${etape.id}/sous_etapes`
          );
          if (!resSous.ok) return;
          const dataSous = await resSous.json();
          prog[etape.id] = {
            total: dataSous.length,
            done: dataSous.filter((s) => s.sous_etape_status === 'Terminé')
                     .length,
          };
        })
      );
      setProgressByEtape(prog);
    } catch (err) {
      console.error(err);
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [promoId]);

  useEffect(() => {
    recupererDetailPromo();
  }, [recupererDetailPromo]);

  if (chargement) return <div className="loading">Chargement…</div>;
  if (erreur)
    return (
      <div className="error">
        <h2>Erreur de chargement</h2>
        <p>{erreur}</p>
        <button
          onClick={() => navigate(`/dashboard/${intervenantId}/promos`)}
          className="back-link"
        >
          ← Retour aux promotions
        </button>
      </div>
    );

  return (
    <div className="container">
      <button
        onClick={() => navigate(`/dashboard/${intervenantId}/promos`)}
        className="back-link"
      >
        ← Retour aux promotions
      </button>
      <h1>Détails de la promo : {promo.promo_code}</h1>

      <div className="timeline-container">
        <div className="vertical-line" />
        <ul className="etapes-list">
          {etapes.map((etape) => {
            const key = etape.id;
            const statusKey = getEtapeStatusKey(key);
            return (
              <li
                key={key}
                className="etape-item"
                onClick={() =>
                  navigate(
                    `/dashboard/${intervenantId}/promos/${promoId}/etapes/${key}/sous-etapes`
                  )
                }
                title="Voir les sous-étapes"
              >
                <span className="etape-emoji">
                  {emojiByStatus[statusKey]}
                </span>
                <div className="etape-content">
                  <span className="etape-name">
                    {etape.etape_name}
                  </span>
                  <span
                    className={`etape-status ${statusKey}`}
                  >
                    {labelByStatus[statusKey]}
                  </span>
                  {progressByEtape[key]?.total > 0 && (
                    <span className="sous-progress">
                      ✅ {progressByEtape[key].done}/
                      {progressByEtape[key].total} sous-étapes terminées
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PromoDetail;
