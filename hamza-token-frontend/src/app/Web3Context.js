import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, parseEther, parseUnits } from 'ethers';

import CustomBaalABI from '../../abis/CustomBaal_abi.json';
import GNOSIS_SAFE_ABI from '../../abis/GnosisSafe_abi.json';
import ERC20_ABI from '../../abis/ERC20_abi.json';
import GovernanceTokenABI from '../../abis/GovernanceToken_abi.json';
import SettingsContractABI from '../../abis/SystemSettings_abi.json';
import GovernorContractABI from '../../abis/HamzaGovernor_abi.json';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [baalContract, setBaalContract] = useState(null);
    const [settingsContract, setSettingsContract] = useState(null);
    const [govTokenContract, setGovTokenContract] = useState(null);
    const [governorContract, setGovernorContract] = useState(null);

    const BAAL_CONTRACT_ADDRESS = '0x3410CA83D5902043C2C24760851033D304e94CF9'; // Baal contract
    const GNOSIS_ADDRESS = '0xDD9f9570c2a8f8EB6a2aE001c224E226d77F0b63'; // hats admin multisig
    const GOVERNANCE_TOKEN_ADDRESS =
        '0x3a8d910889AE5B4658Cb9F2668584d1eb5fA86Fa'; //TODO: get from config
    const SETTINGS_CONTRACT_ADDRESS =
        '0xdefadc79d545866cfcca8164205284d5de698595'; //'0x48D7096A4a09AdE9891E5753506DF2559EAFdad3';
    const GOVERNOR_CONTRACT_ADDRESS =
        '0x3Db7C1a2bda3F478DF57B6833EC588be7Fa2dFD2';

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
                setGovTokenContract(govTokenContract);

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

            const tx = await governorContract.execute(
                [SETTINGS_CONTRACT_ADDRESS],
                [0],
                [setFeeData],
                ethers.keccak256(
                    ethers.toUtf8Bytes(`Proposal to set fee to ${feeBps}`)
                )
            );

            const receipt = await tx.wait();
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

    //returns the new balance
    const wrapGovernanceToken = async (amount) => {
        if (!govTokenContract) return;
        try {
            const amountInWei = BigInt(
                parseUnits(
                    amount.toString(),
                    parseInt(await govTokenContract.decimals())
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
                GOVERNANCE_TOKEN_ADDRESS,
                amountInWei
            );
            await tx.wait();

            //wrap token
            console.log('wrapping...');
            tx = await govTokenContract.depositFor(account, amountInWei);
            await tx.wait();

            return await govTokenContract.balanceOf(account);
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
        if (!govTokenContract || !provider) return '0';
        try {
            const balance = await govTokenContract.balanceOf(userAddress);
            return ethers.formatUnits(
                balance,
                parseInt(await govTokenContract.decimals())
            );
        } catch (error) {
            console.error(
                'Error fetching user governance token balance:',
                error
            );
            return '0';
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
                getUserLootBalance,
                getUserSharesBalance,
                getUserGovernanceTokenBalance,
                getBaalConfig,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);
