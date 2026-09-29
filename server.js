const express = require('express');
const path = require('path');
const createRouter = require('./routes');

const normalizeMapsApiKey = (value) => String(value || '').trim().replace(/\\+$/, '');
const roleTargets = {
  customer: '/customer',
  engineer: '/engineer/review',
  sales: '/sales/leads',
  admin: '/admin',
  client: '/client/project',
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
const leads = [{
  id: 'GMX-24018',
  status: 'Sales Closed',
  customerName: 'Tan Ah Kow',
  customerEmail: 'tan.ah.kow@example.com',
  customerPhone: '+65 8123 4018',
  companyName: '',
  country: 'SG',
  property: 'Landed',
  propertyDisplay: 'Residential Landed',
  roof: 'RC Roof',
  steepness: 'Standard Roof',
  storeys: '2',
  meter: '63A 3-Phase',
  panels: 30,
  postalCode: '018956',
  monthlyBill: 850,
  roofOutline: [],
  roofArea: null,
  createdAt: new Date('2026-08-10T09:00:00.000Z'),
  salesClosedAt: new Date('2026-08-12T09:00:00.000Z'),
  currentStage: 3,
  completedStages: [1, 2],
  completedAt: null,
  skomSigned: false,
  estimate: {
    currency: 'SGD',
    capacityKwp: 19.2,
    totalCost: 33484.8,
    basePrice: 30720,
    gst: 2764.8,
    monthlyYield: 2352,
    monthlySavings: 494,
  },
  specialCustomerRequests: 'Coordinate weekday roof access with the homeowner before delivery.',
  paymentMilestones: [
    { label: 'Project confirmation', percentage: 20, amount: 6696.96 },
    { label: 'Before installation', percentage: 30, amount: 10045.44 },
    { label: 'Project handover', percentage: 50, amount: 16742.4 },
  ],
  engineering: {
    assignedEngineer: 'Gabriel Tan',
    siteSupervisor: 'Marcus Lim',
    drawingPreparedBy: 'Gabriel Tan',
    drawing: {
      filename: 'GMX-24018-final-layout.txt',
      contentType: 'text/plain',
      buffer: Buffer.from('GMX-24018 approved rooftop layout. 30 x 640 Wp panels. 19.20 kWp DC capacity.'),
      uploadedAt: new Date('2026-08-14T09:00:00.000Z'),
    },
    bom: { panels: false, inverters: false, racking: false },
    shipping: {
      mounting: { status: 'Not dispatched', arrived: false },
      panels: { status: 'Not dispatched', arrived: false },
    },
    timeline: null,
    toolboxWorkers: '',
    wipStatus: 'Not started',
    wipNotes: '',
    acceptanceBy: '',
    acceptanceNotes: '',
    acceptanceComplete: false,
    warranty: null,
  },
}];
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
    primaryUrl: '/engineer/review',
  });
});

app.get('/sales', (req, res) => {
  res.render('role-dashboard', {
    role: 'Sales',
    currentRole: getDemoRole(req),
    description: 'Track leads, follow up status, and monitor conversion opportunities.',
    primaryAction: 'Open sales desk',
    primaryUrl: '/sales/leads',
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