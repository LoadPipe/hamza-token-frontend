'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Button,
    VStack,
    Text,
    HStack,
    SimpleGrid,
} from '@chakra-ui/react';
import { useWeb3 } from './Web3Context';

export default function HomePage() {
    const {
        account,
        getTotalShares,
        getTotalLoot,
        sponsorProposalViaSafe,
        submitLootProposal,
        submitBaalVote,
        cancelProposalViaSafe,
        wrapGovernanceToken,
        unwrapGovernanceToken,
        getAllBaalProposals,
        getBaalProposalState,
        processBaalProposal,
        getUserLootBalance,
        getUserSharesBalance,
        submitFeeProposal,
        submitFeeVote,
        executeFeeProposal,
        getGovernanceProposalState,
        getUserGovernanceTokenBalance,
        getBaalConfig,
    } = useWeb3();

    // Toggles which section to display: "user" or "baal"
    const [viewMode, setViewMode] = useState('user');

    // Data states
    const [totalShares, setTotalShares] = useState('Loading...');
    const [totalLoot, setTotalLoot] = useState('Loading...');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [baalProposals, setBaalProposals] = useState([]);
    const [feeProposals, setFeeProposals] = useState([]);

    //governance vote params
    const [govTokenWrapAmount, setGovTokenWrapAmount] = useState('0');
    const [feeSetAmount, setFeeSetAmount] = useState('0');
    const [govProposalId, setGovProposalId] = useState(
        '0x38d90616213766897e988bdf50bdcfda07623c9ac8a00b2a773ab054c5ef0daa'
    );
    const [govProposalState, setGovProposalState] = useState('');

    // Baal config data
    const [baalConfig, setBaalConfig] = useState(null);

    // User balances
    const [userLootBalance, setUserLootBalance] = useState('0');
    const [userSharesBalance, setUserSharesBalance] = useState('0');
    const [userGovernanceTokenBalance, setUserGovernanceTokenBalance] =
        useState('0');

    // -----------------------------
    // Fetch user balances
    // -----------------------------
    useEffect(() => {
        const fetchUserBalances = async () => {
            if (!account) return;
            try {
                const lootBal = await getUserLootBalance(account);
                setUserLootBalance(lootBal);
                const sharesBal = await getUserSharesBalance(account);
                setUserSharesBalance(sharesBal);
                const govBal = await getUserGovernanceTokenBalance(account);
                setUserGovernanceTokenBalance(govBal);
            } catch (err) {
                console.error('Error fetching user balances:', err);
            }
        };
        fetchUserBalances();
    }, [account, getUserLootBalance, getUserSharesBalance]);

    // -----------------------------
    // Fetch Baal config
    // -----------------------------
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

    // -----------------------------
    // Fetch total shares/loot
    // -----------------------------
    useEffect(() => {
        const fetchData = async () => {
            if (!account) return;
            setTotalShares(await getTotalShares());
            setTotalLoot(await getTotalLoot());
        };
        fetchData();
    }, [account, getTotalShares, getTotalLoot]);

    // -----------------------------
    // Proposals
    // -----------------------------
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
                setFeeProposals(proposals);
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
            proposal.state = await getGovernanceProposalState(proposal.id);

            const existing = proposals.find((p) => p.id == proposal.id);
            if (existing) {
                existing.state = proposal.state;
            } else {
                proposals.push(proposal);
            }
            localStorage.setItem('feeProposals', JSON.stringify(proposals));
        } catch (err) {
            console.error('Error adding fee proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBaalProposals();
        loadFeeProposals();
    }, [account]);

    // -----------------------------
    // Handlers
    // -----------------------------
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

    // Wrap governance token
    const handleWrapGovToken = async () => {
        setLoading(true);
        setError(null);
        const amount = parseFloat(govTokenWrapAmount);
        try {
            console.log('Wrapping ', amount, 'governance token...');
            const newAmount = await wrapGovernanceToken(amount);
            setUserGovernanceTokenBalance(newAmount);
        } catch (err) {
            console.error('Error wrapping governance token:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Unwrap governance token
    const handleUnwrapGovToken = async () => {
        setLoading(true);
        setError(null);
        const amount = parseFloat(govTokenWrapAmount);
        try {
            console.log('Unwrapping ', amount, 'governance token...');
            const newAmount = await unwrapGovernanceToken(amount);
            setUserGovernanceTokenBalance(newAmount);
        } catch (err) {
            console.error('Error wrapping governance token:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    // -----------------------------
    // Submit a new proposal to change fee
    const handleSubmitFeeProposal = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Submitting proposal to mint 10 loot to self...');
            const proposalId = await submitFeeProposal(feeSetAmount);
            if (!proposalId) {
                console.warn('No proposal ID returned or event was not found.');
            } else {
                console.log(`Proposal submitted! ID: ${proposalId}`);
                //setGovProposalId('0x' + BigInt(proposalId).toString(16));

                //store proposal in localStorage
                addFeeProposal({ id: proposalId, fee: feeSetAmount });
            }
        } catch (err) {
            console.error('Error submitting proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Vote on a proposal to change fee
    const handleSubmitFeeVote = async (id, support) => {
        setLoading(true);
        setError(null);
        try {
            const state = await getGovernanceProposalState(id);
            console.log(state);
            await submitFeeVote(id, support);
        } catch (err) {
            console.error('Error voting on proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Execute a proposal to change fee
    const handleExecuteFeeProposal = async (id, fee) => {
        setLoading(true);
        setError(null);
        try {
            setGovProposalState(
                await getGovernanceProposalState(govProposalId)
            );
            await executeFeeProposal(id, fee);
        } catch (err) {
            console.error('Error executing proposal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Ensures that input is numeric by stripping out non-numerics
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
            {/* Toggle buttons */}
            <HStack spacing={4} mb={8}>
                <Button
                    colorScheme={viewMode === 'user' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('user')}
                >
                    User Info
                </Button>
                <Button
                    colorScheme={viewMode === 'baal' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('baal')}
                >
                    Baal Info
                </Button>
                <Button
                    colorScheme={viewMode === 'wrap-gov' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('wrap-gov')}
                >
                    Wrap Governance Token
                </Button>
                <Button
                    colorScheme={viewMode === 'fee' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('fee')}
                >
                    Set Fee
                </Button>
            </HStack>
            {/* Conditionally render either "User Info" or "Baal Info" */}
            {viewMode === 'user' && (
                // -----------------------------
                // USER INFO SECTION
                // -----------------------------
                <VStack spacing={4}>
                    <Text fontSize="lg" textColor="white">
                        Connected Wallet: {account || 'Not connected'}
                    </Text>
                    <Text fontSize="lg" textColor="white">
                        Your Loot Balance: {userLootBalance}
                    </Text>
                    <Text fontSize="lg" textColor="white">
                        Your Governance Token Balance:{' '}
                        {userGovernanceTokenBalance}
                    </Text>
                    <Text fontSize="lg" textColor="white">
                        Your Shares Balance: {userSharesBalance}
                    </Text>
                </VStack>
            )}

            {viewMode === 'baal' && (
                // -----------------------------
                // BAAL INFO SECTION
                // -----------------------------
                <>
                    <VStack spacing={2} mb={6}>
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
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitLootProposal}
                            isLoading={loading}
                        >
                            Submit Proposal for 10 Loot
                        </Button>

                        {/* Display errors */}
                        {error && (
                            <Text fontSize="lg" textColor="red.300">
                                Error: {error}
                            </Text>
                        )}
                    </VStack>

                    {/* Extra Baal Configuration Data */}
                    <Box
                        width="60%"
                        bg="gray.800"
                        p={5}
                        mb={6}
                        borderRadius="md"
                    >
                        <Heading as="h3" size="md" textColor="white" mb={3}>
                            Baal Configuration
                        </Heading>
                        {baalConfig ? (
                            <SimpleGrid columns={2} spacing={2} width="100%">
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

                    {/* Proposals List */}
                    <Box width="80%" bg="gray.800" p={5} borderRadius="md">
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
                        {baalProposals.length === 0 ? (
                            <Text textColor="white">No proposals found.</Text>
                        ) : (
                            baalProposals.map((proposal) => (
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
                                        Sponsor: {proposal.sponsor}
                                    </Text>
                                    <Text textColor="white">
                                        Yes Votes: {proposal.yesVotes}
                                    </Text>
                                    <Text textColor="white">
                                        No Votes: {proposal.noVotes}
                                    </Text>
                                    <Text textColor="white">
                                        State: {proposal.state}
                                    </Text>

                                    {/* Show sponsor button if proposal state is "Submitted" */}
                                    {proposal.state === 'Submitted' && (
                                        <Button
                                            colorScheme="orange"
                                            mt={2}
                                            onClick={() =>
                                                handleSponsorBaalProposal(
                                                    proposal.id
                                                )
                                            }
                                            isLoading={loading}
                                        >
                                            Sponsor Proposal
                                        </Button>
                                    )}

                                    {/* Voting options if in "Voting" */}
                                    {proposal.state === 'Voting' && (
                                        <>
                                            <HStack spacing={4} mt={2}>
                                                <Button
                                                    colorScheme="green"
                                                    onClick={() =>
                                                        handleBaalVote(
                                                            proposal.id,
                                                            true
                                                        )
                                                    }
                                                    isLoading={loading}
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
                                                >
                                                    Vote No
                                                </Button>
                                            </HStack>
                                            {proposal.sponsor &&
                                                proposal.sponsor.toLowerCase() ===
                                                    account?.toLowerCase() && (
                                                    <Button
                                                        colorScheme="yellow"
                                                        mt={2}
                                                        onClick={() =>
                                                            handleCancelBaalProposal(
                                                                proposal.id
                                                            )
                                                        }
                                                        isLoading={loading}
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
                                            mt={2}
                                            onClick={() =>
                                                handleProcessBaalProposal(
                                                    proposal.id
                                                )
                                            }
                                            isLoading={loading}
                                        >
                                            Process Proposal
                                        </Button>
                                    )}
                                </Box>
                            ))
                        )}
                    </Box>
                </>
            )}

            {viewMode === 'fee' && (
                // -----------------------------
                // SET FEE SECTION
                // -----------------------------
                <>
                    <VStack spacing={2} mb={6}>
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
                            Your Governance Token Balance:{' '}
                            {userGovernanceTokenBalance}
                        </Text>
                        <input
                            type="text"
                            value={feeSetAmount}
                            onChange={(e) => {
                                setFeeSetAmount(sanitizeNumber(e.target.value));
                            }}
                            style={{ color: 'black' }}
                            className="border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="fee bps to set"
                        />
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitFeeProposal}
                            isLoading={loading}
                        >
                            Submit Proposal to Set Fee
                        </Button>

                        {/* Display last proposal state */}
                        {govProposalState?.length && (
                            <Text fontSize="lg" textColor="blue.300">
                                Proposal state: <b>{govProposalState}</b>
                            </Text>
                        )}

                        {/* Display errors */}
                        {error && (
                            <Text fontSize="lg" textColor="red.300">
                                Error: {error}
                            </Text>
                        )}

                        {/* Proposals List */}
                        <Box width="80%" bg="gray.800" p={5} borderRadius="md">
                            <Heading as="h2" size="lg" textColor="white" mb={4}>
                                Proposals
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
                                    No proposals found.
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
                                            Fee: {proposal.fee}
                                        </Text>
                                        <Text textColor="white">
                                            State: {proposal.state}
                                        </Text>
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
                                        >
                                            Execute Proposal
                                        </Button>

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
                                            >
                                                Vote No
                                            </Button>
                                        </HStack>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </VStack>
                </>
            )}

            {viewMode === 'wrap-gov' && (
                // -----------------------------
                // GOVERNANCE TOKEN SECTION
                // -----------------------------
                <>
                    <VStack spacing={2} mb={6}>
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
                            Your Loot Balance: {userLootBalance}
                        </Text>
                        <Text fontSize="lg" textColor="white">
                            Your Governance Token Balance:{' '}
                            {userGovernanceTokenBalance}
                        </Text>

                        <input
                            type="text"
                            value={govTokenWrapAmount}
                            onChange={(e) => {
                                setGovTokenWrapAmount(
                                    sanitizeNumber(e.target.value, true)
                                );
                            }}
                            style={{ color: 'black' }}
                            className="border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="amount to wrap"
                        />
                        <Button
                            colorScheme="blue"
                            onClick={handleWrapGovToken}
                            isLoading={loading}
                        >
                            Wrap {govTokenWrapAmount} Governance Token
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleUnwrapGovToken}
                            isLoading={loading}
                        >
                            Unwrap {govTokenWrapAmount} Governance Token
                        </Button>

                        {/* Display errors */}
                        {error && (
                            <Text fontSize="lg" textColor="red.300">
                                Error: {error}
                            </Text>
                        )}
                    </VStack>
                </>
            )}
        </Box>
    );
}
