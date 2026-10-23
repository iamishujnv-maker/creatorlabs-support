import clientPromise from './mongodb';
import { getSupportConfig } from './supportConfig';

export interface PaidWorkshopItem {
  orderId: string;
  brandName: string;
  creatorName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  domain: string;
  amount: number;
  currency: string;
  workshopTimeUtc: string | null;
  workshopTimeFormatted: string;
  relativeTimeText: string;
  statusBadge: 'Upcoming' | 'Live now' | 'Completed' | null;
  statusCategory: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
  whatsappCommunityLink: string | null;
  creatorSupportPhone: string | null;
  creatorSupportEmail: string | null;
}

export interface AttemptedWorkshopItem {
  orderId: string;
  brandName: string;
  domain: string;
  amount: number;
  triedDateFormatted: string;
  checkoutUrl: string;
}

export type SupportLookupResult =
  | {
      caseType: 'CASE_A';
      identifierType: 'phone' | 'email';
      identifierValue: string;
      workshops: PaidWorkshopItem[];
      config: {
        centralSupportWhatsApp: string;
        supportSlaText: string;
      };
    }
  | {
      caseType: 'CASE_B';
      identifierType: 'phone' | 'email';
      identifierValue: string;
      attempts: AttemptedWorkshopItem[];
      config: {
        centralSupportWhatsApp: string;
        supportSlaText: string;
      };
    }
  | {
      caseType: 'CASE_C';
      identifierType: 'phone' | 'email';
      identifierValue: string;
      suggestedOtherType: 'email' | 'phone';
      config: {
        centralSupportWhatsApp: string;
        supportSlaText: string;
      };
    };

/**
 * Format workshop time in IST (UTC+5:30)
 */
function formatWorkshopTimeIST(date: Date): string {
  try {
    const dayName = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(date);
    const dayNum = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).format(date);
    const timeStr = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date).toUpperCase();

    return `${dayName}, ${dayNum} ${month} · ${timeStr}`;
  } catch (err) {
    return date.toLocaleString();
  }
}

/**
 * Compute relative human text in IST
 */
