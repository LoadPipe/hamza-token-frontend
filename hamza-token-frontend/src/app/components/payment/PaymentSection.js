import React, { useState, useEffect } from 'react';
import { VStack, Heading } from '@chakra-ui/react';
import { useWeb3 } from '../../Web3Context';

// Import payment-related components
import UserStatsPanel from './UserStatsPanel';
import PaymentForm from './PaymentForm';
import PaymentHistoryList from './PaymentHistoryList';
import PurchaseHistoryList from './PurchaseHistoryList';
import TestTokenSection from './TestTokenSection';

/**
 * Payment Simulator section that combines all payment-related functionality
 */
const PaymentSection = () => {
  const { account, contractAddresses } = useWeb3();
  
  // Refresh handlers for child components
  const refreshAll = () => {
    // This will be passed down to child components to trigger refreshes
    if (account) {
      // The child components will handle their own refreshing
    }
  };

  // Fetch initial data when the component mounts
  useEffect(() => {
    if (account) {
      refreshAll();
    }
  }, [account]);

  // Check if TestToken is available
  const isTestTokenAvailable = contractAddresses && contractAddresses.TEST_TOKEN_ADDRESS;

  return (
    <VStack spacing={6} width="100%" maxW="900px">
      <Heading textColor="white" size="xl">Payment Simulator</Heading>
      
      {/* User purchase/sales stats */}
      <UserStatsPanel />
      
      {/* Payment creation form */}
      <PaymentForm onPaymentCreated={refreshAll} />
      
      {/* Payment escrow history */}
      <PaymentHistoryList onPaymentReleased={refreshAll} />
      
      {/* Global purchase history */}
      <PurchaseHistoryList />

      {/* TestToken section (if available) */}
      {isTestTokenAvailable && (
        <TestTokenSection />
      )}
    </VStack>
  );
};

export default PaymentSection; 