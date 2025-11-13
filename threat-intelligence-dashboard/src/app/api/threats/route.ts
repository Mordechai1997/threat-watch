import { NextRequest, NextResponse } from 'next/server';
import { validateIp } from '@/utils/validation';
import { aggregateThreatData } from '@/utils/aggregator';
import { ThreatData } from '@/types/threat';
import { fetchAbuseIPDB, fetchIPQualityScore, fetchIPAPI } from '@/services/threatApi';
import { APP_STRINGS } from '@/utils/strings';
import { HTTP_STATUS } from '@/constants';

export async function GET(request: NextRequest) {
  const ipAddress = new URL(request.url).searchParams.get('ip');

  // Validate IP
  if (!ipAddress || !validateIp(ipAddress)) {
    return NextResponse.json(
      { error: APP_STRINGS.ERROR_IP_FORMAT },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    // Fetch from all providers in parallel
    const results = await Promise.allSettled([
      fetchAbuseIPDB(ipAddress),
      fetchIPQualityScore(ipAddress),
      fetchIPAPI(ipAddress),
    ]);

    // Check for rate limit errors (highest priority)
    const hasRateLimit = results.some(
      r => r.status === 'rejected' && r.reason?.status === HTTP_STATUS.RATE_LIMIT
    );

    if (hasRateLimit) {
      return NextResponse.json(
        { error: APP_STRINGS.ERROR_RATE_LIMIT },
        { status: HTTP_STATUS.RATE_LIMIT }
      );
    }

    // Log failures
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const providers = ['AbuseIPDB', 'IPQualityScore', 'IPAPI'];
        console.error(`${providers[i]} request failed:`, r.reason);
      }
    });

    // Extract successful data
    const [abuseDB, ipqs, ipapi] = results.map(r => 
      r.status === 'fulfilled' ? r.value : null
    );

    // Return aggregated data if at least one source succeeded
    if (abuseDB || ipqs || ipapi) {
      const data = aggregateThreatData({
        ipAddress,
        abuseDB,
        ipqs,
        ipapi,
      });
      return NextResponse.json(data as ThreatData);
    }

    // All sources failed
    return NextResponse.json(
      { error: `${APP_STRINGS.ERROR_GENERIC_FETCH} (All sources failed)` },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: APP_STRINGS.ERROR_GENERIC_FETCH },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}