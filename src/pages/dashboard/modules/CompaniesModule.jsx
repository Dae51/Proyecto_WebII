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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="custom-scroll relative w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#07142f] p-6 shadow-2xl max-h-[90vh] md:p-8">
        <h3 className="mb-6 text-2xl font-black text-white">{title}</h3>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}
          <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
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

  const getCategoryName = (identifier) => {
    const catObj = categorias.find(c => String(c.id) === String(identifier) || c.categories === identifier);
    return catObj ? catObj.categories : identifier || "Sin rubro";
  };

  const rows = empresas.map(emp => [
    <div className="flex flex-col">
      <span className="font-bold text-white">{emp.name}</span>
      <span className="text-xs text-slate-400">{emp.mail}</span>
    </div>,
    <span className="font-mono text-xs font-semibold rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 tracking-widest text-amber-300">{emp.code}</span>,
    <div className="flex flex-col">
      <span className="text-slate-300">{emp.contact_name}</span>
      <span className="text-xs text-slate-500">{emp.phone}</span>
    </div>,
    getCategoryName(emp.category),
    canManage ? (
      <div className="flex gap-3">
        <button
          onClick={() => openEditModal(emp)}
          className="text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(emp.id)}
          className="text-xs font-bold text-rose-400 transition hover:text-rose-300"
        >
          Borrar
        </button>
      </div>
    ) : (
      <span className="text-xs italic text-slate-500">Sólo vista</span>
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
            className="btn-primary hover:-translate-y-1"
          >
            Añadir Empresa
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Empresas registradas" value={loading ? "-" : String(empresas.length).padStart(2, '0')} accent="text-cyan-400" />
          <StatCard title="Categorías base" value={loading ? "-" : String(categorias.length).padStart(2, '0')} accent="text-emerald-400" />
          <StatCard title="Estado Central" value="Seguro" accent="text-amber-400" />
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="animate-pulse py-12 text-center text-sm font-medium text-slate-500">Obteniendo listado empresarial...</div>
          ) : empresas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 py-12 text-center text-sm font-medium text-slate-400">El tablero está vacío. Agrega tu primera compañía ofertante para arrancar.</div>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="bo-label">Nombre de la Empresa</label>
            <input
              type="text"
              placeholder="Ej: InnovaCorp S.A."
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={errors.name ? "bo-input-error" : "bo-input"}
            />
            {errors.name && <span className="text-xs font-semibold text-rose-400">{errors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="bo-label">Código de Referencia (Auto)</label>
            <input
              type="text"
              readOnly
              value={formData.code}
              className="bo-input cursor-not-allowed font-mono tracking-[0.25em] opacity-60"
            />
            <span className="text-xs font-semibold text-slate-500">Sólo lectura (generado por hash)</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col gap-1.5">
          <label className="bo-label">Correo Electrónico (Representante o Facturación)</label>
          <input
            type="email"
            placeholder="facturacion@empresa.com"
            value={formData.mail}
            onChange={(e) => handleChange("mail", e.target.value)}
            className={errors.mail ? "bo-input-error" : "bo-input"}
          />
          {errors.mail && <span className="text-xs font-semibold text-rose-400">{errors.mail}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="bo-label">Dirección Operativa Base</label>
          <input
            type="text"
            placeholder="Av. Las Magnolias, Edificio X Local 5"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={errors.address ? "bo-input-error" : "bo-input"}
          />
          {errors.address && <span className="text-xs font-semibold text-rose-400">{errors.address}</span>}
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="bo-label">Categoría Asociada</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={errors.category ? "bo-input-error" : "bo-input"}
            >
              <option value="" disabled hidden className="bg-[#07142f]">Elige opc...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.categories} className="bg-[#07142f] text-white">
                  {c.categories}
                </option>
              ))}
            </select>
            {errors.category && <span className="text-xs font-semibold text-rose-400">{errors.category}</span>}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="bo-label">Nombre del Encargado</label>
            <input
              type="text"
              placeholder="José D."
              value={formData.contact_name}
              onChange={(e) => handleChange("contact_name", e.target.value)}
              className={errors.contact_name ? "bo-input-error" : "bo-input"}
            />
            {errors.contact_name && <span className="text-xs font-semibold text-rose-400">{errors.contact_name}</span>}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="bo-label">Teléfono SV</label>
            <input
              type="text"
              placeholder="7000-0000"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`font-mono ${errors.phone ? "bo-input-error" : "bo-input"}`}
            />
            {errors.phone && <span className="text-xs font-semibold text-rose-400">{errors.phone}</span>}
          </div>
        </div>
      </Modal>
    </>
  );
}
