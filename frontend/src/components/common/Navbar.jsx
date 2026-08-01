import { NavLink, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/books', label: 'Library' },
  { to: '/commonplace', label: 'Commonplace' },
  { to: '/wrapped', label: 'Wrapped' },
  { to: '/settings', label: 'Settings' }
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-6 items-center justify-center rounded-b-sm bg-brass text-[10px] font-bold text-surface">
              LG
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">SoulPages</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `pb-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-ribbon text-ink'
                      : 'border-b-2 border-transparent text-muted hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'night' ? 'Switch to light theme' : 'Switch to night theme'}
            className="rounded-full border border-line p-2 text-ink-soft hover:border-brass hover:text-brass-deep"
          >
            {theme === 'night' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
          <span className="hidden font-mono text-xs text-muted sm:inline">{user.fullName || user.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-stamp-red hover:text-stamp-red"
          >
            <FiLogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-line px-6 py-2 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `whitespace-nowrap text-xs font-medium ${isActive ? 'text-ribbon' : 'text-muted'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
