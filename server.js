const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Koneksi ke MongoDB
mongoose.connect('mongodb+srv://ikpmsidoarjo:ikpm1234@cluster0.x70sc.mongodb.net/ikpmsidoarjo?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Contoh skema dan model Mongoose untuk Item
const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
});

const Item = mongoose.model('Item', ItemSchema);

const AlumniSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    stambuk: { type: String, required: true },
    tahun: { type: String, required: true },
    kampus_asal: { type: String, required: true },
    alamat: { type: String, required: true },
    no_telepon: { type: String, required: true },
    pasangan: { type: String, required: false },
    pekerjaan: { type: String, required: true },
    nama_laqob: { type: String, required: false },
    ttl: { type: String, required: true },
    kecamatan: { type: String, required: true },
    instansi: { type: String, required: false },
    password: { type: String, required: true },
    role_id: { type: Number, required: true },
    hidden_fields: { type: [String], default: [] }, // Menyimpan field yang disembunyikan
});

const Alumni = mongoose.model('Alumni', AlumniSchema);

app.get('/alumni', async (req, res) => {
    try {
        // Ambil data dari database
        const alumni = await Alumni.find({}, 'tahun stambuk nama kampus_asal kecamatan alamat no_telepon pasangan nama_laqob pekerjaan ttl instansi');

        // Format data dengan nomor urut
        const formattedData = alumni.map((alum, index) => ({
            no: index + 1,
            tahun: alum.tahun,
            stambuk: alum.stambuk,
            nama_alumni: alum.nama,
            kampus_asal: alum.kampus_asal,
            kecamatan: alum.kecamatan,
            alamat: alum.alamat,
            no_telepon: alum.no_telepon,
            pasangan: alum.pasangan,
            nama_laqob: alum.nama_laqob,
            ttl: alum.ttl,
            instansi: alum.instansi,
        }));

        // Kirim respons JSON
        res.status(200).json(formattedData);
    } catch (error) {
        console.error('Error fetching alumni data:', error);
        res.status(500).json({ message: 'Failed to fetch alumni data' });
    }
});

app.post('/alumni', async (req, res) => {
    try {
        const newAlumni = new Alumni(req.body);
        await newAlumni.save();
        res.status(201).json({ message: 'Alumni berhasil ditambahkan!' });
    } catch (error) {
        console.error('Error creating new alumni:', error);
        res.status(500).json({ message: 'Failed to add alumni' });
    }
});

app.get('/alumni/:stambuk', async (req, res) => {
    try {
        const { stambuk } = req.params;

        // Cari data alumni berdasarkan stambuk
        const alumni = await Alumni.findOne({ stambuk }, 'tahun stambuk nama kampus_asal kecamatan alamat no_telepon pasangan nama_laqob pekerjaan ttl instansi hidden_fields');

        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        // Format respons detail alumni
        const detailAlumni = {
            nama: alumni.nama,
            tahun: alumni.tahun,
            stambuk: alumni.stambuk,
            nama_alumni: alumni.nama,
            kampus_asal: alumni.kampus_asal,
            kecamatan: alumni.kecamatan,
            alamat: alumni.alamat,
            no_telepon: alumni.no_telepon,
            pasangan: alumni.pasangan,
            nama_laqob: alumni.nama_laqob,
            pekerjaan: alumni.pekerjaan,
            ttl: alumni.ttl,
            instansi: alumni.instansi,
            hidden_fields: alumni.hidden_fields || [],
        };

        res.status(200).json(detailAlumni);
    } catch (error) {
        console.error('Error fetching detail alumni:', error);
        res.status(500).json({ message: 'Failed to fetch detail alumni' });
    }
});

