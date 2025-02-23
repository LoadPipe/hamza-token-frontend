import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

import CustomBaalABI from "../../abis/CustomBaal_abi.json"; 
import GNOSIS_SAFE_ABI from "../../abis/GnosisSafe_abi.json";
import ERC20_ABI from "../../abis/ERC20_abi.json"

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const CONTRACT_ADDRESS = "0x3410CA83D5902043C2C24760851033D304e94CF9"; // Baal contract
  const GNOSIS_ADDRESS = "0xDD9f9570c2a8f8EB6a2aE001c224E226d77F0b63"; // hats admin multisig

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        const web3Signer = await browserProvider.getSigner();
        setSigner(web3Signer);

        const userAddress = await web3Signer.getAddress();
        setAccount(userAddress);
        console.log("Connected account:", userAddress);

        const baalContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CustomBaalABI,
          web3Signer
        );
        console.log("Contract loaded:", baalContract);
        setContract(baalContract);
      } else {
        console.error("No Ethereum wallet detected");
      }
    };
    initWeb3();
  }, []);

  const submitProposal = async (expiration = 0, baalGas = 1500000) => {
    if (!contract || !account) return;
    try {
      console.log("Submitting proposal: mintLoot to self for 10 loot...");
        // 1. Encode the mintLoot call
        const lootAmount = ethers.parseUnits("10", 18);
        const mintLootData = contract.interface.encodeFunctionData("mintLoot", [[account], [lootAmount]]);

        // 2. Wrap that call in an executeAsBaal call
        const executeAsBaalData = contract.interface.encodeFunctionData("executeAsBaal", [
        CONTRACT_ADDRESS, 
        0,           
        mintLootData   
        ]);

        const multisendPayload = await contract.encodeMultisend(
          [mintLootData],        // array of calls
          CONTRACT_ADDRESS       // target address for each call (usually your Baal contract address)
        );

      const tx = await contract.submitProposal(
        multisendPayload,
        expiration,
        baalGas,
        "Proposal to mint 10 loot to submitter"
      );
      const receipt = await tx.wait();
      console.log("submitProposal receipt:", receipt);
      
      // Extract proposal ID from the SubmitProposal event logs.
      const eventSignature = contract.interface.getEvent("SubmitProposal").topicHash;
      const proposalEventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
      if (!proposalEventLog) {
        console.error("SubmitProposal event not found in logs:", receipt.logs);
        return;
      }
      const decodedEvent = contract.interface.parseLog(proposalEventLog);
      const proposalId = decodedEvent.args[0];
      console.log(`Proposal submitted! ID: ${proposalId}`);
      return proposalId;
    } catch (error) {
      console.error("Error submitting proposal:", error);
    }
  };

  const getTotalShares = async () => {
    if (!contract) return;
    try {
      const totalShares = await contract.totalShares();
      console.log("Raw Total Shares:", totalShares.toString()); 
      return totalShares.toString();
    } catch (error) {
      console.error("Error fetching total shares:", error);
    }
  };
    
  const getTotalLoot = async () => {
    if (!contract) return;
    try {
      const totalLoot = await contract.totalLoot();
      const parsedLoot = ethers.formatUnits(totalLoot, 18);
      console.log("Raw Total Loot:", parsedLoot); 
      return parsedLoot
    } catch (error) {
      console.error("Error fetching total loot:", error);
    }
  };

  const execSafeTransaction = async (to, value, data) => {
    if (!signer) {
      console.error("No signer available");
      return;
    }
    const safeContract = new ethers.Contract(GNOSIS_ADDRESS, GNOSIS_SAFE_ABI, signer);
    const signerAddress = await signer.getAddress();
    const addressNo0x = signerAddress.replace(/^0x/, "").toLowerCase();
    const r = "0x" + addressNo0x.padStart(64, "0");
    const s = "0x" + "0".repeat(64);
    const v = "0x01";
    const signature = ethers.concat([r, s, v]);
    const tx = await safeContract.execTransaction(
      to,
      value,
      data,
      0, // operation
      0, // safeTxGas
      0, // baseGas
      0, // gasPrice
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      signature
    );
    const receipt = await tx.wait();
    console.log("execTransaction receipt:", receipt);
    return receipt;
  };

  const sponsorProposalViaSafe = async (proposalId) => {
    if (!contract) return;
    try {
      const data = contract.interface.encodeFunctionData("sponsorProposal", [proposalId]);
      const receipt = await execSafeTransaction(CONTRACT_ADDRESS, 0, data);
      console.log("Sponsor Proposal via Safe tx:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error sponsoring proposal via Safe:", error);
    }
  };

  const submitVote = async (proposalId, support) => {
    if (!contract) return;
    try {
      const data = contract.interface.encodeFunctionData("submitVote", [proposalId, support]);
      const receipt = await execSafeTransaction(CONTRACT_ADDRESS, 0, data);
      console.log("Submit Vote via Safe tx:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error submitting vote via Safe:", error);
    }
  };

  const getProposalCount = async () => {
    if (!contract) return 0;
    try {
      const count = await contract.proposalCount();
      return Number(count);
    } catch (error) {
      console.error("Error fetching proposal count:", error);
      return 0;
    }
  };
    
  const getAllProposals = async () => {
    if (!contract) return [];
    try {
      const count = await getProposalCount();
      const proposalsArr = [];
      for (let i = 1; i <= count; i++) {
        const prop = await contract.proposals(i);
        proposalsArr.push(prop);
      }
      return proposalsArr;
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  };
    
  const getProposalState = async (proposalId) => {
    if (!contract) return "Unknown";
    try {
      const stateVal = await contract.state(proposalId);
      const num = Number(stateVal);
      const mapping = [
        "Unborn",
        "Submitted",
        "Voting",
        "Cancelled",
        "Grace",
        "Ready",
        "Processed",
        "Defeated"
      ];
      return mapping[num] || "Unknown";
    } catch (error) {
      console.error("Error fetching proposal state:", error);
      return "Unknown";
    }
  };

 
    const processProposal = async (proposalId) => {
        if (!contract || !account) return;
        try {
            console.log("Processing proposal", proposalId);
            // 1. Encode the mintLoot call
            const lootAmount = ethers.parseUnits("10", 18);
            const mintLootData = contract.interface.encodeFunctionData("mintLoot", [[account], [lootAmount]]);

            // 2. Wrap that call in an executeAsBaal call
            const executeAsBaalData = contract.interface.encodeFunctionData("executeAsBaal", [
            CONTRACT_ADDRESS,
            0,              
            mintLootData    
            ]);

            const multisendPayload = await contract.encodeMultisend(
              [mintLootData],        // array of calls
              CONTRACT_ADDRESS       // target address for each call (usually your Baal contract address)
            );

            const tx = await contract.processProposal(proposalId, multisendPayload);
            const receipt = await tx.wait();
            console.log("Process Proposal:", receipt);
            return receipt;
        } catch (error) {
            console.error("Error processing proposal:", error);
        }
    };

    const cancelProposalViaSafe = async (proposalId) => {
        if (!contract) return;
        try {
          const data = contract.interface.encodeFunctionData("cancelProposal", [proposalId]);
          const receipt = await execSafeTransaction(CONTRACT_ADDRESS, 0, data);
          console.log("Cancel Proposal via Safe tx:", receipt);
          return receipt;
        } catch (error) {
          console.error("Error cancelling proposal via Safe:", error);
        }
      };

    const getUserLootBalance = async (userAddress) => {
      if (!contract || !provider) return "0";
      try {
        const lootTokenAddress = await contract.lootToken();
        const lootContract = new ethers.Contract(lootTokenAddress, ERC20_ABI, provider);
        const balance = await lootContract.balanceOf(userAddress);

        return ethers.formatUnits(balance, 18);
      } catch (error) {
        console.error("Error fetching user loot balance:", error);
        return "0";
      }
    };

    const getUserSharesBalance = async (userAddress) => {
      if (!contract || !provider) return "0";
      try {
        const sharesTokenAddress = await contract.sharesToken();
        const sharesContract = new ethers.Contract(sharesTokenAddress, ERC20_ABI, provider);
        const balance = await sharesContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, 18);
      } catch (error) {
        console.error("Error fetching user shares balance:", error);
        return "0";
      }
    };

    const getBaalConfig = async () => {
      if (!contract) return null;
      try {
        const votingPeriod = await contract.votingPeriod();
        const gracePeriod = await contract.gracePeriod();
        const proposalOffering = await contract.proposalOffering();
        const quorumPercent = await contract.quorumPercent();
        const sponsorThreshold = await contract.sponsorThreshold();
        const minRetentionPercent = await contract.minRetentionPercent();
        const adminLock = await contract.adminLock();
        const managerLock = await contract.managerLock();
        const governorLock = await contract.governorLock();
        const communityVault = await contract.communityVault();

        return {
          votingPeriod: votingPeriod.toString(),
          gracePeriod: gracePeriod.toString(),
          proposalOffering: proposalOffering.toString(),
          quorumPercent: quorumPercent.toString(),
          sponsorThreshold: sponsorThreshold.toString(),
          minRetentionPercent: minRetentionPercent.toString(),
          adminLock,
          managerLock,
          governorLock,
          communityVault
        };
      } catch (error) {
        console.error("Error fetching Baal config:", error);
        return null;
      }
    };


  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        provider,
        signer,
        getTotalShares,
        getTotalLoot,
        submitProposal,
        sponsorProposalViaSafe,
        submitVote,
        getProposalCount,
        getAllProposals,
        getProposalState,
        processProposal,
        cancelProposalViaSafe,
        getUserLootBalance,
        getUserSharesBalance,
        getBaalConfig
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
