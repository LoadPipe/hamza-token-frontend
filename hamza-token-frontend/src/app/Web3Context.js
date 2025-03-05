import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, parseEther, parseUnits } from 'ethers';

import CustomBaalABI from '../../abis/CustomBaal_abi.json';
import GNOSIS_SAFE_ABI from '../../abis/GnosisSafe_abi.json';
import ERC20_ABI from '../../abis/ERC20_abi.json';
import GovernanceTokenABI from '../../abis/GovernanceToken_abi.json';
import SettingsContractABI from '../../abis/SystemSettings_abi.json';
import GovernorContractABI from '../../abis/HamzaGovernor_abi.json';
import GovernanceVaultABI from '../../abis/GovernanceVault_abi.json';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [baalContract, setBaalContract] = useState(null);
    const [settingsContract, setSettingsContract] = useState(null);
    const [governanceToken, setGovernanceToken] = useState(null);
    const [governanceVault, setGovernanceVault] = useState(null);
    const [governorContract, setGovernorContract] = useState(null);

    const BAAL_CONTRACT_ADDRESS = '0xab710e8AA5f9C77E73627D42E5D410aAEB7da031'; // Baal contract
    const GNOSIS_ADDRESS = '0x5600994767b8c67b8d00D4fCd0C62ed9C719bfee'; // hats admin multisig
    const GOVERNANCE_TOKEN_ADDRESS =
        '0xe4291E087CA40e8f78C48CB22836909a442Df646'; //TODO: get from config
    const SETTINGS_CONTRACT_ADDRESS =
        '0x6c8fB0e9cB7c415677Cbac742F55830A9A141bF6'; //'0x48D7096A4a09AdE9891E5753506DF2559EAFdad3';
    const GOVERNOR_CONTRACT_ADDRESS =
        '0x7137EdfC0e06349a4DB6B93F63ba892f5bCaF207';
    const GOVERNANCE_VAULT_ADDRESS =
        '0x41dDDB7c0614e5818A52B1a6311B109fe56cF414';

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                const browserProvider = new ethers.BrowserProvider(
                    window.ethereum
                );
                setProvider(browserProvider);

                const web3Signer = await browserProvider.getSigner();
                setSigner(web3Signer);

                const userAddress = await web3Signer.getAddress();
                setAccount(userAddress);
                console.log('Connected account:', userAddress);

                //load custom Baal
                const baalContract = new ethers.Contract(
                    BAAL_CONTRACT_ADDRESS,
                    CustomBaalABI,
                    web3Signer
                );
                console.log('Contract loaded:', baalContract);
                setBaalContract(baalContract);

                //load governance token contract
                const govTokenContract = new ethers.Contract(
                    GOVERNANCE_TOKEN_ADDRESS,
                    GovernanceTokenABI,
                    web3Signer
                );
                setGovernanceToken(govTokenContract);

                //load governance contract
                const govContract = new ethers.Contract(
                    GOVERNOR_CONTRACT_ADDRESS,
                    GovernorContractABI,
                    web3Signer
                );
                setGovernorContract(govContract);

                //load system settings contract
                const settingsContract = new ethers.Contract(
                    SETTINGS_CONTRACT_ADDRESS,
                    SettingsContractABI,
                    web3Signer
                );
                setSettingsContract(settingsContract);

                //load governance vault contract
                const govVaultContract = new ethers.Contract(
                    GOVERNANCE_VAULT_ADDRESS,
                    GovernanceVaultABI,
                    web3Signer
                );
                setGovernanceVault(govVaultContract);
            } else {
                console.error('No Ethereum wallet detected');
            }
        };
        initWeb3();
    }, []);

    const submitLootProposal = async (expiration = 0, baalGas = 1500000) => {
        if (!baalContract || !account) return;
        try {
            console.log('Submitting proposal: mintLoot to self for 10 loot...');
            // 1. Encode the mintLoot call
            const lootAmount = ethers.parseUnits('10', 18);
            const mintLootData = baalContract.interface.encodeFunctionData(
                'mintLoot',
                [[account], [lootAmount]]
            );

            // 2. Wrap that call in an executeAsBaal call
            const executeAsBaalData = baalContract.interface.encodeFunctionData(
                'executeAsBaal',
                [BAAL_CONTRACT_ADDRESS, 0, mintLootData]
            );

            const multisendPayload = await baalContract.encodeMultisend(
                [mintLootData], // array of calls
                BAAL_CONTRACT_ADDRESS // target address for each call (usually your Baal contract address)
            );

            const tx = await baalContract.submitProposal(
                multisendPayload,
                expiration,
                baalGas,
                'Proposal to mint 10 loot to submitter'
            );
            const receipt = await tx.wait();
            console.log('submitProposal receipt:', receipt);

            // Extract proposal ID from the SubmitProposal event logs.
            const eventSignature =
                baalContract.interface.getEvent('SubmitProposal').topicHash;
            const proposalEventLog = receipt.logs.find(
                (log) => log.topics[0] === eventSignature
            );
            if (!proposalEventLog) {
                console.error(
                    'SubmitProposal event not found in logs:',
                    receipt.logs
                );
                return;
            }
            const decodedEvent =
                baalContract.interface.parseLog(proposalEventLog);
            const proposalId = decodedEvent.args[0];
            console.log(`Proposal submitted! ID: ${proposalId}`);
            return proposalId;
        } catch (error) {
            console.error('Error submitting proposal:', error);
        }
    };

    const getTotalShares = async () => {
        if (!baalContract) return;
        try {
            const totalShares = await baalContract.totalShares();
            console.log('Raw Total Shares:', totalShares.toString());
            return totalShares.toString();
        } catch (error) {
            console.error('Error fetching total shares:', error);
        }
    };

    const getTotalLoot = async () => {
        if (!baalContract) return;
        try {
            const totalLoot = await baalContract.totalLoot();
            const parsedLoot = ethers.formatUnits(totalLoot, 18);
            console.log('Raw Total Loot:', parsedLoot);
            return parsedLoot;
        } catch (error) {
            console.error('Error fetching total loot:', error);
        }
    };

    const execSafeTransaction = async (to, value, data) => {
        if (!signer) {
            console.error('No signer available');
            return;
        }
        const safeContract = new ethers.Contract(
            GNOSIS_ADDRESS,
            GNOSIS_SAFE_ABI,
            signer
        );
        const signerAddress = await signer.getAddress();
        const addressNo0x = signerAddress.replace(/^0x/, '').toLowerCase();
        const r = '0x' + addressNo0x.padStart(64, '0');
        const s = '0x' + '0'.repeat(64);
        const v = '0x01';
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
        console.log('execTransaction receipt:', receipt);
        return receipt;
    };

    const sponsorProposalViaSafe = async (proposalId) => {
        if (!baalContract) return;
        try {
            const data = baalContract.interface.encodeFunctionData(
                'sponsorProposal',
                [proposalId]
            );
            const receipt = await execSafeTransaction(
                BAAL_CONTRACT_ADDRESS,
                0,
                data
            );
            console.log('Sponsor Proposal via Safe tx:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error sponsoring proposal via Safe:', error);
        }
    };

    const submitBaalVote = async (proposalId, support) => {
        if (!baalContract) return;
        try {
            const data = baalContract.interface.encodeFunctionData(
                'submitVote',
                [proposalId, support]
            );
            const receipt = await execSafeTransaction(
                BAAL_CONTRACT_ADDRESS,
                0,
                data
            );
            console.log('Submit Vote via Safe tx:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error submitting vote via Safe:', error);
        }
    };

    const getBaalProposalCount = async () => {
        if (!baalContract) return 0;
        try {
            const count = await baalContract.proposalCount();
            return Number(count);
        } catch (error) {
            console.error('Error fetching proposal count:', error);
            return 0;
        }
    };

    const getAllBaalProposals = async () => {
        if (!baalContract) return [];
        try {
            const count = await getBaalProposalCount();
            const proposalsArr = [];
            for (let i = 1; i <= count; i++) {
                const prop = await baalContract.proposals(i);
                proposalsArr.push(prop);
            }
            return proposalsArr;
        } catch (error) {
            console.error('Error fetching proposals:', error);
            return [];
        }
    };

    const getBaalProposalState = async (proposalId) => {
        if (!baalContract) return 'Unknown';
        try {
            const stateVal = await baalContract.state(proposalId);
            const num = Number(stateVal);
            const mapping = [
                'Unborn',
                'Submitted',
                'Voting',
                'Cancelled',
                'Grace',
                'Ready',
                'Processed',
                'Defeated',
            ];
            return mapping[num] || 'Unknown';
        } catch (error) {
            console.error('Error fetching proposal state:', error);
            return 'Unknown';
        }
    };

    const processBaalProposal = async (proposalId) => {
        if (!baalContract || !account) return;
        try {
            console.log('Processing proposal', proposalId);
            // 1. Encode the mintLoot call
            const lootAmount = ethers.parseUnits('10', 18);
            const mintLootData = baalContract.interface.encodeFunctionData(
                'mintLoot',
                [[account], [lootAmount]]
            );

            // 2. Wrap that call in an executeAsBaal call
            const executeAsBaalData = baalContract.interface.encodeFunctionData(
                'executeAsBaal',
                [BAAL_CONTRACT_ADDRESS, 0, mintLootData]
            );

            const multisendPayload = await baalContract.encodeMultisend(
                [mintLootData], // array of calls
                BAAL_CONTRACT_ADDRESS // target address for each call (usually your Baal contract address)
            );

            const tx = await baalContract.processProposal(
                proposalId,
                multisendPayload
            );
            const receipt = await tx.wait();
            console.log('Process Proposal:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error processing proposal:', error);
        }
    };

    const cancelProposalViaSafe = async (proposalId) => {
        if (!baalContract) return;
        try {
            const data = baalContract.interface.encodeFunctionData(
                'cancelProposal',
                [proposalId]
            );
            const receipt = await execSafeTransaction(
                BAAL_CONTRACT_ADDRESS,
                0,
                data
            );
            console.log('Cancel Proposal via Safe tx:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error cancelling proposal via Safe:', error);
        }
    };

    const submitFeeProposal = async (feeBps) => {
        if (!governorContract || !account) return;
        try {
            console.log('Submitting proposal: change fee...');
            // 1. Encode the setFeeBps call
            const setFeeData = settingsContract.interface.encodeFunctionData(
                'setFeeBps',
                [feeBps]
            );

            const tx = await governorContract.propose(
                [SETTINGS_CONTRACT_ADDRESS],
                [0],
                [setFeeData],
                `Proposal to set fee to ${feeBps}`
            );
            const receipt = await tx.wait();
            console.log('submitProposal receipt:', receipt);

            // Extract proposal ID from the SubmitProposal event logs.
            const eventSignature =
                governorContract.interface.getEvent(
                    'ProposalCreated'
                ).topicHash;
            const proposalEventLog = receipt.logs.find(
                (log) => log.topics[0] === eventSignature
            );
            if (!proposalEventLog) {
                console.error(
                    'ProposalCreated event not found in logs:',
                    receipt.logs
                );
                return;
            }
            const decodedEvent =
                governorContract.interface.parseLog(proposalEventLog);
            const proposalId = decodedEvent.args[0];
            console.log(`Proposal submitted! ID: ${proposalId}`);
            return proposalId;
        } catch (error) {
            console.error('Error submitting proposal:', error);
        }
    };

    const submitFeeVote = async (proposalId, support) => {
        if (!governorContract || !account) return;
        try {
            const tx = await governorContract.castVote(
                proposalId,
                support ? 1 : 0
            );
            const receipt = await tx.wait();
            console.log('Submit Fee Vote:', receipt);
            return receipt;
        } catch (error) {
            console.error('Error casting governance vote:', error);
        }

        try {
            const tx = await governorContract.castVote(
                proposalId,
                support ? 1 : 0
            );
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error('Error submitting governance vote:', error);
        }
    };

    const executeFeeProposal = async (proposalId, feeBps) => {
        if (!governorContract || !account) return;
        try {
            const setFeeData = settingsContract.interface.encodeFunctionData(
                'setFeeBps',
                [feeBps]
            );

            console.log('executing proposal...');
            const txExec = await governorContract.execute(
                [SETTINGS_CONTRACT_ADDRESS],
                [0],
                [setFeeData],
                ethers.keccak256(
                    ethers.toUtf8Bytes(`Proposal to set fee to ${feeBps}`)
                )
            );

            const receipt = await txExec.wait();
            return receipt;
        } catch (error) {
            console.error('Error executing governance vote:', error);
        }
    };

    const getGovernanceProposalState = async (proposalId) => {
        if (!governorContract) return 'Unknown';
        try {
            const state = await governorContract.state(proposalId);
            const mapping = [
                'Pending',
                'Active',
                'Canceled',
                'Defeated',
                'Succeeded',
                'Queued',
                'Expired',
                'Executed',
            ];
            return mapping[Number(state)] || 'Unknown';
        } catch (error) {
            console.error('Error fetching proposal state:', error);
        }
        return 'Unknown';
    };

    // Wraps loot token in governance token, returns the new balance
    const wrapGovernanceToken = async (amount) => {
        if (!governanceToken) return;
        try {
            const amountInWei = BigInt(
                parseUnits(
                    amount.toString(),
                    parseInt(await governanceToken.decimals())
                )
            );
            console.log('amount to wrap: ', amountInWei);

            const lootToken = new ethers.Contract(
                await baalContract.lootToken(),
                ERC20_ABI,
                signer
            );

            //approve first
            console.log('approving...');
            let tx = await lootToken.approve(
                GOVERNANCE_VAULT_ADDRESS,
                amountInWei
            );
            await tx.wait();

            //wrap token
            console.log('wrapping...');
            tx = await governanceVault.deposit(amountInWei);
            await tx.wait();

            return await governanceToken.balanceOf(account);
        } catch (error) {
            console.error('Error wrapping governance token:', error);
        }
    };

    // Unwraps governance token, returns the new balance
    const unwrapGovernanceToken = async (amount) => {
        if (!governanceToken) return;
        try {
            const amountInWei = BigInt(
                parseUnits(
                    amount.toString(),
                    parseInt(await governanceToken.decimals())
                )
            );
            console.log('amount to unwrap: ', amountInWei);

            //approve first
            console.log('approving...');
            let tx = await governanceToken.approve(
                GOVERNANCE_VAULT_ADDRESS,
                amountInWei
            );
            await tx.wait();

            //wrap token
            console.log('unwrapping...');
            tx = await governanceVault.withdraw(amountInWei);
            await tx.wait();

            return await governanceToken.balanceOf(account);
        } catch (error) {
            console.error('Error wrapping governance token:', error);
        }
    };

    const getUserLootBalance = async (userAddress) => {
        if (!baalContract || !provider) return '0';
        try {
            const lootTokenAddress = await baalContract.lootToken();
            const lootContract = new ethers.Contract(
                lootTokenAddress,
                ERC20_ABI,
                provider
            );
            const balance = await lootContract.balanceOf(userAddress);

            return ethers.formatUnits(balance, 18);
        } catch (error) {
            console.error('Error fetching user loot balance:', error);
            return '0';
        }
    };

    const getUserSharesBalance = async (userAddress) => {
        if (!baalContract || !provider) return '0';
        try {
            const sharesTokenAddress = await baalContract.sharesToken();
            const sharesContract = new ethers.Contract(
                sharesTokenAddress,
                ERC20_ABI,
                provider
            );
            const balance = await sharesContract.balanceOf(userAddress);
            return ethers.formatUnits(balance, 18);
        } catch (error) {
            console.error('Error fetching user shares balance:', error);
            return '0';
        }
    };

    const getUserGovernanceTokenBalance = async (userAddress) => {
        if (!governanceToken || !provider) return '0';
        try {
            const balance = await governanceToken.balanceOf(userAddress);
            return ethers.formatUnits(
                balance,
                parseInt(await governanceToken.decimals())
            );
        } catch (error) {
            console.error(
                'Error fetching user governance token balance:',
                error
            );
            return '0';
        }
    };

    const depositToBaalVault = async (tokenAddress, amount) => {
        try {
            if (!signer || !baalContract) {
                throw new Error('No signer or Baal contract available');
            }

            // Get the target address from the Baal contract
            const targetAddress = await baalContract.avatar();
            
            // If depositing ETH (native token)
            if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
                // Direct transfer to the target address
                const tx = await signer.sendTransaction({
                    to: targetAddress,
                    value: parseEther(amount)
                });
                await tx.wait();
                console.log('ETH deposited to Baal vault:', tx.hash);
                return tx.hash;
            } else {
                // For ERC20 tokens
                const tokenContract = new ethers.Contract(
                    tokenAddress,
                    ERC20_ABI,
                    signer
                );

                // First approve the target address to spend tokens
                const amountInWei = parseUnits(amount, await tokenContract.decimals());
                const approveTx = await tokenContract.approve(targetAddress, amountInWei);
                await approveTx.wait();
                console.log('Approval tx:', approveTx.hash);

                // Then transfer tokens to the target address
                const transferTx = await tokenContract.transfer(targetAddress, amountInWei);
                await transferTx.wait();
                console.log('Tokens deposited to Baal vault:', transferTx.hash);
                return transferTx.hash;
            }
        } catch (error) {
            console.error('Error depositing to Baal vault:', error);
            throw error;
        }
    };

    const getBaalConfig = async () => {
        if (!baalContract) return null;
        try {
            const votingPeriod = await baalContract.votingPeriod();
            const gracePeriod = await baalContract.gracePeriod();
            const proposalOffering = await baalContract.proposalOffering();
            const quorumPercent = await baalContract.quorumPercent();
            const sponsorThreshold = await baalContract.sponsorThreshold();
            const minRetentionPercent =
                await baalContract.minRetentionPercent();
            const adminLock = await baalContract.adminLock();
            const managerLock = await baalContract.managerLock();
            const governorLock = await baalContract.governorLock();
            const communityVault = await baalContract.communityVault();

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
                communityVault,
            };
        } catch (error) {
            console.error('Error fetching Baal config:', error);
            return null;
        }
    };

    const getBaalVaultBalance = async () => {
        if (!provider || !baalContract) return "0";
        try {
            // Get the target (avatar) address from the Baal contract
            const targetAddress = await baalContract.avatar();
            
            // Get the ETH balance of the target address
            const balance = await provider.getBalance(targetAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting Baal vault balance:', error);
            return "0";
        }
    };

    const ragequitFromBaal = async (toAddress, sharesToBurn, lootToBurn, tokens) => {
        try {
            if (!signer || !baalContract) {
                throw new Error('No signer or Baal contract available');
            }

            // If toAddress is empty, use the connected account
            const recipient = toAddress || await signer.getAddress();
            
            console.log("Ragequit params:", {
                recipient,  // Log the actual recipient that will be used
                sharesToBurn,
                lootToBurn,
                tokens
            });

            // Convert to BigInt with exact 18 decimals (matching the contract expectation)
            // Use ethers.parseUnits for consistent decimal handling
            const sharesToBurnBN = ethers.parseUnits(sharesToBurn || '0', 18);
            const lootToBurnBN = ethers.parseUnits(lootToBurn || '0', 18);

            console.log("Parsed amounts:", {
                sharesToBurnBN: sharesToBurnBN.toString(),
                lootToBurnBN: lootToBurnBN.toString()
            });

            // For ETH, we use the special address convention from the contract
            const formattedTokens = tokens.map(token => 
                token.toLowerCase() === 'eth' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : token
            );

            console.log("Calling contract with:", {
                recipient,  // Log the actual recipient
                sharesToBurnBN: sharesToBurnBN.toString(),
                lootToBurnBN: lootToBurnBN.toString(),
                formattedTokens
            });

            // Execute the ragequit transaction exactly as the cast call does
            const tx = await baalContract.ragequit(
                recipient,         // Use the recipient address that's been determined
                sharesToBurnBN,    // Amount of shares to burn (0 in the working example)
                lootToBurnBN,      // Amount of loot to burn (1e18 in the working example)
                formattedTokens    // Array of token addresses to receive
            );

            const receipt = await tx.wait();
            console.log('Ragequit successful:', receipt.hash);
            return receipt.hash;
        } catch (error) {
            console.error('Error executing ragequit:', error);
            throw error;
        }
    };

    return (
        <Web3Context.Provider
            value={{
                account,
                contract: baalContract,
                provider,
                signer,
                getTotalShares,
                getTotalLoot,
                submitLootProposal,
                sponsorProposalViaSafe,
                submitBaalVote,
                getBaalProposalCount,
                getAllBaalProposals,
                getBaalProposalState,
                processBaalProposal,
                cancelProposalViaSafe,
                submitFeeProposal,
                submitFeeVote,
                executeFeeProposal,
                getGovernanceProposalState,
                wrapGovernanceToken,
                unwrapGovernanceToken,
                getUserLootBalance,
                getUserSharesBalance,
                getUserGovernanceTokenBalance,
                depositToBaalVault,
                getBaalConfig,
                getBaalVaultBalance,
                ragequitFromBaal,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);
