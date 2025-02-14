"use client";

import React, { useState } from "react";
import { Box, Heading, Button, VStack, Input, Text } from "@chakra-ui/react";
import { useWeb3 } from "./Web3Context"; // Ensure correct import path

export default function HomePage() {
    const {
        account,
        mintShares,
        mintLoot,
        getTotalShares,
        getTotalLoot,
        contract
    } = useWeb3();

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [totalShares, setTotalShares] = useState("Loading...");
    const [totalLoot, setTotalLoot] = useState("Loading...");

    // Fetch shares and loot on load
    React.useEffect(() => {
        const fetchData = async () => {
            setTotalShares(await getTotalShares());
            setTotalLoot(await getTotalLoot());
        };
        if (!contract) return;
        fetchData();
    }, [contract]);

    const handleMintShares = async () => {
        if (recipient && amount) {
            await mintShares(recipient, amount);
            setTotalShares(await getTotalShares()); // Refresh data
        }
    };

    const handleMintLoot = async () => {
        if (recipient && amount) {
            await mintLoot(recipient, amount);
            setTotalLoot(await getTotalLoot()); // Refresh data
        }
    };

    return (
        <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
            <VStack spacing={6} textAlign="center">
                <Heading textColor="white" mb="10" size="3xl">
                    Hamza Token Frontend
                </Heading>

                {/* Display Connected Account */}
                {account ? (
                    <Text fontSize="lg" textColor="white">Connected Wallet: {account}</Text>
                ) : (
                    <Text fontSize="lg" textColor="red.300">Please connect your wallet</Text>
                )}

                {/* Display total shares and loot */}
                <Text fontSize="lg" textColor="white">Total Shares: {totalShares}</Text>
                <Text fontSize="lg" textColor="white">Total Loot: {totalLoot}</Text>

                {/* Inputs for recipient and amount */}
                <Input
                    placeholder="Recipient Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    bg="white"
                    color="black"
                />
                <Input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    bg="white"
                    color="black"
                />

                {/* Mint Shares & Loot Buttons */}
                <Button colorScheme="blue" onClick={handleMintShares}>
                    Mint Shares
                </Button>
                <Button colorScheme="green" onClick={handleMintLoot}>
                    Mint Loot
                </Button>
            </VStack>
        </Box>
    );
}
