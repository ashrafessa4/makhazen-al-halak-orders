

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

    console.log('🛠️ Setting up admin user:', email)

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

    // Use PostgreSQL's crypt function to generate a hash
    const { data: hashResult, error: hashError } = await supabaseAdmin
      .rpc('crypt', {
        password: password,
        salt: await generateSalt()
      })

    if (hashError) {
      console.error('❌ Error generating hash:', hashError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate password hash' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔐 Generated hash:', hashResult)

    // Check if admin user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .update({ password_hash: hashResult })
        .eq('email', email.toLowerCase().trim())
        .select()

      if (error) {
        console.error('❌ Error updating admin user:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update admin user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Admin user updated successfully')
    } else {
      // Create new admin user
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .insert([{
          email: email.toLowerCase().trim(),
          password_hash: hashResult
        }])
        .select()

      if (error) {
        console.error('❌ Error creating admin user:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create admin user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Admin user created successfully')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user setup complete' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Setup error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateSalt(): Promise<string> {
  // Generate a bcrypt-compatible salt
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
  let salt = '$2a$12$';
  
  for (let i = 0; i < 22; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return salt;
}

