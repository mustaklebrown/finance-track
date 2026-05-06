/**
 * Export data to Excel-compatible CSV file.
 * Uses BOM (Byte Order Mark) so Excel correctly reads UTF-8 characters (accents, etc.)
 */

type ExportColumn<T> = {
  header: string;
  accessor: (item: T) => string | number;
};

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  if (data.length === 0) {
    alert('Aucune donnée à exporter.');
    return;
  }

  // BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';

  // CSV separator — use semicolon for French Excel (comma is decimal separator in FR)
  const SEP = ';';

  // Header row
  const headerRow = columns.map(col => `"${col.header}"`).join(SEP);

  // Data rows
  const dataRows = data.map(item =>
    columns.map(col => {
      const value = col.accessor(item);
      // Escape quotes in strings
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    }).join(SEP)
  );

  const csvContent = BOM + [headerRow, ...dataRows].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Pre-configured export for common data types
 */
export const ExportPresets = {
  sales: (sales: any[]) => exportToExcel(
    sales,
    [
      { header: 'Date', accessor: (s) => new Date(s.createdAt).toLocaleDateString('fr-FR') },
      { header: 'Produits', accessor: (s) => s.items?.map((i: any) => `${i.quantity}x ${i.product?.name}`).join(', ') || '—' },
      { header: 'Montant Total (KMF)', accessor: (s) => s.totalAmount },
      { header: 'Montant Donné (KMF)', accessor: (s) => s.amountGiven || '' },
      { header: 'Monnaie Rendue (KMF)', accessor: (s) => s.changeReturned || '' },
      { header: 'Mode de Paiement', accessor: (s) => s.paymentMethod === 'CASH' ? 'Espèces' : s.paymentMethod === 'BANK' ? 'Banque' : 'Mobile Money' },
    ],
    'Ventes'
  ),

  expenses: (expenses: any[]) => exportToExcel(
    expenses,
    [
      { header: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString('fr-FR') },
      { header: 'Libellé', accessor: (e) => e.name },
      { header: 'Catégorie', accessor: (e) => e.category },
      { header: 'Mode de Paiement', accessor: (e) => e.paymentMethod === 'CASH' ? 'Espèces' : e.paymentMethod === 'BANK' ? 'Banque' : 'Mobile Money' },
      { header: 'Montant (KMF)', accessor: (e) => e.amount },
    ],
    'Depenses'
  ),

  products: (products: any[]) => exportToExcel(
    products,
    [
      { header: 'Nom', accessor: (p) => p.name },
      { header: 'SKU', accessor: (p) => p.sku || '' },
      { header: 'Catégorie', accessor: (p) => p.category?.name || '' },
      { header: 'Prix Achat (KMF)', accessor: (p) => p.purchasePrice },
      { header: 'Prix Vente (KMF)', accessor: (p) => p.sellingPrice },
      { header: 'Marge (KMF)', accessor: (p) => p.sellingPrice - p.purchasePrice },
      { header: 'Marge (%)', accessor: (p) => p.sellingPrice > 0 ? ((p.sellingPrice - p.purchasePrice) / p.sellingPrice * 100).toFixed(1) : '0' },
      { header: 'Stock', accessor: (p) => p.stockLevel },
      { header: 'Alerte Stock', accessor: (p) => p.lowStockAlert },
      { header: 'Valeur Stock (KMF)', accessor: (p) => p.stockLevel * p.purchasePrice },
      { header: 'Statut', accessor: (p) => p.status || 'ACTIVE' },
    ],
    'Produits'
  ),

  accounting: (records: any[]) => exportToExcel(
    records,
    [
      { header: 'Date', accessor: (r) => new Date(r.date || r.createdAt).toLocaleDateString('fr-FR') },
      { header: 'Type', accessor: (r) => r.type === 'ASSET' ? 'ACTIF' : r.type === 'LIABILITY' ? 'PASSIF' : 'CAPITAUX PROPRES' },
      { header: 'Catégorie', accessor: (r) => r.category },
      { header: 'Compte', accessor: (r) => r.paymentMethod === 'CASH' ? 'Caisse' : r.paymentMethod === 'BANK' ? 'Banque' : 'Mobile Money' },
      { header: 'Note', accessor: (r) => r.notes || '' },
      { header: 'Montant (KMF)', accessor: (r) => r.amount },
    ],
    'Comptabilite'
  ),

  categories: (categories: any[]) => exportToExcel(
    categories,
    [
      { header: 'Nom', accessor: (c) => c.name },
      { header: 'Nombre de Produits', accessor: (c) => c._count?.products || 0 },
    ],
    'Categories'
  ),
};
