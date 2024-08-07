require('dotenv').config();
const express = require('express');
const OAuthClient = require('intuit-oauth');
const json2xls = require('json2xls');
const fs = require('fs');

const app = express();
const port = 3000;

const oauthClient = new OAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: 'http://localhost:3000/callback',
});

// Step 1: Generate authorization URL
app.get('/authUri', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId, OAuthClient.scopes.Payment],
    state: 'intuit-test',
  });
  res.redirect(`${authUri}`);
});

// Step 2: Handle callback
app.get('/callback', (req, res) => {
  oauthClient.createToken(req.url)
    .then(async (tokenResponse) => {
      oauthClient.setToken(tokenResponse.token);

      const realmId = oauthClient.getToken().realmId;
      const accessToken = oauthClient.getToken().access_token;

      try {
        const response = await oauthClient.makeApiCall({
          url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from customer&minorversion=70`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });

        const customerData = response.body.QueryResponse.Customer;

        // Extract given name, family name, company name, and primary email address
        const extractedData = customerData.map(customer => ({
          GivenName: customer.GivenName,
          FamilyName: customer.FamilyName,
          CompanyName: customer.CompanyName,
          PrimaryEmailAddr: customer.PrimaryEmailAddr ? customer.PrimaryEmailAddr.Address : ''
        }));

        // Convert extracted data to xlsx format
        const xls = json2xls(extractedData);
        const filePath = 'customers.xlsx';
        fs.writeFileSync(filePath, xls, 'binary');
        console.log(`Customer data written to ${filePath}`);

        
        res.send('Authorization successful!');
      } catch (error) {
        console.error('Error making API call:', error);
        res.status(500).send('Error making API call: ' + error.message);
      }
    })
    .catch((error) => {
      console.error('Error exchanging authorization code:', error);
      res.status(500).send('Error exchanging authorization code: ' + error.message);
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
