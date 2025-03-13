import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { useWeb3 } from '../../Web3Context';

/**
 * Component for displaying and managing TestToken balance
 */
const TestTokenSection = () => {
  const { 
    account, 
    contractAddresses, 
    mintTestTokens, 
    getTestTokenBalance,
    getTestTokenInfo 
  } = useWeb3();
  
  const toast = useToast();
  
  // State for component
  const [balance, setBalance] = useState('0');
  const [tokenInfo, setTokenInfo] = useState({ name: 'Test Token', symbol: 'TEST' });
  const [mintAmount, setMintAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Check if TestToken is available
  const isTestTokenAvailable = contractAddresses && contractAddresses.TEST_TOKEN_ADDRESS;
  
  // Fetch token balance and info when component mounts or refreshes
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!account || !isTestTokenAvailable) return;
      
      setLoading(true);
      try {
        // Get token balance
        const tokenBalance = await getTestTokenBalance();
        setBalance(tokenBalance);
        
        // Get token info (name, symbol)
        const info = await getTestTokenInfo();
        setTokenInfo(info);
      } catch (error) {
        console.error('Error fetching token data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch token data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenData();
  }, [account, isTestTokenAvailable, refreshTrigger]);
  
  // Sanitize input to ensure it's a valid number
  const sanitizeNumber = (input, allowDecimal) => {
    let sanitized = allowDecimal
      ? input.replace(/[^0-9.]/g, '')
      : input.replace(/[^0-9]/g, '');

    if (allowDecimal) {
      const firstDecimalIndex = sanitized.indexOf('.');
      if (firstDecimalIndex !== -1) {
        sanitized =
          sanitized.substring(0, firstDecimalIndex + 1) +
          sanitized
            .substring(firstDecimalIndex + 1)
            .replace(/\./g, '');
      }
    }

    return sanitized;
  };
  
  // Handle minting new tokens
  const handleMintTokens = async () => {
    if (!account) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setMinting(true);
      
      // Call mint function
      const txHash = await mintTestTokens(mintAmount);
      
      toast({
        title: 'Success',
        description: `Successfully minted ${mintAmount} ${tokenInfo.symbol} tokens`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh balance
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast({
        title: 'Error',
        description: `Failed to mint tokens: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setMinting(false);
    }
  };
  
  // If TestToken is not available, show an error message
  if (!isTestTokenAvailable) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={6}
        bg="gray.800"
        width="100%"
      >
        <Heading size="md" textColor="white" mb={4}>Test Token Not Available</Heading>
        <Text textColor="white">
          The TestToken contract was not found in deploy.txt.
        </Text>
      </Box>
    );
  }
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      bg="gray.800"
      width="100%"
    >
      <Heading size="md" textColor="white" mb={4}>Test Token ({tokenInfo.symbol})</Heading>
      
      <VStack spacing={4} align="stretch">
        {/* Token Balance Stats */}
        <Box bg="gray.700" p={4} borderRadius="md">
          <Stat>
            <StatLabel textColor="gray.300">Your Balance</StatLabel>
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <StatNumber textColor="white" fontSize="2xl">
                  {balance} {tokenInfo.symbol}
                </StatNumber>
                <StatHelpText textColor="gray.400">
                  Contract Address: {contractAddresses.TEST_TOKEN_ADDRESS.slice(0, 8)}...{contractAddresses.TEST_TOKEN_ADDRESS.slice(-6)}
                </StatHelpText>
              </>
            )}
          </Stat>
        </Box>
        
        {/* Mint Form */}
        <Box bg="gray.700" p={4} borderRadius="md">
          <Heading size="sm" textColor="white" mb={2}>Mint Test Tokens</Heading>
          
          <HStack spacing={4}>
            <FormControl>
              <FormLabel textColor="white">Amount</FormLabel>
              <Input
                value={mintAmount}
                onChange={(e) => setMintAmount(sanitizeNumber(e.target.value, true))}
                textColor="white"
                placeholder="100"
              />
            </FormControl>
            
            <Button
              mt={8}
              colorScheme="purple"
              onClick={handleMintTokens}
              isLoading={minting}
              loadingText="Minting"
            >
              Mint Tokens
            </Button>
          </HStack>
        </Box>
        
        {/* Refresh Button */}
        <Button
          colorScheme="blue"
          variant="outline"
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          isLoading={loading}
          width="full"
        >
          Refresh Balance
        </Button>
      </VStack>
    </Box>
  );
};

export default TestTokenSection; 