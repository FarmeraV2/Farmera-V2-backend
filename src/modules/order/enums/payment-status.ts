export enum PaymentStatus {
    PENDING = 'PENDING', // PAYOS
    COMPLETED = 'COMPLETED', // PAYOS | COD
    FAILED = 'FAILED', // PAYOS
    REFUND_PENDING = 'REFUND_PENDING', // PAYOS do hủy đơn hàng sau khi đặt
    REFUNDED = 'REFUNDED', // PAYOS do hủy đơn hàng sau khi đặt
    UNPAID = 'UNPAID', // COD
}

export enum PaymentMethod {
    PAYOS = 'PAYOS',
    COD = 'COD'
}