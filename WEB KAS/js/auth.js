// 1. Cek status sesi saat pertama kali halaman dimuat
async function cekSesiLogin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const loginScreen = document.getElementById('login-screen');

    if (session) {
        if (loginScreen) loginScreen.style.display = 'none';
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

    // Jika pengguna hanya mengetik username (misal: heru), otomatis tambahkan @kas.com
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
    }
});

// Jalankan pengecekan sesi otomatis
cekSesiLogin();