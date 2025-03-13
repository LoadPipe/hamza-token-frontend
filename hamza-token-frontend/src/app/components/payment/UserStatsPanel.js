import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';
import { useWeb3 } from '../../Web3Context';

/**
 * Component for displaying user's purchase and sales activity stats
 */
const UserStatsPanel = () => {
  const { account, getUserPurchaseInfo, getUserSalesInfo } = useWeb3();
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [salesInfo, setSalesInfo] = useState(null);
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
      const purchases = await getUserPurchaseInfo(account);
      const sales = await getUserSalesInfo(account);
      
      setPurchaseInfo(purchases);
      setSalesInfo(sales);
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
      <Heading size="md" textColor="white" mb={4}>Your Activity Stats (From PurchaseTracker)</Heading>
      
      {!account ? (
        <Text textColor="red.300">Please connect your wallet to view stats</Text>
      ) : loadingStats ? (
        <Text textColor="white">Loading stats...</Text>
      ) : (
        <SimpleGrid columns={2} spacing={6}>
          <VStack align="start" bg="gray.700" p={4} borderRadius="md">
            <Text textColor="white" fontWeight="bold">Purchase History</Text>
            <Text textColor="white">
              Total Purchases: {purchaseInfo?.totalCount || '0'}
            </Text>
            <Text textColor="white">
              Total Spent: {purchaseInfo?.totalAmount || '0'} ETH
            </Text>
          </VStack>
          
          <VStack align="start" bg="gray.700" p={4} borderRadius="md">
            <Text textColor="white" fontWeight="bold">Sales History</Text>
            <Text textColor="white">
              Total Sales: {salesInfo?.totalCount || '0'}
            </Text>
            <Text textColor="white">
              Total Earned: {salesInfo?.totalAmount || '0'} ETH
            </Text>
          </VStack>
        </SimpleGrid>
      )}
      
      <Button 
        mt={4} 
        onClick={fetchUserStats} 
        isLoading={loadingStats}
        colorScheme="blue"
      >
        Refresh Stats
      </Button>
    </Box>
  );
};

export default UserStatsPanel; 