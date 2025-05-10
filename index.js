// index.js
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { google } = require('googleapis');
const creds = require('./google-creds.json');


const client = new Client();
const userState = {};
const userData = {};

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Bot is ready!'));

client.on('message', async msg => {
  const user = msg.from;
  const text = msg.body.trim().toLowerCase();

  if (!userState[user] && text === 'can you share more information') {
    userState[user] = 'main_menu';
    return msg.reply(`Assalam o Alaikum! Welcome to BeBlessed.pk WhatsApp Service.\n\nPlease reply with option number:\n1. Order Now\n2. Product More Details\n3. Product Pictures\n4. Talk To Us`);
  }

  if (userState[user] === 'main_menu') {
    const products = await getProductDetails();
    const selectedProduct = products[0];
    userData[user] = {
      product: selectedProduct[0],
      colorList: selectedProduct[1].split(',').map(c => c.trim()),
      sizeList: selectedProduct[2].split(',').map(s => s.trim()),
      price: selectedProduct[3],
      image: selectedProduct[5]
    };

    if (text === '1') {
      userState[user] = 'select_color';
      let response = 'Please select a color:\n';
      userData[user].colorList.forEach((c, i) => response += `${i + 1}. ${c}\n`);
      return msg.reply(response);
    } else if (text === '2') {
      return msg.reply(`Product link: ${selectedProduct[6]}`);
    } else if (text === '3') {
      return msg.reply(`🖼️ Image: ${selectedProduct[5]}`);
    } else if (text === '4') {
      delete userState[user];
      return msg.reply('Our support team will contact you shortly.');
    }
  }

  if (userState[user] === 'select_color') {
    const selectedIndex = parseInt(text) - 1;
    userData[user].color = userData[user].colorList[selectedIndex];
    userState[user] = 'select_size';
    let response = 'Please select a size:\n';
    userData[user].sizeList.forEach((s, i) => response += `${i + 1}. ${s}\n`);
    return msg.reply(response);
  }

  if (userState[user] === 'select_size') {
    const selectedIndex = parseInt(text) - 1;
    userData[user].size = userData[user].sizeList[selectedIndex];
    userState[user] = 'confirm_order';
    const d = userData[user];
    return msg.reply(`🛒 Order Summary:\nProduct: ${d.product}\nColor: ${d.color}\nSize: ${d.size}\nPrice: ${d.price}\nImage: ${d.image}\n\nReply *Confirm* to place your order.`);
  }

  if (userState[user] === 'confirm_order' && text === 'confirm') {
    await saveOrder([
      msg.from,
      userData[user].product,
      userData[user].color,
      userData[user].size,
      userData[user].price,
      new Date().toLocaleString()
    ]);
    delete userState[user];
    delete userData[user];
    return msg.reply('✅ Your order has been received. Thank you!');
  }
});

client.initialize();

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'google-creds.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets('v4');
const sheetId = '1E61GD6-GrJodgtEHakqMzYvC9KtUiqLETZ4AQi-LxVw';

async function getProductDetails() {
  const client = await auth.getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Product Details!A2:G',
    auth: client,
  });
  return res.data.values;
}

async function saveOrder(orderArray) {
  const client = await auth.getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Orders!A:F',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [orderArray]
    },
    auth: client,
  });
} 
