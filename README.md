# GainmaxPrototype

## Run locally

```sh
npm start
```

The app runs at `http://localhost:3000`. Leads are stored in memory and are cleared when the server restarts.

## Enable postal search and roof drawing

The optional roof-mapping step uses the Google Maps JavaScript API and its Geocoding service. Enable Maps JavaScript API and Geocoding API in a Google Cloud project, attach billing, and set a browser API key restricted to those APIs and your development/production HTTP referrers:

```sh
GOOGLE_MAPS_API_KEY=your-restricted-browser-key npm start
```

Without the key, the quote wizard and lead flow still work; the map screen displays a setup message and can be skipped. Customers can search a Singapore or Malaysia postal code, trace an approximate roof outline, and submit the coordinates with their lead.
