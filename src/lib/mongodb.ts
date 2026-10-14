import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://workshop:LMp9GNFx5AuhoTNh@myfirstcluster.i579n.mongodb.net/workshops';

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

export interface SupportFlowResult {
  order: {
    orderId: string;
    creatorName: string;
    domain: string;
    registrationDate: string;
    amountPaid: number;
    currency: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  };
  whatsappCommunityLink: string | null;
  zoomLink: string | null;
  zoomSentAt: string | null;
}

/**
 * Helper to extract Zoom link from message variables or content
 */
function extractZoomFromMessage(messageDoc: any): string | null {
  if (!messageDoc) return null;

  // 1. Check variables object (MSG91 templates usually store URL in body_1, body_2, etc.)
  if (messageDoc.variables && typeof messageDoc.variables === 'object') {
    for (const key of Object.keys(messageDoc.variables)) {
      const val = String(messageDoc.variables[key]);
      const match = val.match(/https?:\/\/[^\s"'<>]*zoom\.us[^\s"'<>]*/i);
      if (match) return match[0].trim();
    }
  }

  // 2. Check full message string or raw body if available
  const stringified = JSON.stringify(messageDoc);
  const match = stringified.match(/https?:\/\/[^\s"'\\<>]*zoom\.us[^\s"'\\<>]*/i);
  if (match) return match[0].trim();

  return null;
}

/**
 * Executes the full support flow:
 * 1. Takes user input (phone or email)
 * 2. Fetches latest paid order within the last 7 days
 * 3. Fetches WhatsApp community link from the 'constants' collection
 * 4. Checks ALL messages for this user to find any message containing a Zoom link
 */
export async function getSupportOrderFlow(input: string): Promise<SupportFlowResult | null> {
  const connectedClient = await clientPromise;

  const dbWorkshops = connectedClient.db('workshops');
  const dbTest = connectedClient.db('test_workshops');

  const cleanPhone = input.replace(/\D/g, '');
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const trimmed = input.trim();

  // Filter for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

  const orderQuery = {
    status: 'paid',
    $or: conditions,
    createdAt: { $gte: sevenDaysAgo },
  };

  // 1. Fetch latest paid order in last 7 days (check both workshops and test_workshops)
  const [ordersWorkshops, ordersTest] = await Promise.all([
    dbWorkshops.collection('orders').find(orderQuery).sort({ createdAt: -1 }).limit(1).toArray(),
    dbTest.collection('orders').find(orderQuery).sort({ createdAt: -1 }).limit(1).toArray(),
  ]);

  let order: any = null;

  if (ordersWorkshops.length > 0 && ordersTest.length > 0) {
    order =
      new Date(ordersWorkshops[0].createdAt) >= new Date(ordersTest[0].createdAt)
        ? ordersWorkshops[0]
        : ordersTest[0];
  } else if (ordersWorkshops.length > 0) {
    order = ordersWorkshops[0];
  } else if (ordersTest.length > 0) {
    order = ordersTest[0];
  }

  if (!order) {
    return null;
  }

  const creatorName =
    order.notes?.creator_name ||
    order.notes?.brand_name ||
    order.notes?.domain ||
    'Creator';

  const rawDomain = order.domain || order.notes?.domain || 'N/A';
  const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const registrationDate = order.createdAt
    ? new Date(order.createdAt).toISOString()
    : new Date().toISOString();

  // 2. Fetch WhatsApp Community link from constants table
  let whatsappCommunityLink: string | null = null;

  try {
    const constantDoc = await dbWorkshops.collection('constants').findOne({
      $or: [
        { site: cleanDomain },
        { site: { $regex: new RegExp(cleanDomain.replace(/\.dev\./, '.*'), 'i') } },
        { site: { $regex: new RegExp(cleanDomain, 'i') } },
      ],
    });

    if (constantDoc && constantDoc.constants) {
      whatsappCommunityLink =
        constantDoc.constants.PAYMENT_SUCCESS_REDIRECT ||
        constantDoc.constants.CONSULTATION_WA_LINK ||
        null;
    }
  } catch (err) {
    console.warn('Error reading constants table:', err);
  }

  // Fallback to order notes if constants didn't have link
  if (!whatsappCommunityLink) {
    whatsappCommunityLink = order.notes?.whatsapp_url || order.workshopUrl || null;
  }

  // 3. Fetch Zoom link: check ALL messages for this user (filtering by phone and domain)
  const phoneToSearch = order.customerPhone || order.notes?.customer_phone || input;
  const searchDigits = phoneToSearch.replace(/\D/g, '').slice(-10);

  let zoomLink: string | null = null;
  let zoomSentAt: string | null = null;

  if (searchDigits.length >= 7) {
    const msgFilter = {
      phoneNumber: { $regex: new RegExp(`${searchDigits}$`) },
    };

    // Check ALL messages across both databases
    for (const db of [dbTest, dbWorkshops]) {
      try {
        const allMessages = await db
          .collection('messages')
          .find(msgFilter)
          .sort({ createdAt: -1 })
          .toArray();

        // 1st pass: Look for any message that matches domain AND contains Zoom link
        for (const m of allMessages) {
          const msgDomain = (m.domain || '').toLowerCase();
          const targetDomain = cleanDomain.toLowerCase().replace('.dev.', '');
          const isDomainMatch =
            !m.domain ||
            msgDomain.includes(targetDomain) ||
            targetDomain.includes(msgDomain);

          if (isDomainMatch) {
            const foundZoom = extractZoomFromMessage(m);
            if (foundZoom) {
              zoomLink = foundZoom;
              zoomSentAt = m.createdAt ? new Date(m.createdAt).toISOString() : null;
              break;
            }
          }
        }

        // 2nd pass: If domain filter didn't catch it, check ALL other messages for this phone
        if (!zoomLink) {
          for (const m of allMessages) {
            const foundZoom = extractZoomFromMessage(m);
            if (foundZoom) {
              zoomLink = foundZoom;
              zoomSentAt = m.createdAt ? new Date(m.createdAt).toISOString() : null;
              break;
            }
          }
        }

        if (zoomLink) break;
      } catch (err) {
        console.warn('Error querying messages table:', err);
      }
    }
  }

  return {
    order: {
      orderId: order.orderId || order._id.toString(),
      creatorName,
      domain: rawDomain,
      registrationDate,
      amountPaid: order.amount ?? 0,
      currency: order.currency || 'INR',
      customerName: order.customerName || order.notes?.customer_name || 'Customer',
      customerPhone: order.customerPhone || order.notes?.customer_phone || '',
      customerEmail: order.customerEmail || order.notes?.customer_email || '',
    },
    whatsappCommunityLink,
    zoomLink,
    zoomSentAt,
  };
}

export default clientPromise;