function computeRelativeISTText(workshopDate: Date, status: 'Upcoming' | 'Live now' | 'Completed'): string {
  try {
    // Current date in IST
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const wsIST = new Date(workshopDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    const dayDiff = Math.round(
      (new Date(wsIST.getFullYear(), wsIST.getMonth(), wsIST.getDate()).getTime() -
        new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const timeStr = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(workshopDate).toUpperCase();

    const weekdayFull = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(workshopDate);
    const dayMonth = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(workshopDate);

    if (status === 'Completed') {
      return `This workshop took place on ${weekdayFull}, ${dayMonth}.`;
    }

    if (dayDiff === 0) {
      return `Your workshop is today at ${timeStr}.`;
    } else if (dayDiff === 1) {
      return `Your workshop is tomorrow, ${weekdayFull}, at ${timeStr}.`;
    } else if (dayDiff > 1 && dayDiff <= 6) {
      return `Your workshop is this ${weekdayFull}, ${dayMonth} at ${timeStr}.`;
    } else {
      return `Your workshop is on ${weekdayFull}, ${dayMonth} at ${timeStr}.`;
    }
  } catch (err) {
    return `Your workshop is scheduled for ${formatWorkshopTimeIST(workshopDate)}.`;
  }
}

export async function lookupSupportAttendee(rawInput: string): Promise<SupportLookupResult> {
  const config = getSupportConfig();
  const trimmed = rawInput.trim();

  const isEmail = trimmed.includes('@');
  const identifierType: 'phone' | 'email' = isEmail ? 'email' : 'phone';

  const cleanPhone = trimmed.replace(/\D/g, '');
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const normalizedEmail = trimmed.toLowerCase();

  const connectedClient = await clientPromise;
  const dbWorkshops = connectedClient.db('workshops');
  const dbTest = connectedClient.db('test_workshops');

  const lookbackCutoff = new Date(Date.now() - config.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // Build high-performance indexed queries
  let orderQuery: any = {
    createdAt: { $gte: lookbackCutoff },
  };

  if (isEmail) {
    orderQuery.$or = [
      { customerEmail: normalizedEmail },
      { 'notes.customer_email': normalizedEmail },
    ];
  } else {
    const phoneCandidates = [
      last10,
      `+91${last10}`,
      `91${last10}`,
      `0${last10}`,
      `+91 ${last10}`,
    ];
    orderQuery.$or = [
      { customerPhone: { $in: phoneCandidates } },
      { customerPhone: { $regex: new RegExp(`${last10}$`) } },
    ];
  }

  // Fetch orders from primary DB
  let orders = await dbWorkshops.collection('orders').find(orderQuery).sort({ createdAt: -1 }).toArray();

  // If none found in workshops, check test_workshops
  if (orders.length === 0) {
    orders = await dbTest.collection('orders').find(orderQuery).sort({ createdAt: -1 }).toArray();
  }

  // Filter out refunded
  const validOrders = orders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s !== 'refunded';
  });

  const paidOrders = validOrders.filter((o) => (o.status || '').toLowerCase() === 'paid');
  const attemptedOrders = validOrders.filter((o) => (o.status || '').toLowerCase() !== 'paid');

  // Pre-load constants for all relevant domains
  const uniqueDomains = Array.from(new Set(validOrders.map((o) => o.domain).filter(Boolean)));
  const constantsMap = new Map<string, any>();

  if (uniqueDomains.length > 0) {
    const cleanList = uniqueDomains.map((d: string) => d.replace(/^https?:\/\//, '').replace(/\/$/, ''));
    try {
      const constantsDocs = await dbWorkshops
        .collection('constants')
        .find({ site: { $in: cleanList } })
        .toArray();

      for (const doc of constantsDocs) {
        constantsMap.set(doc.site, doc.constants || {});
      }
    } catch (e) {
      console.warn('Error batch fetching constants:', e);
    }
  }

  // CASE A: At least one paid order
  if (paidOrders.length > 0) {
    const now = Date.now();
    const liveWindowMs = config.LIVE_WINDOW_MINUTES * 60 * 1000;

    const workshops: PaidWorkshopItem[] = paidOrders.map((order) => {
      const rawDomain = order.domain || order.notes?.domain || '';
      const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const constantsObj = constantsMap.get(cleanDomain) || {};

      const brandName =
        constantsObj.BRAND_NAME ||
        order.notes?.brand_name ||
        order.notes?.creator_name ||
        order.notes?.domain ||
        'Creator Workshop';

      const creatorName =
        constantsObj.CREATOR_NAME ||
        order.notes?.creator_name ||
        'Creator';

      const customerName =
        order.customerName ||
        order.notes?.customer_name ||
        'Student';

      // Parse workshop start time (W) from notes.workshopTimeUtc
      const rawWorkshopTime = order.notes?.workshopTimeUtc;
      let workshopDate: Date | null = null;
      let statusBadge: 'Upcoming' | 'Live now' | 'Completed' | null = null;
      let statusCategory: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED' = 'UPCOMING';

      if (rawWorkshopTime) {
        const parsed = new Date(rawWorkshopTime);
        if (!isNaN(parsed.getTime())) {
          workshopDate = parsed;
          const wTime = parsed.getTime();

          if (now < wTime) {
            statusBadge = 'Upcoming';
            statusCategory = 'UPCOMING';
          } else if (now >= wTime && now < wTime + liveWindowMs) {
            statusBadge = 'Live now';
            statusCategory = 'LIVE_NOW';
          } else {
            statusBadge = 'Completed';
            statusCategory = 'COMPLETED';
          }
        }
      }

      if (!statusBadge) {
        // workshop time missing or unparseable → treat as Upcoming for chips, no badge
        statusBadge = null;
        statusCategory = 'UPCOMING';
      }

      const workshopTimeFormatted = workshopDate
        ? formatWorkshopTimeIST(workshopDate)
        : 'Time details in community';

      const relativeTimeText = workshopDate
        ? computeRelativeISTText(workshopDate, statusBadge || 'Upcoming')
        : 'Please join the WhatsApp community for schedule details.';

      // Get latest fresh community link from constants table
      const whatsappCommunityLink =
        constantsObj.PAYMENT_SUCCESS_REDIRECT ||
        constantsObj.CONSULTATION_WA_LINK ||
        order.notes?.whatsapp_url ||
        null;

      const creatorSupportPhone =
        constantsObj.CREATOR_SUPPORT_PHONE ? String(constantsObj.CREATOR_SUPPORT_PHONE) :
        (order.notes?.creator_phone || order.notes?.support_phone || null);

      const creatorSupportEmail =
        constantsObj.CREATOR_SUPPORT_EMAIL ? String(constantsObj.CREATOR_SUPPORT_EMAIL) :
        (order.notes?.creator_email || order.notes?.support_email || null);

      const rawAmount = order.amount ?? 0;
      const amount = rawAmount > 500 ? Math.round(rawAmount / 100) : rawAmount;

      return {
        orderId: order.orderId || order._id.toString(),
        brandName,
        creatorName,
        customerName,
        customerPhone: order.customerPhone || order.notes?.customer_phone || '',
        customerEmail: order.customerEmail || order.notes?.customer_email || '',
        domain: cleanDomain,
        amount,
        currency: order.currency || 'INR',
        workshopTimeUtc: rawWorkshopTime || null,
        workshopTimeFormatted,
        relativeTimeText,
        statusBadge,
        statusCategory,
        whatsappCommunityLink,
        creatorSupportPhone,
        creatorSupportEmail,
      };
    });

    return {
      caseType: 'CASE_A',
      identifierType,
      identifierValue: isEmail ? normalizedEmail : last10,
      workshops,
      config: {
        centralSupportWhatsApp: config.CENTRAL_SUPPORT_WHATSAPP,
        supportSlaText: config.SUPPORT_SLA_TEXT,
      },
    };
  }

  // CASE B: No paid order, but attempted orders exist
  if (attemptedOrders.length > 0) {
    // Deduplicate by domain (one entry per domain, most recent attempt)
    const domainMap = new Map<string, any>();
    for (const att of attemptedOrders) {
      const d = (att.domain || att.notes?.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (d && !domainMap.has(d)) {
        domainMap.set(d, att);
      }
    }

    const attempts: AttemptedWorkshopItem[] = Array.from(domainMap.values()).map((att) => {
      const rawDomain = att.domain || att.notes?.domain || '';
      const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const constantsObj = constantsMap.get(cleanDomain) || {};

      const brandName =
        constantsObj.BRAND_NAME ||
        att.notes?.brand_name ||
        att.notes?.creator_name ||
        cleanDomain;

      const rawAmount = att.amount ?? 0;
      const amount = rawAmount > 500 ? Math.round(rawAmount / 100) : (rawAmount || 49);

      let triedDateFormatted = 'Recently';
      if (att.createdAt) {
        try {
          const d = new Date(att.createdAt);
          const dayNum = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(d);
          const month = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).format(d);
          triedDateFormatted = `Tried on ${dayNum} ${month} · ₹${amount}`;
        } catch {
          triedDateFormatted = `Tried recently · ₹${amount}`;
        }
      }

      return {
        orderId: att.orderId || att._id.toString(),
        brandName,
        domain: cleanDomain,
        amount,
        triedDateFormatted,
        checkoutUrl: `https://${cleanDomain}`,
      };
    });

    return {
      caseType: 'CASE_B',
      identifierType,
      identifierValue: isEmail ? normalizedEmail : last10,
      attempts,
      config: {
        centralSupportWhatsApp: config.CENTRAL_SUPPORT_WHATSAPP,
        supportSlaText: config.SUPPORT_SLA_TEXT,
      },
    };
  }

  // CASE C: Nothing found
  return {
    caseType: 'CASE_C',
    identifierType,
    identifierValue: isEmail ? normalizedEmail : last10,
    suggestedOtherType: isEmail ? 'phone' : 'email',
    config: {
      centralSupportWhatsApp: config.CENTRAL_SUPPORT_WHATSAPP,
      supportSlaText: config.SUPPORT_SLA_TEXT,
    },
  };
}
