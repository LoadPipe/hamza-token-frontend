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
import { useWeb3 } from '../../Web3Context';

/**
 * Component for displaying the user's payment history from PaymentEscrow
 * @param {Object} props
 * @param {Function} props.onPaymentReleased - Callback after successful payment release
 */
const PaymentHistoryList = ({ onPaymentReleased }) => {
  const { account, paymentEscrow, releasePayment } = useWeb3();
  const toast = useToast();
  
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [releasingPayment, setReleasingPayment] = useState(null);
  
  // Fetch payment history when component mounts
  useEffect(() => {
    if (account && paymentEscrow) {
      fetchPaymentHistory();
    }
  }, [account, paymentEscrow]);
  
  // Function to fetch payment history from the blockchain
  const fetchPaymentHistory = async () => {
    setLoadingPayments(true);
    
    try {
      if (!account || !paymentEscrow) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          status: "warning",
          duration: 3000,
          isClosable: true
        });
        setLoadingPayments(false);
        return;
      }
      
      // Get the provider to query for events
      const provider = paymentEscrow.runner?.provider;
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      try {
        // For demonstration purposes, we'll get a few recent payments
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10000 blocks
        
        // Create filter for PaymentReceived events
        const filter = paymentEscrow.filters.PaymentReceived();
        const logs = await provider.getLogs({
          fromBlock: fromBlock,
          toBlock: 'latest',
          address: paymentEscrow.target,
          topics: filter.topics
        });
        
        console.log(`Found ${logs.length} payment logs`);
        
        // Process logs to get unique payment IDs
        const uniquePaymentIds = new Set();
        for (const log of logs) {
          try {
            const parsedLog = paymentEscrow.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsedLog && parsedLog.args && parsedLog.args.length > 0) {
              const paymentId = parsedLog.args[0];
              
              // Verify that it's a properly formatted
              if (typeof paymentId === 'string' && 
                paymentId.startsWith('0x') && 
                paymentId.length === 66) { 
                uniquePaymentIds.add(paymentId);
              } else {
                console.warn('Invalid payment ID format:', paymentId);
              }
            }
          } catch (error) {
            console.error('Error parsing log:', error);
          }
        }
        
        console.log(`Found ${uniquePaymentIds.size} unique payment IDs`);
        
        // Convert to array and fetch details for each payment ID
        const paymentPromises = Array.from(uniquePaymentIds).map(async (id) => {
          try {
            console.log(`Fetching payment details for ID: ${id}`);
            const details = await paymentEscrow.getPayment(id);
            
            // Skip invalid payments
            if (!details || details.id === ethers.ZeroHash) {
              console.log('Skipping invalid payment');
              return null;
            }
            
            const formattedAmount = details.currency === ethers.ZeroAddress 
              ? ethers.formatEther(details.amount)
              : ethers.formatUnits(details.amount, 6); // USDC has 6 decimals
              
            const currencyLabel = details.currency === ethers.ZeroAddress ? 'ETH' : 'USDC';
            
            return {
              id: id,
              payer: details.payer,
              receiver: details.receiver,
              amount: formattedAmount,
              currency: currencyLabel,
              released: details.released
            };
          } catch (error) {
            console.error(`Error fetching payment ${id}:`, error);
            return null;
          }
        });
        
        const fetchedPayments = (await Promise.all(paymentPromises))
          .filter(payment => payment !== null);
        
        if (fetchedPayments.length === 0) {
          toast({
            title: "No payments found",
            description: "No payment history available",
            status: "info",
            duration: 3000,
            isClosable: true
          });
        } else {
          setPayments(fetchedPayments);
        }
      } catch (error) {
        console.error("Error fetching blockchain data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch payment data from blockchain",
          status: "error",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error("Error in fetchPaymentHistory:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history: " + error.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoadingPayments(false);
    }
  };
  
  // Handler for releasing a payment from escrow
  const handleReleasePayment = async (paymentId) => {
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

    try {
      setReleasingPayment(paymentId); // Track which payment is being released
      await releasePayment(paymentId);
      
      toast({
        title: 'Payment Released',
        description: 'Payment has been released from escrow',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh payment history and call the callback
      fetchPaymentHistory();
      if (onPaymentReleased && typeof onPaymentReleased === 'function') {
        onPaymentReleased();
      }
      
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast({
        title: 'Error',
        description: `Failed to release payment: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setReleasingPayment(null);
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
      <Heading size="md" textColor="white" mb={4}>Your Payment History (From PaymentEscrow)</Heading>
      
      {!account ? (
        <Text textColor="red.300">Please connect your wallet to view payment history</Text>
      ) : loadingPayments ? (
        <Center p={8}>
          <Spinner color="white" size="xl" />
        </Center>
      ) : payments.length === 0 ? (
        <Text textColor="white">No payments found</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {payments.map((payment, index) => (
            <Box key={index} p={4} borderWidth="1px" borderRadius="md" bg="gray.700">
              <SimpleGrid columns={[1, null, 2]} spacing={4}>
                <Box>
                  <Text textColor="white" fontWeight="bold">
                    Payment ID:
                  </Text>
                  <Text textColor="white" fontSize="sm" isTruncated>
                    {payment.id}
                  </Text>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Receiver:
                  </Text>
                  <Text textColor="white" fontSize="sm" isTruncated>
                    {payment.receiver}
                  </Text>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Amount:
                  </Text>
                  <Text textColor="white">
                    {payment.amount} {payment.currency}
                  </Text>
                </Box>
                
                <Box>
                  <Text textColor="white" fontWeight="bold">
                    Status:
                  </Text>
                  <Badge 
                    colorScheme={payment.released ? "green" : "yellow"}
                    p={1}
                  >
                    {payment.released ? "Released" : "In Escrow"}
                  </Badge>
                  
                  {!payment.released && (
                    <Button 
                      mt={4} 
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleReleasePayment(payment.id)}
                      isLoading={releasingPayment === payment.id}
                      width="full"
                    >
                      Release from Escrow
                    </Button>
                  )}
                </Box>
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      )}
      
      <Button 
        mt={4} 
        onClick={fetchPaymentHistory} 
        isLoading={loadingPayments}
        colorScheme="blue"
      >
        Refresh Payments
      </Button>
    </Box>
  );
};

export default PaymentHistoryList; 