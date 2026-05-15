import type { DiscoveredJob } from "@/types/job";
import { isLikelyTechRoleQuery, jobFullText } from "./query-match";

export type StrictSearchDomain =
  | "warehouse"
  | "healthcare"
  | "marketing"
  | "accounting"
  | "tech"
  | "general";

/**
 * Detects coarse domain for strict signal matching (field-agnostic buckets).
 */
export function detectStrictSearchDomain(rawQuery: string): StrictSearchDomain {
  const q = rawQuery.trim().toLowerCase();

  if (!q) {
    return "general";
  }

  if (
    /\bwarehouse\b|\bwarehousing\b|\bstocker\b|\bstock clerk\b|\bforklift\b|\bdistribution\s+center\b|\bfulfillment\b|\bmaterial\s+handler\b|\bpicker\b|\bpacker\b|\breceiving\b|\bshipping\b|\blogistics\b|\bdock\b|\bloading\b|\binventory\b/.test(
      q,
    )
  ) {
    return "warehouse";
  }

  if (
    /\bnurse\b|\brn\b|\bregistered\s+nurse\b|\blpn\b|\bcna\b|\bhealthcare\b|\bhospital\b|\bclinical\b|\bpatient\b|\bmedical\b|\bcaregiver\b|\bnursing\b|\bicu\b|\bemergency\s+department\b/.test(
      q,
    )
  ) {
    return "healthcare";
  }

  if (
    /\bmarketing\b|\bmarcom\b|\bbrand\b|\bcampaign\b|\bcontent\b|\bsocial\s+media\b|\bdigital\s+marketing\b|\bgrowth\b|\bcommunications?\b|\bseo\b|\bsem\b/.test(
      q,
    )
  ) {
    return "marketing";
  }

  if (
    /\baccounting\b|\baccountant\b|\bbookkeeper\b|\bbookkeeping\b|\bcpa\b|\bledger\b|\baccounts\s+payable\b|\baccounts\s+receivable\b|\bap\s+clerk\b|\bar\s+clerk\b|\baudit\b|\btax\b/.test(
      q,
    )
  ) {
    return "accounting";
  }

  if (isLikelyTechRoleQuery(rawQuery)) {
    return "tech";
  }

  return "general";
}

const SIGNALS: Record<
  Exclude<StrictSearchDomain, "general">,
  RegExp[]
> = {
  warehouse: [
    /\bwarehouse\b/,
    /\bwarehousing\b/,
    /\binventory\b/,
    /\bshipping\b/,
    /\breceiving\b/,
    /\bfulfillment\b/,
    /\bpicker\b/,
    /\bpacker\b/,
    /\bforklift\b/,
    /\blogistics\b/,
    /\bdistribution\s+center\b/,
    /\bstock\s+clerk\b/,
    /\bmaterial\s+handler\b/,
    /\bdock\b/,
    /\bloading\b/,
    /\bstocker\b/,
  ],
  healthcare: [
    /\bnurse\b/,
    /\brn\b/,
    /\bregistered\s+nurse\b/,
    /\blpn\b/,
    /\bcna\b/,
    /\bhealthcare\b/,
    /\bhospital\b/,
    /\bclinical\b/,
    /\bpatient\b/,
    /\bmedical\b/,
    /\bcaregiver\b/,
    /\bnursing\b/,
    /\bicu\b/,
    /\btelemetry\b/,
    /\bsurgical\b/,
  ],
  marketing: [
    /\bmarketing\b/,
    /\bbrand\b/,
    /\bcampaign\b/,
    /\bcontent\b/,
    /\bsocial\s+media\b/,
    /\bdigital\s+marketing\b/,
    /\bgrowth\b/,
    /\bcommunications?\b/,
    /\bmarcom\b/,
    /\bseo\b/,
    /\bsem\b/,
    /\bcopywriter\b/,
  ],
  accounting: [
    /\baccounting\b/,
    /\baccountant\b/,
    /\bbookkeeper\b/,
    /\bbookkeeping\b/,
    /\bcpa\b/,
    /\bledger\b/,
    /\baccounts\s+payable\b/,
    /\baccounts\s+receivable\b/,
    /\bap\s+clerk\b/,
    /\bar\s+clerk\b/,
    /\baudit\b/,
    /\btax\s+prep/i,
    /\bcontroller\b/,
    /\bfinance\s+assistant\b/,
  ],
  tech: [
    /\bsoftware\b/,
    /\bdeveloper\b/,
    /\bdevops\b/,
    /\bengineer\b/,
    /\bprogrammer\b/,
    /\bcloud\b/,
    /\baws\b/,
    /\bazure\b/,
    /\bgcp\b/,
    /\bkubernetes\b/,
    /\bsre\b/,
    /\bdata\s+engineer\b/,
    /\bdata\s+scientist\b/,
    /\bmachine\s+learning\b/,
    /\bsolutions\s+architect\b/,
    /\bplatform\s+engineer\b/,
    /\bfrontend\b/,
    /\bbackend\b/,
    /\bfull[\s-]?stack\b/,
    /\btypescript\b/,
    /\bjavascript\b/,
    /\breact\b/,
    /\bnode\b/,
    /\bmobile\b.*\bdeveloper\b/,
    /\bios\b/,
    /\bandroid\b/,
  ],
};

/**
 * Strong filter: listing must show at least one domain-relevant signal in
 * title, company, description, or tags (reduces unrelated IT spam on non-tech searches).
 */
export function passesStrictDomainSignals(
  job: Pick<DiscoveredJob, "title" | "company" | "description" | "tags">,
  domain: StrictSearchDomain,
): boolean {
  if (domain === "general") {
    return true;
  }

  const text = jobFullText(job);
  const patterns = SIGNALS[domain];

  return patterns.some((re) => re.test(text));
}
