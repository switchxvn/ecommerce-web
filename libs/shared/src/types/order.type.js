export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (OrderStatus = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (PaymentStatus = {}));
export var OrderType;
(function (OrderType) {
    OrderType["STANDARD"] = "standard";
    OrderType["TICKET"] = "ticket";
})(OrderType || (OrderType = {}));
export var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["TICKET"] = "TICKET";
})(ProductType || (ProductType = {}));
export var RefundReason;
(function (RefundReason) {
    RefundReason["CHANGE_MIND"] = "CHANGE_MIND";
    RefundReason["PRODUCT_DEFECT"] = "PRODUCT_DEFECT";
    RefundReason["WRONG_PRODUCT"] = "WRONG_PRODUCT";
    RefundReason["SCHEDULE_CHANGE"] = "SCHEDULE_CHANGE";
    RefundReason["OTHER"] = "OTHER";
})(RefundReason || (RefundReason = {}));
export var RefundType;
(function (RefundType) {
    RefundType["MONEY_REFUND"] = "MONEY_REFUND";
    RefundType["RESCHEDULE"] = "RESCHEDULE";
    RefundType["PRODUCT_EXCHANGE"] = "PRODUCT_EXCHANGE";
    RefundType["STORE_CREDIT"] = "STORE_CREDIT";
})(RefundType || (RefundType = {}));
export var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "PENDING";
    RefundStatus["APPROVED"] = "APPROVED";
    RefundStatus["REJECTED"] = "REJECTED";
    RefundStatus["PROCESSING"] = "PROCESSING";
    RefundStatus["COMPLETED"] = "COMPLETED";
    RefundStatus["CANCELLED"] = "CANCELLED";
})(RefundStatus || (RefundStatus = {}));
//# sourceMappingURL=order.type.js.map