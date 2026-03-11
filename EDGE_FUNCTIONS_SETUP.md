# Edge Functions Setup

This project uses Supabase Edge Functions to run server-side code (e.g. bill parsing).

## CLI Installation

Make sure the Supabase CLI is installed globally:

```bash
npm install -g supabase
# or on macOS with Homebrew (if available):
# brew install supabase/tap/supabase
```

Then initialize the project (if not already done):

```bash
supabase init
```

## Creating/Editing Functions

Functions are located in `supabase/functions/<name>`. Each folder contains a Deno project (with
`deno.json` and `index.ts`).

To scaffold a new function:

```bash
cd /path/to/project
supabase functions new <function-name>
```

To run locally (while developing):

```bash
supabase start  # starts Supabase local services
supabase functions serve <function-name>
# or hit the generic endpoint:
# curl -i -X POST http://localhost:54321/functions/v1/<function-name> \
#   -H "Authorization: Bearer <anon-key>" \
#   -H "Content-Type: application/json" \
#   -d '{"foo":"bar"}'
```

## Environment Variables

Edge functions may need API keys or other secrets. Set them with the CLI or in the
Supabase dashboard under **Project Settings > API > Function Variables**.

For example, to use the Anthropic API in `parse-bill`:

```bash
supabase secrets set ANTHROPIC_API_KEY="your_key_here"
```

Be sure to add any required variables to your CI/CD or deployment environment.

## Deploying

```bash
supabase functions deploy <function-name> --project-ref <your-project-ref>
```

You can then call the deployed function via:

```
curl -X POST https://<project-ref>.functions.supabase.co/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"ocrText":"..."}'
```
