// Pendeteksi otomatis nama variabel Supabase
function getSupabase() {
    if (typeof supabaseClient !== 'undefined') return supabaseClient;
    if (typeof supabase !== 'undefined') return supabase;
    console.error('Supabase belum dimuat. Cek file js/config.js kamu!');
    return null;
}

// Fungsi mengisi dropdown tahun
function inisialisasiFilterTahun() {
    const selectTahun = document.getElementById('filter-tahun-laporan');
    if (!selectTahun) return;

    const tahunSekarang = new Date().getFullYear();
    selectTahun.innerHTML = '';

    for (let tahun = 2024; tahun <= 2030; tahun++) {
        const option = document.createElement('option');
        option.value = tahun;
        option.textContent = tahun;
        if (tahun === tahunSekarang) {
            option.selected = true;
        }
        selectTahun.appendChild(option);
    }

    selectTahun.addEventListener('change', renderLaporanKas);
}

// Fungsi render matriks Laporan Kas
async function renderLaporanKas() {
    const tbody = document.getElementById('tabel-laporan-kas');
    if (!tbody) return;

    const db = getSupabase();
    if (!db) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:20px; color:#ef4444; font-weight:bold;">Error: Supabase Client belum siap!</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:20px; color:#64748b;">Memuat data karyawan...</td></tr>';

    const elTahun = document.getElementById('filter-tahun-laporan');
    const tahunDipilih = elTahun ? parseInt(elTahun.value) : new Date().getFullYear();

    try {
        // 1. Ambil data karyawan
        const { data: dataKaryawan, error: errKaryawan } = await db
            .from('Karyawan')
            .select('*')
            .order('nama', { ascending: true });

        if (errKaryawan) {
            tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px; color:#ef4444;">Gagal mengambil data karyawan: ${errKaryawan.message}</td></tr>`;
            return;
        }

        if (!dataKaryawan || dataKaryawan.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:20px;">Belum ada data karyawan.</td></tr>';
            return;
        }

        // 2. Ambil data transaksi dari tabel 'Transaksi'
        const { data: transaksiData, error: errTransaksi } = await db
            .from('Transaksi')
            .select('*');

        if (errTransaksi) {
            console.error("Gagal ambil tabel Transaksi:", errTransaksi);
        }

        const dataKas = transaksiData || [];

        // 3. Render tabel matriks
        const daftarBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        let fullHtml = '';

        dataKaryawan.forEach((karyawan, index) => {
            let rowHtml = `<tr>
                <td class="col-no">${index + 1}</td>
                <td class="col-nama">${karyawan.nama}</td>`;

            daftarBulan.forEach((bulan, idxBulan) => {
                const sudahBayar = dataKas.some(kas => {
                    const namaKaryawan = (karyawan.nama || '').toLowerCase().trim();
                    const bulanLower = bulan.toLowerCase();
                    const bulanSingkat = bulan.substring(0, 3).toLowerCase();

                    // Cek Karyawan (di ID, Nama, atau Teks Keterangan)
                    const matchKaryawan = 
                        (kas.karyawan_id && String(kas.karyawan_id) === String(karyawan.id)) ||
                        (kas.nama_karyawan && kas.nama_karyawan.toLowerCase().trim() === namaKaryawan) ||
                        (kas.keterangan && kas.keterangan.toLowerCase().includes(namaKaryawan));

                    // Cek Bulan (di Kolom Bulan atau Teks Keterangan)
                    let matchBulan = false;
                    if (kas.bulan) {
                        const bStr = String(kas.bulan).toLowerCase().trim();
                        matchBulan = bStr === bulanLower || bStr === bulanSingkat || parseInt(bStr) === (idxBulan + 1);
                    } else if (kas.keterangan) {
                        const ketLower = kas.keterangan.toLowerCase();
                        matchBulan = ketLower.includes(bulanLower) || ketLower.includes(bulanSingkat);
                    }

                    // Cek Tahun
                    let matchTahun = false;
                    let tglKas = kas.tanggal || kas.created_at;
                    if (kas.tahun) {
                        matchTahun = parseInt(kas.tahun) === tahunDipilih;
                    } else if (tglKas) {
                        matchTahun = new Date(tglKas).getFullYear() === tahunDipilih;
                    } else {
                        matchTahun = true;
                    }

                    return matchKaryawan && matchBulan && matchTahun;
                });

                if (sudahBayar) {
                    rowHtml += `<td><span class="status-badge paid"><i class="fa-solid fa-check"></i></span></td>`;
                } else {
                    rowHtml += `<td><span class="status-badge unpaid"><i class="fa-solid fa-xmark"></i></span></td>`;
                }
            });

            rowHtml += `</tr>`;
            fullHtml += rowHtml;
        });

        tbody.innerHTML = fullHtml;

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px; color:#ef4444;">Terjadi kesalahan: ${err.message}</td></tr>`;
    }
}

// Jalankan saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
    inisialisasiFilterTahun();
    renderLaporanKas();
});