import React, { useState, useEffect } from 'react';
import './App.css';
import detectEthereumProvider from '@metamask/detect-provider';

function App() {
  const [analysis, setAnalysis] = useState('Loading analysis data...');
  const [suggestions, setSuggestions] = useState([]);
  const [account, setAccount] = useState(null);
  const backendUrl = 'http://localhost:3050'; // Your backend URL
  const clientId = 'uniqueClientId'; // Your client ID

  const fetchAnalysis = (address) => {
    fetch(`${backendUrl}/get_analysis?address=${address}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const lines = data.analysis.split('\n');
        const interactionLines = lines.filter(line => line.includes('interaction'));
        const suggestionLines = lines.filter(line => line.includes('Advertisement') || line.includes('Promotions'));

        setAnalysis(interactionLines.join('<br />'));
        setSuggestions(suggestionLines);
      })
      .catch(error => {
        console.error('Error fetching analysis data:', error);
        setAnalysis('Failed to load analysis data.');
      });
  };

  const detectAndSendWalletAddress = async (address) => {
    const response = await fetch(`${backendUrl}/receive_address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, address }),
    });

    if (!response.ok) {
      throw new Error('Failed to send wallet address to backend');
    }

    console.log('Wallet address sent to backend successfully');
    fetchAnalysis(address);
  };

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      try {
        await provider.request({ method: 'eth_requestAccounts' });
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          console.error('No accounts found.');
        } else {
          setAccount(accounts[0]);
          detectAndSendWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.log('Please install MetaMask!');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Transaction Analysis Data</h1>
        {!account ? (
         <button className="connect-btn" onClick={connectWallet}>
         Connect Wallet
       </button>
        ) : (
          <>
            <div id="analysis" dangerouslySetInnerHTML={{ __html: analysis }}></div>
            <h2>Suggested Ad Types</h2>
            <div id="suggestions">
              {suggestions.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;