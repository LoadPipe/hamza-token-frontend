'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Center,
} from '@chakra-ui/react';
import { useWeb3 } from './Web3Context';

// Import components
import NavigationTabs from './components/NavigationTabs';
import UserInfoSection from './components/UserInfoSection';
import BaalInfoSection from './components/BaalInfoSection';
import GovernanceTokenSection from './components/GovernanceTokenSection';
import FeeProposalSection from './components/FeeProposalSection';
import CommunityVaultSection from './components/CommunityVaultSection';
import PaymentSection from './components/payment/PaymentSection';

export default function HomePage() {
    // Toggles which section to display
    const [viewMode, setViewMode] = useState('user');
    const { account } = useWeb3();

    return (
        <Box
            minHeight="100vh"
            display="flex"
            flexDirection="column"
            alignItems="center"
            bg="gray.900"
            p={4}
        >
            <Heading textColor="white" mb={4} size="3xl">
                Hamza Token Frontend
            </Heading>
            
            {/* Navigation tabs for switching between sections */}
            <NavigationTabs activeTab={viewMode} setActiveTab={setViewMode} />

            {/* Render the appropriate section based on viewMode */}
            <Center w="100%">
                {viewMode === 'user' && <UserInfoSection />}
                {viewMode === 'baal' && <BaalInfoSection />}
                {viewMode === 'wrap-gov' && <GovernanceTokenSection />}
                {viewMode === 'fee' && <FeeProposalSection />}
                {viewMode === 'community-vault' && <CommunityVaultSection />}
                {viewMode === 'payments' && <PaymentSection />}
                                </Center>
        </Box>
    );
}
