const express = require('express');
const { randomUUID } = require('crypto');

const choices = {
  country: ['SG', 'MY'],
  property: ['Landed', 'Condo', 'C&I'],
  roof: ['Tile Roof', 'RC Roof', 'Mix', "I don't know"],
  steepness: ['Standard Roof', 'Steep Roof', "I don't know"],
  storeys: ['1', '2', '3', 'Other'],
  meter: ['63A 1-Phase', '63A 3-Phase', '100A 1-Phase', '100A 3-Phase', '200A and above', "I don't know"],
};

const DEFAULT_PANEL_COUNT = 30;
const PANEL_AREA_SQUARE_METERS = 2.6;
const USABLE_ROOF_RATIO = 0.75;
const MAX_PANEL_COUNT = 10000;

function roofAreaSquareMeters(points) {
  const earthRadiusMeters = 6378137;
  const radiansPerDegree = Math.PI / 180;
  let areaSum = 0;

  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    const latitude = point.lat * radiansPerDegree;
    const nextLatitude = nextPoint.lat * radiansPerDegree;
    let longitudeDelta = (nextPoint.lng - point.lng) * radiansPerDegree;

    if (longitudeDelta > Math.PI) longitudeDelta -= 2 * Math.PI;
    if (longitudeDelta < -Math.PI) longitudeDelta += 2 * Math.PI;

    areaSum += longitudeDelta * (2 + Math.sin(latitude) + Math.sin(nextLatitude));
  });

  return Math.abs(areaSum) * earthRadiusMeters ** 2 / 2;
}

function panelCountForRoof(points) {
  if (points.length < 3) return DEFAULT_PANEL_COUNT;

  const usableArea = roofAreaSquareMeters(points) * USABLE_ROOF_RATIO;
  return Math.min(MAX_PANEL_COUNT, Math.max(1, Math.floor(usableArea / PANEL_AREA_SQUARE_METERS)));
}

function estimateFor(input) {
  const rateByProperty = { Landed: 1.4, Condo: 1.6, 'C&I': 1.2 };
  const currency = input.country === 'SG' ? 'SGD' : 'MYR';
  const capacityKwp = (Number(input.panels) * 640) / 1000;
  const basePrice = capacityKwp * 1000 * rateByProperty[input.property];
  const systemPrice = basePrice * (input.steepness === 'Steep Roof' ? 1.1 : 1);
  const gst = input.country === 'SG' ? systemPrice * 0.09 : 0;
  const monthlyYield = (capacityKwp * 3.4 * 365) / 12;

  return {
    currency,
    capacityKwp,
    basePrice: Math.round(systemPrice * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    totalCost: Math.round((systemPrice + gst) * 100) / 100,
    monthlyYield: Math.round(monthlyYield),
    monthlySavings: Math.round(monthlyYield * 0.21 * 100) / 100,
  };
}

function quoteDetailsFrom(body) {
  const { country, property, roof, steepness, storeys, meter } = body;
  const customerName = (body.customerName || '').trim();
  const customerPhone = (body.customerPhone || '').trim();
  const customerEmail = (body.customerEmail || '').trim();
  const companyName = (body.companyName || '').trim();
  const monthlyBill = body.billUnknown === 'true' || body.monthlyBill === ''
    ? null
    : Number(body.monthlyBill);
  const postalCode = (body.postalCode || '').trim();
  let roofOutline = [];

  try {
    roofOutline = body.roofOutline ? JSON.parse(body.roofOutline) : [];
  } catch (error) {
    return null;
  }

  if (
    !choices.country.includes(country) ||
    !choices.property.includes(property) ||
    !choices.roof.includes(roof) ||
    !choices.steepness.includes(steepness) ||
    !choices.storeys.includes(storeys) ||
    !choices.meter.includes(meter) ||
    !customerName || customerName.length > 100 ||
    !/^[0-9+() -]{7,20}$/.test(customerPhone) ||
    customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
    companyName.length > 100 ||
    postalCode.length > 20 ||
    !Array.isArray(roofOutline) ||
    roofOutline.length > 100 ||
    roofOutline.some((point) =>
      !point ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) ||
      point.lat < -90 || point.lat > 90 ||
      point.lng < -180 || point.lng > 180
    ) ||
    (monthlyBill !== null && (!Number.isFinite(monthlyBill) || monthlyBill < 0))
  ) {
    return null;
  }

  const panels = panelCountForRoof(roofOutline);
  const roofArea = roofOutline.length >= 3
    ? Math.round(roofAreaSquareMeters(roofOutline) * 10) / 10
    : null;

  return { country, property, roof, steepness, storeys, meter, panels, monthlyBill, customerName, customerPhone, customerEmail, companyName, postalCode, roofOutline, roofArea };
}

module.exports = (leads, mapsApiKey = '') => {
  const router = express.Router();
  const pendingEstimates = new Map();

  function removeExpiredEstimates() {
    const now = Date.now();
    for (const [token, draft] of pendingEstimates) {
      if (draft.expiresAt <= now) pendingEstimates.delete(token);
    }
  }

  router.get('/', (req, res) => res.render('quote', { mapsApiKey }));

  router.post('/solar-snapshot', (req, res) => {
    const details = quoteDetailsFrom(req.body);
    if (!details) return res.status(400).send('Please provide valid quotation and contact details.');

    removeExpiredEstimates();
    const token = randomUUID();
    pendingEstimates.set(token, {
      details,
      estimate: estimateFor(details),
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    res.redirect(303, `/solar-snapshot/${token}`);
  });

  router.get('/solar-snapshot/:token', (req, res) => {
    removeExpiredEstimates();
    const draft = pendingEstimates.get(req.params.token);
    if (!draft) return res.status(404).send('This estimate has expired. Please start a new quote.');

    const annualSavings = draft.estimate.monthlySavings * 12;
    const degradedLifetimeFactor = Array.from({ length: 25 }, (_, year) => 0.995 ** year)
      .reduce((total, yearFactor) => total + yearFactor, 0);
    const annualGenerationKwh = draft.estimate.monthlyYield * 12;
    const annualCo2Tonnes = (annualGenerationKwh * 0.4) / 1000;

    res.render('solar-snapshot', {
      draft,
      token: req.params.token,
      annualSavings,
      lifetimeSavingsLow: annualSavings * degradedLifetimeFactor,
      lifetimeSavingsHigh: annualSavings * 25,
      annualGenerationMwh: annualGenerationKwh / 1000,
      annualCo2Tonnes,
      carEquivalent: annualCo2Tonnes / 4.6,
      treeEquivalent: (annualCo2Tonnes * 1000) / 21.77,
    });
  });

  router.post('/submit-lead', (req, res) => {
    removeExpiredEstimates();
    const draft = pendingEstimates.get(req.body.estimateToken);
    if (!draft) return res.status(400).send('This estimate has expired. Please request a new estimate.');

    leads.unshift({
      id: randomUUID(),
      createdAt: new Date(),
      status: 'Pending',
      ...draft.details,
      estimate: draft.estimate,
    });
    pendingEstimates.delete(req.body.estimateToken);

    res.redirect('/sales-leads');
  });

  router.get('/sales-leads', (req, res) => res.render('sales-leads', { leads }));

  router.post('/leads/:id/status', (req, res) => {
    const statusByAction = { approve: 'Accepted', decline: 'Rejected' };
    const nextStatus = statusByAction[req.body.action];
    const lead = leads.find((entry) => entry.id === req.params.id);

    if (!nextStatus || !lead) return res.sendStatus(404);

    lead.status = nextStatus;
    res.redirect('/sales-leads');
  });

  return router;
};