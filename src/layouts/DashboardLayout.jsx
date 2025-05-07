import React, { useState } from 'react';
import { Outlet, useParams, useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Tags, ClipboardList, Menu } from 'lucide-react';
import classNames from 'classnames';
import './DashboardLayout.css';   // <-- styles ci-dessous

export default function DashboardLayout() {
  const { intervenantId } = useParams();
  const location          = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  /* -------------  Pages de navigation  ------------- */
  const navItems = [
    { name: 'Accueil',            path: `/dashboard/${intervenantId}`,            Icon: Home },
    { name: 'Planning des OP',    path: `/dashboard/${intervenantId}/calendar`,   Icon: Calendar },
    { name: 'Toutes les promos',  path: `/dashboard/${intervenantId}/promos`,     Icon: Tags },
    { name: 'Mes promos',         path: `/dashboard/${intervenantId}/mes-promos`, Icon: ClipboardList },
  ];

  return (
    <div className="layout-container">
      {/* ========  BANDEAU FIXE  ======== */}
      <header className={classNames('navbar', collapsed && 'collapsed')}>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Basculer le bandeau"
        >
          <Menu size={22} />
        </button>

        <nav className="nav-links">
          {navItems.map(({ name, path, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={name}
                to={path}
                className={classNames('nav-item', isActive && 'active')}
              >
                <Icon size={18} />
                {!collapsed && <span>{name}</span>}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ========  CONTENU DÉFILANT  ======== */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
