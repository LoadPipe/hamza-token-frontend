import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Badge,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { useWeb3 } from '../../Web3Context';

/**
 * Component for displaying user's purchase and sales activity stats
 */
const UserStatsPanel = () => {
  const { account, getUserPurchaseInfo, getUserSalesInfo, contractAddresses } = useWeb3();
  
  // State for ETH transactions
  const [ethPurchaseInfo, setEthPurchaseInfo] = useState(null);
  const [ethSalesInfo, setEthSalesInfo] = useState(null);
  
  // State for TestToken transactions
  const [testPurchaseInfo, setTestPurchaseInfo] = useState(null);
  const [testSalesInfo, setTestSalesInfo] = useState(null);
  
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch stats when the component mounts
  useEffect(() => {
    if (account) {
      fetchUserStats();
    }
  }, [account]);

  // Function to fetch user purchase and sales stats
  const fetchUserStats = async () => {
    if (!account) return;
    
    try {
      setLoadingStats(true);
      
      // Fetch ETH transactions
      const ethPurchases = await getUserPurchaseInfo(account, 'ETH');
      const ethSales = await getUserSalesInfo(account, 'ETH');
      
      setEthPurchaseInfo(ethPurchases);
      setEthSalesInfo(ethSales);
      
      // Fetch TestToken transactions if available
      if (contractAddresses?.TEST_TOKEN_ADDRESS) {
        const testPurchases = await getUserPurchaseInfo(account, 'TEST_TOKEN');
        const testSales = await getUserSalesInfo(account, 'TEST_TOKEN');
        
        setTestPurchaseInfo(testPurchases);
        setTestSalesInfo(testSales);
      }
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      p={6}
      bg="gray.800"
      width="100%"
    >
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="md" textColor="white">Your Activity Stats</Heading>
        <Button 
          onClick={fetchUserStats} 
          isLoading={loadingStats}
          colorScheme="blue"
          size="sm"
        >
          Refresh Stats
        </Button>
      </HStack>
      
      {!account ? (
        <Text textColor="red.300">Please connect your wallet to view stats</Text>
      ) : loadingStats ? (
        <HStack justifyContent="center" py={4}>
          <Spinner color="white" />
          <Text color="white">Loading stats...</Text>
        </HStack>
      ) : (
        <SimpleGrid columns={[1, null, 2]} spacing={6}>
          {/* Purchase History */}
          <VStack align="stretch" bg="gray.700" p={4} borderRadius="md">
            <Text textColor="white" fontWeight="bold" fontSize="lg">Purchase History</Text>
            
            {/* Total Purchases */}
            <Box bg="gray.700" p={2} borderRadius="md">
              <Text textColor="white" fontWeight="bold">
                Total Purchases: {ethPurchaseInfo?.totalCount || '0'}
              </Text>
            </Box>
            
            <Text textColor="white" fontWeight="semibold" mt={2} fontSize="sm">
              Amount by Currency:
            </Text>
            
            {/* ETH Purchases */}
            <Box bg="gray.800" p={3} borderRadius="md">
              <HStack mb={1}>
                <Text textColor="white" fontWeight="semibold">ETH</Text>
                <Badge colorScheme="blue">Ethereum</Badge>
              </HStack>
              <Text textColor="white">
                {ethPurchaseInfo?.totalAmount || '0'} ETH
              </Text>
            </Box>
            
            {/* TestToken Purchases */}
            {contractAddresses?.TEST_TOKEN_ADDRESS && (
              <Box bg="gray.800" p={3} borderRadius="md" mt={2}>
                <HStack mb={1}>
                  <Text textColor="white" fontWeight="semibold">TEST</Text>
                  <Badge colorScheme="purple">Test Token</Badge>
                </HStack>
                <Text textColor="white">
                  {testPurchaseInfo?.totalAmount || '0'} TEST
                </Text>
              </Box>
            )}
          </VStack>
          
          {/* Sales History */}
          <VStack align="stretch" bg="gray.700" p={4} borderRadius="md">
            <Text textColor="white" fontWeight="bold" fontSize="lg">Sales History</Text>
            
            {/* Total Sales */}
            <Box bg="gray.700" p={2} borderRadius="md">
              <Text textColor="white" fontWeight="bold">
                Total Sales: {ethSalesInfo?.totalCount || '0'}
              </Text>
            </Box>
            
            <Text textColor="white" fontWeight="semibold" mt={2} fontSize="sm">
              Amount by Currency:
            </Text>
            
            {/* ETH Sales */}
            <Box bg="gray.800" p={3} borderRadius="md">
              <HStack mb={1}>
                <Text textColor="white" fontWeight="semibold">ETH</Text>
                <Badge colorScheme="blue">Ethereum</Badge>
              </HStack>
              <Text textColor="white">
                {ethSalesInfo?.totalAmount || '0'} ETH
              </Text>
            </Box>
            
            {/* TestToken Sales */}
            {contractAddresses?.TEST_TOKEN_ADDRESS && (
              <Box bg="gray.800" p={3} borderRadius="md" mt={2}>
                <HStack mb={1}>
                  <Text textColor="white" fontWeight="semibold">TEST</Text>
                  <Badge colorScheme="purple">Test Token</Badge>
                </HStack>
                <Text textColor="white">
                  {testSalesInfo?.totalAmount || '0'} TEST
                </Text>
              </Box>
            )}
          </VStack>
        </SimpleGrid>
      )}
    </Box>
  );
};

export default UserStatsPanel; 