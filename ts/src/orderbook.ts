interface Fill {
    type: "fill",
    buyer: number,
    seller: number, 
    price: number,
    qty: number
}

interface OrderbookUpdate {
    type: "orderbook_update",
    userId: number,
    price: number,
    qty: number
}

export class Ordebook {
    private symbol: string;
    private orderbook: {
        bids:  Map<string, {
            orders: { userId: number, qty: number, filledQty: number, orderId: number }[],
        }>,
        asks: Map<string, {
            orders: { userId: number, qty: number, filledQty: number, orderId: number }[],
        }>,
    };

    constructor(symbol: string) {
        this.symbol = symbol;
        this.orderbook = {
            bids: new Map(),
            asks: new Map()
        };
    }

    addOrder(userId: number, type: "bid" | "ask", price: number, qty: number): (Fill | OrderbookUpdate)[] {
        let fills: (Fill | OrderbookUpdate)[] = [];
        if (type == "bid") {
            const askPrices = [...this.orderbook.asks.keys()].sort((a: string, b: string) => Number(a) - Number(b));

            let originalUserLeftQty = qty;
            for (let i = 0; i < askPrices.length; i++) {
                const bucketPrice = Number(askPrices[i]);
                if (price >= bucketPrice) {
                    let individualOrders = this.orderbook.asks.get(bucketPrice.toString())!;
                    for (let j = 0; j < individualOrders?.orders.length; j++) {
                        let sellerOrder = individualOrders?.orders[j]!;
                        let leftQty = sellerOrder.qty - sellerOrder.filledQty;
                        if (leftQty >= originalUserLeftQty) {
                            individualOrders?.orders[j].filledQty += originalUserLeftQty;
                            fills.push({
                                type: "fill",
                                buyer: userId,
                                seller: individualOrders.orders[j]?.userId!,
                                qty: originalUserLeftQty,
                                price: bucketPrice
                            });

                            originalUserLeftQty = 0;
                            break;
                        } else {
                            fills.push({
                                type: "fill",
                                buyer: userId,
                                seller: individualOrders.orders[j]?.userId!,
                                qty: leftQty, 
                                price: bucketPrice
                            });
                            originalUserLeftQty -= leftQty;
                            individualOrders.orders = individualOrders.orders.filter(x => x.orderId == individualOrders?.orders[j]?.orderId);
                        }
                    }
                    if (originalUserLeftQty == 0) {
                        break;
                    }
                } else {
                    break;
                }
            }

            if (originalUserLeftQty) {
                if (!this.orderbook.bids.get(price.toString())) {
                    this.orderbook.bids.get(price.toString()) = {
                        orders: []
                    }
                }

                this.orderbook.bids.get(price.toString())?.orders.push({
                    orderId: Math.random(),
                    userId,
                    qty,
                    filledQty: qty - originalUserLeftQty
                })

                fills.push({
                    type: "orderbook_update",
                    userId,
                    price: price,
                    qty: originalUserLeftQty
                })
            }

        }

        if (type == "ask") {
            const bidPrices = [...this.orderbook.asks.keys()].sort((a: string, b: string) => Number(b) - Number(a));

            let originalUserLeftQty = qty;
            for (let i = 0; i < bidPrices.length; i++) {
                const bucketPrice = Number(bidPrices[i]);
                if (price <= bucketPrice) {
                    let individualOrders = this.orderbook.bids.get(bucketPrice.toString())!;
                    for (let j = 0; j < individualOrders?.orders.length; j++) {
                        let buyerOrder = individualOrders?.orders[j]!;
                        let leftQty = buyerOrder.qty - buyerOrder.filledQty;
                        if (leftQty >= originalUserLeftQty) {
                            individualOrders?.orders[j].filledQty += originalUserLeftQty;
                            fills.push({
                                type: "fill",
                                seller: userId,
                                buyer: individualOrders.orders[j]?.userId!,
                                qty: originalUserLeftQty,
                                price: bucketPrice
                            });

                            originalUserLeftQty = 0;
                            break;
                        } else {
                            fills.push({
                                type: "fill",
                                seller: userId,
                                buyer: individualOrders.orders[j]?.userId!,
                                qty: leftQty, 
                                price: bucketPrice
                            });
                            originalUserLeftQty -= leftQty;
                            individualOrders.orders = individualOrders.orders.filter(x => x.orderId == individualOrders?.orders[j]?.orderId);
                        }
                    }
                    if (originalUserLeftQty == 0) {
                        break;
                    }
                } else {
                    break;
                }
            }

            if (originalUserLeftQty != 0) {
                if (!this.orderbook.asks.get(price.toString())) {
                    this.orderbook.asks.get(price.toString()) = {
                        orders: []
                    }
                }

                this.orderbook.asks.get(price.toString())?.orders.push({
                    orderId: Math.random(),
                    userId,
                    qty,
                    filledQty: qty - originalUserLeftQty
                })

                fills.push({
                    type: "orderbook_update",
                    userId,
                    price: price,
                    qty: originalUserLeftQty
                })
            }
        }



        return fills;
    }

    cancelOrder(orderId: number) {

    }

}