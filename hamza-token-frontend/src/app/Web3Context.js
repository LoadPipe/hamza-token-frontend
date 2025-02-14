import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers, formatUnits } from "ethers";

import CustomBaalABI from "../../abis/CustomBaal_abi.json"; 

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);

    const CONTRACT_ADDRESS = "0x54fe82B58e63C66BaC4398E2B08C3D1276e3231F";

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
            const proposalId = receipt.logs[0].args[0]; // Extract proposal ID from event logs

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
    
    

    return (
        <Web3Context.Provider
            value={{
                account,
                contract,
                provider,
                signer,
                getTotalShares,
                getTotalLoot,
                submitProposal
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

// Hook for accessing Web3 context
export const useWeb3 = () => useContext(Web3Context);
