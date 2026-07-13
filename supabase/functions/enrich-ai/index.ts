import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EnrichPayload {
  contactId: string;
  prenom?: string;
  nom?: string;
  entreprise?: string;
  site_web?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  email?: string;
  telephone?: string;
  linkedin?: string;
  siren_siret?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("N8N_ENRICH_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "N8N_ENRICH_WEBHOOK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: EnrichPayload = await req.json();
    if (!payload.contactId) {
      return new Response(
        JSON.stringify({ error: "Missing contactId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || "Échec de l'agent d'enrichissement IA", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ result: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
