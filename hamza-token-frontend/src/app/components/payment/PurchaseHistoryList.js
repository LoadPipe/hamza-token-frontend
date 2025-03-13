import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Center,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3, useContractAddresses } from '../../Web3Context';

/**
 * Component for displaying global purchase history from the PurchaseTracker
 */
const PurchaseHistoryList = () => {
  const { account, purchaseTracker } = useWeb3();
  const contractAddresses = useContractAddresses();
  const toast = useToast();
  
  const [allPurchases, setAllPurchases] = useState([]);
  const [loadingAllPurchases, setLoadingAllPurchases] = useState(false);
  
  // Fetch purchase history when component mounts
  useEffect(() => {
    if (account && purchaseTracker) {
      fetchAllPurchases();
    }
  }, [account, purchaseTracker]);
  
  // Function to fetch all purchases from the blockchain
  const fetchAllPurchases = async () => {
    if (!account || !purchaseTracker) {
      return;
    }

    setLoadingAllPurchases(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const filter = purchaseTracker.filters.PurchaseRecorded();
      
      // Get the events from the last 10000 blocks
      const blockNumber = await provider.getBlockNumber();
      const fromBlock = Math.max(0, blockNumber - 10000);
      
      const events = await purchaseTracker.queryFilter(filter, fromBlock);
      
      // Process the events to get purchase details
      const purchasesData = await Promise.all(events.map(async (event) => {
        const paymentId = event.args[0];
        const buyer = event.args[1];
        const amount = event.args[2];
        const currency = event.args[3]; // Extract currency address
        
        // Get the full purchase details including seller
        const purchase = await purchaseTracker.purchases(paymentId);
        
        // Determine if this is ETH or TEST token
        const isTestToken = contractAddresses?.TEST_TOKEN_ADDRESS && 
          currency.toLowerCase() === contractAddresses.TEST_TOKEN_ADDRESS.toLowerCase();
        
        const currencySymbol = isTestToken ? 'TEST' : 'ETH';
        
        return {
          id: paymentId,
          buyer: buyer,
          seller: purchase.seller,
          amount: ethers.formatEther(amount),
          timestamp: (await provider.getBlock(event.blockNumber)).timestamp,
          blockNumber: event.blockNumber,
          currency: currency,
          currencySymbol: currencySymbol
        };
      }));
      
      // Sort by block number (descending) to show newest first
      purchasesData.sort((a, b) => b.blockNumber - a.blockNumber);
      
      setAllPurchases(purchasesData);
      toast({
        title: "Purchases loaded",
        description: `Loaded ${purchasesData.length} purchases from blockchain`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error fetching all purchases:", error);
      toast({
        title: "Error loading purchases",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAllPurchases(false);
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
      <Heading size="md" textColor="white" mb={4}>Global Purchase History (From PurchaseTracker)</Heading>
      
      {!account ? (
        <Text textColor="red.300">Please connect your wallet to view purchase history</Text>
      ) : loadingAllPurchases ? (
        <Center p={8}>
          <Spinner color="white" size="xl" />
        </Center>
      ) : allPurchases.length === 0 ? (
        <Text textColor="white">No purchases found</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {allPurchases.map((purchase, index) => (
            <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="gray.700">
              <SimpleGrid columns={[1, null, 2]} spacing={4}>
                <Box>
                  <Text textColor="white" fontWeight="bold">
                    Transaction:
                  </Text>
                  <Badge colorScheme="green" mb={2}>
                    PURCHASE COMPLETED
                  </Badge>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Buyer:
                  </Text>
                  <Text textColor="white" fontSize="sm" isTruncated>
                    {purchase.buyer === account ? "You" : purchase.buyer}
                  </Text>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Seller:
                  </Text>
                  <Text textColor="white" fontSize="sm" isTruncated>
                    {purchase.seller === account ? "You" : purchase.seller}
                  </Text>
                </Box>
                
                <Box>
                  <Text textColor="white" fontWeight="bold">
                    Amount:
                  </Text>
                  <Text textColor="white" fontSize="lg" fontWeight="bold">
                    {purchase.amount} {purchase.currencySymbol}
                  </Text>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Date:
                  </Text>
                  <Text textColor="white">
                    {new Date(purchase.timestamp * 1000).toLocaleString()}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      )}
      
      <Button 
        mt={4} 
        onClick={fetchAllPurchases} 
        isLoading={loadingAllPurchases}
        colorScheme="blue"
      >
        Refresh Purchase History
      </Button>
    </Box>
  );
};

export default PurchaseHistoryList; 