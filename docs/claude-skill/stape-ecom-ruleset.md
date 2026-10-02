# Ruleset STP: Stape e-commerce tracking with CMP

Reference setup: `stape-ecom-cmp` in the Omnipixel MCP (web + server GTM container).
Use the rule IDs when reporting findings, e.g. "STP-32 failed: Meta PageView fires before consent".

**Severity:** Critical = data loss or legal risk. High = attribution or match quality is clearly reduced. Medium = maintainability. Low = nice to have.

**How to verify:**
- `scan`: visible in the `scan_website` result
- `ref`: compare with `get_reference_setup`
- `gtm`: needs access to the client's GTM containers

---

## A. Architecture

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-01 | Critical | The site runs server-side GTM on a first-party subdomain of the client's own domain (e.g. `https://sgtm.client.dk`). Both web streams point to it through the constant `const - server_container_url`. | scan: `tracking.serverSideTracking`, `serverSideTrackingPlatform`. gtm: constant value |
| STP-02 | High | Google data uses the GA4 stream. The Google Tag sets `server_container_url` and `send_page_view = false`, and all GA4 event tags share the event settings variable `ga4 - shared_event_settings`, which also carries `server_container_url`. The server GA4 client receives it. | ref: `platform: ga4` |
| STP-03 | High | Non-Google platforms use the Stape Data Tag stream: request path `/data`, protocol v2, with consent state and common cookies included. The server Data Client receives it. | ref: `platform: data_tag`, server `clients` |
| STP-04 | High | Hybrid tracking: every ad platform has both a browser pixel and a server Conversion API tag for the same events (Meta, TikTok, Snapchat, Pinterest, LinkedIn, Reddit). Exceptions: Google Ads and Klaviyo run only server-side, and Microsoft Ads runs only in the browser. | ref: `eventMatrix` per container |

## B. Naming and structure

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-10 | Medium | There is one folder per platform, named `[Stape] <Platform>`, and tags are named `[Stape] <Platform> - <Event>`. | gtm |
| STP-11 | Medium | Trigger names start with a prefix: `ce -` for a custom event, `tg -` for a trigger group, `dc -` for a Data Client event, `ga4 -` for a GA4 client event, `clientName -` for a client filter. | gtm |
| STP-12 | Medium | Variable names start with a prefix: `const -`, `dlv -` (data layer), `ed -` (server event data), `1pc -` (first-party cookie), `ucv -` or a platform name (e.g. `meta - contents`) for derived values. | gtm |
| STP-13 | High | Every pixel ID, conversion ID, conversion label and API token is stored in a Constant variable, never typed directly into a tag. API tokens (Meta CAPI, TikTok, Snap, Pinterest, LinkedIn, Reddit, Klaviyo private key) exist only in the server container. | gtm. ref: `variables` of type Constant |

## C. Data layer

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-20 | High | E-commerce events follow GA4 naming with a `_stape` suffix: `view_item_stape`, `view_collection_stape` / `view_item_list_stape`, `view_cart_stape`, `add_to_cart_stape`, `remove_from_cart_stape`, `begin_checkout_stape`, `add_shipping_info_stape`, `add_payment_info_stape`, `purchase_stape`, `search_submitted_stape`. Page views are driven by `stape_consent_update`. | gtm. ref: `triggers` |
| STP-21 | High | The `ecommerce` object contains `value`, `currency`, `items` (GA4 item schema), plus `transaction_id`, `coupon`, `shipping` and `tax` on purchase. `user_data` contains `email_address`, `phone_number`, `first_name`, `last_name`, `street`, `city`, `region`, `postal_code`, `country` and `customer_id`. | gtm, or the dataLayer section of the Omnipixel results page |
| STP-22 | Medium | Platform-specific item formats (Meta `contents`/`content_ids`, TikTok `contents`, Snap item IDs, Pinterest line items, Reddit products, Klaviyo items) are derived from `ecommerce.items` with Stape's Universal Conversions Variable. They are not separate data layer pushes. | ref: `variables` |

## D. Consent

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-30 | Critical | A CMP sets Google Consent Mode V2 defaults to `denied` before any tag loads. | scan: `privacy.cmp`, `privacy.consentModeV2`, `privacy.consentDefaults` (all six types should be `denied`) |
| STP-31 | Critical | The Stape Consent Mode Listener tag fires on *Consent Initialization - All Pages*, monitors all consent types, and pushes `stape_consent_update` on load and on every change. | ref: `platform: consent` |
| STP-32 | Critical | No tag fires before the consent state is known. Page-view tags fire on `ce - stape_consent_update`. Event tags use a trigger group of the event plus `stape_consent_update` (e.g. `tg - consent + purchase`). | ref: `triggers`, tag `firesOn` |
| STP-33 | Critical | Browser ad pixels (Meta, TikTok, Snapchat, Pinterest, LinkedIn, Reddit, Microsoft Ads) require `ad_storage` in GTM's consent settings. GA4 and the Data Tag are set to "no additional consent required": they rely on Consent Mode and send the consent state along. | ref: tag `consent` |
| STP-34 | Critical | Server Conversion API tags (Meta, TikTok, Snapchat, Pinterest, LinkedIn, Reddit, Klaviyo) have ad_storage consent set to `required`. Server tags then respect the consent state forwarded by the Data Tag. | ref: server tag `consent` |
| STP-35 | High | Microsoft UET inherits consent from GTM and listens for consent updates. | ref: `platform: microsoft_ads`, `includeParameters` |

