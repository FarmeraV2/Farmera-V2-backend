import { OldDistrict } from "../entities/old-district.entity"
import { OldProvince } from "../entities/old-province.entity"
import { OldWard } from "../entities/old-ward.entity"
import { Province } from "../entities/province.entity"
import { Ward } from "../entities/ward.entity"

export interface AddressService {
    getProvinces(): Promise<OldProvince[] | Province[]>
    getDistricts?(code: number): Promise<OldDistrict[]>
    getWards(code: number): Promise<OldWard[] | Ward[]>
}