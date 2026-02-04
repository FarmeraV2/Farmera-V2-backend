import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { processTrackingContractAbi } from "src/contracts/ProcessTracking";
import { trustComputationContractAbi } from "src/contracts/TrustComputation";
import Web3 from "web3";

@Injectable()
export class TrustworthinessService {

    private readonly logger = new Logger(TrustworthinessService.name);
    private readonly web3: Web3;
    private readonly contract: any;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
        const contractAddress = this.configService.get<string>('TRUST_COMPUTATION_CONTRACT_ADDRESS');

        if (!rpcUrl || !walletKey || !contractAddress) {
            this.logger.warn("Blockchain service configuration is missing, this service is disabled");
            return;
        }

        this.web3 = new Web3(rpcUrl);
        const account = this.web3.eth.accounts.privateKeyToAccount(walletKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;

        const abi = trustComputationContractAbi;

        this.contract = new this.web3.eth.Contract(abi, contractAddress);
    }
}