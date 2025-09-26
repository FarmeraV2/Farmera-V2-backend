export interface FptIdrAddressEntities {
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
}

interface FptIdrBaseCardData {
    type: string;
    type_new?: string;
}

export interface FptIdrCmtOldFrontData extends FptIdrBaseCardData {
    type: 'old';
    type_new?: 'cmnd_09_front';
    id?: string;
    id_prob?: string;
    name?: string;
    name_prob?: string;
    dob?: string;
    dob_prob?: string;
    home?: string;
    home_prob?: string;
    address?: string;
    address_prob?: string;
    address_entities?: FptIdrAddressEntities;
    sex?: 'N/A';
    sex_prob?: 'N/A';
    nationality?: 'N/A';
    nationality_prob?: 'N/A';
    doe?: 'N/A';
    doe_prob?: 'N/A';
}

export interface FptIdrCccdFrontData extends FptIdrBaseCardData {
    type: 'new' | 'chip_front';
    type_new?: 'cmnd_12_front' | 'cccd_12_front' | 'cccd_chip_front';
    id?: string;
    id_prob?: string;
    name?: string;
    name_prob?: string;
    dob?: string;
    dob_prob?: string;
    sex?: string;
    sex_prob?: string;
    nationality?: string;
    nationality_prob?: string;
    home?: string;
    home_prob?: string;
    address?: string;
    address_prob?: string;
    address_entities?: FptIdrAddressEntities;
    doe?: string;
    doe_prob?: string;
}

export type FptIdrCardFrontData = FptIdrCmtOldFrontData | FptIdrCccdFrontData;
export interface FptIdrFrontSuccessResponse {
    errorCode: 0;
    errorMessage: '';
    data: FptIdrCardFrontData[];
}

export interface FptIdrErrorResponse {
    errorCode: Exclude<number, 0>;
    errorMessage: string;
    data: [];
}

export type FptIdrFrontResponse = FptIdrFrontSuccessResponse | FptIdrErrorResponse;
