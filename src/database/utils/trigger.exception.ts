import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { QueryFailedError } from 'typeorm';

export class TriggerException {

    private static readonly logger = new Logger(TriggerException.name);

    static throwStepException(error: QueryFailedError) {
        const pgError = (error as any).driverError;
        switch (pgError.code) {
            case 'ST001':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.INVALID_STEP_FOR_CROP_TYPE
                })
            case 'ST002':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.PREVIOUS_STEP_IN_PROGRESS,
                });
            case 'ST003':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.INVALID_STEP_ORDER,
                })
            default:
                this.logger.error("Query error: ", error.message);
                throw new InternalServerErrorException({
                    message: "Internal error",
                    code: ResponseCode.INTERNAL_ERROR,
                })
        }
    }

    static throwSeasonException(error: QueryFailedError) {
        const pgError = (error as any).driverError;
        switch (pgError.code) {
            case 'SS000':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.INVALID_DATE
                })
            case 'SS001':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.INVALID_SEASON_FOR_CROP_TYPE
                })
            case 'SS002':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.INVALID_SEASON_FOR_CROP_TYPE
                })
            default:
                this.logger.error("Query error: ", error.message);
                throw new InternalServerErrorException({
                    message: "Internal error",
                    code: ResponseCode.INTERNAL_ERROR,
                })
        }
    }

    static throwLogException(error: QueryFailedError) {
        const pgError = (error as any).driverError;
        switch (pgError.code) {
            case 'LG001':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.STEP_ALREADY_DONE
                })
            case 'LG002':
                throw new BadRequestException({
                    message: error.message,
                    code: ResponseCode.NOT_ENOUGH_LOG
                })
            default:
                this.logger.error("Query error: ", error.message);
                throw new InternalServerErrorException({
                    message: "Internal error",
                    code: ResponseCode.INTERNAL_ERROR,
                })
        }
    }
}