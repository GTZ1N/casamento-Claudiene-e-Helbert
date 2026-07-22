import { useState } from 'react';
import { checkAdminCredentials, setAdminAuthenticated } from '../../lib/adminAuth';
import './admin-login.css';

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkAdminCredentials(username, password)) {
      setAdminAuthenticated();
      onSuccess();
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="section-eyebrow">área restrita</p>
        <h1 className="admin-login-title">Entrar</h1>

        <input
          type="text"
          className="admin-login-input"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
        />
        <input
          type="password"
          className="admin-login-input"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="admin-login-error">{error}</p>}

        <button type="submit" className="admin-login-submit">
          entrar
        </button>
      </form>
    </div>
  );
}
