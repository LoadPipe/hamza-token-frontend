"use client";

import React, { useState, useEffect } from "react";
import { Box, Heading, Button, VStack, Input, Text } from "@chakra-ui/react";
import { useWeb3 } from "./Web3Context"; // Ensure correct import path

export default function HomePage() {
    const { 
        account, 
        getTotalShares, 
        getTotalLoot, 
        contract, 
        sponsorProposalViaSafe,
        submitProposal 
    } = useWeb3();

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [totalShares, setTotalShares] = useState("Loading...");
    const [totalLoot, setTotalLoot] = useState("Loading...");
    const [loading, setLoading] = useState(false);
    const [proposalId, setProposalId] = useState(null);
    const [requiresSponsorship, setRequiresSponsorship] = useState(false);
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
        if (!recipient || !amount) return;
        setLoading(true);
        setError(null);

        try {
            console.log("Submitting proposal...");

            const proposalId = await submitProposal(amount, recipient);
            
            if (!proposalId) {
                throw new Error("Proposal ID not found.");
            }

            console.log(`Proposal submitted! ID: ${proposalId}`);
            setProposalId(proposalId);

           
            setRequiresSponsorship(true);

        } catch (err) {
            console.error("Error submitting proposal:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Sponsorship
    const handleSponsorProposal = async () => {
        if (!proposalId) return;
        setLoading(true);
        setError(null);

        try {
            console.log(`Sponsoring proposal ${proposalId}...`);
            await sponsorProposalViaSafe(proposalId);
            console.log("Proposal sponsored successfully!");
            setRequiresSponsorship(false);
        } catch (err) {
            console.error("Error sponsoring proposal:", err);
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

                {/* Sponsor Proposal Button (Only if required) */}
                {requiresSponsorship && (
                    <Button colorScheme="orange" onClick={handleSponsorProposal} isLoading={loading}>
                        Sponsor Proposal
                    </Button>
                )}

                {/* Display Proposal ID if submitted */}
                {proposalId && <Text fontSize="lg" textColor="green.300">Proposal Submitted! ID: {proposalId}</Text>}
                
                {/* Display Error Message */}
                {error && <Text fontSize="lg" textColor="red.300">Error: {error}</Text>}
            </VStack>
        </Box>
    );
}
