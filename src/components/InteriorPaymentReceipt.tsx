import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReceiptData {
  projectName: string;
  amount: number; // Total amount including GST
  paymentMethod: string;
  paymentDate: string;
  receiptNo: string;
  customerName?: string;
  customerPhone?: string;
  transactionId?: string;
  paymentStatus?: string;
  clientId?: string;
  projectId?: number;
}

export const downloadPaymentReceipt = (data: ReceiptData) => {
  const doc = new jsPDF();

  const PAGE_WIDTH = doc.internal.pageSize.width;
  const PAGE_HEIGHT = doc.internal.pageSize.height;

  // =====================
  // GST BREAKDOWN CALCULATION
  // =====================
  const totalAmount = Number(data.amount);

  // Back calculation:
  // Total = Project Amount + 9% CGST + 9% SGST
  // Total = Project Amount * 1.18
  const projectAmount = Number(
    ((totalAmount * 100) / 118).toFixed(2)
  );

  const totalGST = Number(
    (totalAmount - projectAmount).toFixed(2)
  );

  const cgst = Number((totalGST / 2).toFixed(2));
  const sgst = Number((totalGST / 2).toFixed(2));

  // =====================
  // WATERMARK
  // =====================
  doc.setFontSize(60);
  doc.setTextColor(245);
  doc.setFont("helvetica", "bold");

  doc.text("KAYAPALAT", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
    align: "center",
    angle: 30,
  });

  doc.setTextColor(0);

  // =====================
  // HEADER
  // =====================
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 90, 71);

doc.text("KAYAPALAT", PAGE_WIDTH / 2, 18, {
  align: "center",
});

doc.setFontSize(12);
doc.setFont("helvetica", "bold");

doc.text(
  "John Management Pvt. Ltd.",
  PAGE_WIDTH / 2,
  25,
  { align: "center" }
);

doc.setFontSize(11);
doc.setFont("helvetica", "normal");

doc.text(
  "Interior Design & Execution Services",
  PAGE_WIDTH / 2,
  32,
  { align: "center" }
);

doc.text(
  "1160 Chadpur Poleghat, Sonarpur, Kolkata - 700145",
  PAGE_WIDTH / 2,
  38,
  { align: "center" }
);

doc.text(
  "GSTIN: 19AAHCJ0346A1ZY",
  PAGE_WIDTH / 2,
  44,
  { align: "center" }
);
  // =====================
  // RECEIPT TITLE
  // =====================
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");

  doc.text(
    "PAYMENT RECEIPT",
    PAGE_WIDTH / 2,
    50,
    {
      align: "center",
    }
  );

  // =====================
  // RECEIPT NUMBER & DATE
  // =====================
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Receipt No: ${data.receiptNo}`, 14, 62);

  doc.text(
    `Date: ${data.paymentDate}`,
    PAGE_WIDTH - 14,
    62,
    { align: "right" }
  );

  // =====================
  // DIVIDER
  // =====================
  doc.setDrawColor(180);
  doc.line(PAGE_WIDTH / 2, 68, PAGE_WIDTH / 2, 118);

  // =====================
  // LEFT SECTION
  // =====================
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 14, 75);

  doc.setFont("helvetica", "normal");

  doc.text(
    `Payment Method: ${data.paymentMethod}`,
    14,
    85
  );

  doc.text(
    `Status: ${data.paymentStatus || "Approved"}`,
    14,
    95
  );

  doc.text(
    `Amount Received: Rs.${totalAmount.toLocaleString("en-IN")}`,
    14,
    105
  );

  if (data.transactionId) {
    doc.text(
      `Transaction ID: ${data.transactionId}`,
      14,
      115
    );
  }

  // =====================
  // RIGHT SECTION
  // =====================
  const rightX = PAGE_WIDTH / 2 + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Received From", rightX, 75);

  doc.setFont("helvetica", "normal");

  doc.text(
    data.customerName || "Customer",
    rightX,
    85
  );

  if (data.customerPhone) {
    doc.text(
      `Phone: ${data.customerPhone}`,
      rightX,
      95
    );
  }

  doc.text(
    `Project: ${data.projectName}`,
    rightX,
    105
  );

  // =====================
  // SINGLE PAYMENT BREAKDOWN TABLE
  // =====================
  autoTable(doc, {
    startY: 130,
    head: [["Description", "Amount (Rs.)"]],
    body: [
      [
        
        "Interior Project Payment",
        projectAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ],
      [
        
        "CGST @ 9%",
        cgst.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ],
      [
        
        "SGST @ 9%",
        sgst.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ],
      [
        
        "TOTAL RECEIVED",
        totalAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 90, 71],
      textColor: 255,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [41, 90, 71],
      textColor: 255,
    },
  });

  // =====================
  // FOOTER
  // =====================
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFont("helvetica", "bold");

  doc.text(
    "Received with thanks.",
    PAGE_WIDTH / 2,
    finalY,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");

  doc.text(
    "This is a system generated receipt.",
    PAGE_WIDTH / 2,
    finalY + 8,
    { align: "center" }
  );

  doc.text(
    `Generated on ${new Date().toLocaleString(
      "en-IN"
    )}`,
    PAGE_WIDTH / 2,
    finalY + 16,
    { align: "center" }
  );

  doc.save(`Receipt_${data.receiptNo}.pdf`);
};