app.put('/alumni/:stambuk', async (req, res) => {
    try {
        const { stambuk } = req.params;
        const updateData = req.body;

        // Cari dan update data alumni berdasarkan stambuk
        const updatedAlumni = await Alumni.findOneAndUpdate(
            { stambuk },
            updateData,
            { new: true }
        );

        if (!updatedAlumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.status(200).json({ message: 'Profil berhasil diperbarui!', data: updatedAlumni });
    } catch (error) {
        console.error('Error updating alumni profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

app.get('/admin/alumni/:stambuk', async (req, res) => {
    try {
        const { stambuk } = req.params;
        const alumni = await Alumni.findOne({ stambuk });

        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.status(200).json(alumni);
    } catch (error) {
        console.error('Error fetching alumni details:', error);
        res.status(500).json({ message: 'Failed to fetch alumni details' });
    }
});

app.put('/admin/alumni/:stambuk', async (req, res) => {
    try {
        const { stambuk } = req.params;
        const updateData = req.body;

        const updatedAlumni = await Alumni.findOneAndUpdate(
            { stambuk },
            updateData,
            { new: true }
        );

        if (!updatedAlumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.status(200).json({ message: 'Alumni updated successfully', data: updatedAlumni });
    } catch (error) {
        console.error('Error updating alumni data:', error);
        res.status(500).json({ message: 'Failed to update alumni data' });
    }
});

app.delete('/admin/alumni/:stambuk', async (req, res) => {
    try {
        const { stambuk } = req.params;

        const deletedAlumni = await Alumni.findOneAndDelete({ stambuk });

        if (!deletedAlumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        res.status(200).json({ message: 'Alumni deleted successfully' });
    } catch (error) {
        console.error('Error deleting alumni:', error);
        res.status(500).json({ message: 'Failed to delete alumni' });
    }
});

app.post('/hidden_fields/:stambuk', async (req, res) => {
    try {
        const { hidden_fields } = req.body; // Ambil daftar hidden fields dari request body
        const alumni = await Alumni.findOneAndUpdate(
            { stambuk: req.params.stambuk },
            { hidden_fields },
            { new: true } // Mengembalikan dokumen yang telah diperbarui
        );
        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }
        res.json(alumni.hidden_fields); // Kembalikan daftar hidden fields terbaru
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Skema dan model Mongoose untuk User
const UserSchema = new mongoose.Schema({
    stambuk: { type: String, required: true, unique: true },
    nama: { type: String, required: true },
    password: { type: String, required: true },
    role_id: { type: Number, default: 1 },
});

const User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
    res.send('Server is running'); // Balas dengan pesan sederhana
});

// Rute untuk mendapatkan semua item
app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching items: ' + err.message });
    }
});

// Rute untuk menambahkan item
app.post('/items', async (req, res) => {
    const { name, price } = req.body;

    const item = new Item({ name, price });

    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: 'Error adding item: ' + err.message });
    }
});

// Rute untuk mendapatkan profil pengguna berdasarkan stambuk
app.get('/users/:stambuk', async (req, res) => {
    const { stambuk } = req.params;
    console.log(`Received request for stambuk: ${stambuk}`); // Log the incoming request

    try {
        const user = await User.findOne({ stambuk });
        if (!user) {
            console.log('User not found'); // Log if user not found
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User found:', user); // Log the user data
        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err); // Log any errors
        res.status(500).json({ message: 'Error fetching user: ' + err.message });
    }
});

// Rute untuk pendaftaran pengguna
app.post('/register', async (req, res) => {
    const { stambuk, nama, password, role_id } = req.body;

    // Cek apakah stambuk sudah ada
    const existingUser = await User.findOne({ stambuk });
    if (existingUser) {
        return res.status(400).json({ error: 'Stambuk already exists' });
    }

    const newUser = new User({ stambuk, nama, password, role_id });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user: ' + error.message });
    }
});

// Rute untuk login pengguna
app.post('/login', async (req, res) => {
    const { stambuk, password } = req.body;

    try {
        // Mencari pengguna berdasarkan stambuk
        const user = await Alumni.findOne({ stambuk });

        // Jika pengguna tidak ditemukan
        if (!user) {
            return res.status(400).json({ error: 'Stambuk tidak ditemukan' });
        }

        // Memeriksa password
        if (user.password !== password) {
            return res.status(400).json({ error: 'Password salah' });
        }

        // Jika berhasil login, sertakan role_id dalam respons
        return res.status(200).json({ message: 'Login berhasil', user });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});

// Rute untuk mendapatkan semua pengguna
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users: ' + err.message });
    }
});













