"use client";

import React, { useState, useEffect } from "react";
import { Box, Heading, Button, VStack, Text, HStack, SimpleGrid } from "@chakra-ui/react";
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
    processProposal,
    getUserLootBalance,
    getUserSharesBalance,
    getBaalConfig
  } = useWeb3();

  // Toggles which section to display: "user" or "baal"
  const [viewMode, setViewMode] = useState("user");

  // Data states
  const [totalShares, setTotalShares] = useState("Loading...");
  const [totalLoot, setTotalLoot] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);

  // Baal config data
  const [baalConfig, setBaalConfig] = useState(null);

  // User loot/shares balances
  const [userLootBalance, setUserLootBalance] = useState("0");
  const [userSharesBalance, setUserSharesBalance] = useState("0");

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
      } catch (err) {
        console.error("Error fetching user balances:", err);
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
        console.error("Error fetching Baal config:", err);
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
  const loadProposals = async () => {
    if (!account) return;
    try {
      setLoading(true);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [account]); 

  // -----------------------------
  // Handlers
  // -----------------------------
  // Submit a new proposal (mints 10 loot to self)
  const handleSubmitProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Submitting proposal to mint 10 loot to self...");
      const proposalId = await submitProposal();
      if (!proposalId) {
        console.warn("No proposal ID returned or event was not found.");
      } else {
        console.log(`Proposal submitted! ID: ${proposalId}`);
        await loadProposals();
      }
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sponsor a proposal (via Gnosis Safe transaction)
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

  // Vote on a proposal (via Gnosis Safe transaction)
  const handleVote = async (id, support) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Voting on proposal ${id}: support = ${support}`);
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

  // Cancel a proposal (via Gnosis Safe transaction)
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

  // Process a proposal
  const handleProcessProposal = async (id) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Processing proposal ${id}...`);
      await processProposal(id);
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
          colorScheme={viewMode === "user" ? "blue" : "gray"}
          onClick={() => setViewMode("user")}
        >
          User Info
        </Button>
        <Button
          colorScheme={viewMode === "baal" ? "blue" : "gray"}
          onClick={() => setViewMode("baal")}
        >
          Baal Info
        </Button>
      </HStack>

      {/* Conditionally render either "User Info" or "Baal Info" */}
      {viewMode === "user" ? (
        // -----------------------------
        // USER INFO SECTION
        // -----------------------------
        <VStack spacing={4}>
          <Text fontSize="lg" textColor="white">
            Connected Wallet: {account || "Not connected"}
          </Text>
          <Text fontSize="lg" textColor="white">
            Your Loot Balance: {userLootBalance}
          </Text>
          <Text fontSize="lg" textColor="white">
            Your Shares Balance: {userSharesBalance}
          </Text>
        </VStack>
      ) : (
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
              onClick={handleSubmitProposal}
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
          <Box width="60%" bg="gray.800" p={5} mb={6} borderRadius="md">
            <Heading as="h3" size="md" textColor="white" mb={3}>
              Baal Configuration
            </Heading>
            {baalConfig ? (
              <SimpleGrid columns={2} spacing={2} width="100%">
                <Text color="white">Voting Period: {baalConfig.votingPeriod}</Text>
                <Text color="white">Grace Period: {baalConfig.gracePeriod}</Text>

                <Text color="white">Proposal Offering: {baalConfig.proposalOffering}</Text>
                <Text color="white">Quorum Percent: {baalConfig.quorumPercent}</Text>

                <Text color="white">Sponsor Threshold: {baalConfig.sponsorThreshold}</Text>
                <Text color="white">Min Retention %: {baalConfig.minRetentionPercent}</Text>

                <Text color="white">Admin Lock: {baalConfig.adminLock ? "true" : "false"}</Text>
                <Text color="white">Manager Lock: {baalConfig.managerLock ? "true" : "false"}</Text>

                <Text color="white">Governor Lock: {baalConfig.governorLock ? "true" : "false"}</Text>
                <Text color="white">Community Vault: {baalConfig.communityVault}</Text>
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

                  {/* Voting options if in "Voting" */}
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
                      {proposal.sponsor &&
                        proposal.sponsor.toLowerCase() === account?.toLowerCase() && (
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

                  {/* Process proposal if "Ready" */}
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
        </>
      )}
    </Box>
  );
}
