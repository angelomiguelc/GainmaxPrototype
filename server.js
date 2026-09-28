const express = require('express');
const path = require('path');
const createRouter = require('./routes');

const app = express();
const leads = [];
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', createRouter(leads, process.env.GOOGLE_MAPS_API_KEY || ''));

app.listen(port, () => {
  console.log(`Gainmax is running at http://localhost:${port}`);
});