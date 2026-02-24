export interface GhnApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface GhnProvince {
    ProvinceID: number;
    ProvinceName: string;
    CountryID?: number;
    Code?: string;
    NameExtension?: string[];
    IsEnable?: number;
    RegionID?: number;
}

export interface GhnDistrict {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    NameExtension?: string[];
    SupportType?: number;
    Status?: number;
}

export interface GhnWard {
    WardCode: string;
    WardName: string;
    DistrictID: number;
    NameExtension?: string[];
    Status?: number;

}