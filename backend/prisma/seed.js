require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const diseases = [
  {
    name: "Black Sigatoka",
    description:
      "Penyakit jamur ganas yang menyerang daun, menurunkan kapasitas fotosintesis secara drastis, dan dapat memicu gagal panen jika tidak ditangani dengan cepat.",
    category: "Jamur",
    severity: "Berat",
    symptoms: [
      "Muncul garis-garis halus berwarna cokelat kehitaman (longitudinal) sejajar urat daun.",
      "Garis meluas membentuk bercak elips dengan pusat berwarna kelabu dan tepian gelap.",
      "Daun menguning dengan cepat di sekitar bercak, lalu mengering dan mati (efek terbakar).",
      "Tanaman kehilangan sebagian besar daunnya (gundul), menyebabkan buah matang sebelum waktunya dengan kualitas buruk.",
    ],
    prevention: [
      "Gunakan bibit dari varietas yang tahan atau toleran terhadap Sigatoka.",
      "Atur jarak tanam agar tidak terlalu rapat (menjaga sirkulasi udara dan mengurangi kelembaban).",
      "Buat sistem drainase yang baik agar air tidak menggenang di sekitar perakaran.",
      "Lakukan penyiangan gulma secara berkala untuk menekan kelembaban mikro di kebun.",
      "Aplikasi fungisida protektif/preventif secara berkala menjelang dan selama musim hujan.",
    ],
    treatment: [
      "Segera lakukan 'deleafing' (memotong dan membuang) bagian daun yang menunjukkan gejala awal agar spora tidak menyebar.",
      "Hancurkan atau kubur daun yang dipotong jauh dari area perkebunan, atau bakar jika diizinkan.",
      "Lakukan penyemprotan fungisida sistemik secara terarah pada daun-daun yang masih sehat untuk melindunginya.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Bract Mosaic Virus",
    description:
      "Penyakit akibat virus sistemik yang menyerang seluruh bagian tanaman. Selain merusak kelopak bunga (bract) dan daun, virus ini menimbulkan gejala pembusukan dan pola mosaik khas pada pelepah serta batang semu tanaman.",
    category: "Virus",
    severity: "Sedang",
    symptoms: [
      "Terdapat pola mosaik berupa garis-garis putus atau bercak berbentuk lensa/spindel berwarna cokelat kemerahan atau keunguan pada pelepah luar batang semu.",
      "Jika kulit luar batang semu dikelupas, jaringan internal pembuluh menunjukkan garis kemerahan yang sejajar dengan serat batang.",
      "Batang semu menjadi lebih rapuh, berdiameter lebih kecil (kerdil/stunting), dan terkadang mengalami keretakan membujur (splitting).",
      "Daun mengalami deformasi (keriput atau bergelombang) disertai pola mosaik kekuningan.",
      "Ukuran tandan mengecil dan buah yang dihasilkan berkerut atau tidak berkembang sempurna.",
    ],
    prevention: [
      "Wajib menggunakan bibit hasil kultur jaringan yang tersertifikasi bebas virus 100%.",
      "Sterilkan alat potong (pisau, parang, erek) menggunakan alkohol 70% atau cairan pemutih setiap kali berpindah dari satu pohon ke pohon lain untuk mencegah penularan mekanis lewat cairan batang.",
      "Kendalikan populasi serangga vektor pembawa virus (kutu daun seperti Aphis gossypii dan Pentalonia nigronervosa) menggunakan perangkap kuning atau insektisida.",
      "Lakukan sanitasi kebun secara berkala dan bersihkan gulma yang berpotensi menjadi inang sekunder virus.",
    ],
    treatment: [
      "Tidak ada obat kimia atau terapi yang dapat menyembuhkan tanaman atau batang yang sudah terinfeksi virus.",
      "Segera lakukan eradikasi total: bongkar dan musnahkan seluruh rumpun tanaman yang terinfeksi hingga ke bonggolan akarnya agar tidak menular lewat kontak akar.",
      "Opsi praktis: suntik batang semu yang sakit menggunakan herbisida sistemik (glyphosate) agar tanaman mati dan mengering di tempat guna menghentikan aktivitas makan serangga vektor pada cairan batang.",
      "Semprot area sekitar rumpun terinfeksi dengan insektisida untuk mematikan kutu daun yang sempat hinggap.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Healthy Leaf",
    description:
      "Kondisi daun pisang yang optimal, menunjukkan tanaman tumbuh di lingkungan yang sehat dengan nutrisi tercukupi.",
    category: "Sehat",
    severity: "Ringan",
    symptoms: [
      "Permukaan daun bersih, berwarna hijau segar, mengkilap, dan tidak ada bercak.",
      "Lembaran daun utuh, kokoh, berdiri tegak, dan tidak mengalami kelayuan.",
      "Sirkulasi dan pertumbuhan pelepah baru berjalan konisten dan normal.",
    ],
    prevention: [
      "Lakukan pemupukan seimbang sesuai fase (kombinasi pupuk organik, Urea/ZA, SP-36, dan KCl).",
      "Jaga ketersediaan air yang cukup, terutama pada musim kemarau, tanpa membuat tanah becek.",
      "Lakukan sanitasi rutin berupa pemangkasan daun tua yang sudah kering.",
    ],
    treatment: [
      "Tidak memerlukan tindakan kuratif.",
      "Lanjutkan perawatan berkala dan pemantauan rutin seminggu sekali untuk deteksi dini hama/penyakit.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Insect Pest",
    description:
      "Kerusakan mekanis dan fisiologis pada daun yang diakibatkan oleh aktivitas makan atau bertelur dari berbagai jenis hama serangga.",
    category: "Hama",
    severity: "Sedang",
    symptoms: [
      "Terdapat lubang-lubang bekas gigitan pada lembaran daun, atau pinggiran daun tampak compang-camping.",
      "Daun menggulung (akibat ulat penggulung daun) atau tampak mengering dengan bercak putih keperakan (akibat serangan thrips/kutu).",
      "Ditemukan koloni serangga, ulat, atau jelaga hitam di permukaan bawah daun.",
      "Jika menyerang pupus daun (daun muda yang belum membuka), daun akan rusak saat membuka.",
    ],
    prevention: [
      "Lakukan pemantauan populasi hama secara berkala seminggu dua kali.",
      "Pasang perangkap serangga (sticky trap) berwarna kuning di beberapa titik kebun.",
      "Tanam tumbuhan berbunga di sekitar kebun (refugia) untuk mengundang predator alami hama.",
      "Bersihkan gulma yang sering menjadi tempat persembunyian atau inang alternatif serangga.",
    ],
    treatment: [
      "Kumpulkan dan musnahkan sarang ulat atau gulungan daun secara manual jika populasinya masih sedikit.",
      "Gunakan musuh alami/kontrol biologis seperti jamur Beauveria bassiana.",
      "Jika serangan sudah di atas ambang ekonomi, semprot dengan insektisida organik (ekstrak mimba) atau insektisida kimia sesuai dosis anjuran.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Moko Disease",
    description:
      "Penyakit layu bakteri yang sangat menular. Bakteri menyerang sistem pembuluh matang dan dapat menghancurkan seluruh kebun dalam waktu singkat.",
    category: "Bakteri",
    severity: "Berat",
    symptoms: [
      "Daun-daun muda (bagian tengah) menguning dan terkulai lemas secara mendadak tanpa diawali bercak.",
      "Pelepah daun patah di dekat batang (pseudostem) sehingga menggantung mengelilingi batang.",
      "Jika batang dipotong, pembuluh bagian dalam berwarna cokelat hingga hitam dan mengeluarkan lendir bakteri berbau busuk.",
      "Buah pisang membusuk dari dalam, kulit buah menghitam, dan daging buah menjadi kering/berlendir cokelat.",
    ],
    prevention: [
      "Gunakan bibit yang bersertifikat bebas penyakit Moko.",
      "Alat pertanian wajib disinfeksi dengan merendamnya dalam larutan alkohol 70% atau pemutih setiap selesai memotong satu pohon.",
      "Potong jantung pisang sesaat setelah sisir buah terakhir terbentuk untuk mencegah penularan oleh serangga penyerbuk.",
      "Terapkan karantina ketat; jangan memindahkan tanah atau tanaman dari area yang diduga terinfeksi.",
    ],
    treatment: [
      "Tidak ada obat untuk tanaman yang sudah terinfeksi bakteri ini.",
      "Suntik tanaman yang sakit dengan herbisida (glyphosate) agar mati dan mengering di tempat, guna mencegah penyebaran bakteri lewat air tanah.",
      "Bongkar tanaman beserta seluruh rumpunnya, lalu bakar.",
      "Beri kapur pertanian (dolomit) pada lubang bekas tanaman dan biarkan merandai (kosong) selama minimal 1-2 tahun sebelum ditanami kembali.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Panama Disease",
    description:
      "Penyakit layu vaskular mematikan yang disebabkan oleh jamur tanah Fusarium. Jamur ini dapat bertahan di dalam tanah selama puluhan tahun.",
    category: "Jamur",
    severity: "Berat",
    symptoms: [
      "Daun tua (bagian paling bawah) menguning terlebih dahulu mulai dari pinggiran daun.",
      "Daun layu, patah pada tangkainya, dan menggantung layu membentuk 'rok' di sekeliling batang bawah.",
      "Terjadi belahan membujur (pecah batang) pada bagian bawah batang semu.",
      "Jika batang dibongkar, jaringan pembuluh vaskularnya berubah warna menjadi garis-garis merah tua atau cokelat.",
    ],
    prevention: [
      "Gunakan varietas pisang yang tahan terhadap Fusarium (misal: Pisang Janten atau beberapa klon Cavendish yang resisten).",
      "Gunakan agens hayati seperti jamur Trichoderma harzianum yang dicampur pada lubang tanam saat penanaman awal.",
      "Hindari mengambil bibit atau tanah dari daerah endemik penyakit Panama.",
      "Perbaiki pH tanah dengan pemberian kapur pertanian jika tanah terlalu asam (jamur Fusarium menyukai tanah asam).",
    ],
    treatment: [
      "Tanaman yang sudah terinfeksi sama sekali tidak bisa diobati.",
      "Isolasi tanaman yang sakit dengan membuat parit pembatas di sekeliling rumpun agar air run-off tidak menyebarkan spora ke tanaman lain.",
      "Eradikasi (bongkar dan bakar) tanaman mati di tempat infeksi. Jangan memindahkan bagian tanaman ini keluar dari area kebun.",
      "Jangan menanami kembali area bekas infeksi dengan varietas pisang yang rentan.",
    ],
    imageUrl: null,
    isActive: true,
  },
  {
    name: "Yellow Sigatoka",
    description:
      "Versi ringan dari Sigatoka, namun tetap merugikan karena mengurangi efisiensi pengisian buah akibat rusaknya area hijau daun.",
    category: "Jamur",
    severity: "Sedang",
    symptoms: [
      "Muncul bintik-bintik kecil berwarna hijau pucat atau kekuningan pada daun nomor 3 atau 4 dari pucuk.",
      "Bintik memanjang menjadi bercak bergaris warna cokelat muda dengan pusat mengering berwarna abu-abu terang.",
      "Bercak menyatu membentuk area mati yang luas, menyebabkan daun kering sebelum waktunya.",
      "Ukuran tandan menyusut dan buah matang sebelum ukurannya maksimal.",
    ],
    prevention: [
      "Lakukan penjarangan anakan (hanya sisakan 2-3 pohon per rumpun) untuk menjaga kelembaban mikro kebun.",
      "Gunakan sistem pengairan bawah (under-canopy) ketimbang sprinkler atas guna mencegah daun basah terlalu lama.",
      "Lakukan pemangkasan daun tua secara teratur.",
      "Berikan pupuk Kalium (K) yang cukup untuk memperkuat dinding sel daun tanaman.",
    ],
    treatment: [
      "Pangkas bagian daun yang berbercak (spot-chopping) jika serangannya masih sedikit, lalu musnahkan.",
      "Lakukan penyemprotan fungisida kontak (seperti bahan aktif Mankozeb) atau sistemik (seperti golongan Triazol) sesuai dengan petunjuk ambang batas serangan.",
      "Pastikan sirkulasi udara di sekitar tajuk tanaman diperbaiki dengan menebas semak di bawahnya.",
    ],
    imageUrl: null,
    isActive: true,
  },
];

async function main() {
  console.log("Starting disease seeding...");

  try {
    // Delete existing diseases
    await prisma.disease.deleteMany({});
    console.log("Cleared existing diseases");

    // Create new diseases
    for (const disease of diseases) {
      await prisma.disease.create({
        data: disease,
      });
      console.log(`Created disease: ${disease.name}`);
    }

    // Seed default admin
    console.log("Starting admin seeding...");
    await prisma.admin.deleteMany({});
    
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await prisma.admin.create({
      data: {
        email: "admin@bananavision.com",
        password: hashedPassword,
        name: "Super Admin",
        role: "admin"
      }
    });
    console.log("Default admin created: admin@bananavision.com / admin123");

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
