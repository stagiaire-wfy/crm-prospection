import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { html, user_id, openrouter_key, model } = await req.json();

    if (!html || !openrouter_key) {
      return new Response(
        JSON.stringify({ error: "Missing html or openrouter_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiModel = model || "openai/gpt-4o";

    const systemPrompt = `Tu es un assistant specialise dans la reecriture d'emails commerciaux.
Tu recois un email HTML et tu dois le recrire en:
- Gardant EXACTEMENT le meme sens et le meme objectif commercial
- Changeant les formulations, tournures de phrases, synonymes
- Variant la structure (ordre des phrases, ponctuation, longueur)
- Gardant un ton professionnel et naturel en francais
- Preservant les balises HTML importantes (liens, images, mise en forme)
- Ne PAS ajouter ou supprimer d'informations
- Ne PAS changer les donnees specifiques (noms, chiffres, liens, coordonnees)

IMPORTANT: Retourne UNIQUEMENT le HTML reecrit, sans explication ni commentaire.`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouter_key}`,
        "HTTP-Referer": supabaseUrl,
        "X-Title": "WebFitYou CRM",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Reecris cet email en gardant le meme sens mais en changeant les formulations:\n\n${html}` },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter error: ${res.status} - ${errText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const rewrittenHtml = data.choices?.[0]?.message?.content || html;

    return new Response(
      JSON.stringify({ success: true, html: rewrittenHtml }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
