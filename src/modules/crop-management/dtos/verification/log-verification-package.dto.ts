import { Log } from "src/modules/crop-management/entities/log.entity";
import { Farm } from "src/modules/farm/entities/farm.entity";
import { LogImageVerificationResult } from "../../entities/log-image-verification-result.entity";

export class LogVerificationPackage {
    id: number;
    log: Log;
    farm: Farm;
    ai_analysis?: LogImageVerificationResult;
    on_chainHash?: string;
    deadline: Date;
}