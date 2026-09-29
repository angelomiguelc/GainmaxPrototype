const express = require('express');
const path = require('path');
const createRouter = require('./routes');

const normalizeMapsApiKey = (value) => String(value || '').trim().replace(/\\+$/, '');
const roleTargets = {
  customer: '/customer',
  engineer: '/engineer',
  sales: '/sales',
  admin: '/admin',
};

function getDemoRole(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('demoRole='));

  if (!cookie) return null;
  const role = cookie.split('=')[1];
  return roleTargets[role] ? role : null;
}

const app = express();
const leads = [];
const port = process.env.PORT || 3000;
const mapsApiKey = normalizeMapsApiKey(process.env.GOOGLE_MAPS_API_KEY);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('landing', { currentRole: getDemoRole(req) });
});

app.get('/login/:role', (req, res) => {
  const role = req.params.role;
  const target = roleTargets[role];

  if (!target) {
    return res.status(404).send('Unknown demo role.');
  }

  res.cookie('demoRole', role, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8,
  });

  return res.redirect(target);
});

app.get('/logout', (req, res) => {
  res.clearCookie('demoRole');
  res.redirect('/');
});

app.get('/engineer', (req, res) => {
  res.render('role-dashboard', {
    role: 'Engineer',
    currentRole: getDemoRole(req),
    description: 'System health, rooftop review queue, and installation planning.',
    primaryAction: 'Open engineer queue',
    primaryUrl: '/engineer',
  });
});

app.get('/sales', (req, res) => {
  res.render('role-dashboard', {
    role: 'Sales',
    currentRole: getDemoRole(req),
    description: 'Track leads, follow up status, and monitor conversion opportunities.',
    primaryAction: 'Open sales desk',
    primaryUrl: '/sales-leads',
  });
});

app.get('/admin', (req, res) => {
  res.render('role-dashboard', {
    role: 'Admin',
    currentRole: getDemoRole(req),
    description: 'Review platform activity, approvals, and operational performance.',
    primaryAction: 'Open admin console',
    primaryUrl: '/admin',
  });
});

app.use('/', createRouter(leads, mapsApiKey));

app.listen(port, () => {
  console.log(`Gainmax is running at http://localhost:${port}`);
});