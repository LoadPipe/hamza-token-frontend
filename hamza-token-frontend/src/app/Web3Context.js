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
                setContract(baalContract);
            } else {
                console.error("No Ethereum wallet detected");
            }
        };
        initWeb3();
    }, []);

    // Mint Shares
    const mintShares = async (to, amount) => {
        if (!contract) return;
        try {
            const tx = await contract.mintShares([to], [amount]);
            await tx.wait();
            console.log("Shares minted successfully");
        } catch (error) {
            console.error("Error minting shares:", error);
        }
    };

    // Mint Loot
    const mintLoot = async (to, amount) => {
        if (!contract) return;
        try {
            const tx = await contract.mintLoot([to], [amount]);
            await tx.wait();
            console.log("Loot minted successfully");
        } catch (error) {
            console.error("Error minting loot:", error);
        }
    };

    const getTotalShares = async () => {
        if (!contract) return;
        try {
            const totalShares = await contract.totalShares();
            return formatUnits(totalShares, 18);  
            
        } catch (error) {
            console.error("Error fetching total shares:", error);
        }
    };
    
    const getTotalLoot = async () => {
        if (!contract) return;
        try {
            const totalLoot = await contract.totalLoot();
            return formatUnits(totalLoot, 18);  
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
                mintShares,
                mintLoot,
                getTotalShares,
                getTotalLoot,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

// Hook for accessing Web3 context
export const useWeb3 = () => useContext(Web3Context);
