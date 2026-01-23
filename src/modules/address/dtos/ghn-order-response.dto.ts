export class GhnFeeDetailsDto {
    main_service: number;
    insurance: number;
    cod_fee: number;
    station_do: number;
    station_pu: number;
    return: number;
    r2s: number;
    return_again: number;
    coupon: number;
    document_return: number;
    double_check: number;
    double_check_deliver: number;
    pick_remote_areas_fee: number;
    deliver_remote_areas_fee: number;
    pick_remote_areas_fee_return: number;
    deliver_remote_areas_fee_return: number;
    cod_failed_fee?: number;
}

export class GhnCreatedOrderDataDto {
    order_code: string;
    sort_code: string;
    trans_type: string;
    ward_encode: string;
    district_encode: string;
    fee: GhnFeeDetailsDto;
    total_fee: number;
    expected_delivery_time: string;
    operation_partner: string;
}

export class GhnCreateOrderResponseDto {
    code: number; // 200 là thành công
    message: string; // "Success"
    data?: GhnCreatedOrderDataDto; // Dữ liệu đơn hàng được tạo, có thể không có nếu lỗi
    message_display?: string; // Thông báo hiển thị cho người dùng
}