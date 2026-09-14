const daftarBulanNama = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// 1. Render Tabel Kas Masuk & Populate Dropdown Karyawan
function renderKasMasuk() {
    populateDropdownKaryawan();
    setDefaultBulanIni();

    const list = dataTransaksi.filter(t => t.jenis === 'pemasukan');
    const tbody = document.getElementById('tabel-kas-masuk');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data kas masuk</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr>
            <td>${formatTanggal(item.created_at)}</td>
            <td>${item.keterangan}</td>
            <td style="color:#10b981; font-weight:bold;">${formatRupiah(item.jumlah)}</td>
            <td>
                <button style="background:#f59e0b; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editTransaksi(${item.id})">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn-sm-danger" onclick="hapusTransaksi(${item.id})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Populate Opsi Karyawan secara Dinamis dari Supabase
function populateDropdownKaryawan() {
    const select = document.getElementById('masuk-karyawan');
    if (!select) return;

    const nilaiSekarang = select.value;

    if (!dataKaryawan || dataKaryawan.length === 0) {
        select.innerHTML = '<option value="">-- Belum ada data karyawan --</option>';
        return;
    }

    select.innerHTML = '<option value="">-- Pilih Karyawan --</option>' + 
        dataKaryawan.map(k => `<option value="${k.nama}">${k.nama}</option>`).join('');

    if (nilaiSekarang) select.value = nilaiSekarang;
}

// Otomatis memilih bulan saat ini di dropdown
function setDefaultBulanIni() {
    const selectBulan = document.getElementById('masuk-bulan');
    if (selectBulan && !selectBulan.dataset.touched) {
        const bulanIniIndex = new Date().getMonth();
        selectBulan.value = daftarBulanNama[bulanIniIndex];
    }
}

// Tandai jika pengguna memilih bulan manual
document.getElementById('masuk-bulan')?.addEventListener('change', function() {
    this.dataset.touched = "true";
});

// 2. Form Submit Kas Masuk
document.getElementById('form-kas-masuk')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const namaKaryawan = document.getElementById('masuk-karyawan').value;
    const bulan = document.getElementById('masuk-bulan').value;
    const jumlah = parseInt(document.getElementById('masuk-jumlah').value);
    const catatan = document.getElementById('masuk-catatan').value.trim();

    if (!namaKaryawan) {
        alert('Silakan pilih karyawan terlebih dahulu!');
        return;
    }

    let keterangan = `Kas ${bulan} - ${namaKaryawan}`;
    if (catatan) {
        keterangan += ` (${catatan})`;
    }

    const { error } = await supabaseClient
        .from('Transaksi')
        .insert([{ keterangan, jumlah, jenis: 'pemasukan' }]);

    if (error) {
        alert('Gagal menambah kas masuk: ' + error.message);
    } else {
        document.getElementById('masuk-catatan').value = '';
        muatSemuaData();
    }
});

// 3. Fungsi Hapus Transaksi (Global Window)
window.hapusTransaksi = async function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data kas ini?')) {
        const { error } = await supabaseClient
            .from('Transaksi')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Gagal menghapus data: ' + error.message);
        } else {
            muatSemuaData();
        }
    }
};

// 4. Buka Modal Edit Transaksi
window.editTransaksi = function(id) {
    const target = dataTransaksi.find(t => t.id === id);
    if (!target) return;

    // Set nilai input modal sesuai data terpilih
    document.getElementById('edit-transaksi-id').value = target.id;
    document.getElementById('edit-transaksi-keterangan').value = target.keterangan;
    document.getElementById('edit-transaksi-jumlah').value = target.jumlah;

    // Tampilkan modal
    bukaModal('modal-edit-transaksi');
};

// 5. Submit Update Transaksi ke Supabase
document.getElementById('form-edit-transaksi')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-transaksi-id').value);
    const keterangan = document.getElementById('edit-transaksi-keterangan').value;
    const jumlah = parseInt(document.getElementById('edit-transaksi-jumlah').value);

    if (isNaN(id)) {
        alert('ID Transaksi tidak valid!');
        return;
    }

    const { error } = await supabaseClient
        .from('Transaksi')
        .update({ keterangan, jumlah })
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate transaksi: ' + error.message);
    } else {
        tutupModal('modal-edit-transaksi');
        muatSemuaData();
    }
});