//EVENT BACKEND

// Skema dan model Mongoose untuk Event
const KegiatanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    poster: { type: String, required: true },
});

const Kegiatan = mongoose.model('Kegiatan', KegiatanSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function uploadToImgur(imageBuffer) {
    const clientId = 'da1e45a818d4f93';  // Ganti dengan Client ID Anda

    try {
        // Menggunakan imageBuffer langsung dari memory
        const response = await axios.post(
            'https://api.imgur.com/3/image',
            {
                image: imageBuffer.toString('base64'), // Mengirim file sebagai base64
                type: 'base64',
            },
            {
                headers: {
                    Authorization: `Client-ID ${clientId}`,
                },
            }
        );

        if (response.data && response.data.success) {
            return response.data.data.link; // Mengembalikan URL gambar dari Imgur
        } else {
            throw new Error('Failed to upload image to Imgur');
        }
    } catch (error) {
        console.error('Error uploading to Imgur:', error.message);
        throw error;
    }
}

// Endpoint untuk menambah event baru
app.post('/kegiatan', upload.single('poster'), async (req, res) => {
    const { name, date, time, location, description } = req.body;
    const posterBuffer = req.file ? req.file.buffer : null; // Ambil buffer gambar dari file yang di-upload

    // Validasi input
    if (!name || !date || !time || !location || !description || !posterBuffer) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Unggah gambar ke Imgur
        const posterUrl = await uploadToImgur(posterBuffer);

        // Simpan data event ke MongoDB dengan URL gambar dari Imgur
        const newKegiatan = new Kegiatan({
            name,
            date,
            time,
            location,
            description,
            poster: posterUrl, // URL dari Imgur
        });

        await newKegiatan.save();
        res.status(201).json(newKegiatan); // Kembalikan data event yang baru dibuat
    } catch (error) {
        console.error('Kesalahan membuat kegiatan:', error.message);
        res.status(500).json({ error: 'kesalahan membuat kagiatan' });
    }
});

// Rute untuk mendapatkan semua event
app.get('/kegiatans', async (req, res) => {
    try {
        const kegiatans = await Kegiatan.find();
        res.json(kegiatans);
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan mengambil data kegiatan' });
    }
});

// Menyajikan file statis dari folder 'uploads'
app.use('/uploads/posterevent', express.static('posterevent'));


// Rute untuk memperbarui kegiatan
// Endpoint untuk memperbarui kegiatan
app.put('/kegiatans/:id', upload.single('poster'), async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const kegiatan = await Event.findById(id);
        if (!kegiatan) return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });

        // Update field event
        kegiatan.name = req.body.name || kegiatan.name;
        kegiatan.date = req.body.date || kegiatan.date;
        kegiatan.time = req.body.time || kegiatan.time;
        kegiatan.location = req.body.location || kegiatan.location;
        kegiatan.description = req.body.description || kegiatan.description;

        // Update poster jika ada file baru
        if (req.file) {
            try {
                // Unggah poster baru ke Imgur
                const posterBuffer = req.file.buffer;
                const posterUrl = await uploadToImgur(posterBuffer);

                // Simpan URL poster baru
                kegiatan.poster = posterUrl;
            } catch (error) {
                return res.status(500).json({
                    message: 'Failed to upload poster to Imgur',
                    error: error.message,
                });
            }
        }

        // Simpan pembaruan event
        const updatedKegiatan = await kegiatan.save();
        res.json(updatedKegiatan);
    } catch (error) {
        console.error('Kesalahan memperbarui kegiatan:', error.message);
        res.status(500).json({ message: 'Kesalahan memperbarui kegiatan' });
    }
});

app.delete('/kegiatans/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const kegiatan = await Kegiatan.findByIdAndDelete(id);
        if (!kegiatan) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
        }
        res.status(200).json({ message: 'Kegiatan berhasil dihapus' });
    } catch (error) {
        console.error('Gagal menghapus kegiatan:', error.message);
        res.status(500).json({ message: 'Kegiatan berhasil dihapus' });
    }
});

