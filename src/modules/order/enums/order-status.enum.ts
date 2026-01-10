export enum OrderStatus {
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', // Chờ xác nhận
    CONFIRMED = 'CONFIRMED', // Đã xác nhận
    PAID = 'PAID', // Đã thanh toán
    PAYMENT_FAILED = 'PAYMENT_FAILED', // Thanh toán thất bại
    PREPARING = 'PREPARING', // Đang chuẩn bị
    SHIPPING = 'SHIPPING', // Đang giao hàng
    DELIVERED = 'DELIVERED', // Đã giao hàng
    CANCELLED = 'CANCELLED', // Đã hủy
    COMPLETED = 'COMPLETED' // Hoàn thành
}