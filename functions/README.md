Cloud Functions for homes-matching

This folder contains two example functions:
- `onEventSubmission`: Firestore trigger that runs when `events/{eventId}/meta` is updated with `submissionComplete: true`.
- `scheduledOptimization`: daily scheduled runner (Cloud Scheduler via Cloud Functions Pub/Sub schedule).

It uses an ILP prototype (`ilp_scheduler.js`) that relies on `javascript-lp-solver`.

Setup

1. Install dependencies

```bash
cd functions
npm install
```

2. Deploy (requires Firebase CLI configured and project set)

```bash
firebase deploy --only functions
```

Notes

- The `index.js` contains TODO placeholders for mapping your Firestore schema to the ILP input shape (`slots`, `studios`, `bands`). Update those fetches to match your actual collections/subcollections.
- The ILP prototype does not include travel-time constraints; if you require travel enforcement, extend `ilp_scheduler.buildModel` with pairwise constraints or expand time indices accordingly.
