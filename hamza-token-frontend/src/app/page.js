"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Button,
  VStack,
  Input,
  Text,
  HStack
} from "@chakra-ui/react";
import { useWeb3 } from "./Web3Context"; // Ensure correct import path

export default function HomePage() {
  const {
    account,
    getTotalShares,
    getTotalLoot,
    contract,
    sponsorProposalViaSafe,
    submitProposal,
    submitVote,
    getAllProposals,
    getProposalState
  } = useWeb3();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [totalShares, setTotalShares] = useState("Loading...");
  const [totalLoot, setTotalLoot] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [proposalId, setProposalId] = useState(null);
  const [requiresSponsorship, setRequiresSponsorship] = useState(false);
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);

  // Fetch shares and loot on component load
  useEffect(() => {
    const fetchData = async () => {
      if (!contract) return;
      setTotalShares(await getTotalShares());
      setTotalLoot(await getTotalLoot());
    };
    fetchData();
  }, [contract, getTotalShares, getTotalLoot]);

  // Load proposals from the contract
  const loadProposals = async () => {
    if (!contract) return;
    try {
      const allProposals = await getAllProposals();
      // Map proposals to include state and convert BigNumbers to strings/numbers
      const proposalsWithState = await Promise.all(
        allProposals.map(async (prop) => {
          const state = await getProposalState(prop.id);
          return {
            id: prop.id.toString(),
            sponsor: prop.sponsor,
            yesVotes: prop.yesVotes.toString(),
            noVotes: prop.noVotes.toString(),
            state
          };
        })
      );
      setProposals(proposalsWithState);
    } catch (err) {
      console.error("Error loading proposals:", err);
    }
  };

  useEffect(() => {
    loadProposals();
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
      await loadProposals();
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
      await loadProposals();
    } catch (err) {
      console.error("Error sponsoring proposal:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Voting on a proposal
  const handleVote = async (id, support) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Voting on proposal ${id} with support: ${support}`);
      await submitVote(id, support);
      console.log("Vote submitted successfully!");
      await loadProposals();
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      bg="gray.900"
      p={4}
    >
      <VStack spacing={6} textAlign="center" mb={10}>
        <Heading textColor="white" mb="10" size="3xl">
          Hamza Token Frontend
        </Heading>

        {/* Display Connected Account */}
        {account ? (
          <Text fontSize="lg" textColor="white">
            Connected Wallet: {account}
          </Text>
        ) : (
          <Text fontSize="lg" textColor="red.300">
            Please connect your wallet
          </Text>
        )}

        {/* Display total shares and loot */}
        <Text fontSize="lg" textColor="white">
          Total Shares: {totalShares}
        </Text>
        <Text fontSize="lg" textColor="white">
          Total Loot: {totalLoot}
        </Text>

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
        {proposalId && (
          <Text fontSize="lg" textColor="green.300">
            Proposal Submitted! ID: {proposalId}
          </Text>
        )}

        {/* Display Error Message */}
        {error && (
          <Text fontSize="lg" textColor="red.300">
            Error: {error}
          </Text>
        )}
      </VStack>

      {/* Proposals List */}
      <Box width="80%" bg="gray.800" p={5} borderRadius="md">
        <Heading as="h2" size="lg" textColor="white" mb={4}>
          Proposals
        </Heading>
        <Button mb={4} onClick={loadProposals} isLoading={loading}>
          Refresh Proposals
        </Button>
        {proposals.length === 0 ? (
          <Text textColor="white">No proposals found.</Text>
        ) : (
          proposals.map((proposal) => (
            <Box key={proposal.id} bg="gray.700" p={4} mb={2} borderRadius="md">
              <Text textColor="white">ID: {proposal.id}</Text>
              <Text textColor="white">Sponsor: {proposal.sponsor}</Text>
              <Text textColor="white">Yes Votes: {proposal.yesVotes}</Text>
              <Text textColor="white">No Votes: {proposal.noVotes}</Text>
              <Text textColor="white">State: {proposal.state}</Text>
              {proposal.state === "Voting" && (
                <HStack spacing={4} mt={2}>
                  <Button
                    colorScheme="green"
                    onClick={() => handleVote(proposal.id, true)}
                    isLoading={loading}
                  >
                    Vote Yes
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => handleVote(proposal.id, false)}
                    isLoading={loading}
                  >
                    Vote No
                  </Button>
                </HStack>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
