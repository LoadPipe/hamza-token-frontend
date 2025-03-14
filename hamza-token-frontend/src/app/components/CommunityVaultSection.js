import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Spinner,
  Center,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Textarea,
  Divider,
  Badge,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for displaying and managing the Community Vault
 */
const CommunityVaultSection = () => {
  const { 
    contractAddresses, 
    communityVault, 
    getCommunityVaultLootBalance,
    getCommunityVaultTestTokenBalance,
    depositTestTokensToVault,
    distributeRewards,
    claimRewards,
    account,
    getTestTokenBalance,
    getTestTokenInfo,
    mintTestTokens
  } = useWeb3();
  const [lootTokenBalance, setLootTokenBalance] = useState('Loading...');
  const [testTokenBalance, setTestTokenBalance] = useState('Loading...');
  const [loadingCommunityVault, setLoadingCommunityVault] = useState(false);
  const [loadingTestTokenBalance, setLoadingTestTokenBalance] = useState(false);
  
  // State for distribute rewards form
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipientAddresses, setRecipientAddresses] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState(null);
  
  // State for claim rewards
  const [claimTokenAddress, setClaimTokenAddress] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  
  // State for test token deposit
  const [depositAmount, setDepositAmount] = useState('10');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositResult, setDepositResult] = useState(null);
  const [userTestTokenBalance, setUserTestTokenBalance] = useState('0');
  const [isMinting, setIsMinting] = useState(false);
  const [testTokenInfo, setTestTokenInfo] = useState({ name: 'Test Token', symbol: 'TEST' });
  
  const toast = useToast();

  // Fetch community vault balance when component mounts or dependencies change
  useEffect(() => {
    if (contractAddresses && communityVault) {
      fetchCommunityVaultLootBalance();
      fetchCommunityVaultTestTokenBalance();
    }
  }, [contractAddresses, communityVault]);

  // Auto-populate with LOOT token address if available
  useEffect(() => {
    if (contractAddresses && contractAddresses.LOOT_TOKEN_ADDRESS) {
      setTokenAddress(contractAddresses.LOOT_TOKEN_ADDRESS);
      setClaimTokenAddress(contractAddresses.LOOT_TOKEN_ADDRESS);
    }
  }, [contractAddresses]);

  // Fetch test token info and user balance when test token is available
  useEffect(() => {
    if (account && contractAddresses && contractAddresses.TEST_TOKEN_ADDRESS) {
      fetchUserTestTokenBalance();
      fetchTestTokenInfo();
    }
  }, [account, contractAddresses]);

  // Function to fetch test token info
  const fetchTestTokenInfo = async () => {
    try {
      const info = await getTestTokenInfo();
      setTestTokenInfo(info);
    } catch (error) {
      console.error('Error fetching test token info:', error);
    }
  };

  // Function to fetch user's test token balance
  const fetchUserTestTokenBalance = async () => {
    try {
      const balance = await getTestTokenBalance();
      setUserTestTokenBalance(balance);
    } catch (error) {
      console.error('Error fetching user test token balance:', error);
      setUserTestTokenBalance('Error');
    }
  };

  // Function to fetch the Community Vault's loot token balance
  const fetchCommunityVaultLootBalance = async () => {
    try {
      setLoadingCommunityVault(true);
      
      const result = await getCommunityVaultLootBalance();
      
      if (!result) {
        if (!contractAddresses || !contractAddresses.LOOT_TOKEN_ADDRESS) {
          setLootTokenBalance('Not available');
        } else if (!communityVault) {
          setLootTokenBalance('Vault contract not available');
        } else {
          setLootTokenBalance('Error loading');
        }
      } else {
        setLootTokenBalance(result.formatted);
      }
    } catch (error) {
      console.error('Error fetching community vault loot balance:', error);
      setLootTokenBalance('Error loading');
    } finally {
      setLoadingCommunityVault(false);
    }
  };

  // Function to fetch the Community Vault's test token balance
  const fetchCommunityVaultTestTokenBalance = async () => {
    try {
      setLoadingTestTokenBalance(true);
      
      const result = await getCommunityVaultTestTokenBalance();
      
      if (!result) {
        if (!contractAddresses || !contractAddresses.TEST_TOKEN_ADDRESS) {
          setTestTokenBalance('Not available');
        } else if (!communityVault) {
          setTestTokenBalance('Vault contract not available');
        } else {
          setTestTokenBalance('Error loading');
        }
      } else {
        setTestTokenBalance(result.formatted);
      }
    } catch (error) {
      console.error('Error fetching community vault test token balance:', error);
      setTestTokenBalance('Error loading');
    } finally {
      setLoadingTestTokenBalance(false);
    }
  };

  // Function to handle minting test tokens 
  const handleMintTestTokens = async () => {
    try {
      setIsMinting(true);
      await mintTestTokens(100); // Mint 100 test tokens
      toast({
        title: 'Test Tokens Minted',
        description: 'Successfully minted 100 test tokens to your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Refresh balance
      fetchUserTestTokenBalance();
    } catch (error) {
      console.error('Error minting test tokens:', error);
      toast({
        title: 'Error Minting Tokens',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsMinting(false);
    }
  };

  // Function to handle depositing test tokens to the vault
  const handleDepositTestTokens = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsDepositing(true);
      setDepositResult(null);

      const result = await depositTestTokensToVault(depositAmount);

      setDepositResult(result);

      if (result.success) {
        toast({
          title: 'Tokens Deposited',
          description: `Successfully deposited ${depositAmount} ${testTokenInfo.symbol} tokens to the Community Vault.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh balances
        fetchCommunityVaultTestTokenBalance();
        fetchUserTestTokenBalance();
      } else {
        toast({
          title: 'Failed to deposit tokens',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error depositing test tokens:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Function to handle distribute rewards
  const handleDistributeRewards = async () => {
    // Validate inputs
    if (!tokenAddress || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: 'Invalid token address',
        description: 'Please enter a valid Ethereum address for the token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Parse recipient addresses, removing empty lines and trimming whitespace
    const recipients = recipientAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && addr.match(/^0x[a-fA-F0-9]{40}$/));

    if (recipients.length === 0) {
      toast({
        title: 'No valid recipient addresses',
        description: 'Please enter at least one valid Ethereum address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsDistributing(true);
      setDistributionResult(null);

      const result = await distributeRewards(tokenAddress, recipients);

      setDistributionResult(result);

      if (result.success) {
        toast({
          title: 'Rewards Distributed',
          description: `Successfully distributed rewards to ${recipients.length} recipients.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh balances after distributing
        fetchCommunityVaultLootBalance();
        fetchCommunityVaultTestTokenBalance();
      } else {
        toast({
          title: 'Failed to distribute rewards',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error in distribute rewards handler:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Function to handle claiming rewards
  const handleClaimRewards = async () => {
    // Validate inputs
    if (!claimTokenAddress || !claimTokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: 'Invalid token address',
        description: 'Please enter a valid Ethereum address for the token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsClaiming(true);
      setClaimResult(null);

      const result = await claimRewards(claimTokenAddress);

      setClaimResult(result);

      if (result.success) {
        toast({
          title: 'Rewards Claimed',
          description: 'Successfully claimed your rewards.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh balances after claiming
        fetchCommunityVaultLootBalance();
        fetchCommunityVaultTestTokenBalance();
        fetchUserTestTokenBalance();
      } else {
        toast({
          title: 'Failed to claim rewards',
          description: result.error || 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error in claim rewards handler:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  // Function to refresh all balances
  const refreshAllBalances = () => {
    fetchCommunityVaultLootBalance();
    fetchCommunityVaultTestTokenBalance();
    fetchUserTestTokenBalance();
  };

  return (
    <VStack spacing={6} width="100%" maxW="900px">
      <Heading textColor="white" size="xl">Community Vault</Heading>
      
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        p={6}
        bg="gray.800"
        width="100%"
      >
        <VStack spacing={4} align="start">
          <Heading size="md" textColor="white">Vault Address</Heading>
          <Text textColor="white" wordBreak="break-all">
            {contractAddresses?.COMMUNITY_VAULT_ADDRESS || 'Not available'}
          </Text>
          
          <Heading size="md" textColor="white" mt={6}>Token Balances</Heading>
          <Tabs variant="soft-rounded" colorScheme="blue" width="100%">
            <TabList>
              <Tab color="white">LOOT Token</Tab>
              <Tab color="white">Test Token</Tab>
            </TabList>
            <TabPanels mt={4}>
              <TabPanel p={0}>
                {loadingCommunityVault ? (
                  <Center p={4}>
                    <Spinner color="white" size="md" />
                  </Center>
                ) : (
                  <VStack align="start" spacing={2} width="100%">
                    <HStack>
                      <Text textColor="white" fontSize="xl" fontWeight="bold">
                        {lootTokenBalance}
                      </Text>
                      <Text textColor="white">LOOT</Text>
                    </HStack>
                    
                    {lootTokenBalance === 'Not available' && (
                      <Text textColor="red.300" fontSize="sm">
                        LOOT token address is not available. Contract might not be initialized correctly.
                      </Text>
                    )}
                    
                    {lootTokenBalance === 'Vault contract not available' && (
                      <Text textColor="red.300" fontSize="sm">
                        Vault contract is not available. Please check your wallet connection.
                      </Text>
                    )}
                    
                    {lootTokenBalance === 'Error loading' && (
                      <Text textColor="red.300" fontSize="sm">
                        Error loading balance. Check console for details.
                      </Text>
                    )}
                  </VStack>
                )}
              </TabPanel>
              <TabPanel p={0}>
                {loadingTestTokenBalance ? (
                  <Center p={4}>
                    <Spinner color="white" size="md" />
                  </Center>
                ) : (
                  <VStack align="start" spacing={2} width="100%">
                    <HStack>
                      <Text textColor="white" fontSize="xl" fontWeight="bold">
                        {testTokenBalance}
                      </Text>
                      <Text textColor="white">{testTokenInfo.symbol}</Text>
                    </HStack>
                    
                    {testTokenBalance === 'Not available' && (
                      <Text textColor="red.300" fontSize="sm">
                        Test token address is not available. Contract might not be initialized correctly.
                      </Text>
                    )}
                    
                    {testTokenBalance === 'Vault contract not available' && (
                      <Text textColor="red.300" fontSize="sm">
                        Vault contract is not available. Please check your wallet connection.
                      </Text>
                    )}
                    
                    {testTokenBalance === 'Error loading' && (
                      <Text textColor="red.300" fontSize="sm">
                        Error loading balance. Check console for details.
                      </Text>
                    )}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          <Button 
            mt={4}
            colorScheme="blue"
            onClick={refreshAllBalances}
            isLoading={loadingCommunityVault || loadingTestTokenBalance}
          >
            Refresh Balances
          </Button>
        </VStack>
      </Box>

      {/* Deposit Test Tokens Section */}
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        p={6}
        bg="gray.800"
        width="100%"
      >
        <VStack spacing={4} align="start" width="100%">
          <Heading size="md" textColor="white">Deposit Test Tokens</Heading>
          
          <VStack align="start" spacing={4} width="100%">
            <HStack width="100%">
              <Text textColor="white">Your Balance:</Text>
              <Text textColor="white" fontWeight="bold">
                {userTestTokenBalance} {testTokenInfo.symbol}
              </Text>
              <Button 
                size="sm"
                colorScheme="green"
                ml="auto"
                onClick={handleMintTestTokens}
                isLoading={isMinting}
              >
                Mint 100 Test Tokens
              </Button>
            </HStack>

            <FormControl>
              <FormLabel textColor="white">Amount to Deposit</FormLabel>
              <NumberInput
                min={0.1}
                step={1}
                value={depositAmount}
                onChange={(valueString) => setDepositAmount(valueString)}
                textColor="white"
                bg="gray.700"
                max={parseFloat(userTestTokenBalance) || 0}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper color="white" />
                  <NumberDecrementStepper color="white" />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleDepositTestTokens}
              isLoading={isDepositing}
              width="100%"
              isDisabled={!account || !parseFloat(userTestTokenBalance) || parseFloat(userTestTokenBalance) <= 0}
            >
              Deposit {testTokenInfo.symbol} to Vault
            </Button>

            {!account && (
              <Text textColor="yellow.300" fontStyle="italic">
                Please connect your wallet to deposit test tokens.
              </Text>
            )}

            {depositResult && (
              <Box 
                mt={4} 
                p={4} 
                borderRadius="md" 
                bg={depositResult.success ? "green.800" : "red.800"}
                width="100%"
              >
                <VStack align="start" spacing={2}>
                  <Text textColor="white" fontWeight="bold">
                    {depositResult.success ? "Success" : "Error"}
                  </Text>

                  {depositResult.success && depositResult.txHash && (
                    <Text textColor="white" fontSize="sm" wordBreak="break-all">
                      Transaction Hash: {depositResult.txHash}
                    </Text>
                  )}

                  {!depositResult.success && depositResult.error && (
                    <Text textColor="white" fontSize="sm">
                      {depositResult.error}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </VStack>
      </Box>

      {/* Rewards Sections */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} width="100%">
        {/* Claim Your Rewards Section */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          p={6}
          bg="gray.800"
          width="100%"
        >
          <VStack spacing={4} align="start" width="100%">
            <Heading size="md" textColor="white">Claim Your Rewards</Heading>
            <Text textColor="gray.300">
              Claim any rewards that have been allocated to your account.
            </Text>

            {!account ? (
              <Text textColor="yellow.300" fontStyle="italic">
                Please connect your wallet to claim rewards.
              </Text>
            ) : (
              <>
                <FormControl>
                  <FormLabel textColor="white">Token Address</FormLabel>
                  <Input
                    placeholder="0x..."
                    value={claimTokenAddress}
                    onChange={(e) => setClaimTokenAddress(e.target.value)}
                    textColor="white"
                    bg="gray.700"
                  />
                  {contractAddresses?.LOOT_TOKEN_ADDRESS && (
                    <HStack mt={2}>
                      <Badge colorScheme="blue" cursor="pointer" 
                        onClick={() => setClaimTokenAddress(contractAddresses.LOOT_TOKEN_ADDRESS)}>
                        Use LOOT Token
                      </Badge>
                      {contractAddresses?.TEST_TOKEN_ADDRESS && (
                        <Badge colorScheme="green" cursor="pointer" 
                          onClick={() => setClaimTokenAddress(contractAddresses.TEST_TOKEN_ADDRESS)}>
                          Use TEST Token
                        </Badge>
                      )}
                    </HStack>
                  )}
                </FormControl>

                <Button
                  mt={4}
                  colorScheme="purple"
                  onClick={handleClaimRewards}
                  isLoading={isClaiming}
                  width="100%"
                >
                  Claim Rewards
                </Button>

                {claimResult && (
                  <Box 
                    mt={4} 
                    p={4} 
                    borderRadius="md" 
                    bg={claimResult.success ? "green.800" : "red.800"}
                    width="100%"
                  >
                    <VStack align="start" spacing={2}>
                      <Text textColor="white" fontWeight="bold">
                        {claimResult.success ? "Success" : "Error"}
                      </Text>

                      {claimResult.success && claimResult.txHash && (
                        <Text textColor="white" fontSize="sm" wordBreak="break-all">
                          Transaction Hash: {claimResult.txHash}
                        </Text>
                      )}

                      {!claimResult.success && claimResult.error && (
                        <Text textColor="white" fontSize="sm">
                          {claimResult.error}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </>
            )}
          </VStack>
        </Box>

        {/* Distribute Rewards Section */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          p={6}
          bg="gray.800"
          width="100%"
        >
          <VStack spacing={4} align="start" width="100%">
            <Heading size="md" textColor="white">Distribute Rewards</Heading>
            <Text textColor="gray.300">
              This function allows you to distribute rewards to multiple recipients at once. 
              You must have the SYSTEM_ROLE to use this feature.
            </Text>

            <FormControl>
              <FormLabel textColor="white">Token Address</FormLabel>
              <Input
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                textColor="white"
                bg="gray.700"
              />
              {contractAddresses?.LOOT_TOKEN_ADDRESS && (
                <HStack mt={2}>
                  <Badge colorScheme="blue" cursor="pointer" 
                    onClick={() => setTokenAddress(contractAddresses.LOOT_TOKEN_ADDRESS)}>
                    Use LOOT Token
                  </Badge>
                  {contractAddresses?.TEST_TOKEN_ADDRESS && (
                    <Badge colorScheme="green" cursor="pointer" 
                      onClick={() => setTokenAddress(contractAddresses.TEST_TOKEN_ADDRESS)}>
                      Use TEST Token
                    </Badge>
                  )}
                </HStack>
              )}
            </FormControl>

            <FormControl mt={4}>
              <FormLabel textColor="white">Recipient Addresses (one per line)</FormLabel>
              <Textarea
                placeholder="0x...\n0x...\n0x..."
                value={recipientAddresses}
                onChange={(e) => setRecipientAddresses(e.target.value)}
                textColor="white"
                bg="gray.700"
                rows={5}
              />
            </FormControl>

            <Button
              mt={4}
              colorScheme="teal"
              onClick={handleDistributeRewards}
              isLoading={isDistributing}
              width="100%"
            >
              Distribute Rewards
            </Button>

            {distributionResult && (
              <Box 
                mt={4} 
                p={4} 
                borderRadius="md" 
                bg={distributionResult.success ? "green.800" : "red.800"}
                width="100%"
              >
                <VStack align="start" spacing={2}>
                  <Text textColor="white" fontWeight="bold">
                    {distributionResult.success ? "Success" : "Error"}
                  </Text>

                  {distributionResult.success && distributionResult.txHash && (
                    <Text textColor="white" fontSize="sm" wordBreak="break-all">
                      Transaction Hash: {distributionResult.txHash}
                    </Text>
                  )}

                  {!distributionResult.success && distributionResult.error && (
                    <Text textColor="white" fontSize="sm">
                      {distributionResult.error}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

export default CommunityVaultSection; 