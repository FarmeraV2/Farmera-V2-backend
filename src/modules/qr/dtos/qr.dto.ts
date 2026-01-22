import { Expose } from "class-transformer";
import { QrStatus } from "../enums/qr-status";

export class QrDto {
    @Expose() id: number;
    @Expose() qr_code: string;
    @Expose() product_id: number;
    @Expose() status: QrStatus;
    @Expose() created: Date;
    @Expose() updated: Date;
    @Expose() activated: Date;
}

const qrDtoProps = Object.keys(new QrDto());
export const qrSelectFields = qrDtoProps
    .map((prop) => `qr.${prop}`);