## E. Deduplication

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-40 | Critical | One `Unique Event ID` variable is used as the event ID on every browser pixel: Meta `eventId`, TikTok `eventId`, Snap `client_dedup_id`, Pinterest `event_id`, Reddit `conversionId`, LinkedIn `eventId`. | ref: `includeParameters` per platform |
| STP-41 | Critical | The same ID is sent as `event_id` in the Data Tag, and server tags read it through `ed - event_id`: Meta, TikTok, Snap and Pinterest `event_id`, LinkedIn `eventId`, Reddit `conversion_id`, Klaviyo `uniqueId`. | ref: server, `includeParameters` |
| STP-42 | High | The browser and server tags of a platform use the same event names (see the event map below). | ref: `eventMatrix` |

## F. Event map

The Stape data layer event drives both containers. The GA4 web tag also feeds Google Ads on the server.

| GA4 event | Data layer event | Meta | TikTok | Snapchat | Pinterest | LinkedIn | Reddit | Microsoft Ads (web) | Google Ads (server) | Klaviyo (server) |
|---|---|---|---|---|---|---|---|---|---|---|
| page_view | stape_consent_update | PageView | Pageview | PAGE_VIEW | pagevisit | PageView | PageVisit | PAGE_LOAD | Remarketing + Conversion Linker | Active On Site |
| view_item_list | view_collection_stape | – | – | – | – | – | – | – | – | – |
| view_item | view_item_stape | ViewContent | ViewContent | VIEW_CONTENT | – | – | ViewContent | – | – | Viewed Product |
| view_cart | view_cart_stape | – | – | – | – | – | – | – | – | – |
| add_to_cart | add_to_cart_stape | AddToCart | AddToCart | ADD_CART | addtocart | AddToCart | AddToCart | AddToCart | AddToCart | Added to Cart |
| remove_from_cart | remove_from_cart_stape | – | – | – | – | – | – | – | – | – |
| begin_checkout | begin_checkout_stape | InitiateCheckout | InitiateCheckout | START_CHECKOUT | – | BeginCheckout | – | BeginCheckout | BeginCheckout | Started Checkout |
| add_shipping_info | add_shipping_info_stape | – | – | – | – | – | – | – | – | – |
| add_payment_info | add_payment_info_stape | AddPaymentInfo | AddPaymentInfo | ADD_BILLING | – | – | – | – | – | – |
| purchase | purchase_stape | Purchase | Purchase | PURCHASE | checkout | Purchase | Purchase | Purchase + Enhanced Conversion | Purchase | Placed Order |
| search | search_submitted_stape | Search | – | – | – | – | – | – | – | – |

Rows with only dashes are GA4-only events.

## G. User data and match quality

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-50 | High | Browser pixels use advanced matching. Meta gets `em`, `external_id`, `fn` and `ln`, stored hashed. Server tags send `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country` and `external_id`. | ref: `includeParameters` |
| STP-51 | High | Purchase sends the full address set. Other events send at least e-mail, first and last name and the customer ID. | ref: `platform: data_tag`, `includeParameters` |
| STP-52 | High | GA4 sends user-provided data (manual mode) on purchase. Microsoft Ads sends Enhanced Conversions (`em`, `ph`) on purchase. | ref: `platform: ga4` / `microsoft_ads` |
| STP-53 | High | Purchase events carry `value`, `currency` and the order ID (`transaction_id` / `order_id`) on every platform. | ref: `includeParameters` |

## H. Google Ads on the server

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-60 | High | Google Ads conversions (purchase, begin_checkout, add_to_cart) fire in the server container from GA4 client events. Conversion Linker and dynamic remarketing fire on every GA4 client request. New customer reporting and product reporting are enabled. | ref: `platform: google_ads` |
| STP-61 | High | gclid survives ITP. The web container reads the `FPGCLAW` first-party cookie and sends it as `custom_fpgclaw` in the shared GA4 event settings. When `custom_fpgclaw` is set, a server transformation adds the gclid to `page_location` for the Google Ads Purchase and BeginCheckout tags. A second transformation removes `custom_fpgclaw` from every tag except those two. | ref: server `transformations` |

## I. Cookies

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-70 | High | The GA4 client manages the `FPID` cookie server-side (2 years, automatic domain). | ref: server `clients` |
| STP-71 | Medium | The Data Client prolongs cookies. Meta CAPI generates `_fbp` and TikTok generates `ttp` server-side when they're missing. | ref: server `clients`, `includeParameters` |

## J. Hygiene

| ID | Severity | Rule | Verify |
|----|----------|------|--------|
| STP-80 | Medium | No paused or unused tags in the published container. The reference has none. | scan: `tracking.gtm.pausedTags` |
| STP-81 | Low | Server tags log only during debug and preview. Test modes and BigQuery logging are off unless they are actively used. | ref: `includeParameters` (`logType`, `testMode`, `bigQueryLogType`) |
| STP-82 | Low | Tags use the Stape and vendor Gallery templates listed in the reference rather than Custom HTML. | ref: `templates` |

---

## What the Omnipixel scan can confirm on its own

A scan doesn't need GTM access. It can confirm STP-01 (server-side tracking and platform), STP-30 (CMP, Consent Mode V2, default states) and STP-80 (paused tags). It also shows which pixels are present (`tracking.pixels`), which indicates STP-04 coverage. Every other rule needs the client's container exports or GTM access, compared against `get_reference_setup`.
