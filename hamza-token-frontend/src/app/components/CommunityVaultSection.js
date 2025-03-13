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
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for displaying and managing the Community Vault
 */
const CommunityVaultSection = () => {
  const { contractAddresses, communityVault, getCommunityVaultLootBalance } = useWeb3();
  const [lootTokenBalance, setLootTokenBalance] = useState('Loading...');
  const [loadingCommunityVault, setLoadingCommunityVault] = useState(false);

  // Fetch community vault balance when component mounts or dependencies change
  useEffect(() => {
    if (contractAddresses && communityVault) {
      fetchCommunityVaultLootBalance();
    }
  }, [contractAddresses, communityVault]);

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
          
          <Heading size="md" textColor="white" mt={6}>Loot Token Balance</Heading>
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
                  Loot token address is not available. Contract might not be initialized correctly.
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
          
          <Button 
            mt={4}
            colorScheme="blue"
            onClick={fetchCommunityVaultLootBalance}
            isLoading={loadingCommunityVault}
          >
            Refresh Balance
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default CommunityVaultSection; 