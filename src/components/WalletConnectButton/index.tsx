import { useWeb3 } from '@/context/web3Context';
import { formatAddress } from '@/utils/helper';
import theme from '@/utils/theme';
import { Button, ChakraProvider } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import styles from './index.module.css';

export const WalletConnectButton: React.FC = () => {
  const { connectWallet, address, ens } = useWeb3();
  const [loading, setLoading] = useState<boolean>(false);

  const connect = useCallback(async () => {
    setLoading(true);
    await connectWallet();
    setLoading(false);
  }, [connectWallet]);

  return (
    <ChakraProvider theme={theme}>
      <div className={styles.container}>
        {!address ? (
          <Button
            loading={loading}
            onClick={connect}
            disabled={loading}
            bgColor='black'
            textColor='gray.400'
            _hover={{textColor: 'white'}}
          >
            {loading ? 'Connecting Wallet' : 'Connect Wallet' }
          </Button>
        ) : (
          <div className={styles.userAddress}>
            Your Address: {ens || formatAddress(address)}
          </div>
        )}
      </div></ChakraProvider>
  );
};

WalletConnectButton.displayName = 'WalletConnectButton';
