// Login simples só para dar uma trava na página privada de confirmados —
// este site não tem backend de autenticação, então isto é checado no
// navegador (não é uma proteção forte: quem abrir o bundle JS consegue ler
// a senha). O real "segredo" continua sendo a URL da página não ser linkada
// em lugar nenhum; isto só evita que alguém que ache o link entre direto.
const USERNAME = 'Claudiene';
const PASSWORD = 'casaldoano';
const STORAGE_KEY = 'ch-admin-authenticated';

export function checkAdminCredentials(username, password) {
  return username.trim().toLowerCase() === USERNAME.toLowerCase() && password === PASSWORD;
}

export function isAdminAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAdminAuthenticated() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function clearAdminAuthenticated() {
  localStorage.removeItem(STORAGE_KEY);
}
