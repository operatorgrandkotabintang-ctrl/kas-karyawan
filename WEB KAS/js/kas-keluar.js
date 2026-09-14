// 1. Render Tabel Kas Keluar
function renderKasKeluar() {
    const list = dataTransaksi.filter(t => t.jenis === 'pengeluaran');
    const tbody = document.getElementById('tabel-kas-keluar');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data kas keluar</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr>
        <td>${formatTanggal(item.created_at)}</td>
        <td>${item.keterangan}</td>
        <td style="color:#ef4444; font-weight:bold;">${formatRupiah(item.jumlah)}</td>
        <td>
            <button style="background:#f59e0b; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editTransaksi(${item.id})">
                <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn-sm-danger" onclick="hapusTransaksi(${item.id})">Hapus</button>
        </td>
    </tr>
`).join('');
}

// 2. Form Tambah Kas Keluar
document.getElementById('form-kas-keluar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const keteranganInput = document.getElementById('keluar-keterangan');
    const jumlahInput = document.getElementById('keluar-jumlah');

    const keterangan = keteranganInput.value;
    const jumlah = parseInt(jumlahInput.value);

    const { error } = await supabaseClient
        .from('Transaksi')
        .insert([{ keterangan, jumlah, jenis: 'pengeluaran' }]);

    if (error) {
        alert('Gagal menambah kas keluar: ' + error.message);
    } else {
        e.target.reset();
        muatSemuaData();
    }
});