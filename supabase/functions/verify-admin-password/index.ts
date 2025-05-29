

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('🔍 Login attempt for email:', email)

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
      console.log('❌ Admin user not found:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Found admin user:', adminUser.email)
    console.log('🔐 Password hash starts with:', adminUser.password_hash.substring(0, 10))
    console.log('🔐 Full hash length:', adminUser.password_hash.length)

    // First, let's try to hash the incoming password and see if it matches
    // Check if the stored password is already hashed or plain text
    if (adminUser.password_hash.startsWith('$2a$') || adminUser.password_hash.startsWith('$2b$')) {
      console.log('🔐 Using bcrypt verification via PostgreSQL function')
      
      // Use PostgreSQL's crypt function to verify the password
      const { data: verifyResult, error: verifyError } = await supabaseAdmin
        .rpc('verify_password', {
          password: password,
          hash: adminUser.password_hash
        })

      console.log('🔐 PostgreSQL verify result:', verifyResult)
      console.log('🔐 PostgreSQL verify error:', verifyError)

      if (verifyError) {
        console.error('❌ Password verification error:', verifyError)
        return new Response(
          JSON.stringify({ success: false, error: 'Password verification failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (!verifyResult) {
        console.log('❌ Password verification returned false')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      // For plain text passwords (fallback)
      console.log('🔐 Using plain text comparison')
      if (password !== adminUser.password_hash) {
        console.log('❌ Plain text password does not match')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    console.log('✅ Password verification successful')

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
    console.error('💥 Password verification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

