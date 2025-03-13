import React from 'react';
import { HStack, Button } from '@chakra-ui/react';

/**
 * NavigationTabs component for switching between different views of the app
 * 
 * @param {Object} props
 * @param {string} props.activeTab - The currently active tab
 * @param {Function} props.setActiveTab - Function to set the active tab
 */
const NavigationTabs = ({ activeTab, setActiveTab }) => {
  // Define the available tabs
  const tabs = [
    { id: 'user', label: 'User Info' },
    { id: 'baal', label: 'Baal Info' },
    { id: 'wrap-gov', label: 'Wrap Governance Token' },
    { id: 'fee', label: 'Set Fee' },
    { id: 'community-vault', label: 'Community Vault' },
    { id: 'payments', label: 'Payment Simulator' },
  ];

  return (
    <HStack spacing={4} mb={8}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          colorScheme={activeTab === tab.id ? 'blue' : 'gray'}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </HStack>
  );
};

export default NavigationTabs; 