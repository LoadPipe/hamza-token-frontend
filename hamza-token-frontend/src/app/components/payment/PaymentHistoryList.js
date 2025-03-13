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
  HStack,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../Web3Context';

/**
 * Component for displaying the user's payment history from PaymentEscrow
 * @param {Object} props
 * @param {Function} props.onPaymentReleased - Callback after successful payment release
 */
const PaymentHistoryList = ({ onPaymentReleased }) => {
  const { account, paymentEscrow, releasePayment, contractAddresses } = useWeb3();
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
        
        logs.forEach(log => {
          try {
            // Parse the log to get the payment ID
            const parsedLog = paymentEscrow.interface.parseLog(log);
            const paymentId = parsedLog.args[0];
            // Only add valid payment IDs (32 bytes)
            if (ethers.isHexString(paymentId, 32)) {
              uniquePaymentIds.add(paymentId);
            }
          } catch (error) {
            console.error('Error parsing log:', error);
          }
        });
        
        // Convert to array and fetch details for each payment ID
        const paymentPromises = Array.from(uniquePaymentIds).map(async (id) => {
          try {
            // Validate payment ID format before making the call
            if (!ethers.isHexString(id, 32)) {
              console.log('Invalid payment ID format:', id);
              return null;
            }

            console.log(`Fetching payment details for ID: ${id}`);
            const details = await paymentEscrow.getPayment(id);
            
            // Skip invalid payments
            if (!details || !ethers.isHexString(details.id, 32)) {
              console.log('Invalid payment details:', details);
              return null;
            }

            console.log(details);
            // Determine currency type and formatting
            let currencyLabel = 'ETH';
            let formattedAmount;
            let tokenDecimals = 18; // Default for ETH and most ERC20s
            
            if (details.currency === ethers.ZeroAddress) {
              // ETH payment
              
              formattedAmount = ethers.formatEther(details.amount);
              currencyLabel = 'ETH';
            } else if (details.currency === contractAddresses?.TEST_TOKEN_ADDRESS) {
              // TestToken payment - assuming 18 decimals from the contract
              console.log("details.currency", details.currency);
              formattedAmount = ethers.formatUnits(details.amount, tokenDecimals);
              currencyLabel = 'TEST';
            } else {
              // Skip unknown currency types
              console.log('Unknown currency type:', details.currency);
              return null;
            }
            
            // Determine if this is a payment the user is involved with
            const isUserPayer = details.payer.toLowerCase() === account.toLowerCase();
            const isUserReceiver = details.receiver.toLowerCase() === account.toLowerCase();
            
            return {
              id: id,
              payer: details.payer,
              receiver: details.receiver,
              amount: formattedAmount,
              currency: currencyLabel,
              released: details.released,
              currencyAddress: details.currency,
              isUserPayer,
              isUserReceiver
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
        console.error('Error fetching payment history:', error);
        toast({
          title: "Error",
          description: `Failed to fetch payment history: ${error.message}`,
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error in payment history:', error);
      toast({
        title: "Error",
        description: `Something went wrong: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingPayments(false);
    }
  };
  
  // Handler for releasing a payment from escrow
  const handleReleasePayment = async (paymentId) => {
    if (!account || !paymentEscrow) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      setReleasingPayment(paymentId);
      
      const txHash = await releasePayment(paymentId);
      
      toast({
        title: "Payment Released",
        description: "Payment was successfully released from escrow",
        status: "success",
        duration: 5000,
        isClosable: true
      });
      
      // Refresh the payment list
      fetchPaymentHistory();
      
      // Call the callback if provided
      if (onPaymentReleased && typeof onPaymentReleased === 'function') {
        onPaymentReleased();
      }
      
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast({
        title: "Error",
        description: `Failed to release payment: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setReleasingPayment(null);
    }
  };
  
  // Helper to shorten an address for display
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      p={6}
      bg="gray.800"
      width="100%"
    >
      <HStack mb={4} justifyContent="space-between">
        <Heading size="md" textColor="white">Your Payment History</Heading>
        <Button 
          size="sm" 
          colorScheme="blue" 
          onClick={fetchPaymentHistory} 
          isLoading={loadingPayments}
        >
          Refresh
        </Button>
      </HStack>
      
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
            <Box 
              key={index} 
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              bg="gray.700"
              borderColor={
                payment.isUserReceiver && !payment.released 
                  ? "yellow.400" 
                  : "gray.600"
              }
            >
              <SimpleGrid columns={[1, null, 2]} spacing={4}>
                <Box>
                  <HStack justifyContent="space-between">
                    <Text textColor="white" fontWeight="bold">Type:</Text>
                    <Badge 
                      colorScheme={payment.isUserPayer ? "red" : "green"}
                    >
                      {payment.isUserPayer ? "Sent" : "Received"}
                    </Badge>
                  </HStack>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    {payment.isUserPayer ? "To:" : "From:"}
                  </Text>
                  <Text textColor="white" fontSize="sm" isTruncated>
                    {payment.isUserPayer 
                      ? shortenAddress(payment.receiver)
                      : shortenAddress(payment.payer)
                    }
                  </Text>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Amount:
                  </Text>
                  <HStack>
                    <Text textColor="white">
                      {payment.amount} {payment.currency}
                    </Text>
                    {payment.currencyAddress === contractAddresses?.TEST_TOKEN_ADDRESS && (
                      <Badge colorScheme="purple">Test Token</Badge>
                    )}
                  </HStack>
                </Box>
                
                <Box>
                  <Text textColor="white" fontWeight="bold">
                    Status:
                  </Text>
                  <Badge 
                    colorScheme={payment.released ? "green" : "yellow"}
                    mt={1}
                  >
                    {payment.released ? "Released" : "In Escrow"}
                  </Badge>
                  
                  <Text textColor="white" fontWeight="bold" mt={2}>
                    Payment ID:
                  </Text>
                  <Text textColor="gray.400" fontSize="xs" isTruncated>
                    {payment.id}
                  </Text>
                  
                  {!payment.released && payment.isUserReceiver && (
                    <Button
                      colorScheme="green"
                      size="sm"
                      mt={4}
                      width="full"
                      onClick={() => handleReleasePayment(payment.id)}
                      isLoading={releasingPayment === payment.id}
                      loadingText="Releasing"
                    >
                      Release Payment
                    </Button>
                  )}
                </Box>
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default PaymentHistoryList; 