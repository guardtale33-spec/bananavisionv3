import { useState, useEffect } from "react";
import { getAdminDiseases, createAdminDisease, updateAdminDisease, deleteAdminDisease, toggleAdminDisease } from "../../hooks/data";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";

export default function AdminDiseasesPage({ token }) {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create" | "edit"
  const [selectedDisease, setSelectedDisease] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Jamur",
    severity: "Sedang",
    description: "",
    symptoms: "",
    prevention: "",
    treatment: "",
    isActive: true,
  });

  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    loadDiseases();
  }, [token]);

  async function loadDiseases() {
    try {
      setLoading(true);
      const data = await getAdminDiseases(token);
      setDiseases(data);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar penyakit");
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setFormData({
      name: "",
      category: "Jamur",
      severity: "Sedang",
      description: "",
      symptoms: "",
      prevention: "",
      treatment: "",
      isActive: true,
    });
    setFormError(null);
    setModalType("create");
    setModalOpen(true);
  };

  const openEditModal = (disease) => {
    setSelectedDisease(disease);
    setFormData({
      name: disease.name,
      category: disease.category,
      severity: disease.severity,
      description: disease.description,
      symptoms: disease.symptoms ? disease.symptoms.join("\n") : "",
      prevention: disease.prevention ? disease.prevention.join("\n") : "",
      treatment: disease.treatment ? disease.treatment.join("\n") : "",
      isActive: disease.isActive,
    });
    setFormError(null);
    setModalType("edit");
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.category || !formData.severity) {
      setFormError("Mohon isi semua bidang utama yang wajib!");
      return;
    }

    // Convert newlines to arrays
    const cleanArray = (str) =>
      str
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");

    const payload = {
      ...formData,
      symptoms: cleanArray(formData.symptoms),
      prevention: cleanArray(formData.prevention),
      treatment: cleanArray(formData.treatment),
    };

    try {
      setFormSubmitLoading(true);
      setFormError(null);

      if (modalType === "create") {
        await createAdminDisease(token, payload);
      } else {
        await updateAdminDisease(token, selectedDisease.id, payload);
      }

      setModalOpen(false);
      loadDiseases();
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data penyakit");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await toggleAdminDisease(token, id, newStatus);
      setDiseases((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: newStatus } : d))
      );
    } catch (err) {
      alert("Gagal memperbarui status aktif: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    const choice = window.confirm(
      "Apakah Anda yakin ingin menghapus penyakit ini?\nKlik OK untuk Soft Delete (Non-aktifkan),\nKlik Batal untuk opsi lainnya."
    );

    if (choice) {
      try {
        await deleteAdminDisease(token, id, false);
        loadDiseases();
      } catch (err) {
        alert("Gagal menghapus: " + err.message);
      }
    } else {
      const hardChoice = window.confirm(
        "Apakah Anda ingin menghapusnya secara PERMANEN dari database?\n(Peringatan: Tindakan ini tidak dapat dibatalkan!)"
      );
      if (hardChoice) {
        try {
          await deleteAdminDisease(token, id, true);
          loadDiseases();
        } catch (err) {
          alert("Gagal menghapus permanen: " + err.message);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" color="green" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Kelola Penyakit</h1>
          <p className="text-slate-400 text-sm mt-1">
            Tambahkan atau ubah katalog penyakit pisang yang terdaftar di sistem.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-950/30 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Penyakit</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/60 p-6 rounded-2xl text-center max-w-lg mx-auto">
          <p className="text-red-400 font-medium mb-3">{error}</p>
          <button
            onClick={loadDiseases}
            className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded-lg font-medium transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Disease List Table */}
      {!error && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          {diseases.length === 0 ? (
            <p className="text-slate-500 py-12 text-center text-sm">Belum ada penyakit terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Nama Penyakit</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Keparahan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {diseases.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{d.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-850 text-slate-300">
                          {d.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            d.severity === "Berat"
                              ? "bg-red-500/10 border border-red-500/20 text-red-400"
                              : d.severity === "Sedang"
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              : "bg-green-500/10 border border-green-500/20 text-green-400"
                          }`}
                        >
                          {d.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(d.id, d.isActive)}
                          title={d.isActive ? "Klik untuk Non-aktifkan" : "Klik untuk Aktifkan"}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            d.isActive
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-slate-800 border border-slate-700 text-slate-500"
                          }`}
                        >
                          {d.isActive ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Non-aktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/60 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800/80">
              <h2 className="text-xl font-bold text-white">
                {modalType === "create" ? "Tambah Data Penyakit Baru" : `Edit Penyakit: ${selectedDisease?.name}`}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-850 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {formError && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl flex items-start gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 1: Name, Category, Severity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Penyakit *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nama ilmiah/umum"
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                  >
                    <option value="Jamur">Jamur</option>
                    <option value="Bakteri">Bakteri</option>
                    <option value="Virus">Virus</option>
                    <option value="Hama">Hama</option>
                    <option value="Sehat">Sehat</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Keparahan *</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                  >
                    <option value="Ringan">Ringan (Mild)</option>
                    <option value="Sedang">Sedang (Moderate)</option>
                    <option value="Berat">Berat (Severe)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Berikan deskripsi lengkap mengenai asal-usul, dampak, atau penyebaran penyakit ini..."
                  rows={3}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                  required
                />
              </div>

              {/* Symptoms */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gejala-Gejala</label>
                  <span className="text-[10px] text-slate-500">Satu gejala per baris</span>
                </div>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Garis-garis hitam di pelepah daun&#10;Daun layu menguning&#10;Daun mengering layu..."
                  rows={3}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                />
              </div>

              {/* Prevention & Treatment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Langkah Pencegahan</label>
                    <span className="text-[10px] text-slate-500">Satu langkah per baris</span>
                  </div>
                  <textarea
                    name="prevention"
                    value={formData.prevention}
                    onChange={handleInputChange}
                    placeholder="Gunakan varietas tahan jamur&#10;Atur sirkulasi drainase air..."
                    rows={3}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penanganan & Terapi</label>
                    <span className="text-[10px] text-slate-500">Satu langkah per baris</span>
                  </div>
                  <textarea
                    name="treatment"
                    value={formData.treatment}
                    onChange={handleInputChange}
                    placeholder="Pangkas bagian daun yang terinfeksi&#10;Semprot fungisida sistemik sesuai dosis..."
                    rows={3}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Checkbox Active */}
              <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActiveForm"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4.5 h-4.5 accent-green-500 rounded border-slate-800 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="isActiveForm" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Aktifkan di portal publik (Bisa langsung dicocokkan dengan deteksi AI dan dilihat di halaman info)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-sm font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                >
                  {formSubmitLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Menyimpan…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{modalType === "create" ? "Tambahkan Penyakit" : "Simpan Perubahan"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
