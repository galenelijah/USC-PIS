const fs = require('fs');
const vars = fs.readFileSync('variables.txt', 'utf8').split('\n');
const code = fs.readFileSync('frontend/src/components/CampaignsPage.jsx', 'utf8');

// This is still a bit naive, but let's see.
