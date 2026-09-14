const supabaseUrl = 'https://iuxvtpuayharbcjjpgqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eHZ0cHVheWhhcmJjampwZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDkwMTcsImV4cCI6MjEwNDc4NTAxN30.tuzRvXSoy5W6AO9fD32YD9TKl5LRYp0U2s8P7wnrSF8';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let dataTransaksi = [];
let dataKaryawan = [];

const formatRupiah = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
const formatTanggal = (isoString) => new Date(isoString).toLocaleDateString("id-ID");

function gantiTab(namaTab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${namaTab}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function muatSemuaData() {
    const { data: transaksi } = await supabaseClient.from('Transaksi').select('*').order('created_at', { ascending: false });
    dataTransaksi = transaksi || [];

    const { data: karyawan } = await supabaseClient.from('Karyawan').select('*').order('created_at', { ascending: false });
    dataKaryawan = karyawan || [];

    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderKasMasuk === 'function') renderKasMasuk();
    if (typeof renderKasKeluar === 'function') renderKasKeluar();
    if (typeof renderKaryawan === 'function') renderKaryawan();
    if (typeof renderLaporanKas === 'function') renderLaporanKas();
    if (typeof renderLaporanTransaksi === 'function') renderLaporanTransaksi(); // <--- Tambahkan ini
}
window.bukaModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
};

window.tutupModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};
// 1. FUNGSI EXPORT DATA KE EXCEL (CSV)
window.exportKeExcel = function() {
    if (!dataTransaksi || dataTransaksi.length === 0) {
        alert("Tidak ada data transaksi untuk diexport!");
        return;
    }

    // Header Kolom CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal,Jenis Transaksi,Keterangan,Nominal (Rp)\n";

    // Urutkan & Susun Data
    dataTransaksi.forEach((item, index) => {
        const tanggal = formatTanggal(item.created_at);
        const jenis = item.jenis === 'pemasukan' ? 'Kas Masuk' : 'Kas Keluar';
        
        // Membersihkan karakter koma agar tidak merusak format CSV
        const keterangan = `"${(item.keterangan || '').replace(/"/g, '""')}"`;
        const jumlah = item.jumlah;

        csvContent += `${index + 1},${tanggal},${jenis},${keterangan},${jumlah}\n`;
    });

    // Buat tautan download otomatis
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Nama file sesuai tanggal hari ini
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Laporan_Kas_${today}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// 2. FUNGSI CETAK LAPORAN / SIMPAN PDF
window.cetakLaporanPDF = function() {
    if (!dataTransaksi || dataTransaksi.length === 0) {
        alert("Tidak ada data transaksi untuk dicetak!");
        return;
    }

    // Hitung Total Pemasukan & Pengeluaran
    const totalMasuk = dataTransaksi
        .filter(t => t.jenis === 'pemasukan')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    const totalKeluar = dataTransaksi
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    const saldoBersih = totalMasuk - totalKeluar;

    // Buat jendela cetak baru (Print Window)
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Keuangan Kas</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2 { text-align: center; margin-bottom: 5px; }
                p.sub { text-align: center; color: #666; margin-top: 0; font-size: 14px; }
                .summary { display: flex; justify-content: space-between; margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .summary div { font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
                th { background-color: #f1f5f9; }
                .masuk { color: #16a34a; font-weight: bold; }
                .keluar { color: #dc2626; font-weight: bold; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h2>LAPORAN REKAPITULASI KAS</h2>
            <p class="sub">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>

            <div class="summary">
                <div><b>Total Kas Masuk:</b> <span class="masuk">${formatRupiah(totalMasuk)}</span></div>
                <div><b>Total Kas Keluar:</b> <span class="keluar">${formatRupiah(totalKeluar)}</span></div>
                <div><b>Saldo Akhir:</b> <b>${formatRupiah(saldoBersih)}</b></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Keterangan</th>
                        <th>Nominal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    dataTransaksi.forEach((item, index) => {
        const isMasuk = item.jenis === 'pemasukan';
        htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${formatTanggal(item.created_at)}</td>
                <td>${isMasuk ? 'Kas Masuk' : 'Kas Keluar'}</td>
                <td>${item.keterangan}</td>
                <td class="${isMasuk ? 'masuk' : 'keluar'}">${formatRupiah(item.jumlah)}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Tampilkan dialog cetak setelah halaman selesai dimuat
    printWindow.onload = function() {
        printWindow.print();
    };
};