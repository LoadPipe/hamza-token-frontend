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
    FormControl,
    FormLabel,
    Input,
    Select,
    useToast,
    Spinner,
} from '@chakra-ui/react';
import { useWeb3 } from './Web3Context';
import { ethers } from 'ethers';

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
        depositToBaalVault,
        getBaalVaultBalance,
        ragequitFromBaal,
        getCommunityVaultBalance,
        contractAddresses,
        provider,
        paymentEscrow,
        createFakePayment,
        releasePayment,
        getPaymentDetails,
        getUserPurchaseInfo,
        getUserSalesInfo,
    } = useWeb3();

    const toast = useToast();

    // Toggles which section to display: "user" or "baal"
    const [viewMode, setViewMode] = useState('user');

    // Data states
    const [totalShares, setTotalShares] = useState('Loading...');
    const [totalLoot, setTotalLoot] = useState('Loading...');
    const [vaultEthBalance, setVaultEthBalance] = useState('Loading...');
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

    // Add state for token deposit
    const [depositTokenAddress, setDepositTokenAddress] = useState('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'); // Default to ETH
    const [depositAmount, setDepositAmount] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);
    
    // Rage Quit state variables
    const [ragequitShares, setRagequitShares] = useState('');
    const [ragequitLoot, setRagequitLoot] = useState('');
    const [ragequitRecipient, setRagequitRecipient] = useState('');
    const [selectedTokens, setSelectedTokens] = useState(['eth']);
    const [ragequitLoading, setRagequitLoading] = useState(false);

    // Update Community Vault states
    const [lootTokenBalance, setLootTokenBalance] = useState('Loading...');
    const [loadingCommunityVault, setLoadingCommunityVault] = useState(false);

    // Payment Escrow simulator states
    const [paymentReceiver, setPaymentReceiver] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('0.1');
    const [paymentCurrency, setPaymentCurrency] = useState('ETH');
    const [creatingPayment, setCreatingPayment] = useState(false);
    const [payments, setPayments] = useState([]);
    const [releasingPayment, setReleasingPayment] = useState(false);
    const [purchaseInfo, setPurchaseInfo] = useState(null);
    const [salesInfo, setSalesInfo] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false); // New state for payment history loading

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
    // Fetch Community Vault Loot balance
    // -----------------------------
    useEffect(() => {
        fetchCommunityVaultLootBalance();
    }, [contractAddresses]);

    // Function to fetch the Community Vault's loot token balance
    const fetchCommunityVaultLootBalance = async () => {
        try {
            setLoadingCommunityVault(true);
            
            if (!contractAddresses || !contractAddresses.LOOT_TOKEN_ADDRESS || !contractAddresses.COMMUNITY_VAULT_ADDRESS) {
                setLootTokenBalance('Not available');
                return;
            }
            
            if (!provider) {
                setLootTokenBalance('Provider not available');
                return;
            }

            const balance = await getCommunityVaultBalance(contractAddresses.LOOT_TOKEN_ADDRESS);
            
            if (balance) {
                setLootTokenBalance(ethers.formatUnits(balance, 18));
            } else {
                setLootTokenBalance('Error loading');
            }
        } catch (error) {
            console.error('Error fetching community vault loot balance:', error);
            setLootTokenBalance('Error loading');
        } finally {
            setLoadingCommunityVault(false);
        }
    };

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

    const handleDepositToVault = async () => {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        
        try {
            setError(null);
            setDepositLoading(true);
            
            const txHash = await depositToBaalVault(depositTokenAddress, depositAmount);
            
            console.log('Deposit transaction hash:', txHash);
            setDepositAmount('');
            
            // Display success message
            toast({
                title: 'Deposit Successful',
                description: `Successfully deposited tokens to the Baal vault.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Error depositing to vault:', err);
            setError(`Error depositing to vault: ${err.message}`);
        } finally {
            setDepositLoading(false);
        }
    };

    const handleRageQuit = async () => {
        // Validate inputs
        if ((!ragequitShares || parseFloat(ragequitShares) <= 0) && 
            (!ragequitLoot || parseFloat(ragequitLoot) <= 0)) {
            setError('Please enter a valid amount of shares or loot to burn');
            return;
        }
        
        if (!ragequitRecipient && !account) {
            setError('Please connect your wallet or enter a recipient address');
            return;
        }
        
        if (selectedTokens.length === 0) {
            setError('Please select at least one token to receive');
            return;
        }
        
        try {
            setError(null);
            setRagequitLoading(true);
            
            // Use the current account as recipient if not specified
            // The empty string check ensures we handle both empty strings and null/undefined
            const recipient = ragequitRecipient || '';
            
            // Default to 0 if empty
            const sharesToBurn = ragequitShares || '0';
            const lootToBurn = ragequitLoot || '0';
            
            // Show informational toast about the process
            toast({
                title: 'Processing Rage Quit',
                description: recipient 
                    ? `Processing your rage quit to ${recipient.substring(0, 8)}...` 
                    : `Processing your rage quit to your wallet`,
                status: 'info',
                duration: 5000,
                isClosable: true,
            });
            
            // Convert token names to addresses
            const tokenAddresses = selectedTokens.map(token => {
                if (token.toLowerCase() === 'eth') {
                    return 'eth'; // Special case for ETH, will be converted in the function
                } else if (token.toLowerCase() === 'hmz') {
                    return '0x3a8d910889AE5B4658Cb9F2668584d1eb5fA86Fa'; // HMZ token address
                }
                return token; // Already an address
            });
            
            const txHash = await ragequitFromBaal(
                recipient, // Pass empty string if no recipient specified - Web3Context will use connected account
                sharesToBurn,
                lootToBurn,
                tokenAddresses
            );
            
            console.log('Rage quit transaction hash:', txHash);
            
            // Reset form fields
            setRagequitShares('');
            setRagequitLoot('');
            setRagequitRecipient('');
            
            // Display success message
            toast({
                title: 'Rage Quit Successful',
                description: `Successfully burned shares/loot and received tokens.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            // Refresh user balances
            if (account) {
                getUserSharesBalance(account).then(setUserSharesBalance);
                getUserLootBalance(account).then(setUserLootBalance);
            }
        } catch (err) {
            console.error('Error executing rage quit:', err);
            setError(`Error executing rage quit: ${err.message}`);
        } finally {
            setRagequitLoading(false);
        }
    };

    // Effect to load payment stats when the payments tab is viewed
    useEffect(() => {
        if (viewMode === 'payments' && account) {
            fetchUserStats();
            fetchPaymentHistory(); 
        }
    }, [viewMode, account]);

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
                            : ethers.formatUnits(details.amount, 6); // USDC has 6 decimals (for futue)
                            
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
            
            setPaymentReceiver('');
            setPaymentAmount('0.1');
            
            // Refresh payment history after creating a new payment
            await fetchPaymentHistory();
            
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
            setReleasingPayment(paymentId); // Set the ID of the payment being released
            await releasePayment(paymentId);
            
            toast({
                title: 'Payment Released',
                description: 'Payment has been released from escrow',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            
            // Refresh payment history and user stats after releasing a payment
            fetchPaymentHistory();
            fetchUserStats();
            
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
            setReleasingPayment(false); 
        }
    };

    // Function to fetch user purchase and sales stats
    const fetchUserStats = async () => {
        if (!account) return;
        
        try {
            setLoadingStats(true);
            const purchases = await getUserPurchaseInfo(account);
            const sales = await getUserSalesInfo(account);
            
            setPurchaseInfo(purchases);
            setSalesInfo(sales);
        } catch (error) {
            console.error('Error fetching user stats:', error);
        } finally {
            setLoadingStats(false);
        }
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
                <Button
                    colorScheme={viewMode === 'community-vault' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('community-vault')}
                >
                    Community Vault
                </Button>
                <Button
                    colorScheme={viewMode === 'payments' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('payments')}
                >
                    Payment Simulator
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

                    {/* Add Token Deposit Section */}
                    <Box
                        borderWidth="1px"
                        borderRadius="lg"
                        p={6}
                        boxShadow="md"
                        bg="white"
                    >
                        <Heading size="md" mb={4} color="gray.800">
                            Deposit Tokens to Baal Vault
                        </Heading>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel color="gray.700">Token Type</FormLabel>
                                <Select
                                    value={depositTokenAddress}
                                    onChange={(e) => setDepositTokenAddress(e.target.value)}
                                    color="gray.800"
                                >
                                    <option value="0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE">ETH (Native Token)</option>
                                    <option value="0x3a8d910889AE5B4658Cb9F2668584d1eb5fA86Fa">HMZ (Governance Token)</option>
                                    {/* Add more token options as needed */}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.700">Amount</FormLabel>
                                <Input
                                    type="text"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(sanitizeNumber(e.target.value, true))}
                                    placeholder="0.0"
                                    color="gray.800"
                                />
                            </FormControl>
                            <Button
                                colorScheme="teal"
                                isLoading={depositLoading}
                                onClick={handleDepositToVault}
                            >
                                Deposit to Vault
                            </Button>
                        </VStack>
                    </Box>

                    {/* Rage Quit Box */}
                    <Box
                        borderWidth="1px"
                        borderRadius="lg"
                        p={6}
                        boxShadow="md"
                        bg="white"
                    >
                        <Heading size="md" mb={4} color="gray.800">
                            Rage Quit (Exit DAO)
                        </Heading>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel color="gray.700">Shares to Burn</FormLabel>
                                <Text fontSize="sm" color="gray.600" mb={1}>
                                    Your balance: {userSharesBalance || '0'} shares
                                </Text>
                                <HStack>
                                    <Input
                                        type="text"
                                        value={ragequitShares}
                                        onChange={(e) => setRagequitShares(sanitizeNumber(e.target.value, true))}
                                        placeholder="0.0"
                                        color="gray.800"
                                    />
                                    <Button 
                                        size="sm" 
                                        onClick={() => setRagequitShares(userSharesBalance)}
                                        colorScheme="blue"
                                    >
                                        Max
                                    </Button>
                                </HStack>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.700">Loot to Burn</FormLabel>
                                <Text fontSize="sm" color="gray.600" mb={1}>
                                    Your balance: {userLootBalance || '0'} loot
                                </Text>
                                <HStack>
                                    <Input
                                        type="text"
                                        value={ragequitLoot}
                                        onChange={(e) => setRagequitLoot(sanitizeNumber(e.target.value, true))}
                                        placeholder="0.0"
                                        color="gray.800"
                                    />
                                    <Button 
                                        size="sm" 
                                        onClick={() => setRagequitLoot(userLootBalance)}
                                        colorScheme="blue"
                                    >
                                        Max
                                    </Button>
                                </HStack>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.700">Recipient Address (Optional)</FormLabel>
                                <Text fontSize="sm" color="gray.600" mb={1}>
                                    Will default to your address ({account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connect wallet'}) if left blank
                                </Text>
                                <Input
                                    type="text"
                                    value={ragequitRecipient}
                                    onChange={(e) => setRagequitRecipient(e.target.value)}
                                    placeholder="0x... (leave empty to use your address)"
                                    color="gray.800"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.700">Tokens to Receive</FormLabel>
                                <HStack>
                                    <Button
                                        size="sm"
                                        colorScheme={selectedTokens.includes('eth') ? "teal" : "gray"}
                                        onClick={() => {
                                            if (selectedTokens.includes('eth')) {
                                                setSelectedTokens(selectedTokens.filter(t => t !== 'eth'));
                                            } else {
                                                setSelectedTokens([...selectedTokens, 'eth']);
                                            }
                                        }}
                                    >
                                        ETH
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorScheme={selectedTokens.includes('0x3a8d910889AE5B4658Cb9F2668584d1eb5fA86Fa') ? "teal" : "gray"}
                                        onClick={() => {
                                            const hmzAddress = '0x3a8d910889AE5B4658Cb9F2668584d1eb5fA86Fa';
                                            if (selectedTokens.includes(hmzAddress)) {
                                                setSelectedTokens(selectedTokens.filter(t => t !== hmzAddress));
                                            } else {
                                                setSelectedTokens([...selectedTokens, hmzAddress]);
                                            }
                                        }}
                                    >
                                        HMZ
                                    </Button>
                                </HStack>
                            </FormControl>
                            <Button
                                colorScheme="red"
                                isLoading={ragequitLoading}
                                onClick={handleRageQuit}
                            >
                                Rage Quit
                            </Button>
                        </VStack>
                    </Box>
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
                        <Text fontSize="lg" textColor="white">
                            Baal Vault ETH Balance: {vaultEthBalance} ETH
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

            {viewMode === 'community-vault' && (
                <VStack spacing={6} width="100%" maxW="900px">
                    <Heading textColor="white" size="xl">Community Vault</Heading>
                    
                    <Box 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={6}
                        bg="gray.800"
                        width="100%"
                    >
                        <VStack spacing={4} align="start">
                            <Heading size="md" textColor="white">Vault Address</Heading>
                            <Text textColor="white" wordBreak="break-all">
                                {contractAddresses?.COMMUNITY_VAULT_ADDRESS || 'Not available'}
                            </Text>
                            
                            <Heading size="md" textColor="white" mt={6}>Loot Token Balance</Heading>
                            {loadingCommunityVault ? (
                                <Text textColor="white">Loading loot balance...</Text>
                            ) : (
                                <VStack align="start" spacing={2} width="100%">
                                    <HStack>
                                        <Text textColor="white" fontSize="xl" fontWeight="bold">
                                            {lootTokenBalance}
                                        </Text>
                                        <Text textColor="white">LOOT</Text>
                                    </HStack>
                                    
                                    {lootTokenBalance === 'Not available' && (
                                        <Text textColor="red.300" fontSize="sm">
                                            Loot token address is not available. Contract might not be initialized correctly.
                                        </Text>
                                    )}
                                    
                                    {lootTokenBalance === 'Provider not available' && (
                                        <Text textColor="red.300" fontSize="sm">
                                            Web3 provider is not available. Please connect your wallet.
                                        </Text>
                                    )}
                                    
                                    {lootTokenBalance === 'Error loading' && (
                                        <Text textColor="red.300" fontSize="sm">
                                            Error loading balance. Check console for details.
                                        </Text>
                                    )}
                                </VStack>
                            )}
                            
                            <Button 
                                mt={4}
                                colorScheme="blue"
                                onClick={fetchCommunityVaultLootBalance}
                                isLoading={loadingCommunityVault}
                            >
                                Refresh Balance
                            </Button>
                        </VStack>
                    </Box>
                    
                    {/* Debug information */}
                    <Box 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={6}
                        bg="gray.800"
                        width="100%"
                    >
                        <Heading size="md" textColor="white" mb={4}>Debug Information</Heading>
                        <VStack align="start" spacing={2}>
                            <Text textColor="white">
                                <strong>Loot Token Address:</strong> {contractAddresses?.LOOT_TOKEN_ADDRESS || 'Not available'}
                            </Text>
                            <Text textColor="white">
                                <strong>Provider Connected:</strong> {provider ? 'Yes' : 'No'}
                            </Text>
                        </VStack>
                    </Box>
                </VStack>
            )}

            {viewMode === 'payments' && (
                <VStack spacing={6} width="100%" maxW="900px">
                    <Heading textColor="white" size="xl">Payment Simulator</Heading>
                    
                    {/* User Stats */}
                    <Box 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={6}
                        bg="gray.800"
                        width="100%"
                    >
                        <Heading size="md" textColor="white" mb={4}>Your Activity Stats</Heading>
                        
                        {!account ? (
                            <Text textColor="red.300">Please connect your wallet to view stats</Text>
                        ) : loadingStats ? (
                            <Text textColor="white">Loading stats...</Text>
                        ) : (
                            <SimpleGrid columns={2} spacing={6}>
                                <VStack align="start" bg="gray.700" p={4} borderRadius="md">
                                    <Text textColor="white" fontWeight="bold">Purchase History</Text>
                                    <Text textColor="white">
                                        Total Purchases: {purchaseInfo?.totalCount || '0'}
                                    </Text>
                                    <Text textColor="white">
                                        Total Spent: {purchaseInfo?.totalAmount || '0'} ETH
                                    </Text>
                                </VStack>
                                
                                <VStack align="start" bg="gray.700" p={4} borderRadius="md">
                                    <Text textColor="white" fontWeight="bold">Sales History</Text>
                                    <Text textColor="white">
                                        Total Sales: {salesInfo?.totalCount || '0'}
                                    </Text>
                                    <Text textColor="white">
                                        Total Earned: {salesInfo?.totalAmount || '0'} ETH
                                    </Text>
                                </VStack>
                            </SimpleGrid>
                        )}
                        
                        <HStack mt={4} spacing={4}>
                            <Button
                                colorScheme="blue"
                                onClick={fetchUserStats}
                                isLoading={loadingStats}
                            >
                                Refresh Stats
                            </Button>
                        </HStack>
                    </Box>
                    
                    {/* Create Payment Form */}
                    <Box 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={6}
                        bg="gray.800"
                        width="100%"
                    >
                        <Heading size="md" textColor="white" mb={4}>Create Fake Payment</Heading>
                        
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel textColor="white">Receiver Address</FormLabel>
                                <Input
                                    value={paymentReceiver}
                                    onChange={(e) => setPaymentReceiver(e.target.value)}
                                    placeholder="0x..."
                                    color="white"
                                    bg="gray.700"
                                />
                            </FormControl>
                            
                            <FormControl>
                                <FormLabel textColor="white">Amount</FormLabel>
                                <Input
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(sanitizeNumber(e.target.value, true))}
                                    placeholder="0.1"
                                    color="white"
                                    bg="gray.700"
                                />
                            </FormControl>
                            
                            <FormControl>
                                <FormLabel textColor="white">Currency</FormLabel>
                                <Select
                                    value={paymentCurrency}
                                    onChange={(e) => setPaymentCurrency(e.target.value)}
                                    color="white"
                                    bg="gray.700"
                                >
                                    <option value="ETH">ETH</option>
                                    <option value="USDC">USDC</option>
                                </Select>
                            </FormControl>
                            
                            <Button
                                colorScheme="teal"
                                onClick={handleCreateFakePayment}
                                isLoading={creatingPayment}
                                isDisabled={!account}
                            >
                                Create Payment
                            </Button>
                        </VStack>
                    </Box>
                    
                    {/* Payment History */}
                    <Box 
                        borderWidth="1px" 
                        borderRadius="lg" 
                        p={6}
                        bg="gray.800"
                        width="100%"
                    >
                        <HStack justify="space-between" mb={4}>
                            <Heading size="md" textColor="white">Payment History</Heading>
                            <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={fetchPaymentHistory}
                                isLoading={loadingPayments}
                                leftIcon={<span role="img" aria-label="refresh">🔄</span>}
                            >
                                Refresh
                            </Button>
                        </HStack>
                        
                        {loadingPayments ? (
                            <Spinner color="blue.500" />
                        ) : payments.length === 0 ? (
                            <Text textColor="white">No payment history found</Text>
                        ) : (
                            <VStack spacing={3} align="stretch" width="100%">
                                {payments.map((payment, index) => (
                                    <Box 
                                        key={`payment-${payment.id}-${index}`} 
                                        p={4} 
                                        borderWidth="1px" 
                                        borderRadius="md" 
                                        backgroundColor="#1f2937" 
                                        width="100%"
                                    >
                                        <VStack align="start" spacing={2} width="100%">
                                            <HStack width="100%" justify="space-between">
                                                <Text textColor="white" fontSize="sm" opacity="0.8">
                                                    ID: {payment.id ? payment.id.substring(0, 8) + '...' : 'Unknown'}
                                                </Text>
                                                <Text 
                                                    textColor={payment.released ? "green.300" : "yellow.300"}
                                                    fontWeight="bold"
                                                    fontSize="sm"
                                                >
                                                    {payment.released ? "RELEASED" : "IN ESCROW"}
                                                </Text>
                                            </HStack>
                                            
                                            <HStack width="100%" wrap="wrap" spacing={4}>
                                                <VStack align="start" minW="140px">
                                                    <Text textColor="gray.400" fontSize="xs">
                                                        From
                                                    </Text>
                                                    <Text textColor="white">
                                                        {payment.payer ? `${payment.payer.substring(0, 6)}...${payment.payer.substring(payment.payer.length - 4)}` : 'Unknown'}
                                                    </Text>
                                                </VStack>
                                                
                                                <VStack align="start" minW="140px">
                                                    <Text textColor="gray.400" fontSize="xs">
                                                        To
                                                    </Text>
                                                    <Text textColor="white">
                                                        {payment.receiver ? `${payment.receiver.substring(0, 6)}...${payment.receiver.substring(payment.receiver.length - 4)}` : 'Unknown'}
                                                    </Text>
                                                </VStack>
                                                
                                                <VStack align="start" minW="100px">
                                                    <Text textColor="gray.400" fontSize="xs">
                                                        Amount
                                                    </Text>
                                                    <Text textColor="white" fontWeight="bold">
                                                        {payment.amount} {payment.currency}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            
                                            {!payment.released && (
                                                <Button
                                                    mt={2}
                                                    size="sm"
                                                    colorScheme="blue"
                                                    onClick={() => handleReleasePayment(payment.id)}
                                                    isLoading={releasingPayment === payment.id}
                                                    isDisabled={!account}
                                                    width="100%"
                                                >
                                                    Release Payment
                                                </Button>
                                            )}
                                        </VStack>
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </Box>
                </VStack>
            )}
        </Box>
    );
}
