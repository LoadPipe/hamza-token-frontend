"use client";

import React, { useState, useEffect } from "react";
import { Box, Heading, Button, VStack, Text, HStack } from "@chakra-ui/react";
import { useWeb3 } from "./Web3Context";

export default function HomePage() {
  const {
    account,
    getTotalShares,
    getTotalLoot,
    sponsorProposalViaSafe,
    submitProposal,
    submitVote,
    cancelProposalViaSafe,
    getAllProposals,
    getProposalState,
    processProposal
  } = useWeb3();

  const [totalShares, setTotalShares] = useState("Loading...");
  const [totalLoot, setTotalLoot] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);

  // Fetch total shares and loot on load
  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      setTotalShares(await getTotalShares());
      setTotalLoot(await getTotalLoot());
    };
    fetchData();
  }, [account, getTotalShares, getTotalLoot]);

  // Load proposals from the contract
  const loadProposals = async () => {
    if (!account) return;
    try {
      const allProposals = await getAllProposals();
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
  }, [account]);

  // Handle Proposal Submission (submits a proposal to mint 10 loot to self)
  const handleSubmitProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Submitting proposal to mint 10 loot to self...");
      const { proposalId, proposalData } = await submitProposal();
      console.log(`Proposal submitted! ID: ${proposalId}`);
      await loadProposals();
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sponsorship for a specific proposal
  const handleSponsorProposal = async (id) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Sponsoring proposal ${id}...`);
      await sponsorProposalViaSafe(id);
      console.log("Proposal sponsored successfully!");
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

  // Handle Cancelling a proposal (only allowed during Voting state)
  const handleCancelProposal = async (id) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Cancelling proposal ${id}...`);
      await cancelProposalViaSafe(id);
      console.log("Proposal cancelled successfully!");
      await loadProposals();
    } catch (err) {
      console.error("Error cancelling proposal:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Processing a proposal (if ready)
  const handleProcessProposal = async (id, proposalData) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Processing proposal ${id}...`);
      await processProposal(id, proposalData);
      console.log("Proposal processed successfully!");
      await loadProposals();
    } catch (err) {
      console.error("Error processing proposal:", err);
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
          onClick={handleSubmitProposal}
          isLoading={loading}
        >
          Submit Proposal for 10 Loot
        </Button>

        {error && (
          <Text fontSize="lg" textColor="red.300">
            Error: {error}
          </Text>
        )}
      </VStack>

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
            <Box
              key={proposal.id}
              bg="gray.700"
              p={4}
              mb={2}
              borderRadius="md"
            >
              <Text textColor="white">ID: {proposal.id}</Text>
              <Text textColor="white">Sponsor: {proposal.sponsor}</Text>
              <Text textColor="white">Yes Votes: {proposal.yesVotes}</Text>
              <Text textColor="white">No Votes: {proposal.noVotes}</Text>
              <Text textColor="white">State: {proposal.state}</Text>

              {/* Show sponsor button if proposal state is "Submitted" */}
              {proposal.state === "Submitted" && (
                <Button
                  colorScheme="orange"
                  mt={2}
                  onClick={() => handleSponsorProposal(proposal.id)}
                  isLoading={loading}
                >
                  Sponsor Proposal
                </Button>
              )}

              {proposal.state === "Voting" && (
                <>
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
                  {proposal.sponsor.toLowerCase() === account.toLowerCase() && (
                    <Button
                      colorScheme="yellow"
                      mt={2}
                      onClick={() => handleCancelProposal(proposal.id)}
                      isLoading={loading}
                    >
                      Cancel Proposal
                    </Button>
                  )}
                </>
              )}

              {proposal.state === "Ready" && (
                <Button
                  colorScheme="purple"
                  mt={2}
                  onClick={() => handleProcessProposal(proposal.id)}
                  isLoading={loading}
                >
                  Process Proposal
                </Button>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
