// sheets.js
const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets('v4');

async function getProductDetails() {
  const client = await auth.getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1E61GD6-GrJodgtEHakqMzYvC9KtUiqLETZ4AQi-LxVw',
    range: 'Product Details!A2:F',
    auth: client,
  });
  return res.data.values;
}

async function saveOrder(orderArray) {
  const client = await auth.getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: 'YOUR_SHEET_ID',
    range: 'Orders!A:E',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [orderArray],
    },
    auth: client,
  });
}

module.exports = {
  getProductDetails,
  saveOrder
};
