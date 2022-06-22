import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import myEpicNft from './utils/MyEpicNFT.json';

const TWITTER_HANDLE = '0xNomada';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 50;

// I moved the contract address to the top for easy access.
const CONTRACT_ADDRESS = "0xB1d19Fd67978e1D10D4E4215f9A619866bE3f554";

const App = () => {
 
  const [tokenMinted, setTokenMinted] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentMintedNFTs, setCurrentMintedNFTs] = useState();
  const rinkebyChainId = "0x4"; 
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    let chainId = await ethereum.request({ method: 'eth_chainId' });
    // String, hex code of the chainId of the Rinkebey test network
    if (chainId !== rinkebyChainId) {
    	alert("You are not connected to the Rinkeby Test Network!");
      return;
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
    } else {
      console.log("No authorized account found")
    }
  }
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
      
    } catch (error) {
      console.log(error)
    }
  }
  
  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        
        let x = await connectedContract.getTotalNFTsMintedSoFar();
        setCurrentMintedNFTs(x.toNumber());
        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setTokenMinted(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });
        console.log("Setup event listener!")
        
      } else {  }
    } catch (error) {
      console.log(error)
    }
  }

  // Mint NFT
  const askContractToMintNft = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();
        
        console.log(nftTxn);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        setLoading(false);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // On load
  useEffect(() => {
    checkIfWalletIsConnected(); 
  }, [])
  
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <>
      <span style={{ "color" : "#fff", "display" : "block", "marginBottom" : "15px" }}>
        Your account: {currentAccount}
      </span>
      <button className="cta-button connect-wallet-button" onClick={askContractToMintNft} disabled={loading}>
          {loading && (
            <i
              className="fa-solid fa-rotate fa-spin"
              style={{ marginRight: "5px" }}
            />
          )}
          {loading && <span>Minting NFT...</span>}
          {!loading && <span>Mint NFT</span>}
      </button>
      <span style={{ "color" : "#fff", "display" : "block", "marginTop" : "30px", "fontSize" : "1.2rem" }} >Supply collection: {currentMintedNFTs}/50 Minted</span>  
    </>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
        </div>
        <div className="body-container">
          {tokenMinted? <p style={{ "color" : "#fff", "display" : "block", "marginTop" : "15px", "fontSize" : "1.2rem" }}>Hey there! We've minted your NFT and sent it to your wallet. Here's the link: 
            <a href={tokenMinted} target="_blank" style={{"color" : "#fff", "display" : "block", "marginTop" : "15px"}}>Opensea link</a>
          </p> : ''}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;