
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get admin user by email
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if password is already hashed (starts with $2)
    let isValidPassword = false;
    
    if (adminUser.password_hash.startsWith('$2')) {
      // Use bcrypt to verify hashed password
      isValidPassword = await bcrypt.compare(password, adminUser.password_hash)
    } else {
      // For backwards compatibility, check plain text (should not happen after migration)
      isValidPassword = password === adminUser.password_hash
    }

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success with admin user data (excluding password hash)
    const { password_hash, ...safeAdminUser } = adminUser
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        admin: safeAdminUser 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Password verification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
