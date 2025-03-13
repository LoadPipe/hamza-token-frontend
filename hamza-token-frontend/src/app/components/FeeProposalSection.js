import React, { useState, useEffect } from 'react';
import {
    VStack,
    Button,
    Text,
    Box,
    Heading,
    HStack,
    Input,
    useToast
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for managing fee proposals
 */
const FeeProposalSection = () => {
    const {
        account,
        submitFeeProposal,
        submitFeeVote,
        executeFeeProposal,
        getGovernanceProposalState,
        getUserGovernanceTokenBalance
    } = useWeb3();

    const toast = useToast();

    // State management
    const [userGovernanceTokenBalance, setUserGovernanceTokenBalance] = useState('0');
    const [feeSetAmount, setFeeSetAmount] = useState('0');
    const [govProposalId, setGovProposalId] = useState('0x38d90616213766897e988bdf50bdcfda07623c9ac8a00b2a773ab054c5ef0daa');
    const [govProposalState, setGovProposalState] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [feeProposals, setFeeProposals] = useState([]);

    // Fetch user balances
    useEffect(() => {
        const fetchUserBalances = async () => {
            if (!account) return;
            try {
                const govBal = await getUserGovernanceTokenBalance(account);
                setUserGovernanceTokenBalance(govBal);
            } catch (err) {
                console.error('Error fetching user balances:', err);
            }
        };
        fetchUserBalances();
    }, [account, getUserGovernanceTokenBalance]);

    // Load saved fee-change proposals on component mount
    useEffect(() => {
        loadFeeProposals();
    }, [account]);

    // Helper function: Ensures that input is numeric
    const sanitizeNumber = (input, allowDecimal = false) => {
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

    // Retrieve saved fee-change governance proposals
    const getFeeProposals = () => {
        const proposalsJson = localStorage.getItem('feeProposals');
        if (proposalsJson?.length) {
            return JSON.parse(proposalsJson);
        }
        return [];
    };

    // Load saved fee-change proposals
    const loadFeeProposals = async () => {
        try {
            setLoading(true);
            const proposals = getFeeProposals();
            if (proposals?.length) {
                // Update the state of each proposal
                const updatedProposals = await Promise.all(
                    proposals.map(async (proposal) => {
                        try {
                            const currentState = await getGovernanceProposalState(proposal.id);
                            return { ...proposal, state: currentState };
                        } catch (err) {
                            console.error(`Error getting state for proposal ${proposal.id}:`, err);
                            return proposal;
                        }
                    })
                );
                setFeeProposals(updatedProposals);
            }
        } catch (err) {
            console.error('Error loading fee proposals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add a new fee-change proposal to the saved list
    const addFeeProposal = async (proposal) => {
        try {
            let proposals = getFeeProposals();
            if (!proposals) proposals = [];
            
            try {
                proposal.state = await getGovernanceProposalState(proposal.id);
            } catch (err) {
                console.error(`Error getting state for proposal ${proposal.id}:`, err);
                proposal.state = 'Unknown';
            }

            const existing = proposals.find((p) => p.id === proposal.id);
            if (existing) {
                existing.state = proposal.state;
            } else {
                proposals.push(proposal);
            }
            
            localStorage.setItem('feeProposals', JSON.stringify(proposals));
            setFeeProposals(proposals);
        } catch (err) {
            console.error('Error adding fee proposal:', err);
            setError(err.message);
        }
    };

    // Submit a new proposal to change fee
    const handleSubmitFeeProposal = async () => {
        if (!account) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        if (!feeSetAmount || parseInt(feeSetAmount) <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid fee amount',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            console.log('Submitting proposal to set fee to:', feeSetAmount);
            const proposalId = await submitFeeProposal(feeSetAmount);
            
            if (!proposalId) {
                console.warn('No proposal ID returned or event was not found.');
                toast({
                    title: 'Warning',
                    description: 'Proposal may have been submitted but no ID was returned',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                console.log(`Proposal submitted! ID: ${proposalId}`);
                
                // Add to local storage and state
                await addFeeProposal({ id: proposalId, fee: feeSetAmount });
                
                toast({
                    title: 'Success',
                    description: `Fee proposal submitted with ID: ${proposalId.substring(0, 10)}...`,
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (err) {
            console.error('Error submitting proposal:', err);
            setError(err.message);
            
            toast({
                title: 'Error',
                description: `Failed to submit proposal: ${err.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Vote on a proposal to change fee
    const handleSubmitFeeVote = async (id, support) => {
        if (!account) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            // Check current state before voting
            const state = await getGovernanceProposalState(id);
            console.log(`Current proposal state: ${state}`);
            
            if (state !== 'Active') {
                toast({
                    title: 'Warning',
                    description: `Cannot vote on a proposal in '${state}' state`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }
            
            await submitFeeVote(id, support);
            
            toast({
                title: 'Success',
                description: `Vote ${support ? 'FOR' : 'AGAINST'} submitted successfully`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            // Refresh proposals to update states
            await loadFeeProposals();
            
        } catch (err) {
            console.error('Error voting on proposal:', err);
            setError(err.message);
            
            toast({
                title: 'Error',
                description: `Failed to vote: ${err.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Execute a proposal to change fee
    const handleExecuteFeeProposal = async (id, fee) => {
        if (!account) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            // Check current state before executing
            const state = await getGovernanceProposalState(id);
            setGovProposalState(state);
            console.log(`Current proposal state: ${state}`);
            
            if (state !== 'Succeeded') {
                toast({
                    title: 'Warning',
                    description: `Cannot execute a proposal in '${state}' state`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }
            
            await executeFeeProposal(id, fee);
            
            toast({
                title: 'Success',
                description: `Proposal executed successfully, fee set to ${fee}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            // Refresh proposals to update states
            await loadFeeProposals();
            
        } catch (err) {
            console.error('Error executing proposal:', err);
            setError(err.message);
            
            toast({
                title: 'Error',
                description: `Failed to execute proposal: ${err.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4} width="100%" maxW="800px">
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
                Your Governance Token Balance: {userGovernanceTokenBalance}
            </Text>

            {/* Fee Proposal Creation */}
            <Box width="100%" bg="gray.800" p={4} borderRadius="md">
                <Heading size="md" textColor="white" mb={4}>Create Fee Proposal</Heading>
                
                <Input
                    type="text"
                    value={feeSetAmount}
                    onChange={(e) => {
                        setFeeSetAmount(sanitizeNumber(e.target.value));
                    }}
                    placeholder="Fee basis points (e.g. 100 = 1%)"
                    color="white"
                    borderColor="gray.600"
                    mb={4}
                />
                
                <Button
                    colorScheme="blue"
                    onClick={handleSubmitFeeProposal}
                    isLoading={loading}
                    width="full"
                >
                    Submit Proposal to Set Fee
                </Button>
            </Box>

            {/* Display proposal state if available */}
            {govProposalState && (
                <Text fontSize="lg" textColor="blue.300">
                    Last checked proposal state: <b>{govProposalState}</b>
                </Text>
            )}

            {/* Display errors */}
            {error && (
                <Text fontSize="lg" textColor="red.300">
                    Error: {error}
                </Text>
            )}

            {/* Fee Proposals List */}
            <Box width="100%" bg="gray.800" p={5} borderRadius="md">
                <Heading as="h2" size="lg" textColor="white" mb={4}>
                    Fee Proposals
                </Heading>
                <Button
                    mb={4}
                    onClick={loadFeeProposals}
                    isLoading={loading}
                >
                    Refresh Proposals
                </Button>
                
                {feeProposals.length === 0 ? (
                    <Text textColor="white">
                        No fee proposals found.
                    </Text>
                ) : (
                    feeProposals.map((proposal) => (
                        <Box
                            key={proposal.id}
                            bg="gray.700"
                            p={4}
                            mb={2}
                            borderRadius="md"
                        >
                            <Text textColor="white">
                                ID: {proposal.id}
                            </Text>
                            <Text textColor="white">
                                Fee: {proposal.fee} basis points
                            </Text>
                            <Text textColor="white">
                                State: {proposal.state || 'Unknown'}
                            </Text>
                            
                            <HStack spacing={4} mt={2}>
                                <Button
                                    colorScheme="green"
                                    onClick={() =>
                                        handleSubmitFeeVote(
                                            proposal.id,
                                            true
                                        )
                                    }
                                    isLoading={loading}
                                    isDisabled={proposal.state !== 'Active'}
                                >
                                    Vote Yes
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={() =>
                                        handleSubmitFeeVote(
                                            proposal.id,
                                            false
                                        )
                                    }
                                    isLoading={loading}
                                    isDisabled={proposal.state !== 'Active'}
                                >
                                    Vote No
                                </Button>
                            </HStack>
                            
                            <Button
                                colorScheme="purple"
                                mt={2}
                                onClick={() =>
                                    handleExecuteFeeProposal(
                                        proposal.id,
                                        proposal.fee
                                    )
                                }
                                isLoading={loading}
                                isDisabled={proposal.state !== 'Succeeded'}
                                width="full"
                            >
                                Execute Proposal
                            </Button>
                        </Box>
                    ))
                )}
            </Box>
        </VStack>
    );
};

export default FeeProposalSection; 