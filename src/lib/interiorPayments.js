export function calculateGstTotals(baseAmount, gstRate) {
  const safeBase = Number(baseAmount);
  const safeRate = Number(gstRate);

  if (!Number.isFinite(safeBase) || safeBase <= 0) {
    return { gstAmount: 0, totalAmount: 0 };
  }

  if (!Number.isFinite(safeRate) || safeRate <= 0) {
    return { gstAmount: 0, totalAmount: safeBase };
  }

  const gstAmount = Number((safeBase * (safeRate / 100)).toFixed(2));
  const totalAmount = Number((safeBase + gstAmount).toFixed(2));
  return { gstAmount, totalAmount };
}

export function calculateOutstanding(totalIncludingGst, paymentsReceived) {
  const total = Number(totalIncludingGst) || 0;
  const paid = Number(paymentsReceived) || 0;
  return Number((total - paid).toFixed(2));
}

export function calculateProjectTotals({ baseTotal, gstTotal, grossTotal, adjustmentTotal, adjustmentBaseTotal, adjustmentGstTotal, paymentsTotal }) {
  const base = Number(baseTotal) || 0;
  const gst = Number(gstTotal) || 0;
  const gross = Number(grossTotal) || base + gst;
  const hasAdjustmentBase = Number.isFinite(Number(adjustmentBaseTotal));
  const hasAdjustmentGst = Number.isFinite(Number(adjustmentGstTotal));
  const hasAdjustmentGross = Number.isFinite(Number(adjustmentTotal));

  const adjustmentsBase = hasAdjustmentBase ? Number(adjustmentBaseTotal) : (hasAdjustmentGross ? Number(adjustmentTotal) : 0);
  const adjustmentsGst = hasAdjustmentGst ? Number(adjustmentGstTotal) : 0;
  const adjustmentsGross = hasAdjustmentGross ? Number(adjustmentTotal) : Number((adjustmentsBase + adjustmentsGst).toFixed(2));
  const payments = Number(paymentsTotal) || 0;

  const baseWithAdjustments = Number((base + adjustmentsBase).toFixed(2));
  const gstWithAdjustments = Number((gst + adjustmentsGst).toFixed(2));
  const grossWithAdjustments = Number((gross + adjustmentsGross).toFixed(2));
  const outstanding = Number((grossWithAdjustments - payments).toFixed(2));

  return {
    base_total: baseWithAdjustments,
    gst_total: gstWithAdjustments,
    gross_total: grossWithAdjustments,
    outstanding_including_gst: outstanding,
  };
}

export function formatGstDetails(gstRate, gstAmount, grossTotal) {
  const rate = Number(gstRate) || 0;
  const gst = Number(gstAmount) || 0;
  const gross = Number(grossTotal) || 0;
  return `GST ${rate}% • GST: ₹${gst.toLocaleString('en-IN')} • Gross: ₹${gross.toLocaleString('en-IN')}`;
}
