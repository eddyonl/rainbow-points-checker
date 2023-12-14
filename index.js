const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const pAll = require('p-all');
const colors = require ('colors');

// Function to fetch points data for a given address
async function fetchPointsData(address) {
  const headers = {
    Host: 'metadata.p.rainbow.me',
    Accept: 'application/json',
    'User-Agent': 'Rainbow/28 CFNetwork/1404.0.5 Darwin/22.3.0',
    Connection: 'keep-alive',
    'Accept-Language': 'en-GB,en;q=0.9',
    Authorization: 'Bearer 6CDGNtUsiUyAukyFV9Mx2dsqMTR9qyUB',
    'Content-Type': 'application/json',
  };

  const graphql = JSON.stringify({
    query: `query getPointsDataForWallet($address: String!) {
            points(address: $address) {
                error {
                    message
                    type
                }
                user {
                    referralCode
                    earnings {
                        total
                    }
                    stats {
                        position {
                            current
                        }
                    }
                }
            }
        }`,
    variables: { address },
  });

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: graphql,
    redirect: 'follow',
  };

  try {
    const response = await fetch(
      'https://metadata.p.rainbow.me/v1/graph',
      requestOptions
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching data for address:', address, error);
    return null;
  }
}

// Function to process each address
async function processAddresses(file) {
  const addresses = fs.readFileSync(file, 'utf8').split('\n');
  const outputFile = path.join(__dirname, 'output.txt');

  const tasks = addresses.map((address) => {
    return async () => {
      if (address) {
        try {
          const { data } = await fetchPointsData(address.trim());

          if (data?.points?.error) {
            console.log(data.points.error.message);
            return;
          }

          if (data?.points?.user) {
            const balance = data.points.user.earnings.total;
            if (balance > 0) {
                const log = `Address: ${address}, Points Balance: ${balance}`;
                console.log(log.green);
              fs.appendFileSync(outputFile, log + '\n');
            }
          }
        } catch (error) {
          console.error('Error fetching data for address:', address, error);
        }
      }
    };
  });

  // Run tasks with a concurrency of 3
  await pAll(tasks, { concurrency: 1 });
}

// Replace 'addresses.txt' with the path to your file containing the addresses
processAddresses('addresses.txt');
