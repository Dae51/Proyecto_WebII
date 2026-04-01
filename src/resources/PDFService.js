import { jsPDF } from "jspdf";

/**
 * Genera y descarga un archivo PDF para un solo cupón ("Versión física").
 * @param {Object} item - El objeto cupón desde el estado de la vista.
 */
export function generarCuponPDF(item) {
  const doc = new jsPDF();
  
  // Marco Exterior (simula el borde del ticket)
  doc.setLineWidth(1);
  doc.rect(10, 10, 190, 80);
  
  // LOGO "La Cuponera"
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("La Cuponera", 15, 25);
  
  // Línea separadora encabezado
  doc.setLineWidth(0.5);
  doc.line(10, 32, 200, 32);
  
  // Título del Cupón
  const title = item.offer?.title ?? "Cupón Promocional";
  doc.setFontSize(16);
  doc.text(title, 15, 45);
  
  // Descripción
  const desc = item.offer?.description ?? "Presenta este documento para validar tu promoción.";
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const splitDesc = doc.splitTextToSize(desc, 180);
  doc.text(splitDesc, 15, 55);
  
  // Fecha Expiración
  if (item.offer?.expiration_date) {
    const expDate = new Date(item.offer.expiration_date).toLocaleDateString();
    doc.setFont("helvetica", "italic");
    doc.text(`Válido hasta: ${expDate}`, 15, 70);
  }
  
  // Código del Cupón
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`CÓDIGO: ${item.purchaseId || item.id}`, 15, 80);
  
  // Descargar Archivo
  doc.save(`Cupon_${item.purchaseId || item.id}.pdf`);
}

/**
 * Genera un PDF que enlista todos los cupones proporcionados.
 * @param {Array} items - Arreglo de cupones comprados.
 */
export function generarListaCuponesPDF(items) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  // Título / Logo principal
  doc.text("Mis Cupones Disponibles - La Cuponera", 15, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de emisión del reporte: ${new Date().toLocaleDateString()}`, 15, 30);
  
  let currentY = 40;
  
  if (!items || items.length === 0) {
    doc.text("No tienes cupones disponibles en este momento.", 15, 50);
    doc.save("Cupones_Disponibles.pdf");
    return;
  }
  
  items.forEach((item, index) => {
    // Control de paginación
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    
    // Marco exterior de la tarjeta
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, 190, 45);
    
    // Título
    const title = item.offer?.title ?? "Cupón";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${index + 1}. ${title}`, 15, currentY + 10);
    
    // Detalles
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Código: ${item.purchaseId || item.id}`, 15, currentY + 20);
    
    const expDate = item.offer?.expiration_date 
        ? new Date(item.offer.expiration_date).toLocaleDateString() 
        : "Ilimitada";
    doc.text(`Válido hasta: ${expDate}`, 15, currentY + 30);
    
    const desc = item.offer?.description ?? "";
    const splitDesc = doc.splitTextToSize(desc, 180);
    // Mostrar solo un extracto de la descripción (max 2 líneas)
    doc.text(splitDesc.slice(0, 2), 15, currentY + 40); 
    
    currentY += 55;
  });
  
  doc.save("Mis_Cupones_Disponibles.pdf");
}
