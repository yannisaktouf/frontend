import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './style/PromoCalendar.css';

/**
 * Composant calendrier des promotions (mois, semaine, jour)
 * Clique sur une promo pour ouvrir son détail.
 */
function PromoCalendar() {
  const navigate = useNavigate();
  const { intervenantId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pour contrôler la vue et la date
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const localizer = useMemo(() => {
    moment.locale('fr');
    return momentLocalizer(moment);
  }, []);

  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('http://localhost:3000/api/promos');
        const evts = data.map((p) => {
          const start = new Date(p.start_date);
          const end = p.end_date ? new Date(p.end_date) : start;
          const now = new Date();
          const status = now < start
            ? 'à venir'
            : now > end
              ? 'terminé'
              : 'en cours';
          return { id: p.id, title: p.promo_code, start, end, status };
        });
        setEvents(evts);
      } catch (e) {
        setError('Impossible de charger les promotions');
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const eventPropGetter = (event) => {
    let backgroundColor = '#90cdf4';
    if (event.status === 'en cours') backgroundColor = '#48bb78';
    else if (event.status === 'à venir') backgroundColor = '#f6ad55';
    else if (event.status === 'terminé') backgroundColor = '#a0aec0';
    return {
      style: {
        backgroundColor,
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        padding: '2px 4px',
      },
    };
  };

  if (loading) return <p className="chargement">Chargement du calendrier...</p>;
  if (error) return <p className="erreur">{error}</p>;

  return (
    <div className="promo-calendar-container">
      <h1>Calendrier des promotions</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={['month', 'week', 'day']}
        toolbar
        style={{ height: '80vh' }}
        eventPropGetter={eventPropGetter}
        onSelectEvent={(event) => navigate(`/dashboard/${intervenantId}/promos/${event.id}`)}
        tooltipAccessor={(evt) =>
          `${evt.title}\n${moment(evt.start).format('DD/MM/YYYY')} — ${moment(evt.end).format('DD/MM/YYYY')}`
        }
        messages={{
          next: 'Suiv',
          previous: 'Préc',
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Heure',
          event: 'Promotion',
        }}
      />
    </div>
  );
}

export default PromoCalendar;
