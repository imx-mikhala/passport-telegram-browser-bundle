/* eslint-disable @typescript-eslint/no-explicit-any */
import { BiomeCombinedProviders, Body, Box, Button, Heading } from '@biom3/react';
import { ethers, providers } from 'ethers';
import { useEffect, useState } from 'react';

export const passportConfig = {
  clientId: 'CLIENT_ID',
  redirectUri: 'localhost:3000/redirect',
  logoutRedirectUri: 'localhost:3000/logout',
  audience: 'platform_api',
  scope: 'openid offline_access email transact',
}

const App = () => {
  const [zkEvmProvider, setZkEvmProvider] = useState<any>();
  const [passportWalletAddress, setPassportWalletAddress] = useState<string>();
  const [passportInstance, setPassportInstance] = useState<any>();

  // sign msg state
  const [signedMsg, setSignedMsg] = useState<boolean>();
  const [isValidSingature, setIsValidSignature] = useState<boolean>();

  useEffect(() => {
    const initialisePassport = async () => {
      if (window.immutable) {
        const config = window.immutable.config;
        const passport = window.immutable.passport;

        const passportInstance = new passport.Passport({
          baseConfig: new config.ImmutableConfiguration({
            environment: config.Environment.SANDBOX,
          }),
          ...passportConfig,
        });

        console.log('Passport initialised:', passportInstance);
        setPassportInstance(passportInstance);
      } else {
        console.error('Immutable SDK is not loaded.');
      }
    };

    const checkImmutableLoaded = setInterval(() => {
      if (window.immutable) {
        clearInterval(checkImmutableLoaded);
        initialisePassport();
      } else {
        console.log('Loading Immutable SDK');
      }
    }, 100);

    return () => clearInterval(checkImmutableLoaded);
  }, []);

  const onConnect = async () => {
    if (!passportInstance) {
      console.error('Passport instance not initialised.');
      return;
    }
    const provider = passportInstance.connectEvm();
    const [walletAddress] = await provider.request({
      method: 'eth_requestAccounts',
    });
    setPassportWalletAddress(walletAddress);
    console.log('Wallet address:', walletAddress);
    setZkEvmProvider(new providers.Web3Provider(provider));
  };

  const onPersonalSign = async () => {
    if (!zkEvmProvider) {
      console.error('Call connect first.');
      return;
    }

    if (!passportWalletAddress) {
      console.error('Wallet address not found.');
      return;
    }

    const signer = zkEvmProvider.getSigner();
    const message = "Testing sign message.";
    let signature: string;
    try {
      signature = await signer.signMessage(message);

      const digest = ethers.utils.hashMessage(message);
      const contract = new ethers.Contract(
        passportWalletAddress,
        ['function isValidSignature(bytes32, bytes) public view returns (bytes4)'],
        zkEvmProvider,
      );
    
      const isValidSignatureHex = await contract.isValidSignature(digest, signature);
      const ERC_1271_MAGIC_VALUE = '0x1626ba7e';

      setSignedMsg(true);
      setIsValidSignature(isValidSignatureHex === ERC_1271_MAGIC_VALUE);

      console.log('isValidSignatureHex', isValidSignatureHex === ERC_1271_MAGIC_VALUE);
    } catch (error: any) {
      console.log(error);
    }
  }

  const onLogout = async () => {
    if (!passportInstance) {
      console.error('Passport instance not initialised.');
      return;
    }
    await passportInstance.logout();
    setPassportWalletAddress(undefined);
  }
  
  const addPadding = () => {
    return (<Box sx={{ paddingY: 'base.spacing.x2' }} />)
  }

  const getConnectedView = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
          {addPadding()}
          {passportWalletAddress && <Body>Wallet Address: {passportWalletAddress}</Body>}
          {addPadding()}
          <Button onClick={onPersonalSign}>Personal Sign</Button>
          {addPadding()}
          {signedMsg && <Body>Valid signature: {isValidSingature ? 'True' : 'False'}</Body>}
          {addPadding()}
          <Button onClick={onLogout}>Logout</Button>
      </Box>
    )
  }

  return (
      <BiomeCombinedProviders>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <Heading>Passport & Telegram & Browser Bundle SDK</Heading>
          {addPadding()}
          {passportInstance ? (
            <Box>
              {!passportWalletAddress && <Button onClick={onConnect}>Connect</Button>}
              {passportWalletAddress && getConnectedView()}
            </Box>
          ) :
            <Box>
              <Body>Loading the Passport Instance...</Body>
            </Box>
          }
        </Box>
      </BiomeCombinedProviders>
  );
};

export default App;
