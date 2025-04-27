// dataService.js

const orders = [
    {
      orderId: "101",
      userId: "u001",
      userName: "Ankit Sharma",
      orderDate: "2024-04-12",
      totalAmount: 2499,
      items: [
        { name: "Wireless Earbuds", qty: 1 },
        { name: "USB-C Charger", qty: 1 }
      ],
      status: "Shipped",
      trackingId: "BD12345",
      courier: "BlueDart",
      returnEligibleUntil: "2024-05-12"
    },
    {
      orderId: "102",
      userId: "u002",
      userName: "Priya Mehta",
      orderDate: "2024-04-20",
      totalAmount: 899,
      items: [
        { name: "Phone Case", qty: 2 }
      ],
      status: "Delivered",
      trackingId: "DT56789",
      courier: "Delhivery",
      returnEligibleUntil: "2024-05-20"
    },
    {
      orderId: "103",
      userId: "u003",
      userName: "Ravi Kumar",
      orderDate: "2024-04-25",
      totalAmount: 1299,
      items: [
        { name: "Bluetooth Speaker", qty: 1 }
      ],
      status: "Processing",
      trackingId: null,
      courier: null,
      returnEligibleUntil: null
    }
  ];
  
  function getOrderById(orderId) {
    return orders.find(order => order.orderId === orderId);
  }
  
  function formatOrderInfo(order) {
    if (!order) return null;
  
    const itemsText = order.items.map(item => `${item.qty}x ${item.name}`).join(", ");
    const returnText = order.returnEligibleUntil
      ? `Return eligible until ${order.returnEligibleUntil}.`
      : "Return not yet available.";
    const trackingText = order.trackingId
      ? `Tracking via ${order.courier}: ${order.trackingId}.`
      : "Tracking not available yet.";
  
    return `
  Order ${order.orderId} (for ${order.userName}) was placed on ${order.orderDate} with a total amount of ₹${order.totalAmount}.
  Items: ${itemsText}.
  Current status: ${order.status}. ${trackingText}
  ${returnText}
    `.trim();
  }
  
  function getAllOrders() {
    return orders;
  }

  module.exports = {
    getOrderById,
    formatOrderInfo,
    getAllOrders
  };
  