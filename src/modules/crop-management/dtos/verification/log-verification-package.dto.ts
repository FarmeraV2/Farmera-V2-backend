import { Log } from "src/modules/crop-management/entities/log.entity";
import { Farm } from "src/modules/farm/entities/farm.entity";
import { LogImageVerificationResult } from "../../entities/log-image-verification-result.entity";

export class LogVerificationPackage {
    id: number;
    log: Log;
    farm: Farm;
    ai_analysis?: LogImageVerificationResult;
    hash: Hash
    deadline: Date;
}

class Hash {
    on_chain_hash?: string;
    current_hash?: string;
}