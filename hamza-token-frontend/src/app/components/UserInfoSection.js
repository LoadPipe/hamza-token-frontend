import React, { useState } from 'react';
import {
    Box,
    Text,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    HStack,
    Select,
    useToast
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for displaying and managing user information, deposits, and ragequit functionality
 */
const UserInfoSection = () => {
    const {
        account,
        depositToBaalVault,
        getUserSharesBalance,
        getUserLootBalance,
        ragequitFromBaal
    } = useWeb3();
    
    const toast = useToast();
    
    // User balances
    const [userLootBalance, setUserLootBalance] = useState('0');
    const [userSharesBalance, setUserSharesBalance] = useState('0');
    const [userGovernanceTokenBalance, setUserGovernanceTokenBalance] = useState('0');

    // Add state for token deposit
    const [depositTokenAddress, setDepositTokenAddress] = useState('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'); // Default to ETH
    const [depositAmount, setDepositAmount] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Rage Quit state variables
    const [ragequitShares, setRagequitShares] = useState('');
    const [ragequitLoot, setRagequitLoot] = useState('');
    const [ragequitRecipient, setRagequitRecipient] = useState('');
    const [selectedTokens, setSelectedTokens] = useState(['eth']);
    const [ragequitLoading, setRagequitLoading] = useState(false);

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

    return (
        <VStack spacing={4}>
            <Text fontSize="lg" textColor="white">
                Connected Wallet: {account || 'Not connected'}
            </Text>
            <Text fontSize="lg" textColor="white">
                Your Loot Balance: {userLootBalance}
            </Text>
            <Text fontSize="lg" textColor="white">
                Your Governance Token Balance: {userGovernanceTokenBalance}
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
                <Text size="md" mb={4} color="gray.800" fontWeight="bold">
                    Deposit Tokens to Baal Vault
                </Text>
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
                <Text size="md" mb={4} color="gray.800" fontWeight="bold">
                    Rage Quit (Exit DAO)
                </Text>
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
                    {error && (
                        <Text color="red.500" fontSize="sm">
                            {error}
                        </Text>
                    )}
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
    );
};

export default UserInfoSection; 