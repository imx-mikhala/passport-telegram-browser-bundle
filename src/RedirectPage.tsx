// src/components/RedirectPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@biom3/react';
import { passportConfig } from './App';

const RedirectPage: React.FC = () => {
  const navigate = useNavigate();

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

        if (!passportInstance) {
          console.log('No passport found when redirecting');
          navigate('/');
          return;
        }
    
        const timer = setTimeout(() => {
          passportInstance.loginCallback();
          navigate('/');
        }, 2000);
    
        return () => clearTimeout(timer);

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
  }, [navigate]);

  return <Box>Redirecting...</Box>
};

export default RedirectPage;
