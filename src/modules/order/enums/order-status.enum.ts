export enum OrderStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT', // Chờ thanh toán, đơn hàng cha. payment status = pending
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', // Chờ xác nhận, đơn hàng con.
    // Đơn hàng cha đang xử lý, đang chờ các đơn hàng con hoàn tất xác nhận
    // Đơn hàng con đã xác nhận, đang chờ lấy hàng
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED', // Đang giao hàng, đơn hàng con.
    PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED', // ĐANG chờ xác nhận, đơn hàng cha. có ít nhất 1 đơn hàng con đã hoàn thành.
    COMPLETED = 'COMPLETED', // ĐÃ hoàn thành
    CANCELED = 'CANCELED',
    RETURN_REQUESTED = 'RETURN_REQUESTED', // Khách hàng yêu cầu trả hàng
    RETURNED = 'RETURNED',
}