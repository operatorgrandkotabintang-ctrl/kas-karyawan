let chartKasInstance = null; // Menyimpan instance chart agar bisa di-update ulang

function renderDashboard() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    // Menampung total pemasukan & pengeluaran 12 bulan (Jan - Des)
    const masukPerBulan = Array(12).fill(0);
    const keluarPerBulan = Array(12).fill(0);

    const tahunIni = new Date().getFullYear();
    const listTransaksi = typeof dataTransaksi !== 'undefined' ? dataTransaksi : [];
    const listKaryawan = typeof dataKaryawan !== 'undefined' ? dataKaryawan : [];

    listTransaksi.forEach(item => {
        const jumlah = Number(item.jumlah) || 0;
        const tDate = new Date(item.tanggal || item.created_at);
        const tBulan = tDate.getMonth(); // 0 = Jan, 11 = Des
        const tTahun = tDate.getFullYear();

        if (item.jenis === 'pemasukan') {
            totalMasuk += jumlah;
            if (tTahun === tahunIni && !isNaN(tBulan)) {
                masukPerBulan[tBulan] += jumlah;
            }
        } else if (item.jenis === 'pengeluaran') {
            totalKeluar += jumlah;
            if (tTahun === tahunIni && !isNaN(tBulan)) {
                keluarPerBulan[tBulan] += jumlah;
            }
        }
    });

    // 1. Update Kartu Ringkasan Statistik
    const statKaryawan = document.getElementById('stat-karyawan');
    const statMasuk = document.getElementById('stat-masuk');
    const statKeluar = document.getElementById('stat-keluar');
    const statSaldo = document.getElementById('stat-saldo');

    if (statKaryawan) statKaryawan.innerText = `${listKaryawan.length} Orang`;
    if (statMasuk) statMasuk.innerText = formatRupiah(totalMasuk);
    if (statKeluar) statKeluar.innerText = formatRupiah(totalKeluar);
    if (statSaldo) statSaldo.innerText = formatRupiah(totalMasuk - totalKeluar);

    // 2. RENDER TABEL KARYAWAN BELUM BAYAR BULAN INI
    renderBelumBayar();

    // 3. Tabel Transaksi Terakhir di Dashboard (Sebelah Kanan Bawah)
    const tbodyTransaksi = document.getElementById('tabel-dash-transaksi');
    if (tbodyTransaksi) {
        tbodyTransaksi.innerHTML = listTransaksi.length > 0
            ? listTransaksi.slice(0, 5).map(t => `
                <tr>
                    <td>${t.keterangan || (t.nama_karyawan ? `Kas ${t.bulan || ''} - ${t.nama_karyawan}` : 'Kas Masuk')}</td>
                    <td><b style="color:${t.jenis === 'pemasukan' ? '#10b981' : '#ef4444'}">${t.jenis}</b></td>
                    <td>${formatRupiah(t.jumlah)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" style="text-align:center;">Belum ada data</td></tr>';
    }

    // 4. PEMANGGILAN PROGRES BAYAR BULAN INI
    const kasMasukData = listTransaksi.filter(t => t.jenis === 'pemasukan');
    hitungProgresBayarBulanIni(listKaryawan, kasMasukData);

    // 5. Render Grafik Batang (Chart.js)
    renderChartKas(masukPerBulan, keluarPerBulan, tahunIni);
}

// Fungsi Khusus Menggambar Grafik
function renderChartKas(masukPerBulan, keluarPerBulan, tahun) {
    const ctx = document.getElementById('chartKas');
    if (!ctx) return;

    if (chartKasInstance) {
        chartKasInstance.destroy();
    }

    const labelsBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    chartKasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsBulan,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: masukPerBulan,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Pengeluaran',
                    data: keluarPerBulan,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: `Statistik Kas Masuk & Keluar (${tahun})`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + ' Jt';
                            if (value >= 1000) return (value / 1000) + ' Rb';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// Fungsi Menghitung Persentase Bayar Bulan Ini
function hitungProgresBayarBulanIni(dataKaryawan, dataKasMasuk) {
    const elProgres = document.getElementById('stat-progres-bayar');
    const elDetail = document.getElementById('stat-progres-detail');
    if (!elProgres || !elDetail) return;

    if (!dataKaryawan || dataKaryawan.length === 0) {
        elProgres.innerText = '0%';
        elDetail.innerText = '(0/0 Karyawan)';
        return;
    }

    const daftarBulan = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const sekarang = new Date();
    const bulanIni = daftarBulan[sekarang.getMonth()];
    const tahunIni = sekarang.getFullYear();

    const totalKaryawan = dataKaryawan.length;
    let jumlahSudahBayar = 0;

    dataKaryawan.forEach(karyawan => {
        const namaClean = (karyawan.nama || karyawan.nama_karyawan || '').trim().toLowerCase();
        if (!namaClean) return;

        const sudahBayar = (dataKasMasuk || []).some(kas => {
            const kasKet = (kas.keterangan || '').toLowerCase();
            const kasNama = (kas.nama_karyawan || '').toLowerCase();
            const kasBulan = (kas.bulan || '').toLowerCase();

            // Match Karyawan
            const matchKaryawan = (kas.karyawan_id && String(kas.karyawan_id) === String(karyawan.id)) ||
                                  (kasNama && kasNama.includes(namaClean)) ||
                                  (kasKet && kasKet.includes(namaClean));

            // Match Bulan
            let matchBulan = false;
            if (kasBulan) {
                matchBulan = kasBulan.includes(bulanIni);
            } else if (kasKet) {
                matchBulan = kasKet.includes(bulanIni);
            } else if (kas.tanggal || kas.created_at) {
                const d = new Date(kas.tanggal || kas.created_at);
                matchBulan = !isNaN(d) && (daftarBulan[d.getMonth()] === bulanIni);
            } else {
                matchBulan = true;
            }

            // Match Tahun
            let matchTahun = true;
            if (kas.tanggal || kas.created_at) {
                matchTahun = (new Date(kas.tanggal || kas.created_at).getFullYear() === tahunIni);
            }

            return matchKaryawan && matchBulan && matchTahun;
        });

        if (sudahBayar) jumlahSudahBayar++;
    });

    const persentase = totalKaryawan > 0 ? Math.round((jumlahSudahBayar / totalKaryawan) * 100) : 0;
    const bulanCapital = bulanIni.charAt(0).toUpperCase() + bulanIni.slice(1);

    elProgres.innerText = `${persentase}%`;
    elDetail.innerText = `(${jumlahSudahBayar}/${totalKaryawan} Karyawan Lunas ${bulanCapital})`;
}

// Fungsi Khusus Menampilkan Karyawan Belum Bayar
function renderBelumBayar() {
    const tbody = document.getElementById('tabel-dash-belum-bayar');
    if (!tbody) return;

    const listKaryawan = typeof dataKaryawan !== 'undefined' ? dataKaryawan : [];
    const listTransaksi = typeof dataTransaksi !== 'undefined' ? dataTransaksi : [];

    if (listKaryawan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:15px;">Belum ada data karyawan</td></tr>';
        return;
    }

    const daftarBulan = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const bulanIni = daftarBulan[new Date().getMonth()];
    const tahunIni = new Date().getFullYear();
    const kasMasukData = listTransaksi.filter(t => t.jenis === 'pemasukan');

    // Filter daftar karyawan yang belum melakukan pembayaran bulan ini
    const listBelumBayar = listKaryawan.filter(karyawan => {
        const namaClean = (karyawan.nama || karyawan.nama_karyawan || '').trim().toLowerCase();
        if (!namaClean) return false;

        const sudahBayar = kasMasukData.some(kas => {
            const kasKet = (kas.keterangan || '').toLowerCase();
            const kasNama = (kas.nama_karyawan || '').toLowerCase();
            const kasBulan = (kas.bulan || '').toLowerCase();

            // Match Karyawan
            const matchKaryawan = (kas.karyawan_id && String(kas.karyawan_id) === String(karyawan.id)) ||
                                  (kasNama && kasNama.includes(namaClean)) ||
                                  (kasKet && kasKet.includes(namaClean));

            // Match Bulan
            let matchBulan = false;
            if (kasBulan) {
                matchBulan = kasBulan.includes(bulanIni);
            } else if (kasKet) {
                matchBulan = kasKet.includes(bulanIni);
            } else if (kas.tanggal || kas.created_at) {
                const d = new Date(kas.tanggal || kas.created_at);
                matchBulan = !isNaN(d) && (daftarBulan[d.getMonth()] === bulanIni);
            } else {
                matchBulan = true;
            }

            // Match Tahun
            let matchTahun = true;
            if (kas.tanggal || kas.created_at) {
                matchTahun = (new Date(kas.tanggal || kas.created_at).getFullYear() === tahunIni);
            }

            return matchKaryawan && matchBulan && matchTahun;
        });

        return !sudahBayar;
    });

    // Tampilkan data ke tabel HTML
    if (listBelumBayar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#10b981; font-weight:bold; padding:15px;">Semua karyawan sudah lunas bulan ini! 🎉</td></tr>';
    } else {
        tbody.innerHTML = listBelumBayar.map((k, index) => `
            <tr>
                <td style="width: 40px; text-align: center;">${index + 1}</td>
                <td><b>${k.nama || k.nama_karyawan}</b></td>
                <td><span style="background:#fee2e2; color:#ef4444; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Belum Bayar</span></td>
            </tr>
        `).join('');
    }
}