// Set input bulan default ke Bulan dan Tahun Saat Ini (YYYY-MM)
function setBulanDefault() {
    const inputBulan = document.getElementById('filter-bulan-tahun');
    if (inputBulan && !inputBulan.value) {
        const hariIni = new Date();
        const tahun = hariIni.getFullYear();
        const bulan = String(hariIni.getMonth() + 1).padStart(2, '0');
        inputBulan.value = `${tahun}-${bulan}`;
    }
}

function renderLaporanTransaksi() {
    setBulanDefault();

    const inputBulan = document.getElementById('filter-bulan-tahun');
    if (!inputBulan) return;

    const bulanTahunDipilih = inputBulan.value; // Format: "YYYY-MM"
    if (!bulanTahunDipilih) return;

    // Filter data transaksi berdasarkan bulan dan tahun terpilih
    const transaksiBulanIni = dataTransaksi.filter(t => {
        if (!t.created_at) return false;
        const tDate = new Date(t.created_at);
        const tTahun = tDate.getFullYear();
        const tBulan = String(tDate.getMonth() + 1).padStart(2, '0');
        return `${tTahun}-${tBulan}` === bulanTahunDipilih;
    });

    // Pisahkan Pemasukan & Pengeluaran
    const listPemasukan = transaksiBulanIni.filter(t => t.jenis === 'pemasukan');
    const listPengeluaran = transaksiBulanIni.filter(t => t.jenis === 'pengeluaran');

    // Hitung Total Pemasukan & Pengeluaran Bulan Terpilih
    const totalMasuk = listPemasukan.reduce((acc, curr) => acc + Number(curr.jumlah), 0);
    const totalKeluar = listPengeluaran.reduce((acc, curr) => acc + Number(curr.jumlah), 0);

    // Update Kartu Ringkasan Statistik
    const elMasuk = document.getElementById('lap-trans-masuk');
    const elKeluar = document.getElementById('lap-trans-keluar');
    const elSaldo = document.getElementById('lap-trans-saldo');

    if (elMasuk) elMasuk.innerText = formatRupiah(totalMasuk);
    if (elKeluar) elKeluar.innerText = formatRupiah(totalKeluar);
    if (elSaldo) elSaldo.innerText = formatRupiah(totalMasuk - totalKeluar);

    // Render Tabel Pemasukan
    const tbodyMasuk = document.getElementById('tabel-lap-pemasukan');
    if (tbodyMasuk) {
        tbodyMasuk.innerHTML = listPemasukan.length > 0
            ? listPemasukan.map(t => `
                <tr>
                    <td>${formatTanggal(t.created_at)}</td>
                    <td>${t.keterangan}</td>
                    <td style="color:#10b981; font-weight:bold;">${formatRupiah(t.jumlah)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" style="text-align:center; color:#888;">Tidak ada pemasukan di bulan ini</td></tr>';
    }

    // Render Tabel Pengeluaran
    const tbodyKeluar = document.getElementById('tabel-lap-pengeluaran');
    if (tbodyKeluar) {
        tbodyKeluar.innerHTML = listPengeluaran.length > 0
            ? listPengeluaran.map(t => `
                <tr>
                    <td>${formatTanggal(t.created_at)}</td>
                    <td>${t.keterangan}</td>
                    <td style="color:#ef4444; font-weight:bold;">${formatRupiah(t.jumlah)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" style="text-align:center; color:#888;">Tidak ada pengeluaran di bulan ini</td></tr>';
    }
}

// Fitur Export Excel Laporan Transaksi Bulanan
window.exportLaporanTransaksiExcel = function() {
    const inputBulan = document.getElementById('filter-bulan-tahun');
    const bulanTahun = inputBulan ? inputBulan.value : 'Bulanan';

    const tblPemasukan = document.getElementById('tabel-lap-pemasukan')?.closest('table');
    const tblPengeluaran = document.getElementById('tabel-lap-pengeluaran')?.closest('table');

    const wb = XLSX.utils.book_new();

    if (tblPemasukan) {
        const wsMasuk = XLSX.utils.table_to_sheet(tblPemasukan);
        XLSX.utils.book_append_sheet(wb, wsMasuk, "Kas Masuk");
    }

    if (tblPengeluaran) {
        const wsKeluar = XLSX.utils.table_to_sheet(tblPengeluaran);
        XLSX.utils.book_append_sheet(wb, wsKeluar, "Kas Keluar");
    }

    XLSX.writeFile(wb, `Laporan_Transaksi_${bulanTahun}.xlsx`);
};