import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://workshop:LMp9GNFx5AuhoTNh@myfirstcluster.i579n.mongodb.net/test_workshops';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export interface LatestPaidOrderResult {
  orderId: string;
  creatorName: string;
  domain: string;
  registrationDate: string;
  amountPaid: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  workshopUrl?: string;
  notes?: Record<string, any>;
}

export async function getLatestPaidOrder(input: string): Promise<LatestPaidOrderResult | null> {
  const connectedClient = await clientPromise;
  const db = connectedClient.db('test_workshops');

  const cleanPhone = input.replace(/\D/g, '');
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const trimmed = input.trim();

  const conditions: any[] = [
    { customerEmail: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
    { 'notes.customer_email': { $regex: new RegExp(`^${trimmed}$`, 'i') } },
  ];

  if (last10.length >= 7) {
    conditions.push(
      { customerPhone: { $regex: new RegExp(`${last10}$`) } },
      { 'notes.customer_phone': { $regex: new RegExp(`${last10}$`) } }
    );
  }

  const query = {
    status: 'paid',
    $or: conditions,
  };

  // Search in primary orders collection
  let orders = await db
    .collection('orders')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  // If not found in orders, check legacy orders_till_dec2025
  if (!orders || orders.length === 0) {
    orders = await db
      .collection('orders_till_dec2025')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  const order = orders[0];
  const creatorName =
    order.notes?.creator_name ||
    order.notes?.brand_name ||
    order.notes?.domain ||
    'Creator';

  const domain = order.domain || order.notes?.domain || 'N/A';
  const registrationDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
  const amountPaid = order.amount ?? 0;
  const currency = order.currency || 'INR';

  return {
    orderId: order.orderId || order._id.toString(),
    creatorName,
    domain,
    registrationDate,
    amountPaid,
    currency,
    customerName: order.customerName || order.notes?.customer_name || 'Customer',
    customerPhone: order.customerPhone || order.notes?.customer_phone || '',
    customerEmail: order.customerEmail || order.notes?.customer_email || '',
    workshopUrl: order.workshopUrl || order.notes?.whatsapp_url || '',
    notes: order.notes,
  };
}

export default clientPromise;
