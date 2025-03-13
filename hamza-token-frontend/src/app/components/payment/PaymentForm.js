import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../Web3Context';

/**
 * Component for creating fake payments
 * @param {Object} props
 * @param {Function} props.onPaymentCreated - Callback after successful payment creation
 */
const PaymentForm = ({ onPaymentCreated }) => {
  const { account, createFakePayment } = useWeb3();
  const toast = useToast();
  
  // Form state
  const [paymentReceiver, setPaymentReceiver] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0.1');
  const [paymentCurrency, setPaymentCurrency] = useState('ETH');
  const [creatingPayment, setCreatingPayment] = useState(false);

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

  // Handler for creating a fake payment
  const handleCreateFakePayment = async () => {
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

    if (!paymentReceiver || !ethers.isAddress(paymentReceiver)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid receiver address',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setCreatingPayment(true);
      
      // Generate a unique payment ID 
      const timestamp = Date.now().toString();
      const randomData = Math.random().toString();
      const paymentIdInput = ethers.concat([
        ethers.toUtf8Bytes(timestamp),
        ethers.toUtf8Bytes(randomData),
        ethers.getBytes(account)
      ]);
      
      // Generate payment ID with keccak256 hash
      const paymentId = ethers.keccak256(paymentIdInput);
      
      console.log('Generated payment ID:', paymentId);
      
      const paymentResult = await createFakePayment(paymentReceiver, paymentAmount, paymentCurrency);
      
      toast({
        title: 'Payment Created',
        description: `Payment created successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setPaymentReceiver('');
      setPaymentAmount('0.1');
      
      // Call the callback if provided
      if (onPaymentCreated && typeof onPaymentCreated === 'function') {
        onPaymentCreated();
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: `Failed to create payment: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreatingPayment(false);
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
      <Heading size="md" textColor="white" mb={4}>Create Fake Payment</Heading>
      
      <SimpleGrid columns={1} spacing={4}>
        <FormControl>
          <FormLabel textColor="white">Receiver Address</FormLabel>
          <Input 
            placeholder="0x..." 
            value={paymentReceiver} 
            onChange={(e) => setPaymentReceiver(e.target.value)} 
            textColor="white"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel textColor="white">Amount</FormLabel>
          <Input 
            placeholder="0.1" 
            value={paymentAmount} 
            onChange={(e) => setPaymentAmount(sanitizeNumber(e.target.value, true))}
            textColor="white" 
          />
        </FormControl>
        
        <FormControl>
          <FormLabel textColor="white">Currency</FormLabel>
          <Select 
            value={paymentCurrency} 
            onChange={(e) => setPaymentCurrency(e.target.value)}
            textColor="white"
          >
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
          </Select>
        </FormControl>
        
        <Button 
          colorScheme="green" 
          onClick={handleCreateFakePayment}
          isLoading={creatingPayment}
          width="100%"
        >
          Create Payment
        </Button>
      </SimpleGrid>
    </Box>
  );
};

export default PaymentForm; 