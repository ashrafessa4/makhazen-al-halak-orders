

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
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Test 1: Check if admin user exists
    console.log('🔍 Testing admin login system...')
    
    const { data: adminUsers, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('*')

    console.log('📊 All admin users:', adminUsers)
    console.log('❌ Fetch error:', fetchError)

    // Test 2: Check the specific user
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', 'adamzolof135@gmail.com')
      .single()

    console.log('👤 Specific user:', specificUser)
    console.log('❌ Specific error:', specificError)

    // Test 3: Try to create/update the user with the correct password
    if (specificUser) {
      // Let's try updating the password to a simple bcrypt hash
      // First, let's try with plain text to see if that works
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update({ password_hash: 'HalakAdmin135' })
        .eq('email', 'adamzolof135@gmail.com')
        .select()

      console.log('🔄 Update result:', updateResult)
      console.log('❌ Update error:', updateError)
    } else {
      // Create the user
      const { data: createResult, error: createError } = await supabaseAdmin
        .from('admin_users')
        .insert([{
          email: 'adamzolof135@gmail.com',
          password_hash: 'HalakAdmin135'
        }])
        .select()

      console.log('➕ Create result:', createResult)
      console.log('❌ Create error:', createError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test complete, check logs',
        adminUsers,
        specificUser
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Test error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Test failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

