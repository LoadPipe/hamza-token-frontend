import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Button,
    VStack,
    Text,
    HStack,
    SimpleGrid,
    Spinner,
    Flex,
    Divider,
    Center
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for displaying and managing Baal DAO information and proposals
 */
const BaalInfoSection = () => {
    const {
        account,
        submitLootProposal,
        getTotalShares,
        getTotalLoot,
        sponsorProposalViaSafe,
        submitBaalVote,
        cancelProposalViaSafe,
        getAllBaalProposals,
        getBaalProposalState,
        processBaalProposal,
        getBaalConfig,
        getBaalVaultBalance
    } = useWeb3();

    // Data states
    const [totalShares, setTotalShares] = useState('Loading...');
    const [totalLoot, setTotalLoot] = useState('Loading...');
    const [vaultEthBalance, setVaultEthBalance] = useState('Loading...');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [baalProposals, setBaalProposals] = useState([]);
    const [baalConfig, setBaalConfig] = useState(null);

    // Load Baal proposals
    const loadBaalProposals = async () => {
        if (!account) return;
        try {
            setLoading(true);
            const allProposals = await getAllBaalProposals();
            const proposalsWithState = await Promise.all(
                allProposals.map(async (prop) => {
                    const state = await getBaalProposalState(prop.id);
                    return {
                        id: prop.id.toString(),
                        sponsor: prop.sponsor,
                        yesVotes: prop.yesVotes.toString(),
                        noVotes: prop.noVotes.toString(),
                        state,
                    };
                })
            );
            setBaalProposals(proposalsWithState);
        } catch (err) {
            console.error('Error loading proposals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch basic Baal data
    useEffect(() => {
        const fetchData = async () => {
            if (!account) return;
            setTotalShares(await getTotalShares());
            setTotalLoot(await getTotalLoot());
        };
        fetchData();
    }, [account, getTotalShares, getTotalLoot]);

    // Fetch Baal config
    useEffect(() => {
        const fetchConfig = async () => {
            if (!account) return;
            try {
                const config = await getBaalConfig();
                setBaalConfig(config);
            } catch (err) {
                console.error('Error fetching Baal config:', err);
            }
        };
        fetchConfig();
    }, [account, getBaalConfig]);

    // Add a separate effect for the vault balance
    useEffect(() => {
        const fetchVaultBalance = async () => {
            if (!account) return;
            try {
                const vaultBalance = await getBaalVaultBalance();
                setVaultEthBalance(vaultBalance);
            } catch (error) {
                console.error('Error fetching vault balance:', error);
            }
        };
        fetchVaultBalance();
    }, [account, getBaalVaultBalance]);

    // Load proposals on component mount
    useEffect(() => {
        loadBaalProposals();
    }, [account]);

    // Submit a new proposal (mints 10 loot to self)
    const handleSubmitLootProposal = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Submitting proposal to mint 10 loot to self...');
            const proposalId = await submitLootProposal();
            if (!proposalId) {
                console.warn('No proposal ID returned or event was not found.');
            } else {
                console.log(`Proposal submitted! ID: ${proposalId}`);
                await loadBaalProposals();
            }
        } catch (err) {
            console.error('Error submitting proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Sponsor a proposal (via Gnosis Safe transaction)
    const handleSponsorBaalProposal = async (id) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Sponsoring proposal ${id}...`);
            await sponsorProposalViaSafe(id);
            console.log('Proposal sponsored successfully!');
            await loadBaalProposals();
        } catch (err) {
            console.error('Error sponsoring proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Vote on a proposal (via Gnosis Safe transaction)
    const handleBaalVote = async (id, support) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Voting on proposal ${id}: support = ${support}`);
            await submitBaalVote(id, support);
            console.log('Vote submitted successfully!');
            await loadBaalProposals();
        } catch (err) {
            console.error('Error submitting vote:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel a proposal (via Gnosis Safe transaction)
    const handleCancelBaalProposal = async (id) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Cancelling proposal ${id}...`);
            await cancelProposalViaSafe(id);
            console.log('Proposal cancelled successfully!');
            await loadBaalProposals();
        } catch (err) {
            console.error('Error cancelling proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Process a proposal
    const handleProcessBaalProposal = async (id) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Processing proposal ${id}...`);
            await processBaalProposal(id);
            console.log('Proposal processed successfully!');
            await loadBaalProposals();
        } catch (err) {
            console.error('Error processing proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={8} width="100%" align="center">
            {/* Top Section - Basic DAO Info and Create Proposal */}
            <Flex 
                width="100%" 
                flexDir={["column", "column", "row"]} 
                gap={6} 
                justify="center" 
                align="flex-start"
            >
                {/* Left side - Basic DAO Info */}
                <Box 
                    flex="1" 
                    bg="gray.800" 
                    p={5} 
                    borderRadius="md" 
                    width={["100%", "100%", "45%"]}
                >
                    <Heading as="h3" size="md" textColor="white" mb={4}>
                        Baal DAO Information
                    </Heading>
                    
                    <VStack spacing={2} align="start">
                        {account ? (
                            <Text fontSize="lg" textColor="white">
                                Connected Wallet: {account}
                            </Text>
                        ) : (
                            <Text fontSize="lg" textColor="red.300">
                                Please connect your wallet
                            </Text>
                        )}
                        <Text fontSize="lg" textColor="white">
                            Total Shares: {totalShares}
                        </Text>
                        <Text fontSize="lg" textColor="white">
                            Total Loot: {totalLoot}
                        </Text>
                        <Text fontSize="lg" textColor="white">
                            Baal Vault ETH Balance: {vaultEthBalance} ETH
                        </Text>
                        
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitLootProposal}
                            isLoading={loading}
                            mt={4}
                            width="100%"
                        >
                            Submit Proposal for 10 Loot
                        </Button>

                        {/* Display errors */}
                        {error && (
                            <Text fontSize="lg" textColor="red.300" mt={2}>
                                Error: {error}
                            </Text>
                        )}
                    </VStack>
                </Box>

                {/* Right side - Baal Configuration Data */}
                <Box 
                    flex="1" 
                    bg="gray.800" 
                    p={5} 
                    borderRadius="md" 
                    width={["100%", "100%", "45%"]}
                >
                    <Heading as="h3" size="md" textColor="white" mb={4}>
                        Baal Configuration
                    </Heading>
                    
                    {baalConfig ? (
                        <SimpleGrid columns={[1, 1, 2]} spacing={2} width="100%">
                            <Text color="white">
                                Voting Period: {baalConfig.votingPeriod}
                            </Text>
                            <Text color="white">
                                Grace Period: {baalConfig.gracePeriod}
                            </Text>

                            <Text color="white">
                                Proposal Offering:{' '}
                                {baalConfig.proposalOffering}
                            </Text>
                            <Text color="white">
                                Quorum Percent: {baalConfig.quorumPercent}
                            </Text>

                            <Text color="white">
                                Sponsor Threshold:{' '}
                                {baalConfig.sponsorThreshold}
                            </Text>
                            <Text color="white">
                                Min Retention %:{' '}
                                {baalConfig.minRetentionPercent}
                            </Text>

                            <Text color="white">
                                Admin Lock:{' '}
                                {baalConfig.adminLock ? 'true' : 'false'}
                            </Text>
                            <Text color="white">
                                Manager Lock:{' '}
                                {baalConfig.managerLock ? 'true' : 'false'}
                            </Text>

                            <Text color="white">
                                Governor Lock:{' '}
                                {baalConfig.governorLock ? 'true' : 'false'}
                            </Text>
                            <Text color="white">
                                Community Vault: {baalConfig.communityVault}
                            </Text>
                        </SimpleGrid>
                    ) : (
                        <Text color="white">Loading Baal config...</Text>
                    )}
                </Box>
            </Flex>

            {/* Divider between sections */}
            <Divider my={4} borderColor="gray.600" width="90%" />

            {/* Bottom Section - Proposals List */}
            <Box width="90%" bg="gray.800" p={5} borderRadius="md">
                <Heading as="h2" size="lg" textColor="white" mb={4}>
                    Proposals
                </Heading>
                
                <Button
                    mb={4}
                    onClick={loadBaalProposals}
                    isLoading={loading}
                >
                    Refresh Proposals
                </Button>
                
                {loading ? (
                    <Center p={8}>
                        <Spinner color="white" size="xl" />
                    </Center>
                ) : baalProposals.length === 0 ? (
                    <Text textColor="white">No proposals found.</Text>
                ) : (
                    <VStack spacing={4} align="stretch">
                        {baalProposals.map((proposal) => (
                            <Box
                                key={proposal.id}
                                bg="gray.700"
                                p={4}
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.600"
                            >
                                <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={4}>
                                    <Box>
                                        <Text textColor="gray.400" fontSize="sm">Proposal ID</Text>
                                        <Text textColor="white" isTruncated>
                                            {proposal.id}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text textColor="gray.400" fontSize="sm">Sponsor</Text>
                                        <Text textColor="white" isTruncated>
                                            {proposal.sponsor}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text textColor="gray.400" fontSize="sm">Status</Text>
                                        <Text 
                                            textColor={
                                                proposal.state === 'Ready' ? 'green.300' :
                                                proposal.state === 'Voting' ? 'blue.300' :
                                                proposal.state === 'Cancelled' ? 'red.300' :
                                                'white'
                                            }
                                            fontWeight="bold"
                                        >
                                            {proposal.state}
                                        </Text>
                                    </Box>
                                </SimpleGrid>
                                
                                <SimpleGrid columns={[1, 2]} spacing={4} mb={4}>
                                    <Box>
                                        <Text textColor="gray.400" fontSize="sm">Yes Votes</Text>
                                        <Text textColor="green.300" fontWeight="bold">
                                            {proposal.yesVotes}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text textColor="gray.400" fontSize="sm">No Votes</Text>
                                        <Text textColor="red.300" fontWeight="bold">
                                            {proposal.noVotes}
                                        </Text>
                                    </Box>
                                </SimpleGrid>

                                <Flex direction={["column", "row"]} gap={2} mt={2}>
                                    {/* Show sponsor button if proposal state is "Submitted" */}
                                    {proposal.state === 'Submitted' && (
                                        <Button
                                            colorScheme="orange"
                                            onClick={() =>
                                                handleSponsorBaalProposal(
                                                    proposal.id
                                                )
                                            }
                                            isLoading={loading}
                                            flex="1"
                                        >
                                            Sponsor Proposal
                                        </Button>
                                    )}

                                    {/* Voting options if in "Voting" */}
                                    {proposal.state === 'Voting' && (
                                        <>
                                            <Button
                                                colorScheme="green"
                                                onClick={() =>
                                                    handleBaalVote(
                                                        proposal.id,
                                                        true
                                                    )
                                                }
                                                isLoading={loading}
                                                flex="1"
                                            >
                                                Vote Yes
                                            </Button>
                                            <Button
                                                colorScheme="red"
                                                onClick={() =>
                                                    handleBaalVote(
                                                        proposal.id,
                                                        false
                                                    )
                                                }
                                                isLoading={loading}
                                                flex="1"
                                            >
                                                Vote No
                                            </Button>
                                            {proposal.sponsor &&
                                                proposal.sponsor.toLowerCase() ===
                                                    account?.toLowerCase() && (
                                                    <Button
                                                        colorScheme="yellow"
                                                        onClick={() =>
                                                            handleCancelBaalProposal(
                                                                proposal.id
                                                            )
                                                        }
                                                        isLoading={loading}
                                                        flex="1"
                                                    >
                                                        Cancel Proposal
                                                    </Button>
                                                )}
                                        </>
                                    )}

                                    {/* Process proposal if "Ready" */}
                                    {proposal.state === 'Ready' && (
                                        <Button
                                            colorScheme="purple"
                                            onClick={() =>
                                                handleProcessBaalProposal(
                                                    proposal.id
                                                )
                                            }
                                            isLoading={loading}
                                            flex="1"
                                        >
                                            Process Proposal
                                        </Button>
                                    )}
                                </Flex>
                            </Box>
                        ))}
                    </VStack>
                )}
            </Box>
        </VStack>
    );
};

export default BaalInfoSection; 