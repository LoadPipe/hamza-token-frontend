"use client";

import React, { useState, useEffect } from "react";
import { Box, Heading, Button, VStack, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useWeb3 } from "./Web3Context"; // Ensure correct import path

export default function HomePage() {
    const { account, getTotalShares, getTotalLoot, contract } = useWeb3();

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [totalShares, setTotalShares] = useState("Loading...");
    const [totalLoot, setTotalLoot] = useState("Loading...");
    const [loading, setLoading] = useState(false);
    const [proposalId, setProposalId] = useState(null);
    const [error, setError] = useState(null);

    // Fetch shares and loot on component load
    useEffect(() => {
        const fetchData = async () => {
            if (!contract) return;
            setTotalShares(await getTotalShares());
            setTotalLoot(await getTotalLoot());
        };
        fetchData();
    }, [contract]);

    // Handle Proposal Submission
    const handleSubmitProposal = async () => {
        if (!contract || !recipient || !amount) return;
        setLoading(true);
        setError(null);

        try {
            console.log("Submitting proposal...");
            
            const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address[]", "uint256[]"],
                [[recipient], [amount]]
            );

            const expiration = 0;
            const baalGas = 300000;

            const tx = await contract.submitProposal(
                proposalData,
                expiration,
                baalGas,
                "Proposal to deposit funds and receive loot"
            );
            const receipt = await tx.wait();
            const proposalId = receipt.logs[0].args[0]; // Extract proposal ID from event logs

            console.log(`Proposal submitted! ID: ${proposalId}`);
            setProposalId(proposalId);
        } catch (err) {
            console.error("Error submitting proposal:", err);
            setError(err.message);
        } finally {
            setLoading(false);
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

                {/* Submit Proposal Button */}
                <Button colorScheme="blue" onClick={handleSubmitProposal} isLoading={loading}>
                    Submit Proposal
                </Button>

                {/* Display Proposal ID if submitted */}
                {proposalId && <Text fontSize="lg" textColor="green.300">Proposal Submitted! ID: {proposalId}</Text>}
                
                {/* Display Error Message */}
                {error && <Text fontSize="lg" textColor="red.300">Error: {error}</Text>}
            </VStack>
        </Box>
    );
}
