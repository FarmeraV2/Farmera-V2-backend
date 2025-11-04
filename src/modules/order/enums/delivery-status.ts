export enum DeliveryStatus {
    PREPARING = 'PREPARING', // Cửa hàng chuẩn bị hàng
    SHIPPED = 'SHIPPED', // Đã bàn giao cho đơn vị vận chuyển.
    DELIVERED = 'DELIVERED', // Đã giao hàng thành công.
    FAILED = 'FAILED', // Giao hàng không thành công.
    RETURNED = 'RETURNED', // Trả hàng về cửa hàng.
    CANCELED = 'CANCELED', // Đơn hàng bị hủy.
}

export enum DeliveryMethod {
    LIGHT = '2', // Hàng nhẹ service_type_id = 2
    HEAVY = '5', // Hàng nặng service_type_id = 5
}

export enum DeliveryRequiredNote {
    CHOTHUHANG = 'CHOTHUHANG', // cho thử hàng
    CHOXEMHANGKHONGTHU = 'CHOXEMHANGKHONGTHU', // cho xem hàng không thử
    KHONGCHOXEMHANG = 'KHONGCHOXEMHANG', // không cho xem hàng
}

export enum DeliveryPaymentType {
    NGUOIGUI = '1', // Người bán trả phí vận chuyển
    NGUOINHAN = '2', // Người mua trả phí vận chuyển
}