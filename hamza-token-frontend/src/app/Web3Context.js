import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers, formatUnits } from "ethers";

import CustomBaalABI from "../../abis/CustomBaal_abi.json"; 
import GNOSIS_SAFE_ABI from "../../abis/GnosisSafe_abi.json";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

    const CONTRACT_ADDRESS = "0xDc5Dd2333AAEf13d6dfb691F1C383489b157abAc";
    const GNOSIS_ADDRESS = "0x09D073aCBC557e60Ceb802f44ef1aE196a490fA7";

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

    const submitProposal = async (amount, recipient, expiration = 0, baalGas = 300000) => {
        if (!contract) return;
        try {
            console.log("Submitting proposal...");
            const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address[]", "uint256[]"],
                [[recipient], [amount]]
            );

            const tx = await contract.submitProposal(
                proposalData,
                expiration,
                baalGas,
                "Proposal to deposit funds and receive loot"
            );
            const receipt = await tx.wait();
            console.log("submitProposal receipt:", receipt);
            // Use event signature to filter logs
            const eventSignature = contract.interface.getEvent("SubmitProposal").topicHash;
            const proposalEventLog = receipt.logs.find(log => log.topics[0] === eventSignature);

            if (!proposalEventLog) {
                console.error("SubmitProposal event not found in logs:", receipt.logs);
                return;
            }

            // Decode the log
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
            return totalShares.toString(); // Return as whole number
        } catch (error) {
            console.error("Error fetching total shares:", error);
        }
    };
    
    const getTotalLoot = async () => {
        if (!contract) return;
        try {
            const totalLoot = await contract.totalLoot();
            console.log("Raw Total Loot:", totalLoot.toString()); 
            return totalLoot.toString(); // Return as whole number
        } catch (error) {
            console.error("Error fetching total loot:", error);
        }
    };

    const execSafeTransaction = async (to, value, data) => {
        if (!signer) {
            console.error("No signer available");
            return;
        }

        // 1. Instantiate the Gnosis Safe contract
        const safeContract = new ethers.Contract(GNOSIS_ADDRESS, GNOSIS_SAFE_ABI, signer);

        // 2. Construct a "fake" signature for single-sig:
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
            0,                // operation
            0,                // safeTxGas
            0,                // baseGas
            0,                // gasPrice
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            signature
        );

        // 4. Wait for confirmation
        const receipt = await tx.wait();
        console.log("execTransaction receipt:", receipt);
        return receipt;
    };

    const sponsorProposalViaSafe = async (proposalId) => {
        if (!contract) return;
        try {
            // 1. Encode the function call data for `sponsorProposal(uint32)`
            const baalInterface = contract.interface;
            const data = baalInterface.encodeFunctionData("sponsorProposal", [
            proposalId
            ]);

            // 2. Execute from the Safe             
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
            console.log("Submitting vote...");
            // Encode the function call data for `submitVote(uint32, bool)`
            const baalInterface = contract.interface;
            const data = baalInterface.encodeFunctionData("submitVote", [
                proposalId,
                support
            ]);

            // Execute from the Safe
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
    
      // Get all proposals by iterating from 1 to proposalCount
      const getAllProposals = async () => {
        if (!contract) return [];
        try {
          const count = await getProposalCount();
          const proposals = [];
          for (let i = 1; i <= count; i++) {
            const prop = await contract.proposals(i);
            proposals.push(prop);
          }
          return proposals;
        } catch (error) {
          console.error("Error fetching proposals:", error);
          return [];
        }
      };
    
      // Get a human-readable state for a given proposal ID
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
                getProposalState
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

// Hook for accessing Web3 context
export const useWeb3 = () => useContext(Web3Context);
