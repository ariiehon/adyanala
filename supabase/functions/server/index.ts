import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
}

// --- FUNGSI KIRIM EMAIL (UTUH SEPERTI PUNYA LO) ---
const sendEmail = async (toEmail: string, name: string, status: string, division: string, role: string, proker: string) => {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return

  let subject = ''
  let htmlContent = ''

  if (status === 'accepted') {
    subject = '🎉 SELAMAT — Kamu Diterima Menjadi Pengurus HIMA K3 Kabinet Adyanala'
    htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="color: #0D652D;">Hai ${name},</h2>
        <p>Selamat! Kamu <strong>DITERIMA</strong> bergabung dengan HIMA K3 Kabinet Adyanala.</p>

        <div style="background:#f0fdf4; border:1px solid #16a34a; padding:12px; border-radius:8px; margin:16px 0;">
          <p style="margin:6px 0;"><strong>Departemen:</strong> ${division}</p>
          <p style="margin:6px 0;"><strong>Program Kerja (Proker):</strong> ${proker}</p>
          <p style="margin:6px 0;"><strong>Jabatan:</strong> ${role}</p>
        </div>

        <p>Detail lebih lanjut (jadwal pelatihan & orientasi) akan dikirimkan menyusul. Jika ada pertanyaan, balas email ini atau hubungi <a href="mailto:onboarding@hima-k3.unair.id">onboarding@hima-k3.unair.id</a>.</p>

        <br/>
        <p>Salam hangat,<br/>Panitia Rekrutmen HIMA K3 Adyanala</p>
      </div>
    `
  } else if (status === 'rejected') {
    subject = 'Informasi Seleksi HIMA K3 Adyanala'
    htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Halo ${name},</h2>
        <p>Terima kasih telah mengikuti proses seleksi HIMA K3 Kabinet Adyanala. Mohon maaf, saat ini kami belum dapat mengakomodasi kamu untuk bergabung.</p>
        <p>Jangan berkecil hati — tetap aktif dan ikuti kesempatan selanjutnya. Jika ingin, kamu bisa meminta feedback dengan membalas email ini.</p>
        <br/>
        <p>Salam,<br/>Panitia Rekrutmen HIMA K3 Adyanala</p>
      </div>
    `
  } else if (status === 'pending') {
    subject = 'Update Status Pendaftaran HIMA K3 Adyanala'
    htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Halo ${name},</h2>
        <p>Status pendaftaranmu sekarang: <strong>PENDING</strong>. Kami akan menghubungi kembali setelah proses penilaian selesai.</p>
        <p>Terima kasih atas kesabaranmu.</p>
        <br/>
        <p>Salam,<br/>Panitia Rekrutmen HIMA K3 Adyanala</p>
      </div>
    `
  } else {
    return
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendKey}`
    },
    body: JSON.stringify({
      from: 'HIMA K3 <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html: htmlContent
    })
  })
}

// --- SERVER UTAMA ---
Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' 
    )

    // 1. SUBMIT PENDAFTARAN (POST) + FIX UNTUK ERROR MERAH
    if (req.method === 'POST' && url.pathname.includes('/submit')) {
      const body = await req.json()
      
      // Fix: Hapus field yang berisi "-" agar tidak bentrok dengan tipe data database
      const cleanData = { ...body }
      if (cleanData.ipk === '-') delete cleanData.ipk
      if (cleanData.semester === '-') delete cleanData.semester
      if (cleanData.motivation === '-') delete cleanData.motivation

      const { data, error } = await supabase
        .from('applications')
        .insert(cleanData)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ success: true, applicationId: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. CEK STATUS (POST) - UTUH
    if (req.method === 'POST' && url.pathname.includes('/check-status')) {
      const { identifier } = await req.json()
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .or(`email.eq.${identifier},nim.eq.${identifier}`)
        .maybeSingle()

      if (error) throw error

      let result = { found: false }
      
  if (data) {
  result = {
    found: true,
    fullName: data.full_name,             // ← nama kolom di DB
    nim: data.nim,
    email: data.email,
    proker1: data.proker1,
    department1: data.department1,
    proker2: data.proker2,
    department2: data.department2,
    status: data.status,
    submittedAt: data.created_at,
    assignedDivision: data.assigned_division, // ← TAMBAH INI
    final_proker: data.final_proker,          // ← TAMBAH INI
    final_role: data.final_role,              // ← TAMBAH INI
  }
}


      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. UPDATE STATUS ADMIN (PATCH) - UTUH
    if (req.method === 'PATCH' && url.pathname.includes('/status')) {
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 2]
      
      const body = await req.json()
      const { status, assignedDivision, final_proker, final_role } = body

      const { data, error } = await supabase
        .from('applications')
        .update({ 
          status: status, 
          assigned_division: assignedDivision,
          division1: assignedDivision,
          final_proker: final_proker, 
          final_role: final_role      
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Kirim Email (Panggil fungsi sendEmail di atas)
      await sendEmail(data.email, data.full_name, status, assignedDivision, final_role, final_proker).catch(console.error)

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
 
        // 3b. UPDATE STATUS ADMIN (POST /update-status) - DIPAKAI AdminDashboard
    if (
      req.method === 'POST' &&
      url.pathname.includes('/update-status')
    ) {
      const {
        applicationId,
        status,
        assignedDivision,
        finalProker,
        finalRole,
      } = await req.json()

      // 1. Ambil data pendaftar (butuh email & nama)
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('id, fullName, email')
        .eq('id', applicationId)
        .single()

      if (fetchError || !appData) {
        throw new Error('Data pendaftar tidak ditemukan')
      }

      // 2. Update status + penempatan final
      const { data, error: updateError } = await supabase
        .from('applications')
        .update({
          status: status,
          assigned_division: status === 'accepted' ? assignedDivision : null,
          division1: status === 'accepted' ? assignedDivision : null,
          final_proker: status === 'accepted' ? finalProker : null,
          final_role: status === 'accepted' ? finalRole : null,
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (updateError) throw updateError

      // 3. Kirim email dengan data final
      await sendEmail(
        appData.email,
        appData.fullName,
        status,
        status === 'accepted' ? assignedDivision : '',
        status === 'accepted' ? finalRole : '',
        status === 'accepted' ? finalProker : '',
      ).catch(console.error)

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 4. LIST DATA ADMIN (GET) - UTUH
    if (req.method === 'GET' && url.pathname.includes('/list')) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify({ success: true, applications: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. STATS ADMIN (GET) - UTUH
    if (req.method === 'GET' && url.pathname.includes('/stats')) {
      const { data: apps } = await supabase.from('applications').select('status, department1')
      
      const stats = {
        total: apps?.length || 0,
        byStatus: {
          pending: apps?.filter(a => a.status === 'pending').length || 0,
          accepted: apps?.filter(a => a.status === 'accepted').length || 0,
          rejected: apps?.filter(a => a.status === 'rejected').length || 0,
        },
        byDivision: {}
      }
      
      apps?.forEach(a => {
        const div = a.department1 || 'Unassigned'
        stats.byDivision[div] = (stats.byDivision[div] || 0) + 1
      })

      return new Response(JSON.stringify({ success: true, stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: "Server Ready" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})