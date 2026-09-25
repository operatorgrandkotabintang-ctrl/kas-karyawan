// Fungsi Pembantu: Mengatur tampilan berdasarkan Role / Email User
function aturHakAkses(session) {
    if (!session || !session.user) return;

    const email = session.user.email;
    
    // Misal: Jika username/email mengandung kata "viewer" (contoh: viewer@kas.com atau tamu@kas.com)
    const isViewer = email.includes('viewer') || email.includes('tamu');

    const adminElements = document.querySelectorAll('.admin-only');

    if (isViewer) {
        // Sembunyikan semua tombol/form khusus admin
        adminElements.forEach(el => el.style.display = 'none');
    } else {
        // Tampilkan kembali jika yang login adalah admin
        adminElements.forEach(el => el.style.display = '');
    }
}

// 1. Cek status sesi saat pertama kali halaman dimuat
async function cekSesiLogin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const loginScreen = document.getElementById('login-screen');

    if (session) {
        if (loginScreen) loginScreen.style.display = 'none';
        aturHakAkses(session); // <-- Atur tampilan berdasarkan role
        muatSemuaData();
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
    }
}

// 2. Handler Login dengan Otomatis Domain (@kas.com)
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    let inputUser = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    let emailFinal = inputUser;
    if (!inputUser.includes('@')) {
        emailFinal = `${inputUser}@kas.com`;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailFinal,
        password: password
    });

    if (error) {
        alert('Gagal login: Username atau password salah!');
    } else {
        document.getElementById('login-screen').style.display = 'none';
        aturHakAkses(data.session); // <-- Atur tampilan berdasarkan role setelah login
        muatSemuaData();
    }
});

// 3. Fungsi Logout Global
window.logout = async function() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert('Gagal logout: ' + error.message);
        } else {
            document.getElementById('login-screen').style.display = 'flex';
        }
    }
};

// 4. Dengarkan perubahan status autentikasi
supabaseClient.auth.onAuthStateChange((event, session) => {
    const loginScreen = document.getElementById('login-screen');
    if (event === 'SIGNED_OUT') {
        if (loginScreen) loginScreen.style.display = 'flex';
    } else if (event === 'SIGNED_IN' && session) {
        aturHakAkses(session);
    }
});

// Jalankan pengecekan sesi otomatis
cekSesiLogin();