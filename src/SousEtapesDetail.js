// src/components/SousEtapesDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './style/SousEtapesDetail.css';

const SousEtapesDetail = () => {
  const { intervenantId, promoId, etapeId } = useParams();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [etapeName, setEtapeName] = useState('');
  const [sousEtapes, setSousEtapes] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Promo code
        const resPromo = await fetch(
          `http://localhost:3000/api/promos/${promoId}`
        );
        if (resPromo.ok) {
          const promoData = await resPromo.json();
          setPromoCode(promoData.promo_code);
        }

        // Étape name
        const resEtape = await fetch(
          `http://localhost:3000/api/promos/${promoId}/etapes/`
        );
        if (resEtape.ok) {
          const etapeData = await resEtape.json();
          // Gérer cas tableau ou objet
          const etape = Array.isArray(etapeData)
            ? etapeData.find(item => String(item.id) === String(etapeId))
            : etapeData;
          if (etape) {
            setEtapeName(etape.etape_name || etape.name || etape.title || '');
            }
          };

        // Sous-étapes
        const resSous = await fetch(
          `http://localhost:3000/api/promos/${promoId}/etapes/${etapeId}/sous_etapes`
        );
        if (!resSous.ok) throw new Error('Sous-étapes non trouvées');
        const sousData = await resSous.json();
        setSousEtapes(sousData);
        const initMap = {};
        sousData.forEach(item => {
          initMap[item.sous_etape_id] = item.sous_etape_status === 'Terminé';
        });
        setStatusMap(initMap);
      } catch (err) {
        console.error(err);
        setError('Erreur chargement données');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [promoId, etapeId]);

  const toggleStatus = async id => {
    const prev = { ...statusMap };
    const updated = { ...prev, [id]: !prev[id] };
    setStatusMap(updated);
    try {
      const statusText = updated[id] ? 'Terminé' : 'À faire';
      const res = await fetch(
        `http://localhost:3000/api/promos/${promoId}/etapes/${etapeId}/sous_etapes/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusText }),
        }
      );
      if (!res.ok) throw new Error();
    } catch {
      setStatusMap(prev);
    }
  };

  const doneCount = useMemo(
    () => Object.values(statusMap).filter(Boolean).length,
    [statusMap]
  );
  const totalCount = sousEtapes.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleSendMessage = async () => {
    if (!email.trim() || !message.trim()) {
      alert('Veuillez remplir email et message.');
      return;
    }
    const subject = `Info OP ${promoCode}`;
    try {
      const res = await fetch('http://localhost:3000/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });
      if (!res.ok) throw new Error();
      alert('Message envoyé !');
      setEmail('');
      setMessage('');
    } catch {
      alert('Échec envoi message.');
    }
  };

  if (loading) return <div className="loading">Chargement…</div>;
  if (error) return (
    <div className="error">
      <h3>Erreur :</h3>
      <p>{error}</p>
      <button onClick={() => navigate(-1)} className="back-link">← Retour</button>
    </div>
  );

  return (
    <div className="sous-etapes-container">
      <button onClick={() => navigate(-1)} className="back-link">← Retour</button>
      <h2>Promo {promoCode} - {etapeName}</h2>

      <div className="progress-overall">
        <span>{doneCount}/{totalCount} terminées</span>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span>{progressPercent}%</span>
      </div>

      <ul className="sous-etapes-list">
        {sousEtapes.map(item => (
          <li key={item.sous_etape_id} className={`sous-etape-item ${statusMap[item.sous_etape_id] ? 'termine' : 'a-faire'}`}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={statusMap[item.sous_etape_id] || false}
                onChange={() => toggleStatus(item.sous_etape_id)}
              />
              {item.sous_etape_name}
            </label>
          </li>
        ))}
      </ul>

      <div className="email-section">
        <label htmlFor="email" className="recipient-label">Destinataire</label>
        <input id="email" type="email" placeholder="exemple@domaine.com" className="email-input" value={email} onChange={e => setEmail(e.target.value)} />

        <label htmlFor="message" className="recipient-label">Message</label>
        <textarea id="message" className="message-textarea" placeholder="Votre message" value={message} onChange={e => setMessage(e.target.value)} />

        <button onClick={handleSendMessage} className="send-button">Envoyer par mail</button>
      </div>
    </div>
  );
};

export default SousEtapesDetail;