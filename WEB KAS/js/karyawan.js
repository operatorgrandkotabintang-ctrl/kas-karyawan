// 1. Render Tabel Data Karyawan
function renderKaryawan() {
    const tbody = document.getElementById('tabel-karyawan');
    if (!tbody) return;

    if (!dataKaryawan || dataKaryawan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada data karyawan</td></tr>';
        return;
    }

    tbody.innerHTML = dataKaryawan.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><b>${item.nama}</b></td>
            <td>
                <!-- Tambahkan class "admin-only" pada tombol Edit & Hapus -->
                <button class="btn-sm-warning admin-only" style="background:#f59e0b; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editKaryawan(${item.id})">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn-sm-danger admin-only" onclick="hapusKaryawan(${item.id})">Hapus</button>
            </td>
        </tr>
    `).join('');

    // Jalankan pengecekan hak akses setelah elemen tabel dibuat secara dinamis
    if (typeof aturHakAkses === 'function') {
        aturHakAkses();
    }
}

// 2. Form Tambah Karyawan Baru
document.getElementById('form-karyawan')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const namaInput = document.getElementById('karyawan-nama');
    const nama = namaInput.value.trim();

    if (!nama) return;

    const { error } = await supabaseClient
        .from('Karyawan')
        .insert([{ nama }]);

    if (error) {
        alert('Gagal menambah karyawan: ' + error.message);
    } else {
        namaInput.value = '';
        muatSemuaData();
    }
});

// 3. Buka Modal Edit Karyawan
window.editKaryawan = function(id) {
    const target = dataKaryawan.find(k => k.id === id);
    if (!target) {
        alert('Data karyawan tidak ditemukan!');
        return;
    }

    document.getElementById('edit-karyawan-id').value = target.id;
    document.getElementById('edit-karyawan-nama').value = target.nama;
    bukaModal('modal-edit-karyawan');
};

// 4. Eksekusi Simpan Perubahan Karyawan (Global Function)
window.simpanEditKaryawan = async function() {
    const idInput = document.getElementById('edit-karyawan-id').value;
    const namaInput = document.getElementById('edit-karyawan-nama').value.trim();
    const id = parseInt(idInput);

    if (!namaInput) {
        alert('Nama karyawan tidak boleh kosong!');
        return;
    }

    if (!id || isNaN(id)) {
        alert('ID Karyawan tidak valid!');
        return;
    }

    const { error } = await supabaseClient
        .from('Karyawan')
        .update({ nama: namaInput })
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate karyawan: ' + error.message);
    } else {
        tutupModal('modal-edit-karyawan');
        await muatSemuaData();
    }
};

// 5. Hapus Karyawan
window.hapusKaryawan = async function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
        const { error } = await supabaseClient
            .from('Karyawan')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Gagal menghapus karyawan: ' + error.message);
        } else {
            muatSemuaData();
        }
    }
};