// Define the Participation model
const Participation = mongoose.model('Participation', new mongoose.Schema({
    userId: { type: String, required: true },
    kegiatanId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}));

// Endpoint for event registration
app.post('/participate', async (req, res) => {
    const { userId, kegiatanId } = req.body;

    if (!userId || !kegiatanId) {
        return res.status(400).json({ message: 'User ID and Event ID are required' });
    }

    try {
        // Check if the user is already registered for the event
        const existingParticipation = await Participation.findOne({ userId, kegiatanId });
        if (existingParticipation) {
            return res.status(400).json({ message: 'Anda sudah terdaftar pada kegiatan ini' });
        }

        // Create a new participation record
        const participation = new Participation({ userId, kegiatanId });
        await participation.save();

        res.status(201).json({ message: 'Berhasil mendaftar kegiatan!' });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan dalam mendaftar kegiatan, silahkan hubungi admin' });
    }
});

// Rute untuk mendapatkan peserta berdasarkan eventId
app.get('/participations/:kegiatanId', async (req, res) => {
    const { kegiatanId } = req.params;

    try {
        // Cari semua partisipasi berdasarkan kegiatanId
        const participations = await Participation.find({ kegiatanId });

        if (!participations || participations.length === 0) {
            return res.status(404).json({ message: 'No participants found for this event' });
        }

        // Ambil data pengguna berdasarkan userId yang ada di participations
        const participantsWithNames = [];
        for (const participation of participations) {
            const user = await User.findOne({ stambuk: participation.userId }); // Ambil nama berdasarkan stambuk
            if (user) {
                participantsWithNames.push({
                    _id: participation._id,
                    name: user.nama,
                    stambuk: user.stambuk,
                });
            }
        }

        res.json(participantsWithNames);
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Error fetching participants' });
    }
});

// MENGHAPUS PESERTA EVENT
app.delete('/participations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Hapus partisipasi berdasarkan ID
        const result = await Participation.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        res.json({ message: 'Participant removed successfully' });
    } catch (error) {
        console.error('Error deleting participant:', error);
        res.status(500).json({ message: 'Error deleting participant' });
    }
});

app.get('/historyevent/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Searching for participations with userId:', userId); // Debug

        // Query ke MongoDB
        const participations = await Participation.find({ userId });
        console.log('Participations found:', participations); // Debug hasil query

        if (!participations.length) {
            return res.status(404).json({ message: 'No participations found for this user' });
        }

        // Mengambil hanya eventId dari partisipasi
        const kegiatanIds = participations.map(participation => participation.kegiatanId);
        console.log('Kegiatan IDs:', kegiatanIds); // Debug

        // Fetch detail event menggunakan eventId
        const kegiatans = await Kegiatan.find({ _id: { $in: kegiatanIds } });
        res.status(200).json(kegiatans);
    } catch (error) {
        console.error('Error fetching participations:', error);
        res.status(500).json({ message: 'Failed to fetch participations', error });
    }
});

app.get('/participations/user/:stambuk', async (req, res) => {
    const { stambuk } = req.params;
    try {
        const participations = await Participation.find({ stambuk }).populate('event');
        res.json(participations.map(p => p.event));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching participations', error: err });
    }
});





























// LOGIKA BACKEND INFORMASI //
// SKEMA TABEL INFORMASI
const InformasiSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
});

// KODE UNTUK MODEL INFORMASI
const Informasi = mongoose.model('Informasi', InformasiSchema);
const uploadInformasi = multer({ storage: storage });

// Fungsi untuk meng-upload gambar ke Imgur


// Middleware untuk upload file

// KODE UNTUK MEMBUAT ATAU MENAMBAH INFORMASI
app.post('/informasis', uploadInformasi.single('image'), async (req, res) => {
    const { name, date, time, description } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;  // Ambil buffer gambar dari file yang di-upload

    // Validasi input
    if (!name || !date || !time || !description || !imageBuffer) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Unggah gambar ke Imgur
        const imageUrl = await uploadToImgur(imageBuffer);

        // Simpan informasi baru dengan URL gambar dari Imgur
        const newInformasi = new Informasi({
            name,
            date,
            time,
            description,
            image: imageUrl,  // URL gambar Imgur
        });

        await newInformasi.save(); // Simpan informasi ke database
        res.status(201).json(newInformasi); // Kembalikan data informasi yang baru ditambahkan
    } catch (error) {
        console.error('Gagal Menyimpan Informasi:', error.message);
        res.status(500).json({ error: 'Gagal Menyimpan Informasi' });
    }
});

// KODE UNTUK MENGAMBIL SEMUA INFORMASI DARI DATABASE (FETCH)
app.get('/informasis', async (req, res) => {
    try {
        const informasis = await Informasi.find();
        res.json(informasis);
    } catch (err) {
        res.status(500).json({ message: 'Gagal Mendapatkan Informasi' });
    }
});

// KODE UNTUK MELIHAT DETAIL INFORMASI BERDASARKAN ID INFORMASI
app.get('/informasis/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const informasi = await Informasi.findById(id);
        if (!informasi) {
            return res.status(404).json({ message: 'informasi tidak ditemukan' });
        }
        res.json(informasi);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil detail informasi' });
    }
});

// KODE UNTUK EDIT Informasi
app.put('/informasis/:id', uploadInformasi.single('image'), async (req, res) => {
    const { id } = req.params;

    // Validasi ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const informasi = await Informasi.findById(id);
        if (!informasi) return res.status(404).json({ message: 'informasi tidak ditemukan' });

        // Update field informasi
        informasi.name = req.body.name || informasi.name;
        informasi.date = req.body.date || informasi.date;
        informasi.time = req.body.time || informasi.time;
        informasi.description = req.body.description || informasi.description;

        // Update gambar jika ada file baru
        if (req.file) {
            try {
                // Upload gambar baru ke Imgur
                const imageUrl = await uploadToImgur(req.file.buffer);

                // Update URL gambar di database
                informasi.image = imageUrl;
            } catch (error) {
                console.error('Error uploading image to Imgur:', error.message);
                return res.status(500).json({ message: 'Gagal mengunggah gambar ke Imgur' });
            }
        }

        // Simpan perubahan
        const updatedInformasi = await informasi.save();
        res.status(200).json(updatedInformasi);
    } catch (error) {
        console.error('Error updating informasi:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// KODE UNTUK MENGHAPUS INFORMASI
app.delete('/informasis/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const informasi = await Informasi.findByIdAndDelete(id);

        if (!informasi) {
            return res.status(404).json({ message: 'informasi not found' });
        }

        res.status(200).json({ message: 'informasi deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menghapus informasi' });
    }
});







// KOMENTAR BACKEND LOGIC //
// KODE UNTUK MEMBUAT SKEMA TABEL KOMENTAR
const CommentSchema = new mongoose.Schema({
    informasiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Informasi', required: true },
    comment: { type: String, required: true },
    stambuk: { type: String, required: true },
    nama: { type: String, required: true },  // Nama pengguna yang ditambahkan
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },  // Waktu update
});

// KODE UNTUK MEMBUAT MODEL KOMENTAR
const Comment = mongoose.model('Comment', CommentSchema);

// KODE UNTUK MENAMBAHKAN KOMENTAR
app.post('/comments', async (req, res) => {
    const { informasiId, stambuk, comment } = req.body;

    if (!informasiId || !stambuk || !comment) {
        console.log("Invalid data: ", req.body);
        return res.status(400).json({ message: 'Informasi ID, Stambuk, dan Komentar harus diisi' });
    }

    try {
        // Cari nama pengguna berdasarkan stambuk
        const user = await Alumni.findOne({ stambuk });
        if (!user) {
            console.log("User not found for stambuk:", stambuk);
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // Menyimpan komentar dengan nama dan stambuk user yang ditemukan
        const newComment = new Comment({
            informasiId,
            comment,
            stambuk,
            nama: user.nama,  // Menyertakan nama pengguna
        });

        await newComment.save();
        console.log("Comment saved:", newComment);
        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error saving comment:", error);
        res.status(500).json({ message: 'Gagal menambahkan komentar', error: error.message });
    }
});

// KODE UNTUK MENGAMBIL KOMENTAR BERDASARKAN ID INFORMASI 
app.get('/comments/:informasiId', async (req, res) => {
    const { informasiId } = req.params;

    if (!informasiId) {
        return res.status(400).json({ message: 'informasi ID harus diisi' });
    }

    try {
        // Ambil semua komentar berdasarkan INFORMASI ID
        const comments = await Comment.find({ informasiId }); // Populate untuk mengambil username berdasarkan userId
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Gagal mengambil komentar', error: error.message });
    }
});

// KODE UNTUK UPDATE KOMENTAR
app.put('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { comment, stambuk } = req.body;

    if (!comment || !stambuk) {
        return res.status(400).json({ message: 'Komentar dan Stambuk harus diisi' });
    }

    try {
        const existingComment = await Comment.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }

        // Pastikan hanya pengguna yang memiliki komentar yang bisa mengeditnya
        if (existingComment.stambuk !== stambuk) {
            return res.status(403).json({ message: 'Anda tidak berhak mengedit komentar ini' });
        }

        existingComment.comment = comment;
        existingComment.updatedAt = new Date();  // Update waktu terakhir
        await existingComment.save();

        res.status(200).json(existingComment);
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: 'Gagal memperbarui komentar', error: error.message });
    }
});

// KODE UNTUK MENGHAPUS KOMENTAR
app.delete('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { stambuk } = req.body;

    if (!stambuk) {
        return res.status(400).json({ message: 'Stambuk harus diisi' });
    }

    try {
        const existingComment = await Comment.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }

        // Pastikan hanya pengguna yang memiliki komentar yang bisa menghapusnya
        if (existingComment.stambuk !== stambuk) {
            return res.status(403).json({ message: 'Anda tidak berhak menghapus komentar ini' });
        }

        // Gunakan .findByIdAndDelete atau .deleteOne
        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({ message: 'Komentar berhasil dihapus' });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: 'Gagal menghapus komentar', error: error.message });
    }
});





const KritikSchema = new mongoose.Schema({
    stambuk: { type: String, required: true },
    nama: { type: String, required: true },
    kritik: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
const Kritik = mongoose.model('Kritik', KritikSchema);
app.use(express.json());

app.post('/kritik', async (req, res) => {
    try {
        const { stambuk, nama, kritik } = req.body;

        // Validasi input
        if (!kritik) {
            return res.status(400).json({ message: 'Kritik tidak boleh kosong' });
        }

        // Simpan ke database
        const newKritik = new Kritik({ stambuk, nama, kritik });
        await newKritik.save();

        res.status(200).json({ message: 'Kritik berhasil disimpan' });
    } catch (error) {
        console.error('Error saving kritik:', error);
        res.status(500).json({ message: 'Gagal menyimpan kritik' });
    }
});

// GET semua kritik
app.get('/kritik', async (req, res) => {
    try {
        const kritik = await Kritik.find().sort({ createdAt: -1 }); // Urutkan berdasarkan waktu terbaru
        res.json(kritik);
    } catch (error) {
        console.error('Error fetching kritik:', error.message);
        res.status(500).json({ message: 'Gagal memuat kritik' });
    }
});

app.delete('/kritik/:id', async (req, res) => {
    const { id } = req.params;

    // Validasi ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        // Cari dan hapus kritik berdasarkan ID
        const kritik = await Kritik.findByIdAndDelete(id);

        // Jika tidak ditemukan
        if (!kritik) {
            return res.status(404).json({ message: 'Kritik tidak ditemukan' });
        }

        res.status(200).json({ message: 'Kritik berhasil dihapus', kritik });
    } catch (error) {
        console.error('Error deleting kritik:', error.message);
        res.status(500).json({ message: 'Gagal menghapus kritik' });
    }
});









// Memulai server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});