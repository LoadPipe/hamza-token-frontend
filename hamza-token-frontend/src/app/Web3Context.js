import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, parseEther, parseUnits } from 'ethers';

import CustomBaalABI from '../../abis/CustomBaal_abi.json';
import GNOSIS_SAFE_ABI from '../../abis/GnosisSafe_abi.json';
import ERC20_ABI from '../../abis/ERC20_abi.json';
import GovernanceTokenABI from '../../abis/GovernanceToken_abi.json';
import SettingsContractABI from '../../abis/SystemSettings_abi.json';
import GovernorContractABI from '../../abis/HamzaGovernor_abi.json';
import GovernanceVaultABI from '../../abis/GovernanceVault_abi.json';
import CommunityVaultABI from '../../abis/CommunityVault_abi.json';
import PaymentEscrowABI from '../../abis/PaymentEscrow_abi.json';
import PurchaseTrackerABI from '../../abis/PurchaseTracker_abi.json';

const Web3Context = createContext();

// Function to parse the deploy.txt file and extract contract addresses
const getContractAddressesFromFile = async () => {
    try {
        // Fetch the deploy.txt file
        const response = await fetch('/deploy.txt');
        if (!response.ok) {
            throw new Error(`Failed to fetch deploy.txt: ${response.status}`);
        }
        const data = await response.text();
        
        // Parse the file to extract addresses
        const addresses = {
            BAAL_CONTRACT_ADDRESS: null,
            GNOSIS_ADDRESS: null,
            GOVERNANCE_TOKEN_ADDRESS: null,
            SETTINGS_CONTRACT_ADDRESS: null,
            GOVERNOR_CONTRACT_ADDRESS: null,
            GOVERNANCE_VAULT_ADDRESS: null,
            LOOT_TOKEN_ADDRESS: null,
            TIMELOCK_ADDRESS: null,
            PURCHASE_TRACKER_ADDRESS: null,
            PAYMENT_ESCROW_ADDRESS: null,
            HATS_ADDRESS: null,
            COMMUNITY_VAULT_ADDRESS: null,
            TEST_TOKEN_ADDRESS: null
        };
        
        // Extract addresses using regex
        const baalMatch = data.match(/Baal \(Hamza Vault\) deployed at: (0x[a-fA-F0-9]{40})/);
        if (baalMatch) addresses.BAAL_CONTRACT_ADDRESS = baalMatch[1];
        
        const gnosisMatch = data.match(/Gnosis Safe deployed at:\s+(0x[a-fA-F0-9]{40})/);
        if (gnosisMatch) addresses.GNOSIS_ADDRESS = gnosisMatch[1];
        
        const govTokenMatch = data.match(/GovernanceToken deployed at: (0x[a-fA-F0-9]{40})/);
        if (govTokenMatch) addresses.GOVERNANCE_TOKEN_ADDRESS = govTokenMatch[1];
        
        const settingsMatch = data.match(/SystemSettings deployed at: (0x[a-fA-F0-9]{40})/);
        if (settingsMatch) addresses.SETTINGS_CONTRACT_ADDRESS = settingsMatch[1];
        
        const governorMatch = data.match(/Governor deployed at: (0x[a-fA-F0-9]{40})/);
        if (governorMatch) addresses.GOVERNOR_CONTRACT_ADDRESS = governorMatch[1];
        
        const vaultMatch = data.match(/GovernanceVault deployed at: (0x[a-fA-F0-9]{40})/);
        if (vaultMatch) addresses.GOVERNANCE_VAULT_ADDRESS = vaultMatch[1];
        
        const lootMatch = data.match(/Loot token address: (0x[a-fA-F0-9]{40})/);
        if (lootMatch) addresses.LOOT_TOKEN_ADDRESS = lootMatch[1];
        
        const timelockMatch = data.match(/Timelock deployed at: (0x[a-fA-F0-9]{40})/);
        if (timelockMatch) addresses.TIMELOCK_ADDRESS = timelockMatch[1];
        
        const purchaseTrackerMatch = data.match(/PurchaseTracker deployed at: (0x[a-fA-F0-9]{40})/);
        if (purchaseTrackerMatch) addresses.PURCHASE_TRACKER_ADDRESS = purchaseTrackerMatch[1];
        
        const paymentEscrowMatch = data.match(/PaymentEscrow deployed at: (0x[a-fA-F0-9]{40})/);
        if (paymentEscrowMatch) addresses.PAYMENT_ESCROW_ADDRESS = paymentEscrowMatch[1];
        
        const hatsMatch = data.match(/Hats Address is:\s+(0x[a-fA-F0-9]{40})/);
        if (hatsMatch) addresses.HATS_ADDRESS = hatsMatch[1];
        
        const communityVaultMatch = data.match(/CommunityVault deployed at: (0x[a-fA-F0-9]{40})/);
        if (communityVaultMatch) addresses.COMMUNITY_VAULT_ADDRESS = communityVaultMatch[1];
        
        // Add TestToken address extraction
        const testTokenMatch = data.match(/TestToken deployed at: (0x[a-fA-F0-9]{40})/);
        if (testTokenMatch) addresses.TEST_TOKEN_ADDRESS = testTokenMatch[1];
        
        console.log('Extracted addresses from deploy.txt:', addresses);
        return addresses;
    } catch (error) {
        console.error('Error reading contract addresses from file:', error);
    }
};

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [baalContract, setBaalContract] = useState(null);
    const [settingsContract, setSettingsContract] = useState(null);
    const [governanceToken, setGovernanceToken] = useState(null);
    const [governanceVault, setGovernanceVault] = useState(null);
    const [governorContract, setGovernorContract] = useState(null);
    const [contractAddresses, setContractAddresses] = useState(null);
    const [communityVault, setCommunityVault] = useState(null);
    const [paymentEscrow, setPaymentEscrow] = useState(null);
    const [purchaseTracker, setPurchaseTracker] = useState(null);
    const [testToken, setTestToken] = useState(null);

    useEffect(() => {
        // Load contract addresses from file
        const loadAddresses = async () => {
            const addresses = await getContractAddressesFromFile();
            setContractAddresses(addresses);
            console.log('Loaded contract addresses:', addresses);
        };
        
        loadAddresses();
    }, []);

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum && contractAddresses && contractAddresses.BAAL_CONTRACT_ADDRESS) {
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
                    contractAddresses.BAAL_CONTRACT_ADDRESS,
                    CustomBaalABI,
                    web3Signer
                );
                console.log('Contract loaded:', baalContract);
                setBaalContract(baalContract);

                //load governance token contract
                const govTokenContract = new ethers.Contract(
                    contractAddresses.GOVERNANCE_TOKEN_ADDRESS,
                    GovernanceTokenABI,
                    web3Signer
                );
                setGovernanceToken(govTokenContract);

                //load governance contract
                const govContract = new ethers.Contract(
                    contractAddresses.GOVERNOR_CONTRACT_ADDRESS,
                    GovernorContractABI,
                    web3Signer
                );
                setGovernorContract(govContract);

                //load system settings contract
                const settingsContract = new ethers.Contract(
                    contractAddresses.SETTINGS_CONTRACT_ADDRESS,
                    SettingsContractABI,
                    web3Signer
                );
                setSettingsContract(settingsContract);

                //load governance vault contract
                const govVaultContract = new ethers.Contract(
                    contractAddresses.GOVERNANCE_VAULT_ADDRESS,
                    GovernanceVaultABI,
                    web3Signer
                );
                setGovernanceVault(govVaultContract);

                //load community vault contract
                const communityVaultContract = new ethers.Contract(
                    contractAddresses.COMMUNITY_VAULT_ADDRESS,
                    CommunityVaultABI,
                    web3Signer
                );
                setCommunityVault(communityVaultContract);
                
                //load payment escrow contract
                const paymentEscrowContract = new ethers.Contract(
                    contractAddresses.PAYMENT_ESCROW_ADDRESS,
                    PaymentEscrowABI,
                    web3Signer
                );
                setPaymentEscrow(paymentEscrowContract);
                
                //load purchase tracker contract
                const purchaseTrackerContract = new ethers.Contract(
                    contractAddresses.PURCHASE_TRACKER_ADDRESS,
                    PurchaseTrackerABI,
                    web3Signer
                );
                setPurchaseTracker(purchaseTrackerContract);
                
                // Load TestToken contract if address exists
                if (contractAddresses.TEST_TOKEN_ADDRESS) {
                    const testTokenContract = new ethers.Contract(
                        contractAddresses.TEST_TOKEN_ADDRESS,
                        ERC20_ABI,
                        web3Signer
                    );
                    setTestToken(testTokenContract);
                    console.log('TestToken contract loaded:', contractAddresses.TEST_TOKEN_ADDRESS);
                }
            } else {
                console.error('No Ethereum wallet detected or contract addresses not loaded');
            }
        };
        
        if (contractAddresses && contractAddresses.BAAL_CONTRACT_ADDRESS) {
            initWeb3();
        }
    }, [contractAddresses]);

    // Function to mint test tokens to the connected account
    const mintTestTokens = async (amount) => {
        if (!testToken || !signer || !account) {
            throw new Error('TestToken contract or account not available');
        }

        try {
            // Convert amount to wei (assuming 18 decimals for the test token)
            const amountInWei = parseUnits(amount.toString(), 18);
            
            // Create a custom mint function call using the interface
            const mintData = testToken.interface.encodeFunctionData("mint", [account, amountInWei]);
            
            // Call the mint function directly 
            const tx = await signer.sendTransaction({
                to: contractAddresses.TEST_TOKEN_ADDRESS,
                data: mintData
            });
            
            await tx.wait();
            console.log(`Minted ${amount} TestTokens to ${account}`);
            return tx.hash;
        } catch (error) {
            console.error('Error minting test tokens:', error);
            throw error;
        }
    };

    // Function to get test token balance
    const getTestTokenBalance = async (address) => {
        if (!testToken) return '0';
        
        try {
            const targetAddress = address || account;
            if (!targetAddress) return '0';
            
            const balance = await testToken.balanceOf(targetAddress);
            const decimals = await testToken.decimals();
            return ethers.formatUnits(balance, decimals);
        } catch (error) {
            console.error('Error getting test token balance:', error);
            return '0';
        }
    };

    // Function to get test token name and symbol
    const getTestTokenInfo = async () => {
        if (!testToken) return { name: 'Test Token', symbol: 'TEST' };
        
        try {
            const name = await testToken.name();
            const symbol = await testToken.symbol();
            return { name, symbol };
        } catch (error) {
            console.error('Error getting test token info:', error);
            return { name: 'Test Token', symbol: 'TEST' };
        }
    };

    // Function to create payment with test token
    const createTestTokenPayment = async (receiver, amount) => {
        if (!paymentEscrow || !testToken || !account) {
            throw new Error('Required contracts or account not available');
        }

        try {
            // Generate a payment ID
            const timestamp = Date.now().toString();
            const randomData = Math.random().toString();
            const paymentIdInput = ethers.concat([
                ethers.toUtf8Bytes(timestamp),
                ethers.toUtf8Bytes(randomData),
                ethers.getBytes(account)
            ]);
            
            const paymentId = ethers.keccak256(paymentIdInput);
            
            // Convert amount to token units (assuming 18 decimals)
            const amountInTokenUnits = parseUnits(amount, 18);
            
            // First approve the payment escrow to spend tokens
            const approveTx = await testToken.approve(
                contractAddresses.PAYMENT_ESCROW_ADDRESS, 
                amountInTokenUnits
            );
            await approveTx.wait();
            
            // Create payment input with the test token address
            const paymentInput = {
                id: paymentId,
                payer: account,
                receiver: receiver,
                amount: amountInTokenUnits,
                currency: contractAddresses.TEST_TOKEN_ADDRESS // Use test token address
            };
            
            // Place the payment
            const tx = await paymentEscrow.placePayment(paymentInput);
            await tx.wait();
            
            return paymentId;
        } catch (error) {
            console.error('Error creating test token payment:', error);
            throw error;
        }
    };

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
                [contractAddresses.BAAL_CONTRACT_ADDRESS, 0, mintLootData]
            );

            const multisendPayload = await baalContract.encodeMultisend(
                [mintLootData], // array of calls
                contractAddresses.BAAL_CONTRACT_ADDRESS // target address for each call (usually your Baal contract address)
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
            contractAddresses.GNOSIS_ADDRESS,
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
                contractAddresses.BAAL_CONTRACT_ADDRESS,
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
                contractAddresses.BAAL_CONTRACT_ADDRESS,
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
                [contractAddresses.BAAL_CONTRACT_ADDRESS, 0, mintLootData]
            );

            const multisendPayload = await baalContract.encodeMultisend(
                [mintLootData], // array of calls
                contractAddresses.BAAL_CONTRACT_ADDRESS // target address for each call (usually your Baal contract address)
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
                contractAddresses.BAAL_CONTRACT_ADDRESS,
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
                [contractAddresses.SETTINGS_CONTRACT_ADDRESS],
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
                [contractAddresses.SETTINGS_CONTRACT_ADDRESS],
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
                contractAddresses.GOVERNANCE_VAULT_ADDRESS,
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
                contractAddresses.GOVERNANCE_VAULT_ADDRESS,
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
                recipient,        
                sharesToBurnBN,    
                lootToBurnBN,      
                formattedTokens    
            );

            const receipt = await tx.wait();
            console.log('Ragequit successful:', receipt.hash);
            return receipt.hash;
        } catch (error) {
            console.error('Error executing ragequit:', error);
            throw error;
        }
    };

    // CommunityVault functions
    const getCommunityVaultBalance = async (tokenAddress) => {
        if (!communityVault || !tokenAddress) return null;
        try {
            const balance = await communityVault.getBalance(tokenAddress);
            return balance;
        } catch (error) {
            console.error('Error getting community vault balance:', error);
            return null;
        }
    };

    // PaymentEscrow Functions
    const createFakePayment = async (receiver, amount, currencyType = 'ETH') => {
        if (!paymentEscrow || !account) {
            throw new Error('Escrow contract or account not available');
        }

        try {
            // Generate a proper bytes32 payment ID using keccak256 hash
            // This ensures we have a valid format for the contract
            const timestamp = Date.now().toString();
            const randomData = Math.random().toString();
            const paymentIdInput = ethers.concat([
                ethers.toUtf8Bytes(timestamp),
                ethers.toUtf8Bytes(randomData),
                ethers.getBytes(account)
            ]);
            
            // Use keccak256 to get a valid bytes32 hash
            const paymentId = ethers.keccak256(paymentIdInput);
            
            console.log('Creating payment with ID:', paymentId);
            
            const paymentInput = {
                id: paymentId,
                payer: account,
                receiver: receiver,
                amount: currencyType === 'ETH' ? parseEther(amount) : parseUnits(amount, 6), // USDC has 6 decimals
                currency: currencyType === 'ETH' ? ethers.ZeroAddress : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // Mock USDC address
            };

            let tx;
            if (currencyType === 'ETH') {
                tx = await paymentEscrow.placePayment(
                    paymentInput,
                    { value: paymentInput.amount }
                );
            } else {
                // For USDC we would need to mock the token approval process
                // In a real scenario, we would approve the token first
                // For this demo, we'll just call the function directly since we're simulating
                tx = await paymentEscrow.placePayment(paymentInput);
            }
            
            await tx.wait();
            return paymentId;
        } catch (error) {
            console.error('Error creating fake payment:', error);
            throw error;
        }
    };

    // Function to release a payment from escrow
    const releasePayment = async (paymentId) => {
        if (!paymentEscrow || !account) return;
        
        try {
            const tx = await paymentEscrow.releaseEscrow(paymentId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error releasing payment:', error);
            throw error;
        }
    };

    // Function to get payment details
    const getPaymentDetails = async (paymentId) => {
        if (!paymentEscrow) return null;
        
        try {
            const payment = await paymentEscrow.getPayment(paymentId);
            return payment;
        } catch (error) {
            console.error('Error getting payment details:', error);
            return null;
        }
    };

    // Function to get user's purchase history from PurchaseTracker
    const getUserPurchaseInfo = async (userAddress, currencyType = 'ETH') => {
        if (!purchaseTracker || !userAddress) return { totalCount: '0', totalAmount: '0', currency: 'ETH' };
        
        try {
            // Determine which currency address to use
            const currencyAddress = currencyType === 'TEST_TOKEN' && contractAddresses?.TEST_TOKEN_ADDRESS
                ? contractAddresses.TEST_TOKEN_ADDRESS
                : ethers.ZeroAddress; // Default to ETH
            
            console.log(`Fetching purchase info for ${userAddress} with currency ${currencyType} (${currencyAddress})`);
            
            // Get purchase count for all currencies
            const totalCount = await purchaseTracker.getPurchaseCount(userAddress);
            
            // Get purchase amount by specific currency
            const totalAmountByCurrency = await purchaseTracker.getPurchaseAmountByCurrency(userAddress, currencyAddress);
            
            console.log(`Total purchase count: ${totalCount}, amount by ${currencyType}: ${totalAmountByCurrency}`);
            
            return {
                totalCount: totalCount.toString(),
                totalAmount: ethers.formatUnits(totalAmountByCurrency, 18),
                currency: currencyType === 'TEST_TOKEN' ? 'TEST' : 'ETH'
            };
        } catch (error) {
            console.error(`Error getting purchase info for ${currencyType}:`, error);
            return { 
                totalCount: '0', 
                totalAmount: '0', 
                currency: currencyType === 'TEST_TOKEN' ? 'TEST' : 'ETH' 
            };
        }
    };

    // Function to get user's sales history from PurchaseTracker
    const getUserSalesInfo = async (userAddress, currencyType = 'ETH') => {
        if (!purchaseTracker || !userAddress) return { totalCount: '0', totalAmount: '0', currency: 'ETH' };
        
        try {
            // Determine which currency address to use
            const currencyAddress = currencyType === 'TEST_TOKEN' && contractAddresses?.TEST_TOKEN_ADDRESS
                ? contractAddresses.TEST_TOKEN_ADDRESS
                : ethers.ZeroAddress; // Default to ETH
            
            console.log(`Fetching sales info for ${userAddress} with currency ${currencyType} (${currencyAddress})`);
            
            // Get sales count for all currencies 
            const totalCount = await purchaseTracker.getSalesCount(userAddress);
            
            // Get sales amount by specific currency
            const totalAmountByCurrency = await purchaseTracker.getSalesAmountByCurrency(userAddress, currencyAddress);
            
            console.log(`Total sales count: ${totalCount}, amount by ${currencyType}: ${totalAmountByCurrency}`);
            
            return {
                totalCount: totalCount.toString(),
                totalAmount: ethers.formatUnits(totalAmountByCurrency, 18),
                currency: currencyType === 'TEST_TOKEN' ? 'TEST' : 'ETH'
            };
        } catch (error) {
            console.error(`Error getting sales info for ${currencyType}:`, error);
            return { 
                totalCount: '0', 
                totalAmount: '0', 
                currency: currencyType === 'TEST_TOKEN' ? 'TEST' : 'ETH' 
            };
        }
    };

    // Function to get the community vault's loot token balance
    const getCommunityVaultLootBalance = async () => {
        if (!communityVault || !contractAddresses || !contractAddresses.LOOT_TOKEN_ADDRESS) {
            return null;
        }
        
        try {
            const balance = await communityVault.getBalance(contractAddresses.LOOT_TOKEN_ADDRESS);
            return {
                raw: balance,
                formatted: ethers.formatUnits(balance, 18)
            };
        } catch (error) {
            console.error('Error getting community vault loot balance:', error);
            return null;
        }
    };

    // Function to get the community vault's test token balance
    const getCommunityVaultTestTokenBalance = async () => {
        if (!communityVault || !contractAddresses || !contractAddresses.TEST_TOKEN_ADDRESS) {
            return null;
        }
        
        try {
            const balance = await communityVault.getBalance(contractAddresses.TEST_TOKEN_ADDRESS);
            return {
                raw: balance,
                formatted: ethers.formatUnits(balance, 18)
            };
        } catch (error) {
            console.error('Error getting community vault test token balance:', error);
            return null;
        }
    };

    // Function to deposit test tokens to the community vault
    const depositTestTokensToVault = async (amount) => {
        if (!testToken || !signer || !communityVault || !contractAddresses?.COMMUNITY_VAULT_ADDRESS) {
            return { 
                success: false, 
                error: 'Test token contract, community vault, or signer not available' 
            };
        }

        try {
            // Convert amount to wei (assuming 18 decimals for the test token)
            const amountInWei = parseUnits(amount.toString(), 18);
            
            // First approve the vault to spend the tokens
            const approveTx = await testToken.approve(
                contractAddresses.COMMUNITY_VAULT_ADDRESS,
                amountInWei
            );
            await approveTx.wait();
            console.log('Approval for test token transfer successful');
            
            // Then deposit to the vault
            const depositTx = await communityVault.deposit(
                contractAddresses.TEST_TOKEN_ADDRESS,
                amountInWei
            );
            const receipt = await depositTx.wait();
            
            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error depositing test tokens to vault:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred while depositing test tokens'
            };
        }
    };

    /**
     * Distribute rewards to recipients from the community vault
     * @param {string} tokenAddress - The address of the token to distribute
     * @param {string[]} recipients - Array of recipient addresses
     * @returns {Promise<{success: boolean, txHash: string, error: string}>} - Result of the transaction
     */
    const distributeRewards = async (tokenAddress, recipients) => {
        if (!communityVault || !signer) {
            return { 
                success: false, 
                error: 'Community vault contract or signer not available' 
            };
        }

        try {
            // First check if the current user has the system role to call this function
            const tx = await communityVault.connect(signer).distributeRewards(
                tokenAddress,
                recipients
            );
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error distributing rewards:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred while distributing rewards'
            };
        }
    };

    /**
     * Claim rewards for the current user
     * @param {string} tokenAddress - The address of the token to claim rewards for
     * @returns {Promise<{success: boolean, txHash: string, error: string}>} - Result of the transaction
     */
    const claimRewards = async (tokenAddress) => {
        if (!communityVault || !signer) {
            return { 
                success: false, 
                error: 'Community vault contract or signer not available' 
            };
        }

        try {
            const tx = await communityVault.connect(signer).claimRewards(tokenAddress);
            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error claiming rewards:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred while claiming rewards'
            };
        }
    };

    return (
        <Web3Context.Provider
            value={{
                account,
                submitLootProposal,
                getTotalShares,
                getTotalLoot,
                execSafeTransaction,
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
                contractAddresses,
                communityVault,
                paymentEscrow,
                purchaseTracker,
                getCommunityVaultBalance,
                createFakePayment,
                releasePayment,
                getPaymentDetails,
                getUserPurchaseInfo,
                getUserSalesInfo,
                getCommunityVaultLootBalance,
                getCommunityVaultTestTokenBalance,
                depositTestTokensToVault,
                distributeRewards,
                claimRewards,
                // New TestToken related functions
                testToken,
                mintTestTokens,
                getTestTokenBalance,
                getTestTokenInfo,
                createTestTokenPayment
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);

// Dedicated hook to access contract addresses only
export const useContractAddresses = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useContractAddresses must be used within a Web3Provider');
    }
    return context.contractAddresses;
};
