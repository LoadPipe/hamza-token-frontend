import React, { useState, useEffect } from 'react';
import {
    VStack,
    Button,
    Text,
    useToast,
    Input
} from '@chakra-ui/react';
import { useWeb3 } from '../Web3Context';

/**
 * Component for wrapping and unwrapping governance tokens
 */
const GovernanceTokenSection = () => {
    const {
        account,
        wrapGovernanceToken,
        unwrapGovernanceToken,
        getUserGovernanceTokenBalance,
        getUserLootBalance
    } = useWeb3();

    const toast = useToast();

    const [userLootBalance, setUserLootBalance] = useState('0');
    const [userGovernanceTokenBalance, setUserGovernanceTokenBalance] = useState('0');
    const [govTokenWrapAmount, setGovTokenWrapAmount] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user balances
    useEffect(() => {
        const fetchUserBalances = async () => {
            if (!account) return;
            try {
                const lootBal = await getUserLootBalance(account);
                setUserLootBalance(lootBal);
                const govBal = await getUserGovernanceTokenBalance(account);
                setUserGovernanceTokenBalance(govBal);
            } catch (err) {
                console.error('Error fetching user balances:', err);
                setError('Failed to load user balances');
            }
        };
        fetchUserBalances();
    }, [account, getUserLootBalance, getUserGovernanceTokenBalance]);

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

    // Wrap governance token
    const handleWrapGovToken = async () => {
        setLoading(true);
        setError(null);
        const amount = parseFloat(govTokenWrapAmount);
        try {
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount greater than 0');
            }
            
            console.log('Wrapping ', amount, 'governance token...');
            const newAmount = await wrapGovernanceToken(amount);
            setUserGovernanceTokenBalance(newAmount);
            
            toast({
                title: 'Success',
                description: `Successfully wrapped ${amount} governance tokens`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Error wrapping governance token:', err);
            setError(err.message);
            
            toast({
                title: 'Error',
                description: `Failed to wrap tokens: ${err.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
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
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount greater than 0');
            }
            
            console.log('Unwrapping ', amount, 'governance token...');
            const newAmount = await unwrapGovernanceToken(amount);
            setUserGovernanceTokenBalance(newAmount);
            
            toast({
                title: 'Success',
                description: `Successfully unwrapped ${amount} governance tokens`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Error unwrapping governance token:', err);
            setError(err.message);
            
            toast({
                title: 'Error',
                description: `Failed to unwrap tokens: ${err.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4} width="100%" maxW="600px">
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
                Your Governance Token Balance: {userGovernanceTokenBalance}
            </Text>

            <Input
                type="text"
                value={govTokenWrapAmount}
                onChange={(e) => {
                    setGovTokenWrapAmount(sanitizeNumber(e.target.value, true));
                }}
                placeholder="Amount to wrap/unwrap"
                color="white"
                borderColor="gray.500"
                _hover={{ borderColor: 'gray.400' }}
                _focus={{ borderColor: 'blue.300' }}
                width="100%"
                maxW="400px"
                my={4}
            />
            
            <VStack spacing={3} width="100%" maxW="400px">
                <Button
                    colorScheme="blue"
                    onClick={handleWrapGovToken}
                    isLoading={loading}
                    width="100%"
                >
                    Wrap {govTokenWrapAmount} Governance Token
                </Button>
                
                <Button
                    colorScheme="purple"
                    onClick={handleUnwrapGovToken}
                    isLoading={loading}
                    width="100%"
                >
                    Unwrap {govTokenWrapAmount} Governance Token
                </Button>
            </VStack>

            {/* Display errors */}
            {error && (
                <Text fontSize="md" textColor="red.300" mt={2}>
                    Error: {error}
                </Text>
            )}
        </VStack>
    );
};

export default GovernanceTokenSection; 