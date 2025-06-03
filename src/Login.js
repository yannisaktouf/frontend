import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style/Login.css';

function Login() {
  const [name, setName] = useState('');
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.get(`https://backend-u89i.onrender.com/intervenants?name=${name}`);
      const intervenant = res.data;
      navigate(`/dashboard/${intervenant.id}`);
      
      
    } catch (err) {
        console.error("Erreur reçue :", err); // ✅ log complet
        const msg = err.response?.data?.error || "Erreur inconnue";
        setErreur(msg);
      }
  };
  

  return (
    <div className="login-container">
      <h2>Connexion Intervenant</h2>
      <input
        type="text"
        placeholder="Entrez votre nom"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin}>Se connecter</button>
      {erreur && <p className="erreur">{erreur}</p>}
    </div>
  );
}

export default Login;
