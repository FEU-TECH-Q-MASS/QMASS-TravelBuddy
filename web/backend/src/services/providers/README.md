# Travel provider adapters

Add adapters here for Gemini, Amadeus flights/hotels, Google Maps, OpenWeather,
and Nager.Date when implementing those integrations. No adapter is implemented yet.

Adapters own authentication, provider-specific request/response formats, runtime
validation, and bounded timeouts/retries. Return normalized data with source,
currency, retrieval time, and availability/estimate status where applicable.

Place orchestration and deterministic budget calculations in the parent services
directory. Gemini recommends an itinerary from validated data; application code
verifies totals, travel dates, and feasibility. Never expose provider secrets or
log sensitive inputs. Follow each provider's caching and retention terms.
