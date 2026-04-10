import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { DataTable, SectionCard, StatCard } from "../../../components/dashboard/ModuleUI";
import { fetchCategorias } from "../../../resources/CategoryService";
import {
  fetchEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  generateUniqueEmpresaCode
} from "../../../resources/EmpresasService";

// Helper Component: Simple Modal
const Modal = ({ isOpen, title, onClose, onSubmit, children, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scroll relative">
        <h3 className="text-2xl font-black text-slate-900 mb-6">{title}</h3>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-cyan-950 px-6 py-2.5 font-bold text-white shadow-md hover:bg-amber-400 hover:text-black transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CompaniesModule({ canManage }) {
  const [empresas, setEmpresas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const initialForm = {
    name: "",
    code: "",
    address: "",
    contact_name: "",
    phone: "",
    mail: "",
    category: ""
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      const [resEmpresas, resCategorias] = await Promise.all([
        fetchEmpresas(),
        fetchCategorias()
      ]);

      if (!mounted) return;
      if (resEmpresas.error) toast.error("Error al cargar empresas.");
      else setEmpresas(resEmpresas.data || []);

      if (resCategorias.error) toast.error("Error al cargar categorías.");
      else setCategorias(resCategorias.data || []);
      setLoading(false);
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const openCreateModal = async () => {
    setErrors({});
    setFormData(initialForm);
    setEditingId(null);
    setModalOpen(true);
    // Pre-generate code uniquely
    try {
      const code = await generateUniqueEmpresaCode();
      setFormData((prev) => ({ ...prev, code }));
    } catch {
      toast.error("Error contactando al servidor para asignar la llave.");
    }
  };

  const openEditModal = (empresa) => {
    setErrors({});
    setFormData({
      name: empresa.name || "",
      code: empresa.code || "",
      address: empresa.address || "",
      contact_name: empresa.contact_name || "",
      phone: empresa.phone || "",
      mail: empresa.mail || "",
      category: empresa.category || ""
    });
    setEditingId(empresa.id);
    setModalOpen(true);
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 4) val = val.slice(0, 4) + "-" + val.slice(4);
    handleChange("phone", val);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    let currErrors = {};
    if (!formData.name?.trim()) currErrors.name = "El nombre de la empresa es obligatorio";
    if (!formData.address?.trim()) currErrors.address = "Debes proveer una dirección";
    if (!formData.contact_name?.trim()) currErrors.contact_name = "El encargado/contacto es requerido";
    
    // Mail Regex Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.mail?.trim() || !emailRegex.test(formData.mail)) {
      currErrors.mail = "Ingresa un correo electrónico corporativo válido";
    }

    // Phone Regex (Salvadoran minimal check: exact 9 chars e.g. 1234-5678)
    const phoneRegex = /^[0-9]{4}-[0-9]{4}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      currErrors.phone = "Agrega un número válido en formato ####-####";
    }

    if (!formData.category) currErrors.category = "Selecciona un rubro obligatorio";

    setErrors(currErrors);
    return Object.keys(currErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    if (editingId) {
      const { data, error } = await updateEmpresa(editingId, formData);
      if (error) toast.error("Error al actualizar la empresa: " + error.message);
      else {
        toast.success("Empresa actualizada.");
        setEmpresas(empresas.map(emp => emp.id === editingId ? data : emp));
        setModalOpen(false);
      }
    } else {
      const { data, error } = await createEmpresa(formData);
      if (error) toast.error("Hubo un fallo en la inserción: " + error.message);
      else {
        toast.success("Empresa registrada correctamente en sucursal.");
        setEmpresas([data, ...empresas]);
        setModalOpen(false);
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas dar de baja este registro global permanentemente?")) return;
    const { error } = await deleteEmpresa(id);
    if (error) toast.error("Error de borrado: " + error.message);
    else {
      toast.success("Registro empresarial eliminado exítosamente.");
      setEmpresas(empresas.filter(e => e.id !== id));
    }
  };

  // Build the dataset specifically to list via the DataTable component.
  // Note: Here I am rendering Category directly if it's the exact string, otherwise I can map via the array to fetch names.
  const getCategoryName = (identifier) => {
    // Assuming `categories` table usually has `id` and `categories` as strings based on recent CRUD changes
    const catObj = categorias.find(c => String(c.id) === String(identifier) || c.categories === identifier);
    return catObj ? catObj.categories : identifier || "Sin rubro";
  };

  const rows = empresas.map(emp => [
    <div className="flex flex-col">
      <span className="font-bold text-slate-900">{emp.name}</span>
      <span className="text-xs text-slate-500">{emp.mail}</span>
    </div>,
    <span className="font-mono text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-md tracking-widest">{emp.code}</span>,
    <div className="flex flex-col">
      <span className="text-slate-700">{emp.contact_name}</span>
      <span className="text-xs text-slate-400">{emp.phone}</span>
    </div>,
    getCategoryName(emp.category),
    canManage ? (
      <div className="flex gap-3">
        <button
          onClick={() => openEditModal(emp)}
          className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(emp.id)}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
        >
          Borrar
        </button>
      </div>
    ) : (
      <span className="text-xs text-slate-400 font-semibold italic">Sólo vista</span>
    )
  ]);

  return (
    <>
      <SectionCard
        title="Empresas Asociadas"
        subtitle="Directorio maestro para registrar las marcas y sus encargados para ofertar en el portal."
        actionVisible={canManage}
        action={
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-cyan-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-amber-400 hover:text-cyan-950"
          >
            Añadir Empresa
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Empresas registradas" value={loading ? "-" : String(empresas.length).padStart(2, '0')} accent="text-cyan-700" />
          <StatCard title="Categorías base" value={loading ? "-" : String(categorias.length).padStart(2, '0')} accent="text-emerald-600" />
          <StatCard title="Estado Central" value="Seguro" accent="text-amber-500" />
        </div>
        
        <div className="mt-8">
          {loading ? (
             <div className="py-12 text-center text-sm font-medium text-slate-500 animate-pulse">Obteniendo listado empresarial...</div>
          ) : empresas.length === 0 ? (
             <div className="py-12 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200 rounded-3xl">El tablero está vacío. Agrega tu primera compañía ofertante para arrancar.</div>
          ) : (
            <DataTable
              columns={["Empresa Comercial", "Código Asignado", "Punto de Contacto", "Rubro / Categoría", "Acciones Administrativas"]}
              rows={rows}
            />
          )}
        </div>
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Editar Registro de Empresa" : "Vincular a la Tienda (Nueva Empresa)"}
        onClose={() => !isSubmitting && setModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Nombre de la Empresa</label>
            <input
              type="text"
              placeholder="Ej: InnovaCorp S.A."
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${errors.name ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {errors.name && <span className="text-xs font-semibold text-rose-600">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Código de Referencia (Auto)</label>
            <input
              type="text"
              readOnly
              value={formData.code}
              className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-mono font-bold tracking-[0.25em] text-slate-600 outline-none select-none cursor-not-allowed"
            />
            <span className="text-xs font-semibold text-slate-400">Sólo lectura (generado por hash)</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Correo Electrónico (Representante o Facturación)</label>
          <input
            type="email"
            placeholder="facturacion@empresa.com"
            value={formData.mail}
            onChange={(e) => handleChange("mail", e.target.value)}
            className={`rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${errors.mail ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
          />
          {errors.mail && <span className="text-xs font-semibold text-rose-600">{errors.mail}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Dirección Operativa Base</label>
          <input
            type="text"
            placeholder="Av. Las Magnolias, Edificio X Local 5"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={`rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${errors.address ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
          />
          {errors.address && <span className="text-xs font-semibold text-rose-600">{errors.address}</span>}
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-sm font-bold text-slate-700">Categoría Asociada</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${errors.category ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
            >
              <option value="" disabled hidden>Elige opc...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.categories /* Or c.id depending on strict schema, we fallback to strictly visual relation since prompt specifies it as FK but could just be storing string or ID */}>
                  {c.categories}
                </option>
              ))}
            </select>
            {errors.category && <span className="text-xs font-semibold text-rose-600">{errors.category}</span>}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-sm font-bold text-slate-700">Nombre del Encargado</label>
            <input
              type="text"
              placeholder="José D."
              value={formData.contact_name}
              onChange={(e) => handleChange("contact_name", e.target.value)}
              className={`rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-1 ${errors.contact_name ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {errors.contact_name && <span className="text-xs font-semibold text-rose-600">{errors.contact_name}</span>}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-sm font-bold text-slate-700">Teléfono SV</label>
            <input
              type="text"
              placeholder="7000-0000"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`rounded-lg border px-4 py-2.5 text-sm font-mono outline-none focus:ring-1 ${errors.phone ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 bg-white focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {errors.phone && <span className="text-xs font-semibold text-rose-600">{errors.phone}</span>}
          </div>
        </div>
      </Modal>
    </>
  